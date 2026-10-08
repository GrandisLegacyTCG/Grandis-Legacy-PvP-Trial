'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const hash=r=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r))).digest('hex');
const pkg=JSON.parse(read('package.json'));
const meta=JSON.parse(read('public/PVP_FRONTEND_BUILD.json'));
const net=read('public/js/pvp-network.js');
const cfg=read('public/config.js');
const server=read('server.js');
const docker=read('Dockerfile');
const lock=JSON.parse(read('sync/runtime-sync-lock.v2.63.json'));
assert.strictEqual(pkg.version,'3.0.47');
assert.strictEqual(meta.pvp_version,'v3.47');
assert.strictEqual(meta.package_version,'3.0.47');
assert.strictEqual(meta.website_target_version,'v1.36');
assert.strictEqual(meta.build_id,'gl-pvp-3.47-safe-rank-sync-2026-09-24');
assert.strictEqual(lock.version,'v2.63');
assert.strictEqual(lock.schema_version,'2.63-pvp-v347-consumer');
assert.strictEqual(lock.application,'PvP v3.47');
// Approved v3.46 visual port only: exact Style 1 wrapper structure and scoped CSS.
const rankMarkup='<div class="rank-control" aria-label="Hero Rank Preview"><button id="pvpRankPrev" type="button" aria-label="Previous Hero Rank">‹</button><strong id="pvpRankLabel">RANK I</strong><button id="pvpRankNext" type="button" aria-label="Next Hero Rank">›</button></div>';
assert(net.includes(rankMarkup),'Deck Builder Style 1 rank DOM structure missing');
assert(!net.includes('class="pvp-v260-rank-control"'),'v3.45 custom Rank wrapper must be removed');
const exactCore='.pvp-v260-lobby .rank-control{--gold:#f0d27f;width:max-content;margin:17px auto 0;display:grid;grid-template-columns:31px 74px 31px;align-items:center;border:1px solid #40424c;border-radius:7px;background:#121318;overflow:hidden;font-weight:400}';
assert(net.includes(exactCore),'Deck Builder Style 1 rank geometry/style missing');
assert(net.includes('.pvp-v260-lobby .rank-control button{height:31px;padding:revert;border:0;border-radius:revert;background:transparent;color:#fff;font-size:22px;font-weight:inherit;cursor:pointer}'),'Rank arrow host-style isolation missing');
assert(net.includes('.pvp-v260-lobby .rank-control button:hover{background:#24262e}'),'Deck Builder hover treatment missing');
assert(net.includes('.pvp-v260-lobby .rank-control strong{text-align:center;color:var(--gold);font-size:10px}'),'Deck Builder rank label treatment missing');
assert(!/rank-control\{margin-top:12px/.test(net),'Mobile custom Rank override must not return');
const setter=(net.match(/function setLobbyRankPreview\(next\)\{[^}]+\}/)||[''])[0];
assert(setter&&!/\bsend\s*\(/.test(setter),'Rank preview must remain local-only');
assert(net.includes("$('pvpRankPrev').onclick=function(){setLobbyRankPreview((Number(state.lobbyRankPreview)||1)-1);}")&&net.includes("$('pvpRankNext').onclick=function(){setLobbyRankPreview((Number(state.lobbyRankPreview)||1)+1);}"),'Rank I/II/III bindings changed');
assert(net.includes("state.deckKey=this.value||DECK_OPTIONS[0].key;state.lobbyRankPreview=1;state.lobbyFormation=null"),'Starter change must reset Rank I');
// v3.45 network/deployment architecture locked.
assert(cfg.includes("room1WsBase:'wss://p01--grandis-legacy-pvp--2kwws8nzlcc2.code.run'"));
assert(cfg.includes("room2WsBase:'wss://p01--grandis-legacy-pvp-room2--2kwws8nzlcc2.code.run'"));
assert(cfg.includes("wsPath:'/ws'"));
assert(net.includes("if(/(^|\\.)github\\.io$/.test(host))throw new Error("),'GitHub Pages fail-closed WS guard missing');
assert(net.includes("setConnectionState('error'")&&net.includes('connectionTimeoutMs()'),'v3.45 connection state behavior missing');
assert(docker.includes('COPY server ./server'),'v3.45 Docker server-directory fix regressed');
assert(server.includes('createGameplayIntentRouter')&&server.includes('maskCanonicalBoardForRecipient'),'Server authority path missing');
// Locked v3.45 production modules/Battlefield must remain byte-identical.
const locked={
 'Dockerfile':'2b7a60bc4713b8c632df36ba533ed278a1ff80d1ff29c4b963bd1919a6d61f1b',
 '.dockerignore':'ab24be21fa795a25df49d23045ab04faea2820a0dc109bc8185b0254e2bf4db5',
 'server/gameplay-intent-router.mjs':'ac36cef76f8ee9e57996eed9d9c79a3174a9806d798792cc5ff70e15b3e7394b',
 'server/headless-runtime-compat.mjs':'8fdf32801f2ea1646ec3231cea60dbdf81da46c7eba8dcdffc529cf20bf6f13d',
 'sync/runtime-sync-verifier.mjs':'d88e3eb49f5bc578c6b55cf10ee0b93adf5b8529cd22c74be59e63f6051073a4',
 'public/js/app.bundle.js':'e38e9938d1c38e70487266a6f070e9fb95848601ec10fe216149d1f324cabbc5',
 'public/css/app.css':'7b731f485e7374a553d419fad1983667fc669c295ce5a72492a1f9d450e630e7',
 'public/css/battlefield-authority.css':'7f7c6f9ae96d65869ba65eb21eeec44170ca16f54affe06270a488a290b65a22',
 'public/shared-ui/battlefield-ui.js':'110394df12e3052bbcc961de24dad29b5734af65d0a7c0afdd2c8ffdaf8a81cb',
 'public/shared-ui/battlefield-ui.css':'2b70d63c74081a8809b2a2d456ec1b620a9a078ab84f597c0607a928503a9378',
 'public/js/pvp-presentation-adapter.js':'ef18a8803d9783262241125c512fcbdffe290b60d0c8728254363ee070997530'
};
for(const [f,h] of Object.entries(locked))assert.strictEqual(hash(f),h,'Locked v3.45 source changed: '+f);
// Runtime Sync lock must match exact final bytes for the four entries that failed in deployed v3.46.
const map=Object.fromEntries((lock.runtimeFiles||[]).map(x=>[x.path,x.sha256]));
for(const f of ['package.json','public/index.html','public/js/pvp-network.js','server.js']){
  assert(map[f],`Runtime Sync does not track ${f}`);
  assert.strictEqual(map[f],hash(f),`Runtime Sync hash mismatch: ${f}`);
}
assert.strictEqual((JSON.parse(read('data/season1/cards.runtime.v0.16.2.json')).cards||[]).length,200,'200-card coverage changed');
console.log(JSON.stringify({ok:true,version:pkg.version,baseline:'v3.45',v346ImplementationBaseline:false,v346RankReferenceOnly:true,runtimeSyncGateDisabled:false,runtimeSyncLock:lock.version,rankStyle1:true,rankLocalOnly:true,endpointsChanged:false,networkBehaviorChanged:false,battlefieldChanged:false,canonicalCards:200},null,2));
