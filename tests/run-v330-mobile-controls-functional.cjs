'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const {loadPvp}=require('./vm-pvp-harness.cjs');
const root=path.resolve(__dirname,'..');
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const app=read('public/js/app.bundle.js');
const net=read('public/js/pvp-network.js');
const css=read('public/css/app.css');
const html=read('public/index.html');
const pkg=JSON.parse(read('package.json'));

assert.strictEqual(pkg.version,'3.0.42');
assert(html.includes('gl-pvp-3.42-responsive-ui'),'v3.34 cache marker missing');

assert(net.includes('function syncCrossAppMobileNavVisibility(inMatch)'),'mobile nav lifecycle function missing');
assert(net.includes("ensureLobbyCrossAppNav(!hide&&document.body.classList.contains('pvp-lobby-mode'))"),'active match does not drive structural nav removal');
assert(net.includes('if(!show){if(menu)menu.remove();if(button)button.remove();return false;}'),'active match does not physically remove nav nodes');
assert(!html.includes('id="glMobileAppMenuButton"'),'cross-app hamburger is still statically mounted in gameplay HTML');
assert(css.includes('body.pvp-lobby-mode>.gl-mobile-app-menu-button{display:flex!important}'),'mobile hamburger display is not lobby-scoped');

// The shared VS AI click handler owns opening the star menu. PvP must only allow it
// through capture routing and intercept the selected authoritative action afterwards.
const localOnly=net.match(/function isLocalUiOnlyClick\(t\)\{[\s\S]*?\}\n/);
assert(localOnly&&localOnly[0].includes('[data-mobile-hero-action]'),'mobile Hero action trigger is not local-UI whitelisted');
assert(app.includes("var mobileHeroAction=ev.target.closest('[data-mobile-hero-action]')")&&app.includes('v540OpenMobileHeroActions'),'shared VS AI mobile action opener missing');
assert(!net.includes('localBridge.openMobileHeroActions'),'obsolete duplicate PvP menu opener still exists');

// Exercise the exact shared opener with a real runtime state and an active racial token.
const ctx=loadPvp(root); const bridge=ctx.GL_LOCAL_AI_BRIDGE;
const deckKeys=Object.keys(bridge.getStarterDeckOptions());
let snap=bridge.startSharedMatch({playerDeckKey:deckKeys[0],player2DeckKey:deckKeys[1],player1Name:'P1',player2Name:'P2'});
snap.appState.phase='Deploy'; snap.appState.turn='PLAYER'; snap.appState.racial=2;
bridge.importSnapshot(snap,{skipImportAnimations:true});
assert.strictEqual(bridge.openMobileHeroActions('PLAYER','LEFT'),true,'shared mobile Hero action menu did not open for a real Hero state');

console.log('PASS PvP v3.34 mobile controls: gameplay hamburger is structurally absent and the shared VS AI Hero-action star path remains functional.');
