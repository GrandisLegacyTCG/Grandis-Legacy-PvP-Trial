/** RC39 PvP: server-committed EXP transaction, viewer-safe event projection, deferred local VFX. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {webcrypto} from 'node:crypto';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
import {applyOptimizedPvpIntent} from '../server/headless-rc32.mjs';
const root=join(process.cwd(),'public/battle');
const dummy={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},querySelector(){return null},querySelectorAll(){return []},getBoundingClientRect(){return{x:0,y:0,width:0,height:0}}};
const document={readyState:'loading',body:null,addEventListener(){},getElementById(){return dummy},querySelector(){return null},querySelectorAll(){return []}};
const ctx={console,Date,Math,URL,TextEncoder,TextDecoder,Uint8Array,crypto:webcrypto,document,location:{origin:'https://unit.invalid',href:'https://unit.invalid'},navigator:{userAgent:'RC39 PvP Rank Up QA'},performance:{now:()=>0},setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},requestAnimationFrame(){return 0},cancelAnimationFrame(){},GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
for(const path of ['engine/js/static-data.js','runtime/overrides/grand-finale-designer-nerf.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let code=readFileSync(join(root,path),'utf8');
 if(path.endsWith('app.bundle.js')){
  const inject=`\nwindow.__RC39_RANK_TEST__={run:function(side){
    initCards();SUPPRESS_RENDER=true;matchStarted=true;appState=buildInitialMatchState();
    var s=appState;s.preGame=null;s.turn=side;s.phase='Reform';s.pending=null;s.responseWindow=null;s.gameOver=false;s.pvpHumanVsHuman=true;
    var h=sideHeroes(s,side).LEFT;h.card_id='S0-WAR-H001';h.exp_cards=['S0-WAR-001','S0-CLE-002','S0-WAR-004'];h.exp_total=300;
    if(side==='PLAYER'){s.playerLegacy=['S0-WAR-H002','S0-WAR-H003'];s.playerLegacyPackageSlots=[{slot:'LEFT',lineage:'WAR-CONQUEROR'}];}
    else{s.aiLegacy=['S0-WAR-H002','S0-WAR-H003'];s.aiLegacyPackageSlots=[{slot:'LEFT',lineage:'WAR-CONQUEROR'}];}
    if(!rankUpHero(s,side,'LEFT'))throw Error('Rank Up failed');
    trialActivateRankUpReturnChoice(s);syncCounts(s);return glPvpBridgeSnapshot();
  }};})();`;
  assert.match(code,/\n\}\)\(\);\s*$/);
  code=code.replace(/\n\}\)\(\);\s*$/,inject);
 }
 vm.runInContext(code,ctx,{timeout:60000,filename:path});
}
function commitRank(side){
 const original=ctx.__RC39_RANK_TEST__.run(side);
 assert.equal(original.appState.pending?.type,'trial_rankup_return_exp');
 const rank=original.appState.presentationEvents.filter(e=>e.type==='RANK_UP_COMMITTED');
 assert.equal(rank.length,1);
 assert.deepEqual(Array.from(rank[0].exp_card_ids),['S0-WAR-001','S0-CLE-002','S0-WAR-004']);
 assert.equal(rank[0].from_card_id,'S0-WAR-H001');
 assert.equal(rank[0].to_card_id,'S0-WAR-H002');
 assert.equal(rank[0].return_quota,2);
 const bridge=ctx.GL_LOCAL_AI_BRIDGE;
 const p1=bridge.getCanonicalSnapshot(1),p2=bridge.getCanonicalSnapshot(2);
 // The old RC38 bridge swapped event sides twice, so Player 2 saw their own
 // Rank Up as AI. RC39 must mirror every published event exactly once.
 for(const [seat,snap] of [[1,p1],[2,p2]]){
   const e=snap.appState.presentationEvents.find(x=>x.type==='RANK_UP_COMMITTED');
   assert.equal(e.side,side===(seat===1?'PLAYER':'AI')?'PLAYER':'AI');
   const projection=viewerSafeBoard(snap,{seat,revision:2,secret:Buffer.alloc(32,7)});
   assertViewerSafeBoard(projection);
   const publicRank=projection.appState.presentationEvents.find(x=>x.type==='RANK_UP_COMMITTED');
   assert.deepEqual(publicRank.exp_card_ids,Array.from(rank[0].exp_card_ids));
   assert.equal(publicRank.to_card_id,'S0-WAR-H002');
   assert.equal(publicRank.rank,2);
   assert.equal(publicRank.return_quota,2);
   assert.equal('secret_internal' in publicRank,false);
   assert.ok(projection.appState.aiHand.every(x=>x==='__HIDDEN_CARD_BACK__'));
   assert.ok(projection.appState.aiManaPoolCards.every(x=>x.hidden===false));
 }
 if(side==='PLAYER'){
   const pending=()=>bridge.getCanonicalSnapshot(1).appState.pending;
   assert.equal(pending().rank_up_id,rank[0].id);
   const response=applyOptimizedPvpIntent({bridge,readPending:pending,name:'commitExactLocalChoiceDraft',args:[{kind:'trial_rankup_return_exp',selected:[0,1]}]});
   assert.equal(response.ok,true);
   const after=bridge.getCanonicalSnapshot(1);
   const returns=after.appState.presentationEvents.filter(x=>x.type==='TRIAL_EXP_RETURNED_TO_HAND');
   assert.equal(returns.length,2);
   assert.ok(returns.every(x=>x.rank_up_id===rank[0].id));
   const proj=viewerSafeBoard(after,{seat:1,revision:3,secret:Buffer.alloc(32,7)});
   assertViewerSafeBoard(proj);
   assert.deepEqual(proj.appState.presentationEvents.filter(x=>x.type==='TRIAL_EXP_RETURNED_TO_HAND').map(x=>x.card_id).sort(),['S0-CLE-002','S0-WAR-001']);
   assert.equal(after.appState.playerHand.length>=2,true);
 }
}
commitRank('PLAYER');commitRank('AI');

// Real production presentation planner receives the same safe transaction and
// must delay the Hero arrival until the optional EXP return has been confirmed.
const src=readFileSync(join(root,'shared-app/app-runtime.js'),'utf8');
const begin=src.indexOf('function buildPresentationPlan(s){');
const end=src.indexOf('function preparePresentationTargets(plan){',begin);
assert.ok(begin>0&&end>begin);
const fakeRank={id:'RANK-UP-11',type:'RANK_UP_COMMITTED',side:'PLAYER',lane:'LEFT',
  from_card_id:'S0-WAR-H001',to_card_id:'S0-WAR-H002',exp_card_ids:['S0-WAR-001','S0-CLE-002','S0-WAR-004']};
const ret=(id,idx)=>({id:'TRIAL-EXP-'+idx,type:'TRIAL_EXP_RETURNED_TO_HAND',side:'PLAYER',lane:'LEFT',card_id:id,hand_index:idx,rank_up_id:'RANK-UP-11'});
const fake=(events,pending)=>({round:2,phase:'Reform',pending,presentation:events,
  hero:{PLAYER:{LEFT:{image_id:'S0-WAR-H002',legacy:false},CENTER:{},RIGHT:{}},AI:{LEFT:{},CENTER:{},RIGHT:{}}},
  playerMana:[],aiMana:[]});
const choiceCtx={
 console,Map,Set,Array,Math,Number,String,
 openingPresentationActive:false,presentationPrimed:true,previousVisualState:fake([],null),
 laneOrder:['LEFT','CENTER','RIGHT'],
 seenPresentationEvents:new Set(),glExternallyPresentedShardUids:new Set(),
 pvpDeferredRankTransitions:[],pvpDeferredExpReturns:[],
 seenPlayedActionEvents:new Set(),seenDiscardNotifications:new Set(),
 glHiddenCommittedDrawSlots:{PLAYER:new Map(),AI:new Map()},
 showNewCounterEvents(){},visualStateOf:s=>s,pvpAttackVisualPlan(){return null},
 pvpProjectedPlayedEvents(){return []},pvpCommittedHealingTargets(){return []}
};
vm.createContext(choiceCtx);vm.runInContext(src.slice(begin,end),choiceCtx);
const waiting=choiceCtx.buildPresentationPlan(fake([fakeRank],{type:'trial_rankup_return_exp',decision_side:'PLAYER',side:'PLAYER',lane:'LEFT'}));
assert.equal(waiting.heroTransitions.length,0,'Hero must not arrive before EXP choice');
assert.equal(choiceCtx.pvpDeferredRankTransitions.length,1);
const complete=choiceCtx.buildPresentationPlan(fake([fakeRank,ret('S0-WAR-001',4),ret('S0-CLE-002',5)],null));
assert.equal(complete.heroTransitions.length,1);
assert.equal(complete.heroTransitions[0].rankUpId,'RANK-UP-11');
assert.deepEqual(Array.from(complete.heroTransitions[0].expCardIds),['S0-WAR-001','S0-CLE-002','S0-WAR-004']);
assert.deepEqual(Array.from(complete.expReturns,x=>x.card_id),['S0-WAR-001','S0-CLE-002']);
assert.ok(choiceCtx.glHiddenCommittedDrawSlots.PLAYER.has(4));
assert.ok(choiceCtx.glHiddenCommittedDrawSlots.PLAYER.has(5));
const duplicated=choiceCtx.buildPresentationPlan(fake([fakeRank,ret('S0-WAR-001',4),ret('S0-CLE-002',5)],null));
assert.equal(duplicated.heroTransitions.length,0,'Do not replay Rank Up on duplicate snapshot');
assert.equal(duplicated.expReturns.length,0,'Do not replay Return EXP events');
assert.match(src,/function flightReturnedExp\(events,from,onComplete\)/);
assert.match(src,/const returning=moves\.filter\(x=>x\.returned\)/);
assert.match(src,/const discarded=moves\.filter\(x=>!x\.returned\)/);
assert.match(src,/if\(returning\.length\)flightReturnedExp\(returning,hero,done\)/);
console.log('PASS RC39: real Rank Up event, both seat projections, atomic post-Rank return, no hidden Hand leak, deferred simultaneous EXP VFX plan');
