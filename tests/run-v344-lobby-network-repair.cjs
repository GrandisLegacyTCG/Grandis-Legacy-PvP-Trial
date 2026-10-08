'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const hash=r=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r))).digest('hex');
const pkg=JSON.parse(read('package.json'));
const cfg=read('public/config.js');
const net=read('public/js/pvp-network.js');
const html=read('public/index.html');
const server=read('server.js');
const meta=JSON.parse(read('public/PVP_FRONTEND_BUILD.json'));
const starters=JSON.parse(read('data/starter-decks/ACTIVE_STARTERS_v1.6.1.json'));
const cards=JSON.parse(read('data/season1/cards.runtime.v0.16.2.json'));

assert.strictEqual(pkg.version,'3.0.44');
assert.strictEqual(meta.pvp_version,'v3.44');
assert.strictEqual(meta.package_version,'3.0.44');
assert.strictEqual(meta.build_id,'gl-pvp-3.44-lobby-network-repair-2026-09-24');
assert(cfg.includes("room1WsBase:'wss://p01--grandis-legacy-pvp--2kwws8nzlcc2.code.run'"));
assert(cfg.includes("room2WsBase:'wss://p01--grandis-legacy-pvp-room2--2kwws8nzlcc2.code.run'"));
assert(cfg.includes("wsPath:'/ws'"));
assert(cfg.includes('connectionTimeoutMs:10000'));
assert(!cfg.includes("room1WsBase:'wss://grandislegacytcg.github.io"));
assert(net.includes("if(/(^|\\.)github\\.io$/.test(host))throw new Error("),'GitHub Pages fail-closed endpoint guard missing');
assert(net.includes('connectionTimeoutMs()'),'connection timeout missing');
assert(net.includes("setConnectionState('connecting'"),'explicit connecting state missing');
assert(net.includes("setConnectionState('error'")&&net.includes("?'error':'offline'"),'explicit offline/error state missing');
assert(net.includes('pvp-v260-lobby'),'legacy pvp-v260 lobby family missing');
assert(net.includes('id="pvpRankPrev"')&&net.includes('id="pvpRankLabel"')&&net.includes('id="pvpRankNext"'),'rank selector missing');
assert(net.includes("lobbyRankPreview:1"),'rank default must be Rank I');
assert(net.includes("state.lobbyRankPreview=1;state.deckKey=key"),'starter change/reset must reset preview to Rank I');
const setter=(net.match(/function setLobbyRankPreview\(next\)\{[^}]+\}/)||[''])[0];
assert(setter && !/\bsend\s*\(/.test(setter),'rank preview must not send a network/gameplay message');
assert(net.includes('heroProgressionIds(deck,rankOneId)'),'rank preview must use canonical progression mapping');
assert(html.includes('config.js?v=gl-pvp-3.44-lobby-network-repair'));
assert(html.includes('js/pvp-network.js?v=gl-pvp-3.44-lobby-network-repair'));
assert(server.includes("const BUILD_ID = 'gl-pvp-3.44-lobby-network-repair-2026-09-24';"));
assert(server.includes('maskCanonicalBoardForRecipient')&&server.includes('maskAppStateForSeat'),'viewer-safe server serialization missing');
assert(server.includes('createGameplayIntentRouter'),'server-authoritative gameplay intent router missing');

const expectedLocked={
 'public/js/app.bundle.js':'e38e9938d1c38e70487266a6f070e9fb95848601ec10fe216149d1f324cabbc5',
 'public/css/app.css':'7b731f485e7374a553d419fad1983667fc669c295ce5a72492a1f9d450e630e7',
 'public/css/battlefield-authority.css':'7f7c6f9ae96d65869ba65eb21eeec44170ca16f54affe06270a488a290b65a22',
 'public/shared-ui/battlefield-ui.js':'110394df12e3052bbcc961de24dad29b5734af65d0a7c0afdd2c8ffdaf8a81cb',
 'public/shared-ui/battlefield-ui.css':'2b70d63c74081a8809b2a2d456ec1b620a9a078ab84f597c0607a928503a9378',
 'public/js/pvp-presentation-adapter.js':'ef18a8803d9783262241125c512fcbdffe290b60d0c8728254363ee070997530'
};
for(const [f,h] of Object.entries(expectedLocked))assert.strictEqual(hash(f),h,'v3.43 locked Battlefield/presentation byte changed: '+f);

const active=starters.active_starters||starters.starters||starters.active||[];
const activeCount=Array.isArray(active)?active.length:Object.keys(active||{}).length;
assert.strictEqual(activeCount,5,'expected exactly five active starters');
assert.strictEqual(cards.cards.length,200,'expected 200 canonical cards');

console.log(JSON.stringify({
 ok:true,version:pkg.version,room1:'wss://p01--grandis-legacy-pvp--2kwws8nzlcc2.code.run/ws',
 room2:'wss://p01--grandis-legacy-pvp-room2--2kwws8nzlcc2.code.run/ws',
 legacyLobbyFamily:true,rankPreview:true,rankPreviewNetworkMutation:false,
 lockedBattlefield:true,activeStarters:activeCount,canonicalCards:cards.cards.length
},null,2));
