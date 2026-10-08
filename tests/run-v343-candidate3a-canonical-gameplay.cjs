'use strict';
const assert=require('assert');
const path=require('path');
const {loadCandidate3aRuntime,deepClone,setPlayerMana}=require('./candidate3a-runtime-harness.cjs');
const root=path.resolve(__dirname,'..');
const {bridge,tutorial}=loadCandidate3aRuntime(root);
const deckA='starter_01_elemental_lord_conqueror_renegade',deckB='starter_02_saint_crusader_grand_ranger';
bridge.startSharedMatch({playerDeckKey:deckA,aiDeckKey:deckB,firstPlayerSide:'PLAYER'});
const opened=bridge.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'});
const baseline=deepClone(opened.snapshot);
assert.strictEqual(baseline.appState.phase,'Deploy');
assert.strictEqual(baseline.appState.turn,'PLAYER');

function importState(mutator,seat=1){const snap=deepClone(baseline);mutator(snap.appState,snap);assert.strictEqual(bridge.importCanonicalSnapshot(snap,seat,{notice:'',skipImportAnimations:true}),true);return snap;}
function run(name,args=[]){const r=bridge.applyServerIntent(name,args);return {r,s:(r.snapshot||bridge.getSnapshot()).appState};}

// Phase / turn canonical lifecycle entry.
importState(s=>{s.phase='Deploy';s.turn='PLAYER';s.pending=null;s.responseWindow=null;s.round=2;});
let out=run('advancePhase');assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.phase,'Battle');

// Representative Attack Skill: source -> target -> payment -> authoritative Response -> damage.
importState(s=>{s.phase='Battle';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.playerHand=['S1-WAR-001'];s.playerDiscard=[];s.playerHeroes.CENTER.exhausted=false;s.playerHeroes.CENTER.statuses=[];setPlayerMana(s,3);});
out=run('beginPlayFromHand',[0]);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.pending?.type,'source_selection');
out=run('chooseHeroFromBoard',['PLAYER','CENTER']);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.pending?.type,'target_selection');
const beforeIllegal=deepClone(out.s);out=run('chooseHeroFromBoard',['PLAYER','CENTER']);assert.strictEqual(out.r.ok,false);assert.strictEqual(JSON.stringify(out.s.playerHand),JSON.stringify(beforeIllegal.playerHand));assert.strictEqual(out.s.playerManaPoolCards.length,beforeIllegal.playerManaPoolCards.length);
out=run('chooseHeroFromBoard',['AI','CENTER']);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.responseWindow?.response_owner,'AI');assert.strictEqual(out.s.playerHand.length,0);assert.strictEqual(out.s.playerManaPoolCards.length,1);assert.strictEqual(out.s.playerHeroes.CENTER.exhausted,true);
const attackCanonical=bridge.getCanonicalSnapshot(1);assert.strictEqual(bridge.importCanonicalSnapshot(attackCanonical,2,{notice:'',skipImportAnimations:true}),true);out=run('responsePassNoStuck');assert.strictEqual(out.r.ok,true);const afterResponse=bridge.getCanonicalSnapshot(2).appState;assert.strictEqual(afterResponse.aiHeroes.CENTER.hp,80);assert.strictEqual(afterResponse.responseWindow,null);

// Representative Tactical Skill: Meditation is a canonical card, pays 0 and gains 2 Shards.
importState(s=>{s.phase='Deploy';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.playerHand=['S1-MAG-006'];s.playerDiscard=[];s.playerHeroes.LEFT.exhausted=false;setPlayerMana(s,3);});
assert.strictEqual(tutorial.getLegalPlayState('PLAYER','S1-MAG-006').can,true);
out=run('beginPlayFromHand',[0]);assert.strictEqual(out.s.pending?.type,'source_selection');out=run('chooseHeroFromBoard',['PLAYER','LEFT']);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.playerHand.length,0);assert.strictEqual(out.s.playerManaPoolCards.length,5);assert.ok(out.s.playerDiscard.includes('S1-MAG-006'));

// Representative Item: Mana Catalyst resolves from Hand and gains 2 Shards.
importState(s=>{s.phase='Deploy';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.playerHand=['S1-ITM-005'];s.playerDiscard=[];setPlayerMana(s,3);});
assert.strictEqual(tutorial.getLegalPlayState('PLAYER','S1-ITM-005').can,true);out=run('beginPlayFromHand',[0]);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.playerHand.length,0);assert.strictEqual(out.s.playerManaPoolCards.length,5);assert.ok(out.s.playerDiscard.includes('S1-ITM-005'));

// Representative Event: Market Bargain costs 2, chooses a legal user through current shared semantics, then draws 2.
importState(s=>{s.phase='Deploy';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.playerHand=['S1-EVT-002'];s.playerDiscard=[];setPlayerMana(s,3);});
assert.strictEqual(tutorial.getLegalPlayState('PLAYER','S1-EVT-002').can,true);out=run('beginPlayFromHand',[0]);assert.strictEqual(out.s.pending?.type,'source_selection');out=run('chooseHeroFromBoard',['PLAYER','CENTER']);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.playerManaPoolCards.length,1);assert.strictEqual(out.s.playerHand.length,2);assert.ok(out.s.playerDiscard.includes('S1-EVT-002'));

// Tribute and automatic canonical Rank Up. Client declares neither EXP amount nor resulting rank.
importState(s=>{s.phase='Reform';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.tributeUsedThisReform=false;s.playerHand=['S1-WAR-001','S1-WAR-002','S1-WAR-003'];s.playerDiscard=[];s.playerHeroes.CENTER.exp_total=200;s.playerHeroes.CENTER.exp_cards=['S1-WAR-002','S1-WAR-003'];s.playerHeroes.CENTER.exhausted=false;});
out=run('beginTributeFromHand',[0]);assert.strictEqual(out.s.pending?.type,'tribute_target');out=run('chooseHeroFromBoard',['PLAYER','CENTER']);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.playerHeroes.CENTER.card_id,'S1-WAR-H002');assert.strictEqual(out.s.playerHeroes.CENTER.exp_total,300);assert.strictEqual(JSON.stringify(out.s.playerHeroes.CENTER.exp_cards),'[]');assert.strictEqual(out.s.manaRegen,2);assert.strictEqual(out.s.tributeUsedThisReform,true);

// Conditional/Ultimate Tribute authority: actual current authority uses bound owner + matching Class Shard.
const manaAudit=bridge.testPlaytestManaRules();assert.strictEqual(manaAudit.ok,true,manaAudit.reason||'mana audit failed');assert.strictEqual(manaAudit.matchingValue,2);assert.strictEqual(manaAudit.nonmatchingValue,1);assert.strictEqual(manaAudit.paymentBatchOrder,true);assert.strictEqual(manaAudit.ultimateTargets.length,1);
// Explicit valid/invalid conditional Tribute using an actual Starter 1 Ultimate (Execute).
importState(s=>{s.phase='Reform';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.tributeUsedThisReform=false;s.playerHand=['S1-WAR-018'];setPlayerMana(s,3);});
let ultimateState=tutorial.getLegalTributeState('PLAYER','S1-WAR-018');assert.strictEqual(ultimateState.can,false);assert.ok(ultimateState.reasons.some(x=>/Warrior Shard/i.test(String(x))));
importState(s=>{s.phase='Reform';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.tributeUsedThisReform=false;s.playerHand=['S1-WAR-018'];setPlayerMana(s,3);s.playerManaPoolCards[0]={uid:'C3A:WAR',kind:'CLASS',class_name:'Warrior',owner_side:'PLAYER',bottom_locked:false};});
ultimateState=tutorial.getLegalTributeState('PLAYER','S1-WAR-018');assert.strictEqual(ultimateState.can,true);assert.strictEqual(JSON.stringify(tutorial.getLegalTributeTargets('PLAYER','S1-WAR-018')),JSON.stringify(['CENTER']));

// Manual Reposition backbone is authoritative and carries Hero state with moved Hero.
importState(s=>{s.phase='Deploy';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;for(const lane of ['LEFT','CENTER','RIGHT'])s.playerHeroes[lane].exhausted=false;});
const leftBefore=bridge.getSnapshot().appState.playerHeroes.LEFT.card_id,centerBefore=bridge.getSnapshot().appState.playerHeroes.CENTER.card_id;
out=run('openManualRepositionChoice');assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.pending?.type,'manual_reposition');
const repositionPending=deepClone(out.s);out=run('performManualReposition',['LEFT|RIGHT']);assert.strictEqual(out.r.ok,false);assert.strictEqual(JSON.stringify(out.s.playerHeroes),JSON.stringify(repositionPending.playerHeroes));
out=run('performManualReposition',['LEFT|CENTER']);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.playerHeroes.LEFT.card_id,centerBefore);assert.strictEqual(out.s.playerHeroes.CENTER.card_id,leftBefore);assert.strictEqual(out.s.playerHeroes.LEFT.exhausted,true);assert.strictEqual(out.s.playerHeroes.CENTER.exhausted,true);

// Insufficient EXP does not permit a client-forced Rank result: normal Tribute remains Rank I at 100 EXP.
importState(s=>{s.phase='Reform';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.tributeUsedThisReform=false;s.playerHand=['S1-WAR-001'];s.playerDiscard=[];s.playerHeroes.CENTER.exp_total=0;s.playerHeroes.CENTER.exp_cards=[];});
out=run('beginTributeFromHand',[0]);assert.strictEqual(out.s.pending?.type,'tribute_target');out=run('chooseHeroFromBoard',['PLAYER','CENTER']);assert.strictEqual(out.r.ok,true);assert.strictEqual(out.s.playerHeroes.CENTER.card_id,'S1-WAR-H001');assert.strictEqual(out.s.playerHeroes.CENTER.exp_total,100);

// Insufficient Mana is rejected by canonical legality before any payment or card movement.
importState(s=>{s.phase='Battle';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.playerHand=['S1-WAR-001'];s.playerDiscard=[];s.playerHeroes.CENTER.exhausted=false;setPlayerMana(s,1);});
assert.strictEqual(tutorial.getLegalPlayState('PLAYER','S1-WAR-001').can,false);const insufficientBefore=deepClone(bridge.getSnapshot().appState);out=run('beginPlayFromHand',[0]);assert.strictEqual(JSON.stringify(out.s),JSON.stringify(insufficientBefore));

// Invalid phase/card request is a canonical no-op; Candidate 3A server converts this no-op into rejection before revision commit.
importState(s=>{s.phase='Deploy';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.playerHand=['S1-WAR-001'];setPlayerMana(s,3);});
const beforeNoop=deepClone(bridge.getSnapshot().appState);out=run('beginPlayFromHand',[0]);assert.strictEqual(out.r.ok,true,'legacy bridge historically reports undefined handler return as ok');assert.strictEqual(JSON.stringify(out.s),JSON.stringify(beforeNoop),'invalid phase must not mutate canonical state');

console.log(JSON.stringify({ok:true,candidate:'PvP v3.43 Candidate 3A',canonicalRuntime:'Candidate 15 shared runtime + GL_RULES_RUNTIME',phaseTurn:true,representativePlay:{attack:'S1-WAR-001',tactical:'S1-MAG-006',item:'S1-ITM-005',event:'S1-EVT-002'},targeting:true,manaPayment:true,shardPayment:true,responseBackbone:true,tribute:true,rankUp:true,ultimateConditionalTribute:true,reposition:true,invalidActionNoMutation:true},null,2));
