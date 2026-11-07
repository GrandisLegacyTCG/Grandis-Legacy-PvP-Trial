'use strict';
// Targeted execution of the ACTUAL v6.91.9-derived engine functions in a VM.
// This tests chosen S0 routes; it is NOT a browser match or full-card certification.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..','..');
const text=fs.readFileSync(path.join(root,'engine/shared-app/app.bundle.js'),'utf8');
const db=JSON.parse(fs.readFileSync(path.join(root,'runtime/season0-generated/s0-card-definitions.json')));
const cards=Object.fromEntries(db.cards.map(c=>[c.card_id,c]));
const codeName=name=>{const start=text.indexOf('  function '+name+'(');if(start<0)throw Error('Handler missing: '+name);const next=text.indexOf('\n  function ',start+1);if(next<0)throw Error('Next fn missing: '+name);return text.slice(start,next);};
const context={CARD_BY_ID:cards,appState:null,LANE_ORDER:['LEFT','CENTER','RIGHT'],
 card:id=>cards[id],cardName:c=>c&&c.name||'',summarizeCard:c=>c&&c.card_text||'',cardFamily:c=>c&&c.family||'',cardSubtype:c=>c&&c.classification||'',
 runtimeTagList:c=>String(c.runtime_tags||'').split(';'),isUltimateCard:c=>!!(c&&c.is_ultimate),
 isCastingCard:c=>!!(c&&/Casting/.test(c.classification||'')),
 sideDiscard:(s,side)=>s[side==='PLAYER'?'playerDiscard':'aiDiscard'],
 deckForSide:(s,side)=>s[side==='PLAYER'?'playerDeck':'aiDeck'],
 sideHeroes:(s,side)=>s[side==='PLAYER'?'playerHeroes':'aiHeroes'],
 castingSourceMatchesHero:(pc,h)=>pc.source_hero_card_id===h.card_id,
 hasStatus:(h,n)=>!!h.statuses?.some(x=>x.name===n),
 syncAttachmentCounter:(s,side,lane,slot,id,count)=>{s.synchronized_count=count;},
 pushLog:(s,msg)=>s.log.push(msg),shufflePile:a=>a.reverse(),
 sourceShouldExhaust:()=>false,heroClass:h=>h.class_name||'',
 cardCost:c=>c.cost?.mana||0,calcGet:()=>0,
 classMappedNumber:(map,hero)=>map[hero.class_name]||0,
 currentClassDamage:(c,h)=>c.attack?.damage_by_class?.[h.class_name]||0,
 printedClassDamage:(c,h)=>c.attack?.damage_by_class?.[h.class_name]||0,
 scalingFlatBonus:()=>0,
 targetOutsideDefaultCoverage:()=>false,
 isChargedShotCard:c=>c?.card_id==='S0-ARC-018',isArrowBarrageCard:c=>c?.card_id==='S0-ARC-010',
 window:{GL_RULES_RUNTIME:{dynamicManaCost:(c,h,s,side,opts)=>opts.printedCost}},
 isExecuteEffect:()=>false,appStateGlobal:null,
 sideHand:(s,side)=>s[side==='PLAYER'?'playerHand':'aiHand'],manaAvailableValueForCard:()=>99,
 oppositeSide:side=>side==='PLAYER'?'AI':'PLAYER',
 isInterceptCard:c=>c?.card_id==='S0-EVT-009',isFlashpowderBombCard:()=>false,
 isBindingLightCard:()=>false,
 clone:x=>JSON.parse(JSON.stringify(x))};
vm.createContext(context);
const fn=(name)=>vm.runInContext(codeName(name)+'\n'+name,context,{timeout:3000});
const run=(name)=>({name,result:fn(name)});
// Bundle these tightly coupled helpers from the source including its current source-ID mapping.
const bd=text.indexOf('  var S0_BARD_DISCARD_CONDITIONS='),be=text.indexOf('  function validateCardPreconditions(',bd);
assert(bd>=0 && be>bd);vm.runInContext(text.slice(bd,be),context,{timeout:3000});
const tests=[];function ok(name,cb){cb();tests.push({name,pass:true});}
const source={playerDiscard:['S0-ARC-026','S0-ARC-026','S0-CLE-026','S0-CLE-027'],playerDeck:['S0-ARC-002'],log:[]};
ok('S0 Crimson Crescendo requires ≥1 Zol from discard',()=>{assert(context.discardConditionCanPay(source,'PLAYER',cards['S0-ARC-030']));const action={s0_discard_condition_picks:[{card_id:'S0-ARC-026',discard_index:0},{card_id:'S0-ARC-026',discard_index:1}]};assert(context.validateSelectedDiscardCondition(source,'PLAYER',cards['S0-ARC-030'],action));assert.equal(context.consumeS0DiscardCondition(source,'PLAYER',cards['S0-ARC-030'],action),2);assert.equal(source.playerDiscard.length,2);assert.equal(source.playerDeck.length,3);assert.equal(action.s0_condition_return_count,2);});
ok('S0 Grand Finale cannot PLAY without all 3 note types',()=>{assert(!context.discardConditionCanPay(source,'PLAYER',cards['S0-CLE-031']));});
ok('S0 CONDITION rejects duplicate selected discard index',()=>{const t={playerDiscard:['S0-ARC-026','S0-CLE-026'],playerDeck:[],log:[]};const a={s0_discard_condition_picks:[{card_id:'S0-ARC-026',discard_index:0},{card_id:'S0-CLE-026',discard_index:0}]};assert(!context.validateSelectedDiscardCondition(t,'PLAYER',cards['S0-ARC-028'],a));});
const s0sure=fn('attackCannotBeDodged');const s0pierce=fn('attackCannotBeBlocked');
ok('S0 Aim Shot SURE HIT disables all DODGE routes',()=>assert(s0sure(cards['S0-ARC-008'])));
ok('S0 Resonance Burst SURE HIT uses existing response legality',()=>assert(s0sure(cards['S0-ARC-031'])));
ok('S0 PIERCING uses existing cannot-BLOCK gate',()=>{const c=db.cards.find(x=>String(x.runtime_tags||'').split(';').includes('PIERCING'));assert(c,'No S0 PIERCING card');assert(s0pierce(c));});
const timed=fn('hasCastingTimeOne');const drawCast=fn('isDrawCounterCastingCard');const drawNeed=fn('requiredDrawCountersForCasting');
ok('S0 Tornado Casting Time 1 is recognized by app',()=>assert(timed(cards['S0-MAG-008'])));
ok('S0 Aura Infusion Bolt uses 5-card Draw-counter route',()=>{assert(drawCast(cards['S0-ARC-021']));assert.equal(drawNeed(cards['S0-ARC-021']),5);});
// End-phase increment and Hit forced-release use the exact implementation under test.
const endInc=fn('increaseEndPhaseCastingProgress');const forced=fn('markRuneforgedHitInterrupt');
const pc={card_id:'S0-MAG-027',side:'PLAYER',source_lane:'CENTER',original_source_lane:'CENTER',source_hero_card_id:'S0-MAG-H004',resolve_phase:'casting_progress',counters:0,required_counters:3,attachmentSlot:1,forced_release:false};
const state={pendingCastings:[pc],playerHeroes:{CENTER:{card_id:'S0-MAG-H004',hp:120,statuses:[]}},aiHeroes:{},log:[]};
ok('Runeforged UI counter increments 0→1 at owner End Phase',()=>{assert.equal(endInc(state,'PLAYER'),1);assert.equal(pc.counters,1);assert.equal(state.synchronized_count,1);});
ok('Runeforged connected Hit locks current count for next owner Battle',()=>{assert(forced(state,'PLAYER','CENTER'));assert(pc.forced_release);assert.equal(endInc(state,'PLAYER'),0);assert.equal(pc.counters,1);});
ok('Runeforged cannot force-release from wrong lane',()=>assert(!forced({pendingCastings:[{...pc,forced_release:false}],playerHeroes:state.playerHeroes,log:[]},'PLAYER','LEFT')));
const simple=fn('materializeS0SimpleRuntimeEffects');
ok('S0 Swift Movement Defense gains existing DODGE handler without S1 data',()=>{const result=simple(cards['S0-ARC-029']);assert(result.effect.some(e=>e.kind==='dodge_incoming_damage'));});
const dmg=fn('computedAttackDamageForAction');
ok('S0 Crimson Crescendo scales S0 Bard 20 by chosen 2 Zol',()=>{assert.equal(dmg({log:[]},{card_id:'S0-ARC-030',source_side:'PLAYER',s0_condition_return_count:2},{class_name:'Bard'},null),40);});
ok('S0 Colossal Dreadbolt uses S0 cap 140, not S1 80/120',()=>{assert.equal(dmg({cardsDrawnThisTurn:{PLAYER:15},log:[]},{card_id:'S0-ARC-025',source_side:'PLAYER'},{class_name:'Arbalest'},null),140);});
ok('S0 Mana Void scales damage using OWN Regen',()=>{assert.equal(dmg({manaRegen:3,aiManaRegen:6,log:[]},{card_id:'S0-MAG-025',source_side:'PLAYER'},{class_name:'Spell Blade'},null),60);});
const cardCostFn=fn('cardPlayCostForSource');
ok('S0 Mana Void scales Mana cost using OWN Regen',()=>assert.equal(cardCostFn(cards['S0-MAG-025'],{class_name:'Spell Blade'},{manaRegen:3,aiManaRegen:5},'PLAYER'),(cards['S0-MAG-025'].cost.mana*3)));
const responseKind=fn('responseKind');
context.responseProfileOverride=()=>undefined;
context.isTacticalAdaptationCard=c=>c?.card_id==='S0-EVT-007';
ok('S0 Intercept reuses S1 Attack-negate-return route, no Casting',()=>{assert.equal(responseKind(cards['S0-EVT-007'],{damage_type:'Physical',attack_type:'Single Target',card_id:'S0-ARC-008',cannot_dodge:true}),'negate_return');assert.equal(responseKind(cards['S0-EVT-007'],{damage_type:'Magical',attack_type:'Casting Attack',card_id:'S0-MAG-008'}),null);});
// Dynamic source APIs retained unchanged: source printed output comes from S0 objects.
ok('All registered Season0 cards have no Season1 IDs',()=>assert(db.cards.every(c=>c.card_id.startsWith('S0-'))));
console.log('PASS '+tests.length+' targeted engine-function tests (not browser playability).');
console.log(JSON.stringify(tests,null,2));
