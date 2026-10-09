'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const TMP=path.join(ROOT,'.v3759-server-runtime-test.mjs');
function transformServer(){
  let s=fs.readFileSync(path.join(ROOT,'server.js'),'utf8');
  s=s.replace("import { WebSocketServer, WebSocket } from 'ws';", `class WebSocketServer { constructor(){this.handlers={};this.clients=new Set();} on(ev,fn){this.handlers[ev]=fn;} emit(ev,...args){if(this.handlers[ev])return this.handlers[ev](...args);} handleUpgrade(){} }\nconst WebSocket={OPEN:1};`);
  s=s.replace('const RUNTIME_SYNC_STATUS = verifyRuntimeSyncOrThrow(BASE);','const RUNTIME_SYNC_STATUS = {ok:true,testBypass:true};');
  const idx=s.lastIndexOf('server.listen(PORT, HOST, () => {');assert(idx>=0,'server.listen marker missing');
  s=s.slice(0,idx)+"\nexport { wss, roomState, starterDeckData, safeCustomDeck, snapshotFor, expireDisconnectedPlayers };\n";
  fs.writeFileSync(TMP,s);
}
class FakeWS{
  constructor(label){this.label=label;this.readyState=1;this.handlers={};this.sent=[];this.isAlive=true;this._socket={setNoDelay(){}};}
  on(ev,fn){this.handlers[ev]=fn;}
  send(v){this.sent.push(JSON.parse(String(v)));}
  close(){if(this.readyState===3)return;this.readyState=3;if(this.handlers.close)this.handlers.close();}
  message(obj){assert(this.handlers.message,`${this.label}: message handler missing`);this.handlers.message(JSON.stringify(obj));}
  notices(){return this.sent.filter(x=>x.type==='notice');}
  errors(){return this.notices().filter(x=>x.kind==='error');}
  lastSnapshot(){return [...this.sent].reverse().find(x=>x.type==='snapshot')||null;}
}
function connect(m,room,id,name,extra=''){const ws=new FakeWS(id);m.wss.clients.add(ws);m.wss.emit('connection',ws,{url:`/ws?room=${encodeURIComponent(room)}&client=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}${extra}`,headers:{host:'localhost'}});return ws;}
function noNewError(ws,before,label){assert.equal(ws.errors().length,before,`${label}: ${JSON.stringify(ws.errors().slice(-1)[0]||null)}`);}
function starter(ws,key='starter_01_elemental_lord_conqueror_renegade'){const e=ws.errors().length;ws.message({type:'set-deck',deckKey:key});noNewError(ws,e,'set-deck');}
function hiddenOnly(arr){return Array.isArray(arr)&&arr.every(x=>x==='__HIDDEN_CARD_BACK__');}
async function load(tag){return import('file://'+TMP+'?'+tag+'='+Date.now()+Math.random());}
function playedEmpty(board){const a=board?.appState||{};return (a.playerPlayedEvents||[]).length===0&&(a.aiPlayedEvents||[]).length===0;}
(async()=>{
  transformServer();
  try{
    // Scenario A: single lobby + complete v3.51 coin/opening flow + privacy.
    const m=await load('main');
    const p1=connect(m,'room-one','p1','ABCDEFGHIJKLMNOPQRSTUV');
    const p2=connect(m,'room-two','p2','Beta Player');
    const room=m.roomState('LOBBY');
    assert.equal(room.players.size,2,'legacy room query split the single lobby');
    assert.equal(p1.lastSnapshot().local.seat,1);assert.equal(p2.lastSnapshot().local.seat,2);
    assert.equal(p1.lastSnapshot().local.name,'ABCDEFGHIJKLMNOPQRST','Player name was not capped to 20 chars');
    starter(p1);starter(p2);
    p1.message({type:'ready',ready:true});p2.message({type:'ready',ready:true});
    assert.equal(p1.errors().length,0);assert.equal(p2.errors().length,0);
    p1.message({type:'start-match',seed:'v3759-seed'});
    assert.equal(p1.lastSnapshot().match.status,'coin-flip','v3.51 coin-flip did not start');
    assert.equal(p2.lastSnapshot().match.status,'coin-flip');
    p2.message({type:'choose-coin-flip',choice:'HEADS'});
    assert.equal(p1.lastSnapshot().match.status,'coin-result','coin result did not broadcast to both players');
    assert.equal(p2.lastSnapshot().match.status,'coin-result');
    p1.message({type:'confirm-coin-flip'});
    const s1=p1.lastSnapshot(),s2=p2.lastSnapshot();
    assert.equal(s1.match.status,'started');assert.equal(s2.match.status,'started');
    assert.equal(Number(s1.match.serverBoardRevision),Number(s2.match.serverBoardRevision),'players received different authoritative revisions');
    const events=s1.match.lastAnimationEvents||[];
    const opening=events.find(e=>e&&e.kind==='opening_sequence');
    assert(opening,'opening_sequence not published');
    assert.equal((opening.opening_draw_events||[]).length,12,'opening hand must contain 6 draws per player');
    assert.equal((opening.starting_shard_entries||[]).length,6,'starting shards must contain 3 gains per player');
    assert.equal((opening.post_opening_draw_events||[]).length,1,'first player must receive exactly one normal Draw after opening');
    assert.equal((opening.post_opening_shard_entries||[]).length,1,'first player must receive exactly one Regen Shard after opening');
    const drawSides=(opening.opening_draw_events||[]).reduce((a,e)=>(a[e.side]=(a[e.side]||0)+1,a),{});
    assert.equal(drawSides.PLAYER,6);assert.equal(drawSides.AI,6);
    const shardGroups=(opening.starting_shard_entries||[]).map(e=>`${e.side}:${Number(e.group_index)}`).sort();
    assert.deepEqual(shardGroups,['AI:0','AI:1','AI:2','PLAYER:0','PLAYER:1','PLAYER:2'],'starting shard group indices cannot support 1-by-1 interleaving');
    assert(playedEmpty(s1.match.serverBoard),'opening/draw leaked into Card Played history');
    assert(!hiddenOnly(s1.match.serverBoard.appState.playerHand),'P1 own hand masked');
    assert(hiddenOnly(s1.match.serverBoard.appState.aiHand),'P1 opponent hand leaked');
    assert(hiddenOnly(s2.match.serverBoard.appState.playerHand),'P2 opponent hand leaked');
    assert(!hiddenOnly(s2.match.serverBoard.appState.aiHand),'P2 own hand masked');

    // Scenario B: Seat 2 cannot kick online Seat 1; Seat 1 can kick Seat 2 at any lobby time.
    const k=await load('kick1');
    const k1=connect(k,'1','k1','Host'),k2=connect(k,'2','k2','Guest');const kr=k.roomState('LOBBY');
    starter(k1);starter(k2);k1.message({type:'ready',ready:true});k2.message({type:'ready',ready:true});
    const e2=k2.errors().length;k2.message({type:'kick-seat-1'});assert.equal(k2.errors().length,e2+1,'Seat 2 must not kick online Seat 1');assert.equal(kr.players.size,2);
    const e1=k1.errors().length;k1.message({type:'kick-seat-2'});noNewError(k1,e1,'seat1 kick-seat-2');assert.equal([...kr.players.values()].filter(x=>Number(x.seat)===2).length,0,'Seat 1 did not remove Seat 2');

    // Scenario C: Seat 2 may clear an offline Seat 1 reservation before match start.
    const o=await load('kick2');
    const o1=connect(o,'oldA','o1','Host'),o2=connect(o,'oldB','o2','Guest');const or=o.roomState('LOBBY');
    assert.equal(or.players.size,2);o1.close();assert.equal([...or.players.values()].find(x=>Number(x.seat)===1).connected,false);
    const oe=o2.errors().length;o2.message({type:'kick-seat-1'});noNewError(o2,oe,'offline seat1 kick');assert.equal([...or.players.values()].filter(x=>Number(x.seat)===1).length,0,'offline Seat 1 was not removable by Seat 2');

    console.log(JSON.stringify({ok:true,singleLobby:true,coinFlip:true,opening:true,openingHand:[6,6],startingShards:[3,3],firstTurnDraw:1,firstTurnShard:1,privacy:true,cardPlayedNoDrawLeak:true,kickPolicy:true,nameMax:20},null,2));
  }finally{try{fs.unlinkSync(TMP);}catch{}}
})().catch(e=>{try{fs.unlinkSync(TMP);}catch{};console.error(e);process.exit(1);});
