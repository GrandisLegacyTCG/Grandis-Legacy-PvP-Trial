'use strict';
// RC40 artwork-restricted Items, original physical Hand index / Legacy discard,
// response user vs protected target and accessible UI choices.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,
 performance:{now:()=>0},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame(){},cancelAnimationFrame(){},crypto:crypto.webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://rc40-item-test/index.html',origin:'http://rc40-item-test'};
ctx.navigator={userAgent:'RC40 Item/Discard QA'};ctx.GL_APP_MODE='PVP';
// A stale physical-card choice intentionally opens a player-facing info modal.
// Give the headless engine VM inert DOM nodes so its rejection path can be
// verified without opening a real browser; browser click-through is also QA'd.
const fakeNodes={};
function fakeEl(){return {textContent:'',innerHTML:'',style:{setProperty(){}},hidden:false,
 classList:{add(){},remove(){},contains(){return false;},toggle(){}},
 setAttribute(){},removeAttribute(){},appendChild(){},getAttribute(){return null},querySelector(){return null},
 querySelectorAll(){return []},focus(){},matches(){return false}};}
ctx.document={readyState:'loading',addEventListener(){},getElementById(id){return fakeNodes[id]||(fakeNodes[id]=fakeEl());},
 querySelector(){return null},querySelectorAll(){return []},createElement(){return fakeEl()},
 documentElement:{classList:{toggle(){}}},body:{appendChild(){}}};
vm.createContext(ctx);
for(const file of ['public/battle/engine/js/static-data.js','public/battle/engine/js/runtime-authority.js','public/battle/engine/shared-app/active-starters.js','public/battle/engine/shared-app/app.bundle.js']){
 const src=fs.readFileSync(path.join(root,file),'utf8');
 vm.runInContext(src,ctx,{filename:file,timeout:60000});
}
assert.equal(typeof ctx.GL_RC40_ITEM_DISCARD_VALIDATOR_QA_SELF_TEST,'function','New regression function missing');
const core=ctx.GL_RC40_ITEM_DISCARD_VALIDATOR_QA_SELF_TEST();
if(!core.ok){console.error('Core QA failure:',JSON.stringify({error:core.error,passed:core.passed,total:core.total}));(core.failures||[]).forEach(x=>console.error('FAIL',x.name,JSON.stringify(x.detail||{})));}
console.log('Item and physical cost engine checks',core.passed+'/'+core.total);
const source=fs.readFileSync(path.join(root,'public/battle/shared-app/app-runtime.js'),'utf8');
const css=fs.readFileSync(path.join(root,'public/battle/shared-ui/battlefield-ui.css'),'utf8');
const checks=[
 ['read-only Legacy inspect has no CANCEL', source.includes("if(cancel){cancel.hidden=true;cancel.onclick=null;}")],
 ['hidden CANCEL stays hidden in rendered CSS',/\.gl-vsai-choice-overlay \.gl-choice-cancel\[hidden\]\{display:none!important\}/.test(css)],
 ['Magic Compass only shows cancellable CONDITION',source.includes("['s0_condition_precommit','gods_blessing_precommit','s0_response_condition_precommit'].includes(p.resolve_to)")],
 ['coin flip wording is not all-caps',source.includes("won?'You won the coin flip':esc(info.winnerName||'Opponent')+' won the coin flip'")],
 ['PLAYER draw flips front before reaching Hand',source.includes('gl-draw-flip-flight')&&source.includes("side==='PLAYER'&&reservation.card_id?art(reservation.card_id):null")],
 ['stale physical choice restores its interactive stage',source.includes('resetCenterChoiceVisualState();centerChoiceRenderSig=\'\';renderCenterChoiceStage(st());')]
];
checks.forEach(x=>console.log((x[1]?'PASS':'FAIL'),x[0]));
const report={ok:!!core.ok&&checks.every(x=>x[1]),passed:core.passed+checks.filter(x=>x[1]).length,total:core.total+checks.length,
 engine_checks:core.total,ui_source_checks:checks.length,failed:(core.failures||[]).map(x=>x.name).concat(checks.filter(x=>!x[1]).map(x=>x[0])),
 runtime:{engine:'RC40',authority:'Main R3.8 / Legacy R3.7 / OSA DEV45 + designer ruling'}};
fs.writeFileSync(path.join(__dirname,'RC40_ITEM_DISCARD_VALIDATOR_PVP_RESULTS.json'),JSON.stringify(report,null,2)+'\n');
console.log('RC40 ITEM/DISCARD',report.passed+'/'+report.total,report.ok?'PASS':'FAIL');
if(!report.ok)process.exitCode=1;
