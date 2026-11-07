import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const port=Number(process.env.PVP_TEST_PORT||3000);
const root=`ws://127.0.0.1:${port}/ws`;
const room='s0_extra_'+process.pid;
async function conn(){
  const ws=new WebSocket(root), log=[];
  const ready=new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true});});
  ws.addEventListener('message',e=>{try{log.push(JSON.parse(e.data))}catch{}});
  await ready;
  return {ws,log,send(type,x={}){ws.send(JSON.stringify({type,...x}))},
  async expect(check,after=0,ms=10000){const until=Date.now()+ms;while(Date.now()<until){const found=log.slice(after).find(check);if(found)return found;await new Promise(r=>setTimeout(r,20))}throw Error('Response timeout. Last: '+JSON.stringify(log.slice(-3).map(x=>({type:x.type,status:x.status,revision:x.revision,turn:x.board?.appState?.turn,phase:x.board?.appState?.phase,error:x.message}))))},close(){ws.close()}};
}
const a=await conn(),b=await conn();
try{
  a.send('hello',{room,name:'Alice'});const initA=await a.expect(x=>x.type==='snapshot'&&x.seat===1);
  b.send('hello',{room,name:'Bob'});const initB=await b.expect(x=>x.type==='snapshot'&&x.seat===2);
  const fake={version:'S1',main_deck:[]};
  a.send('custom-deck',{deck:fake});await a.expect(x=>x.type==='error'&&/deck|invalid|normaliz/i.test(x.message),a.log.length);
  const data=JSON.parse(await readFile(fileURLToPath(new URL('../client/runtime/season0-authority/DeckBuilder-v1.58-Starter-01.json',import.meta.url)),'utf8'));
  a.send('custom-deck',{deck:data});const custom=await a.expect(x=>x.type==='snapshot'&&x.players[0].hasDeck,a.log.length);
  assert.equal(custom.players[0].ready,false);
  assert.equal(custom.myDeckKey,'CUSTOM');
  const otherPrivate=await b.expect(x=>x.type==='snapshot'&&x.players[0].hasDeck,b.log.length-2);
  assert.equal(otherPrivate.myDeckKey,null,'Opponent must never see the other seat selected custom deck identifier');
  b.send('deck',{deckKey:initB.deckOptions[1]});
  await b.expect(x=>x.type==='snapshot'&&x.players[1].hasDeck,b.log.length);
  a.send('ready',{ready:true});b.send('ready',{ready:true});
  await a.expect(x=>x.type==='snapshot'&&x.players.every(z=>z.ready),a.log.length);
  a.send('start'); await a.expect(x=>x.type==='snapshot'&&x.status==='coin',a.log.length);
  b.send('coin',{choice:'TAILS'});
  let current=await a.expect(x=>x.type==='snapshot'&&x.status==='playing',a.log.length);
  let other=await b.expect(x=>x.type==='snapshot'&&x.status==='playing');
  assert.equal(current.board.pvpPrivateStateMasked,true);
  for(let i=0;i<9;i++){
    const turn=current.board.appState.turn==='PLAYER'?1:2;
    // Fetch updated seat-local perspective for actor, not last received from observer.
    const who=turn===1?a:b;
    const base=who.log.filter(x=>x.type==='snapshot'&&x.status==='playing').at(-1);
    const nA=a.log.length,nB=b.log.length;
    const action=base.board.appState.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase';
    who.send('intent',{intent:action,args:[],baseRevision:base.revision});
    const nextA=await a.expect(x=>x.type==='snapshot'&&x.revision===base.revision+1,nA);
    const nextB=await b.expect(x=>x.type==='snapshot'&&x.revision===base.revision+1,nB);
    assert.equal(nextA.board.appState.playerHand.length,nextB.board.appState.aiHand.length);
    assert.equal(nextA.board.appState.aiHand.length,nextB.board.appState.playerHand.length);
    assert.ok(nextA.board.appState.aiManaPoolCards.every(x=>x.hidden));
    assert.ok(nextB.board.appState.aiManaPoolCards.every(x=>x.hidden));
    current=nextA;other=nextB;
  }
  const nA=a.log.length,nB=b.log.length;
  a.send('intent',{intent:'executeConfirmedSurrender',baseRevision:current.revision,args:[]});
  const endedA=await a.expect(x=>x.type==='snapshot'&&x.status==='finished',nA);
  const endedB=await b.expect(x=>x.type==='snapshot'&&x.status==='finished',nB);
  assert.equal(endedA.board.appState.winner,'AI');
  assert.equal(endedB.board.appState.winner,'PLAYER');
  a.send('reset');await a.expect(x=>x.type==='snapshot'&&x.status==='lobby',a.log.length);
  console.log('PASS: custom deck reject/accept, 9 cross-seat authoritative phase transitions, view alignment, facedown opponent Mana, surrender, seat-relative result and room reset.');
}finally{a.close();b.close();}
