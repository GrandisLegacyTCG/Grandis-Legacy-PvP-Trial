'use strict';
const assert=require('assert');
const path=require('path');
const root=path.resolve(__dirname,'..');
const reducer=require(path.join(root,'runtime/core/reducer.js'));
const state=reducer.createInitialRuntimeState({
  player_id:'A',opponent_id:'B',
  player_deck:{starting_hero_card_ids:['S1-WAR-H001','S1-WAR-H001','S1-WAR-H001']},
  opponent_deck:{starting_hero_card_ids:['S1-WAR-H001','S1-WAR-H001','S1-WAR-H001']}
});
state.players.B.board.Left.slot_mode='HERO';
state.players.B.board.Left.hero={card_id:'S1-WAR-H006',hp:140,max_hp:140,defeated:false,exhausted:true,statuses:[]};
state.pending_attack_resolution={card_id:'S1-WAR-001',attacking_player_id:'A',source_slot:'Center',targets:[{target_player_id:'B',target_slot:'Left'}],base_damage:40,damage_type:'Physical',area:false,cannot_be_dodged:false,cannot_be_blocked:false,response_results_by_target:{}};
state.response_current_target={target_player_id:'B',target_slot:'Left'};
state.response_window={type:'PER_AFFECTED_HERO_DAMAGE_WOULD_BE_DEALT',card_id:'S1-WAR-001',target_player_id:'B',target_slot:'Left',target_key:'B:Left',redirect_depth:0};
const events=[];
assert.strictEqual(reducer.__test.reopenCurrentHeroResponseWindowAfterRedirect(state,events),true);
assert.ok(state.response_window,'fresh response window missing');
assert.strictEqual(state.response_window.fresh_after_redirect,true);
assert.strictEqual(state.response_window.redirect_depth,1);
assert.strictEqual(state.response_window.target_slot,'Left');
assert.strictEqual(state.response_priority_player_id,'B');
assert.ok(/^RW:REDIRECT:/.test(state.response_window.response_window_token));
assert.strictEqual(events.length,1);
assert.strictEqual(events[0].payload.fresh_after_redirect,true);
assert.strictEqual(events[0].payload.same_attack_instance,true);
assert.strictEqual(events[0].payload.no_replay_cost_or_trigger,true);
console.log('PASS PvP v3.29 redirect opens a fresh Defense window for the same Attack instance.');
const fs=require('fs');
const app=fs.readFileSync(path.join(root,'public/js/app.bundle.js'),'utf8');
const css=fs.readFileSync(path.join(root,'public/css/app.css'),'utf8');
assert.ok(app.includes('pendingAttackDirectionShouldLoop')&&app.includes('GL_PVP_SHARED_BOARD_ACTIVE'),'PvP persistent direction indicator loop gate missing');
assert.ok(css.includes('.gl-pending-attack-line.is-looping')&&css.includes('glPendingAttackDirectionLoop'),'PvP looping direction indicator CSS missing');
assert.strictEqual(require(path.join(root,'package.json')).version,'3.0.42');
console.log('PASS PvP v3.29 pending Attack direction indicator loop contract.');
