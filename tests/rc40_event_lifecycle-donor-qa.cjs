'use strict';
// Executes official R3.8 Event play through the real commit and authoritative
// Attachment lifecycle. Prior test RC40_CANONICAL_EFFECTS_QA checks card / cost
// and ability details; this test checks card use, turns, AI, and damage.
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'../public/battle');
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,performance:{now:()=>0},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame(){},cancelAnimationFrame(){},crypto:crypto.webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://rc40test/index.html',origin:'http://rc40test'};ctx.navigator={userAgent:'RC40 Event QA'};
ctx.document={readyState:'loading',addEventListener(){},getElementById(){return null;},querySelector(){return null},querySelectorAll(){return []},createElement(){return {style:{},appendChild(){},setAttribute(){}}},documentElement:{classList:{toggle(){}}},body:{appendChild(){}}};
vm.createContext(ctx);
const exposure=`window.__QE={get state(){return appState},setState:s=>{appState=s;matchStarted=true;SUPPRESS_RENDER=true;},initCards,card,heroState,buildInitialMatchState,getLegalActions,commitPlayedCard,executeAIAction,aiChooseAction:chooseAIAction,sourceShouldExhaust,coordinationAttackBonus,defensiveFormationBonus,expireEndPhaseAttachmentsForSide,responseOptionsFor,applyResolvedAttackDamage,attachmentPolicyForCard,heroIdFrom,manaPoolCardsForSide,drawManaCards};\n})();`;
for(const file of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let src=fs.readFileSync(path.join(root,file),'utf8');if(file.endsWith('app.bundle.js'))src=src.replace(/\n\}\)\(\);\s*$/,exposure);
 vm.runInContext(src,ctx,{filename:file,timeout:60000});
}
ctx.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true);
const q=ctx.__QE;q.initCards();let results=[];
function test(name,fn){try{fn();results.push({name,status:'PASS'});console.log('PASS',name)}catch(e){results.push({name,status:'FAIL',error:String(e.stack||e)});console.error('FAIL',name,String(e.stack||e).split('\n').slice(0,7).join(' | '));}}
function fixture(side,id='S0-EVT-012',diversity=false){
 const s=q.buildInitialMatchState();s.preGame=null;s.openingFlowCompleted=true;s.gameOver=false;s.pending=null;s.responseWindow=null;s.turn=side;s.phase='Deploy';s.round=7;s.pvpHumanVsHuman=false;
 s[side==='AI'?'aiHand':'playerHand']=[id];
 const key=side==='AI'?'aiHeroes':'playerHeroes';
 s[key].LEFT=q.heroState('S0-WAR-H001',side,'LEFT');
 s[key].CENTER=q.heroState(diversity?'S0-MAG-H001':'S0-WAR-H001',side,'CENTER');
 s[key].RIGHT=q.heroState(diversity?'S0-ARC-H001':'S0-WAR-H001',side,'RIGHT');
 // Opening coin flip would normally draw starting Shards; this fixture does it directly.
 q.drawManaCards(s,side,3,"QA starting Shards");
 const pool=q.manaPoolCardsForSide(s,side);assert(pool.length>=3,`${side} initial Mana Shards`);
 q.setState(s);return s;
}
function legalEvent(s,side,id){const legal=q.getLegalActions(side,s).filter(a=>a.card_id===id&&a.source_lane&&a.type==='PLAY_CARD');assert(legal.length,`No legal ${id} Event action: ${JSON.stringify(q.getLegalActions(side,s).filter(a=>a.card_id===id))}`);return legal[0];}
function active(s,side,id){return (s.activeAttachments||[]).filter(a=>a.card_id===id&&a.side===side);}
test('Defensive Formation is a playable Deploy BUFF Event with 3 Mana; PLAYER source stays Ready',()=>{
 const s=fixture('PLAYER'),act=legalEvent(s,'PLAYER','S0-EVT-012');assert(q.commitPlayedCard(s,Object.assign({},act,{_mana_choice_complete:true,selected_mana_shard_uids:undefined,selected_mana_class_uids:q.manaPoolCardsForSide(s,"PLAYER").filter(x=>x.kind==="CLASS").map(x=>x.uid)})));
 assert.equal(s.playerHand.length,0);assert.equal(active(s,'PLAYER','S0-EVT-012').length,1);
 assert.equal(active(s,'PLAYER','S0-EVT-012')[0].modifier_amount,40);assert.equal(s.playerHeroes[act.source_lane].exhausted,false);
 assert.equal(active(s,'PLAYER','S0-EVT-012')[0].tick_phase,'END_PHASE');
 assert.equal(active(s,'PLAYER','S0-EVT-012')[0].remaining_count,2);
});
test('Defensive Formation lasts through first owner End then expires at second, discarding exactly once',()=>{
 const s=fixture('AI','S0-EVT-012',true),act=legalEvent(s,'AI','S0-EVT-012');assert(q.executeAIAction(s,act));
 assert.equal(s.aiHand.length,0);assert.equal(active(s,'AI','S0-EVT-012').length,1);assert.equal(active(s,'AI','S0-EVT-012')[0].modifier_amount,80);
 const before=s.aiDiscard.filter(x=>x==='S0-EVT-012').length;s.phase='End';
 assert.equal(q.defensiveFormationBonus(s,'AI','PLAYER','Magical'),80);
 assert.equal(q.expireEndPhaseAttachmentsForSide(s,'AI'),1);
 assert.equal(active(s,'AI','S0-EVT-012').length,1);assert.equal(active(s,'AI','S0-EVT-012')[0].remaining_count,1);
 assert.equal(q.defensiveFormationBonus(s,'AI','PLAYER','Physical'),80);
 assert.equal(q.expireEndPhaseAttachmentsForSide(s,'AI'),1);
 assert.equal(active(s,'AI','S0-EVT-012').length,0);
 assert.equal(q.defensiveFormationBonus(s,'AI','PLAYER','Magical'),0);
 assert.equal(s.aiDiscard.filter(x=>x==='S0-EVT-012').length,before+1);
});
test('Live Defensive Formation mitigates real attack (all allied lanes, Physical & Magical), not friendly damage',()=>{
 const s=fixture('AI','S0-EVT-012',true);assert(q.executeAIAction(s,legalEvent(s,'AI','S0-EVT-012')));
 s.playerHeroes.CENTER=q.heroState('S0-CLE-H001','PLAYER','CENTER');s.playerHeroes.CENTER.hp=100;
 for(const lane of ['LEFT','CENTER','RIGHT']){s.aiHeroes[lane].hp=150;s.aiHeroes[lane].maxHp=150;}
 const dmg=q.applyResolvedAttackDamage(s,'S0-WAR-001','PLAYER','CENTER','AI','RIGHT',100,'Physical',false,0,false,false);
 assert.equal(dmg.active_reduction,80);assert.equal(dmg.primary_damage,20);assert.equal(s.aiHeroes.RIGHT.hp,130);
 s.aiHeroes.RIGHT.hp=150;
 const mag=q.applyResolvedAttackDamage(s,'S0-CLE-006','PLAYER','CENTER','AI','RIGHT',90,'Magical',false,0,false,false);
 assert.equal(mag.active_reduction,80);assert.equal(mag.primary_damage,10);assert.equal(s.aiHeroes.RIGHT.hp,140);
});
test('Coordination Attack real commit +20 for mixed classes, duration two owner End phases',()=>{
 const s=fixture('AI','S0-EVT-011',true);assert(q.executeAIAction(s,legalEvent(s,'AI','S0-EVT-011')));
 assert.equal(active(s,'AI','S0-EVT-011').length,1);
 for(const lane of ['LEFT','CENTER','RIGHT'])assert.equal(q.coordinationAttackBonus(s,s.aiHeroes[lane]),20);s.phase='End';
 assert.equal(q.expireEndPhaseAttachmentsForSide(s,'AI'),1);
 assert.equal(q.coordinationAttackBonus(s,s.aiHeroes.CENTER),20);
 assert.equal(q.expireEndPhaseAttachmentsForSide(s,'AI'),1);
 assert.equal(active(s,'AI','S0-EVT-011').length,0);
 assert.equal(q.coordinationAttackBonus(s,s.aiHeroes.CENTER),0);
 assert.equal(s.aiDiscard.filter(x=>x==='S0-EVT-011').length,1);
});
test('Defensive Formation in hand is not offered as Response to Area Attack',()=>{
 const s=fixture('PLAYER','S0-EVT-012',true);s.phase='Battle';s.turn='AI';
 const incoming={card_id:'S0-WAR-016',source_side:'AI',source_lane:'CENTER',target_side:'PLAYER',target_lane:'LEFT',damage:40,damage_type:'Physical',area:true,attack_type:'Area Damage',affected_lanes:['LEFT','CENTER','RIGHT'],selected_target_lanes:['LEFT','CENTER','RIGHT']};
 const options=q.responseOptionsFor(s,'PLAYER',incoming);
 assert(!options.some(x=>x.card_id==='S0-EVT-012'));
});
const pass=results.filter(x=>x.status==='PASS').length;
const result={passed:pass,total:results.length,failed:results.length-pass,results,version:'RC40',canonical:'MainDeck R3.8 / LegacyDeck R3.7'};
fs.writeFileSync(path.join(__dirname,'RC40_EVENT_LIFECYCLE_RESULTS.json'),JSON.stringify(result,null,2));
console.log(`RC40 EVENT LIFECYCLE ${pass}/${results.length} PASS`);
if(pass!==results.length)process.exitCode=1;
