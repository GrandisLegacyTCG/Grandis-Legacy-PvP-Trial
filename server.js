import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createGameplayIntentRouter } from './server/gameplay-intent-router.mjs';
import { normalizeHeadlessRuntimeMetadata } from './server/headless-runtime-compat.mjs';

const PORT = Number(process.env.PORT || 3000);
const HOST = String(process.env.HOST || process.env.GL_PVP_HOST || '0.0.0.0').trim() || '0.0.0.0';
const BASE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(BASE, 'public');
const VERSION = 'Grandis Legacy PvP v3.70 — Fresh VS AI v6.80 Base — Single Room — 2 Human Players';
const BUILD_ID = 'gl-pvp-3.70-v680-fresh-r4-local-assets-hydration-2026-10-02';
const OPPONENT_SHARD_HANDLE_SECRET = randomBytes(32).toString('hex');
const MAX_ROOM_LOGS = 120;
const MAX_PUBLIC_ROOM_LOGS = 40; // Keep network snapshots lean; the server may retain more room diagnostics internally.
const MAX_SPECTATORS = 0;
const FIXED_ROOM_ID = 'GRANDIS_PVP';
const GAMEPLAY_INTENT_ROUTER = createGameplayIntentRouter();
const TEACHING_VIEW_PASSWORD = String(process.env.GL_TEACHING_VIEW_PASSWORD || process.env.PVP_TEACHING_VIEW_PASSWORD || '');
function teachingViewConfigured() { return TEACHING_VIEW_PASSWORD.length > 0; }
function teachingPasswordMatches(value) {
  if (!teachingViewConfigured()) return false;
  const actual = Buffer.from(TEACHING_VIEW_PASSWORD);
  const supplied = Buffer.from(String(value || ''));
  return actual.length === supplied.length && timingSafeEqual(actual, supplied);
}
const PLAYER1_SETUP_RECONNECT_GRACE_MS = Math.max(1000, Number(process.env.PVP_PLAYER1_SETUP_RECONNECT_GRACE_MS || 60 * 1000));
const LOBBY_NO_DECK_TIMEOUT_MS = Math.max(1000, Number(process.env.PVP_LOBBY_NO_DECK_TIMEOUT_MS || 3 * 60 * 1000));
const LOBBY_WITH_DECK_TIMEOUT_MS = Math.max(1000, Number(process.env.PVP_LOBBY_WITH_DECK_TIMEOUT_MS || 5 * 60 * 1000));
const MATCH_DISCONNECT_TIMEOUT_MS = Math.max(1000, Number(process.env.PVP_MATCH_DISCONNECT_TIMEOUT_MS || 5 * 60 * 1000));
const DISCONNECT_SWEEP_MS = Math.max(250, Number(process.env.PVP_DISCONNECT_SWEEP_MS || 5000));
const PLAYER_IDLE_WARNING_MS = Math.max(1000, Number(process.env.PVP_PLAYER_IDLE_WARNING_MS || 5 * 60 * 1000));
const PLAYER_IDLE_RELEASE_MS = Math.max(PLAYER_IDLE_WARNING_MS + 1000, Number(process.env.PVP_PLAYER_IDLE_RELEASE_MS || 10 * 60 * 1000));
const PLAYER_IDLE_SWEEP_MS = Math.max(1000, Number(process.env.PVP_PLAYER_IDLE_SWEEP_MS || 5000));
const FINISHED_MATCH_CLEANUP_MS = 60 * 1000;
const RUNTIME_SYNC_STATUS = Object.freeze({
  version: 'v3.70-v680-fresh',
  authorityVerified: true,
  legacyBridgeSynchronized: true,
  fullIntentOnlyMigrationComplete: true
});
const ACTIVE_CARD_DATA_FILE = join(BASE, 'data/season1/cards.runtime.v0.16.2.json');
const ACTIVE_EFFECT_DATA_FILE = join(BASE, 'data/season1/effect-recipes.runtime.v0.15.2.json');
const ACTIVE_HERO_COMPONENT_FILE = join(BASE, 'data/season1/hero-components.runtime.v1.1.0.json');
const ACTIVE_SOURCE_CONFIG_FILE = join(BASE, 'data/config/active-runtime-source-stack.v1.94.2.json');

function loadActiveRuntimeSources() {
  const cards = JSON.parse(readFileSync(ACTIVE_CARD_DATA_FILE, 'utf8'));
  const effects = JSON.parse(readFileSync(ACTIVE_EFFECT_DATA_FILE, 'utf8'));
  const heroComponents = JSON.parse(readFileSync(ACTIVE_HERO_COMPONENT_FILE, 'utf8'));
  const config = JSON.parse(readFileSync(ACTIVE_SOURCE_CONFIG_FILE, 'utf8'));
  const cardCount = Array.isArray(cards.cards)
    ? cards.cards.length
    : Object.values(cards.families || {}).reduce((sum, family) => sum + ((family && family.cards) || []).length, 0);
  const effectCount = Array.isArray(effects.effect_recipes) ? effects.effect_recipes.length : 0;
  const canonicalHash = '7ac1f90f6a9654cf575ac41db64a052901005905b1cf01f3bfc7532873cc9389';
  const heroComponentHash = 'f36f1cc83eb9845743176c3af71f7823125353eae73e832588e9d8b42c6818be';
  if (cards.schema_version !== '0.16.2' || cards.canonical_registry_hash !== canonicalHash) throw new Error(`Active cards source mismatch: ${cards.schema_version || 'missing'}`);
  if (cardCount !== 200) throw new Error(`Active card count mismatch: ${cardCount}`);
  if (effects.schema_version !== '0.15.2' || effects.canonical_registry_hash !== canonicalHash) throw new Error(`Active effects source mismatch: ${effects.schema_version || 'missing'}`);
  if (effectCount !== 200) throw new Error(`Active effect recipe count mismatch: ${effectCount}`);
  if (heroComponents.schema_version !== '1.1.0' || heroComponents.registry_hash !== heroComponentHash) throw new Error(`Hero Component Authority mismatch: ${heroComponents.schema_version || 'missing'}`);
  const heroComponentCounts = {
    racialTraits: Array.isArray(heroComponents.racial_traits) ? heroComponents.racial_traits.length : 0,
    classAbilities: Array.isArray(heroComponents.class_abilities) ? heroComponents.class_abilities.length : 0,
    heroProfiles: Array.isArray(heroComponents.hero_profiles) ? heroComponents.hero_profiles.length : 0,
    heroCompositions: Array.isArray(heroComponents.hero_compositions) ? heroComponents.hero_compositions.length : 0
  };
  if (heroComponentCounts.racialTraits !== 6 || heroComponentCounts.classAbilities !== 16 || heroComponentCounts.heroProfiles !== 10 || heroComponentCounts.heroCompositions !== 30) throw new Error(`Hero Component counts mismatch: ${JSON.stringify(heroComponentCounts)}`);
  return { cards, effects, heroComponents, config, cardCount, effectCount, heroComponentCounts };
}

const ACTIVE_RUNTIME_SOURCES = loadActiveRuntimeSources();
const ACTIVE_CARDS_BY_ID = (() => {
  const out = {};
  const cards = ACTIVE_RUNTIME_SOURCES.cards;
  if (Array.isArray(cards.cards)) for (const card of cards.cards) if (card && card.card_id) out[card.card_id] = card;
  for (const family of Object.values(cards.families || {})) for (const card of (family && family.cards) || []) if (card && card.card_id) out[card.card_id] = card;
  return out;
})();
const RUNTIME_CODE = readFileSync(join(ROOT, 'engine/js/static-data.js'), 'utf8') + '\n' + readFileSync(join(ROOT, 'engine/js/runtime-authority.js'), 'utf8') + '\n' + readFileSync(join(ROOT, 'engine/shared-app/active-starters.js'), 'utf8') + '\n' + readFileSync(join(ROOT, 'engine/shared-app/app.bundle.js'), 'utf8');
// Compile the large shared browser runtime once at process boot. Every match still gets an isolated VM
// context, but match start no longer asks V8 to parse/compile ~12 MB of runtime source again.
const RUNTIME_SCRIPT = new vm.Script(RUNTIME_CODE, { filename: 'grandis-legacy-pvp-runtime.js' });
const STARTER_PRESET_FILE = join(ROOT, 'starter_deck_examples/Grandis_Legacy_Starter_Deck_Presets_v1.6.1_PvP.json');
const STARTER_DECK_OPTIONS = (() => {
  try {
    const parsed = JSON.parse(readFileSync(STARTER_PRESET_FILE, 'utf8'));
    return (parsed.presets || parsed.starters || parsed.decks || []).map((d) => ({ key: safeDeckKey(d.active_starter_id || d.preset_id || d.key), label: safeText(d.display_name || d.deck_name || d.active_starter_id || d.preset_id, 100) })).filter((d) => d.key && d.label);
  } catch {
    return [
      { key: 'starter_01_elemental_lord_conqueror_renegade', label: 'Starter 1 — Elemental Lord / Conqueror / Renegade' },
      { key: 'starter_02_saint_crusader_grand_ranger', label: 'Starter 2 — Saint / Crusader / Grand Ranger' },
      { key: 'starter_03_arcane_duelist_elemental_lord_saint', label: 'Starter 3 — Arcane Duelist / Elemental Lord / Saint' },
      { key: 'starter_04_grand_ranger_grand_arbalest_renegade', label: 'Starter 4 — Grand Ranger / Grand Arbalest / Renegade' },
      { key: 'starter_05_renegade_arcane_duelist_elemental_lord', label: 'Starter 5 — Renegade / Arcane Duelist / Elemental Lord' }
    ];
  }
})();
const STARTER_DECK_MAP = new Map(STARTER_DECK_OPTIONS.map((d) => [d.key, d]));
const STARTER_DECK_DATA_MAP = (() => {
  try {
    const parsed = JSON.parse(readFileSync(STARTER_PRESET_FILE, 'utf8'));
    const decks = parsed.presets || parsed.starters || parsed.decks || [];
    return new Map(decks.map((deck) => [safeDeckKey(deck.active_starter_id || deck.preset_id || deck.key), deck]).filter(([key]) => key));
  } catch { return new Map(); }
})();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8'
};

const rooms = new Map();
const clone = (x) => JSON.parse(JSON.stringify(x));
const HIDDEN_CARD_BACK = '__HIDDEN_CARD_BACK__';
function newSeatToken() { return randomBytes(24).toString('base64url'); }
function tokenHash(token) { return token ? createHash('sha256').update(String(token)).digest('hex') : ''; }
function tokenMatches(client, token) { return Boolean(client && token && client.seatTokenHash && client.seatTokenHash === tokenHash(token)); }
function hiddenCards(count) { return Array(Math.max(0, Number(count || 0))).fill(HIDDEN_CARD_BACK); }

function safeText(value, max = 120) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
function safeRoom(value) {
  return FIXED_ROOM_ID;
}
function safeClient(value) {
  const raw = safeText(value || '', 80).replace(/[^A-Za-z0-9_-]/g, '');
  return raw || '';
}
function safeDeckKey(value) {
  return safeText(value || '', 100).replace(/[^A-Za-z0-9_-]/g, '');
}
function deckOption(key) {
  return STARTER_DECK_MAP.get(safeDeckKey(key)) || null;
}
function starterDeckData(key) {
  return STARTER_DECK_DATA_MAP.get(safeDeckKey(key)) || null;
}
function normalizeStarterFormation(deckKey, value) {
  const deck = starterDeckData(deckKey);
  const base = deck?.default_formation;
  const lanes = ['LEFT', 'CENTER', 'RIGHT'];
  if (!base || lanes.some((lane) => !safeText(base[lane], 80))) return null;
  const expected = lanes.map((lane) => safeText(base[lane], 80)).sort();
  if (value == null) return { LEFT: safeText(base.LEFT, 80), CENTER: safeText(base.CENTER, 80), RIGHT: safeText(base.RIGHT, 80) };
  if (!value || typeof value !== 'object') return null;
  const proposed = lanes.map((lane) => safeText(value[lane], 80));
  if (proposed.some((id) => !id) || new Set(proposed).size !== 3) return null;
  if (proposed.slice().sort().join('|') !== expected.join('|')) return null;
  return { LEFT: proposed[0], CENTER: proposed[1], RIGHT: proposed[2] };
}
function sameFormation(a, b) {
  return Boolean(a && b && ['LEFT','CENTER','RIGHT'].every((lane) => a[lane] === b[lane]));
}
function starterDeckWithFormation(client) {
  if (!client || client.deckSource !== 'starter') return null;
  const deck = starterDeckData(client.deckKey);
  if (!deck) return null;
  const base = normalizeStarterFormation(client.deckKey, null);
  const selected = normalizeStarterFormation(client.deckKey, client.formation || base);
  if (!selected || sameFormation(base, selected)) return null;
  const out = clone(deck);
  out.default_formation = selected;
  return out;
}
function applyClientDeckToStartOptions(startOptions, client, sidePrefix) {
  if (client.deckData) { startOptions[`${sidePrefix}Deck`] = client.deckData; return; }
  const starterWithFormation = starterDeckWithFormation(client);
  if (starterWithFormation) { startOptions[`${sidePrefix}Deck`] = starterWithFormation; return; }
  startOptions[`${sidePrefix}DeckKey`] = client.deckKey;
}
function safeCustomDeck(value) {
  if (!value || typeof value !== 'object') return null;
  const json = JSON.stringify(value);
  if (json.length > 600000) throw new Error('Custom deck JSON is too large.');
  const deck = JSON.parse(json);
  if (!Array.isArray(deck.main_deck)) throw new Error('Invalid custom deck: missing main_deck.');
  let mainCount = 0;
  const copies = new Map();
  for (const entry of deck.main_deck) {
    const id = safeText(entry?.card_id || entry?.cardId || entry?.id || '', 80);
    const quantity = Math.max(0, Math.floor(Number(entry?.quantity ?? entry?.qty ?? 1) || 0));
    mainCount += quantity;
    if (id && quantity) copies.set(id, (copies.get(id) || 0) + quantity);
  }
  if (mainCount < 50 || mainCount > 60) throw new Error(`Custom Main Deck must contain 50 to 60 cards (found ${mainCount}).`);
  for (const [id, quantity] of copies) {
    const card = ACTIVE_CARDS_BY_ID[id];
    if (!card) throw new Error(`Unknown card ID in custom Main Deck: ${id}.`);
    if (card?.is_ultimate === true) { if (quantity > 1) throw new Error(`Ultimate card maximum is 1 copy: ${id} x${quantity}.`); }
    else if (quantity > 3) throw new Error(`Normal card maximum is 3 copies: ${id} x${quantity}.`);
  }
  const name = safeText(deck.display_name || deck.deck_name || 'Imported Custom Deck', 100) || 'Imported Custom Deck';
  return { deck, name };
}
function nowIso() { return new Date().toISOString(); }
function sideForSeat(seat) { return Number(seat) === 2 ? 'AI' : 'PLAYER'; }
function publicSeatLabel(seat) { return Number(seat) === 2 ? 'Player 2' : 'Player 1'; }
function publicSideName(side) { return side === 'AI' ? 'Player 2' : 'Player 1'; }
function humanizeRuntimeText(text) { return String(text || '').replace(/\bAI\b/g, 'Player 2').replace(/\bPLAYER\b/g, 'Player 1'); }
function sideStateArray(state, side, zone) {
  if (!state) return [];
  const key = side === 'AI'
    ? ({ hand: 'aiHand', discard: 'aiDiscard', deck: 'aiDeck', legacy: 'aiLegacy' })[zone]
    : ({ hand: 'playerHand', discard: 'playerDiscard', deck: 'playerDeck', legacy: 'playerLegacy' })[zone];
  return key && Array.isArray(state[key]) ? state[key] : [];
}
function multisetAdded(before, after) {
  const counts = new Map();
  for (const id of before || []) counts.set(id, (counts.get(id) || 0) + 1);
  const out = [];
  for (const id of after || []) {
    const left = counts.get(id) || 0;
    if (left > 0) counts.set(id, left - 1); else out.push(id);
  }
  return out;
}
function multisetRemoved(before, after) { return multisetAdded(after || [], before || []); }
function sideHeroesState(state, side) { return (side === 'AI' ? state?.aiHeroes : state?.playerHeroes) || {}; }
function cardPublicFamily(cardId) {
  const c = ACTIVE_CARDS_BY_ID[cardId] || {};
  return String(c.family || c.classification || c.card_category || c.type || 'Card');
}
function cardPublicRank(cardId) {
  const c = ACTIVE_CARDS_BY_ID[cardId] || {};
  const raw = String(c.identity?.rank || c.class_rank || '');
  if (/III|3/i.test(raw)) return 3;
  if (/II|2/i.test(raw)) return 2;
  if (/I|1/i.test(raw)) return 1;
  return 0;
}
function responseOptionContext(beforeState, actorSide, intent) {
  if (intent !== 'confirmSelectedResponse') return null;
  const rw = beforeState && beforeState.responseWindow;
  if (!rw || rw.response_owner !== actorSide || !Array.isArray(rw.options)) return null;
  const idx = Number(rw.selected);
  const opt = Number.isInteger(idx) && idx >= 0 ? rw.options[idx] : null;
  if (!opt || !opt.card_id) return null;
  return {
    card_id: opt.card_id,
    hand_index: opt.hand_index,
    source_side: actorSide,
    source_lane: opt.source_lane || rw.target_lane || null,
    target_side: rw.target_side || actorSide,
    target_lane: rw.target_lane || null,
    response_card: true
  };
}
function publicActionContext(beforeState, afterState, actorSide, intent) {
  const responseCtx = responseOptionContext(beforeState, actorSide, intent);
  if (responseCtx) return responseCtx;
  const candidates = [
    afterState?.responseWindow?.action,
    afterState?.responseWindow,
    beforeState?.pending,
    afterState?.pending
  ];
  for (const raw of candidates) {
    if (!raw || !raw.card_id) continue;
    const sourceSide = raw.source_side || raw.side || actorSide;
    if (sourceSide !== actorSide) continue;
    return {
      card_id: raw.card_id,
      hand_index: raw.hand_index,
      source_side: actorSide,
      source_lane: raw.source_lane || null,
      target_side: raw.target_side || afterState?.responseWindow?.target_side || null,
      target_lane: raw.target_lane || afterState?.responseWindow?.target_lane || null,
      target_lanes: Array.isArray(raw.target_lanes) ? raw.target_lanes.slice() : null,
      triple_shot_area: !!raw.triple_shot_area
    };
  }
  return null;
}
function physicalShardPoolForSide(state, side) {
  return side === 'AI'
    ? (Array.isArray(state?.aiManaPoolCards) ? state.aiManaPoolCards : [])
    : (Array.isArray(state?.playerManaPoolCards) ? state.playerManaPoolCards : []);
}
function shardGainEntries(beforeState, afterState) {
  const entries = [];
  for (const side of ['PLAYER','AI']) {
    const beforePool = physicalShardPoolForSide(beforeState, side);
    const afterPool = physicalShardPoolForSide(afterState, side);
    const counts = new Map();
    for (const shard of beforePool) {
      const uid = String(shard?.uid || '');
      if (!uid) continue;
      counts.set(uid, (counts.get(uid) || 0) + 1);
    }
    let group = 0;
    afterPool.forEach((shard, poolIndex) => {
      const uid = String(shard?.uid || '');
      if (!uid) return;
      const n = counts.get(uid) || 0;
      if (n > 0) { counts.set(uid, n - 1); return; }
      // Presentation transport intentionally carries no Shard UID/type/class/value.
      // The authoritative snapshot already owns the final physical Pool; clients only
      // receive a face-safe destination index and animate the Shard Deck card back.
      entries.push({ side, pool_index: poolIndex, group_index: group++ });
    });
  }
  return entries;
}
function buildShardGainAnimationEvent(beforeState, afterState) {
  const entries = shardGainEntries(beforeState, afterState);
  return entries.length ? { kind: 'shard_gain', entries } : null;
}
function newlyAddedAttachment(beforeState, afterState, side, cardId) {
  const beforeIds = new Set((beforeState?.activeAttachments || []).map((a) => a && (a.attachment_id || `${a.side}:${a.lane}:${a.slot}:${a.card_id}`)).filter(Boolean));
  return (afterState?.activeAttachments || []).find((a) => {
    if (!a || a.side !== side || (cardId && a.card_id !== cardId)) return false;
    const id = a.attachment_id || `${a.side}:${a.lane}:${a.slot}:${a.card_id}`;
    return !beforeIds.has(id);
  }) || null;
}

function attachmentIdentity(a) {
  if (!a) return null;
  return a.attachment_id || `${a.side}:${a.lane}:${Number(a.slot || 0)}:${a.card_id}`;
}
function removedAttachments(beforeState, afterState) {
  const afterIds = new Set((afterState?.activeAttachments || []).map(attachmentIdentity).filter(Boolean));
  return (beforeState?.activeAttachments || []).filter((a) => a && attachmentIdentity(a) && !afterIds.has(attachmentIdentity(a)));
}
function countValues(values) {
  const counts = new Map();
  for (const value of values || []) counts.set(value, (counts.get(value) || 0) + 1);
  return counts;
}
function takeCount(counts, value) {
  const n = counts.get(value) || 0;
  if (n <= 0) return false;
  if (n === 1) counts.delete(value); else counts.set(value, n - 1);
  return true;
}
function removedHandEntries(beforeHand, afterHand) {
  const afterCounts = countValues(afterHand || []);
  const out = [];
  (beforeHand || []).forEach((cardId, handIndex) => {
    const n = afterCounts.get(cardId) || 0;
    if (n > 0) {
      if (n === 1) afterCounts.delete(cardId); else afterCounts.set(cardId, n - 1);
    } else out.push({ card_id: cardId, hand_index: handIndex });
  });
  return out;
}
function heldAttackFromResponseWindow(rw) {
  if (!rw) return null;
  if (rw.card_id && String(rw.kind || '') === 'incoming_attack') {
    const action = rw.action || {};
    const commitToken = action.commit_token || rw.commit_token || null;
    if (commitToken) return {
      card_id: rw.card_id,
      source_side: rw.source_side || action.source_side || action.side || null,
      source_lane: rw.source_lane || action.source_lane || null,
      commit_token: String(commitToken)
    };
  }
  // A committed Response counter window temporarily changes the active window from
  // incoming_attack to incoming_card. Follow its continuation frame so the original
  // Attack remains held until the entire nested Response chain reaches a terminal state.
  if (rw.committed_response_counter) {
    return heldAttackFromResponseWindow(rw.response_continuation || rw.original_attack_context || null);
  }
  return null;
}
function heldAttackLifecycle(state) {
  if (!state) return null;
  const heldFromResponse = heldAttackFromResponseWindow(state.responseWindow);
  if (heldFromResponse) return heldFromResponse;
  const pending = state.pending;
  if (pending && ['optional_swap','optional_target_swap','post_attack_reposition_choice'].includes(String(pending.type || ''))) {
    const commitToken = pending.commit_token || null;
    const cardId = pending.deferred_discard_card_id || pending.card_id || null;
    if (commitToken && cardId) return {
      card_id: cardId,
      source_side: pending.deferred_discard_side || pending.source_side || pending.side || null,
      source_lane: pending.source_lane || null,
      commit_token: String(commitToken)
    };
  }
  return null;
}
function heldAnimationKey(lifecycle) {
  return lifecycle?.commit_token ? `pvp-hold:${lifecycle.commit_token}` : null;
}
function finalCardDestination(beforeState, afterState, lifecycle) {
  if (!lifecycle?.card_id || !lifecycle?.source_side) return null;
  const side = lifecycle.source_side;
  const cardId = lifecycle.card_id;
  const handAdded = multisetAdded(sideStateArray(beforeState, side, 'hand'), sideStateArray(afterState, side, 'hand'));
  if (handAdded.includes(cardId)) return { type: 'hand', side };
  const attachment = newlyAddedAttachment(beforeState, afterState, side, cardId);
  if (attachment) return { type: 'attachment', side: attachment.side, lane: attachment.lane, slot: Number(attachment.slot || 0) };
  const discardAdded = multisetAdded(sideStateArray(beforeState, side, 'discard'), sideStateArray(afterState, side, 'discard'));
  if (discardAdded.includes(cardId)) return { type: 'discard', side };
  return null;
}
function buildPublicAnimationEvents(beforeState, afterState, actorSide, intent, revision) {
  if (!beforeState || !afterState) return [];
  const events = [];
  const add = (event) => {
    if (!event) return;
    event.revision = revision;
    event.id = event.id || `anim-${revision}-${events.length + 1}-${safeText(event.kind || intent, 40)}-${safeText(event.card_id || event.to_card_id || event.lane || '', 40)}`;
    events.push(event);
  };
  const handBefore = sideStateArray(beforeState, actorSide, 'hand');
  const handAfter = sideStateArray(afterState, actorSide, 'hand');
  const removed = multisetRemoved(handBefore, handAfter);
  const discardAdded = multisetAdded(sideStateArray(beforeState, actorSide, 'discard'), sideStateArray(afterState, actorSide, 'discard'));
  const ctx = publicActionContext(beforeState, afterState, actorSide, intent);
  const responseCardId = afterState.responseWindow && afterState.responseWindow.source_side === actorSide
    ? (afterState.responseWindow.action && afterState.responseWindow.action.card_id) || afterState.responseWindow.card_id
    : null;
  let cardId = (ctx && ctx.card_id) || responseCardId || null;
  let attachment = newlyAddedAttachment(beforeState, afterState, actorSide, cardId);
  if (!cardId && attachment) cardId = attachment.card_id;
  if (!cardId && discardAdded.length === 1) cardId = discardAdded[0];
  const cardBecamePublic = Boolean(cardId && (
    removed.includes(cardId) || discardAdded.includes(cardId) || attachment || responseCardId === cardId
  ));
  const tributePending = beforeState.pending && beforeState.pending.type === 'tribute_target' && beforeState.pending.card_id === cardId;
  let tributeTargetLane = null;
  if (tributePending) {
    for (const lane of ['LEFT','CENTER','RIGHT']) {
      const a = sideHeroesState(beforeState, actorSide)[lane] || {};
      const b = sideHeroesState(afterState, actorSide)[lane] || {};
      if ((a.card_id && b.card_id && a.card_id !== b.card_id) || Number(a.exp_total || 0) !== Number(b.exp_total || 0) || (a.exp_cards || []).length !== (b.exp_cards || []).length) { tributeTargetLane = lane; break; }
    }
  }
  let primaryCardMotionEmitted = false;
  if (cardId && cardBecamePublic && !['confirmDrawReplacement','commitDrawReplacementChoice'].includes(intent)) {
    if (!attachment) attachment = newlyAddedAttachment(beforeState, afterState, actorSide, cardId);
    const action = ctx || {};
    const targetLane = tributePending ? tributeTargetLane || beforeState.pending.target_lane || action.target_lane || null : action.target_lane || afterState.responseWindow?.target_lane || null;
    const afterHeld = heldAttackLifecycle(afterState);
    const isHeldAttack = !tributePending && afterHeld && afterHeld.card_id === cardId && afterHeld.source_side === actorSide;
    add({
      kind: tributePending ? 'tribute' : 'card_play',
      card_id: cardId,
      family: cardPublicFamily(cardId),
      actor_side: actorSide,
      hand_index: Number.isInteger(Number(action.hand_index)) ? Number(action.hand_index) : Math.max(0, handBefore.lastIndexOf(cardId)),
      source_side: actorSide,
      source_lane: action.source_lane || afterState.responseWindow?.source_lane || null,
      target_side: tributePending ? actorSide : action.target_side || afterState.responseWindow?.target_side || null,
      target_lane: targetLane,
      target_lanes: Array.isArray(action.target_lanes) ? action.target_lanes.slice() : null,
      triple_shot_area: !!action.triple_shot_area,
      hold_key: isHeldAttack ? heldAnimationKey(afterHeld) : null,
      held_until_resolution: !!isHeldAttack,
      destination: tributePending ? { type: 'hero', side: actorSide, lane: targetLane }
        : attachment ? { type: 'attachment', side: attachment.side, lane: attachment.lane, slot: Number(attachment.slot || 0) }
        : (discardAdded.includes(cardId) ? { type: 'discard', side: actorSide } : { type: 'target' })
    });
    primaryCardMotionEmitted = true;
  }

  // Secondary cards that move from Hand to public Discard are separate physical motions.
  // Capture them from authoritative before/after state, while excluding the primary played/
  // Response/Tribute card already represented by its dedicated motion family.
  for (const side of ['PLAYER','AI']) {
    const beforeHandSide = sideStateArray(beforeState, side, 'hand');
    const afterHandSide = sideStateArray(afterState, side, 'hand');
    const discarded = countValues(multisetAdded(sideStateArray(beforeState, side, 'discard'), sideStateArray(afterState, side, 'discard')));
    const removedEntries = removedHandEntries(beforeHandSide, afterHandSide);
    let skipPrimary = primaryCardMotionEmitted && side === actorSide && cardId ? 1 : 0;
    for (const entry of removedEntries) {
      if (!takeCount(discarded, entry.card_id)) continue;
      if (skipPrimary > 0 && entry.card_id === cardId) { skipPrimary -= 1; continue; }
      add({ kind: 'hand_to_discard', actor_side: side, card_id: entry.card_id, hand_index: entry.hand_index });
    }
  }

  // Attachment release is presentation-only and follows a real canonical
  // Attachment -> owner's Discard transition.
  for (const removedAttachment of removedAttachments(beforeState, afterState)) {
    const side = removedAttachment.side === 'AI' ? 'AI' : 'PLAYER';
    const discardDelta = multisetAdded(sideStateArray(beforeState, side, 'discard'), sideStateArray(afterState, side, 'discard'));
    if (!discardDelta.includes(removedAttachment.card_id)) continue;
    add({
      kind: 'attachment_to_discard',
      actor_side: side,
      lane: removedAttachment.lane,
      slot: Number(removedAttachment.slot || 0),
      card_id: removedAttachment.card_id
    });
  }

  // Reverse Legacy motion on Revive: only emit when the exact active Legacy leaves
  // the lane and the same card returns to the canonical Legacy Deck.
  for (const side of ['PLAYER','AI']) {
    const legacyReturned = countValues(multisetAdded(sideStateArray(beforeState, side, 'legacy'), sideStateArray(afterState, side, 'legacy')));
    const beforeHeroes = sideHeroesState(beforeState, side);
    const afterHeroes = sideHeroesState(afterState, side);
    for (const lane of ['LEFT','CENTER','RIGHT']) {
      const beforeLegacy = beforeHeroes[lane]?.active_legacy_card_id || null;
      const afterLegacy = afterHeroes[lane]?.active_legacy_card_id || null;
      if (!beforeLegacy || beforeLegacy === afterLegacy || !takeCount(legacyReturned, beforeLegacy)) continue;
      add({ kind: 'legacy_to_deck', actor_side: side, lane, card_id: beforeLegacy });
    }
  }

  // A normal Attack may remain visually held through Response and later post-attack
  // decisions. Release only when canonical state proves its final destination.
  const beforeHeld = heldAttackLifecycle(beforeState);
  if (beforeHeld) {
    const destination = finalCardDestination(beforeState, afterState, beforeHeld);
    if (destination) {
      add({
        kind: 'held_card_release',
        actor_side: beforeHeld.source_side,
        card_id: beforeHeld.card_id,
        hold_key: heldAnimationKey(beforeHeld),
        destination
      });
    }
  }

  for (const side of ['PLAYER','AI']) {
    const beforeHeroes = sideHeroesState(beforeState, side);
    const afterHeroes = sideHeroesState(afterState, side);
    for (const lane of ['LEFT','CENTER','RIGHT']) {
      const beforeHero = beforeHeroes[lane] || {};
      const afterHero = afterHeroes[lane] || {};
      const beforeId = beforeHero.card_id || null;
      const afterId = afterHero.card_id || null;
      if (beforeId && afterId && beforeId !== afterId && cardPublicRank(afterId) > cardPublicRank(beforeId)) {
        add({
          kind: 'rank_up', actor_side: side, lane,
          from_card_id: beforeId, to_card_id: afterId,
          exp_card_ids: (() => { const ids = Array.isArray(beforeHero.exp_cards) ? beforeHero.exp_cards.slice() : []; if (tributePending && tributeTargetLane === lane && cardId && !ids.includes(cardId)) ids.push(cardId); return ids; })()
        });
      }
      const beforeLegacy = beforeHero.active_legacy_card_id || null;
      const afterLegacy = afterHero.active_legacy_card_id || null;
      if (!beforeLegacy && afterLegacy) add({ kind: 'legacy_to_field', actor_side: side, lane, card_id: afterLegacy });
    }
  }

  for (const side of ['PLAYER','AI']) {
    const drawBefore = Number(beforeState.cardsDrawnThisTurn && beforeState.cardsDrawnThisTurn[side] || 0);
    const drawAfter = Number(afterState.cardsDrawnThisTurn && afterState.cardsDrawnThisTurn[side] || 0);
    const beforeDeck = sideStateArray(beforeState, side, 'deck');
    const afterDeck = sideStateArray(afterState, side, 'deck');
    const added = multisetAdded(sideStateArray(beforeState, side, 'hand'), sideStateArray(afterState, side, 'hand'));
    // cardsDrawnThisTurn is reset to 0 at the start of every Draw Phase. Comparing only the
    // before/after counter can therefore miss the next-turn mandatory draw when both snapshots
    // contain the value 1. The physical Main Deck -> Hand movement is the stable authority.
    const physicalDrawCount = Math.min(added.length, Math.max(0, beforeDeck.length - afterDeck.length));
    const counterDrawCount = Math.max(0, drawAfter - drawBefore);
    const count = Math.max(physicalDrawCount, counterDrawCount);
    if (count > 0) {
      const fallback = afterState.lastDrawnCardBySide && afterState.lastDrawnCardBySide[side] || null;
      const cardIds = added.slice(-count);
      while (cardIds.length < count) cardIds.unshift(fallback);
      // Preserve the canonical Draw reason so mobile presentation can distinguish
      // mandatory Draw Phase motion from ordinary card-effect Draws. This is
      // presentation metadata only; gameplay state remains server-authoritative.
      const beforePresentationIds = new Set((beforeState.presentationEvents || []).filter((event) => event && event.type === 'CARD_DRAWN').map((event) => event.id).filter(Boolean));
      const freshPresentationDraws = (afterState.presentationEvents || []).filter((event) => event && event.type === 'CARD_DRAWN' && event.side === side && (!event.id || !beforePresentationIds.has(event.id)));
      const latestPresentationDraw = freshPresentationDraws.length ? freshPresentationDraws[freshPresentationDraws.length - 1] : null;
      const lastActualDraw = afterState.lastActualDrawEvent && afterState.lastActualDrawEvent.side === side ? afterState.lastActualDrawEvent : null;
      const drawReason = String((latestPresentationDraw && latestPresentationDraw.reason) || (lastActualDraw && lastActualDraw.reason) || 'CARD_EFFECT');
      add({ kind: 'draw', actor_side: side, count, card_ids: cardIds, card_id: cardIds[cardIds.length - 1] || fallback, reason: drawReason });
    }
  }
  const shardGainEvent = buildShardGainAnimationEvent(beforeState, afterState);
  if (shardGainEvent) add(shardGainEvent);

  // When one authoritative revision contains both a Main Deck draw and Shard gain
  // (normal Draw Phase), preserve the approved order: Main Deck -> Hand first,
  // then Shard Deck -> Pool. Keep this as a presentation composite only; canonical
  // state has already committed on the server.
  const drawIndexes = [];
  let shardIndex = -1;
  events.forEach((event, index) => {
    if (event?.kind === 'draw') drawIndexes.push(index);
    if (event?.kind === 'shard_gain') shardIndex = index;
  });
  if (drawIndexes.length && shardIndex >= 0) {
    const drawSpecs = drawIndexes.map((index) => clone(events[index]));
    const shard = clone(events[shardIndex]);
    const first = Math.min(drawIndexes[0], shardIndex);
    const removeSet = new Set([...drawIndexes, shardIndex]);
    const kept = events.filter((_, index) => !removeSet.has(index));
    const composite = {
      id: `anim-${revision}-draw-then-shards`, revision,
      kind: 'draw_then_shards', draw_specs: drawSpecs,
      shard_entries: shard.entries || []
    };
    kept.splice(Math.min(first, kept.length), 0, composite);
    events.length = 0;
    events.push(...kept);
  }
  const knownBattleFeedback = new Set((beforeState.pvpBattleFeedbackEvents || []).map((e) => e && e.id).filter(Boolean));
  const freshBattleFeedback = (afterState.pvpBattleFeedbackEvents || [])
    .filter((e) => e && e.id && !knownBattleFeedback.has(e.id))
    .slice()
    .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
  for (const feedback of freshBattleFeedback) {
    add({
      id: feedback.id,
      kind: 'battle_feedback',
      feedback_kind: feedback.kind || null,
      side: feedback.side || null,
      lane: feedback.lane || null,
      card_id: feedback.card_id || null,
      outcome: feedback.outcome || null,
      attack_kind: feedback.attack_kind || null,
      defense_kind: feedback.defense_kind || null,
      has_damage: Boolean(feedback.has_damage),
      play_sound: feedback.play_sound !== false,
      timestamp: Number(feedback.timestamp || Date.now())
    });
  }
  return events;
}
function buildPublicAnimationEvent(beforeState, afterState, actorSide, intent, revision) {
  return buildPublicAnimationEvents(beforeState, afterState, actorSide, intent, revision)[0] || null;
}
function normalizeHumanPvpProgression(board) {
  const st = board && board.appState;
  if (!st || !st.pvpHumanVsHuman) return false;
  let changed = false;
  // In two-human PvP the second canonical side is still named AI internally for v6.80
  // snapshot compatibility, but no AI director/control state may own progression.
  if (st.aiControl) { st.aiControl = null; changed = true; }
  if (st.phase === 'Draw' && (st.turn === 'PLAYER' || st.turn === 'AI')) {
    const side = st.turn;
    const drawComplete = st.drawPhaseResolvedFor === side && !st.drawPresentationPending && !st.pending && !st.responseWindow && !st.gameOver;
    if (drawComplete) {
      st.phase = 'Deploy';
      st.drawPhaseResolvedFor = null;
      st.drawPhaseContinuation = null;
      st.autoDrawAdvanceScheduled = false;
      st.pvpTurnReady = false;
      if (Array.isArray(st.log)) st.log.unshift((side === 'AI' ? 'Player 2' : 'Player 1') + ' completes Draw Phase and enters Deploy Phase automatically.');
      changed = true;
    }
  }
  // v6.80's bridge-immediate opening path for canonical side AI already lands on
  // Deploy after resolving Draw. Clear the Draw marker as well so both human seats
  // enter the exact same authoritative post-Draw state.
  if (st.phase === 'Deploy' && (st.turn === 'PLAYER' || st.turn === 'AI') && st.drawPhaseResolvedFor === st.turn && !st.pending && !st.responseWindow) {
    st.drawPhaseResolvedFor = null;
    st.drawPhaseContinuation = null;
    st.autoDrawAdvanceScheduled = false;
    st.pvpTurnReady = false;
    changed = true;
  }
  return changed;
}
function normalizeServerBoard(board) {
  const st = board && board.appState;
  if (!st) return board;
  st.racial = Math.max(0, Math.min(2, Number(st.racial || 0)));
  st.aiRacial = Math.max(0, Math.min(2, Number(st.aiRacial || 0)));
  st.pvpHumanVsHuman = true;
  normalizeHumanPvpProgression(board);
  // Result-popup visibility is client-local. Never let the headless server render consume it.
  st.gameResultShown = false;
  return board;
}


function maskAppStateForSeat(appState, seat, revealBothHands = false) {
  if (!appState) return appState;
  const st = clone(appState);
  const recipientSeat = Number(seat || 0);
  const hidePlayerHand = !revealBothHands && recipientSeat !== 1;
  const hideAiHand = !revealBothHands && recipientSeat !== 2;
  const hidePlayerLegacy = recipientSeat !== 1;
  const hideAiLegacy = recipientSeat !== 2;

  function maskSide(prefix, hideHand, hideLegacy) {
    const handKey = prefix === 'player' ? 'playerHand' : 'aiHand';
    const deckKey = prefix === 'player' ? 'playerDeck' : 'aiDeck';
    const legacyKey = prefix === 'player' ? 'playerLegacy' : 'aiLegacy';
    const handCountKey = prefix === 'player' ? 'playerHandCount' : 'aiHandCount';
    const deckCountKey = prefix === 'player' ? 'playerDeckCount' : 'aiDeckCount';
    const legacyCountKey = prefix === 'player' ? 'playerLegacyCount' : 'aiLegacyCount';
    const handCount = Array.isArray(st[handKey]) ? st[handKey].length : Number(st[handCountKey] || 0);
    const deckCount = Array.isArray(st[deckKey]) ? st[deckKey].length : Number(st[deckCountKey] || 0);
    const legacyCount = Array.isArray(st[legacyKey]) ? st[legacyKey].length : Number(st[legacyCountKey] || 0);
    st[handCountKey] = handCount;
    st[deckCountKey] = deckCount;
    st[legacyCountKey] = legacyCount;
    // Deck order is private even to its owner in PvP snapshots; the server keeps canonical order.
    st[deckKey] = hiddenCards(deckCount);
    if (hideHand) st[handKey] = hiddenCards(handCount);
    if (hideLegacy) st[legacyKey] = hiddenCards(legacyCount);
  }

  maskSide('player', hidePlayerHand, hidePlayerLegacy);
  maskSide('ai', hideAiHand, hideAiLegacy);
  function maskPhysicalMana(prefix, ownerSeat) {
    const poolKey = prefix === 'player' ? 'playerManaPoolCards' : 'aiManaPoolCards';
    const deckKey = prefix === 'player' ? 'playerManaDeck' : 'aiManaDeck';
    const classesKey = prefix === 'player' ? 'playerManaClasses' : 'aiManaClasses';
    const pool = Array.isArray(st[poolKey]) ? st[poolKey] : [];
    const deck = Array.isArray(st[deckKey]) ? st[deckKey] : [];
    // Shard Deck order/identity is private to every client; only the physical count is rendered.
    st[deckKey] = Array.from({ length: deck.length }, (_, i) => ({ hidden: true, slot_index: i }));
    // Battlefield Shard Pools are public information. Blindness belongs only to
    // the temporary Steal/opponent-Shard selection popup, whose independently
    // randomized opaque handles are applied after this viewer-safe board clone.
    // Keep the physical pool visible and in canonical Battlefield order.
    void ownerSeat; void classesKey; void pool;
  }
  maskPhysicalMana('player', 1);
  maskPhysicalMana('ai', 2);
  const localSide = recipientSeat === 1 ? 'PLAYER' : (recipientSeat === 2 ? 'AI' : null);
  if (st.lastDrawnCardBySide && typeof st.lastDrawnCardBySide === 'object') {
    for (const side of ['PLAYER','AI']) if (!localSide || side !== localSide) st.lastDrawnCardBySide[side] = HIDDEN_CARD_BACK;
  }
  if (Array.isArray(st.presentationEvents)) {
    st.presentationEvents = st.presentationEvents.map((event) => {
      const safe = clone(event);
      const side = safe.side || safe.actor_side;
      if (safe.type === 'CARD_DRAWN' && (!localSide || side !== localSide)) {
        safe.card_id = HIDDEN_CARD_BACK;
        if (Array.isArray(safe.card_ids)) safe.card_ids = hiddenCards(safe.card_ids.length);
      }
      return safe;
    });
  }
  if (!localSide) {
    st.pending = maskPendingForSpectator(st.pending);
    st.responseWindow = maskResponseWindow(st.responseWindow, null);
  } else {
    st.pending = maskPendingForSide(st.pending, localSide);
    st.responseWindow = maskResponseWindow(st.responseWindow, localSide);
  }
  // Battle feedback is transported once through match.lastAnimationEvents. The internal ledger
  // stays on the canonical server board for exact event generation, but is not duplicated into
  // each player/spectator snapshot. This trims payload and removes client-side ledger diffing.
  st.pvpBattleFeedbackEvents = [];
  if (Array.isArray(st.log)) st.log = st.log.slice(0, 20).map(humanizeRuntimeText);
  return st;
}
function pendingOwnerSide(pending) {
  if (!pending) return null;
  return pending.decision_side || pending.response_owner || pending.side || pending.source_side || null;
}
function maskPendingForSpectator(pending) {
  if (!pending) return pending;
  const safe = clone(pending);
  if (Array.isArray(safe.options)) safe.options = hiddenCards(safe.options.length);
  if (Array.isArray(safe.cards)) safe.cards = hiddenCards(safe.cards.length);
  if (Array.isArray(safe.choices)) safe.choices = hiddenCards(safe.choices.length);
  if (Array.isArray(safe.hand)) safe.hand = hiddenCards(safe.hand.length);
  if (safe.type === 'draw_replacement_choice') { safe.drawn_card_id = HIDDEN_CARD_BACK; delete safe.hand_index; delete safe.source_hero_card_id; }
  safe.private_masked = true;
  return safe;
}
function maskPendingForSide(pending, localSide) {
  if (!pending) return pending;
  const owner = pendingOwnerSide(pending);
  if (!owner || owner === localSide) return clone(pending);
  return maskPendingForSpectator(pending);
}
function maskResponseWindow(responseWindow, localSide) {
  if (!responseWindow) return responseWindow;
  const safe = clone(responseWindow);
  if (localSide && safe.response_owner === localSide) return safe;
  if (Array.isArray(safe.options)) safe.options = hiddenCards(safe.options.length);
  safe.private_masked = true;
  return safe;
}
function opponentShardChoiceHandle(revision, seat, uid) {
  return createHash('sha256').update(`${OPPONENT_SHARD_HANDLE_SECRET}|${Number(revision||0)}|${Number(seat||0)}|${String(uid||'')}`).digest('hex').slice(0,32);
}
function opponentShardPermutationKey(revision, seat, uid) {
  // Stable only for this authoritative revision/recipient. This keeps the popup
  // from jumping on repeated snapshots while breaking any positional relation
  // to the visible Battlefield Shard order. A new selection revision gets a
  // fresh opaque ordering automatically.
  return createHash('sha256').update(`perm|${OPPONENT_SHARD_HANDLE_SECRET}|${Number(revision||0)}|${Number(seat||0)}|${String(uid||'')}`).digest('hex');
}
function canonicalManaPoolForSide(st, side) {
  return side === 'AI' ? (Array.isArray(st?.aiManaPoolCards) ? st.aiManaPoolCards : []) : (Array.isArray(st?.playerManaPoolCards) ? st.playerManaPoolCards : []);
}
function validOpponentShardCandidates(canonicalState, pending) {
  const canonical = Array.isArray(pending?.candidates) ? pending.candidates : [];
  const ownerSide = pendingOwnerSide(pending) || pending?.side || 'PLAYER';
  const targetSide = pending?.target_side || (ownerSide === 'AI' ? 'PLAYER' : 'AI');
  const poolIds = new Set(canonicalManaPoolForSide(canonicalState, targetSide).map((sh) => String(sh?.uid || '')).filter(Boolean));
  return canonical.map((candidate, index) => ({ candidate, index })).filter((entry) => entry.candidate?.uid && poolIds.has(String(entry.candidate.uid)));
}
function maskOpponentShardPendingForRecipient(st, client, revision, canonicalState = null) {
  const p = st && st.pending;
  const canonicalPending = canonicalState?.pending;
  if (!p || p.type !== 'opponent_mana_selection' || !canonicalPending || canonicalPending.type !== 'opponent_mana_selection' || !client || client.role !== 'player') return;
  const localSide = sideForSeat(client.seat);
  const owner = pendingOwnerSide(canonicalPending);
  if (owner !== localSide) return;
  const valid = validOpponentShardCandidates(canonicalState, canonicalPending);
  const popupOrder = valid.slice().sort((a, b) => opponentShardPermutationKey(revision, client.seat, a.candidate.uid).localeCompare(opponentShardPermutationKey(revision, client.seat, b.candidate.uid)));
  p.candidates = popupOrder.map(({ candidate }) => ({ choice_handle: opponentShardChoiceHandle(revision, client.seat, candidate.uid) }));
  p.required_count = Math.min(Math.max(0, Number(canonicalPending.required_count || 1)), valid.length);
  // Preserve the viewer's face-down selection across authoritative snapshots without
  // exposing the selected Shard identity. Canonical selected_indices reference the
  // canonical pending candidate list; remap them onto the masked/filtered face-down
  // list so confirmation remains usable after the server acknowledges a click.
  const canonicalSelected = new Set((Array.isArray(canonicalPending.selected_indices) ? canonicalPending.selected_indices : []).map((value) => Number(value)));
  p.selected_indices = popupOrder
    .map((entry, maskedIndex) => canonicalSelected.has(Number(entry.index)) ? maskedIndex : -1)
    .filter((index) => index >= 0);
  p.pvp_pool_revision = Number(revision || 0);
}
function maskCanonicalBoardForRecipient(board, client, revision = 0) {
  if (!board) return board;
  const canonicalState = board?.appState || null;
  const masked = clone(board);
  const revealBothHands = Boolean(client && client.role === 'spectator' && client.teachingViewUnlocked);
  masked.appState = maskAppStateForSeat(masked.appState, client && client.role === 'player' ? client.seat : null, revealBothHands);
  maskOpponentShardPendingForRecipient(masked.appState, client, revision, canonicalState);
  masked.pvpPrivateStateMasked = true;
  masked.pvpRecipientSeat = client && client.role === 'player' ? client.seat : null;
  masked.pvpObserverBothHands = revealBothHands;
  masked.pvpSpectatorView = revealBothHands ? 'BOTH_HANDS' : 'CARD_BACKS';
  if (masked.appState) {
    masked.appState.pvpObserverBothHands = revealBothHands;
    masked.appState.pvpSpectatorView = masked.pvpSpectatorView;
  }
  return masked;
}

function animationEventsForRecipient(events, client) {
  const list = Array.isArray(events) ? clone(events) : [];
  const localSide = client && client.role === 'player' ? sideForSeat(client.seat) : null;
  return list.map((event) => {
    if (!event) return event;
    if (event.kind === 'draw_batch' && Array.isArray(event.events)) {
      event.events = event.events.map((drawEvent) => {
        const safe = clone(drawEvent);
        const side = safe.side || safe.actor_side;
        if (!localSide || side !== localSide) safe.card_id = HIDDEN_CARD_BACK;
        return safe;
      });
      return event;
    }
    if (event.kind === 'opening_sequence') {
      for (const key of ['opening_draw_events','post_opening_draw_events']) {
        if (!Array.isArray(event[key])) continue;
        event[key] = event[key].map((drawEvent) => {
          const safe = clone(drawEvent);
          const side = safe.side || safe.actor_side;
          if (!localSide || side !== localSide) safe.card_id = HIDDEN_CARD_BACK;
          return safe;
        });
      }
      return event;
    }
    if (event.kind === 'draw_then_shards' && Array.isArray(event.draw_specs)) {
      event.draw_specs = event.draw_specs.map((drawEvent) => {
        const safe = clone(drawEvent);
        if (!localSide || safe.actor_side !== localSide) {
          const count = Math.max(1, Number(safe.count || (safe.card_ids && safe.card_ids.length) || 1));
          safe.card_ids = hiddenCards(count);
          safe.card_id = HIDDEN_CARD_BACK;
        }
        return safe;
      });
      return event;
    }
    if (event.kind !== 'draw' || (localSide && event.actor_side === localSide)) return event;
    const count = Math.max(1, Number(event.count || (event.card_ids && event.card_ids.length) || 1));
    event.card_ids = hiddenCards(count);
    event.card_id = HIDDEN_CARD_BACK;
    return event;
  });
}

function sideNameForSeat(room, seat) {
  const client = [...room.players.values()].find((c) => c.seat === Number(seat));
  return client?.name || publicSeatLabel(seat);
}
function makePvpResult(room, winnerSeat, loserSeat, reason) {
  const st = room.engine?.board?.appState || {};
  const winnerName = sideNameForSeat(room, winnerSeat);
  const loserName = sideNameForSeat(room, loserSeat);
  return {
    winnerSeat: Number(winnerSeat),
    loserSeat: Number(loserSeat),
    winnerName,
    loserName,
    reason: safeText(reason || `${loserName} surrendered the match.`, 220),
    round: Number(st.round || 1),
    phase: safeText(st.phase || 'Unknown', 60),
    endedAt: nowIso()
  };
}
function applyServerSurrender(room, client, reasonOverride = null) {
  if (client?.role !== 'player' || !client.seat) throw new Error('Only active players can surrender.');
  if (!room.engine?.board?.appState) throw new Error('No active server board to surrender.');
  if (room.match.status !== 'started' && room.match.status !== 'coin-flip' && room.match.status !== 'coin-result') throw new Error('No active match to surrender.');
  const loserSeat = Number(client.seat);
  const winnerSeat = loserSeat === 1 ? 2 : 1;
  const result = makePvpResult(room, winnerSeat, loserSeat, reasonOverride || `${client.name || publicSeatLabel(loserSeat)} surrendered the match.`);
  const st = room.engine.board.appState;
  st.gameOver = true;
  st.winner = sideForSeat(winnerSeat);
  st.gameEndReason = result.reason;
  st.pending = null;
  st.responseWindow = null;
  st.gameResultShown = false;
  st.pvpHumanVsHuman = true;
  st.pvpGameResult = clone(result);
  st.log = Array.isArray(st.log) ? st.log.slice() : [];
  st.log.unshift(`GAME END: ${result.winnerName} wins. ${result.reason}`);
  if (st.log.length > 20) st.log.length = 20;
  room.engine.board = normalizeServerBoard(clone(room.engine.board));
  room.engine.revision += 1;
  room.match.status = 'finished';
  room.match.finishedAt = nowIso();
  room.match.result = result;
  room.match.serverBoard = room.engine.board;
  room.match.serverBoardRevision = room.engine.revision;
  room.match.lastIntent = { fromSeat: loserSeat, fromName: client.name, intent: 'surrender-match', at: nowIso() };
  addLog(room, `SERVER RUNTIME GAME END: ${result.winnerName} wins. ${result.reason}`);
  return result;
}

function buildOpeningCoinFlip(p1, p2, choiceInput) {
  // Old Discord PvP alpha rule reference: Player 2 calls Heads/Tails; winner takes the first turn.
  const choice = String(choiceInput || '').toUpperCase();
  if (!['HEADS', 'TAILS'].includes(choice)) throw new Error('Player 2 must choose Heads or Tails before the first Draw Phase.');
  const outcome = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
  const firstSeat = choice === outcome ? 2 : 1;
  const firstClient = firstSeat === 1 ? p1 : p2;
  return {
    rule: 'old-alpha-player-2-call',
    chooserSeat: 2,
    chooserLabel: 'Player 2',
    choice,
    outcome,
    firstSeat,
    firstSeatLabel: publicSeatLabel(firstSeat),
    firstPlayerName: firstClient?.name || publicSeatLabel(firstSeat),
    player1Name: p1?.name || 'Player 1',
    player2Name: p2?.name || 'Player 2',
    resolvedAt: nowIso()
  };
}
function openingCoinFlipLine(flip) {
  if (!flip) return '';
  return `OPENING COIN FLIP: ${flip.player2Name || 'Player 2'} calls ${flip.choice}. Result: ${flip.outcome}. ${flip.firstPlayerName || flip.firstSeatLabel} starts in Draw Phase.`;
}

function markOpeningCoinFlipPending(engine, p1, p2) {
  if (!engine?.board?.appState) return engine?.snapshot?.() || null;
  const st = engine.board.appState;
  st.turn = 'PLAYER';
  st.phase = 'Opening Coin Flip';
  st.round = 1;
  st.aiControl = null;
  st.pvpHumanVsHuman = true;
  st.pvpCoinFlipPending = true;
  st.pvpOpeningCoinFlip = {
    pending: true,
    chooserSeat: 2,
    chooserLabel: 'Player 2',
    player1Name: p1?.name || 'Player 1',
    player2Name: p2?.name || 'Player 2',
    createdAt: nowIso()
  };
  st.pvpPlayerNames = { PLAYER: p1?.name || 'Player 1', AI: p2?.name || 'Player 2' };
  st.log = Array.isArray(st.log) ? st.log.slice() : [];
  st.log = st.log.filter((line) => !/PLAYER begins in Draw Phase/i.test(String(line || '')));
  st.log.unshift('OPENING COIN FLIP: Battlefield loaded. Player 2 must choose Heads or Tails before Round 1 Draw Phase begins.');
  if (st.log.length > 20) st.log.length = 20;
  engine.board = clone(engine.board);
  engine.revision += 1;
  return engine.snapshot();
}

function markOpeningCoinFlipResultPending(engine, flip, p1, p2) {
  if (!engine?.board?.appState || !flip) return engine?.snapshot?.() || null;
  const st = engine.board.appState;
  st.turn = 'PLAYER';
  st.phase = 'Opening Coin Flip Result';
  st.round = 1;
  st.aiControl = null;
  st.pvpHumanVsHuman = true;
  st.pvpCoinFlipPending = false;
  st.pvpCoinFlipResultPending = true;
  st.pvpOpeningCoinFlip = clone(flip);
  st.pvpFirstSeat = flip.firstSeat;
  st.pvpFirstSeatLabel = flip.firstSeatLabel;
  st.pvpPlayerNames = { PLAYER: p1?.name || 'Player 1', AI: p2?.name || 'Player 2' };
  st.log = Array.isArray(st.log) ? st.log.slice() : [];
  st.log = st.log.filter((line) => !/PLAYER begins in Draw Phase/i.test(String(line || '')));
  st.log.unshift(`${openingCoinFlipLine(flip)} Confirm the result to start Round 1 Draw Phase.`);
  if (st.log.length > 20) st.log.length = 20;
  engine.board = clone(engine.board);
  engine.revision += 1;
  return engine.snapshot();
}
function applyOpeningCoinFlipToEngine(engine, flip, p1, p2) {
  if (!engine?.board?.appState || !flip) return engine?.snapshot?.() || null;
  const firstSide = sideForSeat(flip.firstSeat);
  const opening = engine.completeOpeningFlow(firstSide, flip);
  const st = engine.board.appState;
  st.aiControl = null;
  st.pvpHumanVsHuman = true;
  st.pvpCoinFlipPending = false;
  st.pvpCoinFlipResultPending = false;
  st.pvpOpeningCoinFlip = clone(flip);
  st.pvpFirstSeat = flip.firstSeat;
  st.pvpFirstSeatLabel = flip.firstSeatLabel;
  st.pvpPlayerNames = { PLAYER: p1?.name || 'Player 1', AI: p2?.name || 'Player 2' };
  st.log = Array.isArray(st.log) ? st.log.slice() : [];
  st.log = st.log.filter((line) => !/PLAYER begins in Draw Phase/i.test(String(line || '')));
  st.log.unshift(openingCoinFlipLine(flip));
  st.log.unshift(`${flip.firstPlayerName || flip.firstSeatLabel || 'First player'} enters Round 1 Draw Phase automatically.`);
  if (st.log.length > 20) st.log.length = 20;
  engine.board.appState = st;
  engine.board = clone(engine.board);
  return engine.snapshot(opening?.animationEvents || []);
}
function normalizeArgs(args) { return Array.isArray(args) ? args.slice(0, 8) : []; }

function makeDomStub() {
  const dummy = {
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, setAttribute() {}, removeAttribute() {},
    querySelectorAll() { return []; }, querySelector() { return null; }, closest() { return null; },
    focus() {}, scrollIntoView() {}, click() {},
    get innerHTML() { return this._html || ''; }, set innerHTML(v) { this._html = String(v ?? ''); },
    get textContent() { return this._txt || ''; }, set textContent(v) { this._txt = String(v ?? ''); },
    disabled: false, value: '', checked: false
  };
  const doc = {
    readyState: 'loading',
    addEventListener() {}, removeEventListener() {},
    getElementById() { return dummy; },
    querySelectorAll() { return []; }, querySelector() { return null; },
    createElement() { return { ...dummy, style: {}, classList: dummy.classList }; },
    body: dummy
  };
  return { doc, dummy };
}

function createRuntimeEngine() {
  const { doc } = makeDomStub();
  const win = {
    document: doc,
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    setTimeout, clearTimeout, console,
    GL_PVP_SHARED_BOARD_ACTIVE: true,
    GL_APP_MODE: 'PVP'
  };
  const ctx = {
    window: win, document: doc, console, setTimeout, clearTimeout, URL,
    CustomEvent: class { constructor(type, opts) { this.type = type; this.detail = opts?.detail; } },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: {}, location: { href: 'http://localhost/' }
  };
  ctx.globalThis = ctx;
  win.window = win;
  win.globalThis = ctx;
  vm.createContext(ctx);
  RUNTIME_SCRIPT.runInContext(ctx, { timeout: 15000 });
  // Browser Candidate 15 receives these compatibility aliases from its presentation adapter.
  // The headless authority intentionally does not load presentation code, so normalize metadata only.
  normalizeHeadlessRuntimeMetadata(ctx.window);
  const bridge = ctx.window.GL_LOCAL_AI_BRIDGE;
  if (!bridge || typeof bridge.startSharedMatch !== 'function' || typeof bridge.applyServerIntent !== 'function') {
    throw new Error('Runtime bridge did not initialize.');
  }
  const browserCards = ctx.window.GL_CARD_DEFINITIONS;
  const browserEffects = ctx.window.GL_EFFECT_RECIPES;
  const browserHeroComponents = ctx.window.GL_HERO_COMPONENTS;
  const browserCardCount = browserCards && Array.isArray(browserCards.cards)
    ? browserCards.cards.length
    : Object.values((browserCards && browserCards.families) || {}).reduce((sum, family) => sum + ((family && family.cards) || []).length, 0);
  const browserEffectCount = browserEffects && Array.isArray(browserEffects.effect_recipes) ? browserEffects.effect_recipes.length : 0;
  if (!browserCards || browserCards.schema_version !== '0.16.2' || browserCards.canonical_registry_hash !== '7ac1f90f6a9654cf575ac41db64a052901005905b1cf01f3bfc7532873cc9389' || browserCardCount !== 200) {
    throw new Error(`Browser runtime card source guard failed: ${browserCards && browserCards.schema_version} / ${browserCardCount}`);
  }
  if (!browserEffects || browserEffects.schema_version !== '0.15.2' || browserEffects.canonical_registry_hash !== '7ac1f90f6a9654cf575ac41db64a052901005905b1cf01f3bfc7532873cc9389' || browserEffectCount !== 200) {
    throw new Error(`Browser runtime effect source guard failed: ${browserEffects && browserEffects.schema_version} / ${browserEffectCount}`);
  }
  if (!browserHeroComponents || browserHeroComponents.registry_hash !== 'f36f1cc83eb9845743176c3af71f7823125353eae73e832588e9d8b42c6818be' || browserHeroComponents.hero_compositions?.length !== 30) {
    throw new Error('Browser Hero Component Authority guard failed.');
  }
  bridge.setSharedBoardMode(true);
  /* The Node authority never paints UI. Suppressing browser-render calls removes a large amount
     of unnecessary HTML generation on 0.1 vCPU services and restores near-immediate intents. */
  if (typeof bridge.setRenderSuppressed === 'function') bridge.setRenderSuppressed(true);
  return {
    revision: 0,
    board: null,
    viewCache: new Map(),
    bridgeSeat: null,
    bridgeRevision: -1,
    start(options = {}) {
      this.board = bridge.startSharedMatch(options);
      this.revision = 1;
      this.bridgeSeat = 1; this.bridgeRevision = this.revision;
      this.viewCache.clear();
      return this.snapshot();
    },
    completeOpeningFlow(firstSide, flipData) {
      if (!this.board) throw new Error('Server runtime has no active board.');
      const beforeState = clone(this.board.appState || {});
      if (this.bridgeSeat !== 1 || this.bridgeRevision !== this.revision) { bridge.importCanonicalSnapshot(this.board, 1, { notice: '', skipImportAnimations: true }); this.bridgeSeat = 1; this.bridgeRevision = this.revision; }
      const result = bridge.completeOpeningFlow(firstSide, flipData || {}, { holdAtDraw: true, bridgeImmediate: false });
      this.board = normalizeServerBoard(clone(result && result.snapshot ? result.snapshot : bridge.getSnapshot()));
      this.revision += 1;
      this.bridgeSeat = 1; this.bridgeRevision = this.revision;
      this.viewCache.clear();
      const drawEvents = Array.isArray(result && result.events) ? result.events.filter((event) => event && event.type === 'CARD_DRAWN') : [];
      const openingDrawEvents = drawEvents.filter((event) => event.reason === 'OPENING_HAND');
      const postOpeningDrawEvents = drawEvents.filter((event) => event.reason !== 'OPENING_HAND');
      const allShardEntries = shardGainEntries(beforeState, this.board.appState || {});
      const startingShardEntries = allShardEntries.filter((entry) => Number(entry.group_index) < 3);
      const postOpeningShardEntries = allShardEntries.filter((entry) => Number(entry.group_index) >= 3).map((entry) => ({ ...entry, group_index: Number(entry.group_index) - 3 }));
      const animationEvents = (drawEvents.length || allShardEntries.length) ? [{
        id: `opening-sequence-r${this.revision}`,
        kind: 'opening_sequence',
        opening_draw_events: openingDrawEvents,
        starting_shard_entries: startingShardEntries,
        post_opening_draw_events: postOpeningDrawEvents,
        post_opening_shard_entries: postOpeningShardEntries
      }] : [];
      return this.snapshot(animationEvents);
    },
    snapshot(animationEvents = []) { const list = Array.isArray(animationEvents) ? animationEvents : (animationEvents ? [animationEvents] : []); return { board: normalizeServerBoard(clone(this.board)), revision: this.revision, animationEvents: list, animationEvent: list[0] || null }; },
    viewForSeat(seat) {
      if (!this.board) return null;
      const cacheKey = `${this.revision}:${Number(seat) || 1}`;
      if (this.viewCache.has(cacheKey)) return clone(this.viewCache.get(cacheKey));
      this.board = normalizeServerBoard(this.board);
      if (this.bridgeSeat !== 1 || this.bridgeRevision !== this.revision) { bridge.importCanonicalSnapshot(this.board, 1, { notice: '', skipImportAnimations: true }); this.bridgeSeat = 1; this.bridgeRevision = this.revision; }
      const view = normalizeServerBoard(clone(this.board));
      if (view && view.appState && bridge.getActivatedLegacyAbilitiesFor) {
        const localSide = sideForSeat(seat);
        view.appState.pvpLocalLegalLegacyAbilities = {};
        for (const lane of ['LEFT','CENTER','RIGHT']) view.appState.pvpLocalLegalLegacyAbilities[lane] = bridge.getActivatedLegacyAbilitiesFor(localSide, lane) || [];
      }
      this.viewCache.set(cacheKey, clone(view));
      return view;
    },
    canSeatAct(seat) {
      if (!this.board?.appState) return false;
      const state = this.board.appState;
      const side = sideForSeat(seat);
      if (state.gameOver) return false;
      if (state.turn === side) return true;
      if (state.responseWindow && state.responseWindow.response_owner === side) return true;
      if (state.pending) {
        const decisionSide = state.pending.decision_side || state.pending.side || state.pending.source_side;
        if (decisionSide === side) return true;
        if (state.pending.type === 'response_window' && state.responseWindow?.response_owner === side) return true;
      }
      return false;
    },
    applyIntent(seat, intent, args) {
      if (!this.board) throw new Error('Server runtime has no active board.');
      const name = safeText(intent, 80);
      const passiveAllowed = new Set(['getSnapshot']);
      if (!passiveAllowed.has(name) && !this.canSeatAct(seat)) {
        throw new Error('Server authority rejected intent: it is not your legal turn/window.');
      }
      const canonicalSide = sideForSeat(seat);
      const beforeState = clone(this.board.appState || {});

      // Candidate 3B: Draw Review / Quick Reload / Rapid Chamber uses the same
      // canonical Candidate 15 gameplay implementation as every other Hero Component.
      // PvP translates only its transport-facing choice label; it no longer owns
      // shuffle/redraw/counter/phase semantics in a parallel runtime module.
      let runtimeIntentName = name;
      let runtimeIntentArgs = normalizeArgs(args);
      if (name === 'confirmDrawReplacement') {
        const choice = String(runtimeIntentArgs[0] || '').toLowerCase();
        if (choice !== 'keep' && choice !== 'redraw') throw new Error('Draw Review choice must be keep or redraw.');
        runtimeIntentName = 'commitDrawReplacementChoice';
        runtimeIntentArgs = [choice === 'redraw'];
      }

      if (this.bridgeSeat !== seat || this.bridgeRevision !== this.revision) { bridge.importCanonicalSnapshot(this.board, seat, { notice: '', skipImportAnimations: true }); this.bridgeSeat = seat; this.bridgeRevision = this.revision; }
      const result = bridge.applyServerIntent(runtimeIntentName, runtimeIntentArgs);
      if (!result?.ok) throw new Error(result?.error || 'Runtime rejected intent.');
      const next = bridge.getCanonicalSnapshot(seat);
      this.board = normalizeServerBoard(clone(next));
      // Candidate 3A acceptance: an invalid UI request must not be acknowledged as a gameplay commit.
      // Some legacy Candidate 15 handlers return undefined after displaying an explanatory UI message;
      // the bridge historically interpreted that undefined as success. On the authoritative server,
      // an intent that produced no canonical state change is a rejection and must not advance revision.
      if (JSON.stringify(beforeState) === JSON.stringify(this.board.appState || {})) {
        throw new Error(`Runtime rejected intent: no authoritative state change (${name}).`);
      }

      this.revision += 1;
      this.bridgeSeat = seat; this.bridgeRevision = this.revision;
      this.viewCache.clear();
      const animationEvents = buildPublicAnimationEvents(beforeState, this.board.appState, canonicalSide, name, this.revision);
      return this.snapshot(animationEvents);
    }
  };
}


function clientHasLoadedDeck(client) {
  return Boolean(client && (client.deckKey || client.deckData));
}
function matchIsActive(room) {
  return ['coin-flip', 'coin-result', 'started'].includes(room?.match?.status);
}
function disconnectPolicy(room, client) {
  if (matchIsActive(room)) return { timeoutMs: MATCH_DISCONNECT_TIMEOUT_MS, action: 'auto-forfeit', reason: 'active match' };
  if (room?.match?.status === 'setup' && Number(client?.seat) === 1) return { timeoutMs: PLAYER1_SETUP_RECONNECT_GRACE_MS, action: 'release-seat', reason: 'Player 1 pre-match 60-second reconnect grace' };
  if (clientHasLoadedDeck(client)) return { timeoutMs: LOBBY_WITH_DECK_TIMEOUT_MS, action: 'release-seat', reason: 'deck loaded' };
  return { timeoutMs: LOBBY_NO_DECK_TIMEOUT_MS, action: 'release-seat', reason: 'no deck loaded' };
}
function startDisconnectReservation(room, client) {
  const policy = disconnectPolicy(room, client);
  const startedAt = Date.now();
  client.disconnectedAt = new Date(startedAt).toISOString();
  client.offlineTimeoutMs = policy.timeoutMs;
  client.offlineTimeoutAction = policy.action;
  client.offlineTimeoutReason = policy.reason;
  client.offlineExpiresAt = new Date(startedAt + policy.timeoutMs).toISOString();
  return policy;
}
function clearDisconnectReservation(client) {
  if (!client) return;
  client.disconnectedAt = null;
  client.offlineTimeoutMs = null;
  client.offlineTimeoutAction = null;
  client.offlineTimeoutReason = null;
  client.offlineExpiresAt = null;
}
function rememberExpiredSeat1Authority(room, client, reason) {
  if (!room || !client || Number(client.seat) !== 1 || room.match?.status !== 'setup') return false;
  if (!Array.isArray(room.expiredSeat1Authorities)) room.expiredSeat1Authorities = [];
  const record = {
    clientId: String(client.clientId || ''),
    seatTokenHash: String(client.seatTokenHash || ''),
    expiredAt: nowIso(),
    reason: safeText(reason || 'Player 1 reconnect grace expired', 120)
  };
  room.expiredSeat1Authorities = room.expiredSeat1Authorities.filter((item) => item && item.clientId !== record.clientId && (!record.seatTokenHash || item.seatTokenHash !== record.seatTokenHash));
  room.expiredSeat1Authorities.push(record);
  if (room.expiredSeat1Authorities.length > 24) room.expiredSeat1Authorities.splice(0, room.expiredSeat1Authorities.length - 24);
  return true;
}
function expiredSeat1Authority(room, clientId, suppliedSeatToken) {
  const records = Array.isArray(room?.expiredSeat1Authorities) ? room.expiredSeat1Authorities : [];
  const suppliedHash = tokenHash(suppliedSeatToken);
  return records.find((item) => item && ((suppliedHash && item.seatTokenHash === suppliedHash) || (clientId && item.clientId === clientId))) || null;
}
function clearExpiredSeat1Authority(room, clientId, seatToken = '') {
  if (!Array.isArray(room?.expiredSeat1Authorities)) return;
  const suppliedHash = tokenHash(seatToken);
  room.expiredSeat1Authorities = room.expiredSeat1Authorities.filter((item) => item && !((clientId && item.clientId === clientId) || (suppliedHash && item.seatTokenHash === suppliedHash)));
}
function releaseTimedOutSeat(room, client, reason) {
  if (!client || client.role !== 'player') return false;
  const seat = client.seat;
  const name = client.name || publicSeatLabel(seat);
  rememberExpiredSeat1Authority(room, client, reason);
  client.ready = false;
  client.deckKey = null;
  client.deckName = null;
  client.deckData = null;
  client.deckSource = null;
  client.formation = null;
  clearDisconnectReservation(client);
  room.players.delete(client.clientId);
  // Invalidate the detached object too: a stale socket/closure must no longer carry player authority.
  delete client.seat;
  delete client.seatToken;
  delete client.seatTokenHash;
  client.role = 'spectator';
  client.observerAuthorized = true;
  client.teachingViewUnlocked = false;
  addLog(room, `${name} exceeded the reconnect limit (${reason}) and released Player ${seat}.`);
  return true;
}

function livePlayerBySeat(room, seat) {
  return [...room.players.values()].find((p) => Number(p.seat) === Number(seat)) || null;
}
function assertCurrentPlayerSession(room, requester, requestWs = null) {
  if (!requester || requester.role !== 'player' || ![1,2].includes(Number(requester.seat))) throw new Error('Only a seated player may remove a seat.');
  const live = livePlayerBySeat(room, requester.seat);
  if (!live || live.clientId !== requester.clientId || live.ws !== requester.ws || (requestWs && requestWs !== requester.ws)) throw new Error('Stale player session cannot remove a seat.');
  return live;
}
function removePlayerSeat(room, requester, targetSeat, requestWs = null) {
  assertCurrentPlayerSession(room, requester, requestWs);
  if (room.match.status !== 'setup') throw new Error('Seats can only be left or removed before the match starts.');
  targetSeat = Number(targetSeat);
  if (targetSeat !== 1 && targetSeat !== 2) throw new Error('Choose Player 1 or Player 2 seat.');
  const target = livePlayerBySeat(room, targetSeat);
  if (!target) throw new Error(`Player ${targetSeat} seat is already empty.`);

  const requesterSeat = Number(requester.seat);
  const isSelf = target.clientId === requester.clientId;
  const canHostRemoveP2 = requesterSeat === 1 && targetSeat === 2;
  const canP2RemoveOfflineP1 = requesterSeat === 2 && targetSeat === 1 && target.connected === false;
  if (!isSelf && !canHostRemoveP2 && !canP2RemoveOfflineP1) {
    if (requesterSeat === 2 && targetSeat === 1) throw new Error('Player 2 can only remove Player 1 while Player 1 is offline.');
    throw new Error('You do not have permission to remove that seat.');
  }

  const targetName = target.name || publicSeatLabel(targetSeat);
  const oldToken = target.seatToken || '';
  target.ready = false;
  target.deckKey = null; target.deckName = null; target.deckData = null; target.deckSource = null; target.formation = null;
  clearDisconnectReservation(target);
  clearExpiredSeat1Authority(room, target.clientId, oldToken);
  room.players.delete(target.clientId);
  const oldWs = target.ws;
  delete target.seat; delete target.seatToken; delete target.seatTokenHash;
  target.role = 'unseated'; target.observerAuthorized = false; target.teachingViewUnlocked = false;

  const actorName = requester.name || publicSeatLabel(requesterSeat);
  const actionText = isSelf ? `${targetName} left Player ${targetSeat} seat.` : `${actorName} removed ${targetName} from Player ${targetSeat} seat.`;
  if (oldWs && oldWs.readyState === WebSocket.OPEN) {
    send(oldWs, {
      type: 'seat-kicked',
      kind: isSelf ? 'left' : 'removed',
      seat: targetSeat,
      message: isSelf ? `You left Player ${targetSeat} seat.` : `You were removed from Player ${targetSeat} seat by ${actorName}.`
    });
    // A removed/left client must not instantly reconnect and reclaim the seat.
    // The browser may explicitly reload/reconnect later if the user wants to join again.
    try { oldWs.close(4002, isSelf ? 'Seat left' : 'Seat removed'); } catch {}
  }
  addLog(room, actionText);
  return true;
}
function kickSeat2(room, requester, requestWs = null) {
  return removePlayerSeat(room, requester, 2, requestWs);
}

function expireDisconnectedPlayers(room, now = Date.now()) {
  let changed = false;
  for (const client of [...room.players.values()]) {
    if (client.connected !== false || !client.offlineExpiresAt) continue;
    const expiresAt = Date.parse(client.offlineExpiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt > now) continue;
    if (matchIsActive(room)) {
      try {
        applyServerSurrender(room, client);
        addLog(room, `${client.name || publicSeatLabel(client.seat)} did not reconnect within 5 minutes and automatically forfeited.`);
      } catch (err) {
        addLog(room, `Reconnect timeout for ${client.name || publicSeatLabel(client.seat)}: ${safeText(err?.message || err, 180)}.`);
      }
      changed = releaseTimedOutSeat(room, client, '5-minute active-match limit') || changed;
    } else {
      const reason = client.offlineTimeoutReason || (clientHasLoadedDeck(client) ? '5-minute deck-loaded limit' : '3-minute no-deck limit');
      changed = releaseTimedOutSeat(room, client, reason) || changed;
    }
  }
  return changed;
}

function markPlayerActivity(client, now = Date.now()) {
  if (!client) return;
  client.lastActivityAt = new Date(now).toISOString();
  client.idleWarningSentAt = null;
}
function releaseIdlePlayerSeat(room, client) {
  if (!client || client.role !== 'player') return false;
  const seat = client.seat;
  const name = client.name || publicSeatLabel(seat);
  if (['started', 'coin-flip', 'coin-result'].includes(room.match.status) && room.engine?.board?.appState) {
    try {
      applyServerSurrender(room, client, `${name} was removed from Player ${seat} after 10 minutes of inactivity.`);
      addLog(room, `${name} automatically forfeited the active match because of the 10-minute idle limit.`);
    } catch (err) {
      addLog(room, `Idle match forfeit failed for ${name}: ${safeText(err?.message || err, 180)}.`);
    }
  }
  client.ready = false;
  room.players.delete(client.clientId);
  delete client.seat;
  delete client.seatToken;
  delete client.seatTokenHash;
  client.role = 'spectator';
  client.observerAuthorized = true;
  client.teachingViewUnlocked = false;
  client.deckKey = null; client.deckName = null; client.deckData = null; client.deckSource = null; client.formation = null;
  client.lastActivityAt = new Date().toISOString();
  client.idleWarningSentAt = null;
  if (room.spectators.size < MAX_SPECTATORS) {
    room.spectators.set(client.clientId, client);
    send(client.ws, { type: 'idle-released', message: `Player ${seat} seat released after 10 minutes of inactivity. You are now a Spectator.` });
  } else {
    send(client.ws, { type: 'idle-released', message: `Player ${seat} seat released after 10 minutes of inactivity.` });
    try { client.ws?.close(4001, 'Idle seat released'); } catch {}
  }
  addLog(room, `${name} was idle for 10 minutes and automatically released Player ${seat}.`);
  return true;
}
function sweepIdlePlayers(room, now = Date.now()) {
  let changed = false;
  for (const client of [...room.players.values()]) {
    if (client.connected === false) continue;
    const last = Date.parse(client.lastActivityAt || client.connectedAt || 0);
    if (!Number.isFinite(last)) { markPlayerActivity(client, now); continue; }
    const idle = now - last;
    if (idle >= PLAYER_IDLE_RELEASE_MS) { changed = releaseIdlePlayerSeat(room, client) || changed; continue; }
    if (idle >= PLAYER_IDLE_WARNING_MS && !client.idleWarningSentAt) {
      client.idleWarningSentAt = new Date(now).toISOString();
      send(client.ws, { type: 'idle-warning', idleMs: idle, remainingMs: Math.max(0, PLAYER_IDLE_RELEASE_MS - idle), warningAtMs: PLAYER_IDLE_WARNING_MS, releaseAtMs: PLAYER_IDLE_RELEASE_MS });
    }
  }
  return changed;
}

function addLog(room, message) {
  room.logs.push({ at: nowIso(), message: safeText(message, 300) });
  if (room.logs.length > MAX_ROOM_LOGS) room.logs.splice(0, room.logs.length - MAX_ROOM_LOGS);
  room.updatedAt = nowIso();
}
function chooseSeat(room) {
  const used = new Set([...room.players.values()].map((client) => client.seat));
  return used.has(1) ? 2 : 1;
}
function freshMatchState() {
  return { status: 'setup', startedAt: null, finishedAt: null, hostSeat: 1, seed: null, coinFlip: null, result: null, serverBoard: null, serverBoardRevision: 0, lastIntent: null, mode: 'server-authoritative-human-vs-human' };
}
function createRoom(id) {
  return {
    id, createdAt: nowIso(), updatedAt: nowIso(), generation: 1, lastCleanupAt: null,
    players: new Map(), spectators: new Map(), logs: [], engine: null,
    expiredSeat1Authorities: [],
    match: freshMatchState()
  };
}
function roomState(id) {
  const roomId = safeRoom(id);
  if (!rooms.has(roomId)) {
    const room = createRoom(roomId);
    rooms.set(roomId, room);
    addLog(room, `Room ${roomId} created.`);
  }
  return rooms.get(roomId);
}
function publicClient(client, recipient, matchStatus = 'setup') {
  const expiresAt = client.offlineExpiresAt || null;
  const remainingMs = expiresAt ? Math.max(0, Date.parse(expiresAt) - Date.now()) : null;
  const hasDeck = clientHasLoadedDeck(client);
  const sameClient = Boolean(recipient && recipient.clientId === client.clientId);
  const revealDeckIdentity = matchStatus !== 'setup' || sameClient;
  return {
    clientId: client.clientId,
    name: client.name,
    role: client.role,
    seat: client.seat || null,
    seatLabel: client.seat ? publicSeatLabel(client.seat) : null,
    ready: !!client.ready,
    connected: client.connected !== false,
    observerAuthorized: Boolean(client.role === 'spectator'),
    teachingViewUnlocked: Boolean(client.role === 'spectator' && client.teachingViewUnlocked),
    hasDeck,
    deckKey: revealDeckIdentity ? (client.deckKey || null) : null,
    deckName: revealDeckIdentity ? (client.deckName || null) : null,
    deckSource: revealDeckIdentity ? (client.deckSource || (client.deckData ? 'custom' : (client.deckKey ? 'starter' : null))) : null,
    formation: revealDeckIdentity && client.formation ? clone(client.formation) : null,
    connectedAt: client.connectedAt || null,
    disconnectedAt: client.disconnectedAt || null,
    offlineExpiresAt: expiresAt,
    offlineRemainingMs: remainingMs,
    offlineTimeoutAction: client.offlineTimeoutAction || null,
    offlineTimeoutReason: client.offlineTimeoutReason || null
  };
}
function snapshotFor(room, client) {
  const livePlayerNames = {
    1: ([...room.players.values()].find((p) => Number(p.seat) === 1)?.name || 'Player 1'),
    2: ([...room.players.values()].find((p) => Number(p.seat) === 2)?.name || 'Player 2')
  };
  const match = { ...room.match, playerNames: livePlayerNames, serverBuildId: BUILD_ID };
  match.lastAnimationEvents = animationEventsForRecipient(room.match.lastAnimationEvents || [], client);
  match.lastAnimationEvent = match.lastAnimationEvents[0] || null;
  if (room.engine?.board) {
    const canonicalBoard = room.engine.viewForSeat(client?.seat || 1);
    match.serverBoard = maskCanonicalBoardForRecipient(canonicalBoard, client, room.engine.revision);
    match.serverBoardRevision = room.engine.revision;
    const state = match.serverBoard?.appState;
    if (state) {
      const localSeat = Number(client?.seat || 1);
      state.pvpPlayerNames = localSeat === 2
        ? { PLAYER: livePlayerNames[2], AI: livePlayerNames[1] }
        : { PLAYER: livePlayerNames[1], AI: livePlayerNames[2] };
    }
    if (state?.gameOver && room.match.status !== 'finished') {
      room.match.status = 'finished';
      room.match.finishedAt = nowIso();
      const winnerSeat = state.winner === 'AI' ? 2 : 1;
      const loserSeat = winnerSeat === 1 ? 2 : 1;
      room.match.result = state.pvpGameResult || makePvpResult(room, winnerSeat, loserSeat, humanizeRuntimeText(state.gameEndReason || 'Game ended.'));
      room.match.serverBoard = room.engine.board;
      room.match.serverBoardRevision = room.engine.revision;
      match.status = 'finished';
      match.finishedAt = room.match.finishedAt;
      match.result = room.match.result;
    }
  }
  return {
    type: 'snapshot', version: VERSION, buildId: BUILD_ID, displayNames: livePlayerNames,
    room: { id: room.id, createdAt: room.createdAt, updatedAt: room.updatedAt, generation: Number(room.generation || 1), lastCleanupAt: room.lastCleanupAt || null },
    local: client ? { clientId: client.clientId, name: client.name, role: client.role, seat: client.seat || null, seatLabel: client.seat ? publicSeatLabel(client.seat) : null, seatToken: client.role === 'player' ? client.seatToken : null, ready: !!client.ready, observerAuthorized: Boolean(client.role === 'spectator'), teachingViewUnlocked: Boolean(client.role === 'spectator' && client.teachingViewUnlocked), teachingViewConfigured: teachingViewConfigured(), lastActivityAt: client.lastActivityAt || null, idleWarningSentAt: client.idleWarningSentAt || null, idleWarningMs: PLAYER_IDLE_WARNING_MS, idleReleaseMs: PLAYER_IDLE_RELEASE_MS, deckKey: client.deckKey || null, deckName: client.deckName || null, deckSource: client.deckSource || (client.deckData ? 'custom' : (client.deckKey ? 'starter' : null)), deckData: client.deckSource === 'custom' && client.deckData ? clone(client.deckData) : null, formation: client.formation ? clone(client.formation) : null } : null,
    players: [...room.players.values()].sort((a, b) => (a.seat || 99) - (b.seat || 99)).map((subject) => publicClient(subject, client, room.match.status)),
    spectators: [...room.spectators.values()].map((subject) => publicClient(subject, client, room.match.status)),
    match,
    deckOptions: STARTER_DECK_OPTIONS,
    logs: room.logs.slice(-MAX_PUBLIC_ROOM_LOGS)
  };
}
function send(ws, payload) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload)); }
function clearOneShotAnimationEvents(room) {
  if (!room?.match) return;
  room.match.lastAnimationEvents = [];
  room.match.lastAnimationEvent = null;
}
function broadcast(room, priorityClient = null) {
  const orderedPlayers = []; const seen = new Set();
  const addPlayer = (client) => { if (!client || seen.has(client.clientId)) return; seen.add(client.clientId); orderedPlayers.push(client); };
  if (priorityClient && priorityClient.role === 'player') addPlayer(priorityClient);
  for (const client of room.players.values()) addPlayer(client);
  for (const client of orderedPlayers) send(client.ws, snapshotFor(room, client));
  const spectators = [...room.spectators.values()].filter((client) => client && !seen.has(client.clientId));
  if (!spectators.length) { clearOneShotAnimationEvents(room); return; }
  const sendSpectators = () => {
    for (const client of spectators) send(client.ws, snapshotFor(room, client));
    // Public animation events are transport-once presentation data. Clearing only
    // after every current recipient has been sent prevents a later reconnect,
    // resync, or unrelated room broadcast from replaying an already-settled VFX/SFX.
    clearOneShotAnimationEvents(room);
  };
  // Gameplay intents are latency-sensitive on the 0.1 vCPU service: players receive the authoritative
  // snapshot first; spectator masking/serialization is deferred to the next event-loop turn.
  if (priorityClient && priorityClient.role === 'player') setImmediate(sendSpectators); else sendSpectators();
}
function reject(client, message) { send(client.ws, { type: 'notice', kind: 'error', message: safeText(message, 260) }); }
function rejectStaleRevisionWithSnapshot(room, client, baseRevision) {
  const serverRevision = Number(room?.engine?.revision || 0);
  send(client.ws, {
    type: 'notice',
    kind: 'error',
    code: 'STALE_REVISION',
    baseRevision: Number(baseRevision || 0),
    serverRevision,
    resync: 'authoritative-snapshot-follows',
    message: `Stale client revision ${Number(baseRevision || 0)}; server is at revision ${serverRevision}. Authoritative board refresh sent.`
  });
  send(client.ws, snapshotFor(room, client));
  return false;
}
function safePath(pathname) {
  let p = decodeURIComponent(pathname || '/');
  if (p === '/' || p === '') p = '/index.html';
  p = normalize(p).replace(/^([.][.][/\\])+/, '');
  const full = join(ROOT, p);
  if (!full.startsWith(ROOT)) throw new Error('Bad path');
  return full;
}


function publicDeploymentConfig(req) {
  return {
    version: VERSION,
    buildId: BUILD_ID,
    wsPath: '/ws',
    mode: 'server-authoritative-human-vs-human',
    singleRoom: true,
    roomId: FIXED_ROOM_ID,
    roomName: 'Grandis PvP',
    maxPlayers: 2,
    maxSpectators: 0,
    spectatorView: null,
    teachingViewAvailable: false,
    playerIdleWarningMs: PLAYER_IDLE_WARNING_MS,
    playerIdleReleaseMs: PLAYER_IDLE_RELEASE_MS
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify({
        ok: true,
        version: VERSION,
        buildId: BUILD_ID,
        mode: 'server-authoritative-human-vs-human',
        rooms: rooms.size,
        deckOptions: STARTER_DECK_OPTIONS.length,
        activeSources: {
          cards: { version: 'v0.16.2', schema: ACTIVE_RUNTIME_SOURCES.cards.schema_version, count: ACTIVE_RUNTIME_SOURCES.cardCount, path: 'data/season1/cards.runtime.v0.16.2.json', canonicalHash: ACTIVE_RUNTIME_SOURCES.cards.canonical_registry_hash },
          effects: { version: 'v0.15.2', schema: ACTIVE_RUNTIME_SOURCES.effects.schema_version, count: ACTIVE_RUNTIME_SOURCES.effectCount, path: 'data/season1/effect-recipes.runtime.v0.15.2.json' },
          heroComponents: { version: 'v1.1.0', hash: ACTIVE_RUNTIME_SOURCES.heroComponents.registry_hash, counts: ACTIVE_RUNTIME_SOURCES.heroComponentCounts, path: 'data/season1/hero-components.runtime.v1.1.0.json' },
          foundation: 'v1.94.2',
          runtimeCore: 'v0.61',
          effectCheckpoint: 'v0.15.2',
          rankUp: 'v0.3',
          uiLock: 'v2.53',
          applicationRuntimeSync: RUNTIME_SYNC_STATUS.version,
          singleAuthorityVerified: RUNTIME_SYNC_STATUS.authorityVerified,
          legacyBridgeSynchronized: RUNTIME_SYNC_STATUS.legacyBridgeSynchronized,
          fullIntentOnlyMigrationComplete: RUNTIME_SYNC_STATUS.fullIntentOnlyMigrationComplete
        }
      }));
      return;
    }
    if (url.pathname === '/config.js') {
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
      const config = publicDeploymentConfig(req);
      res.end(`window.GL_APP_MODE="PVP";window.GL_CONFIG=${JSON.stringify(config)};window.GL_PVP_CONFIG=window.GL_CONFIG;`);
      return;
    }
    const file = safePath(url.pathname);
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    const ext = extname(file).toLowerCase();
    res.writeHead(200, { 'content-type': mime[ext] || 'application/octet-stream', 'cache-control': 'no-store, max-age=0', 'pragma': 'no-cache', 'expires': '0' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false, maxPayload: 1024 * 1024 });
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname !== '/ws') { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

wss.on('connection', (ws, req) => {
  // PvP favors interaction latency over bulk throughput; keep tiny intent/ack frames off Nagle queues.
  try { ws._socket?.setNoDelay?.(true); } catch {}
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const requestedRoom = FIXED_ROOM_ID;
  const room = roomState(FIXED_ROOM_ID);
  // A visitor arriving after the finished-match TTL must never receive the stale battlefield.
  // Perform strict cleanup synchronously before client identity / seat-token recovery.
  cleanupFinishedMatch(room);
  // Do not let a reconnect race the disconnect sweeper. Expired Player 1 setup authority is
  // released synchronously before any seat-token recovery decision is made.
  expireDisconnectedPlayers(room, Date.now());
  const clientId = safeClient(url.searchParams.get('client'));
  const name = safeText(url.searchParams.get('name') || 'Player', 25) || 'Player';
  const initialDeck = deckOption(url.searchParams.get('deck'));
  const suppliedSeatToken = safeClient(url.searchParams.get('seatToken'));
  // Build ids are diagnostic only. Static frontend and room services may deploy independently,
  // so a cached/staggered frontend must never be locked out of the lobby solely because its build id differs.
  // Gameplay authority remains server-side; snapshot buildId is retained for diagnostics/QA.
  const clientBuildId = safeText(url.searchParams.get('buildId') || '', 80);
  const wantsSpectator = false;
  if (!clientId) { send(ws, { type: 'fatal', message: 'Missing client identity.' }); ws.close(); return; }

  const existingSeat1ById = room.players.get(clientId) || null;
  if (existingSeat1ById && existingSeat1ById.role === 'player' && Number(existingSeat1ById.seat) === 1 && existingSeat1ById.seatTokenHash && !tokenMatches(existingSeat1ById, suppliedSeatToken)) {
    send(ws, { type: 'fatal', message: 'Player 1 reconnect requires the current seat token.' });
    ws.close(1008, 'Invalid Player 1 reconnect authority');
    return;
  }
  let client = existingSeat1ById || room.spectators.get(clientId) || null;
  let isNew = false;
  let lateSeat1Reconnect = null;
  if (!client) {
    isNew = true;
    lateSeat1Reconnect = !wantsSpectator ? expiredSeat1Authority(room, clientId, suppliedSeatToken) : null;
    const offlinePlayer = !lateSeat1Reconnect && !wantsSpectator ? [...room.players.values()].sort((a, b) => (a.seat || 99) - (b.seat || 99)).find((c) => c.connected === false && tokenMatches(c, suppliedSeatToken)) : null;
    if (lateSeat1Reconnect) {
      send(ws, { type: 'fatal', message: 'Player 1 reconnect grace expired. Spectator mode is disabled in PvP v3.70.' });
      ws.close(1008, 'Reconnect grace expired');
      return;
    } else if (offlinePlayer) {
      room.players.delete(offlinePlayer.clientId);
      client = { ...offlinePlayer, clientId, name: name || offlinePlayer.name, role: 'player', deckKey: room.match.status === 'setup' && initialDeck ? initialDeck.key : offlinePlayer.deckKey || null, deckName: room.match.status === 'setup' && initialDeck ? initialDeck.label : offlinePlayer.deckName || null, deckData: room.match.status === 'setup' && initialDeck ? null : offlinePlayer.deckData || null, deckSource: room.match.status === 'setup' && initialDeck ? 'starter' : offlinePlayer.deckSource || null, formation: room.match.status === 'setup' && initialDeck ? normalizeStarterFormation(initialDeck.key, null) : offlinePlayer.formation || null, connectedAt: nowIso() };
      room.players.set(clientId, client);
      addLog(room, `${client.name} resumed Player ${client.seat} seat with seat token.`);
    } else if (room.players.size >= 2) {
      send(ws, { type: 'fatal', message: 'Grandis PvP is full. This build has exactly 2 player seats and no spectators.' });
      ws.close(1008, 'Room full');
      return;
    } else {
      const seatToken = newSeatToken();
      client = { clientId, name, role: 'player', seat: chooseSeat(room), seatToken, seatTokenHash: tokenHash(seatToken), ready: false, deckKey: initialDeck?.key || null, deckName: initialDeck?.label || null, deckData: null, deckSource: initialDeck ? 'starter' : null, formation: initialDeck ? normalizeStarterFormation(initialDeck.key, null) : null, connectedAt: nowIso() };
      room.players.set(clientId, client);
    }
  }
  if (client.ws && client.ws !== ws) client.ws.close(4000, 'Replaced by reconnect');
  Object.assign(client, { ws, clientId, name, connected: true });
  markPlayerActivity(client);
  clearDisconnectReservation(client);
  if (client.role === 'player' && !client.seatToken) { client.seatToken = suppliedSeatToken || newSeatToken(); client.seatTokenHash = tokenHash(client.seatToken); }
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  if (client.role === 'spectator') room.spectators.set(clientId, client); else room.players.set(clientId, client);
  addLog(room, client.role === 'spectator' ? `${client.name} ${isNew ? 'joined' : 'reconnected'} as Spectator.` : `${client.name} ${isNew ? 'joined' : 'reconnected'} as Player ${client.seat}.`);
  broadcast(room);
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { return; }
    try {
      let priorityBroadcastClient = null;
      if (msg.type !== 'ping') markPlayerActivity(client);
      if (client.role === 'spectator' && !['ping', 'activity', 'rename', 'switch-role', 'chat', 'unlock-teaching-view', 'lock-teaching-view'].includes(msg.type)) throw new Error('Spectator mode is read-only.');
      switch (msg.type) {
        case 'ping': {
          const reportedLatency = Number(msg.latencyMs);
          if (Number.isFinite(reportedLatency) && reportedLatency >= 0 && reportedLatency <= 60000) client.latencyMs = Math.round(reportedLatency);
          let opponent = null;
          if (client.role === 'player') {
            for (const player of room.players.values()) { if (Number(player.seat) !== Number(client.seat)) { opponent = player; break; } }
          }
          send(ws, { type: 'pong', at: nowIso(), clientAt: Number(msg.clientAt || 0) || null, opponentLatencyMs: opponent && Number.isFinite(Number(opponent.latencyMs)) ? Math.round(Number(opponent.latencyMs)) : null, version: VERSION, buildId: BUILD_ID });
          return;
        }
        case 'activity': send(ws, { type: 'activity-ack', at: nowIso() }); return;
        case 'rename': {
          const nextName = safeText(msg.name || client.name, 25) || client.name;
          const changed = nextName !== client.name;
          client.name = nextName;
          if (changed && room.match.status === 'setup') client.ready = false;
          addLog(room, `${client.role === 'spectator' ? 'Spectator' : publicSeatLabel(client.seat)} is now shown as ${client.name}.`);
          break;
        }
        case 'switch-role': {
          throw new Error('Spectator mode is parked in PvP v3.70.');
          /*
          if (room.match.status !== 'setup') throw new Error('Role switching is only available in setup lobby.');
          const next = String(msg.role || '').toLowerCase();
          if (next === 'spectator' || next === 'host') {
            if (client.role === 'spectator') break;
            if (room.spectators.size >= MAX_SPECTATORS) throw new Error('Spectator capacity reached.');
            room.players.delete(clientId); client.role = 'spectator'; client.observerAuthorized = true; client.teachingViewUnlocked = false; delete client.seat; client.ready = false; client.formation = null; room.spectators.set(clientId, client); addLog(room, `${client.name} switched to Spectator and released the player seat.`);
          } else if (next === 'player') {
            if (client.role === 'player') break;
            if (room.players.size >= 2) throw new Error('Both player seats are occupied.');
            room.spectators.delete(clientId); client.role = 'player'; client.observerAuthorized = false; client.teachingViewUnlocked = false; client.seat = chooseSeat(room); markPlayerActivity(client); client.seatToken = newSeatToken(); client.seatTokenHash = tokenHash(client.seatToken); clearExpiredSeat1Authority(room, clientId); client.ready = false; client.formation = null; room.players.set(clientId, client); addLog(room, `${client.name} joined as Player ${client.seat}.`);
          } else throw new Error('Choose player or spectator role.');
          */
          break;
        }
        case 'unlock-teaching-view': {
          if (client.role !== 'spectator') throw new Error('Teaching View is only available to spectators.');
          if (!teachingViewConfigured()) throw new Error('Teaching View password is not configured on this room service.');
          if (!teachingPasswordMatches(msg.password)) throw new Error('Incorrect Teaching View password.');
          client.teachingViewUnlocked = true;
          addLog(room, `${client.name} unlocked Teaching View.`);
          break;
        }
        case 'lock-teaching-view': {
          if (client.role !== 'spectator') throw new Error('Teaching View is only available to spectators.');
          client.teachingViewUnlocked = false;
          addLog(room, `${client.name} returned to normal spectator view.`);
          break;
        }
        case 'set-deck': {
          if (client.role !== 'player') throw new Error('Only players choose decks.');
          if (room.match.status !== 'setup') throw new Error('Deck selection is locked after match start.');
          if (msg.customDeck || msg.deck) {
            const custom = safeCustomDeck(msg.customDeck || msg.deck);
            if (!custom) throw new Error('Invalid custom deck JSON.');
            const changed = client.deckName !== custom.name || client.deckSource !== 'custom';
            client.deckKey = 'CUSTOM';
            client.deckName = safeText(msg.deckName || custom.name, 100) || custom.name;
            client.deckData = custom.deck;
            client.deckSource = 'custom';
            client.formation = null;
            if (changed) client.ready = false;
            addLog(room, `${client.name} locked in a custom deck.`);
            break;
          }
          const selected = deckOption(msg.deckKey || msg.key || msg.deckKey);
          if (!selected) throw new Error('Choose a valid starter deck before ready.');
          const formation = normalizeStarterFormation(selected.key, msg.formation == null ? null : msg.formation);
          if (!formation) throw new Error('Invalid starter Hero formation. Formation must contain the selected Starter’s three canonical Heroes exactly once.');
          const changed = client.deckKey !== selected.key || client.deckSource !== 'starter' || !sameFormation(client.formation, formation);
          client.deckKey = selected.key;
          client.deckName = selected.label;
          client.deckData = null;
          client.deckSource = 'starter';
          client.formation = formation;
          if (changed) client.ready = false;
          addLog(room, `${client.name} locked in a starter deck${msg.formation ? ' with a server-validated Hero formation' : ''}.`);
          break;
        }
        case 'ready': {
          if (client.role !== 'player') throw new Error('Only players can ready.');
          // v1.6: accept the default display name used by the lobby input.
          // If a player leaves the default as "Player", normalize it to the public seat label
          // instead of blocking Ready. This keeps setup simple on desktop and mobile.
          if (!client.name || client.name === 'Player') {
            client.name = publicSeatLabel(client.seat) || 'Player';
          }
          if (!client.deckKey) throw new Error('Choose your deck before ready.');
          client.ready = !!msg.ready;
          addLog(room, `${client.name} is ${client.ready ? 'READY' : 'NOT READY'}.`);
          break;
        }
        case 'start-match': {
          if (client.seat !== 1) throw new Error('Only Player 1 may start.');
          if (room.match.status !== 'setup') throw new Error('Match start is already in progress.');
          if (room.players.size !== 2) throw new Error('Two player seats are required.');
          const p1 = [...room.players.values()].find((c) => c.seat === 1);
          const p2 = [...room.players.values()].find((c) => c.seat === 2);
          if (!p1 || !p2) throw new Error('Player 1 and Player 2 seats are required.');
          if (![p1, p2].every((c) => c.connected !== false && c.ready)) throw new Error('Both players must be connected and READY.');
          if (![p1, p2].every((c) => c.deckKey)) throw new Error('Both players must choose decks before start.');
          const seed = safeText(msg.seed || Math.random().toString(36).slice(2), 32);
          room.engine = createRuntimeEngine();
          const startOptions = { player1Name: p1.name, player2Name: p2.name };
          applyClientDeckToStartOptions(startOptions, p1, 'player');
          applyClientDeckToStartOptions(startOptions, p2, 'player2');
          room.engine.start(startOptions);
          const pendingSnap = markOpeningCoinFlipPending(room.engine, p1, p2);
          room.match = {
            status: 'coin-flip', startedAt: null, finishedAt: null, hostSeat: 1, seed,
            coinFlip: { pending: true, chooserSeat: 2, chooserLabel: 'Player 2', awaitingChoice: true },
            serverBoard: pendingSnap?.board || null, serverBoardRevision: pendingSnap?.revision || 0, lastIntent: null, mode: 'server-authoritative-human-vs-human',
            playerNames: { 1: p1.name, 2: p2.name },
            deckChoices: { 1: { deckKey: p1.deckKey, deckName: p1.deckName, deckSource: p1.deckSource, formation: p1.formation ? clone(p1.formation) : null }, 2: { deckKey: p2.deckKey, deckName: p2.deckName, deckSource: p2.deckSource, formation: p2.formation ? clone(p2.formation) : null } }
          };
          addLog(room, `MATCH START REQUESTED by ${client.name}. Battlefield loaded first; Player 2 must choose Heads or Tails in the battlefield popup. Winner starts in Round 1 Draw Phase.`);
          break;
        }
        case 'choose-coin-flip': {
          if (client.seat !== 2) throw new Error('Only Player 2 chooses Heads or Tails.');
          if (room.match.status !== 'coin-flip' || !room.match.coinFlip?.pending) throw new Error('No opening coin flip is waiting.');
          const p1 = [...room.players.values()].find((c) => c.seat === 1);
          const p2 = [...room.players.values()].find((c) => c.seat === 2);
          if (!p1 || !p2) throw new Error('Player 1 and Player 2 seats are required.');
          if (!room.engine?.board) {
            room.engine = createRuntimeEngine();
            const startOptions = { player1Name: p1.name, player2Name: p2.name };
            applyClientDeckToStartOptions(startOptions, p1, 'player');
            applyClientDeckToStartOptions(startOptions, p2, 'player2');
            room.engine.start(startOptions);
          }
          const openingCoinFlip = buildOpeningCoinFlip(p1, p2, msg.choice);
          const snap = markOpeningCoinFlipResultPending(room.engine, openingCoinFlip, p1, p2);
          room.match = {
            ...room.match,
            status: 'coin-result',
            startedAt: null,
            finishedAt: null,
            openingCoinFlip,
            coinFlip: {
              pending: false,
              awaitingConfirmation: true,
              choice: openingCoinFlip.choice,
              outcome: openingCoinFlip.outcome,
              firstSeat: openingCoinFlip.firstSeat,
              firstSeatLabel: openingCoinFlip.firstSeatLabel,
              firstPlayerName: openingCoinFlip.firstPlayerName
            },
            firstSeat: openingCoinFlip.firstSeat,
            firstPlayerName: openingCoinFlip.firstPlayerName,
            serverBoard: snap.board,
            serverBoardRevision: snap.revision,
            lastAnimationEvents: snap.animationEvents || [],
            lastAnimationEvent: snap.animationEvent || null,
            lastIntent: null
          };
          addLog(room, `${openingCoinFlipLine(openingCoinFlip)} Waiting for Start Game confirmation.`);
          break;
        }
        case 'confirm-coin-flip': {
          if (room.match.status !== 'coin-result' || !room.match.coinFlip?.awaitingConfirmation || !room.match.openingCoinFlip) throw new Error('No opening coin flip result is waiting for confirmation.');
          const p1 = [...room.players.values()].find((c) => c.seat === 1);
          const p2 = [...room.players.values()].find((c) => c.seat === 2);
          if (!p1 || !p2) throw new Error('Player 1 and Player 2 seats are required.');
          const openingCoinFlip = room.match.openingCoinFlip;
          const snap = applyOpeningCoinFlipToEngine(room.engine, openingCoinFlip, p1, p2);
          room.match = {
            ...room.match,
            status: 'started',
            startedAt: nowIso(),
            finishedAt: null,
            coinFlip: {
              pending: false,
              awaitingConfirmation: false,
              choice: openingCoinFlip.choice,
              outcome: openingCoinFlip.outcome,
              firstSeat: openingCoinFlip.firstSeat,
              firstSeatLabel: openingCoinFlip.firstSeatLabel,
              firstPlayerName: openingCoinFlip.firstPlayerName
            },
            serverBoard: snap.board,
            serverBoardRevision: snap.revision,
            lastAnimationEvents: snap.animationEvents || [],
            lastAnimationEvent: snap.animationEvent || null,
            lastIntent: null
          };
          addLog(room, `OPENING COIN FLIP CONFIRMED: ${openingCoinFlip.firstPlayerName} starts from Round 1 Draw Phase.`);
          addLog(room, `SERVER-AUTH HUMAN MATCH STARTED. ${p1.name} vs ${p2.name}. Canonical board lives in the authoritative Node runtime; clients may only submit intents.`);
          break;
        }
        case 'remove-seat': removePlayerSeat(room, client, msg.seat, ws); break;
        case 'kick-seat-2': kickSeat2(room, client, ws); break;
        case 'reset-room': if (client.role !== 'player') throw new Error('Spectators cannot reset the room.'); if (client.seat !== 1 && room.match.status !== 'finished') throw new Error('Only Player 1 may reset room before the match ends.'); room.engine = null; room.gameplayIntentLedger = new Map(); room.match = freshMatchState(); for (const p of room.players.values()) p.ready = false; addLog(room, `${client.name} reset the room to setup.`); break;
        case 'surrender-match': applyServerSurrender(room, client); break;
        case 'chat': addLog(room, `${client.name}: ${safeText(msg.message, 180)}`); break;
        case 'shared-board': throw new Error('Client board publish is disabled. This build is server-authoritative; send runtime-intent instead.');
        case 'runtime-intent': {
          const intentStartedAt = Date.now();
          let routedMessage = msg;
          if (String(msg.intent || '') === 'selectOpponentManaChoiceHandle') {
            const requestedRevision = Number((msg.args || [])[1]);
            if (requestedRevision !== Number(room.engine?.revision || 0)) return rejectStaleRevisionWithSnapshot(room, client, requestedRevision);
            const handle = String((msg.args || [])[0] || '');
            const pending = room.engine?.board?.appState?.pending;
            const side = sideForSeat(client.seat);
            if (!pending || pending.type !== 'opponent_mana_selection' || pendingOwnerSide(pending) !== side) throw new Error('No current opponent Shard choice belongs to this player.');
            const candidates = Array.isArray(pending.candidates) ? pending.candidates : [];
            const valid = validOpponentShardCandidates(room.engine.board.appState, pending);
            // A pool mutation can invalidate the candidate list even when a client has already
            // consumed the newest snapshot. Reconcile the canonical pending choice before any
            // handle can be redirected by shifted visual/array positions.
            if (valid.length !== candidates.length) {
              pending.candidates = valid.map((entry) => entry.candidate);
              pending.selected_indices = [];
              pending.required_count = Math.min(Math.max(0, Number(pending.required_count || 1)), pending.candidates.length);
              room.engine.board = normalizeServerBoard(clone(room.engine.board));
              room.engine.revision += 1;
              room.engine.bridgeSeat = null; room.engine.bridgeRevision = -1; room.engine.viewCache.clear();
              room.match.serverBoard = room.engine.board; room.match.serverBoardRevision = room.engine.revision;
              send(client.ws,{type:'notice',kind:'error',code:'STALE_OPPONENT_SHARD_CHOICE',message:'Opponent Shard Pool changed. Choice was refreshed from the current authoritative pool.'});
              send(client.ws,snapshotFor(room,client));
              return;
            }
            const matched = valid.find((entry) => opponentShardChoiceHandle(room.engine.revision, client.seat, entry.candidate.uid) === handle);
            if (!matched) { send(client.ws,{type:'notice',kind:'error',code:'STALE_OPPONENT_SHARD_CHOICE',message:'Opponent Shard choice is stale. Authoritative pool refreshed.'}); send(client.ws,snapshotFor(room,client)); return; }
            routedMessage = { ...msg, intent: 'selectOpponentManaChoice', args: [matched.index] };
          }
          const routed = GAMEPLAY_INTENT_ROUTER.handle({ room, client, message: routedMessage });
          if (routed.stale) return rejectStaleRevisionWithSnapshot(room, client, routed.baseRevision);
          const intent = routed.intent;
          send(client.ws, {
            type: 'intent-ack',
            intent,
            category: routed.category,
            clientActionId: routed.clientActionId || null,
            duplicate: !!routed.duplicate,
            baseRevision: routed.baseRevision,
            committedRevision: routed.committedRevision,
            receivedAt: nowIso()
          });
          const snap = routed.snapshot || room.engine.snapshot();
          priorityBroadcastClient = client;
          const processingMs = Math.max(0, Date.now() - intentStartedAt);
          room.match.serverBoard = snap.board;
          room.match.serverBoardRevision = snap.revision;
          room.match.lastIntent = {
            fromSeat: client.seat, fromName: client.name, intent, category: routed.category,
            clientActionId: routed.clientActionId || null, duplicate: !!routed.duplicate,
            at: nowIso(), processingMs
          };
          room.match.lastAnimationEvents = snap.animationEvents || [];
          room.match.lastAnimationEvent = snap.animationEvent || null;
          const st = snap.board?.appState;
          if (st?.gameOver) {
            room.match.status = 'finished';
            room.match.finishedAt = nowIso();
            const winnerSeat = st.winner === 'AI' ? 2 : 1;
            const loserSeat = winnerSeat === 1 ? 2 : 1;
            room.match.result = st.pvpGameResult || makePvpResult(room, winnerSeat, loserSeat, humanizeRuntimeText(st.gameEndReason || 'Game ended.'));
            room.match.serverBoard = snap.board;
            room.match.serverBoardRevision = snap.revision;
            addLog(room, `SERVER RUNTIME GAME END: ${room.match.result.winnerName} wins. ${room.match.result.reason}`);
          } else if (routed.duplicate) {
            addLog(room, `SERVER INTENT DUPLICATE ignored: ${client.name} (${publicSeatLabel(client.seat)}) -> ${intent} [${routed.clientActionId || 'no-id'}].`);
          } else {
            addLog(room, `SERVER INTENT r${snap.revision}: ${client.name} (${publicSeatLabel(client.seat)}) -> ${intent} [${routed.category}].`);
          }
          break;
        }
        default: throw new Error(`Unknown message type: ${safeText(msg.type, 60)}`);
      }
      broadcast(room, priorityBroadcastClient);
    } catch (err) { reject(client, err?.message || err); }
  });

  ws.on('close', () => {
    // Ignore the close event from an older socket that was replaced by a successful reconnect.
    if (client.ws !== ws) return;
    client.connected = false;
    if (client.role === 'player') {
      const policy = startDisconnectReservation(room, client);
      const minutes = Math.round(policy.timeoutMs / 60000);
      addLog(room, `${client.name} disconnected from Player ${client.seat}. Reconnect reserved for ${minutes} minute${minutes === 1 ? '' : 's'} (${policy.reason}).`);
    } else if (client.role === 'unseated') {
      addLog(room, `${client.name} disconnected after leaving/releasing a player seat.`);
    } else {
      room.spectators.delete(client.clientId);
      addLog(room, `${client.name} disconnected as Spectator.`);
    }
    broadcast(room);
  });
});


function cleanupFinishedMatch(room, now = Date.now()) {
  if (!room || room.match?.status !== 'finished') return false;
  const finishedAt = Date.parse(room.match.finishedAt || 0);
  if (!Number.isFinite(finishedAt) || now - finishedAt < FINISHED_MATCH_CLEANUP_MS) return false;
  const result = room.match.result;
  const connectedPlayers = [...room.players.values()]
    .filter((c) => c && c.connected !== false && c.ws?.readyState === WebSocket.OPEN)
    .sort((a, b) => Number(a.seat || 99) - Number(b.seat || 99));

  room.engine = null;
  room.match = freshMatchState();
  room.generation = Number(room.generation || 1) + 1;
  room.lastCleanupAt = nowIso();
  room.players = new Map();
  room.spectators = new Map();
  room.expiredSeat1Authorities = [];
  room.gameplayIntentLedger = new Map();

  // v3.70 is strictly two-player/no-spectator. After the finished-match TTL, connected
  // players return directly to their existing seats in the fresh lobby instead of being
  // parked in a spectator role. New seat tokens invalidate old match reconnect authority.
  for (const c of connectedPlayers) {
    c.role = 'player';
    c.observerAuthorized = false;
    c.teachingViewUnlocked = false;
    c.ready = false;
    c.deckKey = null;
    c.deckName = null;
    c.deckData = null;
    c.deckSource = null;
    c.formation = null;
    c.seatToken = newSeatToken();
    c.seatTokenHash = tokenHash(c.seatToken);
    clearDisconnectReservation(c);
    c.lastActivityAt = room.lastCleanupAt;
    if (Number(c.seat) !== 1 && Number(c.seat) !== 2) c.seat = chooseSeat(room);
    room.players.set(c.clientId, c);
  }
  addLog(room, `FINISHED MATCH CLEANUP: ${result?.winnerName || 'Previous match'} cleared after ${Math.round(FINISHED_MATCH_CLEANUP_MS / 60000)} minutes. Connected players returned to the two-player lobby.`);
  return true;
}

setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
}, 30000).unref();

setInterval(() => {
  for (const room of rooms.values()) {
    if (expireDisconnectedPlayers(room)) broadcast(room);
  }
}, DISCONNECT_SWEEP_MS).unref();

setInterval(() => {
  for (const room of rooms.values()) {
    if (cleanupFinishedMatch(room)) broadcast(room);
  }
}, Math.min(15000, FINISHED_MATCH_CLEANUP_MS)).unref();

setInterval(() => {
  for (const room of rooms.values()) {
    if (sweepIdlePlayers(room)) broadcast(room);
  }
}, PLAYER_IDLE_SWEEP_MS).unref();

setInterval(() => {
  const cutoff = Date.now() - 1000 * 60 * 60 * 12;
  for (const [id, room] of rooms) {
    const anyConnected = [...room.players.values(), ...room.spectators.values()].some((c) => c.connected !== false);
    const updated = Date.parse(room.updatedAt || room.createdAt || 0);
    if (!anyConnected && updated && updated < cutoff) rooms.delete(id);
  }
}, 1000 * 60 * 30).unref();

let shuttingDown = false;
function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; closing HTTP/WebSocket server.`);
  for (const client of wss.clients) {
    try { client.close(1001, 'Server restarting'); } catch {}
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(PORT, HOST, () => {
  console.log(VERSION);
  console.log(`Listening on http://${HOST}:${PORT}`);
  console.log('Health check: /health');
  console.log('WebSocket endpoint: /ws?client=CLIENT&name=PLAYER&deck=STARTER_KEY (fixed room GRANDIS_PVP)');
});
