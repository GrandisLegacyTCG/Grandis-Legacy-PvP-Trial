/** RC36.8 mobile stage and opponent Response notice smoke regression. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('public/battle/index.html'),css=read('public/battle/runtime/pvp-mobile-landscape-fix.css');
const runtime=read('public/battle/shared-app/app-runtime.js');
const net=read('public/battle/runtime/pvp-network.js');
assert.match(html,/gl-pvp-mobile-gameplay/);
assert.match(html,/runtime\/pvp-mobile-landscape-fix\.css\?v=/);
assert.match(css,/transform:var\(--gl-stage-transform\)!important/);
assert.match(css,/\.app\{[\s\S]*?transform:none!important/);
assert.match(runtime,/function pvpLandscapeStage\(\)/);
assert.match(runtime,/function uiViewportSize\(\)\{return pvpLandscapeStage\(\)\?\{width:1600,height:747\}/);
assert.match(net,/updateOpponentResponseNotice\(board\)/);
assert.match(net,/updateOpponentResponseNotice\(null\)/);
const start=net.indexOf('function updateOpponentResponseNotice(');
const end=net.indexOf('\nfunction session(',start);
assert.ok(start>0&&end>start,'Production Response notice function exists');
function run({appState,connected=true,role='player',status='started',existing=false}){
 let notice=existing?{hidden:false}:null;
 const field={appendChild(node){notice=node}};
 const document={
  getElementById:id=>id==='glPvpOpponentResponseNotice'?notice:null,
  querySelector:q=>q==='.battlefield'?field:null,
  createElement:()=>({hidden:true,setAttribute(){}})
 };
 const context={document,state:{connected,role,status}};
 vm.createContext(context);vm.runInContext(net.slice(start,end),context);
 context.updateOpponentResponseNotice(appState?{appState}:null);
 return notice;
}
assert.equal(run({appState:{responseWindow:{response_owner:'AI'}}}).hidden,false);
assert.equal(run({appState:{responseWindow:{response_owner:'PLAYER'}}}),null);
assert.equal(run({appState:{pending:{type:'response_payment_choice',decision_side:'AI'}}}).hidden,false);
assert.equal(run({appState:{pending:{type:'response_payment_choice',decision_side:'PLAYER'}}}),null);
assert.equal(run({appState:{responseWindow:{response_owner:'AI'}},connected:false}),null);
assert.equal(run({appState:{responseWindow:{response_owner:'AI'}},role:'spectator'}),null);
assert.equal(run({appState:{responseWindow:{response_owner:'AI'}},status:'finished'}),null);
assert.equal(run({appState:{responseWindow:{response_owner:'AI'},gameOver:true}}),null);
assert.equal(run({appState:{responseWindow:null},existing:true}).hidden,true);
console.log('PASS RC36.8 mobile and opponent Response notice');
