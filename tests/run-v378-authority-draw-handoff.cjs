'use strict';
const assert=require('assert'),path=require('path');
const {loadCandidate3aRuntime}=require('./candidate3a-runtime-harness.cjs');
const root=path.resolve(__dirname,'..');
const {bridge}=loadCandidate3aRuntime(root);
bridge.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger',firstPlayerSide:'PLAYER'});

// Opening confirmation must authoritatively commit ONLY Opening Hand + Starting Shards.
// The first mandatory Draw/Regen must remain held in a genuine Draw state until the
// approved v6 presentation has finished and the client acknowledges turn start.
bridge.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'},{holdAtDraw:true,bridgeImmediate:false});
let local=bridge.getSnapshot();
assert.strictEqual(local.appState.turn,'PLAYER');
assert.strictEqual(local.appState.phase,'Draw');
assert.strictEqual(local.appState.pvpTurnReady,true);
assert.strictEqual(local.appState.playerHand.length,6);
assert.strictEqual(local.appState.aiHand.length,6);
assert.strictEqual(local.appState.playerManaPoolCards.length,3);
assert.strictEqual(local.appState.aiManaPoolCards.length,3);
assert.strictEqual((local.appState.presentationEvents||[]).filter(e=>e&&e.reason==='MANDATORY_DRAW_PHASE').length,0);

let r=bridge.applyServerIntent('acknowledgePvpTurnStart',[]);assert.strictEqual(r.ok,true);
local=bridge.getSnapshot();
assert.strictEqual(local.appState.turn,'PLAYER');
assert.strictEqual(local.appState.phase,'Deploy');
assert.strictEqual(local.appState.pvpTurnReady,false);
assert.strictEqual(local.appState.playerHand.length,7);
assert.strictEqual(local.appState.playerManaPoolCards.length,4);
assert.strictEqual((local.appState.presentationEvents||[]).filter(e=>e&&e.reason==='MANDATORY_DRAW_PHASE').length,1);

// Subsequent player changes must use the same genuine Draw handoff. Put the active
// viewer at Reform with a clean turn gate, advance, then verify Seat 2 sees itself
// viewer-relative as PLAYER in Draw and must explicitly acknowledge.
let snap=bridge.getSnapshot();
snap.appState.turn='PLAYER';snap.appState.phase='Reform';snap.appState.pending=null;snap.appState.responseWindow=null;snap.appState.pvpTurnReady=false;snap.appState.playerHand=snap.appState.playerHand.slice(0,8);snap.appState.gameOver=false;
assert.strictEqual(bridge.importCanonicalSnapshot(snap,1,{notice:'',skipImportAnimations:true}),true);
r=bridge.applyServerIntent('advancePhase',[]);assert.strictEqual(r.ok,true);
let canonical=bridge.getCanonicalSnapshot(1);assert.strictEqual(canonical.appState.turn,'AI');assert.strictEqual(canonical.appState.phase,'Draw');assert.strictEqual(canonical.appState.pvpTurnReady,true);
assert.strictEqual(bridge.importCanonicalSnapshot(canonical,2,{notice:'',skipImportAnimations:true}),true);
local=bridge.getSnapshot();assert.strictEqual(local.appState.turn,'PLAYER');assert.strictEqual(local.appState.phase,'Draw');assert.strictEqual(local.appState.pvpTurnReady,true);
r=bridge.applyServerIntent('acknowledgePvpTurnStart',[]);assert.strictEqual(r.ok,true);
local=bridge.getSnapshot();assert.strictEqual(local.appState.turn,'PLAYER');assert.strictEqual(local.appState.phase,'Deploy');assert.strictEqual(local.appState.pvpTurnReady,false);
console.log(JSON.stringify({ok:true,openingHeldAtDraw:true,noPrematureMandatoryDraw:true,openingHand:6,startingShards:3,firstPlayerMandatoryDrawAfterAck:true,genuineDrawHandoff:true,seat2ViewerRelative:true,phaseAfterAcknowledgement:local.appState.phase},null,2));
