'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),ok=(v,m)=>{if(!v)throw new Error(m)};
const cards=JSON.parse(fs.readFileSync(path.join(root,'data/season1/cards.runtime.v0.16.2.json'),'utf8')).cards;
const sandbox={window:{},globalThis:{}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'public/js/static-data.js'),'utf8'),sandbox);const m=sandbox.window.GL_ASSET_MANIFEST,assetRoot=sandbox.window.GL_SHARED_ASSET_ROOT;
ok(assetRoot==='https://grandislegacytcg.github.io/shared/season1/v1/','Shared asset root mismatch');ok(Object.keys(m.cards||{}).length===200,'Asset manifest card count mismatch');
for(const c of cards){const e=m.cards[c.card_id];ok(e,'Missing asset mapping '+c.card_id);ok(e.thumb_url===assetRoot+'cards/thumbs/'+c.card_id+'.webp','Non-canonical remote URL '+c.card_id);ok(e.local_thumb_exists===false&&e.local_full_exists===false,'False local asset authority '+c.card_id);ok(!e.local_thumb_path&&!e.local_full_path,'Broken local path retained '+c.card_id);}
ok(!fs.existsSync(path.join(root,'public/assets/cards/thumbs')),'PvP must not duplicate the 200 card thumbnails');
const heroIds=cards.filter(c=>c.family==='Hero').map(c=>c.card_id);ok(heroIds.length===30,'Expected 30 Hero cards, got '+heroIds.length);
let websiteValidated=false;const site=process.env.GL_WEBSITE_SOURCE;
if(site){const thumbs=path.join(site,'shared/season1/v1/cards/thumbs');ok(fs.existsSync(thumbs),'Website shared thumbnail source missing');const files=new Set(fs.readdirSync(thumbs).filter(x=>x.endsWith('.webp')));ok(files.size===200,'Website expected exactly 200 card thumbnails, found '+files.size);for(const c of cards)ok(files.has(c.card_id+'.webp'),'Website missing '+c.card_id+'.webp');for(const id of heroIds)ok(files.has(id+'.webp'),'Website missing Hero '+id);for(const f of ['Back-of-Card-Main-Deck.webp','Back-of-Card-Legacy-Deck.webp','Racial-Token-Head.webp','Racial-Token-Tail.webp','Mana-Shard-Thumb.webp'])ok(fs.existsSync(path.join(site,'shared/season1/v1/cards/ui',f)),'Website missing UI asset '+f);websiteValidated=true;}
console.log(JSON.stringify({ok:true,assetRoot,cards:200,heroes:30,localDuplicateThumbs:false,falseLocalAuthority:false,websiteSourceValidated:websiteValidated},null,2));
