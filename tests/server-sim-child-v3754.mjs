import { EventEmitter } from 'node:events';
import { WebSocket } from 'ws';
await import('../server.js');
const wss=globalThis.__GL_TEST_WSS__;
if(!wss) throw new Error('Test WebSocketServer was not captured.');
class ClientSocket extends WebSocket {
  constructor(){ super(); this.sent=[]; this._socket={setNoDelay(){}}; }
  send(raw){ this.sent.push(JSON.parse(String(raw))); }
  latest(type){ for(let i=this.sent.length-1;i>=0;i--) if(!type||this.sent[i]?.type===type)return this.sent[i]; return null; }
  message(obj){ this.emit('message',Buffer.from(JSON.stringify(obj))); }
}
function connect(clientId,name,{role='',seatToken=''}={}){const ws=new ClientSocket();const q=new URLSearchParams({client:clientId,name});if(role)q.set('role',role);if(seatToken)q.set('seatToken',seatToken);wss.emit('connection',ws,{url:'/ws?'+q.toString(),headers:{host:'localhost'}});return ws;}
function snap(ws){const s=ws.latest('snapshot');if(!s)throw new Error('Missing snapshot');return s;}
let p1=connect('test_p1','Alice');let p2=connect('test_p2','Bob');
let s1=snap(p1),s2=snap(p2);
if(s1.local.seat!==1||s2.local.seat!==2)throw new Error('Seat assignment failed');
if(s1.room.id!=='GRANDIS_PVP'||s2.room.id!=='GRANDIS_PVP')throw new Error('Single fixed room failed');
if(s1.spectators.length||s2.spectators.length)throw new Error('Unexpected spectator before spectator join');

// Lobby seat-control regression: both players may leave themselves; P1 may remove P2;
// P2 may remove P1 only while P1 is offline.
p1.message({type:'remove-seat',seat:1});
let seatMsg=p1.latest('seat-kicked');if(!seatMsg||seatMsg.kind!=='left')throw new Error('Player 1 self Leave Seat failed');
p1=connect('test_p1b','Alice');s1=snap(p1);if(s1.local.seat!==1)throw new Error('Player 1 seat was not released after self leave');
p1.message({type:'remove-seat',seat:2});
seatMsg=p2.latest('seat-kicked');if(!seatMsg||seatMsg.kind!=='removed')throw new Error('Player 1 could not remove Player 2');
p2=connect('test_p2b','Bob');s2=snap(p2);if(s2.local.seat!==2)throw new Error('Player 2 seat was not released after host remove');
p2.message({type:'remove-seat',seat:2});
seatMsg=p2.latest('seat-kicked');if(!seatMsg||seatMsg.kind!=='left')throw new Error('Player 2 self Leave Seat failed');
p2=connect('test_p2c','Bob');s2=snap(p2);if(s2.local.seat!==2)throw new Error('Player 2 seat was not released after self leave');
// P2 cannot remove an online P1.
p2.message({type:'remove-seat',seat:1});
const denied=p2.latest('notice');if(!denied||denied.kind!=='error'||!/offline/i.test(String(denied.message||'')))throw new Error('Player 2 online-host removal was not rejected');
if(!snap(p2).players.some(x=>Number(x.seat)===1&&x.connected!==false))throw new Error('Online Player 1 was removed by Player 2');
// Once P1 is offline, P2 may release that stale host seat.
p1.emit('close');
if(!snap(p2).players.some(x=>Number(x.seat)===1&&x.connected===false))throw new Error('Player 1 offline state did not reach Player 2');
p2.message({type:'remove-seat',seat:1});
if(snap(p2).players.some(x=>Number(x.seat)===1))throw new Error('Player 2 could not remove offline Player 1');
p1=connect('test_p1c','Alice');s1=snap(p1);s2=snap(p2);if(s1.local.seat!==1||s2.local.seat!==2)throw new Error('Seats did not recover after leave/kick regression sequence');
const decks=s1.deckOptions;if(!Array.isArray(decks)||decks.length<2)throw new Error('Starter deck options missing');
p1.message({type:'set-deck',deckKey:decks[0].key});p2.message({type:'set-deck',deckKey:decks[1].key});
p1.message({type:'ready',ready:true});p2.message({type:'ready',ready:true});
s1=snap(p1);s2=snap(p2);if(!s1.local.ready||!s2.local.ready)throw new Error('Ready state failed');
p1.message({type:'start-match'});s1=snap(p1);s2=snap(p2);if(s1.match.status!=='coin-flip'||s2.match.status!=='coin-flip')throw new Error('Coin-flip start failed');
if(!s1.match.serverBoard?.pvpPrivateStateMasked||!s2.match.serverBoard?.pvpPrivateStateMasked)throw new Error('Viewer-safe board mask missing');
p2.message({type:'choose-coin-flip',choice:'HEADS'});s1=snap(p1);s2=snap(p2);if(s1.match.status!=='coin-result')throw new Error('Coin result failed');
p1.message({type:'confirm-coin-flip'});s1=snap(p1);s2=snap(p2);if(s1.match.status!=='started'||s2.match.status!=='started')throw new Error('Match confirmation failed');
const openingEvents=s1.match.lastAnimationEvents||[];const openingEvent=openingEvents.find(x=>x?.kind==='opening_sequence');if(!openingEvent)throw new Error('Authoritative opening_sequence transport missing after match start.');if(!(openingEvent.opening_draw_events||[]).length||!(openingEvent.starting_shard_entries||[]).length)throw new Error('Opening sequence is missing Draw/Shard presentation data.');
const a1=s1.match.serverBoard?.appState,a2=s2.match.serverBoard?.appState;if(!a1?.pvpHumanVsHuman||!a2?.pvpHumanVsHuman)throw new Error('Human-vs-human runtime flag missing');
if(!Array.isArray(a1.playerHand)||a1.playerHand.length<1||!Array.isArray(a2.aiHand)||a2.aiHand.length<1)throw new Error('Seat-owned hand data missing');
if((a1.aiHand||[]).some(x=>typeof x==='string'&&!x.startsWith('__HIDDEN')))throw new Error('P1 received opponent private hand identity');
if((a2.playerHand||[]).some(x=>typeof x==='string'&&!x.startsWith('__HIDDEN')))throw new Error('P2 received opponent private hand identity');
if(!(a2.aiHand||[]).some(x=>typeof x==='string'&&!x.startsWith('__HIDDEN')))throw new Error('P2 did not receive own private hand identity before client-side seat mirroring');
const firstSeat=Number(s1.match.firstSeat||s1.match.coinFlip?.firstSeat||1),actor=firstSeat===2?p2:p1,other=firstSeat===2?p1:p2;
const sideForSeat=(seat)=>Number(seat)===2?'AI':'PLAYER';
const seatForSide=(side)=>side==='AI'?2:1;
function shardPoolCount(snapshot,seat){const st=snapshot.match.serverBoard?.appState||{};return Number(seat)===2?(st.aiManaPoolCards||[]).length:(st.playerManaPoolCards||[]).length}
function assertShardPools(snapshot,expected1,expected2,label){const a=shardPoolCount(snapshot,1),b=shardPoolCount(snapshot,2);if(a!==expected1||b!==expected2)throw new Error(label+': Shard Pools expected P1/P2 '+expected1+'/'+expected2+' but got '+a+'/'+b)}
// Each side starts with 3 Shards; only the coin-flip winner has completed its first +1 Mana Regen at match entry.
assertShardPools(snap(p1),firstSeat===1?4:3,firstSeat===2?4:3,'Opening Shard ownership');
function assertHumanDeployReady(snapshot,label){
  const st=snapshot.match.serverBoard?.appState;
  if(!st)throw new Error(label+': missing canonical app state.');
  if(st.aiControl)throw new Error(label+': AI controller became active in human-vs-human PvP.');
  if(!st.pending&&!st.responseWindow&&!st.gameOver){
    if(st.phase==='Draw')throw new Error(label+': human turn is stuck in Draw after Draw/Mana Regen completed.');
    if(st.phase!=='Deploy')throw new Error(label+': expected automatic Draw -> Deploy handoff, got '+String(st.phase));
    if(st.drawPhaseResolvedFor!=null)throw new Error(label+': drawPhaseResolvedFor was not cleared after automatic Deploy transition.');
  }
  return st;
}
let openingState=assertHumanDeployReady(snap(actor),'Opening active player');
if(openingState.turn!==sideForSeat(firstSeat))throw new Error('Opening active side does not match coin-flip winner.');
let actionN=0;
function phaseIntent(ws){
  const before=snap(ws),baseRevision=Number(before.match.serverBoardRevision||0),id='sim_phase_'+(++actionN);
  ws.message({type:'runtime-intent',intent:'advancePhase',args:[],baseRevision,clientActionId:id});
  const ack=ws.latest('intent-ack');if(!ack||ack.intent!=='advancePhase'||ack.clientActionId!==id)throw new Error('Server phase intent ACK missing for '+id);
  const after=snap(ws);if(Number(after.match.serverBoardRevision||0)<=baseRevision)throw new Error('Canonical revision did not advance for '+id);
  return after;
}
function finishCurrentTurn(ws,side,label){
  let state=snap(ws),guard=0;
  while(state.match.serverBoard?.appState?.turn===side && guard++<7) state=phaseIntent(ws);
  if(guard>7)throw new Error(label+' did not hand control to the other human player.');
  const st=state.match.serverBoard?.appState;
  if(st?.turn===side)throw new Error(label+' ownership did not change after human phase cycle.');
  assertHumanDeployReady(state,label+' -> next human');
  return state;
}
const actorSide=sideForSeat(firstSeat);
const afterFirstTurn=finishCurrentTurn(actor,actorSide,'First human turn');
assertShardPools(afterFirstTurn,4,4,'Second human Draw/Mana Regen ownership');
const secondSeat=seatForSide(afterFirstTurn.match.serverBoard.appState.turn);
if(secondSeat===firstSeat)throw new Error('First handoff did not reach the other player seat.');
const secondWs=secondSeat===1?p1:p2;
const secondSide=sideForSeat(secondSeat);
const secondStart=assertHumanDeployReady(snap(secondWs),'Second human turn start');
if(secondStart.turn!==secondSide)throw new Error('Second human did not receive turn ownership.');
const otherBefore=snap(secondWs),otherBase=Number(otherBefore.match.serverBoardRevision||0);
secondWs.message({type:'runtime-intent',intent:'advancePhase',args:[],baseRevision:otherBase,clientActionId:'sim_other_phase'});
const otherAck=secondWs.latest('intent-ack');if(!otherAck||otherAck.clientActionId!=='sim_other_phase')throw new Error('Second human player could not act after turn handoff.');
const otherAfter=snap(secondWs);if(Number(otherAfter.match.serverBoardRevision||0)<=otherBase)throw new Error('Second human action did not advance canonical revision.');
// Finish Player 2/other human as well, proving the authoritative no-AI flow works in both directions.
const afterSecondTurn=finishCurrentTurn(secondWs,secondSide,'Second human turn');
assertShardPools(afterSecondTurn,firstSeat===1?5:4,firstSeat===2?5:4,'Return-turn Shard ownership');
const returned=assertHumanDeployReady(firstSeat===1?snap(p1):snap(p2),'Return to first human');
if(returned.turn!==actorSide)throw new Error('Second handoff did not return control to the first human side.');

function runtimeIntent(ws,intent,args=[],label=intent){
  const before=snap(ws),baseRevision=Number(before.match.serverBoardRevision||0),id='sim_'+intent+'_'+(++actionN);
  ws.message({type:'runtime-intent',intent,args,baseRevision,clientActionId:id});
  const notice=ws.latest('notice');
  const ack=ws.latest('intent-ack');
  const after=snap(ws);
  return {before,after,ack:ack?.clientActionId===id?ack:null,notice:notice?.clientActionId===id?notice:null,id,baseRevision,label};
}
function ensureP2Deploy(){
  let cur=snap(p2),guard=0;
  while(cur.match.serverBoard?.appState?.turn!=='AI'&&guard++<3){
    const side=cur.match.serverBoard?.appState?.turn;
    const owner=side==='PLAYER'?p1:p2;
    cur=finishCurrentTurn(owner,side,'Advance to Player 2 turn');
  }
  const st=assertHumanDeployReady(snap(p2),'Player 2 tribute regression start');
  if(st.turn!=='AI')throw new Error('Could not reach Player 2 turn for Tribute regression.');
}
ensureP2Deploy();
// Player 2: Deploy -> Battle -> Reform.
let p2State=snap(p2);
while(p2State.match.serverBoard.appState.phase!=='Reform'){
  p2State=phaseIntent(p2);
  if(p2State.match.serverBoard.appState.turn!=='AI')throw new Error('Player 2 turn ended before reaching Reform.');
}
const p2Hand=(p2State.match.serverBoard.appState.aiHand||[]).slice();
let tributeStarted=null;
for(let i=0;i<p2Hand.length;i++){
  const attempt=runtimeIntent(p2,'beginTributeFromHand',[i],'P2 Tribute begin');
  const pending=attempt.after.match.serverBoard?.appState?.pending;
  if(attempt.ack&&pending?.type==='tribute_target'){tributeStarted={...attempt,pending,index:i};break}
}
if(!tributeStarted)throw new Error('Player 2 had no usable normal Skill for Tribute regression test.');
const lane=(tributeStarted.pending.legal_targets||[])[0];
if(!lane)throw new Error('Player 2 Tribute pending had no legal Hero target.');
const choose=runtimeIntent(p2,'chooseHeroFromBoard',['PLAYER',lane],'P2 Tribute target');
if(!choose.ack)throw new Error('Player 2 Tribute target did not receive authoritative ACK.');
const afterTribute=choose.after;
if(afterTribute.match.serverBoard?.appState?.pending)throw new Error('Player 2 Tribute left a blocking pending state.');
if(afterTribute.match.serverBoard?.appState?.phase!=='Reform')throw new Error('Player 2 Tribute unexpectedly left Reform phase.');
const nextAfterTribute=phaseIntent(p2);
if(nextAfterTribute.match.serverBoard?.appState?.phase==='Reform'&&nextAfterTribute.match.serverBoard?.appState?.turn==='AI')throw new Error('Regression: Player 2 could not leave Reform after Tribute.');

// Third link during an active match becomes a hidden-info spectator instead of being rejected.
const p3=connect('test_p3','Charlie');
const sp=snap(p3);
if(sp.local?.role!=='spectator'||sp.local?.seat!=null||sp.local?.seatToken)throw new Error('Third client did not enter read-only Spectator role.');
if(sp.match?.serverBoard?.pvpSpectatorView!=='CARD_BACKS'||sp.match?.serverBoard?.pvpObserverBothHands)throw new Error('Spectator board is not locked to CARD_BACKS.');
const sa=sp.match?.serverBoard?.appState;
if(!sp.match?.serverBoard?.pvpPrivateStateMasked)throw new Error('Spectator board is not viewer-safe.');
for(const hand of [sa.playerHand||[],sa.aiHand||[]]) if(hand.some(x=>typeof x==='string'&&!x.startsWith('__HIDDEN')))throw new Error('Spectator received a private Hand card identity.');
const snapCountBefore=p3.sent.filter(x=>x.type==='snapshot').length;
p3.message({type:'sync-request',reason:'qa'});
if(p3.sent.filter(x=>x.type==='snapshot').length<=snapCountBefore)throw new Error('Spectator sync-request did not return an authoritative snapshot.');
p3.message({type:'runtime-intent',intent:'advancePhase',args:[],baseRevision:Number(sp.match.serverBoardRevision||0),clientActionId:'spectator_illegal'});
const specNotice=p3.latest('notice');if(!specNotice||specNotice.kind!=='error'||!/read-only/i.test(String(specNotice.message||'')))throw new Error('Spectator gameplay intent was not rejected as read-only.');

// Keep the public viewer count bounded for the 256 MB deployment: four spectators are allowed,
// while a fifth spectator connection is rejected without disturbing the two player seats.
const p4=connect('test_p4','Dana'),p5=connect('test_p5','Eli'),p6=connect('test_p6','Faye');
for(const ws of [p4,p5,p6]) if(snap(ws).local?.role!=='spectator')throw new Error('Configured spectator capacity did not accept four viewers.');
const p7=connect('test_p7','Gabe');
const full=p7.latest('fatal');if(!full||!/capacity/i.test(String(full.message||'')))throw new Error('Fifth spectator was not rejected at the configured capacity.');
if(snap(p1).players.length!==2||snap(p2).players.length!==2)throw new Error('Spectator-capacity check disturbed player seats.');

console.log('v3.75.4 two-human + spectator server simulation: PASS');
const mem=process.memoryUsage(),mb=v=>Math.round((Number(v||0)/1024/1024)*10)/10;
console.log('seats=1/2, coin-flow=PASS, viewer-safe=PASS, P1<->P2 handoff=PASS, P2 tribute->next-phase=PASS, spectator-card-backs=PASS, spectator-read-only=PASS, opening-sequence=PASS, spectator-cap=4=PASS, revision='+nextAfterTribute.match.serverBoardRevision);
console.log('active-match-memoryMB rss='+mb(mem.rss)+', heapUsed='+mb(mem.heapUsed)+', heapTotal='+mb(mem.heapTotal)+', external='+mb(mem.external));
process.exit(0);
