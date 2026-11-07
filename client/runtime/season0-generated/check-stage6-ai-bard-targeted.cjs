'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../..'),src=fs.readFileSync(path.join(root,'engine/shared-app/app.bundle.js'),'utf8');
const defs=JSON.parse(fs.readFileSync(path.join(__dirname,'s0-card-definitions.json'),'utf8'));
const cards=Object.fromEntries(defs.cards.map(c=>[c.card_id,c]));
const context={
 card:id=>cards[id]||{card_id:id},cardName:c=>c.name||c.card_id,
 isUltimateCard:c=>c.card_id==='S0-MAG-031'||c.card_id==='S0-CLE-031',
 isResponseOnly:c=>c.classification==='Defense',cardCost:c=>c.cost?.mana||0,
 sideHand:(s,side)=>side==='AI'?s.aiHand:s.playerHand,sideDiscard:(s,side)=>side==='AI'?s.aiDiscard:s.playerDiscard,
 sideHeroes:(s,side)=>side==='AI'?s.aiHeroes:s.playerHeroes,
 isLegacyModeHero:h=>!!h.legacy_mode,heroIdFrom:h=>h.card_id,heroClass:h=>h.class_name,
 LANE_ORDER:['LEFT','CENTER','RIGHT'],pushLog:(s,l)=>s.log.push(l),
 recordOpponentAction:()=>{},finishDrawPhasePresentation:(s,side)=>{s._finishedDraw=side},
 drawMany:(s,side,n)=>{const deck=side==='AI'?s.aiDeck:s.playerDeck;const hand=side==='AI'?s.aiHand:s.playerHand;for(let i=0;i<n&&deck.length;i++)hand.push(deck.shift());},
 isAreaAttack:c=>c.classification==='Area Attack',isAllTargetAttack:c=>false,
 targetCoverage:()=>['LEFT','CENTER','RIGHT'],
 estimateAIDamage:(s,a)=>a._dmg||40,cardCost:()=>3,
 responseKind:()=> 'block',responseBlockAmount:()=>20,defensiveFormationReduction:()=>10,
 clone:v=>JSON.parse(JSON.stringify(v)),
 isAttackCard:c=>(c.classification||'').includes('Attack'),damageTypeForActionSource:()=> 'Magical',
 isPoisonVialCard:()=>false,isCoordinationAttackCard:()=>false,isHolyMedallionCard:()=>false,isArcaneScrollCard:()=>false,isBlessingMightCard:()=>false,isBlessingWisdomCard:()=>false,isEnrageSetupCard:()=>false,isLastResortCard:()=>false,
 isRingOfGraceCard:()=>false,isDoubleCastingCard:()=>false,isWildfireCard:()=>false,isHeavensFuryCard:()=>false,
 SUPPRESS_RENDER:true,appState:null,syncCounts:()=>{},autoAdvancePlayerDrawWhenReady:()=>{},render:()=>{}
};
vm.createContext(context);
function fn(name){let st=src.indexOf('  function '+name+'(');assert(st>=0,'missing '+name);let end=src.indexOf('\n  function ',st+1);assert(end>st);return vm.runInContext(src.slice(st,end)+'\n'+name,context,{timeout:3000});}
const defense=fn('chooseAIDefenseResponseOption');
const bard=fn('s0BardDrawOption'),priority=fn('s0BardDrawDiscardPriority'),select=fn('aiChooseS0BardDrawIndexes'),resolve=fn('resolveS0BardDrawExchange'),attackScore=fn('aiAttackTacticalScore'),isSetup=fn('isAttackBuffSetupCard'),matching=fn('aiAttackMatchesSetup');
const finish=fn('finishDrawPhasePresentation');context.s0BardDrawOption=bard;context.resolveS0BardDrawExchange=resolve;context.aiChooseS0BardDrawIndexes=select;context.finishDrawPhasePresentation=finish;
let passed=[];function check(title,callback){callback();passed.push(title)};
function hero(cls){return {card_id:cls==='Maestro'?'S0-CLE-H009':'S0-CLE-H008',class_name:cls,hp:100}};
function make(){return{turn:'AI',phase:'Draw',round:2,aiHeroes:{LEFT:hero('Bard'),CENTER:hero('Maestro'),RIGHT:{hp:0}},playerHeroes:{LEFT:{hp:100},CENTER:{hp:100},RIGHT:{hp:100}},aiHand:['S0-ARC-026','S0-ARC-026','S0-CLE-026','S0-CLE-027','S0-ARC-030'],playerHand:[],aiDiscard:[],playerDiscard:[],aiDeck:['S0-WAR-001','S0-WAR-002','S0-WAR-003'],log:[]};}
check('Bard + Maestro selects Rank III optional up-to-two exchange',()=>{let op=bard(make(),'AI');assert.equal(op.source_lane,'CENTER');assert.equal(op.max_count,2);});
check('Bard-only optional exchange selects up-to-one',()=>{let s=make();s.aiHeroes.CENTER.hp=0;assert.equal(bard(s,'AI').max_count,1);});
check('Duplicated Zol preferred for Crimson Crescendo setup',()=>{let s=make();assert(priority(s,'AI','S0-ARC-026',s.aiHand)>priority(s,'AI','S0-CLE-026',s.aiHand));});
check('Independent Bard and Maestro can each exchange once in one Draw Phase',()=>{let s=make();finish(s,'AI');assert(s.s0BardDrawResolved['2:AI:CENTER']);assert(s.s0BardDrawResolved['2:AI:LEFT']);assert.equal(s.drawPhaseResolvedFor,'AI');});
check('AI chooses at most two unique Hand indexes',()=>{let s=make();let ids=select(s,bard(s,'AI'));assert(ids.length<=2);assert.equal(new Set(ids).size,ids.length);assert(ids.includes(0)||ids.includes(1));});
check('Optional Bard exchange commits discard and draws equal count',()=>{let s=make();s.aiHeroes.LEFT.hp=0;let op=bard(s,'AI');assert(resolve(s,'AI',op,[0,1]));assert.equal(s.aiDiscard.length,2);assert.equal(s.aiHand.length,5);assert.equal(s.aiDeck.length,1);assert.equal(s.drawPhaseResolvedFor,'AI');});
check('Bard cannot commit same exchange twice',()=>{let s=make();s.aiHeroes.LEFT.hp=0;let op=bard(s,'AI');assert(resolve(s,'AI',op,[0]));assert.equal(resolve(s,'AI',op,[0]),false);});
check('Invalid index combination fails without changing zones',()=>{let s=make(),op=bard(s,'AI');assert.equal(resolve(s,'AI',op,[0,0]),false);assert.equal(s.aiDiscard.length,0);assert.equal(s.aiHand.length,5);});
check('Zero-card exchange is optional and advances phase',()=>{let s=make();s.aiHeroes.LEFT.hp=0;let op=bard(s,'AI');assert(resolve(s,'AI',op,[]));assert.equal(s.aiDiscard.length,0);assert.equal(s.drawPhaseResolvedFor,'AI');});
check('Fresh Draw turn resets Bard availability',()=>{let s=make();s.aiHeroes.LEFT.hp=0;let op=bard(s,'AI');resolve(s,'AI',op,[]);s.round++;assert(bard(s,'AI'));});
check('AI now recognizes temporary Wings of Valor and Blessing of Accuracy as setup buffs',()=>{assert(isSetup(cards['S0-CLE-018']));assert(isSetup(cards['S0-CLE-028']));});
check('Blessing Accuracy plans attack specifically from buffed Hero',()=>{let s=make(),setup={card_id:'S0-CLE-028',target_lane:'CENTER'},a={card_id:'S0-MAG-003',source_lane:'CENTER'};assert(matching(s,setup,a));a.source_lane='LEFT';assert(!matching(s,setup,a));});
check('Ultimate Attack held if nonlethal and conventional Attack ready',()=>{let s=make(),u={card_id:'S0-CLE-031',source_lane:'LEFT',target_lane:'LEFT',_dmg:80},n={card_id:'S0-ARC-006',source_lane:'LEFT',target_lane:'LEFT',_dmg:50};assert(attackScore(s,n)>attackScore(s,u));});
check('Ultimate Attack prioritized for terminal finishing opportunity',()=>{let s=make();s.playerHeroes.LEFT.hp=60;s.playerHeroes.CENTER.hp=0;s.playerHeroes.RIGHT.hp=0;let u={card_id:'S0-CLE-031',source_lane:'LEFT',target_lane:'LEFT',_dmg:80},n={card_id:'S0-ARC-006',source_lane:'LEFT',target_lane:'LEFT',_dmg:50};assert(attackScore(s,u)>attackScore(s,n));});
check('PLAYER Draw phase creates optional Bard UI decision rather than advancing automatically',()=>{let s=make();s.turn='PLAYER';s.playerHeroes.LEFT=hero('Bard');s.playerHand=['S0-CLE-026'];finish(s,'PLAYER');assert.equal(s.pending.type,'s0_bard_draw_choice');assert.equal(s.drawPhaseResolvedFor,undefined);assert.equal(s.pending.max_count,1);});
check('PLAYER can skip optional Bard UI without losing a card',()=>{let s=make();s.turn='PLAYER';s.playerHeroes.LEFT=hero('Bard');s.playerHand=['S0-CLE-026'];finish(s,'PLAYER');assert(resolve(s,'PLAYER',{source_lane:s.pending.source_lane},[]));assert.equal(s.drawPhaseResolvedFor,'PLAYER');assert.equal(s.playerHand.length,1);});
check('AI Draw phase auto-exchanges notes before proceeding',()=>{let s=make();finish(s,'AI');assert.equal(s.drawPhaseResolvedFor,'AI');assert(s.aiDiscard.includes('S0-ARC-026'));});
check('Bromir Ultimate withheld against minor nonlethal hit',()=>{let s=make();s.aiHeroes.LEFT.hp=100;s.aiHeroes.LEFT.maxHp=100;let rw={target_lane:'LEFT',source_lane:'LEFT',damage:10,options:[{card_id:'S0-MAG-031'}]};assert.equal(defense(s,rw),null);});
check('Bromir Ultimate eligible for lethal emergency Defense',()=>{let s=make();s.aiHeroes.LEFT.hp=25;s.aiHeroes.LEFT.maxHp=100;let rw={target_lane:'LEFT',source_lane:'LEFT',damage:60,options:[{card_id:'S0-MAG-031'}]};assert.equal(defense(s,rw).card_id,'S0-MAG-031');});
check('External UI and runtime intent expose Bard exchange',()=>{const ui=fs.readFileSync(path.join(root,'shared-app/app-runtime.js'),'utf8');assert(ui.includes("'s0_bard_draw_choice'"));assert(ui.includes("toggleS0BardDrawIndex"));assert(ui.includes("commitS0BardDrawChoice"));assert(src.includes('toggleS0BardDrawIndex:toggleS0BardDrawIndex'));});
console.log('PASS '+passed.length+' S0 Stage6 source-function tests: '+passed.join('; '));
