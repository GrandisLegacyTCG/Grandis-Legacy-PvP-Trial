'use strict';
const assert=require('assert');
const path=require('path');
const {loadCandidate3aRuntime,deepClone}=require('./candidate3a-runtime-harness.cjs');
const root=path.resolve(__dirname,'..');
const {bridge}=loadCandidate3aRuntime(root);
bridge.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger',firstPlayerSide:'PLAYER'});
let canonical=deepClone(bridge.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'}).snapshot);
Object.assign(canonical.appState,{pvpHumanVsHuman:true,playerHand:[],aiHand:[],pending:null,responseWindow:null,turn:'PLAYER',phase:'Deploy',round:1,gameOver:false,winner:null});
const initialHeroIds={PLAYER:Object.fromEntries(['LEFT','CENTER','RIGHT'].map(l=>[l,canonical.appState.playerHeroes[l].card_id])),AI:Object.fromEntries(['LEFT','CENTER','RIGHT'].map(l=>[l,canonical.appState.aiHeroes[l].card_id]))};
let successfulIntents=0,completedTurns=0,lastTurn=canonical.appState.turn,maxRound=canonical.appState.round,handLimitCommits=0;
function act(seat,name,args=[]){bridge.importCanonicalSnapshot(canonical,seat,{notice:'',skipImportAnimations:true});const r=bridge.applyServerIntent(name,args);if(!r.ok)throw new Error(`${name}: ${r.error||'rejected'}`);canonical=deepClone(bridge.getCanonicalSnapshot(seat));successfulIntents++;}
while(completedTurns<30){
  const s=canonical.appState;assert.equal(s.gameOver,false,'soak ended unexpectedly');assert.equal(s.responseWindow,null,'stale Response leaked into soak turn loop');
  const seat=s.turn==='PLAYER'?1:2;
  if(s.pending){
    assert.equal(s.pending.type,'hand_limit_discard',`unexpected stale pending ${s.pending.type}`);
    const need=Number(s.pending.required||1);for(let i=0;i<need;i++)act(seat,'toggleDiscardIndex',[i]);act(seat,'handleChoiceConfirm');handLimitCommits++;
  }else act(seat,'advancePhase');
  const now=canonical.appState;
  if(now.turn!==lastTurn){completedTurns++;lastTurn=now.turn;maxRound=Math.max(maxRound,Number(now.round||0));}
  assert.ok((now.playerHand||[]).length<=9 && (now.aiHand||[]).length<=9,'hand lifecycle drifted beyond draw-before-cleanup maximum');
  assert.equal(now.responseWindow,null);
  for(const side of ['PLAYER','AI'])for(const lane of ['LEFT','CENTER','RIGHT']){
    const hero=(side==='PLAYER'?now.playerHeroes:now.aiHeroes)[lane];assert.equal(hero.card_id,initialHeroIds[side][lane],`Hero reference drift ${side} ${lane}`);
  }
}
assert.equal(completedTurns,30);assert.ok(completedTurns>21);assert.equal(canonical.appState.round,16,'round counter did not advance across hand-limit cleanup');assert.equal(canonical.appState.phase,'Deploy');assert.equal(canonical.appState.pending,null);assert.equal(canonical.appState.gameOver,false);assert.ok(handLimitCommits>0,'soak did not exercise hand-limit decision path');
console.log(JSON.stringify({ok:true,candidate:'PvP v3.43 Candidate 3C',completedTurns,round:canonical.appState.round,crossed21Turns:true,handLimitCommits,successfulIntents,maxRound,terminal:false,pending:null,response:null,heroReferenceStable:true},null,2));
