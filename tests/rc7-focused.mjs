import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
import {annotatePlayerHistoryEffects,stripPrivateHistoryEffectsForSpectator} from '../server/pvp-history-effects.mjs';
import {PvpDiscardPresentationLedger} from '../server/discard-presentation.mjs';
import {PvpCombatPresentationLedger} from '../server/combat-presentation.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const playerEvent=(id,card_id,label,extra={})=>({id,card_id,label,title:id,source_lane:'CENTER',
  source_hero_card_id:'S0-WAR-H004',target_side:'AI',target_lane:'CENTER',
  played_event_order:3,round:2,timestamp:13,...extra});
const canonical={appState:{
  playerHand:['S0-CLE-020'],aiHand:['S0-MAG-005'],playerDeck:['S0-WAR-009'],aiDeck:['S0-MAG-008'],
  playerDiscard:[],aiDiscard:[],playerLegacy:[],aiLegacy:[],playerManaDeck:[],aiManaDeck:[],
  playerManaPoolCards:[],aiManaPoolCards:[],playerHeroes:{},aiHeroes:{},
  pending:null,responseWindow:null,presentationEvents:[],log:[],
  pvpActionEventsBySide:{PLAYER:[],AI:[
    playerEvent('opponent-attack','S0-WAR-009','ATK',{
      title:'Aether Slash',damage_type:'Magical',attack_type:'Magical Attack',
      damage_breakdown_by_hero:[
        {name:'Bromir Oathforge',side:'PLAYER',lane:'CENTER',summary:{actual_hp_damage:30}},
        {name:'Bromir Oathforge',side:'PLAYER',lane:'CENTER',summary:{actual_hp_damage:20}}
      ]}),
    playerEvent('opponent-event','S0-EVT-003','EVENT',{title:'Scouting'})
  ]}
}};
const raw=structuredClone(canonical);
// Published actions may identify the opponent's played card, but never the
// identity or order of their unplayed Hand and Deck.
raw.appState.pvpActionEventsBySide.PLAYER.push(playerEvent('heal-event','S0-ITM-008','ITEM',{
  healing_by_hero:[{name:'Akra Norixius',side:'PLAYER',lane:'CENTER',healed:40}]}));
const safe=viewerSafeBoard(raw,{seat:1,revision:99,secret:Buffer.alloc(32)});
assert.equal(safe.appState.aiHand[0],'__HIDDEN_CARD_BACK__');
assert.equal(safe.appState.aiDeck[0],'__HIDDEN_CARD_BACK__');
assert.equal(safe.appState.pvpActionEventsBySide.AI[0].damage_by_hero.length,2);
assert.equal(safe.appState.pvpActionEventsBySide.AI[0].damage_type,'Magical');
assert.equal(safe.appState.pvpActionEventsBySide.PLAYER[0].healing_by_hero[0].healed,40);

// Only the owner of discarded cards is entitled to see their identities.
const before=structuredClone(canonical.appState),after=structuredClone(before);
before.playerHand=['S0-THF-010'];after.playerHand=[];after.playerDiscard=['S0-THF-010'];
after.pvpActionEventsBySide.AI[0]={id:'opponent-event',card_id:'S0-EVT-003',label:'EVENT'};
const discards=new PvpDiscardPresentationLedger();discards.capture(before,after,2);
assert.equal(discards.forSeat(2).length,0);
assert.equal(discards.forSeat(1)[0].card_ids[0],'S0-THF-010');
assert.equal(discards.forSeat(1)[0].effect_action_id,'opponent-event');
safe.appState.presentationEvents.push(...discards.forSeat(1));
// A separate Mana effect can be attached to the exact played action even when
// the user-facing effect title is generic (e.g., 'Mana Burn').
safe.appState.presentationEvents.push({id:'mana-result',type:'MANA_LOSS_COMMITTED',side:'PLAYER',
  source_side:'AI',effect_name:'Mana Burn',effect_card_id:'S0-WAR-009',effect_action_id:'opponent-attack',
  removed_count:1,removed_shards:[{kind:'MANA',class_name:''}]});
annotatePlayerHistoryEffects(safe);
const attacker=safe.appState.pvpActionEventsBySide.AI[0];
const scouting=safe.appState.pvpActionEventsBySide.AI[1];
assert.deepEqual(attacker.effect_results.map(e=>e.kind),['MANA_REMOVAL']);
assert.deepEqual(scouting.effect_results.map(e=>e.kind),['DISCARD']);
assert.equal(scouting.effect_results[0].card_ids[0],'S0-THF-010');
assert.ok(!safe.appState.pvpActionEventsBySide.PLAYER[0]?.effect_results);
assert.equal(safe.appState.opponentPlayedEvents[1].effect_results[0].card_ids[0],'S0-THF-010');
assertViewerSafeBoard(safe);
// server.js clones via JSON, which breaks the shared array aliases. The
// spectator scrub must strip ALL copies (journal and sidebar aliases).
const spectator=JSON.parse(JSON.stringify(safe));
stripPrivateHistoryEffectsForSpectator(spectator);
assert.ok(!JSON.stringify(spectator.appState.pvpActionEventsBySide).includes('S0-THF-010'));
assert.ok(!JSON.stringify(spectator.appState.opponentPlayedEvents).includes('S0-THF-010'));
assertViewerSafeBoard(spectator);

// A direct magical attack must produce magical (not hardcoded Physical) VFX.
const fightBefore=structuredClone(canonical.appState),fightAfter=structuredClone(fightBefore);
fightBefore.aiHeroes.CENTER={card_id:'S0-MAG-H004',hp:100,statuses:[]};
fightAfter.aiHeroes.CENTER={card_id:'S0-MAG-H004',hp:70,statuses:[]};
fightAfter.pvpActionEventsBySide.PLAYER=[playerEvent('new-magic','S0-MAG-009','ATK',{
  attack_type:'Magical Attack',damage_type:'Magical',target_side:'AI',target_lane:'CENTER'})];
const combat=new PvpCombatPresentationLedger();combat.capture(fightBefore,fightAfter);
assert.equal(combat.forSeat(1)[0]?.damage_type,'Magical');
assert.equal(combat.forSeat(1)[0]?.targets[0].damage,30);

const runtime=read('../public/battle/shared-app/app-runtime.js');
const css=read('../public/battle/shared-ui/battlefield-ui.css');
const engine=read('../public/battle/engine/shared-app/app.bundle.js');
const server=read('../server.js');
assert.match(runtime,/pvpPlayedDetailHtml\(/);
assert.match(runtime,/Damage Dealt/);
assert.match(runtime,/EXP Gained/);
assert.match(runtime,/HP Restored/);
assert.match(runtime,/gl-played-owner-badge/);
assert.match(runtime,/'YOU':'OPPONENT'/);
assert.match(runtime,/shown\(base\)\+' → '\+shown\(amount\)/);
assert.match(runtime,/function playPvpBattleSound\(/);
assert.match(runtime,/function playPvpCombatVisualBatch\(/);
assert.match(runtime,/function pvpCommittedHealingTargets\(/);
assert.match(runtime,/function playPvpHealingVisuals\(/);
assert.doesNotMatch(runtime,/function presentPvpCommittedDamage\(/);
assert.doesNotMatch(runtime,/queuePresentationNotice\('played'/);
assert.doesNotMatch(runtime,/queuePresentationNotice\('damage'/);
assert.doesNotMatch(runtime,/gl-pvp-impact-number\s*'/);
assert.match(css,/\.battlefield #glPvpIncomingDamage/);
assert.match(css,/\.gl-played-result-badge\.gl-played-owner-badge\.is-you/);
assert.match(css,/\.gl-played-result-badge\.gl-played-owner-badge\.is-opponent/);
assert.match(server,/annotatePlayerHistoryEffects\(safe\)/);
assert.match(server,/stripPrivateHistoryEffectsForSpectator\(safe\)/);
assert.match(engine,/pvp_event_id/);
console.log('PASS PvP RC7 focused: damage banner, history detail, Mana/Discard privacy including spectator, magical VFX, removed overlays');
