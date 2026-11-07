/** Focused real-engine RC32 same-version regression (Primal Strike/Burn, Stun, Color Mana).
 * Test-only hooks are injected into a VM copy of the actual RC32 engine; production
 * JS/VM source and Grand Finale/Poison Vial overrides are NOT edited.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';

const client=resolve(dirname(fileURLToPath(import.meta.url)),'../client');
const stub={style:{},dataset:{},classList:{add(){},remove(){},contains(){return false}},addEventListener(){},removeEventListener(){},appendChild(){},removeChild(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return[]},focus(){},closest(){return null},scrollIntoView(){},getBoundingClientRect(){return{x:0,y:0,width:0,height:0}}};
const document={readyState:'loading',body:null,documentElement:null,addEventListener(){},removeEventListener(){},getElementById(){return stub},querySelector(){return null},querySelectorAll(){return[]}};
const ctx={console,URL,Date,Math,TextEncoder,TextDecoder,Uint8Array,performance:{now:()=>0},crypto:webcrypto,
 setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},requestAnimationFrame(){return 0},cancelAnimationFrame(){},
 location:{href:'https://pvp-season0.invalid/',origin:'https://pvp-season0.invalid'},navigator:{userAgent:'Node PvP S0 RC32 QA'},document,
 GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
const hooks=String.raw`
window.GL_PVP_RC32_FOCUSED_QA=function(){
  var out={};
  initCards();
  var oldApp=appState,oldMatch=matchStarted,oldSuppress=SUPPRESS_RENDER;
  SUPPRESS_RENDER=true;matchStarted=true;
  try{
    var s=buildInitialMatchState();
    s.phase='Battle';s.turn='PLAYER';s.racial=2;
    s.playerHeroes.RIGHT.card_id='S0-ARC-H001';
    s.aiHeroes.CENTER.hp=Math.min(70,s.aiHeroes.CENTER.maxHp-10);
    s.playerHeroes.RIGHT.statuses=[];
    var offered=getActivatedRacialAbilities(s,'PLAYER','RIGHT');
    out.primalOffered=offered.some(function(x){return x.abilityId==='primal_strike';});
    s.playerHeroes.RIGHT.statuses=[{name:'Stun',duration:1}];
    out.stunnedPrimalUnavailable=getActivatedRacialAbilities(s,'PLAYER','RIGHT').length===0;
    appState=s;var beforeTokens=s.racial;
    out.stunnedPrimalActivationRejected=beginActivatedRacialAbility(s,'PLAYER','RIGHT','primal_strike')===false;
    out.stunnedPrimalTokensPreserved=s.racial===beforeTokens;
    function simulate(burnDuration,opts){
      opts=opts||{};
      var sourceSide=opts.sourceSide||'PLAYER',targetSide=oppositeSide(sourceSide);
      var s=buildInitialMatchState();appState=s;s.pvpHumanVsHuman=true;
      s.turn=sourceSide;s.phase='Battle';s.pending={type:'response_window'};
      var target=sideHeroes(s,targetSide).CENTER;
      target.hp=70;target.maxHp=Math.max(target.maxHp,100);
      target.statuses=burnDuration?[{name:'Burn',duration:burnDuration}]:[];
      if(opts.shield||opts.invincible){
        s.activeAttachments=s.activeAttachments||[];
        s.activeAttachments.push({side:targetSide,lane:'CENTER',card_id:opts.invincible?'S0-CLE-025':'S0-WAR-021'});
      }
      s.responseWindow={kind:'incoming_ability_damage',response_owner:targetSide,target_side:targetSide,target_lane:'CENTER',
        source_side:sourceSide,source_lane:'RIGHT',card_id:'S0-ARC-H001',damage:20,damage_type:'Physical',
        attack_type:'Ability Damage',ability_id:'primal_strike',ability_name:'Primal Strike',options:[]};
      var ok=resolveAbilityDamageResponseWindow(null);
      return {ok:ok,hp:target.hp,log:(s.log||[]).join('\n')};
    }
    out.base=simulate(0);
    out.burn=simulate(1);
    out.burnStack=simulate(6);
    out.burnSeat2=simulate(2,{sourceSide:'AI'});
    out.burnFullShield=simulate(1,{shield:true});
    out.burnInvincible=simulate(1,{invincible:true});
    function mana(side){
      var s=buildInitialMatchState(),sh=[
        makeManaShard('CLASS','Mage',side,'MA'),makeManaShard('CLASS','Thief',side,'TH'),
        makeManaShard('GENERIC','',side,'R1'),makeManaShard('GENERIC','',side,'R2'),
        makeManaShard('CLASS','Warrior',side,'WA')];
      if(side==='PLAYER')s.playerManaPoolCards=sh;else s.aiManaPoolCards=sh;
      var old=sh.slice(0,4).map(function(x){return x.uid;});
      var updated=manaSelectionAfterToggle(s,side,card('S0-WAR-001'),4,old,sh[4].uid);
      return {updated:updated,exact:computeExactManaPayment(s,side,card('S0-WAR-001'),4,updated).ok,
        expected:sh.slice(2).map(function(x){return x.uid;})};
    }
    out.manaPlayer=mana('PLAYER');out.manaOpponent=mana('AI');
    function responseStun(side,id,kind){
      var s=buildInitialMatchState(),h=sideHeroes(s,side).CENTER;
      h.card_id=id;h.statuses=[];s[racialTokenKey(side)]=2;
      var incoming={card_id:'S0-WAR-001',source_side:oppositeSide(side),target_side:side,target_lane:'CENTER',affected_lanes:['CENTER'],damage_type:'Physical',damage:60};
      var fn=kind==='dragon'?dragonScaleResponseOptionsFor:secondChanceResponseOptionsFor;
      var before=fn(s,side,incoming),possible=before.length>0;
      h.statuses=[{name:'Stun',duration:1}];
      return {possible:possible,stunnedUnavailable:fn(s,side,incoming).length===0};
    }
    out.dragonPlayer=responseStun('PLAYER','S0-WAR-H007','dragon');
    out.dragonOpponent=responseStun('AI','S0-WAR-H007','dragon');
    out.secondChancePlayer=responseStun('PLAYER','S0-THF-H001','chance');
    out.secondChanceOpponent=responseStun('AI','S0-THF-H001','chance');
    function stonebloodStun(side){
      var s=buildInitialMatchState(),h=sideHeroes(s,side).CENTER;
      h.card_id='S0-CLE-H004';h.hp=0;h.statuses=[];s[racialTokenKey(side)]=2;
      var ready=stonebloodAvailable(s,side,'CENTER',h);
      h.statuses=[{name:'Stun',duration:1}];
      return {ready:ready,stunnedUnavailable:!stonebloodAvailable(s,side,'CENTER',h)};
    }
    out.stonebloodPlayer=stonebloodStun('PLAYER');
    out.stonebloodOpponent=stonebloodStun('AI');
    return out;
  }finally{appState=oldApp;matchStarted=oldMatch;SUPPRESS_RENDER=oldSuppress;}
};
`;
for(const rel of ['engine/js/static-data.js','runtime/overrides/grand-finale-designer-nerf.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let code=readFileSync(join(client,rel),'utf8');
 if(rel.endsWith('app.bundle.js')){
   assert.match(code,/\}\)\(\);\s*$/,'Expected single-closure RC32 bundle; cannot inject QA otherwise');
   code=code.replace(/\}\)\(\);\s*$/,hooks+'\n})();\n');
 }
 new vm.Script(code,{filename:rel}).runInContext(ctx,{timeout:60000});
}
assert.equal(typeof ctx.GL_PVP_RC32_FOCUSED_QA,'function');
const r=JSON.parse(JSON.stringify(ctx.GL_PVP_RC32_FOCUSED_QA()));
assert.equal(r.primalOffered,true,'Real Primal Strike must be offered when legal');
assert.equal(r.stunnedPrimalUnavailable,true,'Stun must prevent racial ability availability');
assert.equal(r.stunnedPrimalActivationRejected,true,'Stunned Primal Strike must be rejected at activation');
assert.equal(r.stunnedPrimalTokensPreserved,true,'Rejected stunned ability cannot consume Racial Token');
assert.equal(r.base.ok,true);assert.equal(r.base.hp,50,'Normal Primal Strike 20');
assert.equal(r.burn.ok,true);assert.equal(r.burn.hp,40,'Burned Primal Strike 30');
assert.match(r.burn.log,/Burn adds \+10 damage to Primal Strike/);
assert.equal(r.burnStack.hp,40,'6 Burn counters increase duration, NOT strength');
assert.equal(r.burnSeat2.hp,40,'Primal Strike Burn should be symmetric for seat 2');
assert.equal(r.burnFullShield.hp,70,'Full 20-point Shield prevents base damage and Burn bonus');
assert.equal(r.burnInvincible.hp,70,'INVINCIBLE prevents Primal Strike and Burn bonus');
for(const side of ['manaPlayer','manaOpponent']){
 assert.equal(r[side].exact,true,'Mana must stay exactly paid: '+side);
 assert.deepEqual(r[side].updated.sort(),r[side].expected.sort(),'Selecting 2-value Warrior Color Shard must replace other two Color Shards before Regular: '+side);
}
for(const caseName of ['dragonPlayer','dragonOpponent','secondChancePlayer','secondChanceOpponent']){
 assert.equal(r[caseName].possible,true,caseName+' should offer legal response before Stun');
 assert.equal(r[caseName].stunnedUnavailable,true,caseName+' should not offer response under Stun');
}
for(const caseName of ['stonebloodPlayer','stonebloodOpponent']){
 assert.equal(r[caseName].ready,true,caseName+' should offer legal Stoneblood before Stun');
 assert.equal(r[caseName].stunnedUnavailable,true,caseName+' should not prevent defeat under Stun');
}
console.log('PASS: latest RC32 real-engine focused QA — Stun blocks Primal Strike without spending token, burned Primal Strike deals 30 vs 20, Burn duration does not amplify +10, full 20-point Shield and INVINCIBLE block both base/Burn damage, Color Mana exact priority symmetric for both seat sides.');
