'use strict';
const assert=require('assert'),path=require('path');
const {loadCandidate3aRuntime}=require('./candidate3a-runtime-harness.cjs');
const root=path.resolve(__dirname,'..');
const {bridge}=loadCandidate3aRuntime(root);
bridge.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger',firstPlayerSide:'PLAYER'});
bridge.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'},{holdAtDraw:true,bridgeImmediate:false});
let snap=bridge.getSnapshot();
// Put the active viewer at Reform with a clean hand so the next advance is the normal end-turn transition.
snap.appState.turn='PLAYER';snap.appState.phase='Reform';snap.appState.pending=null;snap.appState.responseWindow=null;snap.appState.playerHand=snap.appState.playerHand.slice(0,8);snap.appState.gameOver=false;
assert.strictEqual(bridge.importCanonicalSnapshot(snap,1,{notice:'',skipImportAnimations:true}),true);
let r=bridge.applyServerIntent('advancePhase',[]);assert.strictEqual(r.ok,true);
let canonical=bridge.getCanonicalSnapshot(1);assert.strictEqual(canonical.appState.turn,'AI');assert.strictEqual(canonical.appState.phase,'Draw');assert.strictEqual(canonical.appState.pvpTurnReady,true);
// Seat 2 imports the same canonical authority as viewer-relative PLAYER and acknowledges its genuine Draw phase.
assert.strictEqual(bridge.importCanonicalSnapshot(canonical,2,{notice:'',skipImportAnimations:true}),true);
let local=bridge.getSnapshot();assert.strictEqual(local.appState.turn,'PLAYER');assert.strictEqual(local.appState.phase,'Draw');assert.strictEqual(local.appState.pvpTurnReady,true);
r=bridge.applyServerIntent('acknowledgePvpTurnStart',[]);assert.strictEqual(r.ok,true);
local=bridge.getSnapshot();assert.strictEqual(local.appState.turn,'PLAYER');assert.ok(['Draw','Deploy'].includes(local.appState.phase));assert.strictEqual(local.appState.pvpTurnReady,false);assert.ok((local.appState.presentationEvents||[]).some(e=>e&&e.reason==='MANDATORY_DRAW_PHASE'));
console.log(JSON.stringify({ok:true,genuineDrawHandoff:true,seat2ViewerRelative:true,authoritativeMandatoryDraw:true,phaseAfterAcknowledgement:local.appState.phase},null,2));
