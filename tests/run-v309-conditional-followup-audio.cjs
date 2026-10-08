'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const { loadPvp } = require('./vm-pvp-harness.cjs');

const requireFromHere = createRequire(__filename);
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/season1/cards.runtime.v0.15.0.json'), 'utf8'));
const bundle = fs.readFileSync(path.join(root, 'public/js/app.bundle.js'), 'utf8');
const reducer = fs.readFileSync(path.join(root, 'runtime/core/reducer.js'), 'utf8');
const context = loadPvp(root);
const result = context.GL_CONDITIONAL_FOLLOW_UP_V611_QA_SELF_TEST();

assert.ok(result && result.ok, `PvP Conditional Follow-up QA failed: ${JSON.stringify(result)}`);
assert.strictEqual(result.secondResponseWindow, false);
assert.strictEqual(result.pendingStatesCreated, 0);
assert.strictEqual(result.primaryBlockCarriedOver, false);
assert.strictEqual(data.canonical_registry_hash, 'ce79e5a97c115507f68734887160b575840899056e1533488e3fddd3a11fec1f');
assert.strictEqual(data.cards.length, 198);
assert.ok(bundle.includes('function resolveConditionalFollowUpsAfterPrimary'));
assert.ok(bundle.includes('GL_ACTIVE_AUDIO_POOL=new Set()'));
assert.ok(bundle.includes("a.addEventListener('ended',release,{once:true})"));
assert.ok(bundle.includes("a.addEventListener('error',release,{once:true})"));
assert.ok(reducer.includes("require('../effects/conditional-follow-up')"));
assert.ok(reducer.includes('CONDITIONAL_FOLLOW_UP_RESOLVED'));
assert.ok(reducer.includes('first_player_id === playerId && isAttackSkillCard(card)'));
for (const stale of ['conditional_bonus_before_defense', 'dodgeResidualDamage', 'conditionalAttackBonus', 'exactDamageAfterDodge', 'needs approval']) {
  assert.ok(!bundle.includes(stale), `PvP bundle stale branch remains: ${stale}`);
  assert.ok(!reducer.includes(stale), `PvP reducer stale branch remains: ${stale}`);
}
assert.strictEqual(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version, '3.0.42');
void requireFromHere;
console.log('PASS PvP v3.29: authoritative generic follow-ups, no phantom response/pending, and retained active-audio lifecycle.');
