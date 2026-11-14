'use strict';
// PvP RC40 Stage 1: real shared authoritative combat resolver, no AI decision helpers.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../public/battle');
const fake={};for(const id of ['choiceOverlay','choiceTitle','choiceConfirm','choiceBody'])fake[id]={style:{},classList:{add(){},remove(){},contains(){return false;}},innerHTML:'',textContent:'',disabled:false,children:[]};
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,performance:{now:()=>0},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame(){},cancelAnimationFrame(){},crypto:crypto.webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://test/index.html',origin:'http://test'};ctx.navigator={userAgent:'RC40 PvP Burn QA'};
ctx.document={readyState:'loading',addEventListener(){},getElementById(id){return fake[id]||null;},querySelector(){return null;},querySelectorAll(){return []},createElement(){return {style:{},appendChild(){},setAttribute(){}}},documentElement:{classList:{toggle(){}}},body:{appendChild(){}}};
vm.createContext(ctx);
const inject=`window.__QA={initCards,card,buildInitialMatchState,addStatus,applyResolvedAttackDamage,heroState,poisonVialHostEligible,racialActionFor,getActivatedRacialAbilities,resolveActivatedRacialAbility,manaPoolCardsForSide,manaDeckForSide,syncManaCountForSide,setState:s=>{appState=s;matchStarted=true;SUPPRESS_RENDER=true;}};\n})();`;
for(const f of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let src=fs.readFileSync(path.join(root,f),'utf8');if(f.endsWith('app.bundle.js'))src=src.replace(/\n\}\)\(\);\s*$/,inject);
 vm.runInContext(src,ctx,{filename:f,timeout:60000});
}
const q=ctx.__QA;q.initCards();let pass=0;
function test(name,fn){fn();pass++;console.log('PASS '+name)}
function fresh(){const s=q.buildInitialMatchState();q.setState(s);s.preGame=null;s.openingFlowCompleted=true;s.turn='PLAYER';s.phase='Battle';s.round=5;s.gameOver=false;s.pending=null;s.responseWindow=null;s.pvpHumanVsHuman=true;for(const side of ['player','ai'])for(const lane of ['LEFT','CENTER','RIGHT']){let h=s[side+'Heroes'][lane];h.hp=100;h.maxHp=100;h.statuses=[];h.exhausted=false;h.legacy_mode=false;h.attachments=[null,null];}return s;}
test('Burn +10 precedes full 50 BLOCK, attack hits but loses no HP',()=>{
 const s=fresh(),target=s.aiHeroes.CENTER;q.addStatus(target,'Burn',2,'QA');const before=target.hp;
 const out=q.applyResolvedAttackDamage(s,'S0-ARC-003','PLAYER','CENTER','AI','CENTER',40,'Magical',false,50,false,false);
 assert.equal(out.burn_damage,10);assert.equal(out.incoming_damage,50);assert.equal(out.response_block,50);assert.equal(out.hp_damage,0);assert.equal(target.hp,before);
});
test('Burn contributes before partial BLOCK, HP changes by actual amount',()=>{
 const s=fresh(),target=s.aiHeroes.CENTER;q.addStatus(target,'Burn',2,'QA');
 const out=q.applyResolvedAttackDamage(s,'S0-ARC-003','PLAYER','CENTER','AI','CENTER',20,'Magical',false,20,false,false);
 assert.equal(out.burn_damage,10);assert.equal(out.incoming_damage,30);assert.equal(out.hp_damage,10);assert.equal(target.hp,90);
});
test('DODGE prevents Burn and any damage',()=>{
 const s=fresh(),target=s.aiHeroes.CENTER;q.addStatus(target,'Burn',2,'QA');
 const out=q.applyResolvedAttackDamage(s,'S0-ARC-003','PLAYER','CENTER','AI','CENTER',40,'Magical',true,0,false,false);
 assert.equal(out.burn_damage,0);assert.equal(out.hp_damage,0);assert.equal(target.hp,100);
});
test('Attack newly inflicting Burn does not amplify its own first hit',()=>{
 const s=fresh(),out=q.applyResolvedAttackDamage(s,'S0-ARC-007','PLAYER','CENTER','AI','CENTER',30,'Physical',false,0,false,false);
 assert.equal(out.burn_damage,0);
});
test('Correct RC40 Hero printed HP from canonical data',()=>{
 for(const [id,hp] of [['S0-CLE-H003',130],['S0-MAG-H007',90]]){const c=q.card(id);assert(c,'Missing card '+id);assert.equal(Number(c.hp),hp,id);}
});
test('Poison Vial host lineage based on the new printed class requirement',()=>{
 const h=id=>q.heroState(id,'PLAYER','CENTER');
 for(const id of ['S0-ARC-H001','S0-THF-H001','S0-WAR-H001'])assert(q.poisonVialHostEligible(h(id)),id);
 for(const id of ['S0-CLE-H001','S0-MAG-H001'])assert(!q.poisonVialHostEligible(h(id)),id);
});
test('Ancestral Focus gains 2 printed Mana Shards, from usable Racial Trait on PvP seat',()=>{
 const s=fresh();s.phase='Deploy';s.racial=1;s.playerHeroes.CENTER=q.heroState('S0-MAG-H001','PLAYER','CENTER');
 const descriptor=q.racialActionFor(s.playerHeroes.CENTER);assert(descriptor,'New Mana Shards printed wording must parse');assert.equal(descriptor.effect.gain_mana,2);
 const pool=q.manaPoolCardsForSide(s,'PLAYER'),deck=q.manaDeckForSide(s,'PLAYER');
 // Guarantee 1 available in deck by moving previously-drawn opening Shards back.
 if(deck.length<2&&pool.length){deck.unshift(...pool.splice(0));q.syncManaCountForSide(s,'PLAYER');}
 const before=pool.length,options=q.getActivatedRacialAbilities(s,'PLAYER','CENTER');
 assert(options.some(x=>String(x.abilityId||x.ability_id||'').toLowerCase()==='ancestral_focus'),JSON.stringify(options));
 assert(q.resolveActivatedRacialAbility(s,'PLAYER','CENTER','ancestral_focus',null),'Racial ability must activate');
 assert.equal(pool.length,Math.min(12,before+2));assert.equal(s.racial,0);
});
test('Magic Compass Deck search excludes Ultimate Skill at the actual commit location',()=>{
 const bundle=fs.readFileSync(path.join(root,'engine/shared-app/app.bundle.js'),'utf8');
 assert.match(bundle,/filter:\{family:'Skill',is_ultimate:false\}, title:'Magic Compass/);
});
console.log('RC40 PvP Stage1 Burn/HP/Item',pass,'/',pass,'PASS');
