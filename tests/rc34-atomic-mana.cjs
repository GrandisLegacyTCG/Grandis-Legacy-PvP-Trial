'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../public/battle');
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextEncoder,TextDecoder,performance:{now:()=>0},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},crypto:require('crypto').webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://qa.invalid/',origin:'http://qa.invalid'};ctx.navigator={userAgent:'Atomic mana QA'};
ctx.document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []},body:null,documentElement:null};vm.createContext(ctx);
for(const rel of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let js=fs.readFileSync(path.join(root,rel),'utf8');
 if(rel.endsWith('app.bundle.js')){
  const expose=`\nwindow.__SETUP_PAYMENT_TEST=function(){
    initCards();SUPPRESS_RENDER=true;matchStarted=true;
    var s=buildInitialMatchState();appState=s;s.preGame=null;s.turn='PLAYER';s.phase='Deploy';s.pending=null;s.responseWindow=null;s.gameOver=false;
    s.mana=30;s.aiMana=30;s.playerHand=['S0-EVT-004','S0-WAR-001'];
    s.playerManaPoolCards=[];s.aiManaPoolCards=[];s.playerManaDeck=[];s.aiManaDeck=[];
    for(var mi=0;mi<12;mi++){var shard=makeManaShard('GENERIC','','PLAYER',mi);if(mi<8)s.playerManaPoolCards.push(shard);else s.playerManaDeck.push(shard);}
    syncCounts(s);s.playerHeroes.LEFT.card_id='S0-WAR-H001';s.playerHeroes.LEFT.hp=80;s.playerHeroes.LEFT.maxHp=100;s.playerHeroes.LEFT.exhausted=false;
    beginPlayFromHand(0);chooseHeroFromBoard('PLAYER','LEFT');
    return{pending:s.pending&&s.pending.type,uidCount:(s.pending&&s.pending.selected_shard_uids||[]).length,poolCount:s.playerManaPoolCards.length};
  };
})();`;
  assert(/\n\}\)\(\);\s*$/.test(js));js=js.replace(/\n\}\)\(\);\s*$/,expose);
 }
 vm.runInContext(js,ctx,{timeout:60000,filename:rel});
}
ctx.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true);
const info=ctx.__SETUP_PAYMENT_TEST();console.log('SETUP',info);
assert.equal(info.pending,'mana_shard_payment_choice','Test fixture must enter physical Shard choice');
const before=ctx.GL_LOCAL_AI_BRIDGE.getSnapshot().appState;
const plan=ctx.GL_GAME_ENGINE.getManaPlan();assert(plan?.plan?.ok,'Initial exact Mana plan must be valid');
const selected=plan.plan.selected_shard_uids.map(String);
// A rejected transaction must not remove cards or advance a phase.
const bad=ctx.GL_LOCAL_AI_BRIDGE.applyServerIntent('commitExactManaPaymentChoice',[[selected[0],selected[0]],false,null]);
assert.equal(bad.ok,false,'Duplicate Shard UID must be rejected');
assert.equal(ctx.GL_LOCAL_AI_BRIDGE.getSnapshot().appState.pending?.type,'mana_shard_payment_choice');
const good=ctx.GL_LOCAL_AI_BRIDGE.applyServerIntent('commitExactManaPaymentChoice',[selected,false,null]);
console.log('RESULT',JSON.stringify({selected,bad:bad.ok,good:good.ok,afterPending:good.snapshot?.appState?.pending?.type||null,discard:good.snapshot?.appState?.playerDiscard?.slice(-2)}));
assert.equal(good.ok,true,'Atomic Mana PAY should resolve legal physical Shards');
assert.notEqual(good.snapshot?.appState?.pending?.type,'mana_shard_payment_choice','Mana choice must close after valid PAY');
console.log('PASS RC34 atomic exact Mana Payment (positive + duplicate UID rejected)');
