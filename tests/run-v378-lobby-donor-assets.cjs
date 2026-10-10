const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),pub=path.join(root,'public');
function ok(v,m){if(!v)throw new Error(m)}
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}
const expected={
 'assets/lobby/background.webp':'487496dc5ac86b037002a196d17062da05ca925ea16253a0a9532e008bfe44b0',
 'assets/lobby/chevron-down.png':'ffb2be69858295e8dc51841c035a6d0f717447e786394f43edf9aa6abf938fac',
 'assets/lobby/exit.png':'7ab49d201942b7334867609ad6152e894b25a46fac465c461faccd177ed3bd46',
 'assets/lobby/grandis-legacy-logo.webp':'c62604a77d5307612c10e47a5eba0337d01b4bb1bb801d97dc4fe844208de8d0',
 'assets/lobby/swap.png':'b9e181e1fc207a223f2fb615ed0dc851812ef93acfedb6088a5e5b8714e9034f'
};
for(const [rel,h] of Object.entries(expected)){const p=path.join(pub,rel);ok(fs.existsSync(p),'missing lobby asset '+rel);ok(sha(p)===h,'lobby donor hash mismatch '+rel)}
const fonts={
 'engine/assets/fonts/noto-sans/NotoSans-Variable.woff2':'4204916b05eabc58243435a9ddfef2a4b88b29c4547aac811c6818695eafcb11',
 'engine/assets/fonts/noto-sans/NotoSans-Italic-Variable.woff2':'d1cd64b1d71e55d3548eacdda2235d5ce3b5c15bd8ff1b40a461442a7f819b57'
};
for(const [rel,h] of Object.entries(fonts)){const p=path.join(pub,rel);ok(fs.existsSync(p),'missing donor-identical lobby font '+rel);ok(sha(p)===h,'font donor hash mismatch '+rel)}
const css=fs.readFileSync(path.join(pub,'lobby/pvp-lobby-v3.76.6.css'),'utf8');
for(const token of [
 '.pvp-v260-lobby{font-size:13px}',
 '.pvp-v260-lobby,.pvp-v260-lobby *{font-family:"Noto Sans"!important}',
 '.pvp-seat-kick{position:static;display:grid;place-items:center;width:28px;height:28px',
 '.pvp-seat-kick img{display:block;width:16px;height:16px',
 '.pvp-progression-modal{', '.pvp-progression-card{', '.pvp-progression-row{',
 '.pvp-v260-swap-button img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none}'
]) ok(css.includes(token),'missing donor Lobby CSS dependency: '+token);
// Resolve every local url(...) in the isolated lobby stylesheet.
for(const m of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)){
 const u=m[1].trim(); if(/^(data:|https?:|\/\/)/i.test(u))continue;
 const p=path.resolve(path.dirname(path.join(pub,'lobby/pvp-lobby-v3.76.6.css')),u.split(/[?#]/)[0]);
 ok(fs.existsSync(p),'broken lobby CSS url '+u+' -> '+p);
}
const host=fs.readFileSync(path.join(pub,'pvp/pvp-host.js'),'utf8');
for(const m of host.matchAll(/["'](assets\/lobby\/[^"']+)["']/g))ok(fs.existsSync(path.join(pub,m[1])),'broken pvp-host lobby asset '+m[1]);
// v3.76.6 donor and v6.91.3 card manifest must point to the same 200 canonical card thumbnails/hashes.
const data=fs.readFileSync(path.join(pub,'engine/js/static-data.js'),'utf8');
const mm=data.match(/window\.GL_ASSET_MANIFEST=(\{.*?\});\s*(?:\n|window\.)/s);ok(mm,'GL_ASSET_MANIFEST missing');
const manifest=JSON.parse(mm[1]),cards=manifest.cards||{};ok(Object.keys(cards).length===200,'expected 200 card asset entries');
const rows=Object.keys(cards).sort().map(id=>{const x=cards[id]||{},u=x.local_thumb_path||x.thumb_url||'';ok(/^https:\/\/grandislegacytcg\.github\.io\/shared\/season1\/v1\/cards\/thumbs\/.+\.webp$/i.test(u),'unexpected canonical card url '+id+': '+u);ok(x.sha256,'missing card sha '+id);return `${id}|${u}|${x.sha256}`});
const digest=crypto.createHash('sha256').update(rows.join('\n')).digest('hex');
ok(digest==='2c9cc3f29aaf9a4144b53f91f0994dcadf474cb36310476045b4f50b269ec86e','canonical card-art manifest differs from v3.76.6 donor');
console.log('PASS v3.78 Lobby donor assets/CSS: 5 lobby assets hash-identical, 2 fonts hash-identical, 200 card URLs+hashes canonical, local CSS/JS refs resolved.');
