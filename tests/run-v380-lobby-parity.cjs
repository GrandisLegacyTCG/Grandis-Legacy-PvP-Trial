'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),parity=JSON.parse(fs.readFileSync(path.join(root,'release/V380_DONOR_PARITY.json'),'utf8'));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
for(const [name,row] of Object.entries(parity.lobby_assets)){
 const file=path.join(root,'public/assets/lobby',name);assert.ok(fs.existsSync(file),`Lobby asset missing: ${name}`);assert.equal(sha(file),row.donor_sha256,`Lobby donor hash mismatch: ${name}`);
}
const css=fs.readFileSync(path.join(root,'public/lobby/pvp-lobby-v3.76.6.css'),'utf8'),host=fs.readFileSync(path.join(root,'public/pvp/pvp-host.js'),'utf8');
assert.match(css,/font-family:\s*"Noto Sans"/i,'Lobby must keep donor Noto Sans metrics');
assert.match(css,/\.pvp-v260-lobby\{font-size:13px\}/,'Lobby base font must remain 13px');
assert.match(css,/\.pvp-seat-kick\{[^}]*width:28px;[^}]*height:28px/s,'Kick button must be 28x28 on desktop');
assert.match(css,/\.pvp-seat-kick img\{[^}]*width:16px;height:16px/s,'Kick icon must be 16x16');
assert.match(css,/\.pvp-v260-actions \.pvp-v260-btn\{white-space:nowrap\}/,'JOIN AS PLAYER must stay on one line');
for(const name of Object.keys(parity.lobby_assets))assert.ok(host.includes(`assets/lobby/${name}`)||css.includes(`assets/lobby/${name}`)||css.includes(`../assets/lobby/${name}`),`Lobby asset is packaged but not referenced: ${name}`);
console.log(JSON.stringify({ok:true,lobbyAssetHashes:Object.keys(parity.lobby_assets).length,joinAsPlayerSingleLine:true,kickButton:'28x28',kickIcon:'16x16'},null,2));
