(()=>{
'use strict';
/*
 * Grandis Legacy PvP gameplay-donor adapter (RC39).
 *
 * This file is deliberately NOT loaded by the VS AI index.html. PvP's host
 * should load it explicitly, supply its own server-authoritative, viewer-safe
 * engine/bridge facades and transport, then register/use the returned adapter.
 *
 * Locally staged choices are UI data only. Nothing here mutates game state,
 * resolves effects, exposes server secrets, or sends a WebSocket packet for a
 * preview/toggle. Only commitDraft() dispatches a final intent. The server
 * MUST still check actor, revision, ownership, costs, legal targets and choices.
 */
const CONTRACT='GL-PVP-DONOR-RC39-1';
const LIMIT_LOCAL_BYTES=8192;
const safeCopy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const fail=(code,detail)=>({ok:false,code,error:detail||code});
const revisionOf=value=>Number.isSafeInteger(value)&&value>=0?value:null;
const allowedToken=token=>(typeof token==='string'&&token.length>0&&token.length<=160)||(Number.isSafeInteger(token)&&token>=0);
const validName=value=>typeof value==='string'&&/^[A-Za-z][A-Za-z0-9_]{0,95}$/.test(value);
const serializable=value=>{
  try{
    const result=JSON.stringify(value);
    return typeof result==='string'&&result.length<=LIMIT_LOCAL_BYTES&&!/(?:"__proto__"|"prototype"|"constructor")\s*:/.test(result);
  }catch{return false;}
};
function opaqueBlindToken(token){
  // These are server-created randomized choice handles, never a Mana Shard UID,
  // color, class, pool index, or label. The host must provide HMAC-backed handles.
  return typeof token==='string'&&/^[A-Za-z0-9_-]{12,160}$/.test(token);
}
function normalizeCommit(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return null;
  if(validName(data.intent)&&Array.isArray(data.args)&&serializable(data.args))
    return {type:'runtime-intent',intent:data.intent,args:safeCopy(data.args)};
  if(Array.isArray(data.steps)&&data.steps.length>=1&&data.steps.length<=2&&
    data.steps.every(row=>validName(row?.name)&&Array.isArray(row?.args)&&serializable(row.args)))
    return {type:'runtime-intent-batch',steps:data.steps.map(row=>({name:row.name,args:safeCopy(row.args)}))};
  return null;
}
function makeAdapter(source){
  source=source||{};
  let revision=null, draft=null, inflight=null, sequence=0;
  const subscribers=new Set();
  const nonce=(globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+String(Math.random()).slice(2));
  function emit(type,extra){
    const update={type,revision,draft:publicDraft(),inflight:inflight?{clientActionId:inflight.clientActionId,baseRevision:inflight.baseRevision}:null,...extra};
    for(const fn of subscribers)try{fn(safeCopy(update));}catch{/* subscriber must not interrupt authority */}
  }
  function getRevision(){
    const hostValue=typeof source.getRevision==='function'?revisionOf(source.getRevision()):null;
    return hostValue===null?revision:hostValue;
  }
  function publicDraft(){
    if(!draft)return null;
    return {
      id:draft.id,kind:draft.kind,baseRevision:draft.baseRevision,
      choices:safeCopy(draft.choices),selected:safeCopy(draft.selected),
      minSelections:draft.minSelections,maxSelections:draft.maxSelections,
      values:safeCopy(draft.values),committing:!!inflight
    };
  }
  function beginDraft(spec){
    if(inflight)return fail('COMMIT_PENDING','Await the server result before starting another decision.');
    if(!spec||typeof spec!=='object'||typeof spec.buildCommit!=='function')
      return fail('INVALID_DRAFT','A decision needs a final intent builder.');
    const current=getRevision();
    const base=revisionOf(spec.baseRevision===undefined?current:spec.baseRevision);
    if(base===null||current!==null&&base!==current)return fail('STALE_REVISION','Draft must use the latest authoritative revision.');
    const id=String(spec.id||'');
    const kind=String(spec.kind||'generic');
    if(!id||id.length>120)return fail('INVALID_DRAFT','A stable decision ID is required.');
    const choices=spec.choices===undefined?[]:spec.choices;
    const min=spec.minSelections===undefined?0:spec.minSelections;
    const max=spec.maxSelections===undefined?choices.length:spec.maxSelections;
    if(!Array.isArray(choices)||choices.length>100||!choices.every(allowedToken)||
       new Set(choices.map(String)).size!==choices.length||!Number.isSafeInteger(min)||
       !Number.isSafeInteger(max)||min<0||max<min||max>choices.length)
      return fail('INVALID_CHOICES','Invalid choice handles or selection limits.');
    if(kind==='opponent_mana_blind'&&!choices.every(opaqueBlindToken))
      return fail('BLIND_HANDLES_REQUIRED','Blind Mana selection must use opaque server handles.');
    draft={id,kind,baseRevision:base,choices:[...choices],selected:[],minSelections:min,
      maxSelections:max,values:{},buildCommit:spec.buildCommit};
    emit('draft-started');
    return {ok:true,draft:publicDraft()};
  }
  function toggleChoice(token){
    if(!draft)return fail('NO_DRAFT');
    if(inflight)return fail('COMMIT_PENDING');
    if(!draft.choices.some(x=>String(x)===String(token)))return fail('UNKNOWN_CHOICE');
    const index=draft.selected.findIndex(x=>String(x)===String(token));
    if(index>=0)draft.selected.splice(index,1);
    else {
      if(draft.selected.length>=draft.maxSelections)return fail('MAX_SELECTIONS');
      draft.selected.push(draft.choices.find(x=>String(x)===String(token)));
    }
    emit('draft-updated');
    return {ok:true,local:true,draft:publicDraft()};
  }
  function setDraftValue(name,value){
    if(!draft)return fail('NO_DRAFT');
    if(inflight)return fail('COMMIT_PENDING');
    if(!validName(name)||!serializable(value))return fail('INVALID_DRAFT_VALUE');
    const values={...draft.values,[name]:safeCopy(value)};
    if(!serializable(values))return fail('INVALID_DRAFT_VALUE');
    draft.values=values;
    emit('draft-updated');
    return {ok:true,local:true,draft:publicDraft()};
  }
  function cancelDraft(){
    if(inflight)return fail('COMMIT_PENDING','An already submitted intent must be settled by the server.');
    draft=null;
    emit('draft-cancelled');
    return {ok:true,local:true};
  }
  function chooseTransport(){
    if(typeof source.sendFinalIntent==='function')return packet=>source.sendFinalIntent(packet);
    if(typeof source.sendIntent==='function')return packet=>{
      if(packet.type!=='runtime-intent')throw Error('Batch transport is not supported by this host.');
      return source.sendIntent(packet.intent,packet.args);
    };
    if(typeof source.sendBatch==='function')return packet=>{
      if(packet.type!=='runtime-intent-batch')throw Error('Single-intent transport is not supported by this host.');
      return source.sendBatch(packet.steps);
    };
    return null;
  }
  async function commitDraft(){
    if(!draft)return fail('NO_DRAFT');
    if(inflight)return fail('COMMIT_PENDING','Do not send a second commit while awaiting the first one.');
    const current=getRevision();
    if(current!==null&&draft.baseRevision!==current){draft=null;emit('draft-stale');return fail('STALE_REVISION');}
    if(draft.selected.length<draft.minSelections)return fail('INSUFFICIENT_CHOICES');
    const transport=chooseTransport();
    if(!transport)return fail('NO_TRANSPORT','The PvP host must provide a server commit transport.');
    let parsed;
    try{parsed=normalizeCommit(draft.buildCommit({id:draft.id,kind:draft.kind,
      selections:safeCopy(draft.selected),values:safeCopy(draft.values),baseRevision:draft.baseRevision}));}
    catch{return fail('COMMIT_BUILD_FAILED');}
    if(!parsed)return fail('INVALID_COMMIT','The final intent must be a legal single intent or atomic batch (max 2).');
    const clientActionId='rc39-pvp.'+nonce+'.'+(++sequence);
    const packet={...parsed,baseRevision:draft.baseRevision,clientActionId};
    inflight={clientActionId,baseRevision:draft.baseRevision,decisionId:draft.id};
    emit('commit-submitted');
    try{
      const result=await Promise.resolve(transport(safeCopy(packet)));
      if(result===false||result?.ok===false){
        // A network/host rejection is NOT a gameplay commit. Wait for a fresh
        // viewer-safe authoritative projection before attempting another action.
        const error=String(result?.error||'Commit transport rejected the action.');
        inflight=null;draft=null;emit('commit-transport-rejected');
        return fail('TRANSPORT_REJECTED',error);
      }
      return {ok:true,pending:true,clientActionId,baseRevision:packet.baseRevision};
    }catch(e){
      inflight=null;draft=null;emit('commit-transport-error');
      return fail('TRANSPORT_ERROR',String(e?.message||e));
    }
  }
  function acceptServerReply(reply){
    // The PvP host must obtain this result from its authenticated server,
    // never from untrusted opponent chat or client-side optimistic simulation.
    if(!inflight)return fail('NO_PENDING_COMMIT');
    if(!reply||String(reply.clientActionId||'')!==inflight.clientActionId)
      return fail('WRONG_COMMIT_ID');
    if(typeof reply.ok!=='boolean')return fail('INVALID_SERVER_REPLY');
    const result={ok:reply.ok,clientActionId:inflight.clientActionId,
      revision:revisionOf(reply.revision),error:reply.ok?'':String(reply.error||'Server rejected the decision.')};
    inflight=null;draft=null;
    if(result.revision!==null&&result.revision>=(revision??0))revision=result.revision;
    emit(result.ok?'commit-acknowledged':'commit-rejected');
    return result;
  }
  function syncAuthoritativeRevision(next){
    const n=revisionOf(next);
    if(n===null)return fail('INVALID_REVISION');
    if(revision!==null&&n<revision)return fail('STALE_SERVER_SNAPSHOT');
    const changed=revision!==n;
    revision=n;
    if(draft&&draft.baseRevision!==n&&!inflight){draft=null;emit('draft-invalidated');}
    // The host must still await an ACK (or explicitly resync). Revision change
    // alone is not evidence that *this* player's commit succeeded.
    if(changed)emit('authority-revision');
    return {ok:true,revision:n,changed};
  }
  function disconnect(){
    draft=null;
    // Do not assume any queued packet failed: the server may have committed it.
    // The host must resync and correlate its clientActionId before new input.
    emit('disconnected-resync-required');
    return {ok:true,awaitingCommitResolution:!!inflight};
  }
  function publicOpponentMana(viewerSnapshot){
    // Display ONLY the already server-projected, face-up PUBLIC pool. Do not
    // use this ordered array as a mapping for blind Mana Burn/Steal choices.
    const state=viewerSnapshot?.appState||
      (typeof source.getViewerSnapshot==='function'?source.getViewerSnapshot()?.appState:null);
    const cards=state?.aiManaPoolCards;
    if(!Array.isArray(cards))return fail('VIEWER_PROJECTION_REQUIRED');
    if(cards.some(row=>!row||row.hidden===true||!['GENERIC','MANA','CLASS'].includes(row.kind)||
       row.kind==='CLASS'&&typeof row.class_name!=='string'))
      return fail('FACE_UP_POOL_REQUIRED','PvP server projection must provide opponent public Mana faces; do not guess them in the adapter.');
    return {ok:true,cards:cards.map(row=>({kind:row.kind==='CLASS'?'CLASS':'GENERIC',...(row.kind==='CLASS'?{class_name:row.class_name}:{})}))};
  }
  return {
    mode:'PVP',contract:CONTRACT,
    engine:()=>source.engine||null,bridge:()=>source.bridge||null,
    getRevision,getDraft:publicDraft,getPendingCommit:()=>inflight?safeCopy(inflight):null,
    beginDraft,toggleChoice,setDraftValue,cancelDraft,commitDraft,
    acceptServerReply,syncAuthoritativeRevision,disconnect,publicOpponentMana,
    subscribe(fn){if(typeof fn!=='function')throw TypeError('Expected subscriber callback.');subscribers.add(fn);return()=>subscribers.delete(fn);}
  };
}
window.GL_CREATE_PVP_AUTHORITY_ADAPTER=makeAdapter;
window.GL_PVP_DONOR_ADAPTER_CONTRACT=CONTRACT;
})();
