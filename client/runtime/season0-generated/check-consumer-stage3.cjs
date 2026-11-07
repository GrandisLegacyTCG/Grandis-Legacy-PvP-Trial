'use strict';
// Targeted QA: Stage 3 AUTHORITY DATA only. Does not test gameplay or effects.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const root=path.resolve(__dirname,'..','..');
const a=path.join(root,'runtime','season0-authority');
const ptr=JSON.parse(fs.readFileSync(path.join(a,'CURRENT_SEASON0_CONSUMERS.dev44.json'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(a,'CURRENT_SEASON0_RELEASE.dev45.json'),'utf8'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const data={};for(const [key,spec] of Object.entries(ptr.exports)){
 const raw=fs.readFileSync(path.join(a,key+'.dev44.json'));
 if(sha(raw)!==spec.sha256)throw Error('S0 source consumer SHA256 mismatch: '+key);
 data[key]=JSON.parse(raw);
}
const window={};
vm.runInNewContext(fs.readFileSync(path.join(root,'engine/js/static-data.js'),'utf8'),{window,globalThis:window}, {timeout:20000});
const defs=window.GL_CARD_DEFINITIONS, fx=window.GL_EFFECT_RECIPES;
const ids=defs.cards.map(x=>x.card_id),set=new Set(ids);
const counts=defs.cards.reduce((o,x)=>(o[x.family]=(o[x.family]||0)+1,o),{});
if(ids.length!==242||set.size!==242||fx.effect_recipes.length!==242)throw Error('Invalid S0 242-card runtime');
if(counts.Skill!==155||counts.Item!==20||counts.Event!==12||counts.Hero!==45||counts.Legacy!==10)throw Error('Invalid S0 category counts '+JSON.stringify(counts));
if(new Set([...Object.keys(window.GL_S0_MANA_FACES),...ids]).size!==248)throw Error('Invalid S0 catalog uniqueness');
if(fx.source_branch_count!==426||Object.keys(fx.compound_handler_bindings).length!==36)throw Error('Invalid effect source inventory');
if(Object.keys(data.effects.cardsById).length!==248)throw Error('Missing OSA current S0 effects');
if(Object.keys(data.assets.frontsByCardId).length!==248)throw Error('Missing OSA current S0 art refs');
if(Object.keys(data.data.catalog.counts).length!==5)throw Error('Malformed source catalog');
for(const c of defs.cards){
 if(!/^S0-/.test(c.card_id)||!data.effects.cardsById[c.card_id])throw Error('Stale/missing authority card '+c.card_id);
 if(data.effects.cardsById[c.card_id].name!==c.name)throw Error('Current S0 name mismatch '+c.card_id);
}
const byId=Object.fromEntries(defs.cards.map(c=>[c.card_id,c]));
if(byId['S0-ARC-008'].name!=='Aim Shot'||byId['S0-ARC-008'].cost.mana!==4||!byId['S0-ARC-008'].runtime_tags.includes('SURE HIT'))throw Error('S0 Aim Shot authority regression');
if(byId['S0-ARC-006'].name!=='Straight Shot'||byId['S0-ARC-006'].cost.mana!==3)throw Error('S0 Straight Shot authority regression');
if(byId['S0-THF-H003'].name!=='Finnian Copperpot')throw Error('Current corrected Hero not reflected');
if(release.pinnedAuthority.consumerAuthority.sha256!==window.GL_SOURCE_STACK.source_pointer_sha256)throw Error('S0 pointer mismatch');
const mirror=Object.values(defs.families).flatMap(f=>f.cards);if(mirror.length!==242||mirror.some(c=>JSON.stringify(c)!==JSON.stringify(byId[c.card_id])))throw Error('Card/family mirror mismatch');
const heroes=defs.cards.filter(c=>c.family==='Hero');
const reg=window.GL_HERO_COMPONENTS;const racial=Object.fromEntries(reg.racial_traits.map(c=>[c.racial_trait_id,c.definition]));
const classes=Object.fromEntries(reg.class_abilities.map(c=>[c.class_ability_id,c.definition]));
if(heroes.length!==45||heroes.filter(c=>c.hero_components.class_ability_ref).length!==30)throw Error('Hero component counts');
for(const c of heroes){const ref=c.hero_components;if(ref.component_registry_hash!==reg.registry_hash||JSON.stringify(c.racial_ability)!==JSON.stringify(racial[ref.racial_trait_ref])||JSON.stringify(c.class_ability)!==JSON.stringify(classes[ref.class_ability_ref]||null))throw Error('Hero component mismatch '+c.card_id)}
console.log('PASS: 7 SHA256-pinned S0 exports; 248 unique catalog identities; 242 runtime records; 426 S0 source branches; 36 special bindings; 45 Hero components; source-backed S0 examples.');
console.log('NOTE: No gameplay/AI/artwork/starter acceptance asserted.');
