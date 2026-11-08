import assert from 'node:assert/strict';
import {join} from 'node:path';
import {Season0HeadlessAuthority} from '../server/headless-rc32.mjs';
import {season0StarterCatalog as decks} from '../server/s0-pregame-catalog.mjs';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';

// This is the unmodified S0 RC34 match engine via the real PvP authority,
// exercised from seat 2. RC32 had bugs in mirrored seat-2 Mana commits.
const root=join(process.cwd(),'public/battle');
let found=false,tries=0;
for(;tries<36&&!found;tries++){
  const a=new Season0HeadlessAuthority(root);
  a.start({player1Deck:decks.s0_starter_01_red_white.deck,player2Deck:decks.s0_starter_02_blue_red.deck});
  a.completeOpening(1,'HEADS');
  let reached=false;
  for(let n=0;n<12;n++){
    const st=a._canonicalForServerOnly().appState;
    if(st.turn==='AI'&&st.phase==='Battle'){reached=true;break}
    const seat=st.turn==='PLAYER'?1:2;
    try{a.applyIntent(seat,'advancePhase',[])}catch{break}
  }
  if(!reached)continue;
  let st=a._viewForMaskingOnly(2).appState;
  const i=st.playerHand.indexOf('S0-MAG-007');
  if(i<0)continue;
  try{a.applyIntent(2,'beginPlayFromHand',[i])}catch{continue}
  let p=a._viewForMaskingOnly(2).appState.pending;
  if(p?.type!=='source_selection'||!p.legal_sources?.length)continue;
  try{a.applyIntent(2,'chooseHeroFromBoard',['PLAYER',p.legal_sources[0]])}catch{continue}
  p=a._viewForMaskingOnly(2).appState.pending;
  if(p?.type!=='target_selection'||!p.legal_targets?.length)continue;
  try{a.applyIntent(2,'chooseHeroFromBoard',['AI',p.legal_targets[0]])}catch{continue}
  p=a._viewForMaskingOnly(2).appState.pending;
  if(p?.type!=='mana_shard_payment_choice'||!p.selected_shard_uids?.length)continue;
  const uids=p.selected_shard_uids;
  const before=a.revision;
  assert.throws(()=>a.applyIntent(2,'commitExactManaPaymentChoice',[[uids[0],uids[0]],false,null]));
  assert.equal(a.revision,before,'Rejected payment must not increment revision');
  assert.equal(a._viewForMaskingOnly(2).appState.pending?.type,'mana_shard_payment_choice');
  const target=p.action.target_lane;
  const hpBefore=a._viewForMaskingOnly(1).appState.playerHeroes[target].hp;
  a.applyIntent(2,'commitExactManaPaymentChoice',[uids,false,null]);
  assert.equal(a._canonicalForServerOnly().appState.responseWindow?.response_owner,'PLAYER');
  assert.equal(a._viewForMaskingOnly(1).appState.responseWindow?.response_owner,'PLAYER');
  assertViewerSafeBoard(viewerSafeBoard(a._viewForMaskingOnly(1),{seat:1,revision:a.revision,secret:Buffer.alloc(32)}));
  assertViewerSafeBoard(viewerSafeBoard(a._viewForMaskingOnly(2),{seat:2,revision:a.revision,secret:Buffer.alloc(32)}));
  a.applyIntent(1,'responsePassNoStuck',[]);
  const after=a._viewForMaskingOnly(1).appState;
  assert.equal(after.responseWindow,null);
  assert.ok(after.playerHeroes[target].hp<hpBefore,`Target HP should decrease after unblocked S0-MAG-007 (${hpBefore} -> ${after.playerHeroes[target].hp})`);
  found=true;
  console.log(`PASS RC34 seat 2 attack -> exact Mana PAY -> seat 1 Response PASS -> damage; retries=${tries+1}`);
}
assert.ok(found,'Unable to reach seat-2 Mana/Response scenario after 36 valid randomized matches');
