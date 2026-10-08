'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const hash=r=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r))).digest('hex');
const pkg=JSON.parse(read('package.json')), meta=JSON.parse(read('public/PVP_FRONTEND_BUILD.json'));
const cfg=read('public/config.js'), net=read('public/js/pvp-network.js'), server=read('server.js'), html=read('public/index.html');
const cards=JSON.parse(read('data/season1/cards.runtime.v0.16.2.json'));
const starters=JSON.parse(read('data/starter-decks/ACTIVE_STARTERS_v1.6.1.json'));
assert.strictEqual(pkg.version,'3.0.45');
assert.strictEqual(meta.pvp_version,'v3.45');
assert.strictEqual(meta.package_version,'3.0.45');
assert.strictEqual(meta.website_target_version,'v1.34');
assert.strictEqual(meta.build_id,'gl-pvp-3.45-server-lobby-fix-2026-09-24');
assert(html.includes('config.js?v=gl-pvp-3.45-server-lobby-fix')&&html.includes('js/pvp-network.js?v=gl-pvp-3.45-server-lobby-fix'),'Active config/network cache token must be v3.45');
assert(cfg.includes("room1WsBase:'wss://p01--grandis-legacy-pvp--2kwws8nzlcc2.code.run'"));
assert(cfg.includes("room2WsBase:'wss://p01--grandis-legacy-pvp-room2--2kwws8nzlcc2.code.run'"));
assert(cfg.includes("wsPath:'/ws'"));
assert(!cfg.includes("grandislegacytcg.github.io/ws"));
assert(net.includes("if(/(^|\\.)github\\.io$/.test(host))throw new Error("),'GitHub Pages WS fail-closed guard missing');
assert(net.includes("setConnectionState('error'")&&net.includes('connectionTimeoutMs()'),'v3.44 actionable connection state must be preserved');
assert(!net.includes('id="pvpChangeNameButton"')&&!net.includes("$('pvpChangeNameButton')"),'Change Name DOM/listener must be removed');
assert(net.includes("addEventListener('blur',function(){if(safeName(this.value||state.nameDraft)!==state.name)commitLobbyName();})"),'Player Name blur commit missing');
assert(net.includes('pvp-v260-formation-wrap')&&net.includes('pvp-v260-swap-button'),'Style 1 formation controls missing');
assert(net.includes('grid-template-columns:minmax(0,1fr) 27px minmax(0,1fr) 27px minmax(0,1fr)'),'Desktop formation must use Hero / swap / Hero / swap / Hero pattern');
assert(net.includes('width:27px;height:27px')&&net.includes('border-radius:50%')&&net.includes('background:#009def')&&net.includes('box-shadow:0 4px 10px rgba(0,157,239,.38)'),'Deck Builder Style 1 swap style mismatch');
assert(net.includes('pvp-v260-rank-control')&&net.includes('grid-template-columns:31px 74px 31px'),'Deck Builder Style 1 rank control missing');
const markup=(net.match(/function installLobbyModal\(\)\{[\s\S]*?function commitLobbyName/)||[''])[0];
assert(markup.indexOf('id="pvpFormationPreview"')>=0&&markup.indexOf('pvp-v260-rank-control')>markup.indexOf('id="pvpFormationPreview"'),'Rank control must be below formation');
assert(net.includes('>‹</button><strong id="pvpRankLabel">RANK I</strong><button id="pvpRankNext"')&&net.includes('>›</button>'),'Rank control must use compact Deck Builder arrows');
const setter=(net.match(/function setLobbyRankPreview\(next\)\{[^}]+\}/)||[''])[0];
assert(setter&&!/\bsend\s*\(/.test(setter),'Rank preview must remain local-only');
assert(net.includes('function swapLobbyFormation(')&&net.includes("send('set-deck',{deckKey:state.deckKey||activeLoadedDeckKey(),formation:clone(f)})"),'Formation swap must sync through existing deck setup path');
assert(server.includes('function normalizeStarterFormation(')&&server.includes('sameFormation(client.formation, formation)'),'Server starter formation validation missing');
assert(server.includes("applyClientDeckToStartOptions(startOptions, p1, 'player')")&&server.includes("applyClientDeckToStartOptions(startOptions, p2, 'player2')"),'Validated formation must feed canonical match start');
assert(net.includes('background:url("assets/lobby/chevron-down.png") center/16px 16px no-repeat'),'Deck Builder dropdown chevron style missing');
assert(!net.includes("content:'⌄'")&&!net.includes('content:"V"')&&!net.includes("content:'V'"),'Custom/text dropdown arrow remains');
assert.strictEqual(hash('public/assets/lobby/chevron-down.png'),'ffb2be69858295e8dc51841c035a6d0f717447e786394f43edf9aa6abf938fac','Dropdown arrow is not exact Deck Builder asset');
const locked={
 'public/js/app.bundle.js':'e38e9938d1c38e70487266a6f070e9fb95848601ec10fe216149d1f324cabbc5',
 'public/css/app.css':'7b731f485e7374a553d419fad1983667fc669c295ce5a72492a1f9d450e630e7',
 'public/css/battlefield-authority.css':'7f7c6f9ae96d65869ba65eb21eeec44170ca16f54affe06270a488a290b65a22',
 'public/shared-ui/battlefield-ui.js':'110394df12e3052bbcc961de24dad29b5734af65d0a7c0afdd2c8ffdaf8a81cb',
 'public/shared-ui/battlefield-ui.css':'2b70d63c74081a8809b2a2d456ec1b620a9a078ab84f597c0607a928503a9378',
 'public/js/pvp-presentation-adapter.js':'ef18a8803d9783262241125c512fcbdffe290b60d0c8728254363ee070997530'};
for(const [f,h] of Object.entries(locked))assert.strictEqual(hash(f),h,'Locked Battlefield changed: '+f);
const active=starters.active_starters||starters.starters||starters.active||[];
assert.strictEqual(Array.isArray(active)?active.length:Object.keys(active).length,5);
assert.strictEqual(cards.cards.length,200);
assert(server.includes('maskCanonicalBoardForRecipient')&&server.includes('createGameplayIntentRouter'),'Server authority/viewer-safe path missing');
console.log(JSON.stringify({ok:true,version:pkg.version,endpointsPreserved:true,changeNameRemoved:true,style1Swap:true,style1Rank:true,rankBelowFormation:true,rankPreviewNetworkMutation:false,serverValidatedFormation:true,deckBuilderChevron:true,battlefieldPreserved:true,activeStarters:5,canonicalCards:200},null,2));
