'use strict';
// RC40 follow-up: both Event bonuses depend on the three chosen Hero Base Classes,
// including Defeated Heroes stored underneath Legacy Cards, not living Hero count.
// Public Deck/Discard -> Hand reveal cards must not receive an artificial stroke.
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'../public/battle');
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,performance:{now:()=>0},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame(){},cancelAnimationFrame(){},crypto:crypto.webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://rc40test/index.html',origin:'http://rc40test'};ctx.navigator={userAgent:'RC40 Team Bonus QA'};
ctx.document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []},createElement(){return {style:{},appendChild(){},setAttribute(){}}},documentElement:{classList:{toggle(){}}},body:{appendChild(){}}};
vm.createContext(ctx);
const exposure=`window.__Q={setState:s=>{appState=s;matchStarted=true;SUPPRESS_RENDER=true},initCards,card,heroState,buildInitialMatchState,getLegalActions,commitPlayedCard,executeAIAction,coordinationAttackBonus,coordinationAttackBonusAmount,defensiveFormationBonus,activeAlliedBaseFamiliesDifferent,teamBaseFamilyForSlot,expireEndPhaseAttachmentsForSide,applyResolvedAttackDamage,manaPoolCardsForSide,drawManaCards,transitionDefeatedHeroToLegacyMode};\n})();`;
for(const file of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let src=fs.readFileSync(path.join(root,file),'utf8');if(file.endsWith('app.bundle.js')){assert(/\n\}\)\(\);\s*$/.test(src));src=src.replace(/\n\}\)\(\);\s*$/,exposure);}vm.runInContext(src,ctx,{filename:file,timeout:60000});
}
ctx.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true);const q=ctx.__Q;q.initCards();const results=[];
function test(name,run){try{run();results.push({name,status:'PASS'});console.log('PASS',name)}catch(e){results.push({name,status:'FAIL',error:String(e.stack||e)});console.error('FAIL',name,e.stack||String(e));}}
function fixture(side,id,classes=['S0-WAR-H001','S0-MAG-H001','S0-ARC-H001']){
 const s=q.buildInitialMatchState(),heroes=side==='AI'?s.aiHeroes:s.playerHeroes;
 s.preGame=null;s.openingFlowCompleted=true;s.gameOver=false;s.pending=null;s.responseWindow=null;s.turn=side;s.phase='Deploy';s.round=7;s.pvpHumanVsHuman=false;
 s[side==='AI'?'aiHand':'playerHand']=[id];
 for(let i=0;i<3;i++){let lane=['LEFT','CENTER','RIGHT'][i];heroes[lane]=q.heroState(classes[i],side,lane);heroes[lane].hp=Math.max(90,heroes[lane].hp);heroes[lane].exhausted=false;}
 q.drawManaCards(s,side,6,'QA starting Shards');q.setState(s);return s;
}
function dropToLegacy(s,side,lane,original,legacy){
 const heroes=side==='AI'?s.aiHeroes:s.playerHeroes;
 const snapshot=Object.assign({},heroes[lane],{card_id:original||heroes[lane].card_id,hp:0});
 heroes[lane]={card_id:legacy,side,lane,mode:'LEGACY',legacy_mode:true,active_legacy_card_id:legacy,original_hero_card_id:snapshot.card_id,defeated_hero_snapshot:snapshot};
}
function legalEvent(s,side,id){const opts=q.getLegalActions(side,s).filter(a=>a.type==='PLAY_CARD'&&a.card_id===id&&a.source_lane==='LEFT');assert(opts.length,`${side} ${id} must be legal at LEFT: ${JSON.stringify(q.getLegalActions(side,s).filter(a=>a.card_id===id))}`);return opts[0];}
function play(s,side,id){const a=legalEvent(s,side,id);let ok=side==='AI'?q.executeAIAction(s,a):q.commitPlayedCard(s,Object.assign({},a,{_mana_choice_complete:true,selected_mana_shard_uids:undefined,selected_mana_class_uids:q.manaPoolCardsForSide(s,side).filter(x=>x.kind==='CLASS').map(x=>x.uid)}));assert(ok,'Event commit failed');const aList=(s.activeAttachments||[]).filter(x=>x.side===side&&x.card_id===id);assert.equal(aList.length,1,'Expected one Event BUFF attachment');return aList[0];}
for(const side of ['PLAYER','AI']){
 test(`${side}: Coordination Attack has +20 with 2 active, third defeated as Legacy`,()=>{
  const s=fixture(side,'S0-EVT-011');dropToLegacy(s,side,'RIGHT','S0-ARC-H001','S0-ARC-L001');
  assert.equal(q.activeAlliedBaseFamiliesDifferent(s,side),true);assert.equal(q.coordinationAttackBonusAmount(s,side),20);
  const a=play(s,side,'S0-EVT-011');assert.equal(a.modifier_amount,20);
  const heroes=side==='AI'?s.aiHeroes:s.playerHeroes;
  assert.equal(q.coordinationAttackBonus(s,heroes.CENTER),20);
 });
 test(`${side}: Defensive Formation has 80 reduction with 2 active, third defeated as Legacy`,()=>{
  const s=fixture(side,'S0-EVT-012');dropToLegacy(s,side,'RIGHT','S0-ARC-H001','S0-ARC-L001');
  const a=play(s,side,'S0-EVT-012');assert.equal(a.modifier_amount,80);
  assert.equal(q.defensiveFormationBonus(s,side,side==='AI'?'PLAYER':'AI','Magical'),80);
  assert.equal(q.defensiveFormationBonus(s,side,side==='AI'?'PLAYER':'AI','Physical'),80);
 });
 test(`${side}: different 3 Base Classes still count with 1 living Hero`,()=>{
  const s=fixture(side,'S0-EVT-011');dropToLegacy(s,side,'CENTER','S0-MAG-H001','S0-MAG-L001');dropToLegacy(s,side,'RIGHT','S0-ARC-H001','S0-ARC-L001');
  assert.equal(q.activeAlliedBaseFamiliesDifferent(s,side),true);
  assert.equal(q.coordinationAttackBonusAmount(s,side),20);
  const a=play(s,side,'S0-EVT-011');assert.equal(a.modifier_amount,20);
 });
 test(`${side}: same Base Class remains base bonus (no accidental +20/+40)`,()=>{
  const s=fixture(side,'S0-EVT-012',['S0-WAR-H001','S0-MAG-H001','S0-WAR-H001']);dropToLegacy(s,side,'RIGHT','S0-WAR-H001','S0-WAR-L001');
  assert.equal(q.activeAlliedBaseFamiliesDifferent(s,side),false);
  const a=play(s,side,'S0-EVT-012');assert.equal(a.modifier_amount,40);
 });
}
test('Event bonus snapshots for its 2 turns even if a different teammate is then Defeated',()=>{
 const s=fixture('PLAYER','S0-EVT-011');const a=play(s,'PLAYER','S0-EVT-011');assert.equal(a.modifier_amount,20);
 dropToLegacy(s,'PLAYER','RIGHT','S0-ARC-H001','S0-ARC-L001');assert.equal(q.coordinationAttackBonus(s,s.playerHeroes.CENTER),20);
 s.phase='End';q.expireEndPhaseAttachmentsForSide(s,'PLAYER');assert.equal(q.coordinationAttackBonus(s,s.playerHeroes.CENTER),20);
 // Reviving the same Base Class does not change the committed teamwide bonus.
 s.playerHeroes.RIGHT=q.heroState('S0-ARC-H001','PLAYER','RIGHT');assert.equal(q.coordinationAttackBonus(s,s.playerHeroes.RIGHT),20);
});
test('Bonus uses defeated original Hero Class, not just a mismatched Legacy label',()=>{
 const s=fixture('PLAYER','S0-EVT-011');dropToLegacy(s,'PLAYER','RIGHT','S0-ARC-H001','S0-CLE-L001');
 assert.equal(q.teamBaseFamilyForSlot(s.playerHeroes.RIGHT),'archer');assert.equal(q.activeAlliedBaseFamiliesDifferent(s,'PLAYER'),true);
});
test('Reveal of chosen card has no artificial stroke, but selection highlight is untouched',()=>{
 const css=fs.readFileSync(path.join(root,'shared-ui/battlefield-ui.css'),'utf8');
 const match=css.match(/\.gl-flying-card\.gl-public-pickup-reveal\s*\{([^}]+)\}/);assert(match,'Public pickup CSS selector missing');
 const body=match[1];assert(!/box-shadow\s*:\s*0\s+0\s+0\s+/i.test(body),'Public pickup still has colored outline stroke');
 assert(/box-shadow\s*:[^;]+/.test(body),'Normal card shadow should remain');
 assert(/\.gl-center-choice-card\.is-selected::after\s*\{/.test(css),'Selection highlight must remain while choosing');
});
const report={passed:results.filter(x=>x.status==='PASS').length,total:results.length,failed:results.filter(x=>x.status==='FAIL').length,results};
fs.writeFileSync(path.join(__dirname,'RC40_TEAM_BONUS_REVEAL_RESULTS.json'),JSON.stringify(report,null,2));console.log('RC40 TEAM BONUS + REVEAL',report.passed+'/'+report.total);if(report.failed)process.exitCode=1;
