
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const data=require(path.join(root,'data/season1/cards.runtime.v0.15.0.json'));
const recipes=require(path.join(root,'data/season1/effect-recipes.runtime.v0.14.0.json'));
const {createInitialRuntimeState,submitIntent,getLegalActions}=require(path.join(root,'runtime/core/reducer.js'));
const cardsById=Object.fromEntries(data.cards.map(c=>[c.card_id,c]));
function deck(ids=['S1-WAR-H001']){return{starting_hero_ids:['Left','Center','Right'].map((slot,i)=>({slot,card_id:ids[i]||ids[0]})),main_deck_card_counts:{'S1-EVT-001':12,'S1-WAR-001':2},legacy_deck_card_ids:[]}}
function fresh(){const s=createInitialRuntimeState({runtime_data:{cards_by_id:cardsById,effect_recipes:recipes},player_deck:deck(['S1-WAR-H001']),opponent_deck:deck(['S1-ARC-H001'])});s.phase='Battle';s.active_player_id='PLAYER';s.players.PLAYER.mana_pool=99;s.players.AI.mana_pool=99;return{s}}
function ok(b,intent){const r=submitIntent(b.s,intent);assert.deepStrictEqual(r.errors||[],[],JSON.stringify({intent,errors:r.errors}));b.s=r.state;return r}
function attack(b){ok(b,{type:'PLAY_CARD',player_id:'PLAYER',card_id:'S1-WAR-001'});if(b.s.pending?.source_required)ok(b,{type:'SELECT_SOURCE',player_id:'PLAYER',source_slot:'Left'});if(b.s.pending?.target_required)ok(b,{type:'SELECT_TARGET_SLOT',player_id:'PLAYER',target_player_id:'AI',target_slot:'Left'});ok(b,{type:'CONFIRM_ACTION',player_id:'PLAYER'});}
for(const cardId of ['S1-ITM-012','S1-ARC-003']){
  const unavailable=fresh();unavailable.s.players.PLAYER.hand=['S1-WAR-001'];unavailable.s.players.AI.hand=[cardId];attack(unavailable);
  assert.ok(!getLegalActions(unavailable.s,'AI').some(a=>a.type==='DECLARE_RESPONSE'&&a.card_id===cardId),`${cardId}: available without an additional card`);
  const b=fresh();b.s.players.PLAYER.hand=['S1-WAR-001'];b.s.players.AI.hand=[cardId,cardId,'S1-EVT-001'];attack(b);
  assert.ok(getLegalActions(b.s,'AI').some(a=>a.type==='DECLARE_RESPONSE'&&a.card_id===cardId),`${cardId}: unavailable despite payable additional cost`);
  ok(b,{type:'DECLARE_RESPONSE',player_id:'AI',card_id:cardId,source_slot:'Left',hand_index:0});
  ok(b,{type:'CONFIRM_RESPONSE',player_id:'AI'});
  assert.ok(!b.s.response_window&&b.s.response_payment?.committed,'Confirm must close the old Response Window and commit into mandatory payment');
  const self=submitIntent(b.s,{type:'SELECT_RESPONSE_COST_CARD',player_id:'AI',hand_index:0,card_id:cardId});
  assert.ok((self.errors||[]).some(x=>/cannot discard itself/i.test(x)),`${cardId}: exact source instance can pay for itself`);
  ok(b,{type:'SELECT_RESPONSE_COST_CARD',player_id:'AI',hand_index:1,card_id:cardId});
  ok(b,{type:'CONFIRM_RESPONSE_PAYMENT',player_id:'AI'});
  assert.ok(b.s.response_window&&b.s.response_priority_player_id==='PLAYER','counter-Response priority did not open after payment');
  assert.strictEqual(b.s.players.AI.hand.filter(x=>x===cardId).length,0,'source and same-ID payment copy were not both consumed');
}
const app=read('public/js/app.bundle.js'),net=read('public/js/pvp-network.js'),server=read('server.js');
const legacyStageStart=app.indexOf("var legacyStage='<div class=\"hero-stage legacy-stage\">'"); const legacyStageEnd=app.indexOf("return '<article class=\"hero-lane hero-panel legacy-slot",legacyStageStart); const legacyStageBlock=legacyStageStart>=0&&legacyStageEnd>legacyStageStart?app.slice(legacyStageStart,legacyStageEnd):''; assert.ok(legacyStageBlock.includes('<div class=\"hero-card-anchor\"><button class=\"hero-card hero-main\"'),'Legacy does not share Hero card-anchor structure');
assert.ok(app.includes("appState&&appState.gameOver?'BACK TO LOBBY':'SURRENDER'"),'permanent match control does not switch to BACK TO LOBBY');
assert.ok(server.includes('feedback_kind: feedback.kind || null'),'server drops semantic battle-feedback kind');
assert.ok(net.includes("kind:(evt.feedback_kind==='heal'?'heal':'attack')"),'network transport does not preserve heal semantic');
assert.ok(app.includes("heal:'assets/battle/Heal.png'")&&app.includes("heal:'assets/audio/battle/Heal.mp3'")&&app.includes("if(evt.kind==='heal')"),'Heal VFX/audio mapping missing');
assert.ok(fs.existsSync(path.join(root,'public/assets/battle/Heal.png'))&&fs.existsSync(path.join(root,'public/assets/audio/battle/Heal.mp3')),'Heal assets missing');
assert.ok(server.includes("cards.runtime.v0.15.0.json")&&server.includes("effect-recipes.runtime.v0.14.0.json")&&server.includes("active-runtime-source-stack.v1.93.json")&&server.includes('ce79e5a97c115507f68734887160b575840899056e1533488e3fddd3a11fec1f'),'authoritative server is not actually loading Source Stack v1.8.2 runtime data');
const grand=data.cards.find(c=>c.card_id==='S1-ARC-H006');assert.ok(grand&&/Rapid Chamber/.test(grand.card_text||grand.effect_text||''),'Grand Arbalest Rapid Chamber authority missing');assert.ok(/Physical Attack damage by 10/.test(grand.card_text||grand.effect_text||''),'Grand Arbalest +10 is not Physical-only in authority');
const drawTest=read('tests/run-v324-quick-reload-aura-counter.cjs');assert.ok(drawTest.includes('cardsDrawnThisTurn.PLAYER,2')&&drawTest.includes("phase,'Deploy'"),'draw -> replacement draw -> Draw This Turn 2 -> Deploy regression coverage missing');
console.log('PASS PvP v3.41 preserved v3.38 final fixes: generic SGH/Escape Arrow commit-payment hierarchy, structural Hero/Legacy parity, Back to Lobby, heal semantic transport, authoritative v1.8.2 server source, and Grand Arbalest draw/passive preservation.');
