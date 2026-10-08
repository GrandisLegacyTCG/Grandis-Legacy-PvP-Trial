'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');const crypto=require('crypto');
const root=path.resolve(__dirname,'..');const read=r=>fs.readFileSync(path.join(root,r),'utf8');const sha=r=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r))).digest('hex');
const pkg=JSON.parse(read('package.json'));
const stack=pkg.grandisLegacySourceStack||{};assert.equal(stack.oneSourceAuthority,'1.9.5');assert.equal(stack.canonicalCardAuthority,'1.6.0');assert.equal(stack.runtimeFoundation,'1.94.2');assert.equal(stack.runtimeData,'0.16.2');assert.equal(stack.effectRecipe,'0.15.2');assert.equal(stack.effectCheckpoint,'0.15.2');assert.equal(stack.heroComponentAuthority,'1.1.0');assert.equal(stack.starter60,'1.6.1');assert.equal(stack.applicationRuntimeSync,'2.63');assert.equal(stack.activeStarterCount,5);const cards=JSON.parse(read('data/season1/cards.runtime.v0.16.2.json'));const cardCount=Array.isArray(cards.cards)?cards.cards.length:Object.values(cards.families||{}).reduce((n,f)=>n+((f&&f.cards)||[]).length,0);assert.equal(cardCount,200);
const server=read('server.js'),app=read('public/js/app.bundle.js');
assert.match(server,/createGameplayIntentRouter\(\)/);assert.match(server,/maskAppStateForSeat/);assert.match(server,/st\[deckKey\] = hiddenCards\(deckCount\)/);assert.match(server,/if \(hideLegacy\) st\[legacyKey\] = hiddenCards\(legacyCount\)/);assert.match(server,/maskPendingForSpectator/);assert.match(server,/state\?\.gameOver && room\.match\.status !== 'finished'/);
assert.match(app,/after_stoneblood_multi_sequence/);assert.match(app,/resumeMultiTargetContinuation/);assert.match(app,/advanceRoundAfterCompletedTurnPair\(appState,side\)/);assert.match(app,/gameEndReason='string'|typeof s\.gameEndReason==='string'/);
// Core connection/session and Candidate 3B presentation authorities remain byte-identical to the Candidate 3B baseline.
const expected={
 'server.js':'7d914443bb7b0b1d4f47214dce079797072b7927b494fbf1fe23697245314933',
 'public/js/pvp-network.js':'1f8a23fae9d573a4a1a038e56003e52bbc966eb406c6e248e9f017621910dfaf',
 'server/gameplay-intent-router.mjs':'ac36cef76f8ee9e57996eed9d9c79a3174a9806d798792cc5ff70e15b3e7394b',
 'public/js/pvp-presentation-adapter.js':'ef18a8803d9783262241125c512fcbdffe290b60d0c8728254363ee070997530',
 'public/css/battlefield-authority.css':'7f7c6f9ae96d65869ba65eb21eeec44170ca16f54affe06270a488a290b65a22'
};
for(const [f,h] of Object.entries(expected))assert.equal(sha(f),h,`${f} changed from locked Candidate 3B baseline`);
assert.ok(!/northflank/i.test(read('server/gameplay-intent-router.mjs')),'provider name leaked into gameplay router');
console.log(JSON.stringify({ok:true,candidate:'PvP v3.43 Candidate 3C',foundationLocked:true,networkSessionBytePreserved:true,presentationAuthorityPreserved:true,viewerSafeServerFilteringPresent:true,candidate3cLifecycleCorrectionsPresent:true},null,2));
