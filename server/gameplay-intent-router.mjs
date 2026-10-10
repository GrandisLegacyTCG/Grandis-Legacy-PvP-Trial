/* Grandis Legacy PvP v3.43 Candidate 3A
 * Single server gameplay-intent router.
 *
 * This module owns transport/session validation, duplicate/stale protection and
 * intent classification only. It deliberately does NOT implement card rules.
 * Canonical gameplay semantics remain delegated to the shared Candidate 15
 * runtime bridge exposed by room.engine.applyIntent().
 */

const MAX_ACTION_ID = 120;
const MAX_RECENT_ACTIONS_PER_CLIENT = 128;

const INTENT_METADATA = Object.freeze({
  acknowledgePvpTurnStart: { category: 'PHASE_TURN', activeOwnership: true },
  advancePhase: { category: 'PHASE_TURN', activeOwnership: true },
  cancelPendingAction: { category: 'PENDING', decisionOwnership: true },

  beginPlayFromHand: { category: 'PLAY', activeOwnership: true },
  beginTributeFromHand: { category: 'TRIBUTE_RANK', activeOwnership: true },
  chooseHeroFromBoard: { category: 'TARGETING', decisionOwnership: true },

  setArrowBarrageSpend: { category: 'PAYMENT', decisionOwnership: true },
  toggleManaShardPaymentChoice: { category: 'PAYMENT', decisionOwnership: true },
  commitManaShardPaymentChoice: { category: 'PAYMENT', decisionOwnership: true },
  toggleResponseManaShardChoice: { category: 'PAYMENT', decisionOwnership: true },
  commitMagicalSurgeChoice: { category: 'PAYMENT', decisionOwnership: true },
  selectResponsePaymentChoice: { category: 'PAYMENT', decisionOwnership: true },
  commitResponsePaymentChoice: { category: 'PAYMENT', decisionOwnership: true },
  selectLegacyCostChoice: { category: 'PAYMENT', decisionOwnership: true },

  confirmDrawReplacement: { category: 'DRAW_REVIEW', decisionOwnership: true },
  commitDrawReplacementChoice: { category: 'DRAW_REVIEW', decisionOwnership: true },
  selectStatusRemovalChoice: { category: 'TARGETING', decisionOwnership: true },
  selectSaintPurifyChoice: { category: 'TARGETING', decisionOwnership: true },
  resolveStonebloodChoice: { category: 'HERO_COMPONENT', decisionOwnership: true },
  selectScoutingExpChoice: { category: 'TARGETING', decisionOwnership: true },
  selectOpponentHandChoice: { category: 'BLIND_SELECTION', decisionOwnership: true },
  commitOpponentHandChoice: { category: 'BLIND_SELECTION', decisionOwnership: true },
  selectOpponentManaChoice: { category: 'BLIND_SELECTION', decisionOwnership: true },
  commitOpponentManaSelection: { category: 'BLIND_SELECTION', decisionOwnership: true },
  moveCrystalBallOrder: { category: 'TARGETING', decisionOwnership: true },
  performDualArrowPairChoice: { category: 'TARGETING', decisionOwnership: true },
  toggleDiscardIndex: { category: 'PAYMENT', decisionOwnership: true },
  selectCardSearchChoice: { category: 'TARGETING', decisionOwnership: true },
  selectLegacyDefeatChoice: { category: 'TARGETING', decisionOwnership: true },
  selectLegacyCardChoice: { category: 'TARGETING', decisionOwnership: true },

  responseSelectNoStuck: { category: 'RESPONSE', responseOwnership: true },
  confirmSelectedResponse: { category: 'RESPONSE', responseOwnership: true },
  responsePassNoStuck: { category: 'RESPONSE', responseOwnership: true },

  performOptionalSwapDecision: { category: 'REPOSITION', decisionOwnership: true },
  performOptionalTargetSwapDecision: { category: 'REPOSITION', decisionOwnership: true },
  openManualRepositionChoice: { category: 'REPOSITION', activeOwnership: true },
  performManualReposition: { category: 'REPOSITION', decisionOwnership: true },

  beginActivatedHeroAbility: { category: 'HERO_COMPONENT', activeOwnership: true },
  beginActivatedLegacyAbility: { category: 'HERO_COMPONENT', activeOwnership: true },
  beginActivatedRacialAbility: { category: 'HERO_COMPONENT', activeOwnership: true },

  handleChoiceConfirm: { category: 'PENDING', decisionOwnership: true },
  executeConfirmedSurrender: { category: 'SURRENDER', activeOwnership: false },
  getSnapshot: { category: 'PASSIVE', passive: true }
});

function cleanToken(value, max = MAX_ACTION_ID) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^A-Za-z0-9_.:-]/g, '')
    .slice(0, max);
}

function sideForSeat(seat) {
  return Number(seat) === 2 ? 'AI' : 'PLAYER';
}

function pendingOwnerSide(pending) {
  if (!pending || typeof pending !== 'object') return null;
  return pending.decision_side || pending.response_owner || pending.side || pending.source_side || null;
}

function responseOwnerSide(state) {
  return state?.responseWindow?.response_owner || state?.response_window?.response_owner || null;
}

function boardState(engine) {
  return engine?.board?.appState || engine?.board?.state || null;
}

function currentTurnSide(state) {
  return state?.turn || state?.active_player_side || state?.activePlayerSide || null;
}

export function classifyGameplayIntent(intent) {
  const name = cleanToken(intent, 80);
  return INTENT_METADATA[name] ? { name, ...INTENT_METADATA[name] } : null;
}

export function supportedGameplayIntents() {
  return Object.keys(INTENT_METADATA);
}

function ensureLedger(room) {
  if (!room.gameplayIntentLedger || !(room.gameplayIntentLedger instanceof Map)) room.gameplayIntentLedger = new Map();
  return room.gameplayIntentLedger;
}

function ledgerKey(room, client) {
  return `${room?.id || 'ROOM'}:${Number(room?.generation || 1)}:${client?.clientId || 'client'}:${Number(client?.seat || 0)}`;
}

function recentActionMap(room, client) {
  const ledger = ensureLedger(room);
  const key = ledgerKey(room, client);
  let recent = ledger.get(key);
  if (!recent) {
    recent = new Map();
    ledger.set(key, recent);
  }
  return recent;
}

function rememberAction(recent, actionId, record) {
  if (!actionId) return;
  recent.set(actionId, record);
  while (recent.size > MAX_RECENT_ACTIONS_PER_CLIENT) recent.delete(recent.keys().next().value);
}

function duplicateActionResult(recent, actionId, intent, engine) {
  if (!actionId || !recent.has(actionId)) return null;
  const prior = recent.get(actionId);
  if (prior.intent !== intent) {
    const err = new Error('Duplicate clientActionId was reused for a different gameplay intent.');
    err.code = 'ACTION_ID_REUSE';
    throw err;
  }
  const snap = typeof engine?.snapshot === 'function' ? engine.snapshot() : null;
  return {
    ok: true,
    duplicate: true,
    intent,
    clientActionId: actionId,
    baseRevision: prior.baseRevision,
    committedRevision: prior.committedRevision,
    snapshot: snap
  };
}

function assertPlayerSession(room, client) {
  if (!client || client.role !== 'player') {
    const err = new Error('Only players can submit gameplay intents.');
    err.code = 'SPECTATOR_FORBIDDEN';
    throw err;
  }
  if (!Number.isInteger(Number(client.seat)) || ![1, 2].includes(Number(client.seat))) {
    const err = new Error('Gameplay intent has no authoritative player seat.');
    err.code = 'NO_PLAYER_SEAT';
    throw err;
  }
  const live = [...(room?.players?.values?.() || [])].find((entry) => Number(entry?.seat) === Number(client.seat));
  if (!live || live.clientId !== client.clientId) {
    const err = new Error('Gameplay intent socket/session does not own the active seat.');
    err.code = 'SEAT_OWNERSHIP';
    throw err;
  }
}

function assertOwnership(engine, client, meta) {
  if (meta.passive) return;
  const state = boardState(engine);
  if (!state) return;
  const side = sideForSeat(client.seat);

  if (meta.responseOwnership) {
    const responseOwner = responseOwnerSide(state);
    if (responseOwner && responseOwner !== side) {
      const err = new Error('Server authority rejected intent: opponent owns the current Response window.');
      err.code = 'RESPONSE_OWNERSHIP';
      throw err;
    }
  }

  if (meta.decisionOwnership) {
    const owner = pendingOwnerSide(state.pending);
    if (owner && owner !== side) {
      const err = new Error('Server authority rejected intent: opponent owns the current pending decision.');
      err.code = 'PENDING_OWNERSHIP';
      throw err;
    }
  }

  if (meta.activeOwnership) {
    const turn = currentTurnSide(state);
    // A canonical Response or pending choice may legally interrupt normal turn ownership.
    const responseOwner = responseOwnerSide(state);
    const decisionOwner = pendingOwnerSide(state.pending);
    if (turn && turn !== side && responseOwner !== side && decisionOwner !== side) {
      const err = new Error('Server authority rejected intent: it is not your active turn/window.');
      err.code = 'TURN_OWNERSHIP';
      throw err;
    }
  }

  if (typeof engine.canSeatAct === 'function' && !engine.canSeatAct(client.seat)) {
    const err = new Error('Server authority rejected intent: it is not your legal turn/window.');
    err.code = 'LEGAL_WINDOW';
    throw err;
  }
}

export function createGameplayIntentRouter() {
  return {
    classify: classifyGameplayIntent,
    supportedIntents: supportedGameplayIntents,

    handle({ room, client, message }) {
      if (!room || !client || !message) throw new Error('Gameplay router requires room, client, and message.');
      if (room.match?.status !== 'started') {
        const err = new Error('Resolve the opening coin flip result before submitting gameplay intents.');
        err.code = 'MATCH_NOT_STARTED';
        throw err;
      }
      if (!room.engine) {
        const err = new Error('Server runtime engine is not active.');
        err.code = 'ENGINE_INACTIVE';
        throw err;
      }

      assertPlayerSession(room, client);

      const intent = cleanToken(message.intent, 80);
      const meta = classifyGameplayIntent(intent);
      if (!meta) {
        const err = new Error(`Unknown or unsupported gameplay intent: ${intent || '(empty)'}`);
        err.code = 'UNKNOWN_GAMEPLAY_INTENT';
        throw err;
      }

      const actionId = cleanToken(message.clientActionId, MAX_ACTION_ID);
      const recent = recentActionMap(room, client);
      const duplicate = duplicateActionResult(recent, actionId, intent, room.engine);
      if (duplicate) return { ...duplicate, category: meta.category };

      const baseRevision = Number(message.baseRevision);
      const serverRevision = Number(room.engine.revision || 0);
      if (Number.isFinite(baseRevision) && baseRevision > 0 && baseRevision !== serverRevision) {
        return {
          ok: false,
          stale: true,
          code: 'STALE_REVISION',
          intent,
          category: meta.category,
          clientActionId: actionId || null,
          baseRevision,
          serverRevision
        };
      }

      assertOwnership(room.engine, client, meta);

      const snap = room.engine.applyIntent(client.seat, intent, Array.isArray(message.args) ? message.args.slice(0, 8) : []);
      const committedRevision = Number(snap?.revision || room.engine.revision || serverRevision);
      rememberAction(recent, actionId, {
        intent,
        category: meta.category,
        baseRevision: Number.isFinite(baseRevision) ? baseRevision : serverRevision,
        committedRevision
      });
      return {
        ok: true,
        duplicate: false,
        intent,
        category: meta.category,
        clientActionId: actionId || null,
        baseRevision: Number.isFinite(baseRevision) ? baseRevision : serverRevision,
        committedRevision,
        snapshot: snap
      };
    }
  };
}

export const GAMEPLAY_INTENT_METADATA = INTENT_METADATA;
