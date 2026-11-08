(()=>{
'use strict';
/*
 * PvP RC5 Mana Payment draft (inspired by the Season 1 client boundary).
 * This is a PRESENTATION-ONLY local selection model. It never calls the game
 * engine or the network. Only server-authored pending.shard_choices determine
 * what each physical S0 shard is worth (including Color Mana). The authority
 * revalidates every UID, amount, Surge and extra Hand discard at PAY.
 */
let active=null;
const ids=a=>(Array.isArray(a)?a:[]).map(String);
const clone=a=>Array.isArray(a)?a.slice():[];
const isPayment=p=>p?.decision_side==='PLAYER'&&['mana_shard_payment_choice','response_payment_choice'].includes(p.type);
const costOf=p=>Math.max(0,Number(p?.type==='response_payment_choice'?p.mana_cost:p?.cost)||0);
function signature(s,p,rev){
 const card=p.type==='response_payment_choice'?p.response_option?.card_id:p.card_id;
 return JSON.stringify([Number(rev)||0,p.type,card,p.action?.hand_index,p.action?.source_lane,
   p.response_option?.hand_index,p.incoming_response_window?.response_window_token,
   costOf(p),p.required_discard_count,(s.playerManaPoolCards||[]).map(x=>x.uid),
   (p.candidates||[]).map(x=>[x.hand_index,x.card_id])]);
}
function init(s,rev,surgeMeta){
 const p=s?.pending;
 if(!isPayment(p)){active=null;return null}
 const key=signature(s,p,rev),pool=s.playerManaPoolCards||[],valid=new Set(pool.map(sh=>String(sh.uid)));
 if(active?.key===key)return active;
 active={key,rev:Number(rev)||0,
   uids:ids(p.selected_shard_uids).filter((id,i,a)=>valid.has(id)&&a.indexOf(id)===i),
   discard:clone(p.selected_indices).map(Number).filter(x=>Number.isInteger(x)&&x>=0&&x<(p.candidates||[]).length),
   surgeSelected:!!p.use_magical_surge,surgeUid:String(p.selected_surge_mana_uid||''),
   surgeMeta:surgeMeta?{...surgeMeta}:null};
 return active;
}
function rowsFor(s){
 const p=s?.pending,pool=s?.playerManaPoolCards||[];
 if(!isPayment(p))return[];
 const choices=new Map((p.shard_choices||[]).map(c=>[String(c.uid),c]));
 return pool.map(sh=>{
   const item=choices.get(String(sh.uid));
   // The explicit value comes from the S0 engine's pending choice, not the S1
   // card-code helper. Fail closed rather than guess a Color Shard's value.
   const value=Number(item?.value);
   return{...sh,uid:String(sh.uid),value:Number.isInteger(value)&&value>=1&&value<=2?value:NaN};
 });
}
function manaPlan(s){
 if(!active||!isPayment(s?.pending))return null;
 const rows=rowsFor(s),byUid=new Map(rows.map(r=>[r.uid,r])),selected=active.uids,value=selected.reduce((n,uid)=>n+(byUid.get(uid)?.value||0),0),cost=costOf(s.pending),shards=selected.map(uid=>byUid.get(uid)).filter(Boolean);
 const ok=selected.length===shards.length&&shards.every(r=>Number.isFinite(r.value))&&value===cost;
 return{ok,cost,value,selected_shard_uids:clone(selected),shards,class_value:shards.filter(x=>x.kind==='CLASS').reduce((n,x)=>n+x.value,0)};
}
function bestSubset(rows,amount,preferColor=false){
 if(amount===0)return[];
 if(rows.length>12)return null;
 let best=null;
 for(let mask=1;mask<(1<<rows.length);mask++){
   let value=0,classes=0,n=0,picked=[];
   for(let j=0;j<rows.length;j++)if(mask&(1<<j)){
     const sh=rows[j];value+=sh.value;classes+=(sh.kind==='CLASS');n++;picked.push(sh.uid);
     if(value>amount)break;
   }
   if(value!==amount)continue;
   const candidate={uids:picked,classes,n};
   if(!best||(preferColor?(candidate.classes>best.classes||(candidate.classes===best.classes&&candidate.n>best.n)):
     (candidate.classes<best.classes||(candidate.classes===best.classes&&candidate.n>best.n))))best=candidate;
 }
 return best?.uids||null;
}
function surgeInfo(s){
 if(!active||s?.pending?.type!=='mana_shard_payment_choice'||!active.surgeMeta)return null;
 const p=manaPlan(s),profile=active.surgeMeta,availableIds=new Set(active.uids),remaining=rowsFor(s).filter(sh=>!availableIds.has(sh.uid)),cost=Number(profile.cost||1);
 const can=!!profile.magical&&!!p?.ok&&remaining.length>=cost;
 const preferred=remaining.find(sh=>sh.uid===active.surgeUid)||remaining.find(sh=>sh.kind!=='CLASS')||remaining[0];
 const uid=preferred?.uid||'';
 if(active.surgeSelected&&!can){active.surgeSelected=false;active.surgeUid=''}
 if(active.surgeSelected&&uid)active.surgeUid=uid;
 return{...profile,cost,available:can,selected:can&&active.surgeSelected,
   surge_mana_uid:uid||null,
   reason:!profile.magical?'This card is not a Magical Attack.':!p?.ok?'Select a valid Mana payment first.':!can?'Not enough additional Mana after paying the card cost.':''};
}
function getInfo(s){
 if(!active||!isPayment(s?.pending))return null;
 const plan=manaPlan(s),surge=surgeInfo(s),need=Number(s.pending.required_discard_count||0),discard=clone(active.discard);
 return{pending:s.pending,plan,pool:s.playerManaPoolCards||[],surge,
   selected_indices:discard,discardReady:s.pending.type!=='response_payment_choice'||discard.length===need,
   canPay:!!plan?.ok&&(s.pending.type!=='response_payment_choice'||discard.length===need)&&(!active.surgeSelected||!!surge?.available)};
}
function toggleShard(s,uid){
 if(!active||!isPayment(s?.pending))return false;
 uid=String(uid||'');const rows=rowsFor(s),byUid=new Map(rows.map(sh=>[sh.uid,sh]));
 if(!byUid.has(uid)||!rows.every(sh=>Number.isFinite(sh.value)))return false;
 // A Shard reserved for Surge cannot also pay the base Skill cost.
 if(active.surgeSelected&&surgeInfo(s)?.surge_mana_uid===uid)return false;
 const chosen=active.uids.slice(),at=chosen.indexOf(uid),target=byUid.get(uid),val=target.value;
 if(!manaPlan(s)?.ok)return false;
 if(at>=0){
   const rest=chosen.filter(x=>x!==uid),replacements=bestSubset(rows.filter(sh=>sh.uid!==uid&&!rest.includes(sh.uid)),val);
   if(!replacements)return false;
   active.uids=rest.concat(replacements);
 }else{
   const replacement=bestSubset(rows.filter(sh=>chosen.includes(sh.uid)),val,target.kind==='CLASS'&&val===2);
   if(!replacement)return false;
   active.uids=chosen.filter(x=>!replacement.includes(x)).concat(uid);
 }
 // The optional surcharge is a separate physical Shard and must stay distinct.
 surgeInfo(s);
 return true;
}
function toggleSurge(s){
 if(!active||s?.pending?.type!=='mana_shard_payment_choice')return false;
 const info=surgeInfo(s);if(!info?.available)return false;
 active.surgeSelected=!active.surgeSelected;
 active.surgeUid=active.surgeSelected?String(info.surge_mana_uid||''):'';
 return true;
}
function toggleDiscard(s,index){
 if(!active||s?.pending?.type!=='response_payment_choice')return false;
 const p=s.pending,need=Number(p.required_discard_count||0);index=Number(index);
 if(!Number.isInteger(index)||index<0||index>=(p.candidates||[]).length||need<=0)return false;
 const next=active.discard.slice(),at=next.indexOf(index);
 if(at>=0)next.splice(at,1);
 else if(need===1){next.splice(0,next.length,index)}
 else if(next.length<need)next.push(index);
 else return false;
 active.discard=next;return true;
}
function payload(s){
 const info=getInfo(s);if(!info?.canPay)return{error:'Select valid physical Mana Shards and all mandatory costs before PAY.'};
 const p=s.pending,sel=info.plan.selected_shard_uids.map(String);
 if(p.type==='response_payment_choice')return{name:'commitExactResponsePaymentWithDiscardChoice',args:[sel,info.selected_indices]};
 return{name:'commitExactManaPaymentChoice',args:[sel,!!info.surge?.selected,info.surge?.selected?String(info.surge.surge_mana_uid):null]};
}
window.GL_PVP_MANA_DRAFT={
 sync(s,rev,serverSurge=null){return init(s,rev,serverSurge)},
 getInfo, toggleShard,toggleSurge,toggleDiscard,payload,
 clear(){active=null},
 debugState(){return active?{uids:clone(active.uids),discard:clone(active.discard),surge:active.surgeSelected,key:active.key}:null}
};
})();
