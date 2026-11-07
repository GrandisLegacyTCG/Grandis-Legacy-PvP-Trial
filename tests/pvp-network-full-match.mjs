/**
 * End-to-end *real WebSocket* two-seat match: lobby -> coin -> both human turns
 * -> repeated hand-limit cleanup -> ordinary mandatory Draw deck-out -> result.
 * No duplicated gameplay state machine and no AI turns.
 */
import assert from 'node:assert/strict';
const port=Number(process.env.PVP_TEST_PORT||3000), endpoint=`ws://127.0.0.1:${port}/ws`;
const room=`s0_full_${process.pid}`;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function connect(){
 const ws=new WebSocket(endpoint),client={ws,last:null,error:null};
 ws.addEventListener('message',event=>{
  let msg;try{msg=JSON.parse(event.data)}catch{return}
  if(msg.type==='snapshot')client.last=msg;
  if(msg.type==='error')client.error=msg.message;
 });
 client.send=(type,data={})=>{client.error=null;ws.send(JSON.stringify({type,...data}));};
 return client;
}
async function until(fn,label,ms=12000){const end=Date.now()+ms;while(Date.now()<end){const x=fn();if(x)return x;await delay(7)}throw Error('Timed out '+label);}
const a=connect(),b=connect();
try{
 await Promise.all([new Promise(r=>a.ws.addEventListener('open',r,{once:true})),new Promise(r=>b.ws.addEventListener('open',r,{once:true}))]);
 a.send('hello',{room,name:'Full Match A'});
 await until(()=>a.last?.seat===1,'join1');
 b.send('hello',{room,name:'Full Match B'});
 await until(()=>b.last?.seat===2,'join2');
 a.send('deck',{deckKey:a.last.deckOptions[0]});
 b.send('deck',{deckKey:b.last.deckOptions[1]});
 await until(()=>a.last?.players?.every(x=>x.hasDeck),'select decks');
 a.send('ready',{ready:true});b.send('ready',{ready:true});
 await until(()=>a.last?.players?.every(x=>x.ready),'ready');
 a.send('start');await until(()=>a.last?.status==='coin','start');
 b.send('coin',{choice:'HEADS'});
 await until(()=>a.last?.status==='playing'&&b.last?.status==='playing','coin');
 let actions=0,discardChoices=0,seat2Actions=0;
 while(a.last?.status==='playing' && actions<750){
  const aState=a.last.board.appState;
  const seat=aState.pending ? (aState.pending.private_masked || aState.pending.decision_side==='AI'?2:1) : (aState.turn==='AI'?2:1);
  const who=seat===1?a:b, st=who.last.board.appState;
  assert.equal(a.last.revision,b.last.revision,'Both player revisions must agree before an action');
  assert.ok(!st.responseWindow,'No Response window in no-card-play match');
  const baseRevision=a.last.revision;
  let intent,args=[];
  if(st.pending){
   assert.equal(st.pending.type,'hand_limit_discard','Unexpected choice in pass-only match');
   discardChoices++;
   if((st.pending.selected||[]).length<Number(st.pending.required)){
    const chosen=new Set(st.pending.selected||[]);
    const idx=st.playerHand.findIndex((_,i)=>!chosen.has(i));
    assert.ok(idx>=0,'Discard candidate must exist');
    intent='toggleDiscardIndex';args=[idx];
   }else intent='handleChoiceConfirm';
  } else intent=st.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase';
  who.send('intent',{baseRevision,intent,args});
  await until(()=>a.last?.revision===baseRevision+1&&b.last?.revision===baseRevision+1,'matching result revision '+(baseRevision+1));
  assert.equal(who.error,null,'Server rejected valid action: '+who.error);
  if(seat===2)seat2Actions++;
  actions++;
 }
 assert.ok(actions<750,'Full match did not finish');
 assert.equal(a.last.status,'finished');assert.equal(b.last.status,'finished');
 assert.equal(a.last.board.appState.gameOver,true);
 assert.equal(b.last.board.appState.gameOver,true);
 const canonical=a.last.board.appState, mirrored=b.last.board.appState;
 assert.ok(/cannot draw/i.test(canonical.gameEndReason));
 assert.ok(canonical.round>=40,'Round frozen after forced hand limit');
 assert.equal(canonical.winner==='AI'?'PLAYER':'AI',mirrored.winner,'Opposite viewer winners must mirror');
 assert.ok(String(canonical.gameEndReason).includes((canonical.winner==='AI'?'PLAYER':'AI')+' loses'));
 assert.ok(discardChoices>2&&seat2Actions>100);
 assert.ok(a.last.board.appState.aiHand.every(x=>x==='__HIDDEN_CARD_BACK__'));
 assert.ok(b.last.board.appState.aiHand.every(x=>x==='__HIDDEN_CARD_BACK__'));
 console.log('PASS: complete two-seat true-WebSocket match/lobby/coin/hand-discard/deck-out to winner', {actions,discardChoices,seat2Actions,round:canonical.round,winnerSeat:canonical.winner==='PLAYER'?1:2,reason:canonical.gameEndReason});
}finally{a.ws.close();b.ws.close()}
