/** PvP RC36.8 mobile popup/animation parity and nonblocking Response notice.
 * Uses production source assertions and the exact notice renderer in a small
 * VM so no private card data, network packets, or game rules are invented. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const html=read('public/battle/index.html');
const css=read('public/battle/runtime/pvp-mobile-landscape-fix.css');
const runtime=read('public/battle/shared-app/app-runtime.js');
const network=read('public/battle/runtime/pvp-network.js');
const server=read('server.js');
assert.match(html,/gl-pvp-mobile-gameplay/);
assert.match(html,/!app\.classList\.contains\('gl-lobby-hidden'\)/);
assert.match(html,/!document\.querySelector\('\.gl-coin-overlay\.open, \.gl-lobby-overlay\.open'\)/);
assert.match(html,/runtime\/pvp-mobile-landscape-fix\.css\?v=/);
assert.match(css,/\.app\{[\s\S]*?transform:none!important/);
assert.match(css,/body\{[\s\S]*?transform:var\(--gl-stage-transform\)!important/);
for(const layer of ['gl-vsai-choice-overlay','gl-card-review-overlay','gl-animation-layer','gl-center-choice-stage','gl-battle-feedback-layer','gl-vsai-attack-direction-layer']){
  assert.ok(css.includes(layer),'Live game portal must share the stage: '+layer);
}
assert.match(runtime,/function pvpLandscapeStage\(\)/);
assert.match(runtime,/\.map\(\(\[x,y\]\)=>new DOMPoint\(x,y\)\.matrixTransform\(inv\)\)/);
assert.match(runtime,/function uiViewportSize\(\)\{return pvpLandscapeStage\(\)\?\{width:1600,height:747\}/);
assert.match(server,/const BUILD_ID='gl-s0-pvp-rc40-patch32-item-discard-2026-11-14'/,'RC40 build metadata must be current');
assert.match(network,/updateOpponentResponseNotice\(board\)/);
assert.match(network,/updateOpponentResponseNotice\(null\)/);
const start=network.indexOf('function updateOpponentResponseNotice(');
const end=network.indexOf('\nfunction session(',start);
assert.ok(start>0&&end>start,'Extract real production notice update logic');
const source=network.slice(start,end);
function runCase({connected=true,role='player',status='started',appState,oldNotice=false}){
  let notice=oldNotice?{hidden:false,setAttribute(){},className:'gl-pvp-opponent-response-notice'}:null;
  const field={appendChild(n){notice=n}};
  const document={
    getElementById: id=>id==='glPvpOpponentResponseNotice'?notice:null,
    querySelector: q=>q==='.battlefield'?field:null,
    createElement:()=>({id:'',hidden:true,attrs:{},setAttribute(k,v){this.attrs[k]=v}})
  };
  const state={connected,role,status};
  const context={document,state};
  vm.createContext(context);
  vm.runInContext(source,context);
  context.updateOpponentResponseNotice(appState?{appState}:null);
  return notice;
}
assert.equal(runCase({appState:{responseWindow:{response_owner:'AI'},gameOver:false}}).hidden,false,'Show when rival owns Response');
assert.equal(runCase({appState:{responseWindow:{response_owner:'PLAYER'}}}),null,'Do not show during local Defense');
assert.equal(runCase({appState:{pending:{type:'response_payment_choice',decision_side:'AI'}}}).hidden,false,'Keep waiting during opponent Response payment');
assert.equal(runCase({appState:{pending:{type:'response_payment_choice',decision_side:'PLAYER'}}}),null,'Do not show during own payment');
assert.equal(runCase({appState:{responseWindow:{response_owner:'AI'}},connected:false}),null,'Do not show disconnected');
assert.equal(runCase({appState:{responseWindow:{response_owner:'AI'}},role:'spectator'}),null,'Do not show spectator');
assert.equal(runCase({appState:{responseWindow:{response_owner:'AI'}},status:'finished'}),null,'Do not show post-match');
assert.equal(runCase({appState:{responseWindow:{response_owner:'AI'},gameOver:true}}),null,'Do not show after Defeat');
assert.equal(runCase({appState:{responseWindow:null},oldNotice:true}).hidden,true,'Hide immediately after response resolves');
assert.equal(runCase({appState:{responseWindow:{response_owner:'AI'}},oldNotice:true,connected:false}).hidden,true,'Hide on disconnect with existing indicator');
console.log('PASS RC36.8 mobile: full-body portrait transform, fixed portal geometry, inverse VFX coordinates and Response-wait visibility');
