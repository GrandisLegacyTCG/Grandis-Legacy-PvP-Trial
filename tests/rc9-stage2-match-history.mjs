/* PvP RC9 Stage 2: recipient-safe Card Played, resolved damage, notifications.
   No extra WebSocket path; no live deployment or API requests in this test. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {viewerSafeBoard, assertViewerSafeBoard} from '../server/viewer-safe.mjs';
import {annotatePlayerHistoryEffects, stripPrivateHistoryEffectsForSpectator} from '../server/pvp-history-effects.mjs';
import {PvpDiscardPresentationLedger} from '../server/discard-presentation.mjs';

const source=readFileSync(new URL('../public/battle/shared-app/app-runtime.js',import.meta.url),'utf8');
const read=x=>readFileSync(new URL(x,import.meta.url),'utf8');
let checks=0;
function check(label,fn){fn();checks++;console.log('PASS '+label);}
function bodyOf(name){
  const start=source.indexOf('function '+name+'(');
  assert.ok(start>=0,'Missing UI function '+name);
  const after=source.indexOf('\nfunction ',start+1);
  assert.ok(after>start,'Unterminated UI function '+name);
  return source.slice(start,after);
}
const cv=id=>({
  'S0-MAG-019':{name:"Flame Dragon's Wrath",subtype:'Magical Attack'},
  'S0-ARC-010':{name:'Arrow Barrage',subtype:'Physical Attack'},
  'S0-ARC-017':{name:'Dual Arrow',subtype:'Physical Attack'},
  'S0-MAG-H004':{name:'Lucien Voss'},'S0-WAR-H004':{name:'Bromir Oathforge'},
  'S0-EVT-003':{name:'Scouting'},'S0-THF-010':{name:'Thief Test Card'},
  'S0-WAR-009':{name:'Aether Slash'},'S0-THF-020':{name:'Smoke Screen'},
  'S0-MAG-005':{name:'Secret Mage Card'},'S0-EVT-007':{name:'Intercept'}
})[id]||{name:id||'Unknown'};
const notices=[];
const context={console,window:{GL_APP_MODE:'PVP'},Map,Set,Number,Array,String,Object,
  esc:x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
  cv,art:id=>'card-art/'+id+'.webp',sideHeroes:()=>({}),heroImageId:h=>h?.card_id||null,
  st:()=>context.currentState,resolvedHistory:[],playedChronology:(a,b)=>Number(a.played_event_order||0)-Number(b.played_event_order||0),
  queuePresentationNotice:(...args)=>notices.push(args),pvpNoticeMs:n=>n+1000};
context.currentState={playerPlayedEvents:[],opponentPlayedEvents:[],pvpActionEventsBySide:{PLAYER:[],AI:[]}};
vm.createContext(context);
for(const name of ['pvpPlayedHeroName','pvpPlayedActionName','pvpPlayedDamageResults','pvpPlayedEffectRows',
  'pvpPlayedRelatedCards','pvpPlayedAdditionalLines','pvpPlayedDetailHtml','pvpIncomingDamageWording',
  'describeResolvedManaShards','presentPvpManaLossNotice','pvpDiscardHistoryEvents']){
  vm.runInContext(bodyOf(name),context,{filename:'app-runtime:'+name});
}
const hero=()=>({card_id:'S0-WAR-H004',hp:100,statuses:[],exp_cards:[],attachments:[]});
const state=()=>({round:3,phase:'Battle',turn:'AI',playerHand:[],aiHand:[],playerDeck:[],aiDeck:[],playerDiscard:[],aiDiscard:[],
  playerLegacy:[],aiLegacy:[],playerManaDeck:[],aiManaDeck:[],playerManaPoolCards:[],aiManaPoolCards:[],
  playerHeroes:{LEFT:hero(),CENTER:hero(),RIGHT:hero()},aiHeroes:{LEFT:hero(),CENTER:hero(),RIGHT:hero()},
  pvpActionEventsBySide:{PLAYER:[],AI:[]},presentationEvents:[],pending:null,responseWindow:null,log:[]});
const projected=s=>viewerSafeBoard({appState:s},{seat:1,revision:1,secret:Buffer.alloc(32,7)});
const action=(id,card_id,label='ATK',extra={})=>({id,card_id,label,title:cv(card_id).name,source_side:'AI',source_lane:'LEFT',
  target_side:'PLAYER',target_lane:'CENTER',played_event_order:10,round:2,...extra});

check('Damage audit includes Burn, prevention and real Status durations without hidden state',()=>{
  const s=state();s.aiHand=['S0-MAG-005'];s.aiDeck=['S0-MAG-005'];
  s.pvpActionEventsBySide.AI=[action('atk-A','S0-WAR-009','ATK',{
    damage_type:'Magical',attack_type:'Magical Attack',damage_breakdown_by_hero:[{
      side:'PLAYER',lane:'CENTER',name:'Bromir Oathforge',summary:{base_damage:20,damage_after_modifiers:20,
        response_block:0,passive_reduction:10,active_reduction:0,burn_damage:10,actual_hp_damage:20,
        target_hp_before:30,target_hp_after:10}}],status_breakdown_by_hero:[{
        side:'PLAYER',lane:'CENTER',name:'Bromir Oathforge',status:'Burn',previous_duration:1,final_duration:3}]
  })];
  const p=projected(s);assertViewerSafeBoard(p);
  const e=p.appState.opponentPlayedEvents[0];
  assert.equal(e.damage_by_hero[0].summary.burn_damage,10);
  assert.equal(e.damage_by_hero[0].summary.passive_reduction,10);
  assert.equal(e.status_by_hero[0].before,1);
  assert.equal(e.status_by_hero[0].after,3);
  assert.equal(p.appState.aiHand[0],'__HIDDEN_CARD_BACK__');
  assert.ok(!JSON.stringify(p).includes('Secret Mage Card'));
});

check('Part5-style dedup shows actual damage/HP/Burn once and unique result text',()=>{
  const e={id:'atk-a',card_id:'S0-WAR-009',side:'AI',label:'ATK',source_hero_card_id:'S0-MAG-H004',
    target_hero_card_id:'S0-WAR-H004',target_side:'PLAYER',target_lane:'CENTER',damage_type:'Magical',
    damage_by_hero:[{name:'Bromir Oathforge',side:'PLAYER',lane:'CENTER',summary:{base_damage:20,
      damage_after_modifiers:20,passive_reduction:10,burn_damage:10,actual_hp_damage:20,
      target_hp_before:30,target_hp_after:10}}],result_lines:[
    'Damage after modifiers: 20.','Passive reduction: 10.','Final HP damage: 20.',
    'Burn added +10 damage.','Bromir Oathforge HP: 30 -> 10','Opponent activated Invincible.']};
  const html=context.pvpPlayedDetailHtml(e);
  for(const word of ['Burn Added','Damage Dealt','Damage Prevention','<strong>HP</strong>'])
    assert.equal(html.split(word).length-1,1,word+' duplicated');
  assert.ok(html.includes('Opponent activated Invincible.'));
  for(const word of ['Damage after modifiers: 20.','Final HP damage: 20.',
    'Burn added +10 damage.','Resolved by Runtime','Resolution: RESOLVED'])assert.ok(!html.includes(word),word);
  assert.equal(html.split('Bromir Oathforge HP:').length-1,0);
});
check('Older damage audit retains a unique Burn result when no structured Burn exists',()=>{
  const rows=context.pvpPlayedAdditionalLines({damage_summary:{actual_hp_damage:20},
    result_lines:['Damage after modifiers: 20.','Burn added +10 damage.']},[]);
  assert.equal(rows.length,1);assert.ok(rows[0].includes('Burn added'));
});
check('Multi-hit same Hero is aggregated, multi-target Heroes are separate',()=>{
  const entries=[
    {name:'Bromir Oathforge',side:'PLAYER',lane:'CENTER',summary:{actual_hp_damage:10,target_hp_before:80,target_hp_after:70}},
    {name:'Bromir Oathforge',side:'PLAYER',lane:'CENTER',summary:{actual_hp_damage:20,target_hp_before:70,target_hp_after:50}},
    {name:'Akra',side:'PLAYER',lane:'LEFT',summary:{actual_hp_damage:30,target_hp_before:100,target_hp_after:70}}];
  const out=context.pvpPlayedDamageResults({label:'ATK',card_id:'S0-ARC-010',damage_type:'Physical',damage_by_hero:entries});
  assert.ok(out.some(x=>x.title==='Bromir Oathforge — Damage Dealt'&&x.value.includes('30 Physical Damage (2 hits)')));
  assert.ok(out.some(x=>x.title==='Bromir Oathforge — HP'&&x.value==='80 → 50'));
  assert.equal(out.filter(x=>x.title.includes('Damage Dealt')).length,2);
});
check('Runtime Area Attack subtype wins over stale printed Magical artwork label',()=>{
  assert.equal(context.pvpPlayedActionName({label:'ATK',card_id:'S0-MAG-019',attack_type:'Area Attack'}),'Area Attack');
  assert.equal(context.pvpPlayedActionName({label:'ATK',card_id:'S0-ARC-017',attack_type:'Physical Attack'}),'Physical Attack');
});
check('Only committed Mana Steal may show real gain alongside recipient-only removal',()=>{
  notices.length=0;
  const id='pvp_AI_test_22';context.currentState={pvpActionEventsBySide:{PLAYER:[],AI:[action(id,'S0-WAR-009','ATK',{
    mana_result:{mode:'STEAL',removed_count:2,gained_count:1}})]}};
  context.presentPvpManaLossNotice({type:'MANA_LOSS_COMMITTED',side:'PLAYER',source_side:'AI',
    effect_name:'Aether Slash',effect_action_id:id,removed_count:2,
    removed_shards:[{kind:'MANA'},{kind:'CLASS',class_name:'Mage'}]});
  assert.equal(notices.length,1);assert.ok(notices[0][2].includes('Gained 1 Mana Shard.'));
  assert.equal(notices[0][3],3000);
  context.presentPvpManaLossNotice({type:'MANA_LOSS_COMMITTED',side:'AI',source_side:'PLAYER',removed_count:1});
  assert.equal(notices.length,1,'Opponent-side private notice must not render');
  context.presentPvpManaLossNotice({type:'MANA_LOSS_COMMITTED',side:'PLAYER',source_side:'AI',effect_action_id:'not-this-id',removed_count:1,removed_shards:[{kind:'MANA'}]});
  assert.ok(!notices[1][2].includes('Gained'),'unlinked Mana gain incorrectly guessed');
});
check('Scouting EXP discard remains private to affected player and linked to exact action',()=>{
  const before=state(),after=structuredClone(before);
  const eff='pvp_AI_scout_event';after.pvpActionEventsBySide.AI=[action(eff,'S0-EVT-003','EVENT')];
  before.playerHeroes.CENTER.exp_cards=['S0-THF-010'];after.playerHeroes.CENTER.exp_cards=[];
  after.playerDiscard.push('S0-THF-010');
  const ledger=new PvpDiscardPresentationLedger();ledger.capture(before,after,2);
  assert.equal(ledger.forSeat(2).length,0);
  const note=ledger.forSeat(1)[0];assert.equal(note.origin,'EXP');assert.equal(note.effect_action_id,eff);
  const projection=projected(after);
  projection.appState.presentationEvents.push(note);
  annotatePlayerHistoryEffects(projection);
  assert.equal(projection.appState.opponentPlayedEvents[0].effect_results[0].origin,'EXP');
  context.currentState=projection.appState;
  const tiles=context.pvpDiscardHistoryEvents(projection.appState);
  assert.equal(tiles.length,1);assert.equal(tiles[0].source_action_id,eff);
  assert.equal(tiles[0].source_action_side,'AI');
  assert.equal(tiles[0].side,'PLAYER');
  context.resolvedHistory=[{...projection.appState.opponentPlayedEvents[0],side:'AI'},...tiles];
  const parent=context.pvpPlayedRelatedCards(tiles[0]);
  assert.ok(parent.includes('Caused By')&&parent.includes('data-gl-related-id="'+eff+'"'));
  const child=context.pvpPlayedRelatedCards(context.resolvedHistory[0]);
  assert.ok(child.includes('Discarded Cards')&&child.includes('data-gl-related-id="'+tiles[0].id+'"'));
  assertViewerSafeBoard(projection);
  const spectator=structuredClone(projection);stripPrivateHistoryEffectsForSpectator(spectator);
  spectator.appState.presentationEvents=spectator.appState.presentationEvents.filter(x=>x.type!=='PVP_OPPONENT_DISCARD');
  assert.ok(!JSON.stringify(spectator.appState.opponentPlayedEvents).includes('S0-THF-010'));
});
check('Repeated identical cards never borrow another action private discard result',()=>{
  const board={pvpRecipientSeat:1,appState:{pvpActionEventsBySide:{PLAYER:[],AI:[
    action('pvp_AI_dup_1','S0-EVT-003','EVENT'),action('pvp_AI_dup_2','S0-EVT-003','EVENT')]},
    presentationEvents:[{id:'pvp-discard-test',type:'PVP_OPPONENT_DISCARD',side:'PLAYER',
      effect_card_id:'S0-EVT-003',effect_action_id:null,origin:'HAND',card_ids:['S0-THF-010'],count:1}]}};
  annotatePlayerHistoryEffects(board);
  assert.ok(board.appState.pvpActionEventsBySide.AI.every(x=>!x.effect_results),'ambiguous discard attached to wrong card');
  board.appState.presentationEvents[0].effect_action_id='pvp_AI_dup_1';
  annotatePlayerHistoryEffects(board);
  assert.equal(board.appState.pvpActionEventsBySide.AI[0].effect_results[0].card_ids[0],'S0-THF-010');
  assert.ok(!board.appState.pvpActionEventsBySide.AI[1].effect_results);
});
check('Same card movement is shown only once when matched by committed discard note',()=>{
  const rows=context.pvpPlayedEffectRows({effect_results:[{id:'notice-1',kind:'DISCARD',origin:'HAND',card_ids:['S0-THF-010']}],
    card_movements:[{from:'Hand',to:'Discard',card_ids:['S0-THF-010'],count:1}]});
  assert.equal(rows.length,1);assert.equal(rows[0].title,'Cards Discarded (Hand)');
});
check('Damage banner: one formula; no printed fake 0; buffs use base -> modified',()=>{
  assert.equal(context.pvpIncomingDamageWording({damage:60,damage_type:'Magical'}),'60 Magical Damage');
  assert.equal(context.pvpIncomingDamageWording({damage:80,base_damage:60,damage_type:'Magical'}),
    '60 Magical Damage → 80 Magical Damage');
  assert.equal(context.pvpIncomingDamageWording({damage:60,base_damage:0,damage_type:'Physical',
    damage_formula:{unit_damage:10,count:6,unit_label:'Mana Shards',scaled_damage:60}}),
    '10 × 6 Mana Shards = 60 Physical Damage');
  assert.equal(context.pvpIncomingDamageWording({damage:80,damage_type:'Physical',
    damage_formula:{unit_damage:10,count:6,unit_label:'Mana Shards',scaled_damage:60}}),
    '10 × 6 Mana Shards = 60 Physical Damage → 80 Physical Damage');
  assert.ok(!context.pvpIncomingDamageWording({damage:20,damage_type:'Physical'}).includes('before Response'));
});
check('One socket, unchanged server-headless & local Mana draft, no action-result fetch',()=>{
  // Pinned RC9 Stage1 hashes ensure the test remains self-contained in a clean
  // extracted Stage2 FULL ZIP; it never reads the developer working directory.
  const sha=body=>createHash('sha256').update(body).digest('hex');
  const hashes={
    'server/headless-rc32.mjs':'0cfb172e5bafb30877d78c296a921c69c1fc8ed23b29a008ed19120c156c6d54',
    'server/ws-lite.mjs':'1e29b60b2ce0ee357df98518db12a2b5063c5a224635df478d7588f8c5862047',
    'public/battle/runtime/pvp-network.js':'60d10aa8d24923723225eb1fb4186e6da0369313395044e7c0769d0814c2b5ec',
    'public/battle/runtime/pvp-mana-draft.js':'0dfb813cf7c549f01f83d6c7cb46fd5192fc78d554fbd53de90e8b2b572d92b7'
  };
  for(const [file,hash] of Object.entries(hashes))
    assert.equal(sha(read('../'+file)),hash,'Stage2 unexpectedly changed '+file);
  const engine=read('../public/battle/engine/shared-app/app.bundle.js');
  const auditAddition='burn_damage:Number(result&&result.burn_damage||0),';
  assert.ok(engine.includes(auditAddition),'Missing single immutable Burn audit');
  const original=engine.replace(auditAddition,'');
  assert.equal(sha(original),'509d4143ccaa1c7f7ed27dc129f9569781f97a28f5fae6e6f8c72024f4ca17ee',
    'Engine changed beyond immutable Burn audit field');
  assert.ok(source.includes('historyKnown=new Set(resolvedHistory.map'));
  assert.ok(source.includes('if(host.dataset.glHistorySig===sig)return false'));
});
console.log('RC9 Stage2 gameplay presentation: '+checks+'/'+checks+' PASS');
