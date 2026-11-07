import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {Season0HeadlessAuthority} from '../server/headless-rc32.mjs';
import {viewerSafeBoard,assertViewerSafeBoard,makeBlindChoices} from '../server/viewer-safe.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../client');
const secret=Buffer.alloc(32,12);
const engine=new Season0HeadlessAuthority(root);
engine.start({player1DeckKey:engine.starterIds[0],player2DeckKey:engine.starterIds[1]});
engine.completeOpening(2);
for (let seat=1;seat<=2;seat++) {
  const mine=seat===1?'player':'ai', opponent=seat===1?'ai':'player';
  const canonical=engine._canonicalForServerOnly().appState;
  const view=viewerSafeBoard(engine._viewForMaskingOnly(seat),{seat,revision:engine.revision,secret});
  assertViewerSafeBoard(view);
  const st=view.appState;
  const text=JSON.stringify({...view,appState:{...st,playerHand:[]}});
  assert.equal(st.playerHand.length,canonical[`${mine}Hand`].length);
  assert.equal(st.aiHand.length,canonical[`${opponent}Hand`].length);
  assert.equal(st.playerManaPoolCards.length,canonical[`${mine}ManaPoolCards`].length);
  assert.equal(st.aiManaPoolCards.length,canonical[`${opponent}ManaPoolCards`].length);
  // Card IDs are shared across decks, so a card in the opponent's private
  // hand can legitimately also appear in our own public/visible cards.
  // Test private FIELD projection rather than searching whole serialized JSON.
  assert.ok(st.aiHand.every(x=>x==='__HIDDEN_CARD_BACK__'),'Private opponent Hand leaked');
  assert.ok(st.presentationEvents.every(e=>e.type!=='CARD_DRAWN'||e.side!=='AI'||!('card_id' in e)),'Private opponent Draw event leaked');
  for(const sh of canonical[`${opponent}ManaPoolCards`]) assert.ok(!text.includes(sh.uid),`Opponent Mana UID leaked: ${sh.uid}`);
  assert.ok(st.playerDeck.every(x=>x==='__HIDDEN_CARD_BACK__'),'Main Deck order leaked');
  assert.ok(st.aiManaPoolCards.every(x=>x.hidden===true));
  assert.ok(st.presentationEvents.filter(x=>x.side==='AI'&&x.type==='CARD_DRAWN').every(x=>!('card_id' in x)));
  console.log('PASS: seat',seat,'sees own hand/pool and opponent counts without opponent cards, class shards, UIDs or private future progression.');
}
const original=engine._viewForMaskingOnly(1);
const unowned=structuredClone(original);unowned.appState.pending={type:'example_private_unknown',candidates:['S0-CLE-031']};
const masked=viewerSafeBoard(unowned,{seat:1,revision:engine.revision,secret});
assert.equal(masked.appState.pending.private_masked,true);assert.equal(masked.appState.pending.candidates,undefined);
const sample=structuredClone(original);
sample.appState.pending={type:'opponent_mana_selection',decision_side:'PLAYER',candidates:sample.appState.aiManaPoolCards.map(x=>({uid:x.uid})),selected_indices:[],required_count:1,target_side:'AI'};
const mapped=makeBlindChoices(sample.appState,2,secret,1);
const projected=viewerSafeBoard(sample,{seat:1,revision:2,secret});
assert.equal(mapped.size,sample.appState.aiManaPoolCards.length);
assert.deepEqual(projected.appState.pending.candidates.map(c=>c.choice_handle),[...mapped.keys()]);
assert.ok([...mapped.keys()].every(k=>!JSON.stringify(sample.appState.aiManaPoolCards).includes(k)));
assertViewerSafeBoard(projected);
for(let i=0;i<12;i++){
  const st=engine._canonicalForServerOnly().appState;
  if(st.gameOver||st.pending)break;
  const seat=st.turn==='AI'?2:1;
  const before=engine.revision;
  engine.applyIntent(seat,st.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase',[]);
  assert.equal(engine.revision,before+1);
  assertViewerSafeBoard(viewerSafeBoard(engine._viewForMaskingOnly(1),{seat:1,revision:engine.revision,secret}));
  assertViewerSafeBoard(viewerSafeBoard(engine._viewForMaskingOnly(2),{seat:2,revision:engine.revision,secret}));
}
const st=engine._canonicalForServerOnly().appState;
assert.ok(st.round>=2,'Round transition incomplete');
const legalSeat=st.turn==='AI'?2:1;
for(const action of ['beginActivatedHeroAbility','beginActivatedLegacyAbility','beginActivatedRacialAbility']) {
  assert.throws(()=>engine.applyIntent(legalSeat,action,['AI','LEFT','invalid']),/Cannot activate an opponent/);
}

const loser=st.turn==='AI'?1:2;
engine.forfeit(loser);
assert.equal(engine._canonicalForServerOnly().appState.gameOver,true);
assert.equal(engine._canonicalForServerOnly().appState.winner,loser===1?'AI':'PLAYER');
console.log('PASS: unknown-pending masking, blind Mana handles, 12 alternating phase actions, round transitions and off-turn surrender.');
