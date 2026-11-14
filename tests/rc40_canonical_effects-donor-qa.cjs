'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'../public/battle');
const fakeDom={};
for(const name of ['choiceOverlay','choiceTitle','choiceConfirm','choiceBody']){
 fakeDom[name]={style:{},classList:{add(){},remove(){},contains(){return false;}},innerHTML:'',textContent:'',disabled:false,children:[]};
}
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,performance:{now:()=>0},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame(){},cancelAnimationFrame(){},crypto:crypto.webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://test/index.html',origin:'http://test'};ctx.navigator={userAgent:'RC40 Canonical QA'};
ctx.document={readyState:'loading',addEventListener(){},getElementById(id){return fakeDom[id]||null;},querySelector(){return null},querySelectorAll(){return []},createElement(){return {style:{},appendChild(){},setAttribute(){}}},documentElement:{classList:{toggle(){}}},body:{appendChild(){}}};
vm.createContext(ctx);
const injection=`window.__Q40={get state(){return appState},setState:s=>{appState=s;matchStarted=true;SUPPRESS_RENDER=true;},setSuppress:v=>{SUPPRESS_RENDER=!!v;},
initCards,card,heroState,buildInitialMatchState,sanitizeLegacySlot,heroIdFrom,cardFamily,isUltimateCard,
getActivatedLegacyAbilities,legacyAbilityData,legacyCostCount,legacyCostMinCount,legacyCostCandidates,legacyCostSelectionIsValid,payLegacyAbilityCost,
beginActivatedLegacyAbility,selectLegacyCostChoice,renderLegacyCostChoice,commitLegacyCostChoice,renderLegacyCardChoice,selectLegacyCardChoice,commitLegacyCardChoice,
legacyDiscardReturnCandidates,legacyDeckSearchCandidates,aiChooseLegacyCostIndexes,executeAILegacyAbility,
attachmentPolicyForCard,applyImmediateEventItemEffects,isDefensiveFormationCard,isResponseOnly,sourceShouldExhaust,defensiveFormationBonus,
applyResolvedAttackDamage,expireEndPhaseAttachmentsForSide,coordinationAttackBonus,coordinationAttackBonusAmount,
activeAlliedBaseFamiliesDifferent,calculateCardCost:cardCost,damageTypeForActionSource};\n})();`;
for(const file of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let src=fs.readFileSync(path.join(root,file),'utf8');
 if(file.endsWith('app.bundle.js'))src=src.replace(/\n\}\)\(\);\s*$/,injection);
 vm.runInContext(src,ctx,{filename:file,timeout:60000});
}
ctx.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true);
const q=ctx.__Q40;q.initCards();
let total=0,failed=0;const records=[];
function test(name,fn){total++;try{fn();records.push({name,status:'PASS'});console.log('PASS',name)}catch(e){failed++;records.push({name,status:'FAIL',error:String(e.stack||e)});console.error('FAIL',name,String(e.stack||e).split('\n').slice(0,5).join(' | '));}}
const skills={ARC:['S0-ARC-005','S0-ARC-010','S0-ARC-012'],CLE:['S0-CLE-002','S0-CLE-007','S0-CLE-010'],MAG:['S0-MAG-005','S0-MAG-006','S0-MAG-007'],THF:['S0-THF-003','S0-THF-010','S0-THF-011'],WAR:['S0-WAR-001','S0-WAR-002','S0-WAR-009']};
const legacyIds=Object.keys(skills).flatMap(prefix=>[`S0-${prefix}-L001`,`S0-${prefix}-L002`]);
function fresh(side,prefix,variant,qty=3){
 const s=q.buildInitialMatchState();s.preGame=null;s.openingFlowCompleted=true;s.gameOver=false;s.turn=side;s.phase='Deploy';s.round=6;s.pending=null;s.responseWindow=null;s.pvpHumanVsHuman=false;
 const pl=side==='AI'?'ai':'player',lane='CENTER',id=`S0-${prefix}-${variant}`;
 s[`${pl}Heroes`][lane]=q.sanitizeLegacySlot({card_id:id,side,lane,mode:'LEGACY',legacy_mode:true,defeated_hero_snapshot:{card_id:`S0-${prefix}-H001`}});
 s[`${pl}Hand`]=skills[prefix].slice(0,qty);
 s[`${pl}Discard`]=['S0-MAG-019','S0-MAG-005','S0-CLE-006','S0-ITM-001','S0-ITM-008'];
 s[`${pl}Deck`]=['S0-ITM-001','S0-EVT-001','S0-MAG-005','S0-MAG-019','S0-CLE-007','S0-THF-001','S0-ARC-005'];
 s[`${pl}Racial`]=2;
 q.setState(s);return s;
}
function arrays(s,side){return {hand:s[side==='AI'?'aiHand':'playerHand'],discard:s[side==='AI'?'aiDiscard':'playerDiscard'],deck:s[side==='AI'?'aiDeck':'playerDeck']};}
// All 10 routes; both Player and Intermediate AI work, L001 variable discard: 1 OR 2 (not 0).
for(const id of legacyIds){
 const prefix=id.split('-')[1],variant=id.split('-')[2],l001=variant==='L001';
 test(`${id} R3.7 runtime matches printed cost / selection / target filters`,()=>{
   const s=fresh('PLAYER',prefix,variant),a=q.legacyAbilityData(q.card(id));assert(a);
   assert.equal(a.cost.discard_from_hand.filter.class_family,({ARC:'Archer',CLE:'Cleric',MAG:'Mage',THF:'Thief',WAR:'Warrior'})[prefix]);
   assert.equal(q.legacyCostMinCount(a),1);assert.equal(q.legacyCostCount(a),l001?2:1);
   assert.equal(a.effect.type,l001?'DRAW_PER_DISCARD':({ARC:'RETURN_DISCARD_TO_HAND',CLE:'SEARCH_DECK_TO_HAND',MAG:'SEARCH_DECK_TO_HAND',THF:'RETURN_DISCARD_TO_HAND',WAR:'RETURN_DISCARD_TO_HAND'})[prefix]);
   if(l001){assert(q.legacyCostSelectionIsValid(a,1));assert(q.legacyCostSelectionIsValid(a,2));assert(!q.legacyCostSelectionIsValid(a,0));assert(!q.legacyCostSelectionIsValid(a,3));}
   else{assert(q.legacyCostSelectionIsValid(a,1));assert(!q.legacyCostSelectionIsValid(a,2));}
   const options=q.getActivatedLegacyAbilities(s,'PLAYER','CENTER');assert.equal(options.length,1);
 });
 test(`${id} Player center-selection flow resolves and obeys once-per-turn`,()=>{
   const s=fresh('PLAYER',prefix,variant),before=arrays(s,'PLAYER'),bhand=before.hand.slice(),bdeck=before.deck.length,bdisc=before.discard.length;
   const a=q.getActivatedLegacyAbilities(s,'PLAYER','CENTER')[0];assert(a);
   assert(q.beginActivatedLegacyAbility(s,'PLAYER','CENTER',a.abilityId));assert.equal(s.pending.type,'legacy_cost_selection');
   assert(q.selectLegacyCostChoice(0));
   assert(q.commitLegacyCostChoice());
   if(l001){assert(!s.pending,'L001 should auto draw after confirmed hand cost');assert.equal(s.playerDeck.length,bdeck-1);assert.equal(s.playerDiscard.length,bdisc+1);assert.equal(s.playerHand.length,bhand.length);}
   else{
      assert.equal(s.pending.type,'legacy_card_choice');
      assert(s.pending.candidates.length>=1);
      assert(s.pending.candidates.every(x=>prefix==='THF'?q.card(x.card_id).family==='Item':q.card(x.card_id).family==='Skill'));
      if(['ARC','WAR'].includes(prefix))assert(!s.pending.candidates.some(x=>q.isUltimateCard(q.card(x.card_id))),'Ultimate may never be returned from Discard');
      assert(q.selectLegacyCardChoice(0));assert(q.commitLegacyCardChoice());
      assert(!s.pending);
      assert.equal(s.playerHand.length,bhand.length);
      assert.equal(s.playerDeck.length,bdeck-(prefix==='CLE'||prefix==='MAG'?1:0));
   }
   assert.equal(q.getActivatedLegacyAbilities(s,'PLAYER','CENTER').length,0);
 });
 test(`${id} AI chooses and executes new ability`,()=>{
   const s=fresh('AI',prefix,variant),a=q.getActivatedLegacyAbilities(s,'AI','CENTER')[0];assert(a);
   const before=arrays(s,'AI'),bdeck=before.deck.length,bdisc=before.discard.length,bhand=before.hand.length;
   const cost=q.aiChooseLegacyCostIndexes(s,a.ability);assert.equal(cost.length,l001?2:1);
   assert(q.executeAILegacyAbility(s,{type:'LEGACY_ABILITY',side:'AI',source_side:'AI',source_lane:'CENTER',card_id:id,ability_id:a.abilityId}));
   assert(!s.pending);assert.equal(q.getActivatedLegacyAbilities(s,'AI','CENTER').length,0);
   assert.equal(s.aiHand.length,bhand);
   if(l001){assert.equal(s.aiDeck.length,bdeck-2);assert.equal(s.aiDiscard.length,bdisc+2);}
   else if(['CLE','MAG'].includes(prefix)){assert.equal(s.aiDeck.length,bdeck-1);assert.equal(s.aiDiscard.length,bdisc+1);}
 });
 if(l001){
  test(`${id} Player one-eligible 1-card option and zero-card rejection`,()=>{
    let s=fresh('PLAYER',prefix,variant,1),a=q.getActivatedLegacyAbilities(s,'PLAYER','CENTER')[0];assert(a,'one Skill must be sufficient');
    const before=s.playerHand.slice(),beforeDiscard=s.playerDiscard.slice();
    assert(!q.payLegacyAbilityCost(s,'PLAYER',a.ability,[]).ok);
    assert.equal(s.playerHand.length,before.length);assert.equal(s.playerDiscard.length,beforeDiscard.length);
    assert(q.beginActivatedLegacyAbility(s,'PLAYER','CENTER',a.abilityId));assert.equal(s.pending.min_cost,1);
    assert(q.selectLegacyCostChoice(0));assert(q.commitLegacyCostChoice());assert(!s.pending);
    assert.equal(s.playerHand.length,1);assert.equal(s.playerDiscard.length,beforeDiscard.length+1);
    assert(q.getActivatedLegacyAbilities(s,'PLAYER','CENTER').length===0);
  });
 }
}
// Browser center choice UI is exactly the shared battlefield overlay, not a popup.
test('L001 center choice enables Confirm at one or two selections (not zero)',()=>{
 const s=fresh('PLAYER','ARC','L001');const a=q.getActivatedLegacyAbilities(s,'PLAYER','CENTER')[0];assert(q.beginActivatedLegacyAbility(s,'PLAYER','CENTER',a.abilityId));
 q.setSuppress(false);q.renderLegacyCostChoice();assert(fakeDom.choiceBody.innerHTML.includes('Discard 1 to 2'));
 assert(fakeDom.choiceConfirm.disabled,'zero should be disabled');
 q.setSuppress(true);q.selectLegacyCostChoice(0);q.setSuppress(false);q.renderLegacyCostChoice();assert(!fakeDom.choiceConfirm.disabled,'one should be enabled');
 q.setSuppress(true);q.selectLegacyCostChoice(1);q.setSuppress(false);q.renderLegacyCostChoice();assert(!fakeDom.choiceConfirm.disabled,'two should be enabled');
 q.setSuppress(true);
});
test('L002 Main Deck and Discard selectors remain centered with legal card filter',()=>{
 const s=fresh('PLAYER','MAG','L002');const a=q.getActivatedLegacyAbilities(s,'PLAYER','CENTER')[0];assert(q.beginActivatedLegacyAbility(s,'PLAYER','CENTER',a.abilityId));q.selectLegacyCostChoice(0);assert(q.commitLegacyCostChoice());
 q.setSuppress(false);q.renderLegacyCardChoice();assert(fakeDom.choiceBody.innerHTML.includes('card-search-choice-grid'));assert(fakeDom.choiceTitle.textContent.startsWith('Legacy Choice'));assert(fakeDom.choiceBody.innerHTML.includes('Select'));
 q.setSuppress(true);assert(s.pending.candidates.some(x=>x.card_id==='S0-MAG-019'),'Ultimate Skill may be taken from Main Deck');
});
test('Hidden Archives L002 activates with full Racial Token pool: no obsolete token cap gate',()=>{
 const s=fresh('PLAYER','THF','L002');s.racial=2;assert.equal(q.getActivatedLegacyAbilities(s,'PLAYER','CENTER').length,1);
});
// Two-turn buff duration and no response window
test('Official R3.8 Event data, Mana 3 and BUFF timing without exhaust',()=>{
 const df=q.card('S0-EVT-012'),ca=q.card('S0-EVT-011');assert.equal(df.cost.mana,3);assert(df.card_text.startsWith('BUFF For 2 turns'));
 assert(!q.isResponseOnly(df));assert(!q.sourceShouldExhaust(df,null));assert(!q.sourceShouldExhaust(ca,null));
 assert.equal(q.attachmentPolicyForCard(df,null).remaining_count,2);assert.equal(q.attachmentPolicyForCard(ca,null).remaining_count,2);
});
test('Defensive Formation 40 or 80 reduction from committed three-base-class condition',()=>{
 const s=fresh('PLAYER','ARC','L001');s.playerHeroes.CENTER=q.heroState('S0-WAR-H001','PLAYER','CENTER');s.playerHeroes.LEFT=q.heroState('S0-ARC-H001','PLAYER','LEFT');s.playerHeroes.RIGHT=q.heroState('S0-MAG-H001','PLAYER','RIGHT');
 const action={card_id:'S0-EVT-012',source_side:'PLAYER',source_lane:'CENTER'},hero=s.playerHeroes.CENTER;
 q.applyImmediateEventItemEffects(s,'PLAYER',q.card('S0-EVT-012'),hero,null,hero,action);
 assert.equal(action.attachment_effect.modifier_amount,80);
 // A defeated Hero still counts as a member of the three-Hero Base Class roster.
 s.playerHeroes.RIGHT.hp=0;const action2={card_id:'S0-EVT-012',source_side:'PLAYER',source_lane:'CENTER'};
 q.applyImmediateEventItemEffects(s,'PLAYER',q.card('S0-EVT-012'),hero,null,hero,action2);
 assert.equal(action2.attachment_effect.modifier_amount,80);
 // But a repeated Base Class never qualifies, whether living or defeated.
 s.playerHeroes.RIGHT.card_id='S0-WAR-H001';const action3={card_id:'S0-EVT-012',source_side:'PLAYER',source_lane:'CENTER'};
 q.applyImmediateEventItemEffects(s,'PLAYER',q.card('S0-EVT-012'),hero,null,hero,action3);
 assert.equal(action3.attachment_effect.modifier_amount,40);
});
test('Defensive Formation reduces all incoming Physical and Magical attack damage, never Direct or own',()=>{
 const s=q.buildInitialMatchState();q.setState(s);s.round=6;s.phase='Battle';s.gameOver=false;
 s.playerHeroes.CENTER=q.heroState('S0-WAR-H001','PLAYER','CENTER');s.aiHeroes.CENTER=q.heroState('S0-MAG-H001','AI','CENTER');s.aiHeroes.CENTER.hp=200;s.aiHeroes.CENTER.maxHp=200;
 s.activeAttachments=[{attachment_id:'QA:DEF',side:'AI',lane:'CENTER',slot:0,card_id:'S0-EVT-012',modifier_amount:40,remaining_count:2,tick_phase:'END_PHASE'}];
 assert.equal(q.defensiveFormationBonus(s,'AI','PLAYER','Physical'),40);assert.equal(q.defensiveFormationBonus(s,'AI','PLAYER','Magical'),40);
 assert.equal(q.defensiveFormationBonus(s,'AI','AI','Physical'),0);assert.equal(q.defensiveFormationBonus(s,'AI','PLAYER','Direct'),0);
 const physical=q.applyResolvedAttackDamage(s,'S0-WAR-001','PLAYER','CENTER','AI','CENTER',60,'Physical',false,0,false,false);
 assert.equal(physical.active_reduction,40);assert.equal(physical.primary_damage,20);
 s.aiHeroes.CENTER.hp=200;
 const magic=q.applyResolvedAttackDamage(s,'S0-CLE-006','PLAYER','CENTER','AI','CENTER',100,'Magical',false,0,false,false);
 assert.equal(magic.active_reduction,40);assert.equal(magic.primary_damage,60);
});
test('Official R3.8 Area Attacks are data-authoritative and Magical',()=>{
 for(const id of ['S0-MAG-019','S0-THF-018']){const c=q.card(id);assert.equal(c.classification,'Area Attack');assert.equal(c.attack.damage_type,'Magical');assert.equal(c.attack.attack_label,'Area Attack');}
 assert(q.card('S0-THF-018').card_text.includes('CONDITION'));assert.equal(q.card('S0-WAR-021').attack.attack_label,'Physical Attack');
});
// Direct 242 artwork parity (source RARs were unpacked outside the deliverable).
test('All 242 canonical Main/Legacy artwork SHA256 values match shipped bytes and manifest',()=>{
 const d=ctx.GL_CARD_DEFINITIONS,man=ctx.GL_ASSET_MANIFEST;assert.equal(d.cards.length,242);
 for(const c of d.cards){const art=fs.readFileSync(path.join(root,c.asset.file)),hash=crypto.createHash('sha256').update(art).digest('hex');assert.equal(hash,c.asset.sha256,c.card_id);assert.equal(hash,man.cards[c.card_id].sha256,c.card_id);}
 assert.equal(man.artwork_source,'MainDeck R3.8 / LegacyDeck R3.7');
});
test('All 242 card/preview/recipe/JSON mirrors and changed effects remain synchronized',()=>{
 const cards=ctx.GL_CARD_DEFINITIONS.cards,reg=ctx.GRANDIS_LEGACY_RUNTIME_DATA.cards,preview=ctx.GRANDIS_LEGACY_CARD_PREVIEW.cards,recipes=ctx.GL_EFFECT_RECIPES.effect_recipes;
 const cp=Object.fromEntries(cards.map(c=>[c.card_id,c])),rr=Object.fromEntries(reg.map(c=>[c.card_id,c])),pv=Object.fromEntries(preview.map(c=>[c.card_id,c])),re=Object.fromEntries(recipes.map(c=>[c.card_id,c]));
 const disk=JSON.parse(fs.readFileSync(path.join(root,'runtime/season0-generated/s0-card-definitions.json'),'utf8'));
 for(const id of Object.keys(cp)){
  const a=cp[id],b=rr[id],c=pv[id],d=re[id],e=disk.cards.find(x=>x.card_id===id);
  assert(b&&c&&d&&e,id);assert.equal(a.card_text,b.card_text,id);assert.equal(a.card_text,e.card_text,id);assert.equal(a.printed.text,c.printed.text,id);assert.equal(a.card_text,d.s0_authority_recipe.printedFullText,id);
  assert.equal(a.asset.sha256,c.asset.sha256,id);assert.equal(a.asset.sha256,d.s0_authority_recipe.visualSHA256,id);
 }
});
const result={passed:total-failed,total,failed,records,date:'2026-11-14',print:'MainDeck R3.8 / LegacyDeck R3.7'};
fs.writeFileSync(path.join(__dirname,'RC40_CANONICAL_EFFECTS_RESULTS.json'),JSON.stringify(result,null,2));
console.log(`RC40 CANONICAL QA ${result.passed}/${total} PASS`);if(failed)process.exitCode=1;
