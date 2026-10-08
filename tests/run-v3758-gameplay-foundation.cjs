'use strict';
const assert=require('assert');
const path=require('path');
const {loadCandidate3aRuntime,deepClone,setPlayerMana}=require('./candidate3a-runtime-harness.cjs');
const root=path.resolve(__dirname,'..');
const {bridge,tutorial}=loadCandidate3aRuntime(root);
bridge.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger',firstPlayerSide:'PLAYER'});
const opened=bridge.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'});
const baseline=deepClone(opened.snapshot);
function importState(mutator){const snap=deepClone(baseline);mutator(snap.appState);assert.strictEqual(bridge.importCanonicalSnapshot(snap,1,{notice:'',skipImportAnimations:true}),true);}
function run(name,args=[]){const r=bridge.applyServerIntent(name,args);return {r,s:(r.snapshot||bridge.getSnapshot()).appState};}

// v3.51 payment audit: matching Class=2 for matching Skill, nonmatching=1, correct return batch ordering.
const mana=bridge.testPlaytestManaRules();
assert.strictEqual(mana.ok,true,mana.reason||'mana audit failed');
assert.strictEqual(mana.matchingValue,2);assert.strictEqual(mana.nonmatchingValue,1);assert.strictEqual(mana.paymentBatchOrder,true);

// Paid Skill: source -> target -> authoritative payment -> Response. Generic Mana auto-fills the cost.
importState(s=>{s.phase='Battle';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.playerHand=['S1-WAR-001'];s.playerDiscard=[];s.playerHeroes.CENTER.exhausted=false;s.playerHeroes.CENTER.statuses=[];setPlayerMana(s,3);});
let out=run('beginPlayFromHand',[0]);assert.strictEqual(out.s.pending?.type,'source_selection');
out=run('chooseHeroFromBoard',['PLAYER','CENTER']);assert.strictEqual(out.s.pending?.type,'target_selection');
out=run('chooseHeroFromBoard',['AI','CENTER']);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.playerManaPoolCards.length,1);assert.strictEqual(out.s.responseWindow?.response_owner,'AI');

// Meditation must resolve through the same authoritative contract and cannot leave a pending UI state behind.
importState(s=>{s.phase='Deploy';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.playerHand=['S1-MAG-006'];s.playerDiscard=[];s.playerHeroes.LEFT.exhausted=false;setPlayerMana(s,3);});
assert.strictEqual(tutorial.getLegalPlayState('PLAYER','S1-MAG-006').can,true);
out=run('beginPlayFromHand',[0]);assert.strictEqual(out.s.pending?.type,'source_selection');
out=run('chooseHeroFromBoard',['PLAYER','LEFT']);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.pending,null);assert.strictEqual(out.s.playerHand.length,0);assert.strictEqual(out.s.playerManaPoolCards.length,5);assert.ok(out.s.playerDiscard.includes('S1-MAG-006'));

// First-player Round 1 restriction is Attack-only: a normal Event remains legal in Deploy.
importState(s=>{s.phase='Deploy';s.turn='PLAYER';s.round=1;s.pending=null;s.responseWindow=null;s.playerHand=['S1-EVT-002'];s.playerDiscard=[];s.playerHeroes.CENTER.exhausted=false;setPlayerMana(s,3);});
const eventState=tutorial.getLegalPlayState('PLAYER','S1-EVT-002');assert.strictEqual(eventState.can,true,JSON.stringify(eventState));

console.log(JSON.stringify({ok:true,authority:'v3.51 gameplay contract',paidSkill:true,manaAutoFill:true,classShardAudit:true,meditation:true,eventRound1:true,responseBackbone:true},null,2));
