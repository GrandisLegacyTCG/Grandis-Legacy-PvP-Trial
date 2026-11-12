/** RC38 official engine smoke: post-commit selections applied by authority, not mocked rules. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {webcrypto} from 'node:crypto';
import {applyOptimizedPvpIntent} from '../server/headless-rc32.mjs';
const root=join(process.cwd(),'public/battle');
const dummy={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},querySelector(){return null},querySelectorAll(){return []},getBoundingClientRect(){return{x:0,y:0,width:0,height:0}}};
const document={readyState:'loading',body:null,addEventListener(){},getElementById(){return dummy},querySelector(){return null},querySelectorAll(){return []}};
const ctx={console,Date,Math,URL,TextEncoder,TextDecoder,Uint8Array,crypto:webcrypto,document,location:{origin:'https://unit.invalid',href:'https://unit.invalid'},navigator:{userAgent:'Batch3 real engine'},performance:{now:()=>0},setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},requestAnimationFrame(){return 0},cancelAnimationFrame(){},GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
for(const path of ['engine/js/static-data.js','runtime/overrides/grand-finale-designer-nerf.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let code=readFileSync(join(root,path),'utf8');
 if(path.endsWith('app.bundle.js')){
   const inject=`\nwindow.__B3_TEST__={
     prepare:function(which){
       initCards();SUPPRESS_RENDER=true;matchStarted=true;appState=buildInitialMatchState();
       var s=appState;s.preGame=null;s.turn='PLAYER';s.phase='Deploy';s.pending=null;s.responseWindow=null;s.gameOver=false;s.pvpHumanVsHuman=true;
       s.playerHand=['S0-CLE-002','S0-WAR-001','S0-CLE-007','S0-WAR-004','S0-CLE-010'];
       s.playerDeck=['S0-WAR-004','S0-CLE-002','S0-CLE-007','S0-WAR-001'];s.playerDiscard=[];
       if(which==='rank'){
         s.playerDiscard=['S0-WAR-001','S0-CLE-002'];
         s.pending={type:'trial_rankup_return_exp',decision_side:'PLAYER',side:'PLAYER',lane:'LEFT',rank:2,quota:2,
           candidates:[{card_id:'S0-WAR-001',discard_index:0},{card_id:'S0-CLE-002',discard_index:1}],
           selected_indices:[],committed:true,commit_stage:'post_commit'};
       }else if(which==='crystal'){
         s.pending={type:'crystal_ball_reorder',decision_side:'PLAYER',side:'PLAYER',selected_order:s.playerDeck.slice(0,3)};
       }else if(which==='scout'){
         s.aiHeroes.LEFT.exp_cards=['S0-WAR-001'];s.aiHeroes.LEFT.exp_total=100;
         s.pending={type:'scouting_exp_selection',decision_side:'PLAYER',side:'PLAYER',source_side:'PLAYER',
           target_side:'AI',target_lane:'LEFT',committed:true,commit_stage:'post_commit',
           exp_choices:[{card_id:'S0-WAR-001',exp_index:0,exp_value:100}],selected_exp_choice:null};
       }else if(which==='hand'){
         s.phase='End';s.playerHand=['S0-WAR-001','S0-WAR-004','S0-CLE-002','S0-CLE-007','S0-CLE-010','S0-WAR-001','S0-CLE-002','S0-CLE-007','S0-WAR-004','S0-CLE-010'];
         s.pending={type:'hand_limit_discard',decision_side:'PLAYER',side:'PLAYER',required:2,selected:[]};
       }else if(which==='bard'){
         s.phase='Draw';s.playerHeroes.LEFT=heroState('S0-CLE-H009','PLAYER','LEFT');s.pending={type:'s0_bard_draw_choice',decision_side:'PLAYER',side:'PLAYER',source_lane:'LEFT',
           ability_name:'Orchestral Crescendo',max_count:2,selected_indices:[],selection_active:true};
       }else throw Error('unknown '+which);
       syncCounts(s);return glPvpBridgeSnapshot();
     }
   };
})();`;
   assert.match(code,/\n\}\)\(\);\s*$/);
   code=code.replace(/\n\}\)\(\);\s*$/,inject);
 }
 vm.runInContext(code,ctx,{timeout:60000,filename:path});
}
const bridge=ctx.GL_LOCAL_AI_BRIDGE;bridge.setRenderSuppressed(true);
const pending=()=>bridge.getCanonicalSnapshot(1).appState.pending;
function run(name,payload){
 const before=bridge.getCanonicalSnapshot(1).appState;
 assert.equal(before.pending.type,payload.kind);
 const result=applyOptimizedPvpIntent({bridge,readPending:pending,name:'commitExactLocalChoiceDraft',args:[payload]});
 assert.equal(result.ok,true,payload.kind);
 const after=bridge.getCanonicalSnapshot(1).appState;
 assert.notDeepEqual(after,before,'Authority state must change');
 assert.notEqual(after.pending?.type,payload.kind,'Choice must finish');
 return {before,after};
}
ctx.__B3_TEST__.prepare('rank');const rank=run('commitExactLocalChoiceDraft',{kind:'trial_rankup_return_exp',selected:[0,1]});
assert.ok(rank.after.playerHand.includes('S0-WAR-001')&&rank.after.playerHand.includes('S0-CLE-002'));
assert.equal(rank.after.playerDiscard.includes('S0-CLE-002'),false);
console.log('PASS real RC38 Rank Up: 2 selected EXP returned in one commit');
ctx.__B3_TEST__.prepare('crystal');const crystal=run('commitExactLocalChoiceDraft',{kind:'crystal_ball_reorder',permutation:[2,0,1]});
assert.deepEqual(Array.from(crystal.after.playerDeck.slice(0,3)),['S0-CLE-007','S0-WAR-004','S0-CLE-002']);
console.log('PASS real RC38 Crystal Ball: moved original deck-top cards in one commit');
ctx.__B3_TEST__.prepare('scout');const scout=run('commitExactLocalChoiceDraft',{kind:'scouting_exp_selection',index:0});
assert.equal(scout.after.aiHeroes.LEFT.exp_cards.length,0);
console.log('PASS real RC38 Scouting EXP: opponent exp discard after one commit');
ctx.__B3_TEST__.prepare('hand');const hand=run('commitExactLocalChoiceDraft',{kind:'hand_limit_discard',selected:[0,1]});
assert.equal(hand.after.playerHand.length,8);
console.log('PASS real RC38 End Hand Limit: two Hand selections -> next turn in one commit');
ctx.__B3_TEST__.prepare('bard');const bard=run('commitExactLocalChoiceDraft',{kind:'s0_bard_draw_choice',selected:[0,1]});
assert.equal(bard.after.playerDiscard.length,2);
console.log('PASS real RC38 Bard Draw: two Hand discards -> draw in one commit');
// Mirror into the seat-2-local PLAYER coordinate system. The server must
// validate ownership against local PLAYER, while canonical seat 1 sees AI.
ctx.__B3_TEST__.prepare('scout');
const seat2Before=bridge.getCanonicalSnapshot(2);
assert.equal(bridge.importCanonicalSnapshot(seat2Before,2,{skipImportAnimations:true}),true);
assert.equal(bridge.getCanonicalSnapshot(1).appState.pending?.decision_side,'PLAYER');
const seat2After=run('commitExactLocalChoiceDraft',{kind:'scouting_exp_selection',index:0});
assert.equal(seat2After.after.aiHeroes.LEFT.exp_cards.length,0);
console.log('PASS real RC38 seat 2 mirrored local PLAYER choice (no opposite-seat control)');
