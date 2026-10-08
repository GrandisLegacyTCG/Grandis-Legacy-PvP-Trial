'use strict';
const path=require('path');
const assert=require('assert');
const {loadCandidate3aRuntime}=require('./candidate3a-runtime-harness.cjs');

const root=path.resolve(__dirname,'..');
const {bridge}=loadCandidate3aRuntime(root);
bridge.startSharedMatch({
  playerDeckKey:'starter_02_saint_crusader_grand_ranger',
  aiDeckKey:'starter_01_elemental_lord_conqueror_renegade',
  firstPlayerSide:'PLAYER'
});
bridge.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'});
const snap=bridge.getSnapshot();
const state=snap.appState;
state.turn='PLAYER'; state.phase='Draw'; state.round=2;
state.pending={
  type:'draw_replacement_choice', side:'PLAYER', decision_side:'PLAYER', source_side:'PLAYER',
  source_lane:'RIGHT', source_hero_card_id:'S1-ARC-H005', abilityId:'quick_reload', abilityName:'Quick Reload',
  drawn_card_id:'S1-WAR-001', hand_index:0
};
state.playerHeroes.RIGHT.card_id='S1-ARC-H005';
state.playerHeroes.RIGHT.hp=100; state.playerHeroes.RIGHT.maxHp=100; state.playerHeroes.RIGHT.exhausted=true;
state.playerHeroes.RIGHT.attachments=['S1-ARC-021',null];
state.playerHand=['S1-WAR-001']; state.playerDeck=['S1-MAG-001','S1-WAR-002'];
state.cardsDrawnThisTurn={PLAYER:1,AI:0}; state.lastDrawnCardBySide={PLAYER:'S1-WAR-001'};
state.pendingCastings=[{card_id:'S1-ARC-021',side:'PLAYER',source_lane:'RIGHT',source_hero_card_id:'S1-ARC-H005',target_side:'AI',target_lane:'CENTER',locked_target_lane:'CENTER',attachmentSlot:0,resolve_phase:'counter_draw',counters:1}];
state.activeAttachments=[{card_id:'S1-ARC-021',side:'PLAYER',lane:'RIGHT',slot:0,remaining:1}];
state.drawPhaseContinuation={side:'PLAYER',step:'MANA_REGEN'};
state.mana=0; state.playerManaPoolCards=[]; state.manaRegen=1;
assert.strictEqual(bridge.importCanonicalSnapshot(snap,1,{notice:'',skipImportAnimations:true}),true);
const result=bridge.applyServerIntent('commitDrawReplacementChoice',[true]);
assert.strictEqual(result.ok,true,result.error||'canonical Draw Review rejected');
const after=bridge.getSnapshot().appState;
assert.strictEqual(after.pending,null,'canonical Draw Review pending not cleared');
assert.strictEqual(after.phase,'Deploy','canonical Draw Review did not continue to Deploy');
assert.strictEqual(after.cardsDrawnThisTurn.PLAYER,2,'Quick Reload redraw did not count as an actual Draw');
assert.strictEqual(after.pendingCastings[0].counters,2,'Quick Reload replacement draw did not increment Aura Infusion Bolt counter');
assert.strictEqual(after.activeAttachments[0].remaining,2,'Aura Infusion Bolt attachment counter did not stay synchronized');
assert.strictEqual(after.mana,1,'Draw Review continuation did not perform canonical Mana Regen');
assert.strictEqual(after.playerHeroes.RIGHT.draw_replacement_used_turn,'2|PLAYER','canonical once-per-turn Draw Review stamp missing');
console.log('PASS PvP Candidate 3B compatibility: Quick Reload / Rapid Chamber Draw Review is resolved by the canonical Candidate 15 runtime; Aura counters and Draw/Mana continuation remain canonical.');
