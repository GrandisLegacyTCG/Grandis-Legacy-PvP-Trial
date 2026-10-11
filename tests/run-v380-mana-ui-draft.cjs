const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'public/shared-app/app-runtime.js'),'utf8');
const start=source.indexOf('function manaCardClassFromCode(');
const end=source.indexOf('function heroClassAbilityName(',start);
assert.ok(start>=0&&end>start,'Mana UI draft helper block must exist');
const helperSource=source.slice(start,end);

const cards={
  'S1-WAR-005':{card_id:'S1-WAR-005',family:'Skill'},
  'S1-MAG-006':{card_id:'S1-MAG-006',family:'Skill'},
  'S1-EVT-002':{card_id:'S1-EVT-002',family:'Event'}
};
const ctx={
  console,
  Map,Set,Number,String,Array,Math,
  setTimeout:fn=>{if(typeof fn==='function')fn();return 1},
  renderNow:()=>{},
  centerChoiceRenderSig:'',manaRenderKey:'',handRenderKey:'',
  manaPaymentDraft:{key:'',uids:[],responseIndices:[]},
  rawCardDef:id=>cards[String(id)]||null
};
vm.createContext(ctx);
new vm.Script(helperSource,{filename:'mana-ui-helpers.js'}).runInContext(ctx);

const pool=[
  {uid:'M1',kind:'MANA'},
  {uid:'M2',kind:'MANA'},
  {uid:'CW',kind:'CLASS',class_name:'Warrior'},
  {uid:'CM',kind:'CLASS',class_name:'Mage'}
];
let plan=ctx.exactManaDraftPlan(pool,['M1','M2'],'S1-WAR-005',2);
assert.equal(plan.ok,true);assert.equal(plan.value,2);
plan=ctx.exactManaDraftPlan(pool,['CW'],'S1-WAR-005',2);
assert.equal(plan.ok,true,'matching Warrior Class Shard must count as 2 for Warrior Skill');
plan=ctx.exactManaDraftPlan(pool,['CW'],'S1-EVT-002',2);
assert.equal(plan.ok,false);assert.equal(plan.value,1,'Class Shard must count as 1 for Event payment');
plan=ctx.exactManaDraftPlan(pool,['CM','M1'],'S1-WAR-005',2);
assert.equal(plan.ok,true);assert.equal(plan.value,2,'nonmatching Class Shard must count as 1');

const normalPending={type:'mana_shard_payment_choice',card_id:'S1-WAR-005',cost:2,selected_shard_uids:['M1','M2']};
const state={playerManaPoolCards:pool};
ctx.manaPaymentDraft={key:'',uids:[],responseIndices:[]};
assert.equal(ctx.toggleManaPaymentDraftUid(state,normalPending,pool,'CW'),true);
let draft=ctx.ensureManaPaymentDraft(state,normalPending,pool);
assert.deepEqual(Array.from(draft.uids),['CW'],'matching Class click must replace the two recommended normal Mana Shards exactly like donor selection semantics');
assert.equal(ctx.toggleManaPaymentDraftUid(state,normalPending,pool,'CW'),true);
draft=ctx.ensureManaPaymentDraft(state,normalPending,pool);
assert.deepEqual(Array.from(draft.uids),[],'clicking selected Shard again must deselect it');

ctx.manaPaymentDraft={key:'',uids:[],responseIndices:[]};
assert.equal(ctx.toggleManaPaymentDraftUid(state,normalPending,pool,'CM'),true);
draft=ctx.ensureManaPaymentDraft(state,normalPending,pool);
assert.deepEqual(Array.from(draft.uids),['M2','CM'],'nonmatching Class selection must keep an exact 2-Mana payment');

const responsePending={type:'response_payment_choice',mana_cost:2,response_option:{card_id:'S1-WAR-005'},required_discard_count:1,selected_shard_uids:['M1','M2'],selected_indices:[],candidates:[{hand_index:2},{hand_index:3}]};
ctx.manaPaymentDraft={key:'',uids:[],responseIndices:[]};
assert.equal(ctx.toggleResponsePaymentDraftIndex(state,responsePending,1),true);
draft=ctx.ensureManaPaymentDraft(state,responsePending,pool);
assert.deepEqual(Array.from(draft.responseIndices),[1]);
assert.equal(ctx.toggleResponsePaymentDraftIndex(state,responsePending,0),true);
draft=ctx.ensureManaPaymentDraft(state,responsePending,pool);
assert.deepEqual(Array.from(draft.responseIndices),[0],'single required Response discard must replace prior UI draft selection');

console.log(JSON.stringify({ok:true,exactManaDraft:true,matchingClassValue:true,eventClassValue:true,donorStyleToggle:true,responseDiscardDraft:true},null,2));
