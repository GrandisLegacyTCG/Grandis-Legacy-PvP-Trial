import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {Season0HeadlessAuthority} from '../server/headless-rc32.mjs';
import {season0StarterCatalog as starters} from '../server/s0-pregame-catalog.mjs';
import {viewerSafeBoard} from '../server/viewer-safe.mjs';

// End-to-end authority -> public viewer-safe snapshot -> PRODUCTION browser
// dispatch -> runtime-intent packet -> authority -> snapshot again. The RC2
// regression tested the server alone, and missed a browser-only deadlock.
const root=join(process.cwd(),'public/battle');
const code=readFileSync('public/battle/runtime/pvp-network.js','utf8');
const deckRW=starters.s0_starter_01_red_white.deck,deckBR=starters.s0_starter_02_blue_red.deck;
const safe=(authority,seat)=>viewerSafeBoard(authority._viewForMaskingOnly(seat),{seat,revision:authority.revision,secret:Buffer.alloc(32,3)});
function findAttack(attackerSeat){
 for(let trial=0;trial<60;trial++){
  const authority=new Season0HeadlessAuthority(root);
  const p1=attackerSeat===1?deckBR:deckRW,p2=attackerSeat===2?deckBR:deckRW;
  authority.start({player1Deck:p1,player2Deck:p2});
  authority.completeOpening(attackerSeat===1?2:1,'HEADS');
  let reached=false;
  for(let i=0;i<18;i++){
   const st=authority._canonicalForServerOnly().appState;
   if(st.turn===(attackerSeat===1?'PLAYER':'AI')&&st.phase==='Battle'){reached=true;break}
   try{authority.applyIntent(st.turn==='PLAYER'?1:2,'advancePhase',[])}catch{break}
  }
  if(!reached)continue;
  let p=authority._viewForMaskingOnly(attackerSeat).appState;
  const idx=p.playerHand.indexOf('S0-MAG-007');if(idx<0)continue;
  try{
   authority.applyIntent(attackerSeat,'beginPlayFromHand',[idx]);
   let x=authority._viewForMaskingOnly(attackerSeat).appState.pending;
   if(x?.type!=='source_selection'||!x.legal_sources?.length)continue;
   authority.applyIntent(attackerSeat,'chooseHeroFromBoard',['PLAYER',x.legal_sources[0]]);
   x=authority._viewForMaskingOnly(attackerSeat).appState.pending;
   if(x?.type!=='target_selection'||!x.legal_targets?.length)continue;
   authority.applyIntent(attackerSeat,'chooseHeroFromBoard',['AI',x.legal_targets[0]]);
   x=authority._viewForMaskingOnly(attackerSeat).appState.pending;
   if(x?.type!=='mana_shard_payment_choice'||!x.selected_shard_uids?.length)continue;
   authority.applyIntent(attackerSeat,'commitExactManaPaymentChoice',[x.selected_shard_uids,false,null]);
   const defenderSeat=attackerSeat===1?2:1,view=safe(authority,defenderSeat);
   if(view.appState.responseWindow?.response_owner==='PLAYER')return {authority,view,defenderSeat,attackerSeat,trial};
  }catch{}
 }
 throw new Error('Could not reach a valid Attack/Response state for seat '+attackerSeat);
}
function browserSession(authority,defenderSeat){
 const events=[],messages=[],uiRenders=[];let socket;
 let imported=safe(authority,defenderSeat);const domElements=new Map();
 class Socket{
  static OPEN=1;
  constructor(){socket=this;this.readyState=0}
  send(raw){messages.push(JSON.parse(raw))}
  receive(packet){this.onmessage?.({data:JSON.stringify(packet)})}
  open(){this.readyState=1;this.onopen?.()}
 }
 const doc={readyState:'complete',body:{appendChild:el=>domElements.set(el.id,el)},visibilityState:'visible',
  addEventListener(){},getElementById:id=>domElements.get(id)||null,
  createElement(){return {id:'',style:{},hidden:false,textContent:'',setAttribute(){}}},
  querySelector(){return {classList:{remove(){}}}}};
 const bridge={getSnapshot:()=>imported,importSnapshot(x){imported=x;return true},applyServerIntent(){return{ok:true}}};
 const globals={Math,Date,JSON,console,URL,URLSearchParams,document:doc,WebSocket:Socket,
  location:{protocol:'https:',host:'unit.invalid',search:'',replace(){throw Error('unexpected route')}},
  crypto:{randomUUID:()=>`unit-doc-${defenderSeat}`},
  sessionStorage:{getItem:key=>key.includes('client_id')?`browser-seat${defenderSeat}`:key.includes('role')?'player':'seat-token'},
  localStorage:{getItem:()=>`Seat ${defenderSeat}`},
  CustomEvent:class{constructor(type,detail){this.type=type;this.detail=detail?.detail}},
  dispatchEvent:e=>events.push(e),setTimeout(){return 1},clearTimeout(){},setInterval(){return 2},clearInterval(){},
  GL_PVP_BUILD_META:{buildId:'test-build'},GL_LOCAL_AI_BRIDGE:bridge,GL_GAME_ENGINE:{getManaPlan:()=>null},
  GL_AUTHORITY_ADAPTER:{register(){},use(){}},GL_GAME_UI:{openingBusy:()=>false,render(){uiRenders.push('render')}}};
 globals.window=globals;globals.globalThis=globals;
 vm.runInNewContext(code,globals,{filename:'production-pvp-network.js'});
 socket.open(); // client asks resync
 const expected={type:'snapshot',match:{status:'started',revision:authority.revision,board:safe(authority,defenderSeat)},
  local:{role:'player',seat:defenderSeat}};
 socket.receive(expected);
 return {globals,socket,events,messages,uiRenders,domElements,expected};
}
for(const attackerSeat of [1,2]){
 const {authority,view,defenderSeat,trial}=findAttack(attackerSeat);
 assert.equal(view.appState.pending?.type,'response_window');
 assert.equal(view.appState.pending?.decision_side,'UNKNOWN');
 assert.equal(view.appState.responseWindow?.response_owner,'PLAYER');
 const c=browserSession(authority,defenderSeat),send=c.globals.GL_S0_PVP_NETWORK.sendIntent;
 const before=c.messages.length;
 assert.equal(send('responsePassNoStuck',[]).ok,true,'Browser must allow PASS for defender, despite masked pending');
 const packet=c.messages.at(-1);
 assert.equal(c.messages.length,before+1);
 assert.equal(packet.type,'runtime-intent');assert.equal(packet.intent,'responsePassNoStuck');
 const oldRev=authority.revision;
 authority.applyIntent(defenderSeat,packet.intent,packet.args);
 assert.ok(authority.revision>oldRev);
 c.socket.receive({type:'intent-result',ok:true,clientActionId:packet.clientActionId,
  snapshot:{type:'snapshot',match:{status:'started',revision:authority.revision,board:safe(authority,defenderSeat)},local:{role:'player',seat:defenderSeat}}});
 assert.equal(c.globals.GL_S0_PVP_NETWORK.state.inflight,false);
 assert.equal(c.globals.GL_S0_PVP_NETWORK.state.revision,authority.revision);
 assert.equal(authority._viewForMaskingOnly(defenderSeat).appState.responseWindow,null);
 assert.equal(c.globals.GL_S0_PVP_NETWORK.performanceSamples.at(-1).intent,'responsePassNoStuck');
 // Reject true opponent decisions and publish explicit user-visible feedback.
 const fakeBoard={...view,appState:{...view.appState,responseWindow:{response_owner:'AI'},pending:{type:'response_window',decision_side:'UNKNOWN',private_masked:true}}};
 c.socket.receive({type:'snapshot',match:{status:'started',revision:authority.revision+1,board:fakeBoard},local:{role:'player',seat:defenderSeat}});
 const bad=send('responsePassNoStuck',[]);
 assert.equal(bad.ok,false);assert.match(bad.error,/Opponent/i);
 assert.equal(c.messages.length,before+1,'Blocked command must not reach server');
 assert.ok(c.events.some(e=>e.type==='gl-pvp-intent-error'),'Denied action must emit visible error event');
 assert.match(c.domElements.get('glPvpActionToast')?.textContent||'',/Opponent/i);
 console.log(`PASS RC3 real viewer-safe -> browser PASS -> authority -> ack (attacker=${attackerSeat}, defender=${defenderSeat}, search=${trial+1})`);
}
