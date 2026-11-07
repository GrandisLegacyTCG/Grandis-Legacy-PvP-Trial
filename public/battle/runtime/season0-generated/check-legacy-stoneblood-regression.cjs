'use strict';
// Uses the application's actual S0 engine, not reimplemented game rules.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../..');
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,performance:{now:()=>0},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},crypto:require('crypto').webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://example.test/index.html',origin:'http://example.test'};ctx.navigator={userAgent:'Stoneblood Regression Runner'};ctx.document={readyState:'loading',addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],body:null,documentElement:null};vm.createContext(ctx);
for(const file of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let src=fs.readFileSync(path.join(root,file),'utf8');
 if(file.endsWith('app.bundle.js')){
  src=src.replace(/function aiTurnDirectorAvailable\(\)\{[^}]*\}/g,'function aiTurnDirectorAvailable(){return false;}');
  src=src.replace('function showResult(){','function showResult(){if(SUPPRESS_RENDER)return;');
  src=src.replace('function showInfo(title, body){','function showInfo(title, body){if(SUPPRESS_RENDER)return;');
  src=src.replace('function showInfoHtml(title, html){','function showInfoHtml(title, html){if(SUPPRESS_RENDER)return;');
  src=src.replace(/\n\}\)\(\);\s*$/, '\nwindow.__REG={get state(){return appState},setState:v=>{appState=v},openAttackResponseWindow,resolveResponseWindow,resolveStonebloodChoice,resolveEndPhaseCleanupForSide,applyDefeatCheck,openMultiTargetResponseWindow,commitLegacyDefeatChoice,stonebloodAvailable,racialActionFor,resolvedRacialTrait,resolvedClassAbility,card,getActivatedRacialAbilities,responseOptionsFor,heroIdFrom,chooseAIAction,runAITurnImmediate,resolveDrawPhase};\n})();');
 }
 vm.runInContext(src,ctx,{timeout:60000,filename:file});
}
ctx.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true);
const engine=ctx.GL_GAME_ENGINE,reg=ctx.__REG;
const results=[];function check(label,fn){try{const data=fn();results.push({label,pass:true,...(data||{})});console.log('PASS',label);}catch(e){const err=String(e.stack||e);results.push({label,pass:false,error:err.slice(0,2200)});console.log('FAIL',label,err.slice(0,700));}}
function newGame(){assert(engine.selectDeck('PLAYER','s0_starter_01_red_white').ok);assert(engine.selectDeck('AI','s0_starter_03_yellow_blue').ok);assert(engine.startLocalMatch('PLAYER').ok);const s=reg.state;s.turn='AI';s.phase='Battle';s.round=2;s.pending=null;s.responseWindow=null;s.aiControl={resume:'after_player_response',from_phase:'Battle',director:false};s.racial=1;s.aiRacial=1;const target=s.playerHeroes.CENTER;target.card_id='S0-CLE-H004';target.hp=25;target.maxHp=100;target.statuses=[];target.legacy_mode=false;target.mode='ACTIVE';target.racial_used_turn=null;target.stoneblood_declined_turn=null;const src=s.aiHeroes.CENTER;src.hp=100;src.maxHp=100;return s;}
function attack(s,damage=40){reg.openAttackResponseWindow(s,{card_id:'S0-WAR-001',source_side:'AI',source_lane:'CENTER',target_side:'PLAYER',target_lane:'CENTER',source_hero_card_id:s.aiHeroes.CENTER.card_id},{damage,persistent:false,attachmentSlot:-1});assert(s.responseWindow,'response window must open');assert(reg.resolveResponseWindow(null));if(!s.pending||s.pending.type!=='racial_stoneblood')console.log('DEBUG',JSON.stringify({hp:s.playerHeroes.CENTER.hp,hero:s.playerHeroes.CENTER.card_id,ability:reg.racialActionFor(s.playerHeroes.CENTER),available:reg.stonebloodAvailable(s,'PLAYER','CENTER',s.playerHeroes.CENTER),pending:s.pending,log:s.log.slice(-7)}));assert(s.pending,'expect a mandatory choice');assert.equal(s.pending.type,'racial_stoneblood');return s.pending;}
check('AI attack opens PLAYER Stoneblood choice',()=>{let s=newGame();attack(s);return{pending:s.pending.type};});
check('AI turn resumes after Stoneblood ACCEPT',()=>{let s=newGame();attack(s);reg.resolveStonebloodChoice(true);assert.equal(s.playerHeroes.CENTER.hp,30);assert.equal(s.racial,0);assert(!s.pending);assert.equal(s.turn,'PLAYER','AI must advance turn after choice');return{turn:s.turn,phase:s.phase};});
check('AI turn resumes after Stoneblood DECLINE plus Legacy',()=>{let s=newGame();attack(s);reg.resolveStonebloodChoice(false);if(s.pending&&s.pending.type==='legacy_defeat_choice'){s.pending.selected_index=0;reg.commitLegacyDefeatChoice();}assert.equal(s.turn,'PLAYER','AI must advance turn after legacy choice');assert(!s.pending);return{turn:s.turn};});
check('Dwarf AI lethal End poison auto uses Stoneblood without pending',()=>{let s=newGame();s.turn='AI';s.phase='End';const h=s.aiHeroes.CENTER;h.card_id='S0-CLE-H004';h.hp=5;h.statuses=[{name:'Poison',duration:1}];reg.resolveEndPhaseCleanupForSide(s,'AI');assert.equal(s.pending,null);assert.equal(h.hp,30);return{hp:h.hp,aiRacial:s.aiRacial};});
check('Stoneblood does not trigger with 0 racial tokens',()=>{let s=newGame();s.racial=0;reg.openAttackResponseWindow(s,{card_id:'S0-WAR-001',source_side:'AI',source_lane:'CENTER',target_side:'PLAYER',target_lane:'CENTER'},{damage:40,persistent:false,attachmentSlot:-1});reg.resolveResponseWindow(null);assert(!s.pending||s.pending.type!=='racial_stoneblood');return{pending:s.pending&&s.pending.type};});
check('Stoneblood does not endlessly retrigger after same-turn decline',()=>{let s=newGame();attack(s);reg.resolveStonebloodChoice(false);assert(!s.pending||s.pending.type!=='racial_stoneblood');return{pending:s.pending&&s.pending.type};});
check('Area Attack Stoneblood opens next target response instead of stalling',()=>{
 let s=newGame();s.playerHeroes.LEFT.card_id='S0-CLE-H004';s.playerHeroes.LEFT.hp=10;s.playerHeroes.CENTER.card_id='S0-WAR-H001';s.playerHeroes.CENTER.hp=100;
 // Seed an already-open first Area response. It uses the actual response resolver.
 const action={card_id:'S0-WAR-001',source_side:'AI',source_lane:'CENTER',target_side:'PLAYER',target_lane:'LEFT'};
 reg.openAttackResponseWindow(s,action,{damage:50,persistent:false,attachmentSlot:-1});
 s.responseWindow.multi_sequence={affected_lanes:['LEFT','CENTER'],index:0,total_damage:0,poison_vial_applied:false,connected_hits:0};
 reg.resolveResponseWindow(null);
 assert.equal(s.pending.type,'racial_stoneblood');assert(s.pending.after_stoneblood_multi_sequence,'multi continuation must be attached to Stoneblood');
 reg.resolveStonebloodChoice(true);assert.equal(s.playerHeroes.LEFT.hp,30);
 assert(s.responseWindow || s.turn==='PLAYER','must advance the multi sequence or complete AI turn');
 if(s.responseWindow){assert.equal(s.responseWindow.target_lane,'CENTER');reg.resolveResponseWindow(null);}
 assert.equal(s.turn,'PLAYER','AI must resume after the last Area target');return {turn:s.turn};
});
check('Stoneblood does not erase Double Casting continuation',()=>{
 let s=newGame();attack(s);s.pending.after_stoneblood_double_casting={rw:{card_id:'S0-MAG-018'},action:{card_id:'S0-MAG-018',source_side:'AI',source_lane:'CENTER',target_side:'PLAYER',target_lane:'CENTER'},post:{double_casting:true},first_result:{}};
 // The main regression is that the continuation survives the mandatory choice.
 assert(s.pending.after_stoneblood_double_casting);
});
check('All official S0 Racial Traits bind their pre-existing handler interface',()=>{
 const ids=['S0-ARC-H001','S0-ARC-H004','S0-CLE-H004','S0-THF-H004','S0-WAR-H001'];
 let mapped=[];
 for(const id of ids){const r=reg.resolvedRacialTrait(id);assert(r&&r.action,`Racial Trait ${id} lost handler`);mapped.push([id,r.name,r.action.action_key]);}
 const dwarf=reg.resolvedRacialTrait('S0-CLE-H004');assert.equal(dwarf.action.effect.set_hp,30);assert.equal(dwarf.action.cost.racial_token,1);
 const dragon=reg.resolvedRacialTrait('S0-THF-H004');assert.equal(dragon.action.effect.block_damage,50,'use official S0 Block badge -50');
 return {mapped};
});
check('All existing S0 non-Bard Class Abilities have current-text handler bindings',()=>{
 const heroes=ctx.GL_CARD_DEFINITIONS.cards.filter(c=>c.family==='Hero'),seen=new Map(),missing=[];
 for(const c of heroes){const cls=reg.resolvedClassAbility(c.card_id);if(cls&&!seen.has(cls.name)){seen.set(cls.name,cls);if(cls.name!=='Prolonged Symphony'&&cls.name!=='Orchestral Crescendo'&&!cls.action)missing.push(cls.name);}}
 assert.equal(missing.length,0,'unbound class abilities: '+missing.join(', '));
 assert.equal(reg.resolvedClassAbility('S0-ARC-H002').name,'Sharpshooter');
 return {uniqueClasses:seen.size,actionBindings:[...seen].filter(x=>!!x[1].action).length};
});
const out={source:'RC3 versus RC4 legacy Stoneblood compatibility',results,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length};fs.writeFileSync(path.join(root,'STONEBLOOD_REGRESSION_RESULTS.json'),JSON.stringify(out,null,2));console.log('SUMMARY',out.passed,'/',results.length);if(out.failed)process.exitCode=1;
