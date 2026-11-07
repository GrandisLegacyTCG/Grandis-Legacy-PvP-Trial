'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..','..');const read=f=>fs.readFileSync(path.join(root,f));
const json=f=>JSON.parse(read(f).toString('utf8'));const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const context={window:{}};context.globalThis=context.window;
vm.runInNewContext(read('engine/js/static-data.js').toString('utf8'),context,{timeout:25000});
vm.runInNewContext(read('engine/shared-app/active-starters.js').toString('utf8'),context,{timeout:25000});
const w=context.window;const s=json('runtime/season0-authority/season0-current-starters.dev34.json');
const sourceAssets=json('runtime/season0-authority/assets.dev44.json');
const manifest=w.GL_ASSET_MANIFEST,all=w.GL_CARD_DEFINITIONS.cards,ids=new Set(all.map(c=>c.card_id));
if(all.length!==242||ids.size!==242)throw Error('Bad S0 card registry');
if(Object.keys(manifest.cards).length!==248 || Object.keys(w.GL_ACTIVE_STARTER_DECKS).length!==5)throw Error('Bad S0 asset/starter count');
if(s.starters.length!==5||!s.consumerMayUseAsPreset)throw Error('Old provisional starter source');
for(let i=0;i<5;i++){
 const k=w.GL_ACTIVE_STARTER_SET_META.ids[i],deck=w.GL_ACTIVE_STARTER_DECKS[k].deck,src=s.starters[i];
 const mainCount=deck.main_deck.reduce((sum,c)=>sum+c.quantity,0),manaCount=deck.mana_deck.reduce((sum,c)=>sum+c.quantity,0);
 if(mainCount!==50||deck.main_deck_count!==50||manaCount!==12||deck.legacy_deck_expanded.length!==12||deck.legacy_deck_package_slots.length!==3)throw Error('Invalid S0 starter counts '+k);
 if(JSON.stringify(deck.main_deck.map(({card_id,quantity})=>({card_id,quantity})))!==JSON.stringify(src.main_deck))throw Error('Starter main not authority '+k);
 if(JSON.stringify(deck.mana_deck)!==JSON.stringify(src.mana_deck))throw Error('Starter mana not authority '+k);
 if(JSON.stringify(deck.default_formation)!==JSON.stringify(src.default_formation))throw Error('Starter formation mismatch '+k);
 if(deck.legacy_deck_package_slots.some(p=>!src.legacy_packages.some(q=>q.hero_rank_ids[0]===p.progression&&q.legacy_card_id===p.legacy)))throw Error('Starter package mismatch '+k);
 const ultimateClasses=[...new Set(deck.main_deck.filter(x=>{const c=all.find(c=>c.card_id===x.card_id);return c&&c.is_ultimate;}).map(x=>({WAR:'Warrior',MAG:'Mage',ARC:'Archer',CLE:'Cleric',THF:'Thief'})[x.card_id.split('-')[1]]))].sort();
 const manaClasses=deck.mana_deck.filter(x=>x.kind==='CLASS').map(x=>x.class_name).sort();
 if(JSON.stringify(ultimateClasses)!==JSON.stringify(manaClasses))throw Error('Incorrect Mana classes '+k);
 if(deck.main_deck.some(x=>!ids.has(x.card_id)))throw Error('Missing main card in source '+k);
 if(deck.legacy_deck_expanded.some(x=>!ids.has(x.card_id)))throw Error('Missing Hero/Legacy in source '+k);
}
const hashes=new Set();for(const [id,asset] of Object.entries(sourceAssets.frontsByCardId)){
 const e=manifest.cards[id];if(!e)throw Error('Missing art manifest entry '+id);
 const filepath=e.local_thumb_path;if(filepath!=='card-art/'+id+'.webp')throw Error('Art file not local '+id);
 const buf=read(filepath),h=sha(buf);if(h!==asset.sha256||e.sha256!==h)throw Error('S0 front art SHA mismatch '+id);hashes.add(h);
}for(const [type,asset] of Object.entries(sourceAssets.backsByDeck)){
 const file=({main:'assets/ui/back-main.webp',legacy:'assets/ui/back-legacy.webp',mana:'assets/ui/back-shard.webp'})[type];const hash=sha(read(file));if(hash!==asset.sha256)throw Error('S0 back SHA mismatch '+type);hashes.add(hash);
}
if(hashes.size!==251)throw Error('Active image SHA duplicates or missing artwork');
if(Number(w.GL_SOURCE_STACK.development_stage)!==4||w.GL_SOURCE_STACK.playability!=='UNVERIFIED')throw Error('Invalid stage/runtime status');
const s1=fs.readdirSync(path.join(root,'card-art')).filter(x=>/^S1-/.test(x));if(s1.length)throw Error('S1 fronts retained');
const app=read('engine/shared-app/app.bundle.js').toString('utf8');
if(!app.includes('Season 0 main_deck must contain exactly 50 cards')||!app.includes('c.is_ultimate===true'))throw Error('Deck/ultimate runtime guards missing');
if(!app.includes("Generic:'card-art/S0-MAN-001.webp'"))throw Error('S0 Mana UI art missing');
const ui=read('shared-app/app-runtime.js').toString('utf8');if(!ui.includes("Generic:'S0-MAN-001'"))throw Error('Shared-app S0 Mana art missing');
console.log('PASS Stage 4: 5 approved 50/12/12 starters; 248 canonical SHA-matched fronts + 3 official backs; 251 unique active SHA; 242 S0 gameplay records; local UI references; no S1 front art.');
console.log('NOT TESTED: browser boot, effect execution, local AI, match playability.');
