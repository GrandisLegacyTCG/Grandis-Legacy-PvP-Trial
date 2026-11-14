/* RC9 Stage 3 follow-up: 6 PvP UI/recipient/attribution fixes. No hosting. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
import {PvpDiscardPresentationLedger} from '../server/discard-presentation.mjs';
import {annotatePlayerHistoryEffects} from '../server/pvp-history-effects.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const src=read('../public/battle/shared-app/app-runtime.js')+'\n'+read('./fixtures/rc9-legacy-cardplayed-helpers.js');
const css=read('../public/battle/shared-ui/battlefield-ui.css');
let passed=0;
function check(name,fn){fn();console.log('PASS '+name);passed++;}
function bodyOf(name){
  const start=src.indexOf('function '+name+'('),end=src.indexOf('\nfunction ',start+1);
  assert.ok(start>=0&&end>start,'Function not available: '+name);
  return src.slice(start,end);
}
const catalog={
  'S0-MAG-001':'Arcane Disruption','S0-WAR-H004':'Bromir Oathforge',
  'S0-ARC-H004':'Akra Norixius','S0-WAR-009':'Aether Slash',
  'S0-THF-010':'Scout Discard','S0-EVT-003':'Scouting','S0-ARC-007':'Dragon Scale'
};
const names=id=>({name:catalog[id]||id||'Card',subtype:'Magical Attack'});
const notices=[],timers=[],revealBatches=[];
let endReveal=null;
const cv=names;
const context={window:{GL_APP_MODE:'PVP'},Map,Set,Array,Number,String,Object,console,
  cv,esc:x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
  art:id=>'card-art/'+id+'.webp',shardArt:sh=>sh.kind==='CLASS'?'card-art/S0-MAN-003.webp':'card-art/S0-MAN-001.webp',
  sideHeroes:()=>({}),heroImageId:h=>h?.card_id||null,
  st:()=>context.currentState,glPresentationEpoch:1,
  resolvedHistory:[],playedChronology:(a,b)=>Number(a.played_event_order||0)-Number(b.played_event_order||0),
  queuePresentationNotice:(...args)=>notices.push(args),pvpNoticeMs:n=>n+1000,
  playerManaHost:{querySelector:()=>({id:'face-up-shard-slot'})},
  zoneEl:()=>({querySelector:()=>({id:'shard-deck-slot'})}),
  runPairMotions:(parts,duration,done)=>{revealBatches.push({parts,duration});endReveal=done;},
  setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length}
};
context.currentState={pvpActionEventsBySide:{PLAYER:[],AI:[]}};
vm.createContext(context);
for(const name of ['pvpPlayedHeroName','pvpPlayedActionName','pvpPlayedDamageResults',
  'pvpPlayedEffectRows','pvpPlayedRelatedCards','pvpPlayedAdditionalLines',
  'pvpPlayedHeroOutcomeHtml','pvpPlayedResponseDetail','pvpPlayedDetailHtml',
  'describeResolvedManaShards','presentPvpManaLossNotice',
  'presentPvpManaLossAfterReveal','pvpDiscardHistoryEvents'])
  vm.runInContext(bodyOf(name),context,{filename:name+'.js'});

const st=()=>({round:3,phase:'Battle',turn:'AI',playerHand:[],aiHand:[],playerDeck:[],aiDeck:[],
  playerDiscard:[],aiDiscard:[],playerLegacy:[],aiLegacy:[],playerManaDeck:[],aiManaDeck:[],
  playerManaPoolCards:[],aiManaPoolCards:[],playerHeroes:{},aiHeroes:{},
  pvpActionEventsBySide:{PLAYER:[],AI:[]},presentationEvents:[],pending:null,responseWindow:null,log:[]});
const manaEvent=(side,source_side)=>({id:'MANA-LOSS-57',type:'MANA_LOSS_COMMITTED',side,source_side,
  effect_name:'Arcane Disruption',effect_card_id:'S0-MAG-001',effect_action_id:'pvp_PLAYER_atk_3',
  removed_count:1,loss_kind:source_side===side?'ABILITY_SPEND':'OPPONENT_REMOVE',
  removed_shards:[{kind:'CLASS',class_name:'Mage'}]});
check('MANA BURN: attacker seat projection has no notification, target projection has one',()=>{
  const attack=st();attack.presentationEvents=[manaEvent('AI','PLAYER')];
  const a=viewerSafeBoard({appState:attack},{seat:1,revision:10,secret:Buffer.alloc(32)});
  assert.equal(a.appState.presentationEvents.length,0);
  const target=st();target.presentationEvents=[manaEvent('PLAYER','AI')];
  const b=viewerSafeBoard({appState:target},{seat:2,revision:10,secret:Buffer.alloc(32)});
  assert.equal(b.appState.presentationEvents.length,1);
  assert.equal(b.appState.presentationEvents[0].removed_shards[0].class_name,'Mage');
  assertViewerSafeBoard(a);assertViewerSafeBoard(b);
  const self=st();self.presentationEvents=[manaEvent('PLAYER','PLAYER')];
  assert.equal(viewerSafeBoard({appState:self},{seat:1,revision:10,secret:Buffer.alloc(32)}).appState.presentationEvents.length,0);
});
check('Mana choice must resolve and face-up selected shard must fly BEFORE target toast',()=>{
  notices.length=0;revealBatches.length=0;timers.length=0;endReveal=null;
  const note=manaEvent('PLAYER','AI');
  context.presentPvpManaLossAfterReveal(note);
  assert.equal(revealBatches.length,1);
  assert.equal(revealBatches[0].duration,450);
  assert.ok(revealBatches[0].parts[0].src.includes('S0-MAN-003'));
  assert.equal(notices.length,0,'notification appeared before reveal completion');
  assert.ok(endReveal,'animation completion callback missing');
  endReveal();
  assert.equal(notices.length,0);
  assert.equal(timers.length,1);assert.equal(timers[0].ms,180);
  timers[0].fn();
  assert.equal(notices.length,1);
  assert.ok(notices[0][1].includes('Opponent used Arcane Disruption'));
  assert.ok(notices[0][2].includes('Removed 1 Blue Mana Shard.'));
  context.presentPvpManaLossAfterReveal(manaEvent('AI','PLAYER'));
  assert.equal(notices.length,1);
});
check('Attack consumed through opponent PASS is not a fake opponent DISCARDED event',()=>{
  const before=st(),after=structuredClone(before);
  // Card left hand earlier when played. It finishes in Discard only after
  // defending player submits PASS; the finalization has UNKNOWN initial zone.
  before.pvpActionEventsBySide.PLAYER=[{id:'pvp_PLAYER_atk',label:'ATK',card_id:'S0-MAG-001'}];
  after.pvpActionEventsBySide.PLAYER=structuredClone(before.pvpActionEventsBySide.PLAYER);
  after.playerDiscard=['S0-MAG-001'];
  const ledger=new PvpDiscardPresentationLedger();ledger.capture(before,after,2);
  assert.equal(ledger.forSeat(1).length,0);
  assert.equal(ledger.forSeat(2).length,0);
});
check('Explicit opponent discard remains readable, tied to true card/zone/action',()=>{
  const before=st(),after=structuredClone(before);
  before.playerHand=['S0-THF-010'];after.playerDiscard=['S0-THF-010'];
  after.pvpActionEventsBySide.AI=[{id:'pvp_AI_scout_1',card_id:'S0-EVT-003',label:'EVENT',title:'Scouting'}];
  const ledger=new PvpDiscardPresentationLedger();ledger.capture(before,after,2);
  assert.equal(ledger.forSeat(1).length,1);
  assert.equal(ledger.forSeat(2).length,0);
  const note=ledger.forSeat(1)[0];
  assert.equal(note.origin,'HAND');assert.equal(note.effect_action_id,'pvp_AI_scout_1');
  const view=viewerSafeBoard({appState:after},{seat:1,revision:4,secret:Buffer.alloc(32)});
  view.appState.presentationEvents.push(note);annotatePlayerHistoryEffects(view);
  assert.equal(view.appState.pvpActionEventsBySide.AI[0].effect_results[0].card_ids[0],'S0-THF-010');
  const tiles=context.pvpDiscardHistoryEvents(view.appState);assert.equal(tiles.length,1);
  assert.ok(context.pvpPlayedDetailHtml(tiles[0]).includes('From</strong><p>Hand'));
  assert.ok(context.pvpPlayedDetailHtml(tiles[0]).includes('Scouting'));
});
check('Neither unknown origin nor ordinary played-card custody yields DISCARDED tile',()=>{
  const x=st();x.playerPlayedEvents=[{id:'act',card_id:'S0-MAG-001',label:'ATK',card_movements:[
    {from:'Hand',to:'Discard',card_ids:['S0-MAG-001'],count:1}]}];
  x.presentationEvents=[{id:'bad-notice',type:'PVP_OPPONENT_DISCARD',side:'PLAYER',origin:'UNKNOWN',
    card_ids:['S0-MAG-001'],count:1,effect_card_id:null}];
  assert.equal(context.pvpDiscardHistoryEvents(x).length,0);
});
check('Card Played uses VS AI-style response trace & per-Hero breakdown (no fake zero damage)',()=>{
  const attack={id:'pvp_PLAYER_a1',side:'PLAYER',card_id:'S0-MAG-001',label:'ATK',
    attack_type:'Magical Attack',source_hero_card_id:'S0-WAR-H004',
    target_hero_card_id:'S0-ARC-H004',target_side:'AI',target_lane:'CENTER',damage_type:'Magical',
    damage_by_hero:[{name:'Akra Norixius',side:'AI',lane:'CENTER',summary:{
      base_damage:50,damage_after_modifiers:50,response_block:50,
      actual_hp_damage:0,target_hp_before:110,target_hp_after:110}}]};
  const defense={id:'pvp_AI_def_1',side:'AI',card_id:'S0-ARC-007',label:'DEF',
    response_to_event_id:'pvp_PLAYER_a1',source_hero_card_id:'S0-ARC-H004',
    defense_text:'Dragon Scale blocks 50 incoming Magical damage.'};
  context.resolvedHistory=[attack,defense];
  const html=context.pvpPlayedDetailHtml(attack);
  for(const item of ['Used By','Bromir Oathforge','Response Detail','Opponent used Dragon Scale',
    'Damage Resolution — by Hero','Akra Norixius','Base Damage: 50','Block: -50 Damage',
    'Related Cards']) assert.ok(html.includes(item),item+' missing');
  assert.ok(!html.includes('Damage Dealt: 0'));
  assert.ok(!html.includes('Resolved by Runtime'));
  assert.ok(!html.includes('120 → 70'),'must not synthesize HP changes');
});
check('Mana Burn type is visible only to target Card Played, attacker gets count only',()=>{
  const base={card_id:'S0-MAG-001',label:'ATK',mana_result:{mode:'BURN',removed_count:1}};
  const attacker=context.pvpPlayedEffectRows(base);
  assert.equal(attacker.length,1);
  assert.ok(attacker[0].value.includes('type hidden'));
  assert.ok(!attacker[0].value.includes('Blue'));
  const target=context.pvpPlayedEffectRows({...base,effect_results:[{
    id:'MANA-LOSS-57',kind:'MANA_REMOVAL',count:1,removed_shards:[{kind:'CLASS',class_name:'Mage'}]}]});
  assert.equal(target.length,1);
  assert.equal(target[0].value,'Removed 1 Blue Mana Shard.');
});
check('Badge stroke removed, detail spacing compressed, network files unchanged',()=>{
  const badge=css.slice(css.indexOf('.gl-played-result-badge.gl-played-owner-badge{'),
    css.indexOf('/* Semantic PvP Card Played Detail'));
  assert.ok(badge.includes('border:0'));
  assert.ok(!badge.includes('border-color:#67b8ff')&&!badge.includes('border-color:#ff8f90'));
  assert.ok(css.includes('.gl-played-gameplay-row>strong{display:block')||css.includes('.gl-played-gameplay-row>strong{display:block'));
  const hashes={
    '../server/ws-lite.mjs':'1e29b60b2ce0ee357df98518db12a2b5063c5a224635df478d7588f8c5862047',
    '../public/battle/runtime/pvp-mana-draft.js':'0dfb813cf7c549f01f83d6c7cb46fd5192fc78d554fbd53de90e8b2b572d92b7'
  };
  for(const [path,hash] of Object.entries(hashes))
    assert.equal(createHash('sha256').update(read(path)).digest('hex'),hash,'Unexpected network/commit rewrite: '+path);
  assert.ok(src.includes('presentPvpManaLossAfterReveal(notice)'));
});
console.log('RC9 Stage3 PvP UI follow-up: '+passed+'/'+passed+' PASS');
