(()=>{
'use strict';
/*
  PvP gameplay-intent transport gate.

  Contract:
  - exactly one gameplay action may be in flight;
  - no silent client-side action queue;
  - the server completes an action with one `intent-result` that contains the
    viewer-safe authoritative snapshot produced after that action;
  - a timeout releases the gate and requests a fresh snapshot so one lost
    result can never deadlock the rest of the match.
*/
function create(opts={}){
  const now=typeof opts.now==='function'?opts.now:()=>Date.now();
  const setT=typeof opts.setTimeout==='function'?opts.setTimeout:setTimeout;
  const clearT=typeof opts.clearTimeout==='function'?opts.clearTimeout:clearTimeout;
  const timeoutMs=Math.max(1000,Number(opts.timeoutMs||6000));
  let active=null,timer=null,sequence=0;

  function clearTimer(){if(timer){clearT(timer);timer=null}}
  function makeId(name,base){
    sequence=(sequence+1)%1000000000;
    const client=String(opts.clientId?.()||'client');
    const clean=String(name||'action').replace(/[^A-Za-z0-9_.:-]/g,'').slice(0,48)||'action';
    return client+'.'+String(base||0)+'.'+String(sequence)+'.'+clean;
  }
  function finish(reason,error=''){
    const prev=active;active=null;clearTimer();
    if(error&&typeof opts.onError==='function')opts.onError(error,{reason,action:prev});
    return prev;
  }
  function arm(){
    clearTimer();
    timer=setT(()=>{
      if(!active)return;
      const stuck=finish('timeout','Server response timed out. The board is being resynchronized.');
      try{opts.onTimeout?.(stuck)}catch{}
    },timeoutMs);
  }
  function dispatch(kind,name,argsOrSteps){
    if(active){
      const error='Waiting for the server to finish '+String(active.name||'the previous action')+'.';
      try{opts.onBusy?.(error,active)}catch{}
      return{ok:false,pending:true,busy:true,error};
    }
    const snap=opts.getSnapshot?.()||null,match=snap?.match||null,local=snap?.local||null;
    if(local?.role!=='player'||match?.status!=='started')return{ok:false,error:'PvP gameplay is not ready.'};
    const base=Number(match.revision||0),id=makeId(name,base),payload={baseRevision:base,clientActionId:id};
    const packet=kind==='batch'
      ?{type:'runtime-intent-batch',...payload,steps:Array.isArray(argsOrSteps)?argsOrSteps:[]}
      :{type:'runtime-intent',...payload,intent:String(name||''),args:Array.isArray(argsOrSteps)?argsOrSteps:[]};
    const ok=opts.send?.(packet.type,packet)===true;
    if(!ok)return{ok:false,error:'WebSocket unavailable.'};
    active={id,kind,name:String(name||''),base,sentAt:now()};arm();
    return{ok:true,pending:true,clientActionId:id,baseRevision:base};
  }
  function sendIntent(name,args=[]){return dispatch('single',name,args)}
  function sendBatch(steps=[]){
    const rows=(Array.isArray(steps)?steps:[]).filter(x=>x?.name).map(x=>({name:String(x.name),args:Array.isArray(x.args)?x.args:[]}));
    if(!rows.length)return{ok:false,error:'Intent batch is empty.'};
    return dispatch('batch','batch',rows);
  }
  function handleResult(msg){
    const id=String(msg?.clientActionId||'');
    if(!active||id!==String(active.id||''))return{matched:false,active:active?{...active}:null};
    const done=finish(msg?.ok===false?'rejected':'accepted',msg?.ok===false?String(msg?.message||'Authoritative PvP request failed.'):'');
    return{matched:true,ok:msg?.ok!==false,action:done};
  }
  function reset(error=''){return finish('reset',error)}
  function getState(){return{inFlight:!!active,active:active?{...active}:null}}
  return{sendIntent,sendBatch,handleResult,reset,getState};
}

if(typeof window!=='undefined')window.GL_CREATE_PVP_INTENT_CHANNEL=create;
if(typeof globalThis!=='undefined')globalThis.GL_CREATE_PVP_INTENT_CHANNEL=globalThis.GL_CREATE_PVP_INTENT_CHANNEL||create;
})();
