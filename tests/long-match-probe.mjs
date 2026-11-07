import {Season0HeadlessAuthority as E} from '../server/headless-rc32.mjs';
import {resolve} from 'node:path';
const e=new E(resolve('client'));
e.start({player1DeckKey:e.starterIds[0],player2DeckKey:e.starterIds[1]});e.completeOpening(1);
const s=()=>e._canonicalForServerOnly().appState;
const errors=new Map(),metrics={phase:0,play:0,attack:0,response:0,tribute:0,pending:0,rounds:0,steps:0};
function action(seat,name,args=[]){try{e.applyIntent(seat,name,args);return true}catch(err){const k=name+': '+err.message;errors.set(k,(errors.get(k)||0)+1);return false}}
function owner(){const st=s();return st.turn==='AI'?2:1}
let lastTurn='',tried=new Set();
for(let j=0;j<700;j++){
 const st=s();metrics.steps++;
 if(st.gameOver){console.log('GAME_OVER',st.winner,st.gameEndReason,st.round);break}
 const localOwner=owner();
 if(st.responseWindow){metrics.attack++;const resp=st.responseWindow.response_owner==='AI'?2:1;if(action(resp,'responsePassNoStuck'))metrics.response++;else{console.log('STUCK_RESPONSE',st.responseWindow.kind,st.responseWindow.response_owner);break}continue}
 if(st.pending){
  metrics.pending++;
  const p=st.pending,seat=(p.decision_side||p.side||p.source_side)==='AI'?2:1;
  const view=e._viewForMaskingOnly(seat).appState.pending;
  let name,args=[];
  switch(p.type){
   case 'source_selection':if(!(view.legal_sources||[]).length)name='cancelPendingAction';else{name='chooseHeroFromBoard';args=['PLAYER',view.legal_sources[0]]}break;
   case 'target_selection':case 'tribute_target':if(!(view.legal_targets||[]).length)name='cancelPendingAction';else{name='chooseHeroFromBoard';args=[view.target_side||'PLAYER',view.legal_targets[0]]}break;
   case 'mana_shard_payment_choice':name='commitManaShardPaymentChoice';break;
   case 'response_window':name='responsePassNoStuck';break;
   case 'hand_limit_discard': if((view.selected||[]).length>=Number(view.required||0))name='handleChoiceConfirm';else{name='toggleDiscardIndex';args=[0]}break;
   case 'optional_magical_surge':name='commitMagicalSurgeChoice';args=[false];break;
   case 'draw_replacement_choice':name='commitDrawReplacementChoice';args=[false];break;
   case 's0_bard_draw_choice':name='commitS0BardDrawChoice';args=[true];break;
   case 'opponent_mana_selection': if((view.selected_indices||[]).length>=Number(view.required_count||1))name='commitOpponentManaSelection';else {name='selectOpponentManaChoice';args=[0]}break;
   case 'opponent_hand_choice':name='selectOpponentHandChoice';args=[0];break;
   case 'status_removal_choice':name='selectStatusRemovalChoice';args=[0];break;
   case 'saint_purify_choice':name='selectSaintPurifyChoice';args=[0];break;
   case 'legacy_defeat_choice':if(typeof view.selected_index==='number')name='handleChoiceConfirm';else {name='selectLegacyDefeatChoice';args=[0]}break;
   case 'racial_stoneblood':name='resolveStonebloodChoice';args=[false];break;
   case 'legacy_card_choice':name='selectLegacyCardChoice';args=[0];break;
   case 'card_search_choice':name='selectCardSearchChoice';args=[0];break;
   default:console.log('STUCK_UNKNOWN_PENDING',p.type,JSON.stringify(view).slice(0,800),'round',st.round);j=6000;continue;
  }
  if(!action(seat,name,args)){
    if(name==='selectCardSearchChoice'||name==='selectOpponentHandChoice'||name==='selectLegacyCardChoice'||name==='selectStatusRemovalChoice'){
      if(action(seat,'handleChoiceConfirm'))continue;
    }
    console.log('STUCK_PENDING',p.type,name,args, 'round',st.round,'phase',st.phase,'PENDING',JSON.stringify(p).slice(0,1300),'VIEW',JSON.stringify(view).slice(0,1300));break;
  }
  continue;
 }
 if(st.phase==='Reform'&&!st.tributeUsedThisReform){
  const hand=e._viewForMaskingOnly(localOwner).appState.playerHand;
  let played=false;
  for(let i=0;i<hand.length;i++){if(action(localOwner,'beginTributeFromHand',[i])){played=true;metrics.tribute++;break}}
  if(played)continue;
 }
 if(st.phase==='Battle'){
  const hand=e._viewForMaskingOnly(localOwner).appState.playerHand;
  let played=false;
  const tries=tried;
  for(let i=0;i<hand.length;i++){
    const key=String(st.turn)+'|'+String(st.round)+'|'+String(i)+'|'+String(hand[i]);if(tries.has(key))continue;
    tries.add(key);
    if(action(localOwner,'beginPlayFromHand',[i])){played=true;metrics.play++;break}
  }
  if(played)continue;
 }
 const prev={phase:st.phase,turn:st.turn,round:st.round};
 const na=st.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase';
 if(!action(localOwner,na)){console.log('STUCK_ADVANCE',prev,na);break}
 metrics.phase++;
 if(s().round>prev.round)metrics.rounds++;
}
console.log('METRICS',metrics,'final', {round:s().round,turn:s().turn,phase:s().phase,gameOver:s().gameOver,hand1:s().playerHand.length,hand2:s().aiHand.length,hp1:Object.values(s().playerHeroes||{}).map(x=>x.hp),hp2:Object.values(s().aiHeroes||{}).map(x=>x.hp)});console.log('ERRORS', [...errors.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10));
