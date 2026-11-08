import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('public/battle/runtime/pvp-network.js','utf8');
const timers=new Map(),sockets=[],sent=[],events=[];
let timerSeq=0,bridgeSnap=null;
class FakeSocket{
 static OPEN=1;
 constructor(url){this.url=url;this.readyState=0;sockets.push(this)}
 send(raw){sent.push(JSON.parse(raw))}
 open(){this.readyState=1;this.onopen?.()}
 receive(v){this.onmessage?.({data:JSON.stringify(v)})}
 close(){this.readyState=3}
}
const doc={readyState:'complete',visibilityState:'visible',body:{appendChild(){}},addEventListener(){},getElementById(){return null},createElement(){return{style:{},hidden:false,textContent:''}},querySelector(){return{classList:{remove(){}}}}};
const board=(turn='PLAYER',phase='Deploy')=>({pvpPrivateStateMasked:true,pvpRecipientSeat:1,appState:{turn,phase,pending:null,responseWindow:null}});
const snapshot=(rev,turn='PLAYER',phase='Deploy',status='started')=>({type:'snapshot',local:{role:'player',seat:1},match:{status,revision:rev,board:board(turn,phase)}});
const bridge={getSnapshot:()=>bridgeSnap,importSnapshot(b){bridgeSnap=b;return true},applyServerIntent(){return{ok:true}}};
const ui={openingBusy:()=>false,render(){}};
const globals={console,Math,Date,JSON,URL,URLSearchParams,WebSocket:FakeSocket,document:doc,
 location:{protocol:'https:',host:'test.invalid',replace(){throw Error('Unexpected redirect')}},
 crypto:{randomUUID:()=> 'qa-doc-nonce'},sessionStorage:{getItem:key=>key.includes('client_id')?'qa-ack-p1':key.includes('role')?'player':'abc-token'},
 localStorage:{getItem:()=> 'QA Player'},
 CustomEvent:class {constructor(type,x){this.type=type;this.detail=x.detail}},
 dispatchEvent(e){events.push(e)},setTimeout(fn,ms){const id=++timerSeq;timers.set(id,{fn,ms});return id},
 clearTimeout(id){timers.delete(id)},setInterval(){return 1},clearInterval(){},
 GL_PVP_BUILD_META:{buildId:'qa-build'},GL_LOCAL_AI_BRIDGE:bridge,GL_GAME_ENGINE:{getManaPlan:()=>null},
 GL_AUTHORITY_ADAPTER:{register(){},use(){}},GL_GAME_UI:ui};
globals.window=globals;globals.globalThis=globals;vm.runInNewContext(source,globals,{filename:'pvp-network.js'});
const ws=sockets[0];assert.ok(ws);ws.open();
ws.receive(snapshot(3));
const action=globals.GL_S0_PVP_NETWORK.sendIntent;
assert.equal(action('advancePhase').ok,true);
const id1=sent.at(-1).clientActionId;assert.ok(id1);
const action1Timeout=[...timers.values()].find(t=>t.ms===9000);
assert.ok(action1Timeout);action1Timeout.fn();
assert.equal(globals.GL_S0_PVP_NETWORK.state.inflight,false);
assert.equal(action('advancePhase').ok,true);
const id2=sent.at(-1).clientActionId;assert.notEqual(id1,id2);
ws.receive({type:'intent-result',clientActionId:id1,ok:true,revision:4,snapshot:snapshot(3)});
assert.equal(globals.GL_S0_PVP_NETWORK.state.inflight,true,'Late first ACK cannot unblock second intent');
assert.equal(globals.GL_S0_PVP_NETWORK.state.inflightActionId,id2,'Action ownership must remain second ID');
ws.receive({type:'error',message:'Delayed non-intent notification'});
assert.equal(globals.GL_S0_PVP_NETWORK.state.inflight,true,'Unrelated error cannot finish an action');
ws.receive({type:'intent-result',clientActionId:id2,ok:true,revision:4,snapshot:snapshot(4,'PLAYER','Battle')});
assert.equal(globals.GL_S0_PVP_NETWORK.state.inflight,false);
assert.equal(globals.GL_S0_PVP_NETWORK.state.revision,4);
// An opponent pending decision + opening visual gate must not trap surrender.
ws.receive(snapshot(5,'AI','Battle'));
ui.openingBusy=()=>true;
assert.equal(action('executeConfirmedSurrender').ok,true);
const concede=sent.at(-1);assert.equal(concede.intent,'executeConfirmedSurrender');
const id3=concede.clientActionId;
assert.equal(globals.GL_S0_PVP_NETWORK.state.inflightActionId,id3);
ws.receive({type:'intent-result',clientActionId:id3,ok:true,revision:6,snapshot:snapshot(6,'AI','Battle','finished')});
assert.equal(globals.GL_S0_PVP_NETWORK.state.inflight,false);
console.log('PASS DL-04/DL-06: stale ACK, unrelated error, timeout, second-action ownership, surrender during opponent turn/opening');
