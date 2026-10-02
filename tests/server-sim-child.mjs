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
function connect(clientId,name){const ws=new ClientSocket();wss.emit('connection',ws,{url:'/ws?client='+encodeURIComponent(clientId)+'&name='+encodeURIComponent(name),headers:{host:'localhost'}});return ws;}
function snap(ws){const s=ws.latest('snapshot');if(!s)throw new Error('Missing snapshot');return s;}
const p1=connect('test_p1','Alice');const p2=connect('test_p2','Bob');
let s1=snap(p1),s2=snap(p2);
if(s1.local.seat!==1||s2.local.seat!==2)throw new Error('Seat assignment failed');
if(s1.room.id!=='GRANDIS_PVP'||s2.room.id!=='GRANDIS_PVP')throw new Error('Single fixed room failed');
if(s1.spectators.length||s2.spectators.length)throw new Error('Spectators must be disabled');
const decks=s1.deckOptions;if(!Array.isArray(decks)||decks.length<2)throw new Error('Starter deck options missing');
p1.message({type:'set-deck',deckKey:decks[0].key});p2.message({type:'set-deck',deckKey:decks[1].key});
p1.message({type:'ready',ready:true});p2.message({type:'ready',ready:true});
s1=snap(p1);s2=snap(p2);if(!s1.local.ready||!s2.local.ready)throw new Error('Ready state failed');
p1.message({type:'start-match'});s1=snap(p1);s2=snap(p2);if(s1.match.status!=='coin-flip'||s2.match.status!=='coin-flip')throw new Error('Coin-flip start failed');
if(!s1.match.serverBoard?.pvpPrivateStateMasked||!s2.match.serverBoard?.pvpPrivateStateMasked)throw new Error('Viewer-safe board mask missing');
p2.message({type:'choose-coin-flip',choice:'HEADS'});s1=snap(p1);s2=snap(p2);if(s1.match.status!=='coin-result')throw new Error('Coin result failed');
p1.message({type:'confirm-coin-flip'});s1=snap(p1);s2=snap(p2);if(s1.match.status!=='started'||s2.match.status!=='started')throw new Error('Match confirmation failed');
const a1=s1.match.serverBoard?.appState,a2=s2.match.serverBoard?.appState;if(!a1?.pvpHumanVsHuman||!a2?.pvpHumanVsHuman)throw new Error('Human-vs-human runtime flag missing');
if(!Array.isArray(a1.playerHand)||a1.playerHand.length<1||!Array.isArray(a2.aiHand)||a2.aiHand.length<1)throw new Error('Seat-owned hand data missing');
if((a1.aiHand||[]).some(x=>typeof x==='string'&&!x.startsWith('__HIDDEN')))throw new Error('P1 received opponent private hand identity');
if((a2.playerHand||[]).some(x=>typeof x==='string'&&!x.startsWith('__HIDDEN')))throw new Error('P2 received opponent private hand identity');
if(!(a2.aiHand||[]).some(x=>typeof x==='string'&&!x.startsWith('__HIDDEN')))throw new Error('P2 did not receive own private hand identity before client-side seat mirroring');
const firstSeat=Number(s1.match.firstSeat||s1.match.coinFlip?.firstSeat||1),actor=firstSeat===2?p2:p1,other=firstSeat===2?p1:p2;
const sideForSeat=(seat)=>Number(seat)===2?'AI':'PLAYER';
const seatForSide=(side)=>side==='AI'?2:1;
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
const returned=assertHumanDeployReady(firstSeat===1?snap(p1):snap(p2),'Return to first human');
if(returned.turn!==actorSide)throw new Error('Second handoff did not return control to the first human side.');
const p3=connect('test_p3','Charlie'),fatal=p3.latest('fatal');if(!fatal||!/exactly 2 player seats|full/i.test(String(fatal.message||'')))throw new Error('Third client was not rejected from the two-player room.');
console.log('two-human single-room server simulation: PASS');
console.log('seats=1/2, coin-flow=PASS, viewer-safe=PASS, P1<->P2 deploy-handoff=PASS, AI-controller=OFF, second-human-action=PASS, no-spectator-capacity=PASS, revision='+afterSecondTurn.match.serverBoardRevision);
process.exit(0);
