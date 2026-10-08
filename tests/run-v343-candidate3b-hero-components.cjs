'use strict';
const fs=require('fs');const path=require('path');
const {loadCandidate3aRuntime}=require('./candidate3a-runtime-harness.cjs');
const ROOT=path.resolve(__dirname,'..');
const hc=JSON.parse(fs.readFileSync(path.join(ROOT,'data/season1/hero-components.runtime.v1.1.0.json'),'utf8'));
const cards=JSON.parse(fs.readFileSync(path.join(ROOT,'data/season1/cards.runtime.v0.16.2.json'),'utf8')).cards;
function ok(v,m){if(!v)throw new Error(m)}
const racial=new Map(hc.racial_traits.map(x=>[x.racial_trait_id,x]));
const cls=new Map(hc.class_abilities.map(x=>[x.class_ability_id,x]));
ok(hc.racial_traits.length===6,'Expected 6 canonical Racial Traits');
ok(hc.class_abilities.length===16,'Expected 16 canonical Class Abilities');
ok(hc.hero_profiles.length===10,'Expected 10 Hero profiles');
ok(hc.hero_compositions.length===30,'Expected 30 Hero compositions');
for(const c of hc.hero_compositions){
  ok(racial.has(c.racial_trait_ref),`${c.card_id} missing canonical racial trait ${c.racial_trait_ref}`);
  if(c.class_ability_ref) ok(cls.has(c.class_ability_ref),`${c.card_id} missing canonical class ability ${c.class_ability_ref}`);
}
const quick=cls.get('CLASS-ARBALEST-QUICK-RELOAD');
const rapid=cls.get('CLASS-GRAND-ARBALEST-RAPID-CHAMBER');
ok(quick?.definition?.action?.type==='draw_replacement','Quick Reload canonical draw-replacement definition missing');
ok(rapid?.definition?.action?.effect?.draw_replacement_shuffle_redraw===true,'Rapid Chamber canonical draw-replacement behavior missing');
ok(!fs.existsSync(path.join(ROOT,'runtime/pvp/draw-review-runtime.mjs')),'Duplicate PvP draw-review rule authority still active');
const server=fs.readFileSync(path.join(ROOT,'server.js'),'utf8');
ok(server.includes("runtimeIntentName = 'commitDrawReplacementChoice'"),'PvP transport must alias confirmDrawReplacement to canonical commitDrawReplacementChoice');
const legacy=cards.filter(c=>c.family==='LegacyModeDefinition');
ok(legacy.length===10,'Expected 10 canonical Legacy Mode definitions');
for(const c of legacy){ok(c.canonical_execution?.ability?.action_key,`${c.card_id} missing canonical Legacy ability`);}
const {window}=loadCandidate3aRuntime(ROOT);
const heroQa=window.GL_V642_FINAL_STABILITY_HERO_COMPONENT_QA_SELF_TEST();
ok(heroQa?.ok,`Hero Component runtime QA failed: ${JSON.stringify(heroQa)}`);
const racialQa=window.GL_HERO_RACIAL_EFFECT_FIX_QA_SELF_TEST();
ok(racialQa?.ok,`Racial Trait runtime QA failed: ${JSON.stringify(racialQa)}`);
console.log(`PASS Candidate 3B Hero Components: ${hc.hero_compositions.length} hero compositions, ${hc.class_abilities.length} class abilities, ${hc.racial_traits.length} racial traits, ${legacy.length} Legacy definitions; Draw Review uses canonical runtime.`);
