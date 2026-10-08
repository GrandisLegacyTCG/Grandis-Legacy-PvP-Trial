'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const json=r=>JSON.parse(read(r));
const ok=(v,m)=>{if(!v)throw new Error(m)};
const sha=r=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r))).digest('hex');
const pkg=json('package.json'), lock=json('package-lock.json'), stack=pkg.grandisLegacySourceStack||{};
ok(pkg.version==='3.0.43','Final v3.43 source package metadata mismatch');
for(const [k,v] of Object.entries({oneSourceAuthority:'1.9.5',canonicalCardAuthority:'1.6.0',runtimeFoundation:'1.94.2',runtimeData:'0.16.2',effectRecipe:'0.15.2',effectCheckpoint:'0.15.2',heroComponentAuthority:'1.1.0',starter60:'1.6.1',applicationRuntimeSync:'2.63'})) ok(stack[k]===v,`Locked authority changed: ${k}`);
ok(stack.activeStarterCount===5,'Expected 5 active starters');
const cards=json('data/season1/cards.runtime.v0.16.2.json');ok(Array.isArray(cards.cards)&&cards.cards.length===200,'Expected 200 canonical runtime cards');
const starters=json('data/starter-decks/ACTIVE_STARTERS_v1.6.1.json');const starterRows=starters.active_starters||starters.starters||starters.decks||[];ok(Array.isArray(starterRows)&&starterRows.length===5,'Expected 5 active starter rows');
const ws=lock.packages&&lock.packages['node_modules/ws'];ok(ws&&ws.version==='8.21.0','Locked real ws version must remain 8.21.0');ok(ws.integrity==='sha512-Vsp28b7DRcimFQvrqu2Wek3z1iYxDCWqHYB8Qsnk/S4RfaCQzPGPyBNuVjJV3cd6UiKtUtp6sNM77gWvzcCH+g==','ws lock integrity changed');
const server=read('server.js'),router=read('server/gameplay-intent-router.mjs'),net=read('public/js/pvp-network.js'),app=read('public/js/app.bundle.js'),css=read('public/css/app.css'),authCss=read('public/css/battlefield-authority.css');
ok(server.includes("const PORT = Number(process.env.PORT || 3000)")&&server.includes("process.env.HOST || process.env.GL_PVP_HOST || '0.0.0.0'"),'Provider-portable PORT/HOST contract missing');
ok(server.includes("new WebSocketServer({ noServer: true")&&server.includes("url.pathname !== '/ws'")&&server.includes("url.pathname === '/health'"),'Production HTTP/WebSocket/health contract missing');
ok(server.includes('createGameplayIntentRouter()')&&server.includes('GAMEPLAY_INTENT_ROUTER.handle'),'One server gameplay intent path missing');
ok(server.includes("case 'shared-board': throw new Error('Client board publish is disabled."),'Client-authoritative board fallback reappeared');
ok(router.includes('SPECTATOR_FORBIDDEN')&&router.includes('SEAT_OWNERSHIP')&&router.includes('TURN_OWNERSHIP'),'Central server authority validation missing');
ok(router.includes('clientActionId')&&router.includes('baseRevision'),'Duplicate/stale protection missing');
ok(!net.includes('GL_LOCAL_AI_BRIDGE.applyServerIntent'),'Browser gameplay authority fallback reappeared');
for(const marker of ['maskAppStateForSeat','maskPendingForSpectator','maskResponseWindow','__HIDDEN_CARD_BACK__']) ok(server.includes(marker),`Viewer-safe server filtering missing: ${marker}`);
ok(server.includes("if (client.ws && client.ws !== ws) client.ws.close(4000, 'Replaced by reconnect')")&&server.includes('if (client.ws !== ws) return;'),'Reconnect stale-socket ownership protection missing');
ok(server.includes("Spectator mode is read-only.")&&server.includes("if (client.role !== 'spectator') throw new Error('Teaching View is only available to spectators.')"),'Spectator central non-authority missing');
ok(app.includes('after_stoneblood_multi_sequence')&&app.includes('advanceRoundAfterCompletedTurnPair(appState,side)'),'Candidate 3C lifecycle corrections missing');
ok(/\.hero-main img\{[^}]*border:0/s.test(css)&&/\.hand-art img\{[^}]*border:0/s.test(css)&&/\.preview-card-art img\{[^}]*border:0/s.test(css),'Candidate 3B card-stroke correction missing');
ok(css.includes('.v96-app .combined-played-card img{')&&css.includes('max-width:none!important;'),'Candidate 3B equal-scale Card Played correction missing');
for(const marker of ['source-candidate.selectable-legal','selectable-selected'])ok(css.includes(marker),`Functional gameplay outline missing: ${marker}`);
ok(/\.gl-lab-sidebar \.combined-played-card\{[^}]*border:0!important;[^}]*background:transparent!important;/s.test(authCss),'Card Played decorative wrapper correction missing');
for(const f of ['server.js','server/gameplay-intent-router.mjs','public/js/pvp-network.js']) ok(!/northflank/i.test(read(f)),`Provider-specific core dependency found in ${f}`);
ok(!fs.existsSync(path.join(root,'runtime/pvp/draw-review-runtime.mjs')),'Duplicate Hero Component Draw Review authority returned');
ok(!fs.existsSync(path.join(root,'node_modules')),'node_modules must not be packaged');
const locked={
 'server.js':'7d914443bb7b0b1d4f47214dce079797072b7927b494fbf1fe23697245314933',
 'public/js/pvp-network.js':'1f8a23fae9d573a4a1a038e56003e52bbc966eb406c6e248e9f017621910dfaf',
 'server/gameplay-intent-router.mjs':'ac36cef76f8ee9e57996eed9d9c79a3174a9806d798792cc5ff70e15b3e7394b',
 'public/js/pvp-presentation-adapter.js':'ef18a8803d9783262241125c512fcbdffe290b60d0c8728254363ee070997530',
 'public/css/battlefield-authority.css':'7f7c6f9ae96d65869ba65eb21eeec44170ca16f54affe06270a488a290b65a22'
};
for(const [f,h] of Object.entries(locked))ok(sha(f)===h,`${f} changed from locked Candidate 3B/3C network/presentation authority`);
console.log(JSON.stringify({ok:true,candidate:'Grandis Legacy PvP v3.43 final source release',foundation:true,cards:200,starters:5,lockedWs:'8.21.0',serverAuthority:true,clientAuthoritativeFallback:false,viewerSafe:true,staleSocketProtected:true,spectatorReadOnly:true,providerAgnosticCore:true,candidate3bUiFixes:true,candidate3cLifecycle:true,networkPresentationHashesLocked:true},null,2));
