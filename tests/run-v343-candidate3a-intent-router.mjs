import assert from 'node:assert/strict';
import { createGameplayIntentRouter, classifyGameplayIntent, supportedGameplayIntents } from '../server/gameplay-intent-router.mjs';

const clone = (value) => JSON.parse(JSON.stringify(value));

function makeFixture({ turn = 'PLAYER', pending = null, responseWindow = null } = {}) {
  const a = { clientId: 'A', role: 'player', seat: 1, name: 'Alice' };
  const b = { clientId: 'B', role: 'player', seat: 2, name: 'Bob' };
  const players = new Map([[a.clientId, a], [b.clientId, b]]);
  let applyCount = 0;
  const engine = {
    revision: 10,
    board: { appState: { turn, phase: 'Deploy', pending, responseWindow, gameOver: false } },
    canSeatAct(seat) {
      const side = Number(seat) === 2 ? 'AI' : 'PLAYER';
      const st = this.board.appState;
      if (st.responseWindow?.response_owner === side) return true;
      const decision = st.pending && (st.pending.decision_side || st.pending.side || st.pending.source_side);
      if (decision === side) return true;
      return st.turn === side;
    },
    applyIntent(seat, intent, args) {
      applyCount += 1;
      if (intent === 'beginPlayFromHand' && args[0] === 999) throw new Error('Runtime rejected stale Hand card.');
      if (intent === 'chooseHeroFromBoard' && args[1] === 'ILLEGAL') throw new Error('Runtime rejected invalid target.');
      if (intent === 'setArrowBarrageSpend' && Number(args[0]) > 99) throw new Error('Runtime rejected invalid payment.');
      this.revision += 1;
      this.board = clone(this.board);
      return { board: clone(this.board), revision: this.revision, animationEvents: [] };
    },
    snapshot() { return { board: clone(this.board), revision: this.revision, animationEvents: [] }; }
  };
  const room = { id: 'TEST', generation: 1, players, match: { status: 'started' }, engine };
  return { room, engine, a, b, getApplyCount: () => applyCount };
}

const requiredCategories = {
  advancePhase: 'PHASE_TURN',
  beginPlayFromHand: 'PLAY',
  beginTributeFromHand: 'TRIBUTE_RANK',
  chooseHeroFromBoard: 'TARGETING',
  setArrowBarrageSpend: 'PAYMENT',
  performManualReposition: 'REPOSITION',
  responsePassNoStuck: 'RESPONSE',
  beginActivatedHeroAbility: 'HERO_COMPONENT'
};
for (const [intent, category] of Object.entries(requiredCategories)) {
  assert.equal(classifyGameplayIntent(intent)?.category, category, `${intent} classification`);
}
assert.ok(supportedGameplayIntents().length >= 30, 'router must cover current controller intents');

const router = createGameplayIntentRouter();

// Normal authoritative commit.
{
  const f = makeFixture();
  const result = router.handle({ room: f.room, client: f.a, message: { intent: 'advancePhase', args: [], baseRevision: 10, clientActionId: 'a.10.1.advancePhase' } });
  assert.equal(result.ok, true);
  assert.equal(result.duplicate, false);
  assert.equal(result.committedRevision, 11);
  assert.equal(f.getApplyCount(), 1);
}

// Duplicate action ID must be idempotent and never commit twice, even though the old baseRevision is now stale.
{
  const f = makeFixture();
  const msg = { intent: 'beginPlayFromHand', args: [0], baseRevision: 10, clientActionId: 'a.10.2.play' };
  const first = router.handle({ room: f.room, client: f.a, message: msg });
  const second = router.handle({ room: f.room, client: f.a, message: msg });
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal(f.getApplyCount(), 1, 'duplicate action committed twice');
}

// Same action ID cannot be reused for a different intent.
{
  const f = makeFixture();
  router.handle({ room: f.room, client: f.a, message: { intent: 'advancePhase', args: [], baseRevision: 10, clientActionId: 'reuse-id' } });
  assert.throws(() => router.handle({ room: f.room, client: f.a, message: { intent: 'beginPlayFromHand', args: [0], baseRevision: 11, clientActionId: 'reuse-id' } }), /different gameplay intent/);
  assert.equal(f.getApplyCount(), 1);
}

// Stale revision is rejected before mutation.
{
  const f = makeFixture();
  const result = router.handle({ room: f.room, client: f.a, message: { intent: 'advancePhase', args: [], baseRevision: 9, clientActionId: 'stale' } });
  assert.equal(result.stale, true);
  assert.equal(result.serverRevision, 10);
  assert.equal(f.getApplyCount(), 0);
}

// Spectator / wrong session / wrong turn are centrally rejected.
{
  const f = makeFixture();
  const spectator = { clientId: 'S', role: 'spectator', seat: null };
  assert.throws(() => router.handle({ room: f.room, client: spectator, message: { intent: 'advancePhase', baseRevision: 10 } }), /Only players/);
  const impostor = { clientId: 'X', role: 'player', seat: 1 };
  assert.throws(() => router.handle({ room: f.room, client: impostor, message: { intent: 'advancePhase', baseRevision: 10 } }), /does not own the active seat/);
}
{
  const f = makeFixture({ turn: 'AI' });
  assert.throws(() => router.handle({ room: f.room, client: f.a, message: { intent: 'advancePhase', baseRevision: 10 } }), /not your active turn\/window|not your legal turn\/window/);
  assert.equal(f.getApplyCount(), 0);
}

// Pending and Response ownership are server-side, not UI-side.
{
  const f = makeFixture({ turn: 'PLAYER', pending: { type: 'target_selection', decision_side: 'AI' } });
  assert.throws(() => router.handle({ room: f.room, client: f.a, message: { intent: 'chooseHeroFromBoard', args: ['AI', 'LEFT'], baseRevision: 10 } }), /opponent owns the current pending decision/);
}
{
  const f = makeFixture({ turn: 'PLAYER', responseWindow: { response_owner: 'AI' } });
  assert.throws(() => router.handle({ room: f.room, client: f.a, message: { intent: 'responsePassNoStuck', args: [], baseRevision: 10 } }), /opponent owns the current Response window/);
}

// Canonical engine rejections propagate without partial router mutation.
for (const probe of [
  { intent: 'beginPlayFromHand', args: [999], text: /stale Hand card/ },
  { intent: 'chooseHeroFromBoard', args: ['AI', 'ILLEGAL'], text: /invalid target/ },
  { intent: 'setArrowBarrageSpend', args: [100], text: /invalid payment/ }
]) {
  const f = makeFixture();
  assert.throws(() => router.handle({ room: f.room, client: f.a, message: { intent: probe.intent, args: probe.args, baseRevision: 10, clientActionId: `probe-${probe.intent}` } }), probe.text);
  assert.equal(f.engine.revision, 10);
}

// Unknown network intents are not allowed to reach the runtime.
{
  const f = makeFixture();
  assert.throws(() => router.handle({ room: f.room, client: f.a, message: { intent: 'clientSetsHp', args: [9999], baseRevision: 10 } }), /Unknown or unsupported gameplay intent/);
  assert.equal(f.getApplyCount(), 0);
}

console.log(JSON.stringify({
  ok: true,
  candidate: 'PvP v3.43 Candidate 3A',
  oneIntentRouter: true,
  serverSeatOwnership: true,
  spectatorCentralReject: true,
  turnOwnership: true,
  pendingOwnership: true,
  responseOwnership: true,
  duplicateActionId: true,
  staleRevision: true,
  canonicalRejectionPropagation: true,
  supportedIntentCount: supportedGameplayIntents().length
}, null, 2));
