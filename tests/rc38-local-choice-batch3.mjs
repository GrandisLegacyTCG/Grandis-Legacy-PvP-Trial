/** RC38 Beta 2 Batch 3 Local Draft -> one authoritative commit. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {applyExactLocalChoiceDraft} from '../server/headless-rc32.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const client=read('public/battle/runtime/pvp-network.js');
const server=read('server.js');
const headless=read('server/headless-rc32.mjs');
const bundle=read('public/battle/engine/shared-app/app.bundle.js');
const types=['trial_rankup_return_exp','scouting_exp_selection','hand_limit_discard','s0_bard_draw_choice','crystal_ball_reorder','legacy_card_choice'];
for(const type of types)assert.ok(client.includes(type)&&headless.includes(type));
assert.match(headless,/name === 'commitExactLocalChoiceDraft'/);
assert.match(server,/base!==room.authority.revision/,'stale revision checked before running selection');
const clone=x=>JSON.parse(JSON.stringify(x));
function harness(initial){
  const state={pending:clone(initial),playerHand:['H0','H1','H2','H3','H4']};
  const names=[];
  const bridge={getCanonicalSnapshot:()=>({appState:state}),applyServerIntent(name,args){
    names.push([name,clone(args)]);
    const p=state.pending;if(!p)return{ok:false,error:'No pending'};
    const i=args[0];
    switch(name){
      case 'trialSelectRankUpReturn':
      case 'selectLegacyCardChoice':
      case 'toggleS0BardDrawIndex':
        if(!Number.isInteger(i))return{ok:false};
        p.selected_indices=p.selected_indices||[];
        p.selected_indices.includes(i)?p.selected_indices.splice(p.selected_indices.indexOf(i),1):p.selected_indices.push(i);break;
      case 'selectScoutingExpChoice':p.selected_exp_choice=i;break;
      case 'toggleDiscardIndex':p.selected=p.selected||[];p.selected.includes(i)?p.selected.splice(p.selected.indexOf(i),1):p.selected.push(i);break;
      case 'activateS0BardDrawChoice':p.selection_active=true;break;
      case 'moveCrystalBallOrder':{
        const [idx,dir]=String(i).split(':');const x=Number(idx),j=x+(dir==='up'?-1:1);
        if(!p.selected_order[x]||!p.selected_order[j])return{ok:false};
        [p.selected_order[x],p.selected_order[j]]=[p.selected_order[j],p.selected_order[x]];break;
      }
      case 'commitS0BardDrawChoice':
      case 'handleChoiceConfirm':state.finished=clone(p);state.pending=null;break;
      default:return{ok:false,error:'Unexpected '+name};
    }
    return{ok:true};
  }};
  return {state,names,bridge,readPending:()=>state.pending};
}
function apply(initial,payload,expectedNames){
 const h=harness(initial);
 assert.deepEqual(applyExactLocalChoiceDraft({...h,payload}),{ok:true});
 assert.equal(h.state.pending,null);
 assert.deepEqual(h.names.map(x=>x[0]),expectedNames);
 return h;
}
apply({type:'trial_rankup_return_exp',decision_side:'PLAYER',side:'PLAYER',committed:true,commit_stage:'post_commit',candidates:[{card_id:'A'},{card_id:'B'},{card_id:'C'}],quota:2,selected_indices:[]},
 {kind:'trial_rankup_return_exp',selected:[0,2]},['trialSelectRankUpReturn','trialSelectRankUpReturn','handleChoiceConfirm']);
apply({type:'scouting_exp_selection',decision_side:'PLAYER',side:'PLAYER',committed:true,commit_stage:'post_commit',exp_choices:[{card_id:'A'},{card_id:'B'}],selected_exp_choice:null},
 {kind:'scouting_exp_selection',index:1},['selectScoutingExpChoice','handleChoiceConfirm']);
apply({type:'hand_limit_discard',decision_side:'PLAYER',side:'PLAYER',required:2,selected:[]},
 {kind:'hand_limit_discard',selected:[1,3]},['toggleDiscardIndex','toggleDiscardIndex','handleChoiceConfirm']);
apply({type:'s0_bard_draw_choice',decision_side:'PLAYER',side:'PLAYER',selection_active:false,max_count:3,selected_indices:[]},
 {kind:'s0_bard_draw_choice',selected:[0,2]},['activateS0BardDrawChoice','toggleS0BardDrawIndex','toggleS0BardDrawIndex','commitS0BardDrawChoice']);
apply({type:'legacy_card_choice',decision_side:'PLAYER',side:'PLAYER',required_choices:2,candidates:['A','B','C'],selected_indices:[]},
 {kind:'legacy_card_choice',selected:[2,0]},['selectLegacyCardChoice','selectLegacyCardChoice','handleChoiceConfirm']);
const crystal=apply({type:'crystal_ball_reorder',decision_side:'PLAYER',side:'PLAYER',selected_order:['A','B','C']},
 {kind:'crystal_ball_reorder',permutation:[2,0,1]},['moveCrystalBallOrder','moveCrystalBallOrder','handleChoiceConfirm']);
assert.deepEqual(crystal.state.finished.selected_order,['C','A','B']);
const dupCrystal=apply({type:'crystal_ball_reorder',decision_side:'PLAYER',side:'PLAYER',selected_order:['A','A','C']},
 {kind:'crystal_ball_reorder',permutation:[2,1,0]},['moveCrystalBallOrder','moveCrystalBallOrder','moveCrystalBallOrder','handleChoiceConfirm']);
assert.deepEqual(dupCrystal.state.finished.selected_order,['C','A','A']);
// No server work should execute on invalid/untrusted data.
for(const payload of [
 {kind:'trial_rankup_return_exp',selected:[0,0]},
 {kind:'trial_rankup_return_exp',selected:[0,999]},
 {kind:'trial_rankup_return_exp',selected:['0',1]},
 {kind:'trial_rankup_return_exp',selected:[0,1,2]},
 {kind:'legacy_card_choice',selected:[0,999]}
]){
 const kind=payload.kind;
 const p=kind==='legacy_card_choice'?
   {type:kind,side:'PLAYER',decision_side:'PLAYER',required_choices:2,candidates:['A','B','C'],selected_indices:[]}:
   {type:kind,side:'PLAYER',decision_side:'PLAYER',committed:true,commit_stage:'post_commit',quota:2,candidates:['A','B','C'],selected_indices:[]};
 const h=harness(p);assert.throws(()=>applyExactLocalChoiceDraft({...h,payload}));assert.equal(h.names.length,0);
}
for(const side of ['AI','UNKNOWN']){
 const h=harness({type:'scouting_exp_selection',decision_side:side,side,committed:true,commit_stage:'post_commit',selected_exp_choice:null,exp_choices:['A','B']});
 assert.throws(()=>applyExactLocalChoiceDraft({...h,payload:{kind:'scouting_exp_selection',index:1}}));
 assert.equal(h.names.length,0,'Never replay opponent selection');
}
for(const p of [
 {type:'hand_limit_discard',decision_side:'PLAYER',side:'PLAYER',required:2,selected:[]},
 {type:'scouting_exp_selection',decision_side:'PLAYER',side:'PLAYER',committed:true,commit_stage:'post_commit',selected_exp_choice:null,exp_choices:['A']},
 {type:'crystal_ball_reorder',decision_side:'PLAYER',side:'PLAYER',selected_order:['A','B','C']}
]){
 const bad=p.type==='hand_limit_discard'?{kind:p.type,selected:[0,0]}:
   p.type==='scouting_exp_selection'?{kind:p.type,index:1}:{kind:p.type,permutation:[0,0,2]};
 const h=harness(p);assert.throws(()=>applyExactLocalChoiceDraft({...h,payload:bad}));assert.equal(h.names.length,0);
}
// Exercise *production client* functions with a real isolated VM and a
// mimicked RC38 bridge. Local selections must not use a WebSocket and the
// outgoing commit contains only legal indices / positional permutation.
const actionMap=client.slice(client.indexOf('const LOCAL_CHOICE_ACTIONS='),client.indexOf('let localChoiceDraft=null;'));
const helpers=client.slice(client.indexOf('function updateLocalChoiceDraft('),client.indexOf('function toAtomicPayment('));
assert.ok(actionMap.includes('trialSelectRankUpReturn')&&helpers.includes('commitExactLocalChoiceDraft'));
function clientCase(p0,actions,confirm,expected){
 const canonical={pending:clone(p0)};
 const local={pending:clone(p0)};
 const sent=[];
 const bridge={getSnapshot:()=>({appState:local}),applyServerIntent(name,args){
    sent.push([name,clone(args)]);
    if(name==='trialSelectRankUpReturn'||name==='toggleS0BardDrawIndex'||name==='selectLegacyCardChoice'){
      const arr=local.pending.selected_indices;const x=args[0];arr.includes(x)?arr.splice(arr.indexOf(x),1):arr.push(x);
    }else if(name==='toggleDiscardIndex'){
      const arr=local.pending.selected;const x=args[0];arr.includes(x)?arr.splice(arr.indexOf(x),1):arr.push(x);
    }else if(name==='selectScoutingExpChoice')local.pending.selected_exp_choice=args[0];
    else if(name==='moveCrystalBallOrder'){
      const [idx,d]=String(args[0]).split(':'),a=Number(idx),b=a+(d==='up'?-1:1),arr=local.pending.selected_order;
      [arr[a],arr[b]]=[arr[b],arr[a]];
    }else if(name==='activateS0BardDrawChoice')local.pending.selection_active=true;
    else if(name==='cancelS0BardDrawChoice'){local.pending.selection_active=false;local.pending.selected_indices=[];}
    else throw Error('Unexpected bridge selection '+name);
    return{ok:true};
 }};
 const ctx={state:{inflight:false,queue:[],revision:7,snapshot:{appState:canonical}},
  bridge,clone,window:{GL_GAME_UI:{render(){}}},Array,Number,Map,Set,Math,
  localChoiceDraft:null};
 vm.createContext(ctx);vm.runInContext(actionMap+'\n'+helpers,ctx);
 for(const [name,args] of actions)assert.equal(ctx.updateLocalChoiceDraft(name,args).local,true);
 assert.deepEqual(canonical.pending,p0,'Parent server snapshot must remain immutable');
 assert.equal(sent.length,actions.length,'No extra server intent during selection');
 const payload=ctx.toAtomicLocalChoice(confirm,[false]);
 assert.equal(payload.name,'commitExactLocalChoiceDraft');
 assert.deepEqual(JSON.parse(JSON.stringify(payload.args[0])),expected);
 ctx.state.revision=8;
 assert.equal(ctx.toAtomicLocalChoice(confirm,[false]).error,'Selection changed. Please choose again.');
}
clientCase({type:'trial_rankup_return_exp',decision_side:'PLAYER',side:'PLAYER',selected_indices:[],quota:2},
 [['trialSelectRankUpReturn',[0]],['trialSelectRankUpReturn',[2]]],'handleChoiceConfirm',
 {kind:'trial_rankup_return_exp',selected:[0,2]});
clientCase({type:'crystal_ball_reorder',decision_side:'PLAYER',side:'PLAYER',selected_order:['A','A','C']},
 [['moveCrystalBallOrder',['2:up']],['moveCrystalBallOrder',['1:up']]],'handleChoiceConfirm',
 {kind:'crystal_ball_reorder',permutation:[2,0,1]});
clientCase({type:'hand_limit_discard',decision_side:'PLAYER',side:'PLAYER',selected:[],required:2},
 [['toggleDiscardIndex',[0]],['toggleDiscardIndex',[3]]],'handleChoiceConfirm',
 {kind:'hand_limit_discard',selected:[0,3]});
// No protocol additions / lobby socket changes.
assert.match(client,/type:'runtime-intent',clientActionId:id,baseRevision:state.revision/);
assert.match(client,/state\.revision=Number\(m\.revision\|\|0\);state\.snapshot=board;\s*localChoiceDraft=null;/);
console.log('PASS RC38 Beta2 Batch3: local multi-choice, one exact server commit, invalid/foreign draft rejection, duplicate Crystal IDs, stale revision reset');
