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
  if(kind==='FIELD'){
    const heroes=s?.[prefix+'Heroes']||{};
    const list=[];
    for(const lane of LANES){const h=heroes[lane];list.push(...ids(h?.exp_cards),...ids(h?.attachments));}
    for(const item of s?.activeAttachments||[])if(item?.side===side)list.push(...ids([item]));
    return list;
  }
  return [];
};
const zoneLosses = (before,after,side) => Object.fromEntries(['HAND','MAIN_DECK','FIELD'].map(zone=>[
  zone,diff(fromZone(after,side,zone),fromZone(before,side,zone))
]));
function sourceOf(previous,next,side){
  const a=(previous?.pvpActionEventsBySide?.[side]||[]),b=(next?.pvpActionEventsBySide?.[side]||[]);
  const previousIds=new Set(a.map(e=>e?.id));
  const first=b.find(e=>e?.id&&!previousIds.has(e.id))||b[0];
  return first&&/^S0-/.test(first.card_id||'')?first.card_id:null;
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
    for(const zone of ['HAND','MAIN_DECK','FIELD']){
      const picks=[];
      for(const id of losses[zone]){
        const n=remaining.get(id)||0;if(n<=0)continue;
        remaining.set(id,n-1);picks.push(id);
      }
      if(picks.length)groups.push({origin:zone,card_ids:picks});
    }
    // A resolved opponent removal may involve an intermediate Hand/Deck move
    // in the same server intent. Report a conservative UNKNOWN origin then.
    const unknown=[];for(const [id,count] of remaining)for(let i=0;i<count;i++)unknown.push(id);
    if(unknown.length)groups.push({origin:'UNKNOWN',card_ids:unknown});
    const effect=sourceOf(before,after,actor);
    for(const group of groups){
      this.#events.push({id:'PVP-DISCARD-'+(++this.#seq),type:'PVP_OPPONENT_DISCARD',
        side:victim,source_side:actor,effect_card_id:effect,
        origin:group.origin,card_ids:group.card_ids.slice(0,40),count:group.card_ids.length});
    }
    if(this.#events.length>60)this.#events.splice(0,this.#events.length-60);
  }
  forSeat(seat){
    if(![1,2].includes(seat))throw new Error('Invalid presentation seat.');
    const canonical=seat===1?'PLAYER':'AI';
    return this.#events.filter(e=>e.side===canonical).map(e=>({
      ...e,side:'PLAYER',source_side:'AI',card_ids:[...e.card_ids]
    }));
  }
}
