'use strict';
const fs=require('fs'), path=require('path');
const root=path.resolve(__dirname,'..');
const readJson=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,text)=>{const p=path.join(root,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);};
const stable=(x)=>JSON.stringify(x);
const cards=readJson('data/season1/cards.runtime.v0.16.2.json');
const hero=readJson('data/season1/hero-components.runtime.v1.1.0.json');
const effects=readJson('data/season1/effect-recipes.runtime.v0.15.2.json');
const checkpoint=readJson('data/season1/effect-checkpoint.v0.15.2.json');
const source=readJson('data/config/active-runtime-source-stack.v1.94.2.json');
const starterManifest=readJson('data/starter-decks/ACTIVE_STARTERS_v1.6.1.json');
if(cards.schema_version!=='0.16.2'||cards.cards?.length!==200)throw new Error('Current Runtime Data v0.16.2 required.');
if(hero.schema_version!=='1.1.0')throw new Error('Hero Components v1.1.0 required.');
if(effects.schema_version!=='0.15.2'||effects.effect_recipes?.length!==200)throw new Error('Effect Recipe v0.15.2 required.');
if(checkpoint.effect_checkpoint_version!=='v0.15.2'&&checkpoint.schema_version!=='0.15.2')throw new Error('Effect Checkpoint v0.15.2 required.');
if(starterManifest.authority_version!=='v1.6.1'||starterManifest.active_starter_count!==5)throw new Error('Starter Authority v1.6.1 with five starters required.');
const labels=[
 'Starter 1 — Elemental Lord / Conqueror / Renegade',
 'Starter 2 — Saint / Crusader / Grand Ranger',
 'Starter 3 — Arcane Duelist / Elemental Lord / Saint',
 'Starter 4 — Grand Ranger / Grand Arbalest / Renegade',
 'Starter 5 — Renegade / Arcane Duelist / Elemental Lord'
];
const starterOptions={};
const publicPresets=[];
for(let i=0;i<starterManifest.starters.length;i++){
 const meta=starterManifest.starters[i];
 const file=path.basename(meta.canonical_path).replace(/\.json$/, '_GL_DECK_1_0.json');
 // generated names are canonical starter id + suffix, not canonical_path basename in all historical packages
 const generatedName=`${meta.starter_id}_GL_DECK_1_0.json`;
 const deck=readJson(`data/starter-decks/active/${generatedName}`);
 if(deck.active_starter_id!==meta.starter_id)throw new Error(`Starter identity mismatch: ${meta.starter_id}`);
 const total=(deck.main_deck||[]).reduce((n,e)=>n+Number(e.quantity||0),0);
 if(total!==60||Number(deck.legacy_deck_count)!==12)throw new Error(`Starter totals invalid: ${meta.starter_id}`);
 const compat=JSON.parse(JSON.stringify(deck));
 compat.preset_id=meta.starter_id; compat.display_name=labels[i];
 if(!Array.isArray(compat.main_deck_expanded)) compat.main_deck_expanded=(compat.main_deck||[]).flatMap(e=>Array.from({length:Number(e.quantity||0)},()=>({card_id:e.card_id,card_name:e.card_name||'',quantity:1})));
 starterOptions[meta.starter_id]={label:labels[i],file:`starter_deck_examples/${generatedName}`,deck:compat};
 publicPresets.push(compat);
}
const ASSET_ROOT='https://grandislegacytcg.github.io/shared/season1/v1/';
const assetCards={};
for(const c of cards.cards){
 const url=`${ASSET_ROOT}cards/thumbs/${encodeURIComponent(c.card_id)}.webp`;
 assetCards[c.card_id]={card_id:c.card_id,thumb_url:url,full_url:url,local_thumb_exists:false,local_full_exists:false,fallback_thumb_url:`${ASSET_ROOT}cards/ui/Back-of-Card-Main-Deck.webp`,sha256:c.asset&&c.asset.sha256||null,canonical_hash:c.canonical_hash||null,status:'canonical-remote'};
}
const manifest={schema_version:'GL-ASSET-MANIFEST-REMOTE-1.0',asset_root:ASSET_ROOT,authority:'Website v1.31 shared/season1/v1 read-only host',cards:assetCards,counts:{cards:200,webp_card_thumbs:200,cards_with_local_thumb:0,cards_missing_any_thumb:0},ui:{main_deck_card_back:`${ASSET_ROOT}cards/ui/Back-of-Card-Main-Deck.webp`,legacy_deck_card_back:`${ASSET_ROOT}cards/ui/Back-of-Card-Legacy-Deck.webp`,racial_token_head:`${ASSET_ROOT}cards/ui/Racial-Token-Head.webp`,racial_token_tail:`${ASSET_ROOT}cards/ui/Racial-Token-Tail.webp`,mana_shard:`${ASSET_ROOT}cards/ui/Mana-Shard-Thumb.webp`},mana_shards:{Generic:`${ASSET_ROOT}mana-shards/Generic.webp`,Warrior:`${ASSET_ROOT}mana-shards/Warrior.webp`,Mage:`${ASSET_ROOT}mana-shards/Mage.webp`,Archer:`${ASSET_ROOT}mana-shards/Archer.webp`,Cleric:`${ASSET_ROOT}mana-shards/Cleric.webp`,Thief:`${ASSET_ROOT}mana-shards/Thief.webp`}};
const previewCards=cards.cards.map(c=>({card_id:c.card_id,name:c.name,family:c.family,classification:c.classification,printed:c.printed||{name:c.name,text:c.card_text||c.effect_text||'',rows:[],blocks:[],footers:[]},review_rows:((c.printed&&c.printed.rows)||[]).map(r=>({row_id:r.row_id||'',label:r.label||'',damage_text:'',effect_text:r.text||'',text:r.text||''})),cost:c.cost||{},cost_display:c.cost_display||'',asset:c.asset||null,canonical_hash:c.canonical_hash||null}));
const preview={schema_version:'0.16.2',generated_from:'cards.runtime.v0.16.2.json',canonical_registry_hash:cards.canonical_registry_hash,hero_component_registry_hash:cards.hero_component_registry_hash,generated_only:true,count:previewCards.length,data_type:'printed_preview',cards:previewCards};
const stack={source_authority_stack_bundle:'v1.9.5',runtime_foundation:'v1.94.2',runtime_core:'v0.61',shared_manual:'v1.49',local_ai:'v6.42',tutorial:'v0.68',pvp_railway:'v3.43-candidate2',runtime_data:'v0.16.2',effect_checkpoint:'v0.15.2',effect_recipe:'v0.15.2',canonical_card_authority:'v1.6.0',starter60:'v1.6.1',ui_lock:'v2.53',application_runtime_sync:'v2.63',one_source_authority:'v1.9.5',hero_component_authority:'v1.1.0',canonical_registry_hash:cards.canonical_registry_hash,hero_component_registry_hash:hero.registry_hash,card_count:200,active_starter_count:5,pvp_candidate:'v3.43 Candidate 2',release_ready:false,shared_asset_root:ASSET_ROOT,authority_mode:'ONE_SOURCE_FAIL_CLOSED',generated_file:'js/static-data.js',resource_terminology:{deck:'Shard Deck',standard_shard:'Mana Shard',class_shard:'Class Shard',pool:'Shard Pool'}};
const ready={canonical_registry_hash:cards.canonical_registry_hash,hero_component_registry_hash:hero.registry_hash,card_count:200,hero_component_counts:{racial_traits:hero.racial_traits.length,class_abilities:hero.class_abilities.length,hero_profiles:hero.hero_profiles.length,hero_compositions:hero.hero_compositions.length},schema_version:'0.16.2',runtime_data:'v0.16.2',effect_recipe:'v0.15.2',effect_checkpoint:'v0.15.2',starter_authority:'v1.6.1',active_starter_count:5,source_authority:'v1.9.5',application_runtime_sync:'v2.63'};
const lines=["'use strict';","(function(window){",`window.GL_SHARED_ASSET_ROOT=${stable(ASSET_ROOT)};`,`window.GL_SOURCE_STACK=${stable(stack)};`,`window.GRANDIS_LEGACY_RUNTIME_DATA=${stable(cards)};`,`window.GRANDIS_LEGACY_CARD_PREVIEW=${stable(preview)};`,`window.GRANDIS_LEGACY_HERO_COMPONENTS=${stable(hero)};`,`window.GL_HERO_COMPONENTS=window.GRANDIS_LEGACY_HERO_COMPONENTS;`,`window.GL_CARD_DEFINITIONS=${stable(cards)};`,`window.GL_EFFECT_RECIPES=${stable(effects)};`,`window.GL_EFFECT_CHECKPOINT=${stable(checkpoint)};`,`window.GL_ASSET_MANIFEST=${stable(manifest)};`,`window.GL_PVP_STARTER_DECK_OPTIONS=${stable(starterOptions)};`,`window.GRANDIS_LEGACY_ONE_SOURCE_READY=${stable(ready)};`,`})(typeof window!=='undefined'?window:globalThis);`,'' ];
write('public/js/static-data.js',lines.join('\n'));
write('data/season1/card-preview.generated.v0.16.2.json',JSON.stringify(preview,null,2)+'\n');
const oldPreview=path.join(root,'data/season1/card-preview.generated.v1.5.0.json'); if(fs.existsSync(oldPreview))fs.unlinkSync(oldPreview);
const combined={version:'Starter Deck Authority v1.6.1 / PvP Candidate 2 compatibility consumer',starter_authority_version:'v1.6.1',source_authority:'v1.9.5',count:5,presets:publicPresets,generated_only:true,source:'data/starter-decks/active exact OSA v1.9.5 generated files'};
write('public/starter_deck_examples/Grandis_Legacy_Starter_Deck_Presets_v1.6.1_PvP.json',JSON.stringify(combined,null,2)+'\n');
console.log(`PASS: generated current PvP browser data: ${cards.cards.length} cards, ${Object.keys(starterOptions).length} starters, remote asset manifest ${Object.keys(assetCards).length} cards.`);
