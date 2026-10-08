'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const app=read('public/js/app.bundle.js');
const net=read('public/js/pvp-network.js');
const css=read('public/css/app.css');
const html=read('public/index.html');
const server=read('server.js');
const pkg=JSON.parse(read('package.json'));

assert.strictEqual(pkg.version,'3.0.42','PvP package version mismatch');
assert(html.includes('gl-pvp-3.42-responsive-ui'),'PvP v3.34 cache marker missing');

// Cross-app hamburger is structurally lobby-only. Active gameplay removes the nodes;
// CSS only defines how the lobby button looks when it exists.
assert(net.includes('syncCrossAppMobileNavVisibility(active&&!showLobby)'),'active-match navigation lifecycle is not synchronized');
assert(net.includes('if(!show){if(menu)menu.remove();if(button)button.remove();return false;}'),'active match does not physically remove the cross-app nav');
assert(!html.includes('id="glMobileAppMenuButton"'),'cross-app hamburger is still statically mounted');
assert(css.includes('body.pvp-lobby-mode>.gl-mobile-app-menu-button{display:flex!important}'),'hamburger CSS is not scoped to lobby mode');
assert(!css.includes('legacy-card-anchor'),'obsolete Legacy sizing anchor workaround still exists');

// Shared VS AI mobile Hero action UI must remain untouched locally; only the selected
// Racial/Class/Legacy action is converted into a server-authoritative intent.
const whitelist=net.match(/function isLocalUiOnlyClick\(t\)\{[\s\S]*?\}\n/);
assert(whitelist&&whitelist[0].includes('[data-mobile-hero-action]'),'mobile Hero action star is still blocked by PvP capture routing');
assert(app.includes("var mobileHeroAction=ev.target.closest('[data-mobile-hero-action]')")&&app.includes('v540OpenMobileHeroActions'),'shared VS AI mobile Hero action opener missing');
assert(!net.includes("var mobileHeroAction=t&&t.closest&&t.closest('[data-mobile-hero-action]')"),'obsolete PvP capture-phase Hero-action opener still exists');
assert(net.includes("t.closest('[data-racial-id]')")&&net.includes("runtimeIntent('beginActivatedRacialAbility'"),'Racial Trait selection is not routed through authoritative PvP intent');

// Hero/Legacy sizing uses the same structural card anchor; no Legacy-only sizing CSS workaround.
assert(css.includes('Hero / Legacy display parity — Legacy metadata overlays instead of shrinking the artwork stage.'),'VS AI Hero/Legacy parity block missing');
assert(app.includes('var legacyStage=\'<div class="hero-stage legacy-stage">\'+legacyInfoMobile+mobileAction+\'<div class="hero-card-anchor"><button class="hero-card hero-main"'),'Legacy markup does not share the Hero card anchor structure');

// Lobby names are server-explicit and rendered for both seats.
assert(net.includes("typedName=safeName(nameInput&&nameInput.value||state.nameDraft||state.name)"),'Ready does not commit the typed lobby name');
assert(net.includes('var explicit=cleanDisplayName(snap.displayNames')&&net.includes('window.GL_PVP_LOCAL_NAME=selfLabel();window.GL_PVP_OPPONENT_NAME=opponentLabel()'),'snapshot player names are not exposed to battlefield rendering');
assert(server.includes('state.pvpPlayerNames = localSeat === 2'),'server player-name authority / seat localization missing');
assert(app.includes('function pvpBattlefieldName(side)')&&app.includes("pvpBattlefieldName('PLAYER')")&&app.includes("pvpBattlefieldName('AI')"),'battlefield does not render live lobby names');

// Battle presentation has exactly one PvP transport source: revision-scoped server animation events.
assert(net.includes('function battleFeedbackFromAuthoritativePlans(plans)'),'revision-scoped battle-feedback extraction missing');
assert(net.includes('function playAuthoritativeBattleFeedbackAfterRender(events)'),'post-render battle feedback dispatcher missing');
assert(net.includes('requestAnimationFrame(function(){requestAnimationFrame(play);})'),'battle feedback is not delayed until rendered layout frames');
assert(net.includes('playAuthoritativeStateDeltaPresentation(previousCanonical,currentCanonical,{skipBattleFeedback:true})'),'heuristic state-delta battle VFX has not been disabled in PvP');
assert(net.includes('if(battleFeedback.length)playAuthoritativeBattleFeedbackAfterRender(battleFeedback)'),'authoritative battle feedback is not dispatched after import');
assert(!net.includes('freshAuthoritativeBattleFeedback'),'obsolete canonical-ledger diff path still exists');
assert(server.includes('st.pvpBattleFeedbackEvents = []'),'recipient snapshots still carry the internal battle-feedback ledger');

// Each signal is bound to its own identity strip, outside the bordered name/deck box.
assert(app.includes('pvp-identity-strip--opponent')&&app.includes('data-pvp-identity-side="AI"'),'opponent identity strip missing');
assert(app.includes('pvp-identity-strip--self')&&app.includes('data-pvp-identity-side="PLAYER"'),'local identity strip missing');
assert(css.includes('.pvp-identity-strip .player-name')&&css.includes('.pvp-net-signal'),'identity/signal sibling layout missing');
assert(server.includes('Number(player.seat) !== Number(client.seat)'),'opponent signal lookup is not isolated by player seat');
console.log('PASS PvP v3.36 clean parity architecture: lobby-only mobile nav, shared Hero action UI, exact VS AI Legacy markup, live names, per-player external signal indicators, and direct authoritative battle feedback.');
