'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,
 performance:{now:()=>0},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame(){},cancelAnimationFrame(){},crypto:require('crypto').webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://test/index.html',origin:'http://test'};ctx.navigator={userAgent:'RC39 Response QA'};
ctx.document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []},createElement(){return {style:{},appendChild(){},setAttribute(){}}},documentElement:{classList:{toggle(){}}},body:{appendChild(){}}};
vm.createContext(ctx);
const injection=`window.__Q={initCards,card,buildInitialMatchState,attackType,explicitAttackLabel,cardSubtype,damageTypeForActionSource,responseKind,responseOptionsFor,openMultiTargetResponseWindow,resolveResponseWindow,chooseAIDefenseResponseOption,beginCommittedCardCustody,physicalCardCountForSide,manaPoolCardsForSide,manaDeckForSide,syncManaCountForSide,sourceCompatibleForResponse,activeLineageForHero,responseIncomingFromWindow,isIncomingActualAreaAttack,isStrictSingleTargetIncoming,setState:(s)=>{appState=s;matchStarted=true;SUPPRESS_RENDER=true}};\n})();`;
for(const file of ['public/battle/engine/js/static-data.js','public/battle/engine/js/runtime-authority.js','public/battle/engine/shared-app/active-starters.js','public/battle/engine/shared-app/app.bundle.js']){
 let src=fs.readFileSync(path.join(root,file),'utf8');if(file.endsWith('app.bundle.js'))src=src.replace(/\n\}\)\(\);\s*$/,injection);
 vm.runInContext(src,ctx,{filename:file,timeout:60000});
}
const q=ctx.__Q;q.initCards();const tests=[];
function test(name,fn){try{const data=fn();tests.push({name,ok:true,data});console.log('PASS',name,JSON.stringify(data||{}).slice(0,380));}catch(err){tests.push({name,ok:false,error:String(err.stack||err)});console.log('FAIL',name,String(err.stack||err).slice(0,700));}}
function fresh(){let s=q.buildInitialMatchState();q.setState(s);s.preGame=null;s.turn='AI';s.phase='Battle';s.round=4;s.gameOver=false;s.playerHand=[];s.aiHand=[];s.pending=null;s.responseWindow=null;s.aiDifficulty='intermediate';for(const side of ['player','ai'])for(const l of ['LEFT','CENTER','RIGHT']){let h=s[side+'Heroes'][l];h.hp=Math.max(Number(h.maxHp||100),100);h.exhausted=false;h.statuses=[];h.attachments=[null,null];h.legacy_mode=false;}return s;}
function mana(s,side,n){const pool=q.manaPoolCardsForSide(s,side),deck=q.manaDeckForSide(s,side);deck.unshift(...pool.splice(0));for(let i=0;i<n&&deck.length;i++)pool.push(deck.shift());q.syncManaCountForSide(s,side);}
function setupDual(hand){let s=fresh();s.aiHeroes.CENTER.card_id='S0-ARC-H002';s.playerHeroes.LEFT.card_id='S0-WAR-H001';s.playerHeroes.RIGHT.card_id='S0-THF-H008';s.playerHeroes.LEFT.hp=100;s.playerHeroes.RIGHT.hp=100;s.playerHand=hand;mana(s,'PLAYER',10);const action={card_id:'S0-ARC-017',source_side:'AI',source_lane:'CENTER',target_side:'PLAYER',target_lane:'LEFT',target_lanes:['LEFT','RIGHT']};return {s,action};}
function opts(s,action,index){const yes=q.openMultiTargetResponseWindow(s,action,{damage:30},action.target_lanes,index,0,false,0);assert.equal(yes,true);return s.responseWindow.options;}
function has(o,id){return o.filter(x=>x.card_id===id);}

test('Approved ALL OPPONENTS attacks are Area; Dual Arrow stays Physical two-target',()=>{assert.equal(q.attackType(q.card('S0-ARC-017')),'Dual Target');assert.equal(q.explicitAttackLabel(q.card('S0-ARC-017')),'Physical Attack');for(const id of ['S0-THF-018','S0-MAG-019']){assert.equal(q.attackType(q.card(id)),'Area Damage');assert.equal(q.cardSubtype(q.card(id)),'Area Attack');assert.equal(q.explicitAttackLabel(q.card(id)),'Area Attack');assert.equal(q.damageTypeForActionSource(q.card(id),null),'Magical');}return{dual:q.attackType(q.card('S0-ARC-017')),area:['S0-THF-018','S0-MAG-019']};});
test('Intercept recognizes Physical Dual Arrow, rejects Area even Magical Damage',()=>{let a={card_id:'S0-ARC-017',attack_type:'Dual Target',damage_type:'Physical'};assert.equal(q.responseKind(q.card('S0-EVT-007'),a),'negate_return');assert.equal(q.responseKind(q.card('S0-EVT-007'),{card_id:'S0-MAG-019',attack_type:'Area Damage',damage_type:'Magical',area:true}),null);assert.equal(q.responseKind(q.card('S0-EVT-007'),{...a,multi_sequence_index:1}),null);});
test('Spell Blade lineage can use Smoke Screen though first target Warrior',()=>{const {s,action}=setupDual(['S0-THF-004']);const o=opts(s,action,0);assert.equal(s.responseWindow.attack_type,'Dual Target');assert.equal(s.responseWindow.area,false);let smoke=has(o,'S0-THF-004');assert.equal(smoke.length,1);assert.equal(smoke[0].source_lane,'RIGHT');assert.equal(smoke[0].response_kind,'negate_return');assert.equal(q.activeLineageForHero(s.playerHeroes.RIGHT).includes('Thief'),true);assert.equal(q.activeLineageForHero(s.playerHeroes.LEFT).includes('Thief'),false);return{options:smoke.length,source:smoke[0].source_lane};});
test('First-window-only: Smoke Screen and Intercept never appear on second recipient',()=>{const {s,action}=setupDual(['S0-THF-004','S0-EVT-007']);let a=opts(s,action,0);assert.equal(has(a,'S0-THF-004').length,1);assert.equal(has(a,'S0-EVT-007').length,1);s.responseWindow=null;s.pending=null;let b=opts(s,action,1);assert.equal(has(b,'S0-THF-004').length,0);assert.equal(has(b,'S0-EVT-007').length,0);return{first:a.length,second:b.length};});
test('Brilliant Radiance remains Single Target only (even lone surviving Dual target)',()=>{const {s,action}=setupDual(['S0-CLE-002']);s.playerHeroes.LEFT.card_id='S0-CLE-H001';let o=opts(s,action,0);assert.equal(has(o,'S0-CLE-002').length,0);assert.equal(q.responseKind(q.card('S0-CLE-002'),{card_id:'S0-ARC-017',attack_type:'Single Target',target_lane:'LEFT'}),null);assert.equal(q.responseKind(q.card('S0-CLE-002'),{card_id:'S0-MAG-019',attack_type:'Area Damage',area:true}),null);assert.equal(q.responseKind(q.card('S0-CLE-002'),{card_id:'S0-MAG-001',attack_type:'Single Target'}),'negate_discard');});
test('RC40 Defensive Formation is no longer Response; Area Attack print remains canonical',()=>{const {s,action}=setupDual(['S0-EVT-012']);assert.equal(has(opts(s,action,0),'S0-EVT-012').length,0);s.responseWindow=null;s.pending=null;const areaAction={...action,card_id:'S0-MAG-019'};let o=opts(s,areaAction,0);assert.equal(s.responseWindow.attack_type,'Area Damage');assert.equal(s.responseWindow.area,true);assert.equal(has(o,'S0-EVT-012').length,0);for(const id of ['S0-THF-018','S0-MAG-019'])assert(q.isIncomingActualAreaAttack({card_id:id,attack_type:'Area Damage',area:true}));assert.equal(q.isIncomingActualAreaAttack({card_id:'S0-ARC-017',attack_type:'Dual Target',area:true}),false);});
test('Smoke Screen cancels entire Dual Arrow before either target receives damage',()=>{const {s,action}=setupDual(['S0-THF-004']);let o=opts(s,action,0),chosen=has(o,'S0-THF-004')[0];assert(chosen);s.aiHand.push('S0-ARC-017');q.beginCommittedCardCustody(s,'AI','S0-ARC-017',q.physicalCardCountForSide(s,'AI','S0-ARC-017'));s.aiHand.pop();const h1=s.playerHeroes.LEFT.hp,h2=s.playerHeroes.RIGHT.hp;const result=q.resolveResponseWindow({...chosen,_payment_complete:true,_counter_checked:true,_paid_mana:2});assert(result!==false);assert.equal(s.playerHeroes.LEFT.hp,h1);assert.equal(s.playerHeroes.RIGHT.hp,h2);assert.equal(s.responseWindow,null);assert.equal(s.playerDiscard.filter(x=>x==='S0-THF-004').length,1);assert.equal(s.aiHand.filter(x=>x==='S0-ARC-017').length,1);assert.equal(s.aiDiscard.filter(x=>x==='S0-ARC-017').length,0);return{leftHP:h1,rightHP:h2,returned:s.aiHand.includes('S0-ARC-017')};});
test('Intercept cancels entire Dual Arrow and returns Attack to source Hand',()=>{const {s,action}=setupDual(['S0-EVT-007']);let o=opts(s,action,0),chosen=has(o,'S0-EVT-007')[0];assert(chosen);s.aiHand.push('S0-ARC-017');q.beginCommittedCardCustody(s,'AI','S0-ARC-017',q.physicalCardCountForSide(s,'AI','S0-ARC-017'));s.aiHand.pop();const h1=s.playerHeroes.LEFT.hp,h2=s.playerHeroes.RIGHT.hp;const result=q.resolveResponseWindow({...chosen,_payment_complete:true,_counter_checked:true,_paid_mana:4});assert(result!==false);assert.equal(s.playerHeroes.LEFT.hp,h1);assert.equal(s.playerHeroes.RIGHT.hp,h2);assert.equal(s.responseWindow,null);assert.equal(s.aiHand.filter(x=>x==='S0-ARC-017').length,1);assert.equal(s.aiDiscard.filter(x=>x==='S0-ARC-017').length,0);return{leftHP:h1,rightHP:h2,returned:true};});
test('Non-Thief target alone never makes Smoke Screen legal',()=>{const {s,action}=setupDual(['S0-THF-004']);s.playerHeroes.RIGHT.card_id='S0-WAR-H001';const o=opts(s,action,0);assert.equal(has(o,'S0-THF-004').length,0);});
test('Arbalest hybrid inherits Thief base skill and may use Smoke Screen',()=>{const {s,action}=setupDual(['S0-THF-004']);s.playerHeroes.LEFT.card_id='S0-ARC-H008';s.playerHeroes.RIGHT.card_id='S0-WAR-H001';let o=opts(s,action,0);assert.equal(has(o,'S0-THF-004').length,1);assert.equal(has(o,'S0-THF-004')[0].source_lane,'LEFT');assert(q.activeLineageForHero(s.playerHeroes.LEFT).includes('Thief'));});
test('Area Attack can be fully negated by Smoke Screen when a Thief-line Hero is among affected',()=>{const {s,action}=setupDual(['S0-THF-004']);const area={...action,card_id:'S0-MAG-029'};let o=opts(s,area,0);assert.equal(has(o,'S0-THF-004').length,1);assert.equal(has(o,'S0-EVT-007').length,0);});
test('Passing first Response preserves second window and normal dual-hit resolution',()=>{
 const {s,action}=setupDual([]);s.aiHand.push('S0-ARC-017');q.beginCommittedCardCustody(s,'AI','S0-ARC-017',q.physicalCardCountForSide(s,'AI','S0-ARC-017'));s.aiHand.pop();opts(s,action,0);
 const beforeLeft=s.playerHeroes.LEFT.hp,beforeRight=s.playerHeroes.RIGHT.hp;
 assert.notEqual(q.resolveResponseWindow(null),false);assert(s.responseWindow);assert.equal(s.responseWindow.multi_sequence.index,1);
 assert.equal(s.playerHeroes.LEFT.hp<beforeLeft,true);assert.equal(s.playerHeroes.RIGHT.hp,beforeRight);
 assert.notEqual(q.resolveResponseWindow(null),false);assert.equal(s.responseWindow,null);
 assert.equal(s.playerHeroes.RIGHT.hp<beforeRight,true);assert.equal(s.aiHand.includes('S0-ARC-017'),false);
 assert.equal(s.aiDiscard.includes('S0-ARC-017'),true);
 return {leftHP:s.playerHeroes.LEFT.hp,rightHP:s.playerHeroes.RIGHT.hp,attackDiscarded:true};
});
// Intermediate-AI strategy case intentionally excluded from human-vs-human PvP.
test('PvP mirrored seat: responder AI owner can whole-negate both targets',()=>{
  const s=fresh();s.pvpHumanVsHuman=true;s.turn='PLAYER';
  s.playerHeroes.CENTER.card_id='S0-ARC-H002';
  s.aiHeroes.LEFT.card_id='S0-WAR-H001';s.aiHeroes.RIGHT.card_id='S0-THF-H008';
  s.aiHand=['S0-THF-004'];mana(s,'AI',10);
  const action={card_id:'S0-ARC-017',source_side:'PLAYER',source_lane:'CENTER',target_side:'AI',target_lane:'LEFT',target_lanes:['LEFT','RIGHT']};
  const options=opts(s,action,0),chosen=has(options,'S0-THF-004')[0];assert(chosen);
  assert.equal(chosen.source_lane,'RIGHT');
  s.playerHand.push('S0-ARC-017');q.beginCommittedCardCustody(s,'PLAYER','S0-ARC-017',q.physicalCardCountForSide(s,'PLAYER','S0-ARC-017'));s.playerHand.pop();
  const beforeLeft=s.aiHeroes.LEFT.hp,beforeRight=s.aiHeroes.RIGHT.hp;
  assert.notEqual(q.resolveResponseWindow({...chosen,_payment_complete:true,_counter_checked:true,_paid_mana:2}),false);
  assert.equal(s.aiHeroes.LEFT.hp,beforeLeft);assert.equal(s.aiHeroes.RIGHT.hp,beforeRight);
  assert.equal(s.responseWindow,null);assert.equal(s.playerHand.filter(x=>x==='S0-ARC-017').length,1);
  assert.equal(s.aiDiscard.filter(x=>x==='S0-THF-004').length,1);
  return{responder:'AI',returned:'S0-ARC-017'};
});

let pass=tests.filter(t=>t.ok).length;console.log('RC9 STAGE1 RESPONSE:',pass+'/'+tests.length);if(pass!==tests.length)process.exitCode=1;
