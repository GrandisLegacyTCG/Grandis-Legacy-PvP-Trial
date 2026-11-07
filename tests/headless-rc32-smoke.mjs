import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Season0HeadlessAuthority } from '../server/headless-rc32.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const makeEngine = () => new Season0HeadlessAuthority(join(ROOT, 'client'));

const host = makeEngine();
assert.equal(host.sourceMode, 'PVP');
assert.equal(host.revision, 0);
assert.equal(host.starterIds.length, 5);
assert.throws(() => host.completeOpening(1), /unavailable/);
assert.throws(() => host.start({ player1DeckKey: 'S1-CARD', player2DeckKey: host.starterIds[1] }), /known Season 0/);
assert.equal(host.revision, 0);
const started = host.start({ player1DeckKey: host.starterIds[0], player2DeckKey: host.starterIds[1], player1Name: 'Alice', player2Name: 'Bob' });
assert.equal(started.revision, 1);
assert.throws(() => host.start({ player1DeckKey: host.starterIds[0], player2DeckKey: host.starterIds[0] }), /already started/);
const before = host._canonicalForServerOnly();
assert.equal(before.appState.pvpHumanVsHuman, true);
assert.equal(before.appState.pvpPlayerNames.PLAYER, 'Alice');
assert.equal(before.appState.pvpPlayerNames.AI, 'Bob');
const str = JSON.stringify(before.appState);
assert.match(str, /S0-/);
assert.doesNotMatch(str, /S1-[A-Z]{2,}/);
assert.throws(() => host.completeOpening(3), /Invalid first seat/);
const opened = host.completeOpening(2);
assert.equal(opened.firstSeat, 2);
assert.equal(opened.revision, 2);
const after = host._canonicalForServerOnly();
assert.equal(after.appState.pvpHumanVsHuman, true);
assert.equal(after.appState.openingHandsDrawn, true);
assert.equal(after.appState.openingManaDrawn, true);
assert.equal(after.appState.playerHand.length, 6); // opening hand only
assert.equal(after.appState.aiHand.length, 7); // seat 2 is first: opening 6 + mandatory Draw Phase draw
assert.equal(after.appState.turn, 'AI'); // canonical seat 2 side
assert.equal(after.appState.phase, 'Deploy'); // first Draw Phase already resolved
assert.equal(after.appState.playerManaPoolCards.length, 3);
assert.equal(after.appState.aiManaPoolCards.length, 4); // 3 starting + first Draw Phase Mana Regen
assert.throws(() => host.completeOpening(2), /unavailable/);
// Season 1 used one isolated VM per match. A second S0 game must not
// share names, opening state, Hand or revision with the first game.
const second = makeEngine();
second.start({ player1DeckKey: second.starterIds[4], player2DeckKey: second.starterIds[3], player1Name: 'Carol', player2Name: 'Dave' });
assert.equal(second.revision, 1);
assert.equal(second._canonicalForServerOnly().appState.playerHand.length, 0);
assert.equal(second._canonicalForServerOnly().appState.pvpPlayerNames.PLAYER, 'Carol');
assert.equal(host._canonicalForServerOnly().appState.pvpPlayerNames.PLAYER, 'Alice');
second.completeOpening(1);
assert.equal(second.revision, 2);
assert.equal(second._canonicalForServerOnly().appState.turn, 'PLAYER');
assert.equal(second._canonicalForServerOnly().appState.playerHand.length, 7);
assert.equal(second._canonicalForServerOnly().appState.aiHand.length, 6);
assert.equal(host._canonicalForServerOnly().appState.turn, 'AI');

console.log('PASS: RC32 S0 VM authority boot + two S0 starters + no S1 identifiers + approved override guard + human-vs-human initialization + server opening hands/shards + 2 independent VM rooms + negative tests.');
console.log('NOTICE: This file tests headless bootstrap only; network/privacy tests run separately; real-browser and Northflank deployment NOT VERIFIED.');
