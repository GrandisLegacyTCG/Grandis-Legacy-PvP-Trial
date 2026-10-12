import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { V6916Authority, sourceHashes, internals } from '../server/v6916-authority.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parity=JSON.parse(fs.readFileSync(path.join(root,'release/V380_DONOR_PARITY.json'),'utf8'));
const hashes=sourceHashes();
assert.deepEqual(hashes,parity.authority_source_hashes,'headless authority must execute the locked PvP v3.80.12 source set with the v6.91.6 donor baseline, explicit PvP DOM guard, and narrow final-Shard-UID payment seam');

const probe=new V6916Authority();
const starterKeys=Object.keys(probe.starters);
assert.equal(starterKeys.length,5,'expected five v6.91.6 starter decks');
for(const name of ['GL_PVP_POPUP_OWNERSHIP_AUDIT_SELF_TEST','GL_PVP_V117_ACTION_SYNC_AUDIT_SELF_TEST','GL_LAB_V07_PAYMENT_RACIAL_QA_SELF_TEST']){
  const result=probe.runNativeSelfTest(name);
  assert.equal(result?.ok,true,`${name} must pass under the headless v6.91.6 authority`);
}

function create(firstSeat){
  const a=new V6916Authority();
  a.start({p1:{name:'Seat 1',deckKey:starterKeys[0]},p2:{name:'Seat 2',deckKey:starterKeys[1]}});
  const opening=a.commitOpening({choice:'HEADS',outcome:firstSeat===2?'TAILS':'HEADS',firstSeat});
  const pre=opening.board.appState;
  assert.equal(pre.playerHand.length,6,'seat 1 opening hand must contain six cards before first-turn draw');
  assert.equal(pre.aiHand.length,6,'seat 2 opening hand must contain six cards before first-turn draw');
  assert.equal(pre.playerManaPoolCards.length,3,'seat 1 opening shard pool must contain three shards');
  assert.equal(pre.aiManaPoolCards.length,3,'seat 2 opening shard pool must contain three shards');
  const revBefore=a.revision;
  a.beginFirstTurn(firstSeat);
  assert.equal(a.revision,revBefore+2,'beginFirstTurn must commit Draw resolution plus the v6.91.6 automatic Draw-to-Deploy transition');
  return a;
}

function assertVisibleShardPool(pool,label){
  assert.ok(Array.isArray(pool)&&pool.length>0,`${label} must remain represented as visible battlefield cards`);
  for(const sh of pool){
    assert.ok(sh?.uid,`${label} must preserve canonical shard UID for donor lookup`);
    assert.ok(sh?.kind,`${label} must preserve shard kind`);
    assert.notEqual(sh?.hidden_identity,true,`${label} must not be globally face-down`);
  }
}

function assertPrivacy(a,seat){
  const v=a.viewForSeat(seat).appState;
  assert.ok(v.playerHand.length>=6,'local hand must remain visible to its owner');
  assert.ok(v.aiHand.length>=6,'opponent hand count must remain represented');
  assert.ok(v.aiHand.every(x=>x===internals.HIDDEN_CARD),'opponent hand identity must be masked');
  assert.ok(v.playerDeck.every(x=>x===internals.HIDDEN_CARD),'own draw-pile order must be masked over the network');
  assert.ok(v.aiDeck.every(x=>x===internals.HIDDEN_CARD),'opponent draw-pile order must be masked over the network');
  assertVisibleShardPool(v.aiManaPoolCards,'opponent shard pool');
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
  assertVisibleShardPool(spec.playerManaPoolCards,'spectator seat 1 shard pool');
  assertVisibleShardPool(spec.aiManaPoolCards,'spectator seat 2 shard pool');
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
  assert.equal(actor.phase,'Deploy','first authoritative turn must automatically enter Deploy after v6 Draw resolution');
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

  for(const expected of ['Battle','Reform']){
    a.applyIntent(firstSeat,'advancePhase',[]);
    assert.equal(a.viewForSeat(firstSeat).appState.phase,expected,`active seat must advance to ${expected}`);
  }
  a.applyIntent(firstSeat,'advancePhase',[]);
  const next=a.viewForSeat(other).appState;
  assert.equal(next.turn,'PLAYER','after Reform the other remote human must become local PLAYER in its viewer orientation');
  assert.equal(next.phase,'Deploy','next remote human Draw must resolve and auto-advance to Deploy');

  let paymentError='';
  try{a.applyIntent(other,'commitManaShardPaymentChoice',[])}catch(e){paymentError=String(e?.message||e)}
  assert.ok(paymentError && !/Unknown Local AI runtime intent/i.test(paymentError),'Mana payment commit must be a recognized v6 runtime intent even when no payment is pending');
}

{
  const a=create(1),before=a.revision;
  assert.throws(()=>a.applyIntentBatch(1,[{name:'advancePhase',args:[]}]),/exactly two approved atomic steps/,'single-step gameplay must use the normal intent route, not the atomic batch API');
  assert.equal(a.revision,before,'rejected single-step batch must not advance authoritative revision');
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
  assert.equal(safe.aiManaPoolCards[0].uid,'REAL-UID','opponent Shard Pool must preserve donor-visible identity during normal play');
  assert.equal(safe.aiManaPoolCards[0].class_name,'Mage','opponent Class Shard must stay visible like v6.91.6');
  assert.equal(safe.pending.candidates[0].uid,'REAL-UID','blind choice must preserve shuffled donor UID so the v6 UI can resolve the face-down candidate to its pool card');
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
  assert.equal(seat1.manaEvents[1].uid,'REAL-A','opponent opening Shard must preserve its real pool UID for v6 opening destination lookup');
  assert.equal(seat1.manaEvents[1].asset,'assets/shards/Cleric.webp','opening Shard art path must localize to packaged assets');

  const seat2=internals.localizeOpening(opening,2);
  assert.equal(seat2.manaEvents[0].side,'AI','seat 1 event must become opponent-side for seat 2');
  assert.equal(seat2.manaEvents[0].uid,'REAL-P','seat 2 must retain seat 1 opening Shard UID so donor hidden-until-arrival presentation can target it');
  assert.equal(seat2.manaEvents[1].side,'PLAYER','seat 2 own opening Shard must localize to PLAYER');
  assert.equal(seat2.manaEvents[1].uid,'REAL-A','seat 2 own opening Shard UID remains unchanged');
}


{
  // Real gameplay regression: Steal must open the donor face-down opponent-Shard
  // choice while the normal opponent Shard Pool itself stays visible. This runs in
  // both seat orientations because Seat 2 is the path that previously lost UID ownership.
  for(const seat of [1,2]){
    const a=create(seat),other=seat===1?2:1,canonical=a.canonical.appState;
    const hand=seat===1?canonical.playerHand:canonical.aiHand;
    const heroes=seat===1?canonical.playerHeroes:canonical.aiHeroes;
    const opponentPoolKey=seat===1?'aiManaPoolCards':'playerManaPoolCards',opponentOwner=seat===1?'AI':'PLAYER';
    canonical[opponentPoolKey]=[
      {uid:`BLIND-${seat}-M1`,kind:'MANA',owner_side:opponentOwner},
      {uid:`BLIND-${seat}-CM`,kind:'CLASS',class_name:'Mage',owner_side:opponentOwner},
      {uid:`BLIND-${seat}-M2`,kind:'MANA',owner_side:opponentOwner}
    ];
    hand[0]='S1-THF-005';
    heroes.LEFT.card_id='S1-THF-H001';
    heroes.LEFT.exhausted=false;

    a.applyIntent(seat,'beginPlayFromHand',[0]);
    a.applyIntent(seat,'chooseHeroFromBoard',['PLAYER','LEFT']);
    const before=a.viewForSeat(seat).appState;
    assert.equal(before.pending?.type,'opponent_mana_selection',`seat ${seat} Steal must open opponent Shard selection`);
    const visiblePoolUids=before.aiManaPoolCards.map(x=>String(x.uid));
    const candidateUids=(before.pending.candidates||[]).map(x=>String(x.uid));
    assert.equal(candidateUids.length,visiblePoolUids.length,'blind choice candidate count must match the visible opponent Shard Pool');
    for(const c of before.pending.candidates||[]){
      assert.ok(visiblePoolUids.includes(String(c.uid)),'every blind candidate UID must resolve to a real visible opponent Shard card');
      assert.equal(Object.hasOwn(c,'kind'),false,'face-down choice candidate must not expose Shard kind in the choice payload');
      assert.equal(Object.hasOwn(c,'class_name'),false,'face-down choice candidate must not expose Class identity in the choice payload');
    }
    const opponentPoolBefore=before.aiManaPoolCards.length,ownPoolBefore=before.playerManaPoolCards.length;
    a.applyIntent(seat,'selectOpponentManaChoice',[0]);
    assert.deepEqual(a.viewForSeat(seat).appState.pending?.selected_indices,[0],`seat ${seat} must be able to select a face-down opponent Shard`);
    a.applyIntent(seat,'commitOpponentManaSelection',[]);
    const after=a.viewForSeat(seat).appState;
    assert.equal(after.pending,null,`seat ${seat} opponent Shard choice must finish instead of sticking`);
    assert.equal(after.aiManaPoolCards.length,opponentPoolBefore-1,'Steal must return exactly one chosen opponent Shard to its deck');
    assert.equal(after.playerManaPoolCards.length,ownPoolBefore+1,'Steal must gain exactly one Shard from the acting player own Shard Deck');
    assertPrivacy(a,seat);
    assert.equal(a.viewForSeat(other).appState.aiManaPoolCards.length,after.playerManaPoolCards.length,'opponent viewer must see the resulting public Shard Pool count in mirrored orientation');
  }
}

{
  // If the opponent Pool contains only normal Mana Shards, identity is meaningless:
  // Steal must resolve immediately instead of opening an optional blind picker.
  for(const seat of [1,2]){
    const a=create(seat),canonical=a.canonical.appState,owner=seat===1?'PLAYER':'AI',opponentOwner=seat===1?'AI':'PLAYER';
    const hand=seat===1?canonical.playerHand:canonical.aiHand;
    const heroes=seat===1?canonical.playerHeroes:canonical.aiHeroes;
    const oppPoolKey=seat===1?'aiManaPoolCards':'playerManaPoolCards';
    hand[0]='S1-THF-005';
    heroes.LEFT.card_id='S1-THF-H001';heroes.LEFT.exhausted=false;
    canonical[oppPoolKey]=[{uid:`AUTO-${seat}-1`,kind:'MANA',owner_side:opponentOwner},{uid:`AUTO-${seat}-2`,kind:'MANA',owner_side:opponentOwner}];
    const before=canonical[oppPoolKey].length;
    a.applyIntent(seat,'beginPlayFromHand',[0]);
    a.applyIntent(seat,'chooseHeroFromBoard',['PLAYER','LEFT']);
    const after=a.viewForSeat(seat).appState;
    assert.notEqual(after.pending?.type,'opponent_mana_selection',`seat ${seat} all-Mana opponent Pool must not open optional Shard selection`);
    assert.equal(after.aiManaPoolCards.length,before-1,`seat ${seat} Steal must auto-return exactly one opponent Mana Shard`);
  }
}

{
  // Center UI draft -> one final UID PAY commit. UI-only selection behavior is tested
  // separately; this authority fixture submits the resulting mixed exact UID set.
  for(const seat of [1,2]){
    const a=create(seat),other=seat===1?2:1,canonical=a.canonical.appState,owner=seat===1?'PLAYER':'AI';
    const poolKey=seat===1?'playerManaPoolCards':'aiManaPoolCards',handKey=seat===1?'playerHand':'aiHand';
    canonical[poolKey]=[
      {uid:`EVT-${seat}-M1`,kind:'MANA',owner_side:owner},
      {uid:`EVT-${seat}-M2`,kind:'MANA',owner_side:owner},
      {uid:`EVT-${seat}-CW`,kind:'CLASS',class_name:'Warrior',owner_side:owner}
    ];
    canonical[handKey][0]='S1-EVT-002'; // Market Bargain, cost 2.

    a.applyIntent(seat,'beginPlayFromHand',[0]);
    a.applyIntent(seat,'chooseHeroFromBoard',['PLAYER','LEFT']);
    let view=a.viewForSeat(seat).appState;
    assert.equal(view.pending?.type,'mana_shard_payment_choice',`seat ${seat} paid Event must open donor Mana payment`);
    assert.equal(Number(view.pending?.cost),2,'Market Bargain payment regression must use printed cost 2');
    assert.equal(Object.hasOwn(view.pending||{},'auto_mana_fifo'),false,'removed PvP auto-FIFO fields must not survive in donor pending state');
    assert.equal(Object.hasOwn(view.pending||{},'class_manual_enabled'),false,'removed PvP Class-only fields must not survive in donor pending state');
    assert.deepEqual((view.pending?.selected_shard_uids||[]).map(String),[`EVT-${seat}-M1`,`EVT-${seat}-M2`],'donor recommendation should initially prefer normal Mana when it exactly covers the Event cost');

    // The browser center UI owns only this ephemeral selection array. It does not call
    // the donor bridge; the authoritative pool must remain untouched until PAY.
    const finalUids=[`EVT-${seat}-M1`,`EVT-${seat}-CW`];
    assert.deepEqual((a.canonical.appState[poolKey]||[]).map(x=>String(x.uid)),[`EVT-${seat}-M1`,`EVT-${seat}-M2`,`EVT-${seat}-CW`],'UI draft must not spend or mutate the server canonical pool before PAY');

    // Forged/invalid final IDs must fail closed without advancing revision or leaving payment.
    const rev=a.revision;
    let rejected='';try{a.applyIntent(seat,'commitManaShardPaymentChoice',[[`FOREIGN-${seat}`]])}catch(e){rejected=String(e?.message||e)}
    assert.match(rejected,/PAYMENT_SHARD_NOT_IN_POOL/,'server must reject a final UID that is not in the acting authoritative pool');
    assert.equal(a.revision,rev,'rejected PAY must not advance authoritative revision');
    rejected='';try{a.applyIntent(seat,'commitManaShardPaymentChoice',[[`EVT-${seat}-M1`,`EVT-${seat}-M1`]])}catch(e){rejected=String(e?.message||e)}
    assert.match(rejected,/DUPLICATE_PAYMENT_SHARD_UID/,'server must reject duplicate final payment UIDs');
    assert.equal(a.revision,rev,'duplicate PAY must not advance authoritative revision');

    const poolBefore=a.viewForSeat(seat).appState.playerManaPoolCards.length;
    a.applyIntent(seat,'commitManaShardPaymentChoice',[finalUids]);
    view=a.viewForSeat(seat).appState;
    assert.ok(view.responseWindow,'final Event PAY must leave payment and continue into the normal remote Response window');
    assert.notEqual(view.pending?.type,'mana_shard_payment_choice','accepted PAY must leave the Mana payment gate');
    a.applyIntent(other,'responsePassNoStuck',[]);
    view=a.viewForSeat(seat).appState;
    assert.equal(view.pending,null,`seat ${seat} Event payment/resolution must clear pending state`);
    assert.equal(view.responseWindow,null,`seat ${seat} Event payment/resolution must clear Response window`);
    assert.ok(!(view.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`EVT-${seat}-M1`),'selected normal Mana UID must actually be spent when the action resolves');
    assert.ok(!(view.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`EVT-${seat}-CW`),'selected Event Class UID must actually be spent at value 1 when the action resolves');
    assert.ok((view.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`EVT-${seat}-M2`),'unselected normal Mana UID must remain in the pool');
    assert.equal(view.playerManaPoolCards.length,poolBefore-2,'cost-2 mixed Event payment must spend exactly two selected Shards');
    assert.ok(view.playerDiscard.includes('S1-EVT-002'),'resolved paid Event must reach acting player Discard');
  }
}

{
  // Matching Class Shard = 2 for a matching Warrior Skill. The centered UI may replace
  // the initial two-normal recommendation, then PAY submits only the final Class UID.
  for(const seat of [1,2]){
    const a=create(seat),other=seat===1?2:1,canonical=a.canonical.appState,owner=seat===1?'PLAYER':'AI';
    const poolKey=seat===1?'playerManaPoolCards':'aiManaPoolCards',handKey=seat===1?'playerHand':'aiHand',heroKey=seat===1?'playerHeroes':'aiHeroes';
    canonical[poolKey]=[
      {uid:`SKILL-${seat}-M1`,kind:'MANA',owner_side:owner},
      {uid:`SKILL-${seat}-M2`,kind:'MANA',owner_side:owner},
      {uid:`SKILL-${seat}-CW`,kind:'CLASS',class_name:'Warrior',owner_side:owner}
    ];
    canonical[handKey][0]='S1-WAR-005'; // Taunt, Warrior Rank I Deploy Skill, cost 2.
    canonical[heroKey].CENTER.card_id='S1-WAR-H001';canonical[heroKey].CENTER.exhausted=false;

    a.applyIntent(seat,'beginPlayFromHand',[0]);
    a.applyIntent(seat,'chooseHeroFromBoard',['PLAYER','CENTER']);
    let view=a.viewForSeat(seat).appState;
    assert.equal(view.pending?.type,'mana_shard_payment_choice',`seat ${seat} Warrior Skill must enter donor payment`);
    assert.deepEqual((view.pending?.selected_shard_uids||[]).map(String),[`SKILL-${seat}-M1`,`SKILL-${seat}-M2`],'donor recommendation must initially use two exact normal Mana Shards');

    const finalUids=[`SKILL-${seat}-CW`];

    a.applyIntent(seat,'commitManaShardPaymentChoice',[finalUids]);
    view=a.viewForSeat(seat).appState;
    assert.notEqual(view.pending?.type,'mana_shard_payment_choice',`seat ${seat} Skill PAY must leave the Mana payment gate`);
    if(view.responseWindow)a.applyIntent(other,'responsePassNoStuck',[]);
    view=a.viewForSeat(seat).appState;
    assert.ok(!(view.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`SKILL-${seat}-CW`),`seat ${seat} final Class UID must be spent when the Skill resolves`);
    assert.ok((view.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`SKILL-${seat}-M1`)&&(view.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`SKILL-${seat}-M2`),`seat ${seat} unselected normal Mana must remain after matching-Class exact payment`);
  }
}



{
  // Presentation bridge regression: transient donor battle feedback must be converted
  // to a stable canonical presentation event and mirror its side for Seat 2.
  const a=create(1);
  a.game.queueAuthoritativeBattleFeedback({kind:'attack',outcome:'hit',side:'PLAYER',lane:'LEFT',attack_kind:'P',has_damage:true,play_sound:true});
  const rows=a.drainBattleFeedbackForCanonicalSeat(1);
  assert.equal(rows.length,1,'headless donor battle queue must be drainable by PvP authority');
  assert.equal(Object.hasOwn(rows[0],'_sound_played'),false,'server-only dummy audio marker must never ship to browsers');
  a.appendBattlePresentation(rows);
  const e1=a.viewForSeat(1).appState.presentationEvents.at(-1),e2=a.viewForSeat(2).appState.presentationEvents.at(-1);
  assert.equal(e1.type,'BATTLE_FEEDBACK');assert.equal(e1.side,'PLAYER');assert.equal(e2.side,'AI','battle presentation side must mirror with seat orientation');
}

{
  // Real resolved Attack regression: the authoritative donor queue must cross the
  // server/browser boundary as one BATTLE_FEEDBACK presentation event without rerunning
  // attack gameplay in either browser.
  const a=create(1),canonical=a.canonical.appState;
  canonical.phase='Battle';canonical.turn='PLAYER';canonical.round=2;canonical.pending=null;canonical.responseWindow=null;
  canonical.playerHand[0]='S1-CLE-001'; // Smite, cost 2 Magical Attack.
  canonical.playerHeroes.CENTER.card_id='S1-CLE-H001';canonical.playerHeroes.CENTER.exhausted=false;
  canonical.playerManaPoolCards=[
    {uid:'BFX-M1',kind:'MANA',owner_side:'PLAYER'},
    {uid:'BFX-M2',kind:'MANA',owner_side:'PLAYER'},
    {uid:'BFX-M3',kind:'MANA',owner_side:'PLAYER'}
  ];
  a.applyIntent(1,'beginPlayFromHand',[0]);
  a.applyIntent(1,'chooseHeroFromBoard',['PLAYER','CENTER']);
  a.applyIntent(1,'chooseHeroFromBoard',['AI','CENTER']);
  a.applyIntent(1,'commitManaShardPaymentChoice',[['BFX-M1','BFX-M2']]);
  assert.ok(a.viewForSeat(1).appState.responseWindow,'resolved payment must open the normal opponent Response window before battle feedback');
  a.applyIntent(2,'responsePassNoStuck',[]);
  const p1=(a.viewForSeat(1).appState.presentationEvents||[]).filter(e=>e?.type==='BATTLE_FEEDBACK');
  const p2=(a.viewForSeat(2).appState.presentationEvents||[]).filter(e=>e?.type==='BATTLE_FEEDBACK');
  assert.equal(p1.length,1,'one resolved single-target Attack must publish exactly one battle presentation event');
  assert.equal(p1[0].kind,'attack');assert.equal(p1[0].outcome,'hit');assert.equal(p1[0].side,'AI');assert.equal(p1[0].lane,'CENTER');assert.equal(p1[0].attack_kind,'M');
  assert.equal(p2.at(-1).side,'PLAYER','the exact same battle event must mirror to the target as local PLAYER on Seat 2');
  assert.equal(Object.hasOwn(p1[0],'_sound_played'),false,'headless dummy-audio marker must not suppress browser sound');
}

{
  // Generic arbitrary gameplay batches are not an authority API. Only exact UI atomic
  // pairs are allowed, and a rejected pair may not advance authoritative revision.
  const a=create(1),rev=a.revision;
  assert.throws(()=>a.applyIntentBatch(1,[{name:'advancePhase',args:[]},{name:'advancePhase',args:[]}]),/INTENT_BATCH_NOT_ALLOWED/);
  assert.equal(a.revision,rev,'rejected arbitrary batch must not advance revision');
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
  const a=new V6916Authority();
  assert.doesNotThrow(()=>a.start({p1:{name:'50 Card Custom',customDeck:base},p2:{name:'Starter',deckKey:starterKeys[1]}}),'existing 50-card Custom Deck acceptance is a locked PvP requirement and must remain unchanged');
  assert.equal(a.canonical.appState.playerDeck.length,50,'50-card Custom Deck must enter the match as 50 cards');
}

console.log(JSON.stringify({
  ok:true,
  architecture:'v6.91.6 gameplay base + center-only ephemeral UID draft + final-UID PvP commit seam',
  lockedAuthoritySources:Object.keys(hashes).length,
  starterDecks:starterKeys.length,
  actorLocalSeatOrientation:true,
  shardOwnershipSeat2:true,
  viewerSafePrivacy:true,
  legacyPackagePrivacy:true,
  drawMetadataPrivacy:true,
  blindShardGameplayParity:true,
  blindHandMappingPrivacy:true,
  nestedPendingPrivacy:true,
  openingShardPresentationParity:true,
  privateLogPrivacy:true,
  postPendingHiddenZoneLogPrivacy:true,
  battleLogOrderAndHistoryPreserved:true,
  mirrorInvolution:true,
  surrenderAuthority:true,
  customDeck50Accepted:true,
  opponentShardSelectionEndToEnd:true,
  manaPaymentEndToEnd:true,
  manaPaymentDonorExactSelection:true,
  manaPaymentFinalUidCommit:true,
  nativePvpSelfTests:3
},null,2));
