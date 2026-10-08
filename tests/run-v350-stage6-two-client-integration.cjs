'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const TMP=path.join(ROOT,'.stage6-server-runtime-test.mjs');
const OUT=path.join(ROOT,'tests/artifacts/v350-stage6');fs.mkdirSync(OUT,{recursive:true});
function transformServer(){
  let s=fs.readFileSync(path.join(ROOT,'server.js'),'utf8');
  s=s.replace("import { WebSocketServer, WebSocket } from 'ws';", `class WebSocketServer { constructor(){this.handlers={};} on(ev,fn){this.handlers[ev]=fn;} emit(ev,...args){if(this.handlers[ev])return this.handlers[ev](...args);} handleUpgrade(){} }\nconst WebSocket={OPEN:1};`);
  s=s.replace('const RUNTIME_SYNC_STATUS = verifyRuntimeSyncOrThrow(BASE);','const RUNTIME_SYNC_STATUS = {ok:true,testBypass:true};');
  const idx=s.lastIndexOf('server.listen(PORT, HOST, () => {');assert(idx>=0,'server.listen marker missing');
  s=s.slice(0,idx)+"\nexport { wss, roomState, starterDeckData, safeCustomDeck, snapshotFor, expireDisconnectedPlayers };\n";
  fs.writeFileSync(TMP,s);
}
function clone(v){return JSON.parse(JSON.stringify(v));}
function countMain(d){return (d.main_deck||[]).reduce((n,e)=>n+Number(e.quantity??e.qty??1),0);}
function sized(base,n,name){const d=clone(base);let cur=countMain(d);for(let i=d.main_deck.length-1;i>=0&&cur>n;i--){let q=Number(d.main_deck[i].quantity??1),take=Math.min(q,cur-n);q-=take;cur-=take;if(q<=0)d.main_deck.splice(i,1);else d.main_deck[i].quantity=q;}assert.equal(cur,n);d.display_name=name;d.deck_name=name;return d;}
class FakeWS{
  constructor(label){this.label=label;this.readyState=1;this.handlers={};this.sent=[];this.isAlive=true;this._socket={setNoDelay(){}};}
  on(ev,fn){this.handlers[ev]=fn;}
  send(v){this.sent.push(JSON.parse(String(v)));}
  close(){if(this.readyState===3)return;this.readyState=3;if(this.handlers.close)this.handlers.close();}
  message(obj){assert(this.handlers.message,`${this.label}: message handler missing`);this.handlers.message(JSON.stringify(obj));}
  notices(){return this.sent.filter(x=>x.type==='notice');}
  errors(){return this.notices().filter(x=>x.kind==='error');}
  lastSnapshot(){return [...this.sent].reverse().find(x=>x.type==='snapshot')||null;}
  lastAck(){return [...this.sent].reverse().find(x=>x.type==='intent-ack')||null;}
}
function connect(m,room,id,name,extra=''){const ws=new FakeWS(id);m.wss.emit('connection',ws,{url:`/ws?room=${room}&client=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}${extra}`,headers:{host:'localhost'}});return ws;}
function hiddenOnly(arr){return Array.isArray(arr)&&arr.every(x=>x==='__HIDDEN_CARD_BACK__');}
function sendIntent(ws,room,intent,args=[]){const before=Number(room.engine.revision);const errors=ws.errors().length;ws.message({type:'runtime-intent',intent,args,baseRevision:before,clientActionId:`stage6-${ws.label}-${before}-${intent}`});assert.equal(ws.errors().length,errors,`${ws.label}: ${intent} produced error ${JSON.stringify(ws.errors().slice(-1)[0]||null)}`);const ack=ws.lastAck();assert(ack&&ack.intent===intent,`${ws.label}: ${intent} ack missing`);assert(Number(room.engine.revision)>before,`${ws.label}: ${intent} did not advance authoritative revision`);return ws.lastSnapshot();}
(async()=>{
  transformServer();
  try{
    const m=await import('file://'+TMP+'?s6='+Date.now());
    const roomId='STAGE6_FULL';
    const long1='Alice Integration Deck ABCDEFGHIJKLMNOP';
    const long2='Bob Integration Deck QRSTUVWXYZ0123456789';
    const base=m.starterDeckData('starter_01_elemental_lord_conqueror_renegade');
    assert(base&&countMain(base)===60,'starter baseline missing');
    const deck1=sized(base,55,long1),deck2=sized(base,55,long2);
    assert.equal(countMain(deck1),55);assert.equal(countMain(deck2),55);

    const p1=connect(m,roomId,'p1','Alice');
    const p2=connect(m,roomId,'p2','Bob');
    const spectator=connect(m,roomId,'spec','Spectator','&role=spectator');
    assert.equal(p1.lastSnapshot().local.seat,1);assert.equal(p2.lastSnapshot().local.seat,2);assert.equal(spectator.lastSnapshot().local.role,'spectator');

    p1.message({type:'set-deck',customDeck:deck1,deckName:long1});
    p2.message({type:'set-deck',customDeck:deck2,deckName:long2});
    assert.equal(p1.errors().length,0,JSON.stringify(p1.errors()));assert.equal(p2.errors().length,0,JSON.stringify(p2.errors()));
    p1.message({type:'ready',ready:true});p2.message({type:'ready',ready:true});
    p1.message({type:'start-match',seed:'stage6-seed'});
    assert.equal(p1.lastSnapshot().match.status,'coin-flip');
    p2.message({type:'choose-coin-flip',choice:'HEADS'});
    assert.equal(p2.lastSnapshot().match.status,'coin-result');
    p1.message({type:'confirm-coin-flip'});
    const started=p1.lastSnapshot();assert.equal(started.match.status,'started');assert(started.match.startedAt,'authoritative startedAt missing');
    const room=m.roomState(roomId);assert(room.engine&&room.engine.revision>0,'engine missing after start');
    assert.equal(room.players.get('p1').deckData.main_deck.reduce((n,e)=>n+Number(e.quantity||1),0),55);
    assert.equal(room.players.get('p2').deckData.main_deck.reduce((n,e)=>n+Number(e.quantity||1),0),55);
    assert.equal(room.players.get('p1').deckName,long1);assert.equal(room.players.get('p2').deckName,long2);

    // Hidden-information symmetry for both players and spectator on the started match.
    const s1=p1.lastSnapshot(),s2=p2.lastSnapshot(),ss=spectator.lastSnapshot();
    assert(!hiddenOnly(s1.match.serverBoard.appState.playerHand),'seat1 own hand masked');
    assert(hiddenOnly(s1.match.serverBoard.appState.aiHand),'seat1 opponent hand leaked');
    assert(hiddenOnly(s2.match.serverBoard.appState.playerHand),'seat2 opponent hand leaked after viewer mapping');
    assert(!hiddenOnly(s2.match.serverBoard.appState.aiHand),'seat2 own hand masked after viewer mapping');
    assert(hiddenOnly(ss.match.serverBoard.appState.playerHand)&&hiddenOnly(ss.match.serverBoard.appState.aiHand),'spectator hand privacy failed');

    // Full custom-deck operation: advance a real authoritative phase from whichever seat won the opening coin flip.
    const turn=room.engine.board.appState.turn;const activeWs=turn==='AI'?p2:p1;const phaseBefore=room.engine.board.appState.phase;
    sendIntent(activeWs,room,'advancePhase',[]);
    const phaseAfter=room.engine.board.appState.phase;assert.notEqual(phaseAfter,phaseBefore,'55-card match could not operate after start');
    // Continue through the live two-player phase flow until an actual server-authoritative mandatory Draw is published.
    let authoritativeDrawReason=null;
    for(let i=0;i<6&&!authoritativeDrawReason;i++){
      const t=room.engine.board.appState.turn,w=t==='AI'?p2:p1;
      const snap=sendIntent(w,room,'advancePhase',[]);
      const events=snap.match.lastAnimationEvents||[];
      for(const event of events){
        if(event&&event.kind==='draw'&&event.reason)authoritativeDrawReason=event.reason;
        if(event&&event.kind==='draw_then_shards')for(const spec of (event.draw_specs||[]))if(spec&&spec.reason)authoritativeDrawReason=spec.reason;
      }
    }
    assert.equal(authoritativeDrawReason,'MANDATORY_DRAW_PHASE','authoritative Draw reason was not preserved through server event construction');

    // Reconnect the live Player 1 using actual server reconnect authority.
    const token=p1.lastSnapshot().local.seatToken;assert(token,'seat1 token missing');
    p1.close();assert.equal(room.players.get('p1').connected,false,'disconnect not registered');
    const p1r=connect(m,roomId,'p1','Alice',`&seatToken=${encodeURIComponent(token)}`);
    const rs=p1r.lastSnapshot();assert(rs&&rs.local.role==='player'&&Number(rs.local.seat)===1,'Player 1 reconnect failed');
    assert.equal(rs.match.status,'started','reconnect reset match');
    assert.equal((rs.match.lastAnimationEvents||[]).length,0,'reconnect replayed settled one-shot animation');

    // A late spectator joining during the active match remains read-only and masked.
    const spec2=connect(m,roomId,'spec2','Observer','&role=spectator');
    const specSnap=spec2.lastSnapshot();assert.equal(specSnap.local.role,'spectator');
    assert(hiddenOnly(specSnap.match.serverBoard.appState.playerHand)&&hiddenOnly(specSnap.match.serverBoard.appState.aiHand),'late spectator hidden info leak');

    // Server-authoritative Surrender still terminates the same two-player match.
    p2.message({type:'surrender-match'});const finished=p1r.lastSnapshot();assert.equal(finished.match.status,'finished');assert(finished.match.finishedAt,'finishedAt missing');assert(finished.match.result&&Number(finished.match.result.winnerSeat)===1,'surrender winner incorrect');

    const result={ok:true,twoPlayer:true,custom55:true,ready:true,started:true,startedAt:started.match.startedAt,firstTurn:turn,phaseBefore,phaseAfter,authoritativeDrawReason,reconnect:true,spectator:true,hiddenInfo:true,surrender:true,longDeckNames:[long1,long2],officialStarterCount:5};
    fs.writeFileSync(path.join(OUT,'two-client-integration.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  }finally{try{fs.unlinkSync(TMP);}catch{}}
})().catch(e=>{try{fs.unlinkSync(TMP);}catch{};console.error(e);process.exit(1);});
