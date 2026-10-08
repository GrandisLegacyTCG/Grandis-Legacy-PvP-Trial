'use strict';
const assert=require('assert');
const path=require('path');
const {loadCandidate3aRuntime,deepClone,genericShards}=require('./candidate3a-runtime-harness.cjs');
const root=path.resolve(__dirname,'..');
const {bridge}=loadCandidate3aRuntime(root);
const starterA='starter_01_elemental_lord_conqueror_renegade';
const starterB='starter_02_saint_crusader_grand_ranger';
bridge.startSharedMatch({playerDeckKey:starterA,aiDeckKey:starterB,firstPlayerSide:'PLAYER'});
let canonical=deepClone(bridge.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'}).snapshot);
const s=canonical.appState;
Object.assign(s,{pvpHumanVsHuman:true,turn:'PLAYER',phase:'Deploy',round:1,pending:null,responseWindow:null,gameOver:false,winner:null});
s.playerHand=['S1-WAR-004','S1-WAR-001','S1-WAR-001','S1-WAR-001'];s.aiHand=[];
s.playerHeroes.CENTER.exp_total=200;s.playerHeroes.CENTER.exp_cards=['S1-WAR-002','S1-WAR-003'];
s.playerManaPoolCards=genericShards('PLAYER',12);s.playerManaPool=12;s.mana=12;s.aiManaPoolCards=genericShards('AI',12);s.aiManaPool=12;s.aiMana=12;
for(const lane of ['LEFT','CENTER','RIGHT']){s.aiHeroes[lane].hp=20;s.aiHeroes[lane].statuses=[];s.aiHeroes[lane].attachments=[null,null];s.aiHeroes[lane].exhausted=false;s.playerHeroes[lane].exhausted=false;}
let commitCount=0,responseEvents=0,legacyReplacements=0;
function st(){return canonical.appState;}
function act(seat,name,args=[]){
  assert.equal(bridge.importCanonicalSnapshot(canonical,seat,{notice:'',skipImportAnimations:true}),true);
  const r=bridge.applyServerIntent(name,args); if(!r.ok) throw new Error(`${name}: ${r.error||'rejected'}`);
  canonical=deepClone(bridge.getCanonicalSnapshot(seat));commitCount++;return st();
}
function passOpponentTurn(){for(let i=0;i<3;i++)act(2,'advancePhase');}
function resolveMandatoryForSeat2(){let guard=0;while(st().pending&&guard++<12){const p=st().pending;if(p.type==='racial_stoneblood')act(2,'resolveStonebloodChoice',[false]);else if(p.type==='legacy_defeat_choice'){act(2,'selectLegacyDefeatChoice',[0]);act(2,'handleChoiceConfirm');legacyReplacements++;}else throw new Error(`unexpected mandatory ${p.type}`);}}
function attack(lane){
  act(1,'advancePhase');assert.equal(st().phase,'Battle');
  const idx=st().playerHand.indexOf('S1-WAR-001');assert.ok(idx>=0);
  act(1,'beginPlayFromHand',[idx]);act(1,'chooseHeroFromBoard',['PLAYER','CENTER']);act(1,'chooseHeroFromBoard',['AI',lane]);
  act(2,'responsePassNoStuck');responseEvents++;resolveMandatoryForSeat2();
  if(!st().gameOver){act(1,'advancePhase');act(1,'advancePhase');passOpponentTurn();}
}

// Real canonical Rank Up occurs inside the same deterministic match.
act(1,'advancePhase');act(1,'advancePhase');assert.equal(st().phase,'Reform');
act(1,'beginTributeFromHand',[0]);act(1,'chooseHeroFromBoard',['PLAYER','CENTER']);
assert.equal(st().playerHeroes.CENTER.card_id,'S1-WAR-H002');assert.equal(st().playerHeroes.CENTER.exp_total,300);
act(1,'advancePhase');passOpponentTurn();assert.equal(st().turn,'PLAYER');assert.equal(st().phase,'Deploy');assert.equal(st().round,2);

attack('LEFT');
assert.equal(st().aiHeroes.LEFT.mode,'LEGACY');
// The defeated Hero's stale active racial path must not become a Legacy gameplay authority.
const afterFirst=deepClone(canonical);const stale=(()=>{bridge.importCanonicalSnapshot(canonical,2,{skipImportAnimations:true});return bridge.applyServerIntent('beginActivatedRacialAbility',['PLAYER','LEFT','stoneblood']);})();
assert.equal(stale.ok,false);canonical=afterFirst;
attack('CENTER');assert.equal(st().aiHeroes.CENTER.mode,'LEGACY');
attack('RIGHT');
assert.equal(st().gameOver,true);assert.equal(st().winner,'PLAYER');assert.match(st().gameEndReason,/AI loses:/);assert.equal(st().pending,null);assert.equal(st().responseWindow,null);
assert.equal((st().log||[]).filter(x=>/GAME END:/i.test(String(x))).length,1);
assert.equal(legacyReplacements,2);assert.equal(responseEvents,3);
// Viewer-relative terminal orientation must remain coherent after match end.
bridge.importCanonicalSnapshot(canonical,1,{skipImportAnimations:true});let local=bridge.getSnapshot().appState;assert.equal(local.winner,'PLAYER');assert.match(local.gameEndReason,/AI loses:/);
bridge.importCanonicalSnapshot(canonical,2,{skipImportAnimations:true});local=bridge.getSnapshot().appState;assert.equal(local.winner,'AI');assert.match(local.gameEndReason,/PLAYER loses:/);

console.log(JSON.stringify({ok:true,candidate:'PvP v3.43 Candidate 3C',starterA,starterB,turnCount:4,rankUps:1,heroDefeats:3,legacyReplacements,responseEvents,terminalResult:'PLAYER',viewerRelativeTerminalReason:true,commitCount,viewerSafeStateCheckedByLockedCandidate3B:true},null,2));
