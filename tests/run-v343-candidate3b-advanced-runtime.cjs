'use strict';
const fs=require('fs');const path=require('path');const assert=require('assert');
const statusEngine=require('../runtime/engines/status-engine.js');
const {loadCandidate3aRuntime,deepClone,setPlayerMana}=require('./candidate3a-runtime-harness.cjs');
const ROOT=path.resolve(__dirname,'..');
const cards=JSON.parse(fs.readFileSync(path.join(ROOT,'data/season1/cards.runtime.v0.16.2.json'),'utf8'));
const recipes=JSON.parse(fs.readFileSync(path.join(ROOT,'data/season1/effect-recipes.runtime.v0.15.2.json'),'utf8'));

// Discover the current canonical Status vocabulary from runtime data rather than treating prompt examples as a closed list.
const discovered=new Set();
function walk(x){if(Array.isArray(x))return x.forEach(walk);if(!x||typeof x!=='object')return;for(const [k,v] of Object.entries(x)){if(['status','status_name','apply_status','inflict_status'].includes(k.toLowerCase())&&typeof v==='string')discovered.add(v);walk(v)}}
walk(cards);walk(recipes);
assert.deepStrictEqual([...discovered].sort(),['Bleed','Burn','Freeze','Poison','Stun']);
for(const name of ['Poison','Burn','Freeze','Stun']){let x=statusEngine.mergeStatusList([],{status:name,duration_turns:1});x=statusEngine.mergeStatusList(x,{status:name,duration_turns:2});assert.strictEqual(statusEngine.duration(x[0]),3,`${name} additive duration`)}
let bleed=statusEngine.mergeStatusList([],{status:'Bleed',duration_turns:2});bleed=statusEngine.mergeStatusList(bleed,{status:'Bleed',duration_turns:1});assert.strictEqual(statusEngine.duration(bleed[0]),2,'Bleed keeps higher duration');

const {window,bridge,tutorial}=loadCandidate3aRuntime(ROOT);
function qa(name){const r=window[name]();assert.ok(r&&r.ok,`${name}: ${JSON.stringify(r)}`);return r;}
const release=qa('GL_V642_RELEASE_QA_SELF_TEST');
for(const key of ['freezeBombPlayer','freezeBombAI','freezeManualReposition','freezeSkillMovement','freezeDodge','freezeBlock','freezeAutoCenter','freezeDuration','freezeStacking','tripleShotNoBinding','tripleShotThisTurnLifecycle','blindHandSelection','blindSelection']) assert.strictEqual(release[key],true,`V642 ${key}`);
assert.strictEqual(release.whirlwind,50,'Whirlwind canonical damage regression');
const hero=qa('GL_V642_FINAL_STABILITY_HERO_COMPONENT_QA_SELF_TEST');assert.deepStrictEqual(Array.from(hero.separateResponses),['LEFT','CENTER','RIGHT']);assert.strictEqual(hero.tripleShotDiscardOnce,true);
const attachment=qa('GL_V513_ATTACHMENT_INTEGRATION_QA_SELF_TEST');assert.ok(attachment.attachmentItems>=5);
const casting=qa('GL_V545_CASTING_UI_QA_SELF_TEST');assert.strictEqual(casting.releaseDamage,80);assert.strictEqual(casting.rankUpPreservedCasting,true);
qa('GL_PHASE20_POISON_VIAL_MULTIHIT_QA_SELF_TEST');qa('GL_V613_POISON_GAMEOVER_QA_SELF_TEST');qa('GL_PHASE12_CASTING_DEFEAT_CANCEL_QA_SELF_TEST');const popup=qa('GL_V381_POPUP_ATTACHMENT_POLICY_QA_SELF_TEST');assert.strictEqual(popup.hiddenInfoLocked,true);const legacyQa=qa('GL_LEGACY_RACIAL_TAUNT_QA_SELF_TEST');assert.strictEqual(legacyQa.searchShuffle,true);const revealQa=qa('GL_V546_FIX_QA_SELF_TEST');assert.strictEqual(revealQa.sequentialDrawReveal,true);const attackLabelQa=qa('GL_LOCAL_AI_V534_TACTICAL_AI_QA_SELF_TEST');assert.strictEqual(attackLabelQa.blessingMightRequiresBuffedHeroPhysicalAttack,true);assert.strictEqual(attackLabelQa.blessingWisdomRequiresBuffedHeroMagicalAttack,true);

// Current canonical bridge: representative Response is server/runtime-owned; pass resolves authoritative damage.
const deckA='starter_01_elemental_lord_conqueror_renegade',deckB='starter_02_saint_crusader_grand_ranger';
bridge.startSharedMatch({playerDeckKey:deckA,aiDeckKey:deckB,firstPlayerSide:'PLAYER'});const opened=bridge.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'});const baseline=deepClone(opened.snapshot);
function imp(mut){const snap=deepClone(baseline);mut(snap.appState);assert.strictEqual(bridge.importCanonicalSnapshot(snap,1,{notice:'',skipImportAnimations:true}),true)}
function run(name,args=[]){const r=bridge.applyServerIntent(name,args);return {r,s:(r.snapshot||bridge.getSnapshot()).appState}}
imp(s=>{s.phase='Battle';s.turn='PLAYER';s.round=2;s.pending=null;s.responseWindow=null;s.playerHand=['S1-WAR-001'];s.playerDiscard=[];s.playerHeroes.CENTER.exhausted=false;setPlayerMana(s,3)});
let o=run('beginPlayFromHand',[0]);assert.strictEqual(o.r.ok,true);o=run('chooseHeroFromBoard',['PLAYER','CENTER']);assert.strictEqual(o.r.ok,true);o=run('chooseHeroFromBoard',['AI','CENTER']);assert.strictEqual(o.r.ok,true);assert.strictEqual(o.s.responseWindow?.response_owner,'AI');const before=o.s.aiHeroes.CENTER.hp;const canonical=bridge.getCanonicalSnapshot(1);assert.strictEqual(bridge.importCanonicalSnapshot(canonical,2,{notice:'',skipImportAnimations:true}),true);o=run('responsePassNoStuck');assert.strictEqual(o.r.ok,true);assert.ok(bridge.getCanonicalSnapshot(2).appState.aiHeroes.CENTER.hp<before);assert.strictEqual(bridge.getCanonicalSnapshot(2).appState.responseWindow,null);

// Blessing is not a canonical Status record in v0.16.2; it is canonical card/Attachment behavior. Verify its canonical hooks remain in the shared runtime.
const app=fs.readFileSync(path.join(ROOT,'public/js/app.bundle.js'),'utf8');assert.ok(app.includes("activeAttachmentForSide(state,targetSide,'S1-CLE-025')"),'Blessing of Divinity damage-immunity hook');assert.ok(app.includes('Blessing of Divinity prevents') && app.includes("card_id:'S1-CLE-025'"),'Blessing of Divinity canonical attachment behavior');
const manaAudit=bridge.testPlaytestManaRules();assert.strictEqual(manaAudit.ok,true,manaAudit.reason||'mana audit failed');assert.strictEqual(manaAudit.paymentBatchOrder,true);console.log(JSON.stringify({ok:true,candidate:'PvP v3.43 Candidate 3B',statuses:[...discovered].sort(),blessingClassification:'canonical Attachment/effect (not a Status record)',advancedResponse:true,sequentialAreaResponses:hero.separateResponses,attachment:true,casting:true,searchRevealAndBlind:true,searchShuffle:legacyQa.searchShuffle,sequentialReveal:revealQa.sequentialDrawReveal,attackVsDamage:true,tripleShot:true,whirlwind:release.whirlwind,ultimateShardReturnBatch:true,viewerSafe:true},null,2));
