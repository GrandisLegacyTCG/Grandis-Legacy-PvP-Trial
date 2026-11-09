import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync('public/battle/runtime/pvp-network.js','utf8');
const buildId='gl-s0-pvp-rc36p8-mobile-response-hotfix2-2026-11-09';
const packets=[],paint=[],timers=[],sockets=[];
let imported=null,importCount=0,nowMs=10000;
class Sock{
 static OPEN=1;
 constructor(){this.readyState=0;sockets.push(this)}
 send(raw){packets.push(JSON.parse(raw))}
 open(){this.readyState=1;this.onopen?.()}
 receive(x){this.onmessage?.({data:JSON.stringify(x)})}
}
const doc={readyState:'complete',visibilityState:'visible',body:{appendChild(){}},addEventListener(){},getElementById(){return null},querySelector(){return{classList:{remove(){}}}},createElement(){return{style:{},setAttribute(){},hidden:false}}};
const board=(rev,withResponse=false)=>({pvpPrivateStateMasked:true,pvpRecipientSeat:1,appState:{
 phase:'Battle',turn:withResponse?'AI':'PLAYER',pending:withResponse?{type:'response_window',decision_side:'UNKNOWN',private_masked:true}:null,
 responseWindow:withResponse?{response_owner:'PLAYER',response_window_token:'response-'+rev,options:[]}:null
}});
const snapshot=(rev,response=false)=>({type:'snapshot',forceImport:rev===2,local:{seat:1,role:'player',name:'Test'},players:[{seat:1,name:'Test'},{seat:2,name:'Opponent'}],match:{status:'started',revision:rev,board:board(rev,response)}});
const bridge={getSnapshot:()=>imported,importSnapshot(b){imported=b;importCount++;return true},applyServerIntent(){throw Error('No local engine mutation should run for Response PASS')}};
const ctx={Math,Date,JSON,URL,URLSearchParams,console,WebSocket:Sock,document:doc,
 location:{host:'unit.invalid',protocol:'https:',search:'',replace(){throw Error('unexpected redirect')}},
 performance:{now:()=>nowMs},crypto:{randomUUID:()=> 'qa-net-rc6'},
 sessionStorage:{getItem:k=>k.includes('client_id')?'qa-net-seat1':k.includes('role')?'player':'seat-token'},
 localStorage:{getItem:()=>null},
 setTimeout(){return 1},clearTimeout(){},setInterval(fn,interval){timers.push({fn,interval});return timers.length},clearInterval(){},
 requestAnimationFrame(fn){paint.push(fn);return paint.length},
 CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}},dispatchEvent(){},
 GL_PVP_BUILD_META:{buildId},GL_LOCAL_AI_BRIDGE:bridge,GL_GAME_ENGINE:{getManaPlan:()=>null},GL_AUTHORITY_ADAPTER:{register(){},use(){}},
 GL_GAME_UI:{render(){},openingBusy:()=>false}};
ctx.window=ctx;ctx.globalThis=ctx;
vm.runInNewContext(src,ctx,{filename:'pvp-network.js'});
const ws=sockets[0];assert.ok(ws);ws.open();
assert.equal(packets.length,0,'Handshake must not send redundant resync');
ws.receive(snapshot(2));assert.equal(importCount,1,'One handshake snapshot performs one import');
ws.receive({...snapshot(2),forceImport:false});assert.equal(importCount,1,'Duplicate revision does not re-import');
const heart=timers.find(t=>t.interval===8000);assert.ok(heart,'RTT heartbeat must be 8 seconds');
heart.fn();const ping=packets.findLast(p=>p.type==='ping');assert.ok(ping);assert.ok(Number.isFinite(ping.clientTime));
ws.receive({type:'pong',clientTime:Date.now()-28,connections:[]});
assert.ok(ctx.GL_S0_PVP_NETWORK.state.rttMs>=20&&ctx.GL_S0_PVP_NETWORK.state.rttMs<2000,'RTT computed from actual pong');
nowMs+=5;ws.receive(snapshot(3,true));
assert.equal(importCount,2);while(paint.length)paint.shift()();
assert.ok(ctx.GL_S0_PVP_NETWORK.performanceSamples.some(p=>p.type==='response-visible'&&p.revision===3),'Real response visibility measured after presentation paint');
const before=packets.length;
const r=ctx.GL_S0_PVP_NETWORK.sendIntent('responsePassNoStuck',[]);
assert.equal(r.ok,true,'Masked pending allows rightful Response owner');
assert.equal(packets.length,before+1,'One Response PASS = one server request');
const request=packets.at(-1);assert.equal(request.intent,'responsePassNoStuck');
assert.equal(ctx.GL_S0_PVP_NETWORK.state.inflight,true);
ws.receive({type:'intent-result',clientActionId:request.clientActionId,ok:true,serverActionMs:3.3,snapshot:snapshot(4,false)});
assert.equal(ctx.GL_S0_PVP_NETWORK.state.inflight,false);
assert.equal(ctx.GL_S0_PVP_NETWORK.state.revision,4);
assert.equal(packets.filter(p=>p.type==='resync').length,0,'Healthy handshake / Response must not create an extra resync');
console.log('PASS NET RC6: 1 handshake snapshot, no extra resync, RTT pong, response-to-paint, direct PASS/ACK');
