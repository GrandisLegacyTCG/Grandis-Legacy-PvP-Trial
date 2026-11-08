'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../public/battle');
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,performance:{now:()=>0},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},crypto:require('crypto').webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://example.test/index.html',origin:'http://example.test'};ctx.navigator={userAgent:'RC33 patch QA'};ctx.document={readyState:'loading',addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],body:null,documentElement:null};vm.createContext(ctx);
const expose=`\nwindow.__PATCH_QA={get state(){return appState},setState:s=>{appState=s},initCards,validateDeck,normalizeDeck,stonebloodAvailable,resolveEndPhaseCleanupForSide,expireEndPhaseAttachmentsForSide,resolveStatusTicksForSide,resolveStonebloodChoice,commitLegacyDefeatChoice,resolvePendingCastingsFor,resolveResponseWindow,openPrimalStrikeResponseWindow,resolveAbilityDamageResponseWindow,openAttackResponseWindow,responseOptionsFor,primalStrikeResponseOptions,responseKind,card,cardName,sourceCompatibleForResponse,s0BardDrawOption,resolveS0BardDrawExchange,getActivatedLegacyAbilities,legacyAbilityUsedThisTurn,markLegacyAbilityUsed,legacyOnceKey,legacyDiscardReturnCandidates,legacyCostCandidates,beginActivatedLegacyAbility,commitLegacyCostChoice,continueLegacyAbilityAfterCost,resolveLegacyAbility,resolveActivatedRacialAbility,getActivatedRacialAbilities,legalDefSkillCard,consumeEnrageBonus,hasEnrageBonus,hasStatus,applyDefeatCheck,rankHeroIdFromProgression,attachmentPolicyForCard,heroState,sideHeroes,heroClass,heroRank,clone,parseRank,resolveS0ProvokeAtOpponentEnd,renderHandLimitDiscardChoice,bindDynamicButtons,v253DelegatedReadablePreviewSource,checkGameEnd,runtimeTurnStamp,legacyAbilityData,cardFamily,cardSubtype,chooseAIDefenseResponseOption,beginResponsePayment,finalizeResponsePayment,commitResponsePaymentChoice,refreshResponseWindowOptions,getActivatedRacialAbilities,commitCardSearchChoice};\n})();`;
for(const file of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let src=fs.readFileSync(path.join(root,file),'utf8');
 if(file.endsWith('app.bundle.js')){
  src=src.replace(/function aiTurnDirectorAvailable\(\)\{[^}]*\}/g,'function aiTurnDirectorAvailable(){return false;}');
  src=src.replace('function showResult(){','function showResult(){if(SUPPRESS_RENDER)return;');
  src=src.replace('function showInfo(title, body){','function showInfo(title, body){if(SUPPRESS_RENDER)return;');
  src=src.replace('function showInfoHtml(title, html){','function showInfoHtml(title, html){if(SUPPRESS_RENDER)return;');
  if(!/\n\}\)\(\);\s*$/.test(src))throw new Error('Cannot export runtime');
  src=src.replace(/\n\}\)\(\);\s*$/,expose);
 }
 vm.runInContext(src,ctx,{timeout:60000,filename:file});
}
ctx.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true);
const E=ctx.GL_GAME_ENGINE, R=ctx.__PATCH_QA, clone=x=>JSON.parse(JSON.stringify(x));R.initCards();
const report=[],logs=[];
function t(id,title,fn){try{const details=fn()||{};console.log('PASS',id,title);report.push({id,title,ok:true,details});}catch(err){const error=String(err.stack||err);console.log('FAIL',id,title,'\n '+error.slice(0,1200));report.push({id,title,ok:false,error:error.slice(0,2400)});}}
function newGame(id='s0_starter_01_red_white',idAi='s0_starter_03_yellow_blue'){
 assert(E.selectDeck('PLAYER',id).ok,'select PLAYER '+id);assert(E.selectDeck('AI',idAi).ok,'select AI '+idAi);
 const ready=E.startLocalMatch('PLAYER');assert(ready.ok,'startLocalMatch: '+JSON.stringify(ready));
 const s=R.state;s.turn='PLAYER';s.phase='Battle';s.round=2;s.pending=null;s.responseWindow=null;s.aiControl=null;s.gameOver=false;s.autoEndTurnPending=false;s.racial=2;s.aiRacial=2;s.mana=30;s.aiMana=30;
 return s;
}
function setHero(s,side,lane,id,hp=100){const h=R.heroState(id,side,lane);h.hp=hp;h.statuses=[];s[side==='PLAYER'?'playerHeroes':'aiHeroes'][lane]=h;return h;}
function poison(h){h.statuses=[{name:'Poison',duration:2}];}
function responseFor(s,cardId){return (s.responseWindow?.options||[]).find(o=>o.card_id===cardId);}
function startPrimal(s,attackerSide,attackLane,targetLane=attackLane){s.turn=attackerSide;s.phase='Battle';s.aiControl=null;const a={action:{action_key:'primal_strike',effect:{direct_damage:20,damage_type:'Physical'}},label:'Primal Strike'};assert(R.openPrimalStrikeResponseWindow(s,attackerSide,attackLane,targetLane,a));return s.responseWindow;}
function reportMaybe(s){return{pending:s.pending&&s.pending.type,gameOver:s.gameOver,turn:s.turn,phase:s.phase,logs:(s.log||[]).slice(-5)};}

// F08 starter validity and false-positive control.
t('F08','all five official starter decks accepted',()=>{
 const result={};for(const [id,row] of Object.entries(ctx.GL_ACTIVE_STARTER_DECKS)){
  const v=R.validateDeck(row.deck||row,'PLAYER');result[id]={ok:v.ok,errors:v.errors};assert(v.ok,id+': '+v.errors.join('; '));
 }return result;
});
t('F08','main deck and starter illegal structures rejected',()=>{
 const original=clone(ctx.GL_ACTIVE_STARTER_DECKS['s0_starter_01_red_white'].deck);
 const check=(desc,mutate)=>{const d=clone(original);mutate(d);const r=R.validateDeck(d,'PLAYER');assert(!r.ok,desc+' accepted');return r.errors.slice(0,4);};
 const ids={};const repl=(d,id)=>{d.main_deck[0].card_id=id;d.main_deck[0].quantity=1;const other=d.main_deck.find(x=>x!==d.main_deck[0] && x.quantity>1);if(other) other.quantity+=1;};
 ids.mainHero=check('Hero in Main',d=>repl(d,'S0-WAR-H001'));
 ids.mainLegacy=check('Legacy in Main',d=>repl(d,'S0-WAR-L001'));
 ids.rankIIIStarter=check('Rank III starter',d=>{const slot='LEFT',old=d.default_formation[slot],id=R.rankHeroIdFromProgression(old,3);assert(id);d.default_formation[slot]=id;});
 ids.itemStarter=check('Item starter',d=>{d.default_formation.LEFT='S0-ITM-001';});
 ids.fakeLegacyExpanded=check('Skills for Legacy',d=>{d.legacy_deck_expanded=Array(12).fill('S0-WAR-001');});
 return ids;
});

// Explicit designer rule: Stun does NOT remove Item response permission.
t('ruling-F04','Stun still permits Protection Item response',()=>{
 const s=newGame();const h=setHero(s,'PLAYER','CENTER','S0-WAR-H001',100);
 h.statuses=[{name:'Stun',duration:2}];s.playerHand=['S0-ITM-016'];
 const incoming={damage:30,damage_type:'Physical',attack_type:'Single Target',cannot_dodge:false,cannot_block:false,target_lane:'CENTER',source_lane:'CENTER',card_id:'S0-WAR-001'};
 const opts=R.responseOptionsFor(s,'PLAYER',incoming);
 assert(opts.some(o=>o.card_id==='S0-ITM-016'),'Chain Mail item was disabled under Stun');
 return{item:'S0-ITM-016',stunned:true,responseAvailable:true};
});

// F01 pause on lethal Poison, resume cursor exactly once.
t('F01','lethal Poison pauses at Stoneblood before next lane',()=>{
 const s=newGame();s.phase='End';const dwarf=setHero(s,'PLAYER','LEFT','S0-CLE-H004',10),other=setHero(s,'PLAYER','CENTER','S0-THF-H004',10);
 poison(dwarf);poison(other);s.playerLegacy.push('S0-THF-L001');R.resolveEndPhaseCleanupForSide(s,'PLAYER');
 assert(s.pending&&s.pending.type==='racial_stoneblood',JSON.stringify({leftHp:dwarf.hp,centerHp:other.hp,stonebloodAvailable:R.stonebloodAvailable(s,'PLAYER','LEFT',dwarf),leftRace:dwarf.card_id,token:s.racial,progress:s.endPhaseCleanupProgress,logs:(s.logs||[]).slice(-8),...reportMaybe(s)}));
 assert.equal(other.hp,10,'second lane must not tick yet');const progress=s.endPhaseCleanupProgress;assert.equal(progress.poison_lane_cursor,1);
 R.resolveStonebloodChoice(true);assert.equal(s.racial,1,'Stoneblood must cost one token');assert.equal(dwarf.hp,30);
 assert(!s.pending,'stoneblood choice should close');R.resolveEndPhaseCleanupForSide(s,'PLAYER');
 assert.equal(other.hp,0);assert(s.pending&&s.pending.type==='legacy_defeat_choice',JSON.stringify(reportMaybe(s)));
 const ticks=(s.log||[]).filter(x=>/LEFT suffers 10 Poison damage/.test(x)).length;assert.equal(ticks,1,'must not double tick LEFT');
 return{hpLeft:dwarf.hp,hpCenter:other.hp,racial:s.racial,poisonTicksLeft:ticks,pending:s.pending.type};
});
t('F01','lethal Poison opens Legacy first and queues Dwarf next',()=>{
 const s=newGame();s.phase='End';const first=setHero(s,'PLAYER','LEFT','S0-WAR-H001',10),dwarf=setHero(s,'PLAYER','CENTER','S0-CLE-H004',10);
 poison(first);poison(dwarf);R.resolveEndPhaseCleanupForSide(s,'PLAYER');
 assert.equal(s.pending?.type,'legacy_defeat_choice');assert.equal(dwarf.hp,10);return {pending:s.pending.type,otherHeroHP:dwarf.hp};
});
t('F01','single Poison tick 10 and fixed-duration expiry',()=>{
 const s=newGame();s.phase='End';const h=s.playerHeroes.LEFT;h.hp=30;poison(h);R.resolveEndPhaseCleanupForSide(s,'PLAYER');assert.equal(h.hp,20);assert.equal(h.statuses.find(x=>x.name==='Poison').duration,1);return{hp:h.hp};
});


// Full real End automation after a Stoneblood popup (not only isolated tick).
t('F01','real auto-End pauses for Stoneblood and resumes to Legacy',()=>{
 const s=newGame();s.phase='End';s.autoEndTurnPending=true;s.playerHand=[];
 const dwarf=setHero(s,'PLAYER','LEFT','S0-CLE-H004',10),nonDwarf=setHero(s,'PLAYER','CENTER','S0-WAR-H001',10);
 poison(dwarf);poison(nonDwarf);s.playerLegacy.push('S0-WAR-L001');
 R.resolveEndPhaseCleanupForSide(s,'PLAYER');
 assert.equal(s.pending?.type,'racial_stoneblood');
 assert(R.resolveStonebloodChoice(true),'Stoneblood confirm was rejected');
 assert.equal(dwarf.hp,30);assert.equal(s.racial,1);
 assert.equal(nonDwarf.hp,0,'auto-End must continue queued second Poison');
 assert.equal(s.pending?.type,'legacy_defeat_choice','auto-End must offer Legacy after second lethal tick');
 s.pending.selected_index=0;
 assert(R.commitLegacyDefeatChoice(),'Legacy selection was rejected');
 assert(R.sideHeroes(s,'PLAYER').CENTER.legacy_mode||R.sideHeroes(s,'PLAYER').CENTER.mode==='LEGACY','center must transition to Legacy');
 const poisonTicks=(s.log||[]).filter(x=>/LEFT suffers 10 Poison damage/.test(x));
 assert.equal(poisonTicks.length,1,'same Hero Poison repeated after pending choice');
 return{afterStonebloodHP:dwarf.hp,racialRemaining:s.racial,centerLegacy:true,leftTicks:poisonTicks.length,pending:s.pending?.type||null,phase:s.phase,turn:s.turn};
});

// F02 two Castings can finish in order (set source components explicitly).
t('F02','two ready AI Tornado wait for each Response',()=>{
 const s=newGame();s.turn='PLAYER';s.phase='Battle';
 const a=setHero(s,'AI','LEFT','S0-MAG-H001',100),b=setHero(s,'AI','CENTER','S0-MAG-H004',100);
 const left=s.playerHeroes.LEFT,center=s.playerHeroes.CENTER;left.hp=100;center.hp=100;s.playerHand=[];
 const cast=(lane,target,hero)=>({card_id:'S0-MAG-008',side:'AI',source_lane:lane,original_source_lane:lane,source_hero_card_id:hero.card_id,source_instance_id:hero.instance_id,source_progression_id:'',target_side:'PLAYER',target_lane:target,attachmentSlot:0,resolve_phase:'casting_progress',counters:1,required_counters:1});
 s.pendingCastings=[cast('LEFT','LEFT',a),cast('CENTER','CENTER',b)];a.attachments[0]='S0-MAG-008';b.attachments[0]='S0-MAG-008';
 s.activeAttachments=[{attachment_id:'QACAST1',side:'AI',lane:'LEFT',slot:0,card_id:'S0-MAG-008',attachment_state:'CASTING'},{attachment_id:'QACAST2',side:'AI',lane:'CENTER',slot:0,card_id:'S0-MAG-008',attachment_state:'CASTING'}];
 R.resolvePendingCastingsFor(s,'AI');assert(s.responseWindow,'first window missing');assert.equal(s.responseWindow.target_lane,'LEFT');assert.equal(s.pendingCastings.length,1,'second should be retained');
 R.resolveResponseWindow(null);assert(left.hp<100,'first attack damage lost');R.resolvePendingCastingsFor(s,'AI');assert(s.responseWindow,'second window missing');assert.equal(s.responseWindow.target_lane,'CENTER');
 R.resolveResponseWindow(null);assert(center.hp<100,'second damage lost');assert.equal(s.pendingCastings.length,0);
 return{leftHp:left.hp,centerHp:center.hp,remainingCasting:s.pendingCastings.length};
});

// F03 allied block, payment, reaction, and dodge follow-ups.
t('F03','Holy Barrier BLOCK uses Priest source not protected Hero',()=>{
 const s=newGame();setHero(s,'AI','CENTER','S0-WAR-H004',100);setHero(s,'PLAYER','LEFT','S0-CLE-H002',100);setHero(s,'PLAYER','CENTER','S0-WAR-H001',100);
 s.playerHand=['S0-CLE-010'];startPrimal(s,'AI','CENTER','CENTER');const opt=responseFor(s,'S0-CLE-010');assert(opt,'Holy Barrier option missing: '+JSON.stringify(s.responseWindow.options));assert.equal(opt.source_lane,'LEFT');const before=s.playerHeroes.CENTER.hp;
 R.resolveResponseWindow(opt);if(s.pending?.type==='response_payment_choice'){const p=s.pending;p.selected_shard_uids=p.selected_shard_uids||[];assert(R.commitResponsePaymentChoice());}
 assert.equal(s.playerHeroes.CENTER.hp,before,'60 BLOCK must fully prevent 20 Primal');return{hp:s.playerHeroes.CENTER.hp,hand:s.playerHand.length};
});
t('F03','Swift Movement Dodge draws one card with payment',()=>{
 const s=newGame();setHero(s,'AI','CENTER','S0-WAR-H004',100);setHero(s,'PLAYER','CENTER','S0-CLE-H008',100);s.playerHand=['S0-ARC-029'];s.playerDiscard=['S0-CLE-026'];s.playerDeck=['S0-WAR-001','S0-WAR-002'];startPrimal(s,'AI','CENTER','CENTER');const opt=responseFor(s,'S0-ARC-029');assert(opt,'Swift Movement missing');const hp=s.playerHeroes.CENTER.hp;
 R.resolveResponseWindow(opt);if(s.pending?.type==='card_search_choice'){const p=s.pending;assert.equal(p.resolve_to,'s0_response_condition_precommit');p.selected_indices=[0];assert(R.commitCardSearchChoice());}if(s.pending?.type==='response_payment_choice'){assert(R.commitResponsePaymentChoice());}
 assert.equal(s.playerHeroes.CENTER.hp,hp);assert(!s.playerDiscard.includes('S0-CLE-026'),'Lun CONDITION was not paid');assert.equal(s.playerHand.length,1,'Swift Movement must draw exactly one card');assert.equal(s.playerDeck.length,2,'Returned Lun must shuffle into deck before drawing one');assert(['S0-WAR-001','S0-WAR-002','S0-CLE-026'].includes(s.playerHand[0]),'Swift Movement drew an unexpected card');assert((s.presentationEvents||[]).some(e=>e.type==='CARD_DRAWN'&&e.reason==='CARD_EFFECT'&&e.card_id===s.playerHand[0]),'Swift Movement draw event missing');/* old QA assertion: */return{hand:s.playerHand,deck:s.playerDeck};
});
t('F03','Shadow Switch dodge repositions to attack-facing lane',()=>{
 const s=newGame();setHero(s,'AI','LEFT','S0-WAR-H004',100);setHero(s,'PLAYER','CENTER','S0-THF-H008',100);setHero(s,'PLAYER','LEFT','S0-WAR-H001',100);s.playerHand=['S0-THF-023'];startPrimal(s,'AI','LEFT','CENTER');const opt=responseFor(s,'S0-THF-023');assert(opt,'Shadow Switch missing');
 R.resolveResponseWindow(opt);if(s.pending?.type==='response_payment_choice')assert(R.commitResponsePaymentChoice());
 assert.equal(s.playerHeroes.LEFT.card_id,'S0-THF-H008');return{left:s.playerHeroes.LEFT.card_id,center:s.playerHeroes.CENTER.card_id};
});
t('F03','AI Escape Arrow pays mandatory extra card or cannot dodge',()=>{
 const s=newGame();setHero(s,'PLAYER','CENTER','S0-WAR-H004',100);setHero(s,'AI','CENTER','S0-ARC-H002',100);s.aiHand=['S0-ARC-003','S0-WAR-001'];s.aiDeck=[];s.turn='PLAYER';s.phase='Battle';
 startPrimal(s,'PLAYER','CENTER','CENTER');const opt=responseFor(s,'S0-ARC-003');assert(opt,'Escape Arrow missing');
 R.resolveResponseWindow(opt);if(s.pending?.type==='response_payment_choice')assert(R.commitResponsePaymentChoice());
 assert.equal(s.aiHand.length,0,'must discard response and an additional Hand card');assert(s.aiDiscard.includes('S0-WAR-001'));return{remainingHand:s.aiHand.length,discard:s.aiDiscard.slice(-3)};
});
t('F03','Primal Defense opens Binding Light counter after payment',()=>{
 const s=newGame();setHero(s,'AI','CENTER','S0-CLE-H002',100);setHero(s,'PLAYER','CENTER','S0-WAR-H001',100);
 s.playerHand=['S0-WAR-012'];s.aiHand=['S0-CLE-012'];s.pvpHumanVsHuman=true;startPrimal(s,'AI','CENTER','CENTER');const opt=responseFor(s,'S0-WAR-012');assert(opt,'Deflect missing');
 R.resolveResponseWindow(opt);if(s.pending?.type==='response_payment_choice')assert(R.commitResponsePaymentChoice());
 assert(s.responseWindow&&s.responseWindow.kind==='incoming_card','Binding Light cancel window not opened');return{kind:s.responseWindow.kind,options:s.responseWindow.options?.map(x=>x.card_id)};
});


t('F03','Binding Light counter window can PASS and finish Primal',()=>{
 const s=newGame();setHero(s,'AI','CENTER','S0-CLE-H002',100);setHero(s,'PLAYER','CENTER','S0-WAR-H001',100);
 s.playerHand=['S0-WAR-012'];s.aiHand=['S0-CLE-012'];s.pvpHumanVsHuman=true;
 startPrimal(s,'AI','CENTER','CENTER');const opt=responseFor(s,'S0-WAR-012');assert(opt);
 R.resolveResponseWindow(opt);if(s.pending?.type==='response_payment_choice')assert(R.commitResponsePaymentChoice());
 assert.equal(s.responseWindow?.kind,'incoming_card');
 // Declining the counter still resolves the committed Defense and original Primal.
 R.resolveResponseWindow(null);
 assert(!s.responseWindow,'counter PASS left a pending Response');
 assert(!s.pending,'counter PASS left a mandatory choice');
 return{hp:s.playerHeroes.CENTER.hp,hand:s.aiHand};
});

// F06/7/9/10/11/12 standalone logic tied to current engine.
t('F06','Legacy once key follows Hero after lane swap',()=>{
 const s=newGame();const ability={action_key:'warrior_relic',once_per_turn:true};const h=setHero(s,'PLAYER','LEFT','S0-WAR-L001',0);
 h.legacy_mode=true;h.mode='LEGACY';h.active_legacy_card_id='S0-WAR-L001';R.markLegacyAbilityUsed(s,'PLAYER','LEFT',ability);assert(R.legacyAbilityUsedThisTurn(s,'PLAYER','LEFT',ability));
 s.playerHeroes.LEFT=s.playerHeroes.CENTER;s.playerHeroes.CENTER=h;assert(R.legacyAbilityUsedThisTurn(s,'PLAYER','CENTER',ability),'Legacy usage bypassed by Reposition');return{key:h.legacy_ability_used_key};
});
t('F07','Stun prevents Bard/Maestro exchange, not Draw',()=>{
 const s=newGame();s.phase='Draw';s.turn='PLAYER';const bard=setHero(s,'PLAYER','LEFT','S0-ARC-H004',100); // Bard in this lineage?
 const classes=['S0-ARC-H004','S0-ARC-H005','S0-ARC-H006','S0-ARC-H007','S0-ARC-H008','S0-ARC-H009'];
 const bardId=ctx.GL_CARD_DEFINITIONS.cards.find(c=>c.family==='Hero'&&(c.identity?.display_class==='Bard'||c.identity?.display_class==='Maestro')).card_id;bard.card_id=bardId;s.playerHand=['S0-WAR-001'];
 const before=R.s0BardDrawOption(s,'PLAYER');assert(before,'Bard should have exchange before Stun');bard.statuses=[{name:'Stun',duration:2}];assert.equal(R.s0BardDrawOption(s,'PLAYER'),null,'Bard should not exchange under Stun');return{bardId};
});
t('F09','REFLECT-only response allowed under PIERCING at correct ranks',()=>{
 const s=newGame();setHero(s,'PLAYER','CENTER','S0-MAG-H008',100);s.playerHand=['S0-WAR-029'];s.phase='Battle';
 const incoming={damage:60,damage_type:'Physical',attack_type:'Single Target',cannot_dodge:false,cannot_block:true,target_lane:'CENTER',source_lane:'CENTER',card_id:'S0-WAR-001'};
 const opts=R.responseOptionsFor(s,'PLAYER',incoming);assert(opts.some(o=>o.card_id==='S0-WAR-029'),'Runic Guard Reflect not offered');
 setHero(s,'PLAYER','CENTER','S0-WAR-H007',100);const low=R.responseOptionsFor(s,'PLAYER',incoming);assert(!low.some(o=>o.card_id==='S0-WAR-029'),'Warrior Rank I cannot REFLECT under Piercing');return{high:opts.map(x=>x.card_id),low:low.map(x=>x.card_id)};
});
t('F10','Enrage stays active through first use, expires at End',()=>{
 const s=newGame();const h=setHero(s,'PLAYER','CENTER','S0-WAR-H002',100);s.activeAttachments=[{attachment_id:'ENRAGE:1',side:'PLAYER',lane:'CENTER',slot:0,card_id:'S0-WAR-013',tick_phase:'END_PHASE',remaining_count:1,counter_mode:'countdown',role:'ongoing'}];h.attachments[0]='S0-WAR-013';
 assert(R.hasEnrageBonus(h));R.consumeEnrageBonus(h);assert(R.hasEnrageBonus(h),'Enrage unexpectedly spent after hit');s.phase='End';R.expireEndPhaseAttachmentsForSide(s,'PLAYER');assert(!R.hasEnrageBonus(h),'Enrage persisted after End');return{attachments:s.activeAttachments.length,expiredAtEnd:true};
});
t('F11','Sixth Sense distinguishes Defense from Tactical REACTION',()=>{
 assert.equal(R.legalDefSkillCard(R.card('S0-CLE-012')),false);assert.equal(R.legalDefSkillCard(R.card('S0-ARC-029')),true);return{tactical:false,defense:true};
});
t('F12','Legacy candidates include Skill just paid into Discard',()=>{
 const s=newGame();const legacy=R.card('S0-ARC-L001');const ab=R.legacyAbilityData(legacy);assert(ab&&ab.effect,'Golden Arrows ability missing');
 const costId='S0-ARC-001';s.playerDiscard=[costId];const choices=R.legacyDiscardReturnCandidates(s,'PLAYER',ab,[costId]);assert(choices.some(c=>c.card_id===costId),'just-paid Skill excluded');return{choices};
});

const summary={build:'VS AI Season 0 RC34 Patch Candidate',date:new Date().toISOString(),passed:report.filter(x=>x.ok).length,failed:report.filter(x=>!x.ok).length,tests:report};
fs.writeFileSync(path.join(__dirname,'RC34_PVP_REGRESSION.json'),JSON.stringify(summary,null,2));
console.log('RESULT',summary.passed,'/',report.length,'passed');if(summary.failed)process.exitCode=1;
