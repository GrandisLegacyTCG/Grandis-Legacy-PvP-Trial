import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {webcrypto} from 'node:crypto';
import {applyOptimizedPvpIntent} from '../server/headless-rc32.mjs';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';

const root=join(process.cwd(),'public/battle');
function engineVm(){
 const dummy={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},querySelector(){return null},querySelectorAll(){return []},getBoundingClientRect(){return{x:0,y:0,width:0,height:0}}};
 const document={readyState:'loading',body:null,addEventListener(){},getElementById(){return dummy},querySelector(){return null},querySelectorAll(){return []}};
 const ctx={console,Date,Math,URL,TextEncoder,TextDecoder,Uint8Array,crypto:webcrypto,document,location:{origin:'https://unit.invalid',href:'https://unit.invalid'},navigator:{userAgent:'RC4 QA'},performance:{now:()=>0},setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},requestAnimationFrame(){return 0},cancelAnimationFrame(){},GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true};
 ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
 for(const path of ['engine/js/static-data.js','runtime/overrides/grand-finale-designer-nerf.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
  let code=readFileSync(join(root,path),'utf8');
  if(path.endsWith('app.bundle.js')){
   const inject=`\nwindow.__RC4_TEST__={
     makeTuneUp:function(rank,phase='Deploy'){
       initCards();SUPPRESS_RENDER=true;matchStarted=true;appState=buildInitialMatchState();
       var s=appState;s.preGame=null;s.turn='PLAYER';s.phase=phase;s.pending=null;s.responseWindow=null;s.gameOver=false;s.pvpHumanVsHuman=true;
       s.playerHand=['S0-CLE-029'];s.playerDeck=['S0-ARC-026','S0-CLE-026','S0-CLE-027','S0-CLE-026'];s.playerDiscard=[];
       var id=rank===1?'S0-CLE-H007':rank===2?'S0-CLE-H008':'S0-CLE-H009';
       var h=heroState(id,'PLAYER','LEFT');h.exhausted=false;h.hp=90;h.maxHp=100;s.playerHeroes.LEFT=h;
       s.playerManaPoolCards=[];s.playerManaDeck=[];
       for(var i=0;i<5;i++)s.playerManaPoolCards.push(makeManaShard('GENERIC','','PLAYER',i));
       syncCounts(s);
       return {legal:legalPlayState(s,'S0-CLE-029'),hero:h.card_id};
     }
   };
})();`;
   assert.match(code,/\n\}\)\(\);\s*$/);
   code=code.replace(/\n\}\)\(\);\s*$/,inject);
  }
  vm.runInContext(code,ctx,{timeout:60000,filename:path});
 }
 const bridge=ctx.GL_LOCAL_AI_BRIDGE;
 bridge.setRenderSuppressed(true);
 return {ctx,bridge,pending:()=>bridge.getCanonicalSnapshot(1).appState.pending};
}
const env=engineVm(),{bridge}=env;
let initial=env.ctx.__RC4_TEST__.makeTuneUp(1);
assert.equal(initial.legal.can,false,'Cleric I must not be able to play Tune Up');
initial=env.ctx.__RC4_TEST__.makeTuneUp(2,'Reform');
assert.equal(initial.legal.can,false,'Tune Up is a Deploy card');
for(const rank of [2,3]){
 initial=env.ctx.__RC4_TEST__.makeTuneUp(rank);
 assert.equal(initial.legal.can,true,'Bard II or Maestro III should legally play Tune Up');
 applyOptimizedPvpIntent({bridge,readPending:env.pending,name:'beginPlayFromHandFast',args:[0]});
 assert.equal(env.pending()?.type,'source_selection','Even one legal Hero must be explicitly selected');
 assert.deepEqual(Array.from(env.pending().legal_sources),['LEFT']);
 applyOptimizedPvpIntent({bridge,readPending:env.pending,name:'chooseHeroFromBoard',args:['PLAYER','LEFT']});
 assert.equal(env.pending()?.type,'mana_shard_payment_choice');
 const plan=env.ctx.GL_GAME_ENGINE.getManaPlan();
 assert.equal(plan.plan.ok,true);
 bridge.applyServerIntent('commitExactManaPaymentChoice',[plan.plan.selected_shard_uids,false,null]);
 const p=env.pending();
 assert.equal(p?.type,'card_search_choice');assert.equal(p?.source_card_id,'S0-CLE-029');
 assert.equal(p?.required_count,2);
 const view=viewerSafeBoard(bridge.getCanonicalSnapshot(1),{seat:1,revision:100,secret:Buffer.alloc(32,7)});
 assertViewerSafeBoard(view);
 assert.equal(view.appState.pending.candidates.length,4);
 // Invalid, stale and duplicate choices do not commit.
 for(const bad of [[[],p.commit_token],[[0,0],p.commit_token],[[0,99],p.commit_token],[[0,1],'stale']]){
  assert.throws(()=>applyOptimizedPvpIntent({bridge,readPending:env.pending,name:'commitExactTuneUpChoice',args:bad}));
  assert.equal(env.pending().type,'card_search_choice');
 }
 applyOptimizedPvpIntent({bridge,readPending:env.pending,name:'commitExactTuneUpChoice',args:[[0,1],p.commit_token]});
 assert.equal(env.pending(),null,'Atomic choice resolves the search without another pending');
 const st=bridge.getCanonicalSnapshot(1).appState;
 assert.ok(st.playerHand.includes('S0-ARC-026'));
 assert.ok(st.playerHand.includes('S0-CLE-026'));
 assert.ok(st.playerDiscard.includes('S0-CLE-029'));
 console.log('PASS real RC39 '+(rank===2?'Bard Rank II':'Maestro Rank III')+' -> mandatory source Hero -> PAY -> atomic Tune Up 2 Notes');
}

// The single-legal-Hero shortcut was reported as a bug: every Skill with
// a source requirement must explicitly present even its only valid Hero.
for(const sources of [['LEFT'],['LEFT','RIGHT']]){
 const calls=[];
 const fakeBridge={applyServerIntent:(name,args)=>{calls.push({name,args});return{ok:true}}};
 const fakePending={type:'source_selection',decision_side:'PLAYER',source_side:'PLAYER',legal_sources:sources};
 applyOptimizedPvpIntent({bridge:fakeBridge,readPending:()=>fakePending,name:'beginPlayFromHandFast',args:[0]});
 assert.equal(calls.length,1,'No implicit Hero-selection intent regardless of eligible Hero count');
 assert.equal(calls[0].name,'beginPlayFromHand');
}
console.log('PASS mandatory Hero source stays selectable with one or multiple legal Heroes');

// Seat 2's server VM is mirrored into a local PLAYER view. Reading a canonical
// seat-1-coordinates pending would incorrectly classify its PLAYER decision as
// AI-owned; use the LOCAL pending when validating an atomic action.
const mirroredEnv=engineVm();
assert.equal(mirroredEnv.ctx.__RC4_TEST__.makeTuneUp(2).legal.can,true);
const canonicalForSeat2=mirroredEnv.bridge.getCanonicalSnapshot(2);
assert.equal(mirroredEnv.bridge.importCanonicalSnapshot(canonicalForSeat2,2,{skipImportAnimations:true}),true);
applyOptimizedPvpIntent({
 bridge:mirroredEnv.bridge,
 readPending:()=>mirroredEnv.bridge.getCanonicalSnapshot(1).appState.pending,
 name:'beginPlayFromHandFast',args:[0]
});
assert.equal(mirroredEnv.bridge.getCanonicalSnapshot(1).appState.pending?.type,'source_selection');
applyOptimizedPvpIntent({bridge:mirroredEnv.bridge,readPending:()=>mirroredEnv.bridge.getCanonicalSnapshot(1).appState.pending,name:'chooseHeroFromBoard',args:['PLAYER','LEFT']});
assert.equal(mirroredEnv.bridge.getCanonicalSnapshot(1).appState.pending?.type,'mana_shard_payment_choice');
assert.equal(mirroredEnv.bridge.getCanonicalSnapshot(2).appState.pending?.decision_side,'AI');
const seat2Plan=mirroredEnv.ctx.GL_GAME_ENGINE.getManaPlan();
assert.equal(mirroredEnv.bridge.applyServerIntent('commitExactManaPaymentChoice',[seat2Plan.plan.selected_shard_uids,false,null]).ok,true);
const seat2Pending=mirroredEnv.bridge.getCanonicalSnapshot(1).appState.pending;
assert.equal(seat2Pending?.type,'card_search_choice');
applyOptimizedPvpIntent({bridge:mirroredEnv.bridge,
 readPending:()=>mirroredEnv.bridge.getCanonicalSnapshot(1).appState.pending,
 name:'commitExactTuneUpChoice',args:[[0,1],seat2Pending.commit_token]});
assert.ok(mirroredEnv.bridge.getCanonicalSnapshot(1).appState.playerHand.includes('S0-ARC-026'));
console.log('PASS seat 2 mirrored local PLAYER Tune Up -> Mana -> atomic Notes (owner check)');

// Production browser intent adapter: selecting two cards MUST be local, and
// only a single exact-choice packet may leave the browser at confirmation.
const adapterCode=readFileSync(join(root,'runtime/pvp-network.js'),'utf8');
const sent=[],notifications=[],rendered=[];const elements=new Map();let socket;
class WS{static OPEN=1;constructor(){socket=this;this.readyState=0}send(s){sent.push(JSON.parse(s))}open(){this.readyState=1;this.onopen?.()}recv(packet){this.onmessage?.({data:JSON.stringify(packet)})}}
const p={type:'card_search_choice',decision_side:'PLAYER',zone:'deck',source_card_id:'S0-CLE-029',multi_select:true,selected_indices:[],required_count:2,commit_token:'test-unique-token',candidates:[{card_id:'S0-ARC-026',deck_index:0},{card_id:'S0-CLE-026',deck_index:1}]};
const snapshot={appState:{turn:'PLAYER',phase:'Deploy',pending:p,playerManaPoolCards:[],aiManaPoolCards:[]},pvpPrivateStateMasked:true,pvpRecipientSeat:1};
let local=structuredClone(snapshot);
const doc={readyState:'complete',body:{appendChild:el=>elements.set(el.id,el)},visibilityState:'visible',addEventListener(){},getElementById:id=>elements.get(id)||null,createElement(){return{style:{},setAttribute(){},hidden:false}},querySelector(){return{classList:{remove(){}}}}};
const bridge2={getSnapshot:()=>local,importSnapshot(s){local=structuredClone(s);return true},applyServerIntent(name,args){if(name!=='selectCardSearchChoice')return{ok:false};const arr=local.appState.pending.selected_indices;const idx=Number(args[0]);const old=arr.indexOf(idx);if(old>=0)arr.splice(old,1);else arr.push(idx);return{ok:true}}};
const win={console,Date,Math,JSON,URL,URLSearchParams,document:doc,location:{protocol:'https:',host:'unit.invalid',search:'',replace(){}},WebSocket:WS,crypto:{randomUUID:()=>`rc4-test-browser`},sessionStorage:{getItem:k=>k.includes('client_id')?'client-1':k.includes('role')?'player':'token'},localStorage:{getItem:()=>null},CustomEvent:class{constructor(x,p){this.type=x;this.detail=p?.detail}},dispatchEvent:e=>notifications.push(e),setInterval(){return 3},setTimeout(){return 1},clearInterval(){},clearTimeout(){},GL_PVP_BUILD_META:{buildId:'qa'},GL_LOCAL_AI_BRIDGE:bridge2,GL_GAME_ENGINE:{getManaPlan(){return null}},GL_AUTHORITY_ADAPTER:{register(){},use(){}},GL_GAME_UI:{render(){rendered.push('render')},openingBusy:()=>false}};
win.window=win;win.globalThis=win;vm.runInNewContext(adapterCode,win);
socket.open();socket.recv({type:'snapshot',match:{status:'started',revision:5,board:snapshot},local:{role:'player',seat:1}});
const base=sent.length;
assert.equal(win.GL_S0_PVP_NETWORK.sendIntent('selectCardSearchChoice',[0]).ok,true);
assert.equal(win.GL_S0_PVP_NETWORK.sendIntent('selectCardSearchChoice',[1]).ok,true);
assert.equal(sent.length,base,'Two Tune Up choices must not send gameplay WebSocket intents');
assert.equal(win.GL_S0_PVP_NETWORK.sendIntent('handleChoiceConfirm',[]).ok,true);
assert.equal(sent.length,base+1);
const packet=sent.at(-1);assert.equal(packet.type,'runtime-intent');assert.equal(packet.intent,'commitExactTuneUpChoice');
assert.equal(JSON.stringify(packet.args),JSON.stringify([[0,1],'test-unique-token']));
assert.ok(rendered.length>=3);
console.log('PASS production PvP browser adapter: Tune Up selects locally and commits in one server RTT');
