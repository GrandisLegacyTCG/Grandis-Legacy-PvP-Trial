import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { V6913Authority, sourceHashes, internals } from '../server/v6913-authority.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parity=JSON.parse(fs.readFileSync(path.join(root,'release/V379_DONOR_PARITY.json'),'utf8'));
const hashes=sourceHashes();
assert.deepEqual(hashes,parity.authority_source_hashes,'headless authority must execute the exact locked v6.91.3 source files');

const probe=new V6913Authority();
const starterKeys=Object.keys(probe.starters);
assert.equal(starterKeys.length,5,'expected five v6.91.3 starter decks');
for(const name of ['GL_PVP_POPUP_OWNERSHIP_AUDIT_SELF_TEST','GL_PVP_V117_ACTION_SYNC_AUDIT_SELF_TEST']){
  const result=probe.runNativeSelfTest(name);
  assert.equal(result?.ok,true,`${name} must pass under the headless v6.91.3 authority`);
}

function create(firstSeat){
  const a=new V6913Authority();
  a.start({p1:{name:'Seat 1',deckKey:starterKeys[0]},p2:{name:'Seat 2',deckKey:starterKeys[1]}});
  const opening=a.commitOpening({choice:'HEADS',outcome:firstSeat===2?'TAILS':'HEADS',firstSeat});
  const pre=opening.board.appState;
  assert.equal(pre.playerHand.length,6,'seat 1 opening hand must contain six cards before first-turn draw');
  assert.equal(pre.aiHand.length,6,'seat 2 opening hand must contain six cards before first-turn draw');
  assert.equal(pre.playerManaPoolCards.length,3,'seat 1 opening shard pool must contain three shards');
  assert.equal(pre.aiManaPoolCards.length,3,'seat 2 opening shard pool must contain three shards');
  const revBefore=a.revision;
  a.beginFirstTurn(firstSeat);
  assert.equal(a.revision,revBefore+1,'beginFirstTurn must produce exactly one authoritative revision');
  return a;
}

function assertPrivacy(a,seat){
  const v=a.viewForSeat(seat).appState;
  assert.ok(v.playerHand.length>=6,'local hand must remain visible to its owner');
  assert.ok(v.aiHand.length>=6,'opponent hand count must remain represented');
  assert.ok(v.aiHand.every(x=>x===internals.HIDDEN_CARD),'opponent hand identity must be masked');
  assert.ok(v.playerDeck.every(x=>x===internals.HIDDEN_CARD),'own draw-pile order must be masked over the network');
  assert.ok(v.aiDeck.every(x=>x===internals.HIDDEN_CARD),'opponent draw-pile order must be masked over the network');
  const spec=a.viewForSpectator().appState;
  assert.ok(spec.playerHand.every(x=>x===internals.HIDDEN_CARD),'spectator must not see seat 1 hand identity');
  assert.ok(spec.aiHand.every(x=>x===internals.HIDDEN_CARD),'spectator must not see seat 2 hand identity');
}

for(const firstSeat of [1,2]){
  const a=create(firstSeat);
  const actor=a.viewForSeat(firstSeat).appState;
  assert.equal(actor.turn,'PLAYER','current remote human must be localized as v6 PLAYER');
  assert.equal(actor.phase,'Draw','first authoritative turn must enter v6 Draw phase');
  assert.equal(actor.playerHand.length,7,'first player must receive exactly one mandatory Draw before Draw phase interaction');
  assert.equal(actor.playerManaPoolCards.length,4,'first player must receive v6 first-turn shard regen');
  assertPrivacy(a,firstSeat);

  const other=firstSeat===1?2:1;
  let rejected='';
  try{a.applyIntent(other,'advancePhase',[])}catch(e){rejected=String(e?.message||e)}
  assert.ok(rejected,'wrong seat must not be able to advance the active player turn');

  for(const expected of ['Deploy','Battle','Reform']){
    a.applyIntent(firstSeat,'advancePhase',[]);
    assert.equal(a.viewForSeat(firstSeat).appState.phase,expected,`active seat must advance to ${expected}`);
  }
  a.applyIntent(firstSeat,'advancePhase',[]);
  const next=a.viewForSeat(other).appState;
  assert.equal(next.turn,'PLAYER','after Reform the other remote human must become local PLAYER in its viewer orientation');
  assert.equal(next.phase,'Draw','next remote human must enter Draw');

  let paymentError='';
  try{a.applyIntent(other,'commitManaShardPaymentChoice',[])}catch(e){paymentError=String(e?.message||e)}
  assert.ok(paymentError && !/Unknown Local AI runtime intent/i.test(paymentError),'Mana payment commit must be a recognized v6 runtime intent even when no payment is pending');
}

{
  const a=create(1),before=a.revision;
  a.applyIntentBatch(1,[{name:'advancePhase',args:[]}]);
  assert.equal(a.revision,before+1,'an accepted intent batch must commit one authoritative revision');
  assert.equal(a.viewForSeat(1).appState.phase,'Deploy');
}

console.log(JSON.stringify({
  ok:true,
  architecture:'v6.91.3 native headless authority',
  exactAuthoritySources:Object.keys(hashes).length,
  starterDecks:starterKeys.length,
  actorLocalSeatOrientation:true,
  viewerSafePrivacy:true,
  manaCommitRecognized:true,
  nativePvpSelfTests:2
},null,2));
