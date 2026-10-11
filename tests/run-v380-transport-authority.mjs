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
  const h=harness(a,seat);
  let s=h.roundTrip('beginPlayFromHand',[0]);assert.equal(s.pending?.type,'source_selection');
  s=h.roundTrip('chooseHeroFromBoard',['PLAYER','LEFT']);
  assert.equal(s.pending,null,`seat ${seat} Meditation must fully resolve through the network transport`);
  assert.ok(s.playerDiscard.includes('S1-MAG-006'),`seat ${seat} Meditation must reach Discard after transport round-trip`);
  assert.equal(h.channel.getState().inFlight,false);
}

// Regression: Class-Shard toggle and PAY must both traverse the same transport for Seat 1 and Seat 2.
for(const seat of [1,2]){
  const a=setup(seat),canonical=a.canonical.appState,owner=seat===1?'PLAYER':'AI';
  const poolKey=seat===1?'playerManaPoolCards':'aiManaPoolCards';
  const handKey=seat===1?'playerHand':'aiHand';
  const heroKey=seat===1?'playerHeroes':'aiHeroes';
  canonical[poolKey]=[
    {uid:`FIFO-${seat}-1`,kind:'MANA',owner_side:owner},
    {uid:`FIFO-${seat}-2`,kind:'MANA',owner_side:owner},
    {uid:`CLASS-${seat}-W`,kind:'CLASS',class_name:'Warrior',owner_side:owner},
    {uid:`FIFO-${seat}-3`,kind:'MANA',owner_side:owner}
  ];
  canonical[handKey][0]='S1-WAR-005'; // Taunt, cost 2
  canonical[heroKey].CENTER.card_id='S1-WAR-H001';canonical[heroKey].CENTER.exhausted=false;
  const h=harness(a,seat);
  let s=h.roundTrip('beginPlayFromHand',[0]);assert.equal(s.pending?.type,'source_selection');
  s=h.roundTrip('chooseHeroFromBoard',['PLAYER','CENTER']);
  assert.equal(s.pending?.type,'mana_shard_payment_choice');assert.equal(s.pending?.payment_ready,true);
  assert.deepEqual((s.pending?.selected_shard_uids||[]).map(String),[`FIFO-${seat}-1`,`FIFO-${seat}-2`],`seat ${seat} default PAY must auto-select FIFO normal Mana`);
  s=h.roundTrip('toggleManaShardPaymentChoice',[`CLASS-${seat}-W`]);
  assert.deepEqual((s.pending?.selected_class_uids||[]).map(String),[`CLASS-${seat}-W`],`seat ${seat} Class Shard click must survive browser/server round-trip`);
  assert.deepEqual((s.pending?.selected_shard_uids||[]).map(String),[`CLASS-${seat}-W`],`seat ${seat} matching Class Shard must replace FIFO Mana for cost 2`);
  assert.equal(s.pending?.payment_ready,true,`seat ${seat} PAY must remain enabled after Class selection`);
  s=h.roundTrip('commitManaShardPaymentChoice',[]);
  assert.notEqual(s.pending?.type,'mana_shard_payment_choice',`seat ${seat} PAY must leave the payment gate after authoritative result`);
  assert.ok(!(s.playerManaPoolCards||[]).some(sh=>String(sh.uid)===`CLASS-${seat}-W`),`seat ${seat} selected Class Shard must actually be spent`);
  assert.equal(h.channel.getState().inFlight,false,`seat ${seat} PAY must not leave a network lock behind`);
}

// Regression: Event uses the same Class-only/FIFO interaction over the browser transport.
for(const seat of [1,2]){
  const a=setup(seat),canonical=a.canonical.appState,owner=seat===1?'PLAYER':'AI';
  const poolKey=seat===1?'playerManaPoolCards':'aiManaPoolCards';
  const handKey=seat===1?'playerHand':'aiHand';
  canonical[poolKey]=[
    {uid:`EVT-${seat}-M1`,kind:'MANA',owner_side:owner},
    {uid:`EVT-${seat}-CW`,kind:'CLASS',class_name:'Warrior',owner_side:owner}
  ];
  canonical[handKey][0]='S1-EVT-002'; // Market Bargain, cost 2
  const h=harness(a,seat);
  let s=h.roundTrip('beginPlayFromHand',[0]);assert.equal(s.pending?.type,'source_selection');
  s=h.roundTrip('chooseHeroFromBoard',['PLAYER','LEFT']);
  assert.equal(s.pending?.type,'mana_shard_payment_choice',`seat ${seat} Event must enter payment`);
  assert.equal(s.pending?.payment_ready,false);
  assert.deepEqual((s.pending?.selected_shard_uids||[]).map(String),[`EVT-${seat}-M1`]);
  s=h.roundTrip('toggleManaShardPaymentChoice',[`EVT-${seat}-CW`]);
  assert.equal(s.pending?.payment_ready,true,`seat ${seat} Event Class choice must enable PAY`);
  assert.deepEqual((s.pending?.selected_shard_uids||[]).map(String),[`EVT-${seat}-CW`,`EVT-${seat}-M1`]);
  s=h.roundTrip('commitManaShardPaymentChoice',[]);
  assert.notEqual(s.pending?.type,'mana_shard_payment_choice',`seat ${seat} Event PAY must leave payment`);
  assert.equal(h.channel.getState().inFlight,false);
}

console.log(JSON.stringify({ok:true,meditationTransportBothSeats:true,classShardTransportBothSeats:true,payTransportBothSeats:true,eventPaymentTransportBothSeats:true,noIntentDeadlock:true},null,2));
