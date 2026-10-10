import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { classifyGameplayIntent, supportedGameplayIntents } from '../server/gameplay-intent-router.mjs';

const R=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=(rel)=>fs.readFileSync(path.join(R,rel),'utf8');
const exists=(rel)=>fs.existsSync(path.join(R,rel));
const app=read('public/shared-app/app-runtime.js');
const host=read('public/pvp/pvp-host.js');
const adapter=read('public/runtime/adapters/pvp-adapter.js');
const server=read('server.js');

// 1) Every literal gameplay intent emitted by the visible v6 client must exist at the
// authoritative router.  This specifically prevents the Mana PAY regression where the
// UI emitted commitManaShardPaymentChoice but the server did not classify it.
const literalIntents=[...new Set([...app.matchAll(/\bintent\(\s*['"]([^'"]+)['"]/g)].map(m=>m[1]))].sort();
const supported=new Set(supportedGameplayIntents());
const missing=literalIntents.filter(x=>!supported.has(x));
assert.deepEqual(missing,[],`Visible v6 intents missing from server router: ${missing.join(', ')}`);
const manaCommit=classifyGameplayIntent('commitManaShardPaymentChoice');
assert.equal(manaCommit?.category,'PAYMENT');
assert.equal(manaCommit?.decisionOwnership,true);

// 2) v6 is synchronous locally but PvP transport is asynchronous.  Follow-up intents must be
// serialized, not dropped just because one authoritative action is in flight.
assert.match(host,/const INTENT_QUEUE_LIMIT=24/);
assert.match(host,/state\.intentQueue\.push\(/);
assert.match(host,/function flushIntentQueue\(/);
assert.doesNotMatch(host,/state\.intentInFlight\)return \{ok:false,error:'PvP intent unavailable\.'/,
  'PvP host still drops same-tick follow-up intents');
assert.match(host,/if\(settled\)setTimeout\(flushIntentQueue,0\)/);
assert.match(host,/!state\.intentQueue\.length&&window\.GL_PVP_OPENING_PRESENTATION_COMPLETE===true/,
  'opening auto-ack must not overtake queued user intents');

// Known v6 paired interaction flows are exactly why the queue exists.
for(const pair of [
  ["intent('responseSelectNoStuck'","intent('confirmSelectedResponse'"],
  ["intent('selectStatusRemovalChoice'","intent('handleChoiceConfirm'"],
  ["intent('selectSaintPurifyChoice'","intent('handleChoiceConfirm'"],
  ["intent('selectCardSearchChoice'","intent('handleChoiceConfirm'"]
]){
  const a=app.indexOf(pair[0]),b=app.indexOf(pair[1],a+1);
  assert.ok(a>=0&&b>a,`Expected v6 chained intent flow missing: ${pair.join(' -> ')}`);
}

// 3) Restore the mature v3.51 presentation boundary concept without reviving its visible UI:
// authoritative animation events are localized/captured before board import, then replayed by
// the visible v6 presentation after render.  Server remains the only mutation authority.
assert.match(host,/function localizeAnimationEvent\(/);
assert.match(host,/lastAnimationEvents/);
assert.match(host,/prepareAuthoritativePresentation\(msg\)/);
const prep=host.indexOf('presentationPlans=prepareAuthoritativePresentation(msg)');
const imp=host.indexOf('importBoard(msg)',prep);
const render=host.indexOf('window.GL_GAME_UI?.render?.()',imp);
const play=host.indexOf('playAuthoritativeEvents?.(presentationPlans)',render);
assert.ok(prep>=0&&imp>prep&&render>imp&&play>render,'Authoritative presentation must capture before import and replay after visible v6 render');
assert.match(app,/function prepareAuthoritativeEvents\(/);
assert.match(app,/function playAuthoritativeEvents\(/);
assert.match(app,/function playAuthoritativeBattleAudio\(/);
for(const kind of ['card_play','held_card_release','hand_to_discard','attachment_to_discard','legacy_to_deck','tribute','battle_feedback'])
  assert.ok(app.includes(`'${kind}'`)||app.includes(`===\"${kind}\"`),`Visible authoritative presentation kind missing: ${kind}`);

// Card-motion/Coin sound semantics remain the exact v6 donor helpers; only battle-feedback media
// needs an external presentation helper.  No local gameplay mutation is introduced in the adapter.
assert.match(adapter,/readOnlyMethods=.*'playCardMotionSound'/);
assert.match(adapter,/playPresentationAudio/);
assert.match(adapter,/playOpeningCoinSound:\(\)=>bridge\(\)\?\.playOpeningCoinSound\?\.\(\)/);
assert.doesNotMatch(adapter,/applyServerIntent\(/);
for(const rel of [
  'public/engine/assets/audio/Card Sound.mp3',
  'public/engine/assets/audio/Coin Flip.mp3',
  'public/engine/assets/audio/battle/P.Atk.mp3',
  'public/engine/assets/audio/battle/M.Atk.mp3',
  'public/engine/assets/audio/battle/P.Def.mp3',
  'public/engine/assets/audio/battle/M.Def.mp3',
  'public/engine/assets/audio/battle/Dodge.mp3',
  'public/engine/assets/audio/battle/Heal.mp3',
  'public/engine/assets/battle/P.Attack.png',
  'public/engine/assets/battle/M.Attack.png',
  'public/engine/assets/battle/P.Defense.png',
  'public/engine/assets/battle/M.Defense.png',
  'public/engine/assets/battle/Heal.png'
]) assert.ok(exists(rel),`Missing authoritative presentation asset: ${rel}`);

// 4) Payment animation failure must recover instead of leaving the center modal permanently busy.
assert.match(app,/gl-pvp-intent-error/);
assert.match(app,/resetCenterChoiceVisualState\(\)/);
assert.match(host,/resetIntentPipeline\(message\)/);
assert.match(host,/CustomEvent\('gl-pvp-intent-error'/);

// 5) The authoritative server still produces the presentation events consumed above.
assert.ok(server.includes("'tribute' : 'card_play'"),'Server no longer emits authoritative card_play/tribute presentation events');
for(const kind of ['held_card_release','hand_to_discard','attachment_to_discard','legacy_to_deck','battle_feedback'])
  assert.ok(server.includes(`kind: '${kind}'`),`Server no longer emits authoritative ${kind}`);

const report={
  ok:true,
  visibleLiteralIntents:literalIntents.length,
  routerMissingVisibleIntents:missing,
  manaPaymentCommitRouted:true,
  asyncIntentQueue:'bounded-serialized-24',
  authoritativePresentation:'capture-before-import / v6-replay-after-render',
  paymentErrorRecovery:true,
  gameplayMutationAuthority:'server-only'
};
console.log(JSON.stringify(report,null,2));
