'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const app=read('public/js/app.bundle.js');
const net=read('public/js/pvp-network.js');
const server=read('server.js');
const css=read('public/css/app.css');
const html=read('public/index.html');
const pkg=JSON.parse(read('package.json'));

assert.strictEqual(pkg.version,'3.0.42','PvP v3.34 package marker missing while checking audiovisual behavior');
assert(app.includes('Grandis Legacy PvP v3.42'),'PvP v3.36 app marker missing');
assert(server.includes('Grandis Legacy PvP v3.42'),'PvP v3.36 server marker missing');
assert(html.includes('gl-pvp-3.42-responsive-ui'),'v3.34 cache-bust marker missing');

for(const rel of [
  'public/assets/audio/battle/P.Atk.mp3','public/assets/audio/battle/M.Atk.mp3',
  'public/assets/audio/battle/P.Def.mp3','public/assets/audio/battle/M.Def.mp3',
  'public/assets/battle/P.Attack.png','public/assets/battle/M.Attack.png',
  'public/assets/battle/P.Defense.png','public/assets/battle/M.Defense.png'
]) assert(fs.statSync(path.join(root,rel)).size>0,`missing audiovisual asset: ${rel}`);

for(const token of [
  'pvpBattleFeedbackEvents:[]','recordPvpBattleFeedbackEvent(state,feedback)',
  "attack_kind:battleAttackVisualKind(rw.card_id)",
  'defense_kind:blockLike?battleDefenseVisualKind(target):null',
  'playAuthoritativeBattleFeedback:function(evt)',
  'unlockGameplayAudioPlayback:unlockGameplayAudioPlayback'
]) assert(app.includes(token),`app audiovisual transport missing: ${token}`);
for(const token of [
  "kind: 'battle_feedback'","attack_kind: feedback.attack_kind","defense_kind: feedback.defense_kind"
]) assert(server.includes(token),`server battle-feedback transport missing: ${token}`);
assert(net.includes('function battleFeedbackFromAuthoritativePlans(plans)'),'direct authoritative battle-feedback event mapper missing');
assert(!net.includes('freshAuthoritativeBattleFeedback'),'obsolete state-ledger VFX diff still present');
assert(!app.includes('__gl_vfx_retry'),'obsolete PvP VFX retry patch still present');
for(const token of [
  'function playAuthoritativeBattleAudioNow(events)',
  'if(battleFeedback.length)playAuthoritativeBattleAudioNow(battleFeedback)',
  'if(battleFeedback.length)playAuthoritativeBattleFeedbackAfterRender(battleFeedback)',
  'skipBattleFeedback:true',
  'Audio already fired above before board import/render.',
  "document.addEventListener('pointerdown',requestGameplayAudioUnlock,true)"
]) assert(net.includes(token),`network authoritative audiovisual playback missing: ${token}`);
assert(net.indexOf('if(battleFeedback.length)playAuthoritativeBattleAudioNow(battleFeedback)')<net.indexOf('b.importCanonicalSnapshot(m.serverBoard,seat'),'authoritative SFX is still coupled to board import/render');

assert(app.includes('action.pvp_event_id=pvpEvent.id'),'PvP action is not linked to Card Played event');
assert(app.includes('applyAttackAuditToEvent(pvpAtkEvt,rw,result,source)'),'PvP Card Played does not receive attack audit');
assert(app.includes('appendPvpEventResponse(appState,pvpAtkEvt'),'PvP Card Played does not receive Response/result detail');
assert(app.includes('related_attack_event_id:pvpParentAttackEvent&&pvpParentAttackEvent.id||null'),'PvP Defense is not linked to its attack chain');
assert(app.includes('function v96ShowCardPlayedDetail(side,eventId)'),'VS AI-style Card Played detail renderer missing');

// Execute the existing deep PvP parity QA under render suppression. v3.25 extends this
// test so exact battle-feedback and Card Played audit must still be recorded server-side.
const dummy={style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},setAttribute(){},removeAttribute(){},appendChild(){},querySelector(){return null},querySelectorAll(){return[]},focus(){},scrollIntoView(){},click(){},disabled:false,value:'',checked:false,hidden:false,get innerHTML(){return this._h||''},set innerHTML(v){this._h=String(v)},get textContent(){return this._t||''},set textContent(v){this._t=String(v)}};
const document={readyState:'loading',addEventListener(){},removeEventListener(){},getElementById(){return dummy},querySelectorAll(){return[]},querySelector(){return null},createElement(){return {...dummy,style:{},classList:dummy.classList}},body:dummy,head:dummy};
const window={document,GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,console};window.window=window;
const ctx={window,document,console,setTimeout,clearTimeout,URL,CustomEvent:class{},localStorage:{getItem(){return null},setItem(){},removeItem(){}},navigator:{},location:{href:'http://localhost/'}};ctx.globalThis=ctx;window.globalThis=ctx;vm.createContext(ctx);
for(const rel of ['public/js/static-data.js','public/js/runtime-authority.js','public/js/app.bundle.js'])vm.runInContext(read(rel),ctx,{timeout:20000,filename:rel});
const qa=window.GL_V1380_PVP_PARITY_QA_SELF_TEST();
assert(qa&&qa.ok,`deep PvP parity QA failed: ${JSON.stringify(qa)}`);
assert.strictEqual(qa.battleFeedbackLedger,true,'headless PvP did not retain exact battle feedback');
assert.strictEqual(qa.physicalBattleFeedback,true,'P.Atk/P.Def headless classification failed');
assert.strictEqual(qa.magicalBattleFeedback,true,'M.Atk/M.Def headless classification failed');
assert.strictEqual(qa.cardPlayedAudit,true,'PvP Card Played audit parity failed');

console.log('PASS PvP v3.36 clean audiovisual path: direct revision-scoped P.Atk/M.Atk/P.Def/M.Def events + audio unlock + VS AI-style Card Played resolution audit.');
