import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {webcrypto} from 'node:crypto';
import {applyOptimizedPvpIntent} from '../server/headless-rc32.mjs';
const root=join(process.cwd(),'public/battle');
const portable=x=>JSON.parse(JSON.stringify(x));
const script=readFileSync(join(root,'runtime/pvp-mana-draft.js'),'utf8');
function draftContext(){const win={};win.window=win;vm.runInNewContext(script,win);return win.GL_PVP_MANA_DRAFT}
const sourceShards=[
 {uid:'r1',kind:'GENERIC',class_name:''},{uid:'r2',kind:'GENERIC',class_name:''},
 {uid:'m1',kind:'CLASS',class_name:'Mage'},{uid:'a1',kind:'CLASS',class_name:'Archer'}];
function pending(type='mana_shard_payment_choice',cost=2,extra=0){
 return{type,decision_side:'PLAYER',card_id:'S0-MAG-007',response_option:{card_id:'S0-ARC-003',hand_index:0},
 cost,mana_cost:cost,required_discard_count:extra,candidates:[{card_id:'S0-WAR-002',hand_index:1},{card_id:'S0-EVT-001',hand_index:2}],
 selected_indices:[],selected_shard_uids:cost===0?[]:['r1','r2'],
 shard_choices:sourceShards.map(x=>({uid:x.uid,kind:x.kind,value:x.uid==='m1'?2:1}))};
}
function board(p){return {turn:'PLAYER',phase:'Battle',pending:p,playerManaPoolCards:structuredClone(sourceShards),aiManaPoolCards:[]}}
const d=draftContext();let s=board(pending());
d.sync(s,7,{name:'Magical Surge',bonus:10,cost:1,magical:true});
assert.equal(d.getInfo(s).plan.ok,true);
assert.equal(d.toggleShard(s,'m1'),true,'Matching Skill Color Shard can replace two Regulars');
assert.equal(d.getInfo(s).plan.value,2);
assert.deepEqual(portable(d.getInfo(s).plan.selected_shard_uids),['m1']);
assert.equal(d.toggleSurge(s),true);
const withSurge=d.payload(s);assert.equal(withSurge.name,'commitExactManaPaymentChoice');
assert.deepEqual(portable(withSurge.args),[['m1'],true,'r1']);
assert.equal(d.toggleShard(s,'r1'),false,'Cannot choose the reserved Surge Shard for base payment');
assert.equal(d.getInfo(s).plan.ok,true);
// S0 nonmatching Color Mana remains 1, never copied from S1 card-family code.
assert.equal(d.toggleSurge(s),true);
d.sync(s,8,{name:'Magical Surge',bonus:10,cost:1,magical:true});
assert.equal(d.toggleShard(s,'a1'),true);
assert.equal(d.getInfo(s).plan.value,2);
assert.deepEqual(portable(d.getInfo(s).plan.selected_shard_uids),['r2','a1']);
assert.equal(d.toggleShard(s,'fake'),false);
assert.equal(d.getInfo(s).plan.ok,true);
d.sync(s,9,{name:'Magical Surge',bonus:10,cost:1,magical:true});
assert.deepEqual(portable(d.getInfo(s).plan.selected_shard_uids),['r1','r2'],'New revision resets the local draft');
console.log('PASS S0 Color values, exact UID swaps, Surge, no mutated engine state, revision reset');

s=board(pending('response_payment_choice',0,1));d.sync(s,10);
assert.equal(d.payload(s).error!==undefined,true,'Cannot PAY before mandatory Response discard');
assert.equal(d.toggleDiscard(s,1),true);
assert.deepEqual(portable(d.payload(s)),{name:'commitExactResponsePaymentWithDiscardChoice',args:[[],[1]]});
assert.deepEqual(s.pending.selected_indices,[],'Response selections remain absent from engine snapshot');
s=board(pending('response_payment_choice',2,1));d.sync(s,11);
assert.equal(d.toggleDiscard(s,0),true);
assert.deepEqual(portable(d.payload(s)),{name:'commitExactResponsePaymentWithDiscardChoice',args:[['r1','r2'],[0]]});
console.log('PASS zero- and nonzero-Mana Response additional discard is drafted locally');

// Production browser adapter: real JavaScript source, not a mock version of
// the PAY code. Includes socket ACK, gate, and bidirectional seat perspective.
const network=readFileSync(join(root,'runtime/pvp-network.js'),'utf8');
for(const seat of [1,2]){
 const packets=[],renders=[],events=[],elements=new Map();let socket,local=null,engineMutations=0;
 class Socket {static OPEN=1;constructor(){this.readyState=0;socket=this}send(raw){packets.push(JSON.parse(raw))}open(){this.readyState=1;this.onopen?.()}receive(obj){this.onmessage?.({data:JSON.stringify(obj)})}}
 const doc={readyState:'complete',visibilityState:'visible',body:{appendChild:el=>elements.set(el.id,el)},
  addEventListener(){},getElementById:id=>elements.get(id)||null,
  createElement(){return{id:'',style:{},setAttribute(){},hidden:false}},querySelector(){return{classList:{remove(){}}}}};
 const bridge={getSnapshot:()=>local,importSnapshot(b){local=structuredClone(b)},applyServerIntent(){engineMutations++;throw Error('Mana draft must never call engine')}};
 const w={console,Date,Math,JSON,URL,URLSearchParams,document:doc,location:{protocol:'https:',host:'unit.invalid',search:'',replace(){}},
  WebSocket:Socket,crypto:{randomUUID:()=>`rc5-test-doc-${seat}`},
  sessionStorage:{getItem:k=>k.includes('client_id')?'test-client-'+seat:k.includes('role')?'player':'token'},localStorage:{getItem:()=>null},
  setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},
  CustomEvent:class{constructor(name,o){this.type=name;this.detail=o?.detail}},dispatchEvent:e=>events.push(e),
  GL_PVP_BUILD_META:{buildId:'qa'},GL_LOCAL_AI_BRIDGE:bridge,
  GL_GAME_ENGINE:{getManaPlan:()=>({surge:{name:'Magical Surge',cost:1,bonus:10,magical:true}})},
  GL_AUTHORITY_ADAPTER:{register(){},use(){}},GL_GAME_UI:{render(){renders.push('full')},renderManaDraft(){renders.push('mana-only')},openingBusy:()=>false}};
 w.window=w;w.globalThis=w;vm.runInNewContext(script,w);vm.runInNewContext(network,w);
 socket.open();const wrap=(p,rev)=>({type:'snapshot',match:{status:'started',revision:rev,board:{appState:board(p),pvpPrivateStateMasked:true,pvpRecipientSeat:seat}},local:{seat,role:'player'}});
 socket.receive(wrap(pending(),21));const count=packets.length;
 assert.equal(w.GL_S0_PVP_NETWORK.sendIntent('toggleManaShardPaymentChoice',['m1']).ok,true);
 assert.equal(w.GL_S0_PVP_NETWORK.sendIntent('toggleManaPaymentSurgeChoice',[]).ok,true);
 assert.equal(packets.length,count,'Mana taps do not send WebSocket packets');
 assert.equal(engineMutations,0,'Mana taps do not call local S0 gameplay engine');
 assert.ok(renders.includes('mana-only'));
 assert.deepEqual(portable(w.GL_PVP_MANA_DRAFT.payload(local.appState).args),[['m1'],true,'r1']);
 assert.equal(w.GL_S0_PVP_NETWORK.sendIntent('commitManaShardPaymentChoice',[]).ok,true);
 const pay=packets.at(-1);assert.equal(pay.intent,'commitExactManaPaymentChoice');assert.deepEqual(JSON.parse(JSON.stringify(pay.args)),[['m1'],true,'r1']);
 assert.equal(w.GL_S0_PVP_NETWORK.state.inflight,true);
 const before=packets.length;
 const busy=w.GL_S0_PVP_NETWORK.sendIntent('advancePhase',[]);
 assert.equal(busy.ok,false);assert.equal(packets.length,before);assert.equal(w.GL_S0_PVP_NETWORK.state.queue.length,0);
 socket.receive({type:'intent-result',clientActionId:'stale-id',ok:true});assert.equal(w.GL_S0_PVP_NETWORK.state.inflight,true);
 socket.receive({type:'intent-result',clientActionId:pay.clientActionId,ok:true,snapshot:wrap(null,22)});
 assert.equal(w.GL_S0_PVP_NETWORK.state.inflight,false);
 socket.receive(wrap(pending('response_payment_choice',0,1),23));const start=packets.length;
 assert.equal(w.GL_S0_PVP_NETWORK.sendIntent('selectResponsePaymentChoice',[0]).ok,true);
 assert.equal(packets.length,start,'Response discard selection stays entirely local');
 const committed=w.GL_S0_PVP_NETWORK.sendIntent('commitResponsePaymentChoice',[]);
 assert.equal(committed.ok,true);
 assert.equal(packets.at(-1).intent,'commitExactResponsePaymentWithDiscardChoice');
 assert.deepEqual(JSON.parse(JSON.stringify(packets.at(-1).args)),[[],[0]]);
 assert.equal(engineMutations,0);
 console.log('PASS production browser PvP seat '+seat+' local Mana/Surge/Response drafts, PAY without animation gate, strict one-intent gate');
}

// A REAL RC34 engine Response with a mandatory additional Hand discard.
// The server-owned composite must not spend anything on invalid costs.
const D={style:{},setAttribute(){},removeAttribute(){},getAttribute(){return null},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},querySelector(){return null},querySelectorAll(){return []},getBoundingClientRect(){return{x:0,y:0,width:0,height:0}}};
const doc={readyState:'loading',body:null,addEventListener(){},getElementById(){return D},querySelector(){return null},querySelectorAll(){return []}};
const ctx={console,Date,Math,URL,TextEncoder,TextDecoder,Uint8Array,crypto:webcrypto,document:doc,
 location:{origin:'https://unit.invalid',href:'https://unit.invalid'},navigator:{userAgent:'RC5 test'},performance:{now:()=>0},
 setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},requestAnimationFrame(){return 0},cancelAnimationFrame(){},GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
for(const rel of ['engine/js/static-data.js','runtime/overrides/grand-finale-designer-nerf.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let code=readFileSync(join(root,rel),'utf8');
 if(rel.endsWith('app.bundle.js')){
  const inject=`\nwindow.__RC5_EXTRA_TEST__=function(){
   initCards();SUPPRESS_RENDER=true;matchStarted=true;
   GL_GAME_ENGINE.selectDeck('PLAYER','s0_starter_01_red_white');
   GL_GAME_ENGINE.selectDeck('AI','s0_starter_03_yellow_blue');
   GL_GAME_ENGINE.startLocalMatch('PLAYER');
   var s=appState;s.preGame=null;s.pvpHumanVsHuman=true;s.turn='AI';s.phase='Battle';s.round=2;s.mana=30;s.aiMana=30;
   s.aiHeroes.CENTER=heroState('S0-WAR-H004','AI','CENTER');
   s.playerHeroes.CENTER=heroState('S0-ARC-H002','PLAYER','CENTER');
   s.playerHand=['S0-ARC-003','S0-WAR-001'];s.playerDeck=[];
   var a={action:{action_key:'primal_strike',effect:{direct_damage:20,damage_type:'Physical'}},label:'Primal Strike'};
   if(!openPrimalStrikeResponseWindow(s,'AI','CENTER','CENTER',a))throw Error('Unable to open Primal Strike Response');
   var idx=s.responseWindow.options.findIndex(function(o){return o.card_id==='S0-ARC-003'});
   var opt=s.responseWindow.options[idx];
   if(!opt||(arguments[0]!==false&&!resolveResponseWindow(opt)))throw Error('Escape Arrow unavailable');
   return {pending:clone(s.pending),optionIndex:idx,hp:s.playerHeroes.CENTER.hp};
 };\n})();`;
  assert.match(code,/\n\}\)\(\);\s*$/);
  code=code.replace(/\n\}\)\(\);\s*$/,inject);
 }
 vm.runInContext(code,ctx,{filename:rel,timeout:60000});
}
const b=ctx.GL_LOCAL_AI_BRIDGE;b.setRenderSuppressed(true);const src=ctx.__RC5_EXTRA_TEST__();
assert.equal(src.pending?.type,'response_payment_choice');assert.equal(src.pending.required_discard_count,1);
const readPending=()=>b.getCanonicalSnapshot(1).appState.pending;
assert.throws(()=>applyOptimizedPvpIntent({bridge:b,readPending,name:'commitExactResponsePaymentWithDiscardChoice',args:[[],[]]}));
assert.equal(readPending().selected_indices.length,0);
const choice=(src.pending.candidates||[]).findIndex(x=>x.card_id==='S0-WAR-001');assert.ok(choice>=0);
const outcome=applyOptimizedPvpIntent({bridge:b,readPending,name:'commitExactResponsePaymentWithDiscardChoice',args:[[],[choice]]});
assert.equal(outcome?.ok,true);const after=b.getCanonicalSnapshot(1).appState;
assert.equal(after.pending,null);assert.ok(after.playerDiscard.includes('S0-WAR-001'),'Additional discard must be paid exactly once');
assert.ok(after.playerDiscard.includes('S0-ARC-003'),'Response card must be committed');
console.log('PASS REAL S0 RC34 engine: zero-Mana Response + one additional discard paid atomically');
// One-click Defense/Reaction must still open its mandatory payment.
const ready=ctx.__RC5_EXTRA_TEST__(false);
assert.ok(ready.optionIndex>=0);
const composite=applyOptimizedPvpIntent({bridge:b,readPending,name:'selectAndConfirmResponse',args:[ready.optionIndex]});
assert.equal(composite?.ok,true);
assert.equal(readPending()?.type,'response_payment_choice');
console.log('PASS REAL RC34 Response choice -> confirmation in one network intent without skipping PAY');

// Guard the other formerly two-intent UI shortcuts with strict owner/mode checks.
for(const [name,type,selection,confirm] of [
 ['selectAndConfirmStatusRemovalChoice','status_removal_choice','selectStatusRemovalChoice','handleChoiceConfirm'],
 ['selectAndConfirmSaintPurifyChoice','saint_purify_choice','selectSaintPurifyChoice','handleChoiceConfirm'],
 ['selectAndConfirmCardSearchChoice','card_search_choice','selectCardSearchChoice','handleChoiceConfirm']]){
 const calls=[],p={type,decision_side:'PLAYER',resolve_to:'discard_then_draw_three'};
 const mock={applyServerIntent(n,args){calls.push([n,args]);return{ok:true}}};
 applyOptimizedPvpIntent({bridge:mock,readPending:()=>p,name,args:[0]});
 assert.deepEqual(calls.map(x=>x[0]),[selection,confirm]);
}
console.log('PASS strict-inflight composite choices, no hidden queue dependency');
