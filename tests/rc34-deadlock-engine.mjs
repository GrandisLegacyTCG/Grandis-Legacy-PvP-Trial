import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {Season0HeadlessAuthority} from '../server/headless-rc32.mjs';

const root=join(process.cwd(),'public/battle');
const deck1='s0_starter_01_red_white',deck2='s0_starter_02_blue_red';
const seatFor=s=>s.turn==='PLAYER'?1:2;
let checks=0;
for(const first of [1,2]){
  const authority=new Season0HeadlessAuthority(root);
  authority.start({player1DeckKey:deck1,player2DeckKey:deck2});
  authority.completeOpening(first,'HEADS');
  let st=authority._canonicalForServerOnly().appState;
  assert.equal(st.turn,first===1?'PLAYER':'AI');
  assert.equal(st.phase,'Deploy','Draw must be settled server-side after opening when no choice is pending');
  assert.equal(authority.canSeatAct(first),true,'Only turn owner can act after opening');
  assert.equal(authority.canSeatAct(first===1?2:1),false,'Non-owner cannot act outside Response');
  const opener=first===1?'player':'ai';
  assert.equal(st[opener+'Hand'].length,5,'Rulebook v3.2: first player skips mandatory Draw; opening Hand remains five');
  assert.equal(st[opener==='player'?'playerManaPoolCards':'aiManaPoolCards'].length,4,'Mana Regen must happen exactly once');
  let turnSwitches=0;
  for(let step=0;step<110;step++){
    st=authority._canonicalForServerOnly().appState;
    if(st.pending?.type==='hand_limit_discard') {
      const owner=seatFor(st),need=Number(st.pending.required||0);
      assert.ok(need>0 && need<=st[st.turn==='PLAYER'?'playerHand':'aiHand'].length,'Hand Limit pending must have selectable cards');
      for(let i=0;i<need;i++)authority.applyIntent(owner,'toggleDiscardIndex',[i]);
      authority.applyIntent(owner,'handleChoiceConfirm',[]);
      const afterCleanup=authority._canonicalForServerOnly().appState;
      assert.notEqual(afterCleanup.phase,'Draw','Hand Limit continuation must not stop at Draw');
      if(afterCleanup.turn!==st.turn)turnSwitches++;
      if(turnSwitches>=10)break;
      continue;
    }
    if(st.gameOver||st.pending||st.responseWindow)break;
    const before=st.turn;
    const rev=authority.revision;
    authority.applyIntent(seatFor(st),'advancePhase',[]);
    st=authority._canonicalForServerOnly().appState;
    assert.equal(authority.revision,rev+1,'Server continuation is part of a single player intent revision');
    assert.notEqual(st.phase,'Draw','A fully resolved Draw cannot remain stuck');
    if(st.turn!==before)turnSwitches++;
    if(turnSwitches>=10)break;
  }
  assert.ok(turnSwitches>=10,`Both seats should complete repeated phase cycles without Draw deadlock (first=${first})`);
  checks++;
}

// Test-only authority source import adds a fixture injector; production source
// has no testing backdoor. Gameplay below still goes through the real engine.
const code=readFileSync(resolve('server/headless-rc32.mjs'),'utf8');
const marker='  /** A verified seat may concede without turn/response ownership. */';
assert.ok(code.includes(marker));
const testCode=code.replace(marker,`  injectFixtureForQA(snapshot) {
    this.#canonical=clone(snapshot);
    this.#bridgeSeat=null;
    this.#bridgeRevision=-1;
  }
${marker}`);
const {Season0HeadlessAuthority:FixtureAuthority}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(testCode));
for(const actorSeat of [1,2]){
  const a=new FixtureAuthority(root);
  a.start({player1DeckKey:deck1,player2DeckKey:deck2});
  a.completeOpening(1,'HEADS');
  const snap=a._canonicalForServerOnly(),s=snap.appState;
  const actorSide=actorSeat===1?'PLAYER':'AI',other=actorSeat===1?'AI':'PLAYER';
  s.turn=actorSide;s.phase='Reform';s.pending=null;s.responseWindow=null;s.gameOver=false;
  s.autoEndTurnPending=false;s.autoEndResumeScheduled=false;
  s.activeAttachments=[{side:other,card_id:'S0-MAG-028',source_lane:'CENTER',target_lane:'CENTER'}];
  s.s0_attack_cards_played_by_turn={};
  s[actorSide==='PLAYER'?'playerHand':'aiHand']=[];
  a.injectFixtureForQA(snap);
  a.applyIntent(actorSeat,'advancePhase',[]);
  let st=a._canonicalForServerOnly().appState;
  assert.equal(st.phase,'End',`Provoke from ${other} must pause at End`);
  assert.equal(st.pending?.type,'opponent_mana_selection',`Provoke must open blind Mana choice (seat ${actorSeat})`);
  const responderSeat=actorSeat===1?2:1;
  const pending=a._viewForMaskingOnly(responderSeat).appState.pending;
  const needed=Math.min(Number(pending.required_count||1),pending.candidates?.length||0);
  assert.ok(needed>0,'Provoke should have at least one valid Mana target');
  for(let i=0;i<needed;i++)a.applyIntent(responderSeat,'selectOpponentManaChoice',[i]);
  a.applyIntent(responderSeat,'commitOpponentManaSelection',[]);
  st=a._canonicalForServerOnly().appState;
  assert.equal(st.pending,null,'Provoke choice should close');
  assert.equal(Object.keys(st.s0_provoke_processed_turns||{}).length,1,'Provoke effect must be processed exactly once per End, including mirrored seat 2');
  assert.equal(st.autoEndTurnPending,false,`Provoke End must finish without a second manual End (seat ${actorSeat})`);
  assert.notEqual(st.turn,actorSide,`End must pass to opponent immediately (seat ${actorSeat})`);
  assert.equal(st.phase,'Deploy','Following Draw must settle without a timer');
  checks++;
}
console.log(`PASS DL-01/DL-03: ${checks} authoritative opening/turn/provoke continuation scenarios`);
