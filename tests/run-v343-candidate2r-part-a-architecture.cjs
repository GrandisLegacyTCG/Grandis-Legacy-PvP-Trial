'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const {loadPvp}=require('./vm-pvp-harness.cjs');
const root=path.resolve(__dirname,'..');
const read=(r)=>fs.readFileSync(path.join(root,r),'utf8');
const ok=(v,m)=>{if(!v)throw new Error(m)};
const count=(s,re)=>(s.match(re)||[]).length;

const index=read('public/index.html');
const app=read('public/js/app.bundle.js');
const network=read('public/js/pvp-network.js');
const adapter=read('public/js/pvp-presentation-adapter.js');
const server=read('server.js');
const cssApp=read('public/css/app.css');
const cssBattle=read('public/css/battlefield-authority.css');
const cssShared=read('public/shared-ui/battlefield-ui.css');

// Active load graph: one production app bundle and one explicit PvP adapter boundary.
const scripts=[...index.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
ok(scripts.filter(x=>x==='js/app.bundle.js').length===1,'Expected exactly one active shared Battlefield app bundle');
ok(scripts.filter(x=>x==='js/pvp-presentation-adapter.js').length===1,'Expected exactly one PvP presentation adapter');
ok(scripts.indexOf('js/pvp-presentation-adapter.js')<scripts.indexOf('js/app.bundle.js'),'Presentation adapter must be installed before the shared app bundle/network starts consuming it');
ok(scripts.indexOf('js/app.bundle.js')<scripts.indexOf('js/pvp-network.js'),'Shared renderer must load before PvP network snapshots arrive');

// One renderer family: network may bind behavior but must not own a second Battlefield DOM generator.
ok(count(app,/function render\(\)\s*\{/g)===1,'Shared app bundle must expose one render() family');
ok(app.includes("root.innerHTML=isMobileViewport()?mobileMarkup:desktopMarkup"),'Desktop/mobile must be branches of the same shared render() family');
for(const legacyFn of ['function field(','function mobileField(','function heroPanel(','function render(){']){
  ok(!network.includes(legacyFn),'PvP network layer must not define Battlefield renderer function: '+legacyFn);
}
ok(!/getElementById\(['"]app['"]\)\s*\.innerHTML|\$\(['"]app['"]\)\s*\.innerHTML/.test(network),'PvP network layer must not write Battlefield root HTML');

// Adapter is mandatory: network cannot bypass it and import directly into the shared bridge.
ok(network.includes('adapter.importViewerSafeSnapshot(m.serverBoard,seat'),'Server board does not cross the production presentation adapter');
ok(!network.includes('b.importCanonicalSnapshot(m.serverBoard'),'Network layer contains direct shared-bridge snapshot bypass');
ok(adapter.includes('pvpPrivateStateMasked===true'),'Adapter does not enforce viewer-safe server snapshot marker');
ok(adapter.includes("b.importCanonicalSnapshot(snapshot,normalizeSeat(seat)"),'Adapter does not own seat-orientation handoff to shared presentation');

// Reconnect, spectator and normal update all converge on handleSnapshot -> importServerBoard.
ok(network.includes("if(msg.type==='snapshot'){handleSnapshot(msg);return;}"),'WebSocket snapshot/reconnect route does not converge on handleSnapshot');
ok(network.includes('function handleSnapshot(msg)')&&network.includes('importServerBoard(false);'),'Normal state update path does not converge on importServerBoard');
ok(network.includes('state.spectatorBattlefieldEntered=true;renderLobby();importServerBoard(true);'),'Spectator battlefield entry does not converge on importServerBoard');

// Device routing remains responsive behavior inside Candidate 15 renderer, not PvP route selection.
ok(app.includes("function responsiveDeviceFamily()")&&app.includes("return isPortraitViewport()?'mobile':'tablet'"),'Tablet portrait responsive routing contract missing');
ok(app.includes("root.innerHTML=isMobileViewport()?mobileMarkup:desktopMarkup"),'Device family does not remain inside the shared render family');
ok(!/mobile.*renderer|tablet.*renderer|desktop.*renderer/i.test(network),'PvP network must not select device-specific Battlefield renderers');

// Geometry authority: Candidate 15 desktop root geometry selectors are owned only by battlefield-authority.css.
for(const sel of ['.gl-lab-authority','.gl-lab-shell','.gl-lab-battlefield']){
  ok(cssBattle.includes(sel),'Candidate 15 Battlefield authority missing '+sel);
  ok(!cssApp.includes(sel),'app.css independently owns Candidate 15 desktop geometry selector '+sel);
  ok(!cssShared.includes(sel),'shared-ui CSS independently owns Candidate 15 desktop geometry selector '+sel);
}
ok(!network.includes('.gl-lab-shell{')&&!network.includes('.gl-lab-battlefield{'),'PvP-specific injected CSS attempts to own Candidate 15 Battlefield geometry');

// Hidden-information source boundary is server serialization, not CSS/DOM hiding.
ok(server.includes('function maskCanonicalBoardForRecipient(board, client)'),'Viewer-safe board masking boundary missing');
ok(server.includes('masked.appState = maskAppStateForSeat('),'Viewer-safe board does not mask appState at source');
ok(server.includes('match.serverBoard = maskCanonicalBoardForRecipient(canonicalBoard, client);'),'snapshotFor does not route canonical board through recipient mask');
ok(server.includes('st[deckKey] = hiddenCards(deckCount);'),'Deck identity/order is not source-masked');
ok(server.includes('if (hideHand) st[handKey] = hiddenCards(handCount);'),'Opponent Hand identity is not source-masked');
ok(server.includes('if (hideLegacy) st[legacyKey] = hiddenCards(legacyCount);'),'Opponent Legacy identity is not source-masked');

// Runtime orientation proof: seat 2 imports the same canonical server state with sides swapped locally.
const ctx=loadPvp(root);
vm.runInContext(adapter,ctx,{filename:'public/js/pvp-presentation-adapter.js'});
const bridge=ctx.window.GL_LOCAL_AI_BRIDGE;
ok(bridge&&ctx.window.GL_PVP_PRESENTATION_ADAPTER,'Bridge/adapter failed to initialize in VM harness');
const canonical=bridge.startSharedMatch({seed:'candidate2r-architecture'});
ok(canonical&&canonical.appState,'Shared match did not produce canonical state');
const safe=JSON.parse(JSON.stringify(canonical));
safe.pvpPrivateStateMasked=true;
const a=ctx.window.GL_PVP_PRESENTATION_ADAPTER;
ok(a.isViewerSafeSnapshot(safe)===true,'Adapter rejected marked viewer-safe state');
let unsafeRejected=false;
try{a.importViewerSafeSnapshot(canonical,1,{skipImportAnimations:true});}catch(e){unsafeRejected=/viewer-safe/i.test(String(e&&e.message||e));}
ok(unsafeRejected,'Adapter accepted a snapshot without viewer-safe source marker');
a.setSharedBoardMode(true);
a.importViewerSafeSnapshot(safe,2,{skipImportAnimations:true});
const local=bridge.getSnapshot().appState;
ok(local.playerHeroes.CENTER.card_id===safe.appState.aiHeroes.CENTER.card_id,'Seat 2 local PLAYER side was not sourced from canonical seat-2/AI side');
ok(local.aiHeroes.CENTER.card_id===safe.appState.playerHeroes.CENTER.card_id,'Seat 2 OPPONENT side was not sourced from canonical seat-1/PLAYER side');

console.log(JSON.stringify({
  ok:true,
  candidate:'PvP v3.43 Candidate 2R-A',
  activeRenderer:'public/js/app.bundle.js::render',
  adapter:'public/js/pvp-presentation-adapter.js::importViewerSafeSnapshot',
  desktopGeometryAuthority:'public/css/battlefield-authority.css',
  reconnectSharedRenderer:true,
  spectatorSharedRenderer:true,
  deviceRoutesSharedRenderer:true,
  hiddenInfoSourceMask:true,
  seat2Orientation:true
},null,2));
