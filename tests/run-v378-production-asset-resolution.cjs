'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const R=path.resolve(__dirname,'..'),PUB=path.join(R,'public');
const read=p=>fs.readFileSync(path.join(R,p),'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const existsRel=p=>fs.existsSync(path.join(PUB,p));
const norm=p=>p.replace(/\\/g,'/').replace(/^\.\//,'');
function fileList(dir){const out=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else out.push(p)}}walk(dir);return out;}
function treeDigest(rel,filter=()=>true){const dir=path.join(PUB,rel),rows=[];for(const p of fileList(dir)){const rp=path.relative(dir,p).replace(/\\/g,'/');if(filter(rp))rows.push(`${rp}\0${fs.statSync(p).size}\0${sha(p)}\n`)}rows.sort();return {count:rows.length,sha256:crypto.createHash('sha256').update(rows.join('')).digest('hex')}}

const html=read('public/index.html');
const cssRefs=[...html.matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["']/gi)].map(m=>m[1].split(/[?#]/)[0]);
const jsRefs=[...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)].map(m=>m[1].split(/[?#]/)[0]);
const brokenHtml=[...cssRefs,...jsRefs].filter(x=>!/^https?:|^data:/.test(x)&&!existsRel(norm(x)));
assert.deepStrictEqual(brokenHtml,[],`Broken loaded HTML refs: ${brokenHtml.join(', ')}`);

const brokenCss=[];let cssUrls=0;
for(const ref of cssRefs){if(/^https?:|^data:/.test(ref))continue;const abs=path.join(PUB,ref),text=fs.readFileSync(abs,'utf8');for(const m of text.matchAll(/url\(\s*(["']?)([^)"']+)\1\s*\)/gi)){let u=m[2].trim();if(!u||/^(?:data:|https?:|#)/i.test(u))continue;u=u.split(/[?#]/)[0];cssUrls++;const target=path.resolve(path.dirname(abs),decodeURIComponent(u));if(!fs.existsSync(target))brokenCss.push({css:ref,url:u,resolved:path.relative(PUB,target).replace(/\\/g,'/')})}}
assert.deepStrictEqual(brokenCss,[],`Broken CSS refs: ${JSON.stringify(brokenCss)}`);

// These are the actual PvP integration files that generate local URLs at runtime.
// The v6 bundle's standalone-lobby code is intentionally not used by PvP; gameplay media
// literals under engine/assets are still audited below.
const integrationFiles=['public/pvp/pvp-host.js','public/shared-app/app-runtime.js'];
const localLitRe=/["']((?:engine\/assets|assets\/(?:ui|shards|lobby)|card-art)\/[^"'\n\r]+?\.(?:png|webp|jpg|jpeg|svg|mp3|wav|ogg|woff2?))(?:\?[^"']*)?["']/gi;
const brokenIntegration=[];let integrationRefs=0;
for(const f of integrationFiles){const text=read(f);for(const m of text.matchAll(localLitRe)){const u=m[1];if(u.includes("'+")||u.includes('+"'))continue;integrationRefs++;if(!existsRel(u))brokenIntegration.push({file:f,url:u})}}
assert.deepStrictEqual(brokenIntegration,[],`Broken active integration asset refs: ${JSON.stringify(brokenIntegration)}`);

const v6Bundle=read('public/engine/shared-app/app.bundle.js');
const engineMedia=[...new Set([...v6Bundle.matchAll(/["'](engine\/assets\/[^"'\n\r]+?\.(?:png|webp|mp3|wav|ogg|woff2?))(?:\?[^"']*)?["']/gi)].map(m=>m[1]))];
const brokenEngine=engineMedia.filter(x=>!existsRel(x));
assert.deepStrictEqual(brokenEngine,[],`Broken loaded v6 engine media refs: ${brokenEngine.join(', ')}`);
// The locked donor bundle also contains its own standalone/native Lobby + native counter-renderer
// fallbacks. PvP explicitly disables those presentation owners (external human UI + render suppression),
// so they are not active URL calls. Keep them visible in the audit instead of silently pretending
// every string literal in the loaded donor bundle is an active request.
const dormantDonorRefs=['assets/lobby/Swap.png','assets/counters/Counter-{1..6}.png'];
assert.ok(v6Bundle.includes('assets/lobby/Swap.png'),'Expected locked-donor standalone Lobby fallback changed');
assert.ok(v6Bundle.includes("return 'assets/counters/Counter-'+value+'.png'"),'Expected locked-donor native counter fallback changed');
const integrationRuntime=read('public/shared-app/app-runtime.js');
assert.ok(integrationRuntime.includes('B().setExternalHumanUi?.(true)'),'PvP must keep donor standalone human UI inactive');
assert.ok(integrationRuntime.includes('B().setRenderSuppressed(true)'),'PvP must keep donor native renderer suppressed');

// Exact donor asset-tree fingerprints generated from locked VS AI v6.91.3.
const trees={
  cardArt:treeDigest('card-art'),
  engineAssets:treeDigest('engine/assets'),
  v6Assets:treeDigest('assets',rp=>!rp.startsWith('lobby/'))
};
assert.deepStrictEqual(trees.cardArt,{count:200,sha256:'b881c200f0915f0b930a8ffa3759f16bd4f847805696d216a519eb7a04f62e64'});
assert.deepStrictEqual(trees.engineAssets,{count:36,sha256:'4ce74e3e1b6ae13d67f2017e4bbf5a84f831f10f42ed779e2281693dbd384844'});
assert.deepStrictEqual(trees.v6Assets,{count:32,sha256:'95b53dce20c1bac3c23075d9cb56d03a151b45a275a4142bfd241f15ff1afd73'});

// Exact locked v3.76.6 Lobby asset fingerprints.
const lobbyExpected={
 'assets/lobby/grandis-legacy-logo.webp':'c62604a77d5307612c10e47a5eba0337d01b4bb1bb801d97dc4fe844208de8d0',
 'assets/lobby/background.webp':'487496dc5ac86b037002a196d17062da05ca925ea16253a0a9532e008bfe44b0',
 'assets/lobby/swap.png':'b9e181e1fc207a223f2fb615ed0dc851812ef93acfedb6088a5e5b8714e9034f',
 'assets/lobby/exit.png':'7ab49d201942b7334867609ad6152e894b25a46fac465c461faccd177ed3bd46',
 'assets/lobby/chevron-down.png':'ffb2be69858295e8dc51841c035a6d0f717447e786394f43edf9aa6abf938fac'
};
for(const [rel,h] of Object.entries(lobbyExpected)){const p=path.join(PUB,rel);assert.ok(fs.existsSync(p),`Missing Lobby asset ${rel}`);assert.strictEqual(sha(p),h,`Lobby donor hash mismatch ${rel}`)}

// Every dynamic local URL generated by the approved external game UI must resolve too.
const cards=fileList(path.join(PUB,'card-art')).filter(p=>p.endsWith('.webp'));
assert.strictEqual(cards.length,200);
for(const p of cards)assert.ok(fs.statSync(p).size>0,`Empty card art: ${p}`);
const dynamicPaths=[
  ...['Generic','Archer','Cleric','Mage','Thief','Warrior'].map(x=>`assets/shards/${x}.webp`),
  ...['Bleed','Burn','Freeze','Poison','Stun'].map(x=>`engine/assets/status-icons/Icon-${x}.png`),
  ...[1,2,3,4,5,6].map(x=>`engine/assets/counters/Counter-${x}.png`),
  'engine/assets/exp/Stack 100-200EXP.png',
  'engine/assets/audio/Card Sound.mp3','engine/assets/audio/Coin Flip.mp3',
  'assets/ui/Racial-Token-Head.webp','assets/ui/Racial-Token-Tail.webp','assets/ui/back-main.webp','assets/ui/back-shard.webp','assets/ui/back-legacy.webp'
];
const brokenDynamic=dynamicPaths.filter(x=>!existsRel(x));
assert.deepStrictEqual(brokenDynamic,[],`Broken dynamic UI asset paths: ${brokenDynamic.join(', ')}`);

const report={ok:true,loadedStylesheets:cssRefs,loadedScripts:jsRefs,htmlRefsChecked:cssRefs.length+jsRefs.length,brokenHtmlRefs:0,cssLocalUrlsChecked:cssUrls,brokenCssUrls:0,activeIntegrationAssetLiteralsChecked:integrationRefs,brokenActiveIntegrationAssetRefs:0,v6EngineMediaLiteralsChecked:engineMedia.length,brokenV6EngineMediaRefs:0,dynamicRuntimeAssetPathsChecked:dynamicPaths.length,brokenDynamicRuntimeAssetPaths:0,v6DonorAssetTrees:trees,lobbyAssetsHashIdentical:Object.keys(lobbyExpected).length,cardArtRuntimeFiles:cards.length,dormantLockedDonorFallbackRefs:dormantDonorRefs,canonicalLobbyCardResolver:'cardView() / donor canonical manifest (remote website URLs where specified by donor)',browserNetworkSmoke:'BLOCKED_BY_ADMINISTRATOR'};
fs.writeFileSync(path.join(R,'release','V378_ACTIVE_ASSET_RESOLUTION_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
