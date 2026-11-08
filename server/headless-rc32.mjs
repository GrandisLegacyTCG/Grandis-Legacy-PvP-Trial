/**
 * Grandis Legacy PvP Season 0 — staged server-side runtime bootstrap.
 *
 * Boots the ACTUAL RC32 application engine in an isolated VM, using the same
 * server-headless runtime strategy as Season 1 PvP. It DOES NOT run Local AI.
 * This is a private, canonical engine only. Do not send snapshots from here
 * over the network until a separate viewer-safe serializer is proven.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
/**
 * Carefully bounded, server-authoritative UI round-trip reductions.
 * Never invent a target/choice or skip mandatory payment. The actual RC34
 * engine performs every rule check and every state transition.
 */
export function applyOptimizedPvpIntent({bridge, readPending, name, args}) {
  if (!bridge || typeof readPending !== 'function') throw new Error('PvP action bridge unavailable.');
  const run = (intent, parameters) => {
    const result = bridge.applyServerIntent(intent, parameters);
    if (!result?.ok) throw new Error(String(result?.error || `Runtime rejected ${intent}.`).slice(0,220));
    return result;
  };
  // Narrow, server-verified multi-step UI shortcuts. The Season 1-style
  // strict in-flight channel must not split one button press into two RTTs.
  const compound = {
    selectAndConfirmResponse: ['response_window', 'responseSelectNoStuck', 'confirmSelectedResponse'],
    selectAndConfirmStatusRemovalChoice: ['status_removal_choice', 'selectStatusRemovalChoice', 'handleChoiceConfirm'],
    selectAndConfirmSaintPurifyChoice: ['saint_purify_choice', 'selectSaintPurifyChoice', 'handleChoiceConfirm'],
    selectAndConfirmCardSearchChoice: ['card_search_choice', 'selectCardSearchChoice', 'handleChoiceConfirm']
  };
  if (Object.hasOwn(compound, name)) {
    const [expected,select,confirm] = compound[name],p=readPending();
    if (name === 'selectAndConfirmResponse') {
      // Response ownership is carried by responseWindow, not pending. In the
      // headless local PLAYER coordinate system it must be our response.
      const snapshot=bridge.getCanonicalSnapshot(1).appState;
      if (snapshot?.responseWindow?.response_owner !== 'PLAYER' ||
          !Number.isInteger(args?.[0]) || args[0] < 0 || args[0] >= (snapshot.responseWindow.options||[]).length)
        throw new Error('Response option is unavailable.');
    } else if (!p || p.type !== expected || p.decision_side !== 'PLAYER' ||
        (name === 'selectAndConfirmCardSearchChoice' && p.resolve_to !== 'discard_then_draw_three') ||
        !Number.isInteger(args?.[0]) || args[0] < 0) {
      throw new Error('Compound choice is unavailable.');
    }
    run(select,[args[0]]);
    return run(confirm,[]);
  }
  if (name === 'cancelAndSkipBardDrawChoice') {
    const p=readPending();
    if (!p || p.type !== 's0_bard_draw_choice' || p.decision_side !== 'PLAYER')
      throw new Error('Bard Draw choice is unavailable.');
    if (p.selection_active) run('cancelS0BardDrawChoice',[]);
    return run('commitS0BardDrawChoice',[true]);
  }
  // Season 1 style single-shot Response payment: the browser drafts additional
  // Hand discards and physical Mana UIDs locally; the server verifies and
  // applies both costs IN THIS SINGLE AUTHORITY INTENT. The RC34 engine still
  // owns card legality, discard conditions, mana values and counter timing.
  if (name === 'commitExactResponsePaymentWithDiscardChoice') {
    const p = readPending();
    if (!p || p.type !== 'response_payment_choice' || p.decision_side !== 'PLAYER') {
      throw new Error('Response payment is not available.');
    }
    const selectedUids = args?.[0], indices = args?.[1];
    const need = Number(p.required_discard_count || 0);
    if (!Array.isArray(selectedUids) || selectedUids.length > 12 ||
        selectedUids.some(uid => typeof uid !== 'string' || uid.length > 100) ||
        new Set(selectedUids).size !== selectedUids.length ||
        !Array.isArray(indices) || indices.length !== need ||
        indices.some(idx => !Number.isInteger(idx) || idx < 0 || idx >= (p.candidates || []).length) ||
        new Set(indices).size !== indices.length) {
      throw new Error('Invalid Response Mana or additional discard selection.');
    }
    const original = (p.selected_indices || []).map(Number);
    for (const idx of original) if (!indices.includes(idx)) run('selectResponsePaymentChoice', [idx]);
    const without = readPending()?.selected_indices || [];
    for (const idx of indices) if (!without.includes(idx)) run('selectResponsePaymentChoice', [idx]);
    const confirmed = readPending();
    if (!confirmed || confirmed.type !== 'response_payment_choice' ||
        confirmed.selected_indices?.length !== need ||
        !indices.every(idx => confirmed.selected_indices.includes(idx))) {
      throw new Error('Response additional cost could not be verified.');
    }
    // Exact physical UID validation and all card-specific Response CONDITIONS
    // are performed in the original Season 0 RC34 engine.
    return run('commitExactResponsePaymentChoice', [selectedUids]);
  }
  if (name === 'commitExactTuneUpChoice') {
    const p = readPending();
    if (!p || p.type !== 'card_search_choice' || p.source_card_id !== 'S0-CLE-029' ||
        p.decision_side !== 'PLAYER' || p.zone !== 'deck' || !p.multi_select) {
      throw new Error('Tune Up selection is not available.');
    }
    const selected = args?.[0];
    const token = String(args?.[1] || '');
    const required = Number(p.required_count || 2);
    if (!token || token !== String(p.commit_token || '') ||
        !Array.isArray(selected) || required !== 2 || selected.length !== required ||
        !selected.every(n => Number.isInteger(n) && n >= 0 && n < (p.candidates || []).length) ||
        new Set(selected).size !== selected.length || (p.selected_indices || []).length) {
      throw new Error('Invalid or stale Tune Up selection.');
    }
    for (const index of selected) run('selectCardSearchChoice', [index]);
    const chosen = readPending();
    if (!chosen || chosen.type !== 'card_search_choice' ||
        (chosen.selected_indices || []).length !== required) {
      throw new Error('Tune Up selection could not be verified.');
    }
    return run('handleChoiceConfirm', []);
  }
  const result = run(name === 'beginPlayFromHandFast' ? 'beginPlayFromHand' : name, args);
  if (name === 'beginPlayFromHandFast') {
    const p = readPending();
    // Source Hero is not an optional choice when precisely one Hero is legal.
    // For two or three legal Heroes, keep the original RC34 selection UI.
    if (p?.type === 'source_selection' && p.decision_side === 'PLAYER' &&
        p.source_side === 'PLAYER' && Array.isArray(p.legal_sources) &&
        p.legal_sources.length === 1 && ['LEFT','CENTER','RIGHT'].includes(p.legal_sources[0])) {
      return run('chooseHeroFromBoard', ['PLAYER', p.legal_sources[0]]);
    }
  }
  return result;
}


const RUNTIME_SOURCES = Object.freeze([
  'engine/js/static-data.js',
  'runtime/overrides/grand-finale-designer-nerf.js',
  'engine/js/runtime-authority.js',
  'engine/shared-app/active-starters.js',
  'engine/shared-app/app.bundle.js'
]);
const STARTERS = new Set([
  's0_starter_01_red_white',
  's0_starter_02_blue_red',
  's0_starter_03_yellow_blue',
  's0_starter_04_green_yellow',
  's0_starter_05_white_green'
]);
const clone = value => structuredClone(value);
/** Transport envelope hygiene only. RC32 engine remains the deck-legality authority.
 * Builder v1.62 exports both nested and flattened deck fields. Reject a
 * contradictory document instead of silently validating the wrong copy. */
function validateSeason0DeckEnvelope(deck) {
  if (!deck || typeof deck !== 'object' || Array.isArray(deck)) throw new Error('Invalid Season 0 deck.');
  if (deck.season && deck.season !== 'S0') throw new Error('Only Season 0 decks are supported.');
  const nested = deck.deck;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    for (const field of ['main_deck','legacy_packages','shard_deck']) {
      if (Array.isArray(nested[field]) && Array.isArray(deck[field]) &&
          JSON.stringify(nested[field]) !== JSON.stringify(deck[field])) {
        throw new Error(`Conflicting ${field} values in imported deck.`);
      }
    }
  }
}


function headlessDocument() {
  // RC32 gameplay paths sometimes invoke UI-only feedback even in headless mode.
  // Supply inert DOM nodes for informational overlays; authoritative state is
  // still generated solely by the RC32 gameplay engine, with painting suppressed.
  const dummy = {
    style:{}, dataset:{}, value:'', disabled:false,
    classList:{add(){},remove(){},toggle(){return false},contains(){return false}},
    addEventListener(){}, removeEventListener(){}, appendChild(){}, removeChild(){},
    setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return []},
    focus(){},closest(){return null}, scrollIntoView(){},getBoundingClientRect(){return {x:0,y:0,width:0,height:0}},
    get textContent(){return this._text||''},set textContent(v){this._text=String(v||'')},
    get innerHTML(){return this._html||''},set innerHTML(v){this._html=String(v||'')}
  };
  return {
    readyState:'loading', body:null, documentElement:null,
    addEventListener(){}, removeEventListener(){},
    getElementById(){ return dummy; },
    querySelector(){ return null; }, querySelectorAll(){return []}
  };
}

export class Season0HeadlessAuthority {
  #context;
  #bridge;
  #revision = 0;
  #started = false;
  #bridgeSeat = 1;
  #bridgeRevision = -1;
  #canonical = null;
  constructor(clientRoot) {
    if (!clientRoot || typeof clientRoot !== 'string') throw new Error('clientRoot is required.');
    const doc = headlessDocument();
    // No browser AI orchestration or UI. Rendering is suppressed below.
    const ctx = {
      console, URL, Date, Math, TextEncoder, TextDecoder, Uint8Array,
      setTimeout() { return 0; }, clearTimeout() {},
      setInterval() { return 0; }, clearInterval() {},
      requestAnimationFrame() { return 0; }, cancelAnimationFrame() {},
      performance: { now: () => 0 }, crypto: webcrypto,
      location: { href: 'https://pvp-season0.invalid/', origin: 'https://pvp-season0.invalid' },
      navigator: { userAgent: 'Node PvP Season 0 authority' },
      document: doc, GL_APP_MODE: 'PVP', GL_PVP_SHARED_BOARD_ACTIVE: true
    };
    ctx.window = ctx; ctx.globalThis = ctx;
    vm.createContext(ctx, { name: 'gl-s0-headless-authority' });
    for (const source of RUNTIME_SOURCES) {
      const code = readFileSync(join(clientRoot, source), 'utf8');
      new vm.Script(code, { filename: source }).runInContext(ctx, { timeout: 60000 });
    }
    const bridge = ctx.GL_LOCAL_AI_BRIDGE;
    if (!bridge || typeof bridge.startSharedMatch !== 'function' ||
        typeof bridge.completeOpeningFlow !== 'function' ||
        typeof bridge.importCanonicalSnapshot !== 'function' ||
        typeof bridge.applyServerIntent !== 'function') {
      throw new Error('RC32 canonical PvP bridge contract is incomplete.');
    }
    const meta = ctx.GL_ACTIVE_STARTER_SET_META;
    if (meta?.schema_version !== 'GL-ACTIVE-STARTERS-S0-DEV45-STAGE4' ||
        meta.active_starter_count !== 5 || !Array.isArray(meta.ids) ||
        !meta.ids.every(id => STARTERS.has(id))) {
      throw new Error('Season 0 starter authority mismatch.');
    }
    // RC32 override is a deliberately authorized APP patch, not an OSA edit.
    const finale = ctx.GL_CARD_DEFINITIONS?.cards?.find(c => c.card_id === 'S0-CLE-031');
    if (!finale || Number(finale.attack?.damage_by_class?.Bard) !== 60 ||
                   Number(finale.attack?.damage_by_class?.Maestro) !== 90) {
      throw new Error('RC32 Grand Finale approved local override is missing.');
    }
    bridge.setSharedBoardMode(true);
    bridge.setRenderSuppressed(true);
    this.#context = ctx;
    this.#bridge = bridge;
  }
  get revision() { return this.#revision; }
  get started() { return this.#started; }
  get sourceMode() { return this.#context.GL_APP_MODE; }
  get starterIds() { return [...STARTERS]; }
  // Read-only server-side QA accessor. Not exposed by any WebSocket route.
  getCardForQA(cardId) { return clone(this.#context.GL_TUTORIAL_BRIDGE.getCard(cardId)); }
  /** Accept ONLY validated Season 0 starter IDs at this stage. Custom import comes later. */
  start({ player1DeckKey, player2DeckKey, player1Deck, player2Deck, player1Name = 'Player 1', player2Name = 'Player 2' } = {}) {
    if (this.#started) throw new Error('This match has already started.');
    if (player1Deck) validateSeason0DeckEnvelope(player1Deck);
    if (player2Deck) validateSeason0DeckEnvelope(player2Deck);
    if ((!player1Deck && !STARTERS.has(player1DeckKey)) || (!player2Deck && !STARTERS.has(player2DeckKey))) {
      throw new Error('Both players must choose known Season 0 starter decks.');
    }
    const canonical = this.#bridge.startSharedMatch({
      playerDeckKey: player1DeckKey,
      player2DeckKey: player2DeckKey,
      playerDeck: player1Deck ? clone(player1Deck) : undefined,
      player2Deck: player2Deck ? clone(player2Deck) : undefined,
      player1Name: String(player1Name).slice(0, 60),
      player2Name: String(player2Name).slice(0, 60)
    });
    if (!canonical?.appState?.pvpHumanVsHuman) throw new Error('RC32 did not enter human-vs-human mode.');
    this.#started = true;
    this.#revision = 1;
    this.#canonical = clone(canonical);
    this.#bridgeSeat = 1; this.#bridgeRevision = 1;
    return { ok: true, revision: this.#revision, phase: canonical.appState.phase };
  }
  /** Opening outcome is chosen by the server controller, not by a remote client. */
  completeOpening(firstSeat, face = 'HEADS') {
    if (!this.#started || this.#revision !== 1) throw new Error('Opening is unavailable.');
    if (![1, 2].includes(firstSeat)) throw new Error('Invalid first seat.');
    if (!['HEADS', 'TAILS'].includes(face)) throw new Error('Invalid coin face.');
    const firstSide = firstSeat === 1 ? 'PLAYER' : 'AI';
    const result = this.#bridge.completeOpeningFlow(firstSide, {
      choice: face, outcome: face, firstPlayer: firstSide, completed: true
    });
    if (result?.ok === false) throw new Error(result.error || 'Opening flow rejected.');
    this.#revision++;
    this.#canonical = clone(this.#bridge.getCanonicalSnapshot(1));
    this.#bridgeSeat = 1; this.#bridgeRevision = this.#revision;
    // Opening draws are committed on the server. A fully resolved Draw must
    // enter Deploy without waiting for an impossible browser click.
    this.#settleServerContinuations();
    return { ok: true, revision: this.#revision, firstSeat };
  }
  /**
   * Complete only transitions whose rule work is already fully resolved.
   * In particular, never cross a pending Bard/Quick Reload/Response choice.
   * The headless VM intentionally has no timer, so an End continuation after
   * Provoke must execute here rather than waiting for a setTimeout callback.
   * Each user intent + its immediate automatic consequences is one revision.
   */
  #settleServerContinuations() {
    for (let step = 0; step < 8; step++) {
      const s = this.#canonical?.appState;
      if (!s || s.gameOver || s.pending || s.responseWindow) return;
      const drawReady = s.phase === 'Draw' &&
        s.drawPhaseResolvedFor === s.turn && !s.drawPresentationPending && !s.pvpTurnReady;
      const endReady = s.phase === 'End' && !!s.autoEndTurnPending;
      if (!drawReady && !endReady) return;
      const seat = s.turn === 'PLAYER' ? 1 : s.turn === 'AI' ? 2 : null;
      if (!seat) throw new Error('Automatic continuation has no active seat.');
      this.#restore(seat);
      const before = JSON.stringify(this.#bridge.getCanonicalSnapshot(seat).appState);
      const result = this.#bridge.applyServerIntent('advancePhase', []);
      if (!result?.ok) throw new Error('Automatic phase continuation failed: ' + String(result?.error || 'rejected'));
      const next = clone(this.#bridge.getCanonicalSnapshot(seat));
      if (JSON.stringify(next.appState) === before) throw new Error('Automatic phase continuation made no progress.');
      this.#canonical = next;
      this.#bridgeSeat = seat;
      this.#bridgeRevision = this.#revision;
    }
    throw new Error('Automatic phase continuation exceeded safe step limit.');
  }
  /** A verified seat may concede without turn/response ownership. */
  forfeit(seat) {
    return this.applyIntent(seat, 'executeConfirmedSurrender', []);
  }
  /** NEVER serialize this return value to a client; it contains full hidden information. */
  _canonicalForServerOnly() {
    if (!this.#started) throw new Error('Match not started.');
    return clone(this.#canonical);
  }
  #restore(seat) {
    if (this.#bridgeSeat === seat && this.#bridgeRevision === this.#revision) return;
    const ok = this.#bridge.importCanonicalSnapshot(this.#canonical, seat, { skipImportAnimations: true });
    if (!ok) throw new Error('RC32 canonical state reimport failed.');
    this.#bridgeSeat = seat;
    this.#bridgeRevision = this.#revision;
  }
  /** The full perspective-specific board is private; NEVER network this directly. */
  _viewForMaskingOnly(seat) {
    if (![1,2].includes(seat)) throw new Error('Invalid viewer seat.');
    if (!this.#started) return null;
    this.#restore(1);
    return clone(this.#bridge.getCanonicalSnapshot(seat));
  }
  canSeatAct(seat) {
    if (![1, 2].includes(seat) || !this.#canonical?.appState) return false;
    const s = this.#canonical.appState, side = seat === 2 ? 'AI' : 'PLAYER';
    if (s.gameOver) return false;
    if (s.pending) {
      const owner = s.pending.decision_side || s.pending.response_owner || s.pending.side || s.pending.source_side;
      if (owner) return owner === side;
    }
    if (s.responseWindow?.response_owner) return s.responseWindow.response_owner === side;
    return s.turn === side;
  }
  /** The engine, not the client, determines action legality and authoritative revision. */
  applyIntent(seat, name, args = []) {
    if (!this.#started || this.#revision < 2) throw new Error('Opening is not finished.');
    if (![1,2].includes(seat)) throw new Error('Invalid player seat.');
    if (!this.canSeatAct(seat) && name !== 'executeConfirmedSurrender') throw new Error('Not your turn or decision window.');
    if (!Array.isArray(args) || args.length > 8) throw new Error('Invalid intent arguments.');
    if (typeof name !== 'string' || !/^[a-zA-Z][a-zA-Z0-9]{0,75}$/.test(name)) throw new Error('Invalid intent.');
    // These RC32 bridge callbacks accept an explicit actor side. An untrusted
    // player must never trigger the opponent's otherwise-legal active ability.
    if (['beginActivatedHeroAbility','beginActivatedLegacyAbility','beginActivatedRacialAbility'].includes(name) && args[0] !== 'PLAYER') {
      throw new Error('Cannot activate an opponent Hero, Legacy or Racial Trait.');
    }
    this.#restore(seat);
    // Import normalizes a small number of render-only fields (e.g.
    // gameResultShown). Compare action against the RESTORED baseline, not
    // against the pre-import serialized state, or seat 2 invalid actions
    // may falsely appear to mutate the board and increment revision.
    const rollback = this.#canonical;
    const before = JSON.stringify(this.#bridge.getCanonicalSnapshot(seat).appState);
    try {
      applyOptimizedPvpIntent({
        bridge: this.#bridge,
        // The bridge is restored into the acting player's LOCAL perspective.
        // getCanonicalSnapshot(2) flips it back into fixed seat-1 coordinates:
        // local PLAYER decisions become AI and atomic Tune Up falsely rejects
        // them. Read-only choice checks must use the LOCAL perspective (1).
        // Persisting the result still uses getCanonicalSnapshot(seat) below.
        readPending: () => this.#bridge.getCanonicalSnapshot(1).appState?.pending,
        name, args: clone(args)
      });
    } catch (error) {
      // A multi-step fast path must remain fully atomic. The server-owned
      // canonical snapshot has not changed, and the next action must reimport
      // that canonical state instead of reusing the modified VM state.
      this.#bridgeSeat = null;
      this.#bridgeRevision = -1;
      throw error;
    }
    // RC32 executes seat 2 actions in a mirrored local PLAYER perspective.
    // getCanonicalSnapshot(seat) flips that perspective BACK into the fixed
    // server seat-1 canonical coordinate system; getCanonicalSnapshot(1) here
    // would persist a swapped board and falsely mark seat-2 no-ops as actions.
    const next = clone(this.#bridge.getCanonicalSnapshot(seat));
    if (JSON.stringify(next.appState) === before) {
      this.#bridgeSeat = null;
      throw new Error('No authoritative state change for action.');
    }
    this.#canonical = next;
    this.#revision += 1;
    this.#bridgeSeat = seat;
    this.#bridgeRevision = this.#revision;
    try { this.#settleServerContinuations(); }
    catch (error) {
      // Do not publish a partially settled authority state.
      this.#canonical = rollback;
      this.#revision -= 1;
      this.#bridgeSeat = null;
      this.#bridgeRevision = -1;
      throw error;
    }
    return {ok: true, revision: this.#revision};
  }
}

export const RC32_RUNTIME_SOURCES = RUNTIME_SOURCES;
