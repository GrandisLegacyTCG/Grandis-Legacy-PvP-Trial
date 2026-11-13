import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
import {PvpDiscardPresentationLedger} from '../server/discard-presentation.mjs';
import {PvpCombatPresentationLedger} from '../server/combat-presentation.mjs';

const clone=x=>structuredClone(x);
const emptyHeroes=()=>Object.fromEntries(['LEFT','CENTER','RIGHT'].map(k=>[k,{card_id:'S0-WAR-H001',hp:100,exp_cards:[],attachments:[],statuses:[]}]))
const base=()=>({round:2,phase:'Battle',turn:'PLAYER',pending:null,responseWindow:null,
  playerHand:[],aiHand:[],playerDeck:[],aiDeck:[],playerDiscard:[],aiDiscard:[],
  playerManaPoolCards:[],aiManaPoolCards:[],playerManaDeck:[],aiManaDeck:[],
  playerHeroes:emptyHeroes(),aiHeroes:emptyHeroes(),
  playerLegacy:[],aiLegacy:[],presentationEvents:[],
  pvpActionEventsBySide:{PLAYER:[],AI:[]},log:[]});
const safe=viewerSafeBoard({appState:{...base(),
  playerHand:['S0-CLE-004'],aiHand:['S0-MAG-004'],
  aiDeck:['S0-THF-001'],aiDiscard:['S0-THF-002'],
  pvpActionEventsBySide:{PLAYER:[{id:'mycard',card_id:'S0-WAR-009',label:'ATK',title:'Attack',played_event_order:11,source_lane:'CENTER',target_side:'AI',target_lane:'CENTER',result_lines:['Damage: 30','Opponent Hand: S0-THF-001'],unknown_private:{secret:'S0-THF-001'}}],
    AI:[{id:'def1',card_id:'S0-WAR-018',label:'DEF',title:'Dodge',played_event_order:12,source_lane:'CENTER',target_side:'PLAYER',target_lane:'CENTER',result_lines:['Dodged incoming attack.','Blocked 20 damage.','Saw Hand: S0-CLE-004'],privateDeck:['S0-THF-001']}]}
}},{seat:1,revision:7,secret:Buffer.alloc(32)});
assertViewerSafeBoard(safe);
assert.deepEqual(safe.appState.aiHand,['__HIDDEN_CARD_BACK__']);
assert.deepEqual(safe.appState.aiDeck,['__HIDDEN_CARD_BACK__']);
assert.equal(safe.appState.opponentPlayedEvents.length,1);
assert.equal(safe.appState.opponentPlayedEvents[0].label,'DEF');
assert.deepEqual(safe.appState.opponentPlayedEvents[0].result_lines,['Dodged incoming attack.','Blocked 20 damage.']);
assert.deepEqual(safe.appState.playerPlayedEvents[0].result_lines,['Damage: 30']);
assert.equal(JSON.stringify(safe.appState.pvpActionEventsBySide).includes('S0-THF-001'),false);
assert.equal(JSON.stringify(safe.appState.pvpActionEventsBySide).includes('S0-CLE-004'),false);

// Cards from private zones are shown only to THEIR owner. Same-color duplicates
// remain distinct and Field EXP / Hand / Deck are attributed individually.
const before=base(),after=clone(before);
before.aiHand=['S0-CLE-020','S0-CLE-020'];before.aiDeck=['S0-MAG-025','S0-MAG-027'];
before.aiHeroes.LEFT.exp_cards=['S0-WAR-011','S0-WAR-012'];
after.aiHand=['S0-CLE-020'];after.aiDeck=['S0-MAG-025'];
after.aiHeroes.LEFT.exp_cards=['S0-WAR-012'];
after.aiDiscard=['S0-CLE-020','S0-MAG-027','S0-WAR-011'];
after.pvpActionEventsBySide.PLAYER=[{id:'effect1',card_id:'S0-EVT-003',label:'EVENT'}];
const discardLedger=new PvpDiscardPresentationLedger();
discardLedger.capture(before,after,1);
assert.deepEqual(discardLedger.forSeat(1),[]);
const toOwner=discardLedger.forSeat(2);
assert.deepEqual(toOwner.map(e=>e.origin),['HAND','MAIN_DECK','EXP']);
assert.deepEqual(toOwner.map(e=>e.card_ids[0]),['S0-CLE-020','S0-MAG-027','S0-WAR-011']);
assert.ok(toOwner.every(e=>e.side==='PLAYER'&&e.source_side==='AI'&&e.effect_card_id==='S0-EVT-003'));

// No false positives for an owner's own discard (e.g. own cards played or
// voluntarily tributed). A canonical no-op is not a notification.
const selfBefore=base(),selfAfter=clone(selfBefore);
selfBefore.playerHand=['S0-THF-004'];selfAfter.playerDiscard=['S0-THF-004'];
const otherLedger=new PvpDiscardPresentationLedger();otherLedger.capture(selfBefore,selfAfter,1);
assert.deepEqual(otherLedger.forSeat(1),[]);assert.deepEqual(otherLedger.forSeat(2),[]);

// Multi-target response damage is held until Response settles, then delivered
// as one committed batch. The displayed number uses final HP loss, NOT printed
// card damage (Arrow Barrage is variable).
const fightBefore=base(),fightAfter=clone(fightBefore);
fightBefore.responseWindow={kind:'incoming_attack',card_id:'S0-ARC-010',source_side:'PLAYER',source_lane:'CENTER',target_side:'AI',target_lane:'LEFT',damage_type:'Physical',attack_type:'Area Attack',affected_lanes:['LEFT','CENTER']};
fightAfter.aiHeroes.LEFT.hp=70;fightAfter.aiHeroes.CENTER.hp=90;
const combatLedger=new PvpCombatPresentationLedger();combatLedger.capture(fightBefore,fightAfter);
assert.deepEqual(combatLedger.forSeat(2).map(e=>e.targets.map(t=>t.damage)),[[30,10]]);
assert.equal(combatLedger.forSeat(1)[0].card_id,'S0-ARC-010');
assert.equal(combatLedger.forSeat(2)[0].source_side,'AI');

// An Attack that never opens an observable Response window must still emit a
// readout. Tests the authoritative direct-commit fallback.
const fastBefore=base(),fastAfter=clone(fastBefore);
fastAfter.aiHeroes.RIGHT.hp=40;
fastAfter.pvpActionEventsBySide.PLAYER=[{id:'a12',played_event_order:12,card_id:'S0-ARC-010',label:'ATK',source_lane:'RIGHT',target_side:'AI',target_lane:'RIGHT'}];
const direct=new PvpCombatPresentationLedger();direct.capture(fastBefore,fastAfter);
assert.deepEqual(direct.forSeat(1)[0].targets.map(t=>t.damage),[60]);
assert.equal(direct.forSeat(1)[0].card_id,'S0-ARC-010');

const runtime=readFileSync(new URL('../public/battle/shared-app/app-runtime.js',import.meta.url),'utf8');
const network=readFileSync(new URL('../public/battle/runtime/pvp-network.js',import.meta.url),'utf8');
const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
assert.match(runtime,/function presentPvpCommittedCardPlay\(/);
assert.match(runtime,/function presentPvpOpponentDiscard\(/);
// RC7 intentionally removed the now-redundant damage modal.
assert.doesNotMatch(runtime,/function presentPvpCommittedDamage\(/);
assert.match(runtime,/function renderPvpIncomingDamage\(/);
assert.match(runtime,/engine\/assets\/battle\/P\.Defense\.png/);
assert.match(runtime,/function renderBlindManaDraftOnly\(/);
assert.match(runtime,/const pvpNoticeMs=base=>/);
assert.match(runtime,/\+\(window\.GL_APP_MODE==='PVP'\?1000:0\)/);
assert.match(runtime,/function openPlayedDetail\(side,eventId\)/);
assert.match(runtime,/const activeCardContexts=itemEventArrowContexts\(candidates\[0\]\)/);
assert.match(runtime,/const candidateFamily=String\(rawCardDef/);
assert.doesNotMatch(runtime,/Waiting for the Coin Flip winner to choose the turn order\./);
assert.match(network,/GL_GAME_UI\?\.renderBlindManaDraft\?\.\(\)/);
assert.match(network,/if\(r\?\.busy\|\|\//);
assert.match(server,/discardPresentationForSeat\(seat\)/);
assert.match(server,/\.filter\(ev=>ev\?\.type!=='MANA_LOSS_COMMITTED'&&ev\?\.type!=='PVP_OPPONENT_DISCARD'\)/);
console.log('PASS PvP P3 RC6: Card Played/Defense privacy, opponent-only Discard x3, combat/Arrow Barrage, instant Attack, UI/timing/sound hooks');
