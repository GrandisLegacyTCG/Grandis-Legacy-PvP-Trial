/**
 * PvP RC39 combat presentation journal.
 *
 * The Season 0 rule engine remains the sole authority. Its regular headless
 * rendering suppresses all browser FX, and a browser can miss an intermediate
 * Response snapshot. Capture public Attack facts at the authoritative boundary
 * and publish a small, replay-safe, viewer-relative event only after the
 * complete Response/mandatory-choice chain has settled.
 *
 * Never publish the actual Hand, Deck, Response options or Mana identities.
 */
const LANES = ['LEFT','CENTER','RIGHT'];
const STATUSES = new Set(['Poison','Burn','Bleed','Freeze','Stun','Sleep']);
const opposite = side => side === 'PLAYER' ? 'AI' : side === 'AI' ? 'PLAYER' : side;
const saneLane = lane => LANES.includes(lane) ? lane : null;
const saneSide = side => side === 'AI' ? 'AI' : 'PLAYER';
function findAttackWindow(r,depth=0) {
  if (!r || typeof r !== 'object' || depth > 6) return null;
  if (r.kind === 'incoming_attack') return r;
  return findAttackWindow(r.original_attack_context,depth+1) ||
    findAttackWindow(r.response_continuation,depth+1);
}
function publicAttackState(s) {
  return findAttackWindow(s?.responseWindow) ||
    findAttackWindow(s?.pending?.incoming_response_window) ||
    findAttackWindow(s?.pending?.after_stoneblood_response) || null;
}
function targetLanes(r) {
  const source = r?.multi_sequence?.affected_lanes || r?.affected_lanes ||
    r?.action?.target_lanes || (r?.target_lane ? [r.target_lane] : []);
  return [...new Set((Array.isArray(source) ? source : []).filter(saneLane))];
}
function statuses(hero) {
  const known=new Map();
  for (const x of hero?.statuses||[]) {
    const name=typeof x==='string'?x:String(x?.name||x?.status||'');
    const n=Math.max(1,Number(x?.duration??1)||1);
    if (STATUSES.has(name)) known.set(name,Math.max(known.get(name)||0,n));
  }
  return known;
}
function statusDeltas(oldHero,newHero){
  if(!oldHero||!newHero)return [];
  const result=[];
  for(const [status,after] of newHero.statuses){
    const before=oldHero.statuses.get(status)||0;
    if(after>before)result.push({status,before,after});
  }
  return result;
}
function publicHero(s,side,lane) {
  const h=s?.[side==='PLAYER'?'playerHeroes':'aiHeroes']?.[lane];
  return h ? {hp:Math.max(0,Number(h.hp)||0),statuses:statuses(h)} : null;
}
function attackKey(r,s) {
  return [String(r?.action?.commit_token||r?.action?.player_event_id||''),
    String(r?.card_id||''),saneSide(r?.source_side),saneLane(r?.source_lane)||'',
    saneSide(r?.target_side),Number(s?.round||0)].join('|');
}
export class PvpCombatPresentationLedger {
  #active=null;
  #events=[];
  #serial=0;
  /** Called after a successful authoritative intent (never on a rejected intent). */
  capture(before,after) {
    if (!before || !after) return;
    const context=publicAttackState(after)||publicAttackState(before);
    if (!this.#active && !context) {
      // An unrespondable or immediately resolved Attack can be fully committed
      // by a single intent. Previously no VFX/damage display was ever emitted.
      if(after.pending||after.responseWindow)return;
      const oldIds=new Set(['PLAYER','AI'].flatMap(side=>(before.pvpActionEventsBySide?.[side]||[]).map(e=>e.id)));
      const direct=['PLAYER','AI'].flatMap(side=>(after.pvpActionEventsBySide?.[side]||[])
        .filter(e=>e?.label==='ATK'&&e.card_id&&!oldIds.has(e.id)).map(e=>({...e,actor_side:side})))
        .sort((a,b)=>Number(a.played_event_order||0)-Number(b.played_event_order||0));
      for(const evt of direct){
        const side=evt.actor_side,targetSide=evt.target_side==='AI'||evt.target_side==='PLAYER'?
          evt.target_side:opposite(side);
        const chosen=[...(evt.target_lanes||[]),evt.target_lane].filter(saneLane);
        const targets=[];
        for(const lane of LANES){
          const old=publicHero(before,targetSide,lane),now=publicHero(after,targetSide,lane);
          if(!old||!now)continue;
          const delta=statusDeltas(old,now),gained=delta.map(x=>x.status);
          const damage=Math.max(0,old.hp-now.hp);
          if(damage>0||gained.length||chosen.includes(lane))targets.push({side:targetSide,lane,damage,statuses:gained,status_changes:delta,
            target_hero_card_id:before?.[targetSide==='PLAYER'?'playerHeroes':'aiHeroes']?.[lane]?.card_id||null});
        }
        if(!targets.length)continue;
        this.#events.push({id:'PVP-COMBAT-'+(++this.#serial),type:'PVP_COMBAT_RESOLVED',
          card_id:evt.card_id,attack_event_id:evt.id,source_side:side,source_lane:saneLane(evt.source_lane)||'CENTER',
          target_side:targetSide,target_lane:saneLane(evt.target_lane),
          attack_type:String(evt.attack_type||'Attack').slice(0,55),
          damage_type:/magical/i.test(String(evt.damage_type||''))?'Magical':'Physical',targets});
        if(this.#events.length>36)this.#events.shift();
      }
      return;
    }
    if (!this.#active && context) {
      this.#active={
        key:attackKey(context,after),card_id:String(context.card_id||'').slice(0,60),
        attack_event_id:context.action?.pvp_event_id||null,
        source_side:saneSide(context.source_side),source_lane:saneLane(context.source_lane)||'CENTER',
        target_side:saneSide(context.target_side),target_lane:saneLane(context.target_lane),
        attack_type:String(context.attack_type||'').slice(0,55),
        damage_type:String(context.damage_type||'Physical').slice(0,24),
        lanes:new Set(),baseline:{},
        negationIds:new Set((before.presentationEvents||[]).filter(e=>e?.type==='CARD_NEGATED').map(e=>String(e?.id||'')))
      };
    }
    const a=this.#active;
    if (!a) return;
    if (context && attackKey(context,after)===a.key) {
      for(const lane of targetLanes(context)) a.lanes.add(lane);
    }
    if (!a.lanes.size && a.target_lane) a.lanes.add(a.target_lane);
    // The baseline is the board before the first Response was opened. If the
    // first observed frame is already responding, it is still prior to impact.
    for(const lane of a.lanes) {
      if(!a.baseline[lane]) a.baseline[lane]=publicHero(before,a.target_side,lane);
    }
    // No early per-target animation: Area Attack can open a separate Response
    // for every affected Hero and can pause for Stoneblood/Legacy choices.
    if (after.responseWindow || after.pending) return;
    this.#active=null;
    const targets=[];
    for(const lane of a.lanes) {
      const old=a.baseline[lane],now=publicHero(after,a.target_side,lane);
      if(!old||!now)continue;
      const delta=statusDeltas(old,now),gains=delta.map(x=>x.status);
      targets.push({side:a.target_side,lane,damage:Math.max(0,old.hp-now.hp),statuses:gains,
        status_changes:delta,target_hero_card_id:before?.[a.target_side==='PLAYER'?'playerHeroes':'aiHeroes']?.[lane]?.card_id||null});
    }
    if (!targets.length || !a.card_id) return;
    const fullyNegated=(after.presentationEvents||[]).some(e=>
      e?.type==='CARD_NEGATED' && e.target_card_id===a.card_id &&
      !a.negationIds.has(String(e.id||'')));
    if(fullyNegated && targets.every(t=>t.damage===0&&!t.statuses.length))return;
    const event={id:'PVP-COMBAT-'+(++this.#serial),type:'PVP_COMBAT_RESOLVED',
      card_id:a.card_id,attack_event_id:a.attack_event_id||null,source_side:a.source_side,source_lane:a.source_lane,
      target_side:a.target_side,target_lane:a.target_lane,attack_type:a.attack_type,
      damage_type:a.damage_type,targets};
    this.#events.push(event);
    if (this.#events.length>36) this.#events.shift();
  }
  forSeat(seat) {
    if (![1,2].includes(seat)) throw new Error('Invalid presentation seat.');
    return this.#events.map(e=>({
      ...e,
      source_side:seat===2?opposite(e.source_side):e.source_side,
      target_side:seat===2?opposite(e.target_side):e.target_side,
      targets:e.targets.map(t=>({...t,side:seat===2?opposite(t.side):t.side,statuses:[...t.statuses],
        status_changes:(t.status_changes||[]).map(x=>({...x}))}))
    }));
  }
}
