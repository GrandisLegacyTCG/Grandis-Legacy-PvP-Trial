import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {Season0HeadlessAuthority} from '../server/headless-rc32.mjs';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../client');
const secret=Buffer.alloc(32,19);
let completed=false, tries=0, details=null;
for(;tries<24&&!completed;tries++){
 const a=new Season0HeadlessAuthority(root);
 a.start({player1DeckKey:a.starterIds[tries%5],player2DeckKey:a.starterIds[(tries+1)%5]});
 a.completeOpening(1);
 const st=()=>a._canonicalForServerOnly().appState;
 const act=(seat,name,args=[])=>{try{a.applyIntent(seat,name,args);return true}catch{return false}};
 // Seat 2 cannot cause a phantom revision by clicking an action in Draw Phase.
 for(let i=0;i<4;i++){
  const s=st(),seat=s.turn==='AI'?2:1;
  assert.ok(act(seat,s.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase'));
 }
 assert.equal(st().turn,'AI');assert.equal(st().phase,'Draw');
 const oldRevision=a.revision;
 assert.equal(act(2,'beginPlayFromHand',[0]),false,'Invalid seat-2 action must not be accepted as a no-op');
 assert.equal(a.revision,oldRevision,'Invalid seat-2 action must NOT increment revision');
 for(let i=0;i<2;i++)assert.ok(act(2,'advancePhase'));
 assert.equal(st().phase,'Battle');
 const hand=a._viewForMaskingOnly(2).appState.playerHand;
 let selected=false,attackCardId=null;
 for(let i=0;i<hand.length;i++){
  if(!act(2,'beginPlayFromHand',[i]))continue;
  if(st().pending?.type==='source_selection' || st().pending?.type==='target_selection'){selected=true;attackCardId=hand[i];break;}
  // A zero-target immediate skill may have resolved; try the next available card.
 }
 if(!selected)continue;
 let steps=0;
 while(st().pending && steps++<12){
  const p=st().pending,seat=p.decision_side==='AI'?2:1;
  if(p.type==='response_window')break;
  const view=a._viewForMaskingOnly(seat).appState.pending;
  let ok=false;
  if(view.type==='source_selection')ok=act(seat,'chooseHeroFromBoard',['PLAYER',view.legal_sources[0]]);
  if(view.type==='target_selection')ok=act(seat,'chooseHeroFromBoard',[view.target_side,view.legal_targets[0]]);
  if(view.type==='mana_shard_payment_choice')ok=act(seat,'commitManaShardPaymentChoice');
  if(view.type==='optional_magical_surge')ok=act(seat,'commitMagicalSurgeChoice',[false]);
  if(!ok)break;
 }
 if(!st().responseWindow)continue;
 const responseOwner=st().responseWindow.response_owner;
 assert.equal(responseOwner,'PLAYER','Second player should be attacking first player');
 const defender=a._viewForMaskingOnly(1).appState.responseWindow;
 assert.equal(defender.response_owner,'PLAYER');
 assert.ok(Array.isArray(defender.options));
 const projection1=viewerSafeBoard(a._viewForMaskingOnly(1),{seat:1,revision:a.revision,secret});
 const projection2=viewerSafeBoard(a._viewForMaskingOnly(2),{seat:2,revision:a.revision,secret});
 assertViewerSafeBoard(projection1);assertViewerSafeBoard(projection2);
 assert.equal(projection2.appState.responseWindow.private_masked,true,'Attacker must not read defender private responses');
 assert.throws(()=>a.applyIntent(2,'responsePassNoStuck',[]),/Not your turn|decision window/);
 const before=a.revision;
 assert.ok(act(1,'responsePassNoStuck'),'Defender must resolve attack Response pass');
 assert.equal(a.revision,before+1);
 assert.equal(st().responseWindow,null);
 assert.ok(!st().pending || st().pending.type!=='response_window');
 completed=true;details={attempt:tries,cardId:attackCardId,options:defender.options.length,revision:a.revision,round:st().round};
}
assert.ok(completed,'No actual cross-seat Attack -> target -> Mana -> opponent Response -> resolution completed');
console.log('PASS: S0 RC31 actual two-seat Attack/target/Mana/Response engine transaction; seat2 no-op revision rejection; private response masking;',details);
