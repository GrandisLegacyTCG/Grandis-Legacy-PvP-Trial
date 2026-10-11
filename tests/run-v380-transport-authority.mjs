import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { V6914Authority } from '../server/v6914-authority.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'public/pvp/intent-channel.js'),'utf8');
const ctx={console,setTimeout,clearTimeout};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);new vm.Script(src,{filename:'intent-channel.js'}).runInContext(ctx);
const createChannel=ctx.GL_CREATE_PVP_INTENT_CHANNEL;
assert.equal(typeof createChannel,'function');

function setup(seat=1){
  const a=new V6914Authority(),keys=Object.keys(a.starters);
  a.start({p1:{name:'P1',deckKey:keys[0]},p2:{name:'P2',deckKey:keys[1]}});
  a.commitOpening({choice:'HEADS',outcome:'HEADS',firstSeat:seat});
  a.beginFirstTurn(seat);
  return a;
}
function clientSnapshot(a,seat){return{type:'snapshot',local:{role:'player',seat},match:{status:'started',revision:a.revision,board:a.viewForSeat(seat)}}}
function harness(a,seat=1){
  let snapshot=clientSnapshot(a,seat),out=[];
  const channel=createChannel({clientId:()=> `browserP${seat}`,getSnapshot:()=>snapshot,send:(type,payload)=>{out.push({type,payload:structuredClone(payload)});return true},timeoutMs:6000});
  function roundTrip(name,args=[]){
    const r=channel.sendIntent(name,args);assert.equal(r.ok,true,`${name} must leave browser transport`);assert.equal(out.length,1,`${name} must emit exactly one websocket action`);
    const packet=out.shift();assert.equal(packet.type,'runtime-intent');
    a.applyIntent(seat,packet.payload.intent,packet.payload.args);
    const next=clientSnapshot(a,seat);
    const result={type:'intent-result',clientActionId:packet.payload.clientActionId,ok:true,revision:a.revision,snapshot:next};
    const handled=channel.handleResult(result);assert.equal(handled.matched,true,`${name} result must release the same action gate`);
    snapshot=next;assert.equal(channel.getState().inFlight,false,`${name} must leave no stuck browser intent lock`);
    return snapshot.match.board.appState;
  }
  return{roundTrip,getSnapshot:()=>snapshot,channel,getOut:()=>out};
}

// Regression: zero-Mana Skills must traverse the real browser transport for both seat orientations.
for(const seat of [1,2]){
  const a=setup(seat),canonical=a.canonical.appState;
  const hand=seat===1?canonical.playerHand:canonical.aiHand;
  const heroes=seat===1?canonical.playerHeroes:canonical.aiHeroes;
  hand[0]='S1-MAG-006'; // Meditation
  heroes.LEFT.card_id='S1-MAG-H001';heroes.LEFT.exhausted=false;
  const h=harness(a,seat),before=h.getSnapshot().match.board.appState.playerManaPoolCards.length;
  let s=h.roundTrip('beginPlayFromHand',[0]);assert.equal(s.pending?.type,'source_selection');
  s=h.roundTrip('chooseHeroFromBoard',['PLAYER','LEFT']);
  assert.equal(s.pending,null,`seat ${seat} Meditation must fully resolve through the network transport`);
  assert.ok(s.playerDiscard.includes('S1-MAG-006'),`seat ${seat} Meditation must reach Discard after transport round-trip`);
  assert.equal(s.playerManaPoolCards.length,before+2,`seat ${seat} Meditation must add exactly two Shards to the visible local Pool`);
  assert.ok(s.playerManaPoolCards.slice(-2).every(sh=>sh&&sh.uid&&!sh.hidden_identity),`seat ${seat} newly gained Meditation Shards must be viewer-visible identities, not card backs`);
  assert.equal(h.channel.getState().inFlight,false);
}

// Regression: Shard clicks stay local; only final PAY crosses transport for both seat orientations.
for(const seat of [1,2]){
  const a=setup(seat),canonical=a.canonical.appState,owner=seat===1?'PLAYER':'AI';
  const poolKey=seat===1?'playerManaPoolCards':'aiManaPoolCards';
  const handKey=seat===1?'playerHand':'aiHand';
  const heroKey=seat===1?'playerHeroes':'aiHeroes';
  canonical[poolKey]=[
    {uid:`SKILL-${seat}-M1`,kind:'MANA',owner_side:owner},
    {uid:`SKILL-${seat}-M2`,kind:'MANA',owner_side:owner},
    {uid:`SKILL-${seat}-CW`,kind:'CLASS',class_name:'Warrior',owner_side:owner}
  ];
  canonical[handKey][0]='S1-WAR-005'; // Taunt, cost 2
  canonical[heroKey].CENTER.card_id='S1-WAR-H001';canonical[heroKey].CENTER.exhausted=false;
  const h=harness(a,seat);
  let s=h.roundTrip('beginPlayFromHand',[0]);assert.equal(s.pending?.type,'source_selection');
  s=h.roundTrip('chooseHeroFromBoard',['PLAYER','CENTER']);
  assert.equal(s.pending?.type,'mana_shard_payment_choice');
  assert.deepEqual((s.pending?.selected_shard_uids||[]).map(String),[`SKILL-${seat}-M1`,`SKILL-${seat}-M2`]);

  // Center payment selection is an ephemeral browser UI draft. It must not emit a
  // network action until PAY, so transport receives only the final canonical UID set.
  const finalUids=[`SKILL-${seat}-CW`];
  assert.equal(h.getOut().length,0,`seat ${seat} UI-only Shard draft must not emit a websocket action`);

  s=h.roundTrip('commitManaShardPaymentChoice',[finalUids]);
  assert.notEqual(s.pending?.type,'mana_shard_payment_choice',`seat ${seat} final-UID PAY must leave the payment gate`);
  assert.ok(!(s.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`SKILL-${seat}-CW`),`seat ${seat} submitted matching Class UID must be spent`);
  assert.ok((s.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`SKILL-${seat}-M1`)&&(s.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`SKILL-${seat}-M2`),`seat ${seat} unselected normal Mana must remain`);
  assert.equal(h.channel.getState().inFlight,false,`seat ${seat} PAY must not leave a network lock behind`);
}

// Regression: Event can submit a mixed exact payment (normal Mana + Class at value 1)
// in one PAY packet, with no per-Shard network toggles.
for(const seat of [1,2]){
  const a=setup(seat),other=seat===1?2:1,canonical=a.canonical.appState,owner=seat===1?'PLAYER':'AI';
  const poolKey=seat===1?'playerManaPoolCards':'aiManaPoolCards';
  const handKey=seat===1?'playerHand':'aiHand';
  canonical[poolKey]=[
    {uid:`EVT-${seat}-M1`,kind:'MANA',owner_side:owner},
    {uid:`EVT-${seat}-M2`,kind:'MANA',owner_side:owner},
    {uid:`EVT-${seat}-CW`,kind:'CLASS',class_name:'Warrior',owner_side:owner}
  ];
  canonical[handKey][0]='S1-EVT-002'; // Market Bargain, cost 2
  const h=harness(a,seat);
  let s=h.roundTrip('beginPlayFromHand',[0]);assert.equal(s.pending?.type,'source_selection');
  s=h.roundTrip('chooseHeroFromBoard',['PLAYER','LEFT']);
  assert.equal(s.pending?.type,'mana_shard_payment_choice',`seat ${seat} Event must enter payment`);

  const finalUids=[`EVT-${seat}-M1`,`EVT-${seat}-CW`];
  assert.equal(h.getOut().length,0,`seat ${seat} Event UI-only Shard draft must remain local`);

  s=h.roundTrip('commitManaShardPaymentChoice',[finalUids]);
  assert.notEqual(s.pending?.type,'mana_shard_payment_choice',`seat ${seat} Event PAY must leave payment`);
  assert.ok(s.responseWindow,`seat ${seat} Event PAY must continue to the remote Response window`);
  assert.equal(h.channel.getState().inFlight,false);
  a.applyIntent(other,'responsePassNoStuck',[]);
  const resolved=a.viewForSeat(seat).appState;
  assert.ok(!(resolved.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`EVT-${seat}-M1`));
  assert.ok(!(resolved.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`EVT-${seat}-CW`));
  assert.ok((resolved.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`EVT-${seat}-M2`));
}

console.log(JSON.stringify({ok:true,meditationTransportBothSeats:true,localShardUiDraftNoNetwork:true,finalShardCommitBothSeats:true,payTransportBothSeats:true,eventPaymentTransportBothSeats:true,noIntentDeadlock:true},null,2));
