import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('public/battle/runtime/pvp-network.js','utf8');
const BUILD_ID='gl-s0-pvp-rc36p4-net-rc6s2-ui-hotfix1-2026-11-09';
const sent=[];let listener=null,imports=0,board=null,createdSockets=0;
const parent={postMessage(m,origin){sent.push({m,origin})}};
class Sock{static OPEN=1;constructor(){createdSockets++;throw Error('Embedded stage must never open its own WebSocket')}}
const doc={readyState:'complete',visibilityState:'visible',body:{appendChild(){}},addEventListener(){},getElementById(){return null},
 querySelector(){return{classList:{remove(){}}}},createElement(){return {style:{},setAttribute(){},hidden:false}}};
const ctx={window:null,parent,document:doc,WebSocket:Sock,JSON,Date,Math,console,URL,URLSearchParams,Map,Set,
 location:{search:'?embedded=1',origin:'https://unit.invalid',host:'unit.invalid',protocol:'https:',replace(){throw Error('Nested lobby navigation blocked')}},
 crypto:{randomUUID:()=> 'qa-stage2-child'},
 sessionStorage:{getItem:key=>key.includes('client_id')?'qa-client':key.includes('role')?'player':'seat-token',removeItem(){}},
 localStorage:{getItem:()=>null},
 setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},
 addEventListener(type,fn){if(type==='message')listener=fn},
 GL_PVP_BUILD_META:{buildId:BUILD_ID},
 GL_LOCAL_AI_BRIDGE:{getSnapshot:()=>board,importSnapshot(b){board=b;imports++;return true}},
 GL_GAME_ENGINE:{getManaPlan:()=>null},GL_AUTHORITY_ADAPTER:{register(){},use(){}},
 GL_GAME_UI:{render(){},openingBusy:()=>false}};
ctx.window=ctx;ctx.globalThis=ctx;
vm.runInNewContext(source,ctx,{filename:'pvp-network.js'});
assert.equal(createdSockets,0,'Bridge must not reconnect');
assert.equal(sent[0]?.m?.kind,'ready');
const relay=(message,origin='https://unit.invalid')=>listener({source:parent,origin,data:{channel:'gl-pvp-battle-transport-v1',kind:'server',message}});
relay({type:'bridge-transport',connected:true});
const snapshot={type:'snapshot',forceImport:true,local:{seat:1,role:'player',name:'Player'},players:[{seat:1,name:'Player'},{seat:2,name:'Opponent'}],
 match:{status:'started',revision:2,board:{pvpPrivateStateMasked:true,pvpRecipientSeat:1,appState:{turn:'AI',phase:'Battle',
  pending:{type:'response_window',decision_side:'UNKNOWN'},responseWindow:{response_owner:'PLAYER',response_window_token:'token',options:[{card_id:'S0-WAR-023'}]}}}}};
relay(snapshot,'https://evil.invalid');assert.equal(imports,0,'Cross-origin snapshot ignored');
relay(snapshot);assert.equal(imports,1);
const result=ctx.GL_S0_PVP_NETWORK.sendIntent('selectAndConfirmResponse',[0]);
assert.equal(result.ok,true);
const message=sent.at(-1).m;
assert.equal(message.kind,'send');assert.equal(message.message.type,'runtime-intent-batch');
assert.equal(message.message.steps[0].name,'responseSelectNoStuck');
assert.equal(message.message.steps[1].name,'confirmSelectedResponse');
assert.equal(createdSockets,0);
relay({type:'intent-result',clientActionId:message.message.clientActionId,ok:true,serverActionMs:2,
 snapshot:{...snapshot,match:{...snapshot.match,revision:3,board:{...snapshot.match.board,appState:{turn:'PLAYER',phase:'Battle',pending:null,responseWindow:null}}}}});
assert.equal(ctx.GL_S0_PVP_NETWORK.state.inflight,false);
assert.equal(ctx.GL_S0_PVP_NETWORK.state.revision,3);
relay({type:'bridge-transport',connected:false});
assert.equal(ctx.GL_S0_PVP_NETWORK.state.connected,false);
assert.equal(createdSockets,0);
console.log('PASS embedded battle transport: no second socket, one atomic Response packet, ACK updates board, origin filter and disconnect');
