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
let actionN=0;
function phaseIntent(ws){
  const before=snap(ws),baseRevision=Number(before.match.serverBoardRevision||0),id='sim_phase_'+(++actionN);
  ws.message({type:'runtime-intent',intent:'advancePhase',args:[],baseRevision,clientActionId:id});
  const ack=ws.latest('intent-ack');if(!ack||ack.intent!=='advancePhase'||ack.clientActionId!==id)throw new Error('Server phase intent ACK missing for '+id);
  const after=snap(ws);if(Number(after.match.serverBoardRevision||0)<=baseRevision)throw new Error('Canonical revision did not advance for '+id);
  return after;
}
let actorState=snap(actor),actorSide=sideForSeat(firstSeat),guard=0;
while(actorState.match.serverBoard?.appState?.turn===actorSide && guard++<7) actorState=phaseIntent(actor);
if(guard>7)throw new Error('First human turn did not hand control to the other player.');
const canonicalAfterTurn=actorState.match.serverBoard?.appState;if(canonicalAfterTurn?.turn===actorSide)throw new Error('Turn ownership did not change after human phase cycle.');
if(canonicalAfterTurn?.aiControl)throw new Error('AI controller became active during human-vs-human turn handoff.');
const otherBefore=snap(other),otherBase=Number(otherBefore.match.serverBoardRevision||0);
other.message({type:'runtime-intent',intent:'advancePhase',args:[],baseRevision:otherBase,clientActionId:'sim_other_phase'});
const otherAck=other.latest('intent-ack');if(!otherAck||otherAck.clientActionId!=='sim_other_phase')throw new Error('Second human player could not act after turn handoff.');
const otherAfter=snap(other);if(Number(otherAfter.match.serverBoardRevision||0)<=otherBase)throw new Error('Second human action did not advance canonical revision.');
const p3=connect('test_p3','Charlie'),fatal=p3.latest('fatal');if(!fatal||!/exactly 2 player seats|full/i.test(String(fatal.message||'')))throw new Error('Third client was not rejected from the two-player room.');
console.log('two-human single-room server simulation: PASS');
console.log('seats=1/2, coin-flow=PASS, viewer-safe=PASS, human-turn-handoff=PASS, second-human-action=PASS, no-spectator-capacity=PASS, revision='+otherAfter.match.serverBoardRevision);
process.exit(0);
