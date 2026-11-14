/** RC39 Repo RC2: authoritative Area VFX/Status timing, privacy, popup parity and source choice. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import {PvpCombatPresentationLedger} from '../server/combat-presentation.mjs';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
import {applyOptimizedPvpIntent} from '../server/headless-rc32.mjs';

const hero=(hp=100,statuses=[])=>({hp,statuses,card_id:'S0-WAR-H001'});
const attack={kind:'incoming_attack',response_owner:'AI',card_id:'S0-THF-011',
  source_side:'PLAYER',source_lane:'CENTER',target_side:'AI',target_lane:'LEFT',
  attack_type:'Area Attack',damage_type:'Magical',damage:20,
  multi_sequence:{affected_lanes:['LEFT','CENTER','RIGHT'],index:0},
  options:[{card_id:'SECRET',hand_index:0,hidden_cost:'private'}]};
const newBoard=(r=null,pending=null,values={})=>({round:3,responseWindow:r,pending,
  playerHeroes:{LEFT:hero(),CENTER:hero(),RIGHT:hero()},
  aiHeroes:{LEFT:hero(values.left??100,values.ls||[]),CENTER:hero(values.center??100,values.cs||[]),RIGHT:hero(values.right??100,values.rs||[])}});
const ledger=new PvpCombatPresentationLedger();
const before=newBoard();
const first=newBoard(attack);
ledger.capture(before,first);
assert.equal(ledger.forSeat(1).length,0,'Start of Area should never emit FX');
const nested={kind:'incoming_card',response_owner:'AI',original_attack_context:attack,
  options:[{card_id:'RESPONSE-SECRET'}],hidden:'do not project'};
const inner=newBoard(nested,null,{left:80,ls:[{name:'Poison',duration:3}]});
ledger.capture(first,inner);
assert.equal(ledger.forSeat(1).length,0,'Nested Response must not partially reveal animation');
const nextAttack={...attack,target_lane:'CENTER',multi_sequence:{...attack.multi_sequence,index:1}};
const middle=newBoard(nextAttack,null,{left:80,ls:[{name:'Poison',duration:3}]});
ledger.capture(inner,middle);
assert.equal(ledger.forSeat(1).length,0,'Second target pending');
const p={type:'legacy_defeat_choice',decision_side:'AI'};
const pause=newBoard(null,p,{left:80,ls:[{name:'Poison',duration:3}],center:60,cs:[{name:'Burn',duration:2}]});
ledger.capture(middle,pause);
assert.equal(ledger.forSeat(1).length,0,'Mandatory post-hit choice must not publish partial Area results');
const finish=newBoard(null,null,{left:80,ls:[{name:'Poison',duration:3}],center:60,cs:[{name:'Burn',duration:2}],right:100});
ledger.capture(pause,finish);
const events=ledger.forSeat(1);assert.equal(events.length,1);
assert.equal(events[0].type,'PVP_COMBAT_RESOLVED');
assert.deepEqual(events[0].targets.map(x=>x.lane),['LEFT','CENTER','RIGHT']);
assert.deepEqual(events[0].targets.map(x=>x.damage),[20,40,0]);
assert.deepEqual(events[0].targets[0].statuses,['Poison']);
assert.deepEqual(events[0].targets[1].statuses,['Burn']);
assert.equal(JSON.stringify(events).includes('SECRET'),false);
const reversed=ledger.forSeat(2);
assert.equal(reversed[0].source_side,'AI','Mirrored attacker from seat 2');
assert.equal(reversed[0].target_side,'PLAYER','Mirrored defender from seat 2');
assert.ok(reversed[0].targets.every(x=>x.side==='PLAYER'));
reversed[0].targets[0].statuses.push('EVIL');
assert.deepEqual(ledger.forSeat(1)[0].targets[0].statuses,['Poison'],'Public projection is cloned');
ledger.capture(finish,finish);
assert.equal(ledger.forSeat(1).length,1,'Polling does not duplicate combat commit');

const single=new PvpCombatPresentationLedger();
const stAttack={kind:'incoming_attack',card_id:'S0-WAR-001',source_side:'AI',source_lane:'RIGHT',
  target_side:'PLAYER',target_lane:'CENTER',damage_type:'Physical',attack_type:'Single Target',
  options:[{card_id:'HIDDEN-RESPONSE'}]};
single.capture(newBoard(),newBoard(stAttack));
single.capture(newBoard(stAttack),newBoard(null,null,{left:100}));
assert.equal(single.forSeat(1)[0].targets.length,1,'Single-target attack recorded without Area');
assert.equal(single.forSeat(2)[0].source_side,'PLAYER');
assert.equal(single.forSeat(2)[0].targets[0].side,'AI');

// A masked nested Response only exposes the declared Attack, not options.
const view=viewerSafeBoard({appState:{
  playerHand:[],aiHand:['SECRET-HAND'],playerDeck:['HIDDEN'],aiDeck:['SECRET-DECK'],
  playerLegacy:[],aiLegacy:[],playerManaDeck:[],aiManaDeck:[],
  playerManaPoolCards:[],aiManaPoolCards:[],
  responseWindow:nested,pending:null,
  presentationEvents:[]}}, {seat:1,revision:30,secret:Buffer.alloc(32,5)});
assertViewerSafeBoard(view);
assert.equal(view.appState.responseWindow.private_masked,true);
assert.equal(view.appState.responseWindow.original_attack_context.card_id,'S0-THF-011');
assert.deepEqual(view.appState.responseWindow.original_attack_context.affected_lanes,['LEFT','CENTER','RIGHT']);
assert.equal('options' in view.appState.responseWindow,false);
assert.equal('options' in view.appState.responseWindow.original_attack_context,false);
assert.equal('hidden' in view.appState.responseWindow,false);

const base=readFileSync('public/battle/shared-app/app-runtime.js','utf8');
// Donor parity marker verified against RC39 source during integration; self-contained offline regression.
const start=base.indexOf('/* RC36.8 Hotfix3 retained in RC38:');
const stop=base.indexOf('function buildPresentationPlan(s){',start);
assert.ok(start>0 && stop>start);
const ctx={window:{GL_APP_MODE:'PVP'},console,Set,Map,Math,Number,String,Array,presentationPrimed:true,
  findActiveAttackWindow:s=>s.responseWindow?.kind==='incoming_attack'?s.responseWindow:
    s.responseWindow?.original_attack_context||s.pending?.incoming_response_window||null};
vm.createContext(ctx);vm.runInContext(base.slice(start,stop),ctx);
const vh=({left=100,center=100,right=100,ls=[],cs=[]}={})=>({
  hero:{AI:{LEFT:{hp:left,statuses:ls,legacy:false},CENTER:{hp:center,statuses:cs,legacy:false},RIGHT:{hp:right,statuses:[],legacy:false}},PLAYER:{}}});
ctx.pvpAttackVisualPlan({round:3,responseWindow:attack},vh(),vh());
assert.equal(ctx.pvpHeroVisualDuringArea({hp:80,statuses:[{name:'Poison',duration:2}]},'AI','LEFT').hp,100,'Area HP held until all Responses');
assert.equal(ctx.pvpHeroVisualDuringArea({hp:80,statuses:[{name:'Poison',duration:2}]},'AI','LEFT').statuses.length,0,'Area icon held until all Responses');
assert.equal(ctx.pvpAttackVisualPlan({responseWindow:null,pending:{type:'legacy_defeat_choice'}},vh({left:80}),vh()),null);
assert.equal(ctx.pvpHeroVisualDuringArea({hp:80,statuses:[{name:'Poison',duration:2}]},'AI','LEFT').hp,100);
const eventView={presentation:events};
const committed=ctx.pvpAttackVisualPlan({},eventView,eventView);
assert.equal(committed.length,1);
assert.equal(committed[0].targets[0].damage,20);
assert.equal(ctx.pvpAttackVisualPlan({},eventView,eventView),null,'Replay-safe event id');
assert.equal(ctx.pvpHeroVisualDuringArea({hp:80,statuses:[{name:'Poison',duration:2}]},'AI','LEFT').hp,80,'Unfreeze after final commit');

// Popup parity with VS AI RC39: Rank Up/Scouting must use center stage.
const donorMarker="if(p.type==='trial_rankup_return_exp'||p.type==='scouting_exp_selection')return'discard';";
assert.ok(base.includes(donorMarker));
assert.match(base,/titleText=scouting\?'SCOUTING — DISCARD OPPONENT EXP':expReturn\?'RANK '/);
assert.match(base,/if\(expReturn\|\|scouting\)\{[\s\S]*?intent\('handleChoiceConfirm',\[\]\);/);
assert.match(base,/const p=s.pending,allowed=\['card_search_choice','legacy_card_choice','crystal_ball_reorder'\]/);
assert.match(base,/legacy_defeat_choice/);
assert.match(base,/if\(!game\|\|raw.length<10\)return false;/);
assert.match(base,/const groups=\[\];for\(let i=0;i<5;i\+\+\)/);
const network=readFileSync('public/battle/runtime/pvp-network.js','utf8');
assert.doesNotMatch(network,/if\(name==='beginPlayFromHand'\)name='beginPlayFromHandFast'/);
const calls=[],source={type:'source_selection',decision_side:'PLAYER',source_side:'PLAYER',legal_sources:['LEFT']};
applyOptimizedPvpIntent({bridge:{applyServerIntent:(name,args)=>{calls.push(name);return{ok:true}}},readPending:()=>source,name:'beginPlayFromHandFast',args:[0]});
assert.deepEqual(calls,['beginPlayFromHand']);
const lobby=readFileSync('public/index.html','utf8');
assert.match(lobby,/rel="icon"[^>]*href="battle\/engine\/assets\/favicon.png"/);
assert.ok(existsSync('public/battle/engine/assets/favicon.png'));
console.log('PASS RC39 RC2: authoritative Area commit, nested privacy, both seat projections, HP/status hold, no replay, donor popup, manual Skill Hero, opening 5+5, favicon');
