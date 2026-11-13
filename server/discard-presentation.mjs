/**
 * Server-authoritative, affected-player-only notices for opponent-caused
 * movement to Discard. Computed from accepted canonical transitions only.
 * Card identities are NEVER sent to the opposing player or spectators by this
 * module, including cards discarded directly from a private Main Deck.
 */
const SIDES=['PLAYER','AI'];
const LANES=['LEFT','CENTER','RIGHT'];
const asCard = item => typeof item==='string' ? item : item?.card_id||item?.id||null;
const ids = array => (Array.isArray(array)?array:[]).map(asCard).filter(x=>typeof x==='string'&&/^S0-[A-Z0-9]+-[A-Z0-9]+$/.test(x));
const diff = (before,after) => {
  const c=new Map();for(const id of before)c.set(id,(c.get(id)||0)+1);
  const result=[];for(const id of after){const n=c.get(id)||0;if(n>0)c.set(id,n-1);else result.push(id)}
  return result;
};
const sidePrefix = side => side==='PLAYER'?'player':'ai';
const fromZone = (s,side,kind) => {
  const prefix=sidePrefix(side);
  if(kind==='HAND')return ids(s?.[prefix+'Hand']);
  if(kind==='MAIN_DECK')return ids(s?.[prefix+'Deck']);
  if(kind==='EXP'){
    const heroes=s?.[prefix+'Heroes']||{};return LANES.flatMap(lane=>ids(heroes[lane]?.exp_cards));
  }
  if(kind==='FIELD'){
    const heroes=s?.[prefix+'Heroes']||{};
    const list=[];
    for(const lane of LANES){const h=heroes[lane];list.push(...ids(h?.attachments));}
    for(const item of s?.activeAttachments||[])if(item?.side===side)list.push(...ids([item]));
    return list;
  }
  return [];
};
const zoneLosses = (before,after,side) => Object.fromEntries(['HAND','MAIN_DECK','EXP','FIELD'].map(zone=>[
  zone,diff(fromZone(after,side,zone),fromZone(before,side,zone))
]));
function sourceOf(previous,next,side){
  const a=previous?.pvpActionEventsBySide?.[side]||[],b=next?.pvpActionEventsBySide?.[side]||[];
  const idsBefore=new Set(a.map(e=>e?.id));
  const newActions=b.filter(e=>e?.id&&!idsBefore.has(e.id));
  // Continuation choices may commit turns after the source Skill was played.
  // Prefer its exact committed action id over the latest card in the journal.
  const p=previous?.pending||{};
  const candidateIds=[p?.action?.pvp_event_id,p?.continuation?.action?.pvp_event_id,
    p?.direct_source?.pvp_event_id,p?.source_action_id,p?.pvp_event_id].filter(Boolean);
  let hit=b.find(e=>candidateIds.includes(e?.id));
  if(!hit&&newActions.length===1)hit=newActions[0];
  // The headless engine may replace/reorder a committed journal entry with
  // its final result under the SAME action id. A changed top action relative
  // to the before snapshot is still an unambiguous committed transition.
  if(!hit&&b[0]?.id&&a[0]?.id&&b[0].id!==a[0].id)hit=b[0];
  const candidates=[p.source_card_id,p.card_id,p?.action?.card_id,
    p?.continuation?.action?.card_id,p?.direct_source?.card_id].filter(x=>typeof x==='string'&&x.startsWith('S0-'));
  if(!hit&&candidates.length){const matches=b.filter(e=>candidates.includes(e?.card_id));if(matches.length===1)hit=matches[0];}
  if(!hit&&b.length===1)hit=b[0];
  // An ambiguous repeated play is intentionally left unlinked rather than
  // attributing a private discard to an unrelated identical card.
  return hit&&/^S0-/.test(hit.card_id||'')?{card_id:hit.card_id,action_id:hit.id||null}:null;
}
function expHeroLocation(before,after,side,cardId){
  const key=sidePrefix(side)+'Heroes',old=before?.[key]||{},now=after?.[key]||{};
  for(const lane of LANES){const hero=old[lane];if(!ids(hero?.exp_cards).includes(cardId))continue;
    const sameHero=Object.values(now).find(h=>h?.card_id===hero?.card_id);
    if(!sameHero||diff(ids(sameHero.exp_cards),ids(hero.exp_cards)).includes(cardId)){
      return {target_hero_card_id:hero?.card_id||null,target_lane:lane};
    }
  }
  return {target_hero_card_id:null,target_lane:null};
}

export class PvpDiscardPresentationLedger {
  #events=[];
  #seq=0;
  capture(before,after,actorSeat) {
    if(!before||!after||![1,2].includes(actorSeat))return;
    const actor=actorSeat===1?'PLAYER':'AI',victim=actor==='PLAYER'?'AI':'PLAYER';
    const added=diff(ids(before[sidePrefix(victim)+'Discard']),ids(after[sidePrefix(victim)+'Discard']));
    if(!added.length)return;
    const losses=zoneLosses(before,after,victim);
    const remaining=new Map();for(const id of added)remaining.set(id,(remaining.get(id)||0)+1);
    const groups=[];
    for(const zone of ['HAND','MAIN_DECK','EXP','FIELD']){
      const picks=[];
      for(const id of losses[zone]){
        const n=remaining.get(id)||0;if(n<=0)continue;
        remaining.set(id,n-1);picks.push(id);
      }
      if(picks.length){
        if(zone==='EXP'){
          // Split cards by their original public Hero, including multiple Heroes.
          for(const id of picks){const loc=expHeroLocation(before,after,victim,id);
            let group=groups.find(g=>g.origin==='EXP'&&g.target_hero_card_id===loc.target_hero_card_id&&g.target_lane===loc.target_lane);
            if(!group){group={origin:'EXP',target_hero_card_id:loc.target_hero_card_id,target_lane:loc.target_lane,card_ids:[]};groups.push(group);}
            group.card_ids.push(id);
          }
        }else groups.push({origin:zone,card_ids:picks});
      }
    }
    // A resolved opponent removal may involve an intermediate Hand/Deck move
    // in the same server intent. Report a conservative UNKNOWN origin then.
    const unknown=[];for(const [id,count] of remaining)for(let i=0;i<count;i++)unknown.push(id);
    // Cards finalized from a pending played Attack may enter Discard after the
    // other seat presses PASS. They have no Hand/Deck/EXP/Field loss in this
    // transaction and must NOT be advertised as opponent-caused DISCARDED.
    // Unknown-origin transitions are intentionally not published as effects.
    // Their public Discard pile remains visible through ordinary board state.
    const effect=sourceOf(before,after,actor);
    // Avoid creating a misleading 'Opponent Effect' card history when the
    // causal action cannot be tied to a committed card. Explicit effects such
    // as Scouting/Calculated Plan remain linked by exact action id where known.
    if(!effect)return;
    for(const group of groups){
      this.#events.push({id:'PVP-DISCARD-'+(++this.#seq),type:'PVP_OPPONENT_DISCARD',
        side:victim,source_side:actor,effect_card_id:effect?.card_id||null,effect_action_id:effect?.action_id||null,
        origin:group.origin,target_hero_card_id:group.target_hero_card_id||null,
        target_lane:group.target_lane||null,card_ids:group.card_ids.slice(0,40),count:group.card_ids.length,
        timestamp:Date.now(),played_event_order:Number(after.pvpPlayedEventSequence||0)+0.5});
    }
    if(this.#events.length>120)this.#events.splice(0,this.#events.length-120);
  }
  forSeat(seat){
    if(![1,2].includes(seat))throw new Error('Invalid presentation seat.');
    const canonical=seat===1?'PLAYER':'AI';
    return this.#events.filter(e=>e.side===canonical).map(e=>({
      ...e,side:'PLAYER',source_side:'AI',card_ids:[...e.card_ids]
    }));
  }
}
