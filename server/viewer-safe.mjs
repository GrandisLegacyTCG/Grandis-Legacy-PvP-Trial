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
  // A Mana Burn/Steal result goes ONLY to the losing seat. Self-paid
  // Ability costs and the initiating player's choice must not produce a loss toast.
  if(event.type==='MANA_LOSS_COMMITTED'&&
     (event.side!=='PLAYER'||event.source_side!=='AI'||event.loss_kind==='ABILITY_SPEND'))return null;
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
    if(typeof event.effect_card_id==='string'&&/^S0-[A-Z0-9]+-[A-Z0-9]+$/.test(event.effect_card_id))out.effect_card_id=event.effect_card_id;
    if(typeof event.effect_action_id==='string'&&/^pvp_(PLAYER|AI)_/.test(event.effect_action_id))out.effect_action_id=publicScalar(event.effect_action_id,120);
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
// PvP Part 3: Card Played is public, but the unsanitized engine audit journal is
// not. Project only committed played cards and public combat metrics. Do NOT
// serialize unplayed Hand/Deck identities, detailed search results or raw logs.
const publicCardId = id => typeof id === 'string' && /^S0-[A-Z0-9]+-[A-Z0-9]+$/.test(id);
const publicLane = lane => ['LEFT','CENTER','RIGHT'].includes(lane) ? lane : null;
const publicSide = side => ['PLAYER','AI'].includes(side) ? side : null;
const publicScalar = (value,max=180) => String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max);
const publicNumber = n => Number.isFinite(Number(n)) ? Math.max(-10000,Math.min(100000,Number(n))) : 0;
// These numeric metrics are public once the Attack resolves; do not publish
// the engine's nested details, source deck inventories or unrevealed choices.
const publicDamageSummary = src => {
  if(!src || typeof src!=='object')return undefined;
  const allowed=['base_damage','damage_after_modifiers','response_block','passive_reduction',
    'active_reduction','follow_up_incoming_damage','follow_up_damage','calculated_final_damage',
    'actual_hp_damage','overkill','target_hp_before','target_hp_after','burn_damage'];
  const out={};for(const key of allowed)if(Object.hasOwn(src,key))out[key]=publicNumber(src[key]);
  return Object.keys(out).length ? out : undefined;
};
const safePlayedResultLine = line => {
  if(typeof line!=='string'||line.length>300)return false;
  // Only combat/visible-status outcomes are safe; the rest can contain the
  // exact identity of cards searched, viewed, returned or still in Hand/Deck.
  if(/\b(hand|main deck|shard deck|search|reveal|look at|top card|bottom card|deck order|random card|private)\b/i.test(line)||/S0-[A-Z0-9]+-[A-Z0-9]+/i.test(line))return false;
  return /\b(damag\w*|hp\s*:|block\w*|dodg\w*|counter\w*|negat\w*|cancel\w*|status\w*|heal\w*|poison\w*|burn\w*|bleed\w*|freez\w*|stun\w*|sleep\w*|invincib\w*|prevent\w*|resolv\w*|defeat\w*|reflect\w*)\b/i.test(line);
};
function safePlayedAction(event,side) {
  if(!event||typeof event!=='object'||!publicCardId(event.card_id))return null;
  if(!publicSide(side))return null;
  const label=publicScalar(event.label||'ACTION',22).toUpperCase();
  const out={
    id:publicScalar(event.id||'',120), label:/^[A-Z ]{1,22}$/.test(label)?label:'ACTION',
    card_id:event.card_id,
    title:publicScalar(event.title||event.card_id,120),
    action_line:(side==='PLAYER'?'You':'Opponent')+' played '+publicScalar(event.title||event.card_id,120)+'.',
    source_side:side,source_lane:publicLane(event.source_lane),
    target_side:publicSide(event.target_side),target_lane:publicLane(event.target_lane),
    round:Math.max(1,Math.min(9999,Number(event.round)||1)),
    phase:publicScalar(event.phase||'',25),turn:publicSide(event.turn),
    timestamp:Math.max(0,Number(event.timestamp)||0),
    played_event_order:Math.max(0,Number(event.played_event_order)||0),
    resolution_state:publicScalar(event.resolution_state||'RESOLVED',20),
    result_lines:(Array.isArray(event.result_lines)?event.result_lines:[])
      .filter(safePlayedResultLine).slice(0,14).map(line=>publicScalar(line,300))
  };
  // Hero identity and EXP gained are public once the action was played.
  // Never include snapshots, raw detail_lines, hidden inventory or audit traces.
  for(const key of ['source_hero_card_id','target_hero_card_id','defended_hero_card_id'])
    if(publicCardId(event[key]))out[key]=event[key];
  if(label==='TRIBUTE'){
    const tributeLine=(Array.isArray(event.result_lines)?event.result_lines:[])
      .find(line=>typeof line==='string'&&/\bgained\s+\d+\s+EXP\b/i.test(line));
    const value=Number.isFinite(Number(event.exp_gained))?Number(event.exp_gained):
      tributeLine?Number(/\bgained\s+(\d+)\s+EXP\b/i.exec(tributeLine)?.[1]):NaN;
    if(Number.isFinite(value)&&value>=0&&value<=200)out.exp_gained=value;
  }
  if(label==='DEF'){
    const allowed=['block','dodge','second_chance','dragon_scale','area_reduce','immunity',
      'absolute_reflect','legacy_reduce','negate_return','reflect','step_in'];
    const kind=String(event.response_kind||'').toLowerCase();
    if(allowed.includes(kind))out.response_kind=kind;
    // A named Response can be useful even if its text is not a literal BLOCK/DODGE keyword.
    if(typeof event.defense_text==='string')out.defense_text=publicScalar(event.defense_text,140);
  }
  if(!out.id)out.id='pvp_safe_'+side+'_'+out.played_event_order+'_'+out.card_id;
  if(Array.isArray(event.target_lanes))out.target_lanes=event.target_lanes.map(publicLane).filter(Boolean);
  const damage=publicDamageSummary(event.damage_summary);
  if(damage)out.damage_summary=damage;
  if(label==='ATK'){
    if(/^(physical|magical)$/i.test(String(event.damage_type||'')))out.damage_type=String(event.damage_type);
    if(typeof event.attack_type==='string')out.attack_type=publicScalar(event.attack_type,40);
  }
  // Each target/hit has a public resolved HP delta. Arrow Barrage/Area
  // Attacks cannot be summarized accurately using the last hit alone.
  // Batch2: resolved damage is public even when a card is classified as an
  // Ability/Item/Event. Only the recipient-safe scalar breakdown crosses PvP.
  if(Array.isArray(event.damage_breakdown_by_hero)){
    out.damage_by_hero=event.damage_breakdown_by_hero.slice(0,36).map(x=>({
      name:publicScalar(x?.name||'Target Hero',100),
      side:publicSide(x?.side),lane:publicLane(x?.lane),
      summary:publicDamageSummary(x?.summary)||{}
    })).filter(x=>x.side&&x.lane);
  }
  if(Array.isArray(event.healing_by_hero))out.healing_by_hero=event.healing_by_hero.slice(0,16).map(x=>({
    name:publicScalar(x?.name||'Hero',100),side:publicSide(x?.side),lane:publicLane(x?.lane),
    healed:Math.max(0,publicNumber(x?.healed))
  })).filter(x=>x.side&&x.lane);
  // Explicit response-chain pointers are public: they refer to already-played
  // cards only and let the client navigate without new server requests.
  if(typeof event.card_played_chain_id==='string'&&event.card_played_chain_id.length<130)
    out.card_played_chain_id=publicScalar(event.card_played_chain_id,130);
  if(Number.isInteger(event.card_played_chain_step)&&event.card_played_chain_step>=0&&event.card_played_chain_step<=64)
    out.card_played_chain_step=event.card_played_chain_step;
  if(event.mana_result&&typeof event.mana_result==='object'){
    const mode=event.mana_result.mode;
    if(mode==='BURN'||mode==='STEAL')out.mana_result={mode,
      removed_count:Math.max(0,Math.min(12,Math.trunc(Number(event.mana_result.removed_count)||0))),
      gained_count:Math.max(0,Math.min(12,Math.trunc(Number(event.mana_result.gained_count)||0)))};
  }
  // Result-only card movement. A card brought from Main Deck into Hand
  // remains private to both players: its identity is never serialized here.
  if(Array.isArray(event.card_movements))out.card_movements=event.card_movements.slice(0,20).map(move=>{
    const from=String(move?.from||''),to=String(move?.to||'');
    if(!['Hand','Main Deck','Discard','Field','EXP'].includes(from)||
       !['Hand','Main Deck','Discard','Field','EXP'].includes(to))return null;
    const disclose=from==='Discard'||from==='Field'||from==='EXP'||
      (from==='Hand'&&to==='Discard'&&side==='PLAYER');
    const ids=disclose?(Array.isArray(move.card_ids)?move.card_ids:[]).filter(publicCardId).slice(0,20):[];
    return {from,to,count:ids.length||Math.max(0,Math.min(40,Math.trunc(Number(move.count)||0))),
      card_ids:ids,known:disclose&&ids.length>0};
  }).filter(Boolean);
  // Attack aftermath is a public HP/status transition, not a private hand
  // inspection or an internal action trace.
  if(Array.isArray(event.status_breakdown_by_hero))
    out.status_by_hero=event.status_breakdown_by_hero.slice(0,20).map(x=>({
      name:publicScalar(x?.name||'Hero',100),side:publicSide(x?.side),lane:publicLane(x?.lane),
      status:publicScalar(x?.status||x?.status_name||'',25),
      before:Math.max(0,Math.min(6,Math.trunc(Number(x?.before??x?.previous_duration)||0))),
      after:Math.max(0,Math.min(6,Math.trunc(Number(x?.after??x?.final_duration)||0)))
    })).filter(x=>x.side&&x.lane&&/^(Poison|Burn|Bleed|Freeze|Stun|Sleep)$/i.test(x.status));
  if(typeof event.response_to_event_id==='string')out.response_to_event_id=publicScalar(event.response_to_event_id,120);
  if(publicCardId(event.response_to_card_id))out.response_to_card_id=event.response_to_card_id;
  if(publicSide(event.response_to_side))out.response_to_side=event.response_to_side;
  if(typeof event.casting_action_id==='string')out.casting_action_id=publicScalar(event.casting_action_id,140);
  if(typeof event.related_casting_start_event_id==='string')out.related_casting_start_event_id=publicScalar(event.related_casting_start_event_id,140);
  if(typeof event.casting_stage==='string')out.casting_stage=publicScalar(event.casting_stage,25);
  return out;
}
function publicPlayedJournal(st) {
  const raw=st.pvpActionEventsBySide||{};
  return {PLAYER:(Array.isArray(raw.PLAYER)?raw.PLAYER:[]).map(e=>safePlayedAction(e,'PLAYER')).filter(Boolean).slice(0,120),
    AI:(Array.isArray(raw.AI)?raw.AI:[]).map(e=>safePlayedAction(e,'AI')).filter(Boolean).slice(0,120)};
}

function ownerOf(p) { return p?.decision_side || p?.response_owner || p?.side || p?.source_side || null; }
function guardedPending(p) {
  if (!p) return null;
  // Unknown ownership must be treated as private, never implicitly as local.
  if (ownerOf(p) === 'PLAYER') return p;
  return {type: p.type, decision_side: ownerOf(p) || 'UNKNOWN', private_masked: true};
}
// Variable Attack formula operands are public once the Attack commits.
// Copy only finite numeric values from the server's accepted action. Never
// forward private action objects, target choices or Mana/Deck inventories.
const variableDamageSpec={
  'S0-ARC-010':['mana_cards_spent','Mana Shards',90],
  'S0-MAG-027':['casting_time_at_release','Casting Time',0],
  'S0-ARC-030':['s0_condition_return_count','Zol Returned',0],
  'S0-ARC-025':['draw_count_at_attack','Cards Drawn',140],
  'S0-MAG-025':['mana_regen_at_attack','Mana Regen',0]
};
function publicAttackFormula(r) {
  const spec=variableDamageSpec[r?.card_id],a=r?.action;
  if(!spec||!a||typeof a!=='object')return null;
  const count=Math.max(0,Math.min(200,Math.trunc(Number(a[spec[0]])||0)));
  // printed_damage is intentionally null on nonprinted formulas; parse only
  // a NUMBER already recorded in the engine's computed public formula log.
  const matched=/\bprinted\s+(\d+)\s*[×x*]/i.exec(String(a.damage_formula_log||''));
  let rawBase=matched?Number(matched[1]):Number(r?.post?.printed_damage);
  // Runeforged release.post.printed_damage is itself Casting Time x print.
  // Reverse that multiplication for a truthful one-unit formula.
  if(r.card_id==='S0-MAG-027'&&count>0&&Number.isFinite(rawBase))rawBase/=count;
  const unit=Number.isFinite(rawBase)&&rawBase>0?Math.min(10000,rawBase):0;
  if(!unit||!count)return null;
  const base=spec[2]?Math.min(spec[2],unit*count):unit*count;
  return {unit_damage:unit,count,unit_label:spec[1],scaled_damage:base};
}
// Only declared, public Attack geometry may cross a masked nested Response.
// In particular never forward the opponent's options, hand, cost or tokens.
function publicIncomingAttack(r,depth=0) {
  if(!r||typeof r!=='object'||depth>6)return null;
  if(r.kind!=='incoming_attack')return publicIncomingAttack(r.original_attack_context,depth+1)||
    publicIncomingAttack(r.response_continuation,depth+1);
  const out={kind:'incoming_attack'};
  for(const k of ['source_side','source_lane','target_side','target_lane','card_id',
    'damage','base_damage','damage_type','attack_type','cannot_block','cannot_dodge'])
    if(Object.hasOwn(r,k))out[k]=r[k];
  const lanes=Array.isArray(r.multi_sequence?.affected_lanes)?r.multi_sequence.affected_lanes:
    Array.isArray(r.affected_lanes)?r.affected_lanes:[];
  out.affected_lanes=lanes.filter(l=>['LEFT','CENTER','RIGHT'].includes(l));
  const publicFormula=publicAttackFormula(r);if(publicFormula)out.damage_formula=publicFormula;
  if(r?.post?.printed_damage!=null&&Number.isFinite(Number(r.post.printed_damage)))out.base_damage=publicNumber(r.post.printed_damage);
  else if(Number.isFinite(Number(r?.base_damage)))out.base_damage=publicNumber(r.base_damage);
  return out;
}
function safeResponse(r) {
  if(!r)return null;
  if(r.response_owner==='PLAYER'){
    const owned=clone(r),attack=publicIncomingAttack(r);
    if(attack?.damage_formula)owned.damage_formula=attack.damage_formula;
    if(attack&&Object.hasOwn(attack,'base_damage'))owned.base_damage=attack.base_damage;
    return owned;
  }
  const out={};
  for(const k of ['kind','response_owner','target_side','target_lane','source_side',
    'source_lane','card_id','damage','damage_type','attack_type','cannot_block','cannot_dodge'])
    if(Object.hasOwn(r,k))out[k]=r[k];
  if(r.kind==='incoming_attack'){
    const publicAttack=publicIncomingAttack(r);
    if(publicAttack){out.affected_lanes=publicAttack.affected_lanes;if(Object.hasOwn(publicAttack,'base_damage'))out.base_damage=publicAttack.base_damage;if(publicAttack.damage_formula)out.damage_formula=publicAttack.damage_formula;}
  }else{
    const publicAttack=publicIncomingAttack(r.original_attack_context)||
      publicIncomingAttack(r.response_continuation);
    if(publicAttack)out.original_attack_context=publicAttack;
  }
  out.private_masked=true;
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
  // Do not delete public played cards: that removed DEF/DODGE, broken clickable
  // details and opponent audio/VFX from authoritative PvP projections.
  const played=publicPlayedJournal(st);
  for(const key of ['lastActualDrawEvent','lastOpponentAction','lastPlayerAction',
    'drawPresentationPending','opponentPlayedEvents','playerPlayedEvents','aiPlayedEvents',
    'pvpActionEventsBySide','pvpBattleFeedbackEvents'])delete st[key];
  st.pvpActionEventsBySide=played;
  st.playerPlayedEvents=played.PLAYER;
  st.opponentPlayedEvents=played.AI;
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
  for(const side of ['PLAYER','AI'])for(const e of st.pvpActionEventsBySide?.[side]||[]){
    if(!publicCardId(e.card_id)||e.source_side!==side||Object.hasOwn(e,'privateHand')||Object.hasOwn(e,'privateDeck'))
      throw new Error('Card Played journal contains private data.');
  }
  return true;
}
