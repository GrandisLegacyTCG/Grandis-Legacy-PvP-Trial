/**
 * Server-owned viewer projection. Never send a canonical RC31 board directly.
 * The engine provides a PLAYER-relative perspective for either seat.
 * This projection intentionally omits unaudited diagnostic/event internals.
 */
const HIDDEN = '__HIDDEN_CARD_BACK__';
const clone = (v) => structuredClone(v);
const hidden = (n) => Array.from({length: Math.max(0, Math.min(1000, Number(n) || 0))}, () => HIDDEN);
const safeEvent = (event) => {
  if (!event || typeof event !== 'object') return null;
  // Only the affected player receives their resolved loss notification.
  if(event.type==='MANA_LOSS_COMMITTED'&&event.side!=='PLAYER')return null;
  const out = {};
  for (const k of ['id', 'type', 'side', 'actor_side', 'reason', 'group_id', 'group_index', 'hand_index', 'timestamp']) {
    if (Object.hasOwn(event, k)) out[k] = event[k];
  }
  if (event.type === 'CARD_DRAWN' && (event.side || event.actor_side) === 'PLAYER') out.card_id = event.card_id;
  if (event.type === 'CARD_NEGATED') {
    for (const k of ['counter_side','counter_card_id','target_side','target_card_id'])
      if (Object.hasOwn(event,k)) out[k]=event[k];
  }
  if (event.type === 'RACIAL_TOKEN_USED') {
    for (const k of ['ability_name','source_hero_card_id','token_cost'])
      if (Object.hasOwn(event,k)) out[k]=event[k];
  }
  // Rank Up's committed EXP was already placed beneath the public Hero.
  // Publish only the exact public card IDs required to play synchronized VFX;
  // never serialize private Hand, undisclosed draws, Shard UID or engine state.
  if (event.type === 'RANK_UP_COMMITTED') {
    for (const k of ['lane','from_card_id','to_card_id','rank','return_quota','automatic_return'])
      if (Object.hasOwn(event,k)) out[k]=event[k];
    out.exp_card_ids = Array.isArray(event.exp_card_ids)
      ? event.exp_card_ids.filter(id=>typeof id==='string'&&/^S0-[A-Z0-9-]+$/.test(id)).slice(0,32) : [];
  }
  if(event.type==='MANA_LOSS_COMMITTED'){
    out.source_side=event.source_side==='PLAYER'?'PLAYER':'AI';
    out.effect_name=String(event.effect_name||'Ability').slice(0,100);
    out.removed_count=Math.max(0,Math.min(12,Math.trunc(Number(event.removed_count)||0)));
    out.shard_details=String(event.shard_details||'').slice(0,220);
    out.loss_kind=event.source_side==='PLAYER'?'ABILITY_SPEND':'OPPONENT_REMOVE';
    out.removed_shards=(Array.isArray(event.removed_shards)?event.removed_shards:[]).slice(0,12).map(sh=>({
      kind:sh?.kind==='CLASS'?'CLASS':'MANA',
      class_name:sh?.kind==='CLASS'?String(sh.class_name||'').slice(0,40):''
    }));
  }
  if (event.type === 'TRIAL_EXP_RETURNED_TO_HAND') {
    for (const k of ['lane','card_id','rank_up_id','choice_animated'])
      if (Object.hasOwn(event,k)) out[k]=event[k];
  }
  if (event.type !== 'CARD_DRAWN' && ['CARD_PLAYED', 'ATTACK', 'RESPONSE', 'TRIBUTE', 'RANK_UP'].includes(event.type)) out.card_id = event.card_id;
  return out;
};
function ownerOf(p) { return p?.decision_side || p?.response_owner || p?.side || p?.source_side || null; }
function guardedPending(p) {
  if (!p) return null;
  // Unknown ownership must be treated as private, never implicitly as local.
  if (ownerOf(p) === 'PLAYER') return p;
  return {type: p.type, decision_side: ownerOf(p) || 'UNKNOWN', private_masked: true};
}
function safeResponse(r) {
  if (!r) return null;
  if (r.response_owner === 'PLAYER') return r;
  const out = {};
  for (const k of ['kind','response_owner','target_side','target_lane','source_side','source_lane','card_id','damage','damage_type','attack_type','cannot_block','cannot_dodge']) if (Object.hasOwn(r,k)) out[k] = r[k];
  // These are public target positions already declared by the attacking card.
  // Keeping them lets the defender animate multi-target damage only after the
  // authoritative Response chain resolves; do not expose any Response option.
  if(r.kind==='incoming_attack'&&Array.isArray(r.affected_lanes))
    out.affected_lanes=r.affected_lanes.filter(l=>['LEFT','CENTER','RIGHT'].includes(l));
  out.private_masked = true;
  return out;
}
/** Opaque shuffled choice list: neither UID, kind, class nor pool order may escape. */
export function makeBlindChoices(st, revision, secret, seat) {
  const p = st?.pending;
  if (!p || p.type !== 'opponent_mana_selection' || ownerOf(p) !== 'PLAYER') return new Map();
  // The server owns and resolves the selected physical card. Never use this array's
  // order as the visible opponent pool's order.
  const source = Array.isArray(p.candidates) ? p.candidates : [];
  const keyed = source.map((cand,index) => ({index, key:createHmac('sha256',secret).update(`order|${seat}|${revision}|${cand.uid}`).digest('hex'), handle:createHmac('sha256',secret).update(`choice|${seat}|${revision}|${cand.uid}`).digest('hex').slice(0,32)}));
  keyed.sort((a,b) => a.key.localeCompare(b.key));
  return new Map(keyed.map(x=>[x.handle,x.index]));
}
// Initialized by Node's built-in crypto; avoids letting a browser supply a mapping.
import {createHmac} from 'node:crypto';
export function viewerSafeBoard(raw, {revision, secret, seat} = {}) {
  if (!raw?.appState) throw new Error('No canonical board.');
  if (![1,2].includes(seat)) throw new Error('Invalid projection seat.');
  const board = clone(raw), st = board.appState;
  for (const [prefix, hideHand] of [['player',false],['ai',true]]) {
    const kHand = `${prefix}Hand`,kDeck = `${prefix}Deck`,kLegacy = `${prefix}Legacy`;
    st[`${prefix}HandCount`] = Array.isArray(st[kHand]) ? st[kHand].length : Number(st[`${prefix}HandCount`]||0);
    st[`${prefix}DeckCount`] = Array.isArray(st[kDeck]) ? st[kDeck].length : Number(st[`${prefix}DeckCount`]||0);
    st[`${prefix}LegacyCount`] = Array.isArray(st[kLegacy]) ? st[kLegacy].length : Number(st[`${prefix}LegacyCount`]||0);
    st[kDeck] = hidden(st[`${prefix}DeckCount`]);
    if (hideHand) {
      st[kHand] = hidden(st[`${prefix}HandCount`]);st[kLegacy] = hidden(st[`${prefix}LegacyCount`]);
      // The opponent's unplayed progression package and Mana-class choices are private.
      delete st[`${prefix}LegacyPackageSlots`];delete st[`${prefix}ManaClasses`];
    }
    const md = `${prefix}ManaDeck`;
    st[`${prefix}ManaDeckCount`] = Array.isArray(st[md]) ? st[md].length : Number(st[`${prefix}ManaDeckCount`]||0);
    st[md] = Array.from({length:st[`${prefix}ManaDeckCount`]},(_,i)=>({hidden:true,slot_index:i}));
  }
  // RC38 visible Mana Pool: Mana Shard faces (Regular / Color Class) are public
  // while the canonical physical UID and private Mana Deck order are NOT.
  // Blind Mana selection remains server-owned and randomly mapped by handle.
  st.aiManaPoolCards = (st.aiManaPoolCards || []).map((sh,i)=>({
    uid:`PVP-OPPONENT-PUBLIC-${i}`,
    kind:sh?.kind==='CLASS'?'CLASS':'MANA',
    class_name:sh?.kind==='CLASS'?String(sh.class_name||''):'',
    owner_side:'AI',
    hidden:false
  }));
  if (st.lastDrawnCardBySide) st.lastDrawnCardBySide.AI = HIDDEN;
  // Private logs and ledgers may carry card IDs that never entered public play.
  for (const key of ['lastActualDrawEvent','lastOpponentAction','drawPresentationPending','opponentPlayedEvents','pvpActionEventsBySide','pvpBattleFeedbackEvents']) delete st[key];
  st.presentationEvents = (st.presentationEvents||[]).map(safeEvent).filter(Boolean).slice(-80);
  st.log = [];
  const rawPending = st.pending;
  st.pending = guardedPending(rawPending);
  if (st.pending?.type === 'opponent_hand_choice' && st.pending.reveal_cards !== true && st.pending.cards_revealed !== true && Array.isArray(st.pending.candidates)) {
    st.pending.candidates = st.pending.candidates.map(c => ({card_id:HIDDEN,hand_index:c.hand_index}));
  }
  st.responseWindow = safeResponse(st.responseWindow);
  if (st.pending?.type === 'opponent_mana_selection' && ownerOf(st.pending) === 'PLAYER') {
    const choices = makeBlindChoices(raw.appState, revision, secret, seat);
    const sel = new Set((rawPending.selected_indices||[]).map(Number));
    st.pending.candidates = [...choices.keys()].map(choice_handle=>({uid:choice_handle,choice_handle}));
    st.pending.selected_indices = [...choices.values()].map((index,visible)=>sel.has(index)?visible:-1).filter(i=>i>=0);
    st.pending.pvp_pool_revision = revision;
  }
  // No client may rely on, inspect, or import canonical hidden information.
  board.pvpPrivateStateMasked = true;
  board.pvpRecipientSeat = seat;
  return board;
}
export function assertViewerSafeBoard(view) {
  const st = view?.appState;
  if (!st || !view.pvpPrivateStateMasked) throw new Error('Unmasked board.');
  if ((st.aiHand||[]).some(id=>id!==HIDDEN)) throw new Error('Opponent hand leaked.');
  if ((st.playerDeck||[]).some(id=>id!==HIDDEN) || (st.aiDeck||[]).some(id=>id!==HIDDEN)) throw new Error('Deck order leaked.');
  if ((st.aiLegacy||[]).some(id=>id!==HIDDEN)) throw new Error('Opponent Legacy leaked.');
  if(st.aiLegacyPackageSlots||st.aiManaClasses)throw new Error('Opponent deck construction leaked.');
  if((st.aiManaPoolCards||[]).some(c=>!/^PVP-OPPONENT-PUBLIC-\d+$/.test(String(c.uid||''))||c.hidden!==false||!['MANA','CLASS'].includes(c.kind)||(c.kind==='MANA'&&c.class_name)))throw new Error('Opponent Mana view invalid or physical UID leaked.');
  for(const k of ['playerManaDeck','aiManaDeck']) if ((st[k]||[]).some(c=>c?.hidden!==true)) throw new Error('Mana Deck order leaked.');
  if(st.pending?.private_masked && Object.keys(st.pending).some(k=>!['type','decision_side','private_masked'].includes(k)))throw new Error('Private pending leaked.');
  if(st.pending?.type==='opponent_mana_selection'&&st.pending.candidates?.some(c=>!c.choice_handle||c.uid!==c.choice_handle||c.kind||c.class_name))throw new Error('Opponent Shard choice leaked.');
  if(st.pending?.type==='opponent_hand_choice'&&!st.pending.reveal_cards&&st.pending.candidates?.some(c=>c.card_id!==HIDDEN))throw new Error('Opponent Hand blind choice leaked.');
  return true;
}
