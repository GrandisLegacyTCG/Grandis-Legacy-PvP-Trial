'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),pub=path.join(root,'public'),parity=JSON.parse(fs.readFileSync(path.join(root,'release/V380_DONOR_PARITY.json'),'utf8'));
const norm=p=>p.split(path.sep).join('/');
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const a=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(a));else if(e.isFile())out.push(a)}return out}
function treeFingerprint(dir){const rows=[];for(const f of walk(dir).sort()){const rel=norm(path.relative(dir,f)),b=fs.readFileSync(f);rows.push(`${rel}\0${crypto.createHash('sha256').update(b).digest('hex')}\0${b.length}`)}return crypto.createHash('sha256').update(rows.join('\n')).digest('hex')}
for(const [name,row] of Object.entries(parity.exact_v6914_trees)){
  const dirName=name==='assets_v6914_subset'?'assets':name;
  if(name==='assets_v6914_subset'){
    const dir=path.join(pub,'assets'),rows=[];for(const f of walk(dir).filter(f=>!norm(path.relative(dir,f)).startsWith('lobby/')).sort()){const rel=norm(path.relative(dir,f)),b=fs.readFileSync(f);rows.push(`${rel}\0${crypto.createHash('sha256').update(b).digest('hex')}\0${b.length}`)}const fp=crypto.createHash('sha256').update(rows.join('\n')).digest('hex');assert.equal(rows.length,row.files,'v6.91.4 assets subset file count mismatch');assert.equal(fp,row.donor_fingerprint,'v6.91.4 assets subset donor fingerprint mismatch');continue;
  }
  const dir=path.join(pub,dirName);assert.ok(fs.existsSync(dir),`${dirName} tree missing`);assert.equal(treeFingerprint(dir),row.donor_fingerprint,`${dirName} donor tree fingerprint mismatch`);
}
const cardFiles=walk(path.join(pub,'card-art')).filter(f=>f.endsWith('.webp'));assert.equal(cardFiles.length,200,'must package all 200 Season 1 local WebP card arts');
const html=fs.readFileSync(path.join(pub,'index.html'),'utf8');
const localRef=/\b(?:src|href)=["']([^"']+)["']/g;let m,htmlBroken=[];
while((m=localRef.exec(html))){let ref=m[1];if(/^(?:https?:|data:|#|javascript:)/i.test(ref))continue;ref=ref.split(/[?#]/)[0];if(!ref)continue;if(!fs.existsSync(path.resolve(pub,ref)))htmlBroken.push(ref)}
assert.deepEqual(htmlBroken,[],'index.html contains broken local asset/script/style refs: '+htmlBroken.join(', '));
let cssBroken=[];
for(const f of walk(pub).filter(x=>x.endsWith('.css'))){const text=fs.readFileSync(f,'utf8'),re=/url\((?:["']?)([^)"']+)(?:["']?)\)/g;let x;while((x=re.exec(text))){let ref=x[1].trim();if(/^(?:https?:|data:|#)/i.test(ref))continue;ref=ref.split(/[?#]/)[0];const abs=path.resolve(path.dirname(f),ref);if(!fs.existsSync(abs))cssBroken.push(`${norm(path.relative(pub,f))} -> ${ref}`)}}
assert.deepEqual(cssBroken,[],'CSS contains broken local url(): '+cssBroken.join(', '));
const app=fs.readFileSync(path.join(pub,'shared-app/app-runtime.js'),'utf8'),host=fs.readFileSync(path.join(pub,'pvp/pvp-host.js'),'utf8');
assert.match(app,/function art\(id\)\{return id\?'card-art\/'/,'visible v6 card art resolver must be local');
assert.match(app,/function shardArt\(sh\).*assets\/shards\//s,'visible v6 Shard resolver must be local');
assert.match(app,/assets\/ui\/back-main\.webp/);assert.match(app,/assets\/ui\/back-shard\.webp/);assert.match(app,/assets\/ui\/Racial-Token-Head\.webp/);assert.match(app,/assets\/ui\/Racial-Token-Tail\.webp/);
assert.match(host,/function cardSrc\(id\)\{return localCardArt\(id\)\}/,'Lobby hero preview must use packaged card-art, not donor CDN');
assert.match(host,/if\(prop==='cardView'\).*thumb:local,full:local/s,'PvP cardView facade must rewrite visible card URLs to local packaged WebP');
assert.match(host,/if\(prop==='manaAsset'\)return sh=>localManaArt\(sh\)/,'PvP manaAsset facade must rewrite visible shard URLs locally');
assert.match(host,/skipImportAnimations:true/,'native bridge import animation must stay disabled to avoid duplicate/CDN presentation');
const required=[
 'assets/ui/Background.png','assets/ui/back-main.webp','assets/ui/back-shard.webp','assets/ui/back-legacy.webp','assets/ui/Racial-Token-Head.webp','assets/ui/Racial-Token-Tail.webp',
 ...['Archer','Cleric','Generic','Mage','Thief','Warrior'].map(n=>`assets/shards/${n}.webp`),
 'engine/assets/audio/Card Sound.mp3','engine/assets/audio/Coin Flip.mp3','engine/assets/audio/battle/Dodge.mp3','engine/assets/audio/battle/Heal.mp3','engine/assets/audio/battle/M.Atk.mp3','engine/assets/audio/battle/M.Def.mp3','engine/assets/audio/battle/P.Atk.mp3','engine/assets/audio/battle/P.Def.mp3'
];
for(const rel of required)assert.ok(fs.existsSync(path.join(pub,rel)),`required active media missing: ${rel}`);
// The exact donor engine is allowed to retain dormant website URLs. They are not the active standalone resolver:
// render is suppressed on the donor bridge, authoritative imports are silent, and visible card/shard URLs are overridden above.
console.log(JSON.stringify({ok:true,cardArt:`${cardFiles.length}/200`,htmlBroken:0,cssBroken:0,requiredActiveMedia:required.length,visibleCardResolver:'local package',visibleShardResolver:'local package',donorCdnStrings:'dormant/allowed inside exact donor engine'},null,2));
