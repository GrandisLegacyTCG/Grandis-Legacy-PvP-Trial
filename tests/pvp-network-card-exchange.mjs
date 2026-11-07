import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
const port=Number(process.env.PVP_TEST_PORT||3000);
const url=`ws://127.0.0.1:${port}/ws`;
function peer(name){
 const ws=new WebSocket(url),events=[];let waiters=[];
 ws.onmessage=e=>{const msg=JSON.parse(e.data);events.push(msg);for(const waiter of waiters.slice())if(waiter.test(msg)){waiters=waiters.filter(x=>x!==waiter);clearTimeout(waiter.timer);waiter.resolve(msg)}};
 function wait(test,limit=7000){const prior=events.findLast(test);if(prior)return Promise.resolve(prior);return new Promise((resolve,reject)=>{const item={test,resolve,timer:null};item.timer=setTimeout(()=>{waiters=waiters.filter(x=>x!==item);reject(Error(`${name} timed out: ${JSON.stringify(events.at(-1))?.slice(0,210)}`))},limit);waiters.push(item)})}
 const send=(type,extra={})=>ws.send(JSON.stringify({type,...extra}));
 return {ws,events,wait,send,latest:()=>events.filter(e=>e.type==='snapshot').at(-1),close:()=>ws.close()};
}
const both=[peer('seat1'),peer('seat2')];const [one,two]=both;
async function oneStep(who,name,args=[]){
 const base=who.latest().revision,before=who.events.length;
 who.send('intent',{intent:name,args,baseRevision:base});
 const next=await who.wait(m=>m.type==='snapshot'&&m.revision>base);
 assert.equal(next.revision,base+1,`${name} must commit exactly one revision`);
 await (who===one?two:one).wait(m=>m.type==='snapshot'&&m.revision===next.revision);
 return next;
}
try{
 await Promise.all(both.map(p=>new Promise(y=>p.ws.addEventListener('open',y,{once:true}))));
 const room='s0_card_e2e_'+process.pid;one.send('hello',{room,name:'Attacker or Defender 1'});await one.wait(m=>m.type==='snapshot'&&m.seat===1);
 two.send('hello',{room,name:'Attacker or Defender 2'});await two.wait(m=>m.type==='snapshot'&&m.seat===2);
 one.send('deck',{deckKey:'s0_starter_01_red_white'});two.send('deck',{deckKey:'s0_starter_02_blue_red'});
 await one.wait(m=>m.type==='snapshot'&&m.players.every(p=>p.hasDeck));
 one.send('ready',{ready:true});two.send('ready',{ready:true});await one.wait(m=>m.type==='snapshot'&&m.players.every(p=>p.ready));
 one.send('start');await two.wait(m=>m.type==='snapshot'&&m.status==='coin');two.send('coin',{choice:'HEADS'});
 await Promise.all(both.map(p=>p.wait(m=>m.type==='snapshot'&&m.status==='playing')));
 const first=one.latest().coin.firstSeat;
 const attackSeat=first===1?2:1,attacker=both[attackSeat-1],defender=both[first-1];
 // The first player has no Attack on the first turn (v2.9 rulebook).
 // Opening Draw is often already resolved by RC31's shared opening flow;
 // do not assume four transitions or that a fresh Draw awaits acknowledgement.
 for(let i=0;i<6;i++){
  const cur=both[first-1].latest().board.appState;
  if(cur.turn!=='PLAYER')break;
  await oneStep(both[first-1],cur.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase');
 }
 let s=attacker.latest().board.appState;
 assert.equal(s.turn,'PLAYER');
 for(let i=0;i<5&&s.phase!=='Battle';i++){
  await oneStep(attacker,s.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase');
  s=attacker.latest().board.appState;
 }
 assert.equal(s.phase,'Battle');
 let found=false,exchange=false;
 // Try the actual RC31 hand; no fixture-only injected gameplay state.
 for(let i=0;i<s.playerHand.length;i++){
  const revision=attacker.latest().revision,at=attacker.events.length;
  attacker.send('intent',{intent:'beginPlayFromHand',args:[i],baseRevision:revision});
  // Both accepted and rejected intents are followed by an authoritative snapshot.
  for(let n=0;n<60&&attacker.events.length<=at;n++)await delay(30);
  for(let n=0;n<60&&!attacker.events.slice(at).some(x=>x.type==='snapshot');n++)await delay(30);
  const next=attacker.events.slice(at).filter(x=>x.type==='snapshot').at(-1);
  if(!next||next.revision===revision)continue;
  await defender.wait(x=>x.type==='snapshot'&&x.revision===next.revision);
  found=true;break;
 }
 assert.ok(found,'No playable card from attacker natural opening Hand; retry network test if random draw has no play');
 let guard=0;
 while(attacker.latest().board.appState.pending&&guard++<12){
  const p=attacker.latest().board.appState.pending;
  if(p.type==='response_window')break;
  if(p.type==='source_selection')await oneStep(attacker,'chooseHeroFromBoard',['PLAYER',p.legal_sources[0]]);
  else if(p.type==='target_selection')await oneStep(attacker,'chooseHeroFromBoard',[p.target_side,p.legal_targets[0]]);
  else if(p.type==='mana_shard_payment_choice')await oneStep(attacker,'commitManaShardPaymentChoice');
  else if(p.type==='optional_magical_surge')await oneStep(attacker,'commitMagicalSurgeChoice',[false]);
  else break;
 }
 const response=defender.latest().board.appState.responseWindow;
 if(response?.response_owner==='PLAYER'){
  assert.equal(attacker.latest().board.appState.responseWindow?.private_masked,true);
  await oneStep(defender,'responsePassNoStuck');
  assert.equal(attacker.latest().board.appState.responseWindow,null);
  exchange=true;
 }
 console.log('PASS: real WebSocket two-player S0 card action', {firstSeat:first,attackerSeat:attackSeat,chosenCard:found,responsePassed:exchange,revision:attacker.latest().revision});
}finally{both.forEach(p=>p.close())}
