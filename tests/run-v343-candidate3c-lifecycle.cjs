'use strict';
const assert=require('assert');
const path=require('path');
const {loadCandidate3aRuntime,deepClone,genericShards}=require('./candidate3a-runtime-harness.cjs');
const root=path.resolve(__dirname,'..');
const {window,bridge}=loadCandidate3aRuntime(root);
const STARTER_A='starter_01_elemental_lord_conqueror_renegade';
const STARTER_B='starter_02_saint_crusader_grand_ranger';

// Locked canonical defeat/cleanup self-audits remain green.
for(const [name,fn] of [
  ['EXP clear / revive',window.GL_V1410_EXP_CLEAR_QA_SELF_TEST],
  ['Casting defeat cleanup',window.GL_PHASE12_CASTING_DEFEAT_CANCEL_QA_SELF_TEST],
  ['Poison terminal',window.GL_V613_POISON_GAMEOVER_QA_SELF_TEST]
]){
  assert.equal(typeof fn,'function',`${name} QA missing`);
  const r=fn(); assert.equal(r.ok,true,`${name}: ${r.reason||r.error||'failed'}`);
}
const defeatCleanup=bridge.testDefeatCastingCleanupRevive();
assert.equal(defeatCleanup.ok,true,defeatCleanup.reason||'defeat cleanup audit failed');
assert.equal(defeatCleanup.castingCleared,true);assert.equal(defeatCleanup.attachmentsCleared,true);assert.equal(defeatCleanup.statusesCleared,true);assert.equal(defeatCleanup.expCleared,true);assert.equal(defeatCleanup.reviveClean,true);

function newCanonical(starterB=STARTER_B){
  bridge.startSharedMatch({playerDeckKey:STARTER_A,aiDeckKey:starterB,firstPlayerSide:'PLAYER'});
  return deepClone(bridge.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'}).snapshot);
}
function controller(initial){
  let canonical=deepClone(initial);
  return {
    state:()=>canonical.appState,
    canonical:()=>canonical,
    act(seat,name,args=[]){
      assert.equal(bridge.importCanonicalSnapshot(canonical,seat,{notice:'',skipImportAnimations:true}),true);
      const r=bridge.applyServerIntent(name,args);
      canonical=deepClone(bridge.getCanonicalSnapshot(seat));
      if(!r.ok) throw new Error(`${name}: ${r.error||'runtime rejected'}`);
      return canonical.appState;
    },
    tryAct(seat,name,args=[]){
      assert.equal(bridge.importCanonicalSnapshot(canonical,seat,{notice:'',skipImportAnimations:true}),true);
      const before=deepClone(bridge.getCanonicalSnapshot(seat));
      const r=bridge.applyServerIntent(name,args);
      canonical=deepClone(bridge.getCanonicalSnapshot(seat));
      return {r,before,after:deepClone(canonical)};
    }
  };
}

// Candidate 3B preflight correction: Area Attack -> Stoneblood -> Legacy must preserve the remaining Area queue.
{
  const snap=newCanonical(); const s=snap.appState;
  Object.assign(s,{pvpHumanVsHuman:true,turn:'PLAYER',phase:'Battle',round:2,pending:null,responseWindow:null,gameOver:false,winner:null});
  s.playerHand=['S1-WAR-016']; s.playerDiscard=[]; s.playerHeroes.CENTER.card_id='S1-WAR-H002'; s.playerHeroes.CENTER.rank=2; s.playerHeroes.CENTER.exhausted=false;
  s.playerManaPoolCards=genericShards('PLAYER',12); s.playerManaPool=12; s.mana=12;
  for(const lane of ['LEFT','CENTER','RIGHT']){const h=s.aiHeroes[lane];h.hp=20;h.statuses=[];h.attachments=[null,null];h.exhausted=false;}
  const c=controller(snap);
  c.act(1,'beginPlayFromHand',[0]); c.act(1,'chooseHeroFromBoard',['PLAYER','CENTER']);
  let st=c.act(2,'responsePassNoStuck');
  assert.equal(st.pending?.type,'racial_stoneblood','Whirlwind lethal first target should offer Stoneblood');
  st=c.act(2,'resolveStonebloodChoice',[false]);
  assert.equal(st.pending?.type,'legacy_defeat_choice','declined Stoneblood must continue to Legacy');
  c.act(2,'selectLegacyDefeatChoice',[0]); st=c.act(2,'handleChoiceConfirm');
  assert.equal(st.responseWindow?.target_lane,'CENTER','Area queue was lost after Stoneblood -> Legacy');
  // Continue the same one-card Area resolution through all remaining targets.
  st=c.act(2,'responsePassNoStuck');
  if(st.pending?.type==='legacy_defeat_choice'){c.act(2,'selectLegacyDefeatChoice',[0]);st=c.act(2,'handleChoiceConfirm');}
  assert.equal(st.responseWindow?.target_lane,'RIGHT','Area queue did not reach third target');
  st=c.act(2,'responsePassNoStuck');
  assert.equal(st.gameOver,true,'multi-Hero lethal resolution did not reach terminal state');
  assert.equal(st.winner,'PLAYER');
  assert.equal((st.log||[]).filter(x=>/GAME END:/i.test(String(x))).length,1,'terminal event emitted more than once');
}

// Ranked Hero defeat: cleanup, Legacy replacement and stale old-Hero component action rejection.
{
  const snap=newCanonical();const s=snap.appState;
  Object.assign(s,{pvpHumanVsHuman:true,turn:'PLAYER',phase:'Battle',round:2,pending:null,responseWindow:null,gameOver:false,winner:null});
  s.playerHand=['S1-WAR-001'];s.playerManaPoolCards=genericShards('PLAYER',12);s.mana=12;s.playerHeroes.CENTER.exhausted=false;
  const target=s.aiHeroes.CENTER;target.card_id='S1-WAR-H005';target.hp=20;target.maxHp=130;target.exp_cards=['S1-WAR-002'];target.exp_total=400;target.statuses=[{name:'Poison',duration:2}];target.attachments=[null,null];
  const c=controller(snap);
  c.act(1,'beginPlayFromHand',[0]);c.act(1,'chooseHeroFromBoard',['PLAYER','CENTER']);c.act(1,'chooseHeroFromBoard',['AI','CENTER']);
  let st=c.act(2,'responsePassNoStuck');
  assert.equal(st.pending?.type,'legacy_defeat_choice');
  c.act(2,'selectLegacyDefeatChoice',[0]);st=c.act(2,'handleChoiceConfirm');
  const legacy=st.aiHeroes.CENTER;
  assert.equal(legacy.mode,'LEGACY');assert.equal(legacy.legacy_mode,true);assert.equal(legacy.defeated_hero_snapshot.card_id,'S1-WAR-H005');
  assert.equal(legacy.defeated_hero_snapshot.exp_cards.length,0);assert.equal(legacy.defeated_hero_snapshot.statuses.length,0);assert.deepEqual(legacy.defeated_hero_snapshot.attachments,[null,null]);
  const stale=c.tryAct(2,'beginActivatedRacialAbility',['PLAYER','CENTER','dragon_scale']);
  assert.equal(stale.r.ok,false,'old Hero component intent unexpectedly remained active after Legacy replacement');
  assert.equal(JSON.stringify(stale.after.appState),JSON.stringify(stale.before.appState),'stale old-Hero component intent mutated local authoritative gameplay state');
}

// Candidate 7 direct terminal helper remains idempotent at the runtime boundary.
{
  const r=bridge.testCandidate7DirectLethal();
  assert.equal(r.gameOver,true);assert.equal(r.winner,'PLAYER');assert.equal(r.gameEndLogs,1);
}

console.log(JSON.stringify({
  ok:true,candidate:'PvP v3.43 Candidate 3C',
  canonicalDefeatCleanup:true,rankedHeroDefeat:true,multiHeroDefeat:true,
  stonebloodAreaContinuation:true,legacyReplacement:true,staleHeroComponentRejected:true,
  terminalExactlyOnce:true,castingCleanup:true,expCleanup:true
},null,2));
