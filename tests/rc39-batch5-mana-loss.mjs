/** RC39 donor mana-loss result toast, resolved only by authoritative PvP. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
const root=new URL('../public/battle/',import.meta.url);
const engine=readFileSync(new URL('engine/shared-app/app.bundle.js',root),'utf8');
const p=engine.indexOf('  function localManaLossShardSummary('),q=engine.indexOf('  function restoreStateSnapshot(',p);
assert.ok(p>0&&q>p);
const ctx={Number,Array,Object,String,Math,Set};
vm.createContext(ctx);vm.runInContext(engine.slice(p,q),ctx);
const initial={pvpHumanVsHuman:true,presentationEvents:[],presentationEventSequence:0};
const shards=[{uid:'sensitive-physical-1',kind:'CLASS',class_name:'Mage'},{uid:'sensitive-physical-2',kind:'GENERIC'}];
assert.equal(ctx.notifyLocalManaLoss(initial,'AI','PLAYER','Mana Burn',shards),true);
let raw=initial.presentationEvents[0];
assert.equal(raw.type,'MANA_LOSS_COMMITTED');
assert.equal(raw.side,'AI');
assert.equal(raw.source_side,'PLAYER');
assert.equal(raw.removed_count,2);
assert.equal(raw.shard_details,'Mage Color x1, Regular x1');
assert.equal(raw.loss_kind,'OPPONENT_REMOVE');
assert.equal(JSON.stringify(raw.removed_shards),JSON.stringify([{kind:'CLASS',class_name:'Mage'},{kind:'MANA',class_name:''}]));
assert.equal(JSON.stringify(raw).includes('sensitive-physical-'),false);
const projectionFor=(events)=>viewerSafeBoard({appState:{playerHand:[],aiHand:['SECRET'],playerDeck:[],aiDeck:[],playerLegacy:[],aiLegacy:['SECRET'],playerManaPoolCards:[],aiManaPoolCards:[],playerManaDeck:[],aiManaDeck:[],presentationEvents:events,pending:null}}, {seat:1,revision:4,secret:Buffer.alloc(32,5)});
const wrong=projectionFor([raw]);assertViewerSafeBoard(wrong);
assert.equal(wrong.appState.presentationEvents.some(x=>x.type==='MANA_LOSS_COMMITTED'),false,'Do not notify uninvolved player');
const selfState={pvpHumanVsHuman:true,presentationEvents:[],presentationEventSequence:0};
assert.equal(ctx.notifyLocalManaLoss(selfState,'PLAYER','AI','Mana Steal',shards),true);
raw=selfState.presentationEvents[0];
const view=projectionFor([raw]);assertViewerSafeBoard(view);
const ev=view.appState.presentationEvents[0];
assert.equal(ev.side,'PLAYER');
assert.equal(ev.source_side,'AI');
assert.equal(ev.removed_count,2);
assert.equal(ev.shard_details,'Mage Color x1, Regular x1');
assert.equal(ev.loss_kind,'OPPONENT_REMOVE');
assert.equal(JSON.stringify(ev.removed_shards),JSON.stringify([{kind:'CLASS',class_name:'Mage'},{kind:'MANA',class_name:''}]));
assert.equal(JSON.stringify(view).includes('sensitive-physical-'),false);
const ui=readFileSync(new URL('shared-app/app-runtime.js',root),'utf8');
const a=ui.indexOf('function buildPresentationPlan(s){'),b=ui.indexOf('function preparePresentationTargets(plan){',a);
assert.ok(a>0&&b>a);
const fake=e=>({round:3,phase:'Battle',presentation:[e],hero:{PLAYER:{LEFT:{},CENTER:{},RIGHT:{}},AI:{LEFT:{},CENTER:{},RIGHT:{}}},playerMana:[],aiMana:[]});
const planCtx={console,Map,Set,Array,Math,Number,String,
 openingPresentationActive:false,presentationPrimed:true,previousVisualState:null,
 laneOrder:['LEFT','CENTER','RIGHT'],seenPresentationEvents:new Set(),
 glExternallyPresentedShardUids:new Set(),pvpDeferredRankTransitions:[],pvpDeferredExpReturns:[],
 glHiddenCommittedDrawSlots:{PLAYER:new Map(),AI:new Map()},
 showNewCounterEvents(){},visualStateOf:s=>s,pvpAttackVisualPlan(){return null}};
vm.createContext(planCtx);vm.runInContext(ui.slice(a,b),planCtx);
const one=planCtx.buildPresentationPlan(fake(ev));
assert.equal(one.manaLossNotices.length,1);
assert.equal(planCtx.buildPresentationPlan(fake(ev)).manaLossNotices.length,0,'No toast replay on duplicate snapshot');
assert.match(ui,/function presentPvpManaLossNotice\(event\)/);
assert.match(ui,/queuePresentationNotice\('mana'/);
assert.doesNotMatch(ui,/document\.createElement\('div'\);node\.className='gl-mana-loss-notice'/);
assert.match(engine,/if\(Number\(ability.cost\|\|0\)>0&&\(side==='PLAYER'\|\|state.pvpHumanVsHuman\)/);
console.log('PASS RC39: resolved Mana Burn/Steal + class ability loss notices, only affected player, no physical UIDs or duplicate toast');
