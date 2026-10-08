'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const ok=(v,m)=>{if(!v)throw new Error(m)};
const pkg=JSON.parse(read('package.json'));
const build=JSON.parse(read('public/PVP_FRONTEND_BUILD.json'));
const server=read('server.js');
const net=read('public/js/pvp-network.js');
const app=read('public/js/app.bundle.js');
const html=read('public/index.html');

ok(pkg.version==='3.0.51','package version must be 3.0.51');
ok(build.pvp_version==='v3.51','frontend metadata must be v3.51');
ok(/v3\.51/.test(server)&&/v3\.51/.test(net),'v3.51 runtime/frontend version missing');
ok(build.build_id&&html.includes(build.build_id),'production HTML cache build id is stale or mismatched');

// The shared approved motion engine must be reused rather than recreated in pvp-network.
for(const fn of ['captureHandDiscardMotion','queueHandDiscardMotion','queueAttachmentDiscardMotion','queueLegacyFieldToDeckMotion','beginHeldTargetCardMotion','releaseHeldCardMotion']){
  ok(app.includes(`function ${fn}`)||app.includes(`${fn}=`)||app.includes(`${fn}:`),`shared motion ${fn} missing`);
}
for(const fn of ['beginAuthoritativeHeldPlayedCardMotion','releaseAuthoritativeHeldCardMotion','captureAuthoritativeHandDiscardMotion','queueCapturedAuthoritativeHandDiscardMotion','captureAuthoritativeAttachmentDiscardMotion','queueCapturedAuthoritativeAttachmentDiscardMotion','captureAuthoritativeLegacyToDeckMotion','queueCapturedAuthoritativeLegacyToDeckMotion']){
  ok(app.includes(fn),`authoritative bridge ${fn} missing`);
}

// Server-side authoritative transition families.
for(const kind of ['hand_to_discard','attachment_to_discard','legacy_to_deck','held_card_release']) ok(server.includes(`'${kind}'`)||server.includes(`\"${kind}\"`),`server animation kind ${kind} missing`);
ok(server.includes('held_until_resolution')&&server.includes('hold_key'),'held-card lifecycle metadata missing');
ok(server.includes("String(rw.kind || '') === 'incoming_attack'")||server.includes("rw.kind==='incoming_attack'"),'held attack must be limited to actual incoming-attack Response lifecycle');
ok(server.includes('commit_token'),'stable authoritative commit token missing');

// Primary motion is excluded from generic hand-discard detection to avoid duplicate movement.
ok(server.includes('primaryCardMotionEmitted')&&server.includes('skipPrimary')&&server.includes('removedHandEntries'),'generic secondary hand-discard detection missing primary-card exclusion');

// Capture origin before importing authoritative AFTER state, then play after render.
for(const kind of ['hand_to_discard','attachment_to_discard','legacy_to_deck']) ok(net.includes(`evt.kind==='${kind}'`),`PvP bridge does not prepare/play ${kind}`);
ok(net.includes('beginAuthoritativeHeldPlayedCardMotion')&&net.includes('releaseAuthoritativeHeldCardMotion'),'held-card network bridge missing');

// v3.49 locked systems retained: generic Shard pending, stable opponent-Shard mapping and Main Draw presentation implementation.
ok(net.includes('syncAuthoritativePendingChoice()'),'v3.49 authoritative pending rehydration missing');
ok(net.includes('[data-mana-class-uid]')&&net.includes('[data-response-mana-uid]'),'locked Class Shard controls missing');
ok(server.includes('opponentShardChoiceHandle')&&server.includes('STALE_OPPONENT_SHARD_CHOICE'),'locked opaque opponent-Shard mapping missing');
ok(app.includes('queueStagedManaRegenDraws')||app.includes('queueOpeningManaDrawEvents'),'locked Shard animation implementation missing');

console.log(JSON.stringify({
  ok:true,version:'v3.51',
  sharedMotionEngineReused:true,
  secondaryHandDiscardBridge:true,
  attachmentDiscardBridge:true,
  legacyReturnBridge:true,
  heldAttackLifecycleBridge:true,
  primaryMotionDeduplication:true,
  shardSystemRetained:true
},null,2));
