import assert from 'node:assert/strict';
import { createGameplayIntentRouter } from '../server/gameplay-intent-router.mjs';
const clone=v=>JSON.parse(JSON.stringify(v));
function fixture({status='started',turn='PLAYER',pending=null,responseWindow=null}={}){
  const a={clientId:'A',role:'player',seat:1},b={clientId:'B',role:'player',seat:2};let applies=0;
  const engine={revision:50,board:{appState:{turn,phase:'Battle',pending,responseWindow,gameOver:status==='finished'}},canSeatAct(seat){const side=Number(seat)===2?'AI':'PLAYER';const s=this.board.appState;const owner=s.pending&&(s.pending.decision_side||s.pending.side||s.pending.source_side);if(owner)return owner===side;if(s.responseWindow?.response_owner)return s.responseWindow.response_owner===side;return s.turn===side;},applyIntent(){applies++;this.revision++;return{board:clone(this.board),revision:this.revision,animationEvents:[]}},snapshot(){return{board:clone(this.board),revision:this.revision,animationEvents:[]}}};
  return{room:{id:'C3C',generation:1,players:new Map([['A',a],['B',b]]),match:{status},engine},a,b,engine,applies:()=>applies};
}
const router=createGameplayIntentRouter();
// Wrong seat cannot choose another side's Legacy replacement.
{
  const f=fixture({pending:{type:'legacy_defeat_choice',decision_side:'AI',side:'AI',lane:'CENTER',candidates:['S1-WAR-L002']}});
  assert.throws(()=>router.handle({room:f.room,client:f.a,message:{intent:'selectLegacyDefeatChoice',args:[0],baseRevision:50,clientActionId:'wrong-seat'}}),/opponent owns the current pending decision|not your legal turn\/window/);
  assert.equal(f.applies(),0);
}
// Once server marks the match finished, mutating gameplay intents are centrally locked.
{
  const f=fixture({status:'finished'});
  assert.throws(()=>router.handle({room:f.room,client:f.a,message:{intent:'advancePhase',args:[],baseRevision:50,clientActionId:'post-match'}}),/opening coin flip|not started|started/i);
  assert.equal(f.applies(),0);
}
// Duplicate lethal / repeated delivery cannot commit twice at the transport/controller boundary.
{
  const f=fixture();const m={intent:'chooseHeroFromBoard',args:['AI','RIGHT'],baseRevision:50,clientActionId:'lethal-once'};
  const one=router.handle({room:f.room,client:f.a,message:m});const two=router.handle({room:f.room,client:f.a,message:m});assert.equal(one.duplicate,false);assert.equal(two.duplicate,true);assert.equal(f.applies(),1);
}
// Stale intent created before a Hero replacement/revision must fail before runtime mutation.
{
  const f=fixture();const r=router.handle({room:f.room,client:f.a,message:{intent:'beginActivatedHeroAbility',args:['PLAYER','CENTER','old-component'],baseRevision:49,clientActionId:'stale-old-hero'}});assert.equal(r.stale,true);assert.equal(f.applies(),0);
}
console.log(JSON.stringify({ok:true,candidate:'PvP v3.43 Candidate 3C',wrongSeatReplacementRejected:true,postMatchMutationRejected:true,duplicateLethalDeduped:true,staleOldHeroRevisionRejected:true},null,2));
