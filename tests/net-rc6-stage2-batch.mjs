import assert from 'node:assert/strict';
import {join} from 'node:path';
import {Season0HeadlessAuthority} from '../server/headless-rc32.mjs';
import {season0StarterCatalog as decks} from '../server/s0-pregame-catalog.mjs';

// Production S0 engine, both player perspectives, approved S1 Response batch.
const root=join(process.cwd(),'public/battle');
function responseAuthority(attackerSeat){
  for(let trial=0;trial<48;trial++){
    const a=new Season0HeadlessAuthority(root);
    const p1=attackerSeat===1?decks.s0_starter_02_blue_red.deck:decks.s0_starter_01_red_white.deck;
    const p2=attackerSeat===2?decks.s0_starter_02_blue_red.deck:decks.s0_starter_01_red_white.deck;
    a.start({player1Deck:p1,player2Deck:p2});a.completeOpening(attackerSeat===1?2:1,'HEADS');
    try{
      for(let n=0;n<20;n++){
        const s=a._canonicalForServerOnly().appState;
        if(s.turn===(attackerSeat===1?'PLAYER':'AI')&&s.phase==='Battle')break;
        a.applyIntent(s.turn==='PLAYER'?1:2,'advancePhase',[]);
      }
      let st=a._viewForMaskingOnly(attackerSeat).appState;
      if(st.phase!=='Battle')continue;
      const index=st.playerHand.indexOf('S0-MAG-007');if(index<0)continue;
      a.applyIntent(attackerSeat,'beginPlayFromHand',[index]);
      let p=a._viewForMaskingOnly(attackerSeat).appState.pending;
      if(p?.type!=='source_selection'||!p.legal_sources?.length)continue;
      a.applyIntent(attackerSeat,'chooseHeroFromBoard',['PLAYER',p.legal_sources[0]]);
      p=a._viewForMaskingOnly(attackerSeat).appState.pending;
      if(p?.type!=='target_selection'||!p.legal_targets?.length)continue;
      a.applyIntent(attackerSeat,'chooseHeroFromBoard',['AI',p.legal_targets[0]]);
      p=a._viewForMaskingOnly(attackerSeat).appState.pending;
      if(p?.type!=='mana_shard_payment_choice'||!p.selected_shard_uids?.length)continue;
      a.applyIntent(attackerSeat,'commitExactManaPaymentChoice',[p.selected_shard_uids,false,null]);
      const seat=attackerSeat===1?2:1;
      const rw=a._viewForMaskingOnly(seat).appState.responseWindow;
      if(rw?.response_owner==='PLAYER'&&rw.options?.length>0)return {a,seat,trial};
    }catch{}
  }
  throw Error('Could not find a legal Response option for seat '+(attackerSeat===1?2:1));
}
for(const attackerSeat of [1,2]){
  const {a,seat,trial}=responseAuthority(attackerSeat);
  const initial=a._canonicalForServerOnly(),revision=a.revision;
  assert.throws(()=>a.applyIntentBatch(seat,[{name:'advancePhase',args:[]},{name:'advancePhase',args:[]}]),/NOT_ALLOWED/);
  assert.throws(()=>a.applyIntentBatch(seat,[{name:'responseSelectNoStuck',args:[9999]},{name:'confirmSelectedResponse',args:[]}]),/option/i);
  assert.equal(a.revision,revision);
  assert.deepEqual(a._canonicalForServerOnly(),initial,'Rejected batch must leave canonical board untouched');
  const result=a.applyIntentBatch(seat,[{name:'responseSelectNoStuck',args:[0]},{name:'confirmSelectedResponse',args:[]}]);
  assert.equal(result.ok,true);
  assert.equal(a.revision,revision+1,'Two-step response must increment authoritative revision once');
  const after=a._viewForMaskingOnly(seat).appState;
  assert.equal(after.responseWindow?.response_owner==='PLAYER',false,'Finished Response must not still belong to same defender');
  console.log(`PASS atomic Response batch attacker=${attackerSeat}, defender=${seat}, randomTrials=${trial+1}`);
}
