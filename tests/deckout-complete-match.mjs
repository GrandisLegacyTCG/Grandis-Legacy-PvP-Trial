// Deterministic two-human full-match path: both players pass every phase until
// RC31 triggers mandatory-draw deck-out. No gameplay rules are reimplemented.
import assert from 'node:assert/strict';
import {Season0HeadlessAuthority} from '../server/headless-rc32.mjs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../client');
for(const firstSeat of [1,2]) {
const game=new Season0HeadlessAuthority(root);
game.start({player1DeckKey:game.starterIds[0],player2DeckKey:game.starterIds[1]});
game.completeOpening(firstSeat);
let count=0,seat2Actions=0;
while(!game._canonicalForServerOnly().appState.gameOver && count<800){
  const st=game._canonicalForServerOnly().appState;
  assert.ok(!st.responseWindow,'Unresolved Response while passing turns');
  const seat=st.pending?.decision_side ? (st.pending.decision_side==='AI'?2:1) : (st.turn==='AI'?2:1);
  if(st.pending){
    assert.equal(st.pending.type,'hand_limit_discard','Unexpected mandatory choice while passing');
    if((st.pending.selected||[]).length<Number(st.pending.required)){
      const hand=game._viewForMaskingOnly(seat).appState.playerHand;
      const chosen=new Set(st.pending.selected||[]);
      const next=hand.findIndex((_,index)=>!chosen.has(index));
      assert.ok(next>=0);game.applyIntent(seat,'toggleDiscardIndex',[next]);
    } else game.applyIntent(seat,'handleChoiceConfirm',[]);
    count++;continue;
  }
  if(seat===2)seat2Actions++;
  game.applyIntent(seat,st.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase',[]);
  count++;
}
const final=game._canonicalForServerOnly().appState;
assert.ok(final.gameOver,'A full match must eventually finish by mandatory deck-out');
assert.ok(/deck/i.test(String(final.gameEndReason)),'Expected mandatory deck-out loss: '+final.gameEndReason);
assert.ok(seat2Actions>10,'Player 2 actions must have been processed');
assert.equal(final.winner,firstSeat===1?'AI':'PLAYER','The player who ran out of cards should lose');
assert.ok(String(final.gameEndReason).startsWith((firstSeat===1?'PLAYER':'AI')+' loses'),
 'Winner and end reason must refer to opposite canonical sides (mirroring invariant)');
assert.ok(final.round>=40, 'Round counter must advance across hand-limit discard choices');
console.log('PASS: real RC31 two-human full match finished by mandatory deck-out', {firstSeat,actions:count,round:final.round,winner:final.winner,reason:final.gameEndReason,seat2Actions});
}
