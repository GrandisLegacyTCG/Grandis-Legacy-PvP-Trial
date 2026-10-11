import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { V6914Authority, sourceHashes, internals } from '../server/v6914-authority.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parity=JSON.parse(fs.readFileSync(path.join(root,'release/V380_DONOR_PARITY.json'),'utf8'));
const hashes=sourceHashes();
assert.deepEqual(hashes,parity.authority_source_hashes,'headless authority must execute the exact locked v6.91.4 source files');

const probe=new V6914Authority();
const starterKeys=Object.keys(probe.starters);
assert.equal(starterKeys.length,5,'expected five v6.91.4 starter decks');
for(const name of ['GL_PVP_POPUP_OWNERSHIP_AUDIT_SELF_TEST','GL_PVP_V117_ACTION_SYNC_AUDIT_SELF_TEST']){
  const result=probe.runNativeSelfTest(name);
  assert.equal(result?.ok,true,`${name} must pass under the headless v6.91.4 authority`);
}

function create(firstSeat){
  const a=new V6914Authority();
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

function assertHiddenShardPool(pool,label){
  assert.ok(Array.isArray(pool),`${label} must remain represented as an array`);
  for(const sh of pool){
    assert.equal(sh?.hidden_identity,true,`${label} must mask shard identity`);
    assert.equal(sh?.card_back,true,`${label} must expose only a card back`);
    assert.equal(Object.hasOwn(sh||{},'kind'),false,`${label} must not leak shard kind`);
    assert.equal(Object.hasOwn(sh||{},'class_name'),false,`${label} must not leak shard class`);
  }
}

function assertPrivacy(a,seat){
  const v=a.viewForSeat(seat).appState;
  assert.ok(v.playerHand.length>=6,'local hand must remain visible to its owner');
  assert.ok(v.aiHand.length>=6,'opponent hand count must remain represented');
  assert.ok(v.aiHand.every(x=>x===internals.HIDDEN_CARD),'opponent hand identity must be masked');
  assert.ok(v.playerDeck.every(x=>x===internals.HIDDEN_CARD),'own draw-pile order must be masked over the network');
  assert.ok(v.aiDeck.every(x=>x===internals.HIDDEN_CARD),'opponent draw-pile order must be masked over the network');
  assertHiddenShardPool(v.aiManaPoolCards,'opponent shard pool');
  assert.ok(!(v.log||[]).some(x=>/^Shard Deck: /i.test(String(x))), 'viewer logs must not disclose either seat orientation of Class-Shard composition');
  for(const pkg of v.aiLegacyPackageSlots||[]){
    assert.equal(pkg?.hidden_identity,true,'opponent Legacy package metadata must be masked');
    for(const forbidden of ['progression','legacy','lineage','package_name'])assert.equal(Object.hasOwn(pkg||{},forbidden),false,`opponent Legacy package must not expose ${forbidden}`);
  }
  for(const e of v.presentationEvents||[]){
    if(e?.type==='CARD_DRAWN'&&e?.side==='AI')assert.equal(e.card_id,internals.HIDDEN_CARD,'opponent presentation draw must never leak card identity');
  }
  if(v.lastActualDrawEvent?.side==='AI')assert.equal(v.lastActualDrawEvent.card_id,internals.HIDDEN_CARD,'opponent lastActualDrawEvent must be masked');

  const spec=a.viewForSpectator().appState;
  assert.ok(spec.playerHand.every(x=>x===internals.HIDDEN_CARD),'spectator must not see seat 1 hand identity');
  assert.ok(spec.aiHand.every(x=>x===internals.HIDDEN_CARD),'spectator must not see seat 2 hand identity');
  assertHiddenShardPool(spec.playerManaPoolCards,'spectator seat 1 shard pool');
  assertHiddenShardPool(spec.aiManaPoolCards,'spectator seat 2 shard pool');
  for(const pkg of [...(spec.playerLegacyPackageSlots||[]),...(spec.aiLegacyPackageSlots||[])]){
    assert.equal(pkg?.hidden_identity,true,'spectator must not receive Legacy package identities');
    assert.equal(Object.hasOwn(pkg||{},'legacy'),false,'spectator Legacy package must not expose Legacy card id');
  }
}

for(const firstSeat of [1,2]){
  const a=create(firstSeat);
  const canonical=a.canonical.appState;
  assert.equal(canonical.playerManaPoolCards.length,firstSeat===1?4:3,'canonical seat 1 shard ownership must remain attached to seat 1');
  assert.equal(canonical.aiManaPoolCards.length,firstSeat===2?4:3,'canonical seat 2 shard ownership must remain attached to seat 2');

  const actor=a.viewForSeat(firstSeat).appState;
  assert.equal(actor.turn,'PLAYER','current remote human must be localized as v6 PLAYER');
  assert.equal(actor.phase,'Draw','first authoritative turn must enter v6 Draw phase');
  assert.equal(actor.playerHand.length,7,'first player must receive exactly one mandatory Draw before Draw phase interaction');
  assert.equal(actor.playerManaPoolCards.length,4,'first player must receive v6 first-turn shard regen');
  if(firstSeat===2){
    assert.deepEqual(actor.playerManaPoolCards.map(x=>x.uid),canonical.aiManaPoolCards.map(x=>x.uid),'seat 2 local shard pool must be canonical seat 2 shard pool, not seat 1 pool');
  }
  assertPrivacy(a,firstSeat);

  const other=firstSeat===1?2:1;
  const opponentView=a.viewForSeat(other).appState;
  assert.equal(opponentView.lastActualDrawEvent?.side,'AI','the other viewer must see the active player draw as opponent-side metadata');
  assert.equal(opponentView.lastActualDrawEvent?.card_id,internals.HIDDEN_CARD,'mandatory Draw card identity must not leak through lastActualDrawEvent');

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

{
  const sample={
    turn:'PLAYER',mana:1,aiMana:2,manaRegen:3,aiManaRegen:4,racial:1,aiRacial:2,
    playerManaPoolCards:[{uid:'P',kind:'MANA'}],aiManaPoolCards:[{uid:'A',kind:'CLASS',class_name:'Mage'}],
    playerManaDeck:[{uid:'PD'}],aiManaDeck:[{uid:'AD'}],playerManaClasses:['Warrior'],aiManaClasses:['Mage'],
    playerManaDeckCount:10,aiManaDeckCount:11,
    manualRepositionUsedTurnKey:{PLAYER:'p-turn',AI:'a-turn'},
    pvpPlayerNames:{PLAYER:'P1',AI:'P2'},presentationEvents:[{type:'CARD_DRAWN',side:'PLAYER',card_id:'X'}]
  };
  assert.deepEqual(internals.mirrorSeatState(internals.mirrorSeatState(sample)),sample,'seat mirror must be an involution across shard state, side maps, and presentation metadata');
  const once=internals.mirrorSeatState(sample);
  assert.equal(once.playerManaPoolCards[0].uid,'A','seat mirror must swap shard pools');
  assert.equal(once.manualRepositionUsedTurnKey.PLAYER,'a-turn','seat mirror must swap manual Reposition per-side limit state');
}


{
  const blind={type:'opponent_hand_choice',decision_side:'PLAYER',reveal_cards:false,candidates:[{hand_index:4,card_id:'S1-MAG-001'},{hand_index:1,card_id:'S1-WAR-001'}]};
  const safe=internals.maskPending(blind,'PLAYER');
  assert.equal(safe.candidates.length,2,'blind opponent hand choices must preserve option count');
  for(const c of safe.candidates){
    assert.equal(c.card_id,internals.HIDDEN_CARD,'blind opponent hand choice must hide card identity');
    assert.equal(Object.hasOwn(c,'hand_index'),false,'blind opponent hand choice must not reveal canonical hand-index mapping');
    assert.equal(c.hidden_identity,true,'blind opponent hand option must be explicitly marked hidden');
  }
}

{
  const board={appState:{
    playerHand:['OWN'],aiHand:['OPP'],playerDeck:['A'],aiDeck:['B'],playerLegacy:[],aiLegacy:[],playerManaDeck:[],aiManaDeck:[],
    playerManaPoolCards:[{uid:'OWN-1',kind:'MANA'}],aiManaPoolCards:[{uid:'REAL-UID',kind:'CLASS',class_name:'Mage'}],
    pending:{type:'opponent_mana_selection',decision_side:'PLAYER',candidates:[{uid:'REAL-UID',kind:'CLASS',class_name:'Mage'}]},
    presentationEvents:[]
  }};
  const safe=internals.viewerSafeLocalBoard(board,{spectator:false}).appState;
  assertHiddenShardPool(safe.aiManaPoolCards,'synthetic opponent shard pool');
  assert.equal(safe.pending.candidates[0].uid,'hidden-choice-0','blind opponent Shard choice must use an uncorrelatable client token');
  assert.equal(Object.hasOwn(safe.pending.candidates[0],'kind'),false,'blind opponent Shard candidate must not leak kind');
  assert.equal(Object.hasOwn(safe.pending.candidates[0],'class_name'),false,'blind opponent Shard candidate must not leak class');
}


{
  const board={appState:{
    playerHand:['OWN'],aiHand:['SECRET-CARD'],playerDeck:[],aiDeck:[],playerLegacy:[],aiLegacy:[],playerManaDeck:[],aiManaDeck:[],
    playerManaPoolCards:[],aiManaPoolCards:[{uid:'AI-SHARD-1',kind:'CLASS',class_name:'Mage'}],aiManaClasses:['Mage','Cleric'],
    pending:{type:'draw_replacement_choice',side:'AI',decision_side:'AI',source_side:'AI',drawn_card_id:'S1-ARC-002',hand_index:0,abilityName:'Quick Reload',shard_choices:[{uid:'REAL',kind:'CLASS',class_name:'Mage'}],selected_order:['S1-WAR-001']},
    log:[
      'Quick Reload offers draw review for Ambush Shot.',
      'Choose acting Hero for Power Slash.',
      'Quick Reload keeps Ambush Shot.',
      'Quick Reload returns Ambush Shot to Main Deck, shuffles, then redraws.',
      'Crystal Ball returns top 3 card(s) in chosen order: Ambush Shot → Power Slash → Hidden Bolt.',
      'Crystal Ball looks at top 3 card(s): Ambush Shot, Power Slash, Hidden Bolt. Order preserved.',
      'Hidden Archives adds Ambush Shot to hand and shuffles the Main Deck under the hidden-information rule.',
      'Card play rollback restored Ambush Shot to Hand after a resolver failure: test.',
      'Relentless Leveling cannot add Ambush Shot as EXP because Draxen would exceed the 700 EXP max.',
      'Shard Deck: PLAYER Warrior/Archer; AI Mage/Cleric. Each Shard Deck starts at 12 cards. After setup.',
      'AI draws 1 card.'
    ],presentationEvents:[]
  }};
  const safe=internals.viewerSafeLocalBoard(board,{spectator:false,cardNames:{'S1-ARC-002':'Ambush Shot','S1-WAR-001':'Power Slash'}}).appState;
  assert.equal(safe.pending.type,'draw_replacement_choice','opponent pending type may remain as public wait-state metadata');
  assert.equal(safe.pending.private_masked,true,'opponent pending payload must be marked masked');
  for(const forbidden of ['drawn_card_id','hand_index','abilityName','shard_choices','selected_order'])assert.equal(Object.hasOwn(safe.pending,forbidden),false,`${forbidden} must not cross the opponent privacy boundary`);
  assert.deepEqual(safe.aiManaClasses,[],'opponent Shard class inventory must not be exposed');
  assert.ok(!JSON.stringify(safe.log).includes('Ambush Shot'),'private draw-review card name must not leak through logs');
  assert.ok(!JSON.stringify(safe.log).includes('Power Slash'),'pre-commit action card name must not leak through logs');
  assert.ok(!JSON.stringify(safe.log).includes('Hidden Bolt'),'Crystal Ball private deck-order names must not persist in viewer logs');
  assert.ok(!JSON.stringify(safe.log).includes('Hidden Archives adds Ambush Shot'),'Legacy deck-search result must not expose the searched card name');
  assert.ok(safe.log.some(x=>/Hidden Archives adds a searched card to hand/i.test(x)),'Legacy deck-search log should retain the public ability while hiding the private card identity');
  assert.ok(safe.log.some(x=>/rollback restored the attempted card to Hand/i.test(x)),'failed pre-commit card rollback must not expose the private Hand card');
  assert.ok(safe.log.some(x=>/cannot add the chosen Hand card as EXP/i.test(x)),'failed Hand-to-EXP choice must not expose a card that returned to Hand');
  assert.ok(!JSON.stringify(safe.log).includes('Mage/Cleric'),'opponent Class-Shard composition must not leak through the initialization log');
  assert.ok(safe.log.some(x=>/reviewed Draw is kept/i.test(x)),'post-decision Draw Review log must be neutralized rather than expose the card name');
  assert.ok(safe.log.some(x=>/inspected cards.*chosen order/i.test(x)),'Crystal Ball chosen-order log must be neutralized');
  assert.ok(safe.log.some(x=>/AI draws 1 card/.test(x)),'non-private public log lines should remain available');

  const spec=internals.viewerSafeLocalBoard(board,{spectator:true,cardNames:{'S1-ARC-002':'Ambush Shot'}}).appState;
  assert.equal(spec.pending.private_masked,true,'spectator pending state must always be projected');
  assert.equal(Object.hasOwn(spec.pending,'drawn_card_id'),false,'spectator must not receive private pending card identity');
}

{
  const log=Array.from({length:30},(_,i)=>i===0?'NEWEST PUBLIC EVENT':`older-${i}`);
  const safe=internals.sanitizeViewerLogs(log,{localSide:'PLAYER'});
  assert.equal(safe.length,30,'viewer log projection must preserve the full Battle Log history');
  assert.equal(safe[0],'NEWEST PUBLIC EVENT','viewer log projection must preserve newest-first donor ordering');
  assert.equal(safe[29],'older-29','viewer log projection must not silently truncate older public Battle Log entries');
}


{
  const opening={firstSeat:1,handEvents:[],manaEvents:[
    {type:'MANA_DRAWN',id:'M1',side:'PLAYER',uid:'REAL-P',group_index:0,asset:'https://example.invalid/shards/Mage.webp'},
    {type:'MANA_DRAWN',id:'M2',side:'AI',uid:'REAL-A',group_index:0,asset:'https://example.invalid/shards/Cleric.webp'}
  ]};
  const seat1=internals.localizeOpening(opening,1);
  assert.equal(seat1.manaEvents[0].uid,'REAL-P','local opening Shard may retain its own identity');
  assert.equal(seat1.manaEvents[0].asset,'assets/shards/Mage.webp','local opening Shard art must resolve from the package');
  assert.equal(seat1.manaEvents[1].uid,'hidden-opening-shard-1','opponent opening Shard UID must be synthetic');
  assert.equal(seat1.manaEvents[1].asset,'assets/ui/back-shard.webp','opponent opening Shard must render card back');
  assert.equal(seat1.manaEvents[1].hidden_identity,true,'opponent opening Shard must be marked hidden');
  assert.equal(Object.hasOwn(seat1.manaEvents[1],'class_name'),false,'opponent opening event must not leak class');

  const seat2=internals.localizeOpening(opening,2);
  assert.equal(seat2.manaEvents[0].side,'AI','seat 1 event must become opponent-side for seat 2');
  assert.match(seat2.manaEvents[0].uid,/^hidden-opening-shard-/,'seat 2 must not receive seat 1 opening Shard UID');
  assert.equal(seat2.manaEvents[1].side,'PLAYER','seat 2 own opening Shard must localize to PLAYER');
  assert.equal(seat2.manaEvents[1].uid,'REAL-A','seat 2 may retain its own opening Shard UID');
}



{
  for(const surrenderSeat of [1,2]){
    const a=create(1);
    a.applyIntent(surrenderSeat,'executeConfirmedSurrender',[]);
    assert.equal(a.canonical.appState.gameOver,true,`seat ${surrenderSeat} surrender must end the authoritative match`);
    const surrenderView=a.viewForSeat(surrenderSeat).appState;
    assert.equal(surrenderView.gameOver,true,'surrendering client must receive the finished game state');
    assert.equal(surrenderView.winner,'AI','surrendering client must see the opponent as winner in actor-local orientation');
  }
}


{
  const base=structuredClone(probe.starters[starterKeys[0]].deck);
  let total=(base.main_deck||[]).reduce((n,x)=>n+Number(x.quantity||1),0);
  for(let i=base.main_deck.length-1;i>=0&&total>50;i--){
    const q=Number(base.main_deck[i].quantity||1),take=Math.min(q,total-50);
    base.main_deck[i].quantity=q-take;total-=take;if(base.main_deck[i].quantity<=0)base.main_deck.splice(i,1);
  }
  assert.equal(total,50,'test fixture must contain exactly 50 Main Deck cards');
  const a=new V6914Authority();
  assert.doesNotThrow(()=>a.start({p1:{name:'50 Card Custom',customDeck:base},p2:{name:'Starter',deckKey:starterKeys[1]}}),'existing 50-card Custom Deck acceptance is a locked PvP requirement and must remain unchanged');
  assert.equal(a.canonical.appState.playerDeck.length,50,'50-card Custom Deck must enter the match as 50 cards');
}

console.log(JSON.stringify({
  ok:true,
  architecture:'v6.91.4 native headless authority',
  exactAuthoritySources:Object.keys(hashes).length,
  starterDecks:starterKeys.length,
  actorLocalSeatOrientation:true,
  shardOwnershipSeat2:true,
  viewerSafePrivacy:true,
  legacyPackagePrivacy:true,
  drawMetadataPrivacy:true,
  blindShardPrivacy:true,
  blindHandMappingPrivacy:true,
  nestedPendingPrivacy:true,
  openingShardEventPrivacy:true,
  privateLogPrivacy:true,
  postPendingHiddenZoneLogPrivacy:true,
  battleLogOrderAndHistoryPreserved:true,
  mirrorInvolution:true,
  surrenderAuthority:true,
  customDeck50Accepted:true,
  manaCommitRecognized:true,
  nativePvpSelfTests:2
},null,2));
