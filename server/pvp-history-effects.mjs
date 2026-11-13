/**
 * RC7 player-facing Card Played effects. Operates ONLY on an already
 * recipient-masked board and its already recipient-only presentation events.
 * Do not call on canonical state. Never add a discard identity to a public
 * event for the other player or to a spectator projection.
 */
const cardId=id=>typeof id==='string'&&/^S0-[A-Z0-9]+-[A-Z0-9]+$/.test(id);
const finite=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(10000,Number(n))):0;
const text=v=>String(v??'').slice(0,120);
const normalize=v=>text(v).toLowerCase().replace(/\s+/g,' ').trim();
// Strict action correlation: a repeated copy of the same card must never
// receive another action's private card identity. No last-card guess.
const actionFor=(journal,actor,note)=>{
  const list=journal[actor]||[];
  if(note.effect_action_id){return list.find(e=>e.id===note.effect_action_id)||null;}
  if(note.effect_card_id){const hits=list.filter(e=>e.card_id===note.effect_card_id);return hits.length===1?hits[0]:null;}
  const title=normalize(note.effect_name);
  if(!title)return null;
  const hits=list.filter(e=>normalize(e.title)===title);return hits.length===1?hits[0]:null;
};
export function annotatePlayerHistoryEffects(board) {
  const st=board?.appState;
  if(!st||board.pvpRecipientSeat===undefined||board.pvpRecipientSeat===null)return board;
  const journal=st.pvpActionEventsBySide||{},timeline=st.presentationEvents||[];
  const add=(action,datum)=>{
    if(!action)return;
    if(!Array.isArray(action.effect_results))action.effect_results=[];
    if(!action.effect_results.some(x=>x.id===datum.id))action.effect_results.push(datum);
  };
  for(const note of timeline){
    if(!note?.id)continue;
    if(note.type==='PVP_COMBAT_RESOLVED'&&note.attack_event_id){
      const side=note.source_side==='AI'?'AI':'PLAYER';
      const action=(journal[side]||[]).find(e=>e.id===note.attack_event_id);
      if(action&&action.label==='ATK'){
        if(!Array.isArray(action.status_by_hero))action.status_by_hero=[];
        for(const target of note.targets||[]){
          const heroName=cardId(target.target_hero_card_id)?target.target_hero_card_id:null;
          for(const change of target.status_changes||[]){
            if(!['Poison','Burn','Bleed','Freeze','Stun','Sleep'].includes(change.status))continue;
            const entry={name:heroName||'Hero',side:target.side,lane:target.lane,status:change.status,
              before:Math.max(0,Math.min(6,Math.trunc(Number(change.before)||0))),
              after:Math.max(0,Math.min(6,Math.trunc(Number(change.after)||0)))};
            if(!action.status_by_hero.some(x=>x.side===entry.side&&x.lane===entry.lane&&x.status===entry.status&&x.after===entry.after))
              action.status_by_hero.push(entry);
          }
        }
      }
      continue;
    }
    if(note.side!=='PLAYER')continue;
    if(note.type==='PVP_OPPONENT_DISCARD'){
      const cards=(Array.isArray(note.card_ids)?note.card_ids:[]).filter(cardId).slice(0,40);
      if(!cards.length)continue;
      const action=actionFor(journal,'AI',note);
      add(action,{id:note.id,kind:'DISCARD',origin:['HAND','MAIN_DECK','EXP','FIELD'].includes(note.origin)?note.origin:'UNKNOWN',
        target_hero_card_id:cardId(note.target_hero_card_id)?note.target_hero_card_id:null,
        count:finite(note.count)||cards.length,card_ids:cards});
    }else if(note.type==='MANA_LOSS_COMMITTED'&&finite(note.removed_count)>0){
      const actor=note.source_side==='PLAYER'?'PLAYER':'AI';
      const action=actionFor(journal,actor,note);
      const shards=(Array.isArray(note.removed_shards)?note.removed_shards:[]).slice(0,12).map(sh=>({
        kind:sh?.kind==='CLASS'?'CLASS':'MANA',
        class_name:sh?.kind==='CLASS'?text(sh.class_name).slice(0,30):''
      }));
      add(action,{id:note.id,kind:'MANA_REMOVAL',count:finite(note.removed_count),removed_shards:shards});
    }
  }
  return board;
}
/** Spectator clones a seat 1 projection: remove every recipient-only field. */
export function stripPrivateHistoryEffectsForSpectator(board) {
  const st=board?.appState||{};
  const journal=st.pvpActionEventsBySide||{};
  // server.js clones via JSON, so these legacy aliases are distinct arrays,
  // not guaranteed to share the same object identities with the journal.
  for(const events of [journal.PLAYER,journal.AI,st.playerPlayedEvents,st.opponentPlayedEvents,st.aiPlayedEvents])
    for(const event of events||[])delete event.effect_results;
  return board;
}
