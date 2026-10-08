'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
let src=read('public/js/pvp-network.js');
src=src.replace("  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();",
"  window.__PVP_V336_TEST__={state:state,importServerBoard:importServerBoard,battleFeedbackFromAuthoritativePlans:battleFeedbackFromAuthoritativePlans};\n  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();");

function classList(){return{add(){},remove(){},toggle(){},contains(){return false;}};}
function node(){return{innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},classList:classList(),
  getAttribute(){return null;},setAttribute(){},removeAttribute(){},querySelector(){return null;},querySelectorAll(){return[];},closest(){return null;},
  addEventListener(){},removeEventListener(){},appendChild(){},remove(){},matches(){return false;}};}
const dummy=node();
const document={readyState:'loading',body:node(),head:node(),documentElement:node(),addEventListener(){},removeEventListener(){},getElementById(){return dummy;},querySelector(){return null;},querySelectorAll(){return[];},createElement(){return node();}};
const localStorage={getItem(){return null;},setItem(){},removeItem(){}};
let canonicalState={pvpBattleFeedbackEvents:[]};
const played=[],audio=[],order=[];
const bridge={
  snapshot(){return{appState:JSON.parse(JSON.stringify(canonicalState))};},
  getSnapshot(){return{appState:canonicalState};},
  setSharedBoardMode(){},
  importCanonicalSnapshot(canonical){order.push('import');canonicalState=JSON.parse(JSON.stringify(canonical.appState||{}));return true;},
  playAuthoritativeStateDeltaPresentation(){return false;},
  playAuthoritativeBattleFeedbackAudio(evt){order.push('audio');audio.push(JSON.parse(JSON.stringify(evt)));evt._sound_played=true;return true;},
  playAuthoritativeBattleFeedback(evt){order.push('vfx');played.push(JSON.parse(JSON.stringify(evt)));return true;}
};
const window={document,localStorage,GL_PVP_CONFIG:{buildId:'gl-pvp-3.42-2026-09-13'},GL_CONFIG:{},GL_LOCAL_AI_BRIDGE:bridge,
  addEventListener(){},removeEventListener(){},matchMedia(){return{matches:false}},requestAnimationFrame(fn){fn();return 1;}};
window.window=window;
const ctx={window,document,localStorage,console,setTimeout(fn){fn();return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},requestAnimationFrame:window.requestAnimationFrame,
  URL,URLSearchParams,location:{href:'https://example.test/pvp/'},navigator:{},Math,Date,JSON,Number,isFinite,Array,Object,String,Boolean,RegExp,WebSocket:{OPEN:1}};
ctx.globalThis=ctx;window.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{timeout:10000,filename:'pvp-network.js'});
const t=window.__PVP_V336_TEST__;assert(t&&t.importServerBoard,'test hook missing');
t.state.connected=true;
t.state.snapshot={
  local:{seat:1,role:'player',name:'JENOZ',deckName:'Deck A'},
  players:[{seat:1,name:'JENOZ',deckName:'Deck A',connected:true},{seat:2,name:'BELZE',deckName:'Deck B',connected:true}],
  match:{status:'started',serverBoardRevision:7,lastIntent:{processingMs:3},serverBoard:{matchStarted:true,appState:{phase:'Battle',turn:'PLAYER',pvpBattleFeedbackEvents:[]}},lastAnimationEvents:[
    {id:'fx-r7-1',kind:'battle_feedback',side:'AI',lane:'LEFT',card_id:'S1-WAR-002',outcome:'hit',attack_kind:'P',defense_kind:null,has_damage:true,play_sound:true,timestamp:10},
    {id:'fx-r7-2',kind:'battle_feedback',side:'PLAYER',lane:'CENTER',card_id:'S1-MAG-003',outcome:'block',attack_kind:'M',defense_kind:'M',has_damage:true,play_sound:true,timestamp:11}
  ]}
};
assert.strictEqual(t.importServerBoard(false),true,'server board import failed');
assert.strictEqual(audio.length,2,'authoritative battle SFX was not delivered before render');
assert.strictEqual(played.length,2,'battle VFX was not delivered exactly once from revision-scoped animation events');
assert.deepStrictEqual(order.slice(0,3),['audio','audio','import'],'battle SFX must complete dispatch before authoritative board import');
assert(played.every(x=>x._sound_played===true),'post-render VFX event lost the sound-played guard and could replay SFX');
assert.deepStrictEqual(played.map(x=>[x.side,x.lane,x.attack_kind,x.outcome,x.defense_kind]),[
  ['AI','LEFT','P','hit',null],['PLAYER','CENTER','M','block','M']
]);
assert.strictEqual(t.state.seenAnimationIds['fx-r7-1'],true,'first feedback event was not marked seen');
assert.strictEqual(t.state.seenAnimationIds['fx-r7-2'],true,'second feedback event was not marked seen');
assert.strictEqual(t.importServerBoard(false),false,'same revision was imported twice');
assert.strictEqual(played.length,2,'same feedback replayed on duplicate revision');
console.log('PASS PvP v3.41 authoritative feedback delivery: revision-scoped SFX dispatches before board import; VFX remains post-render; no delayed duplicate audio.');
