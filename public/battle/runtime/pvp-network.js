(()=>{
'use strict';
/*
 * STRICT HANDOFF BOUNDARY:
 * Season 1 v3.80.17 owns lobby through READY/START MATCH only.
 * At coin-flip the browser moves to /battle/ and S0 RC32 owns the
 * coin animation, result, opening and gameplay presentation.
 * The server remains authoritative for coin RNG, state and both players.
 */
const bridge=window.GL_LOCAL_AI_BRIDGE,engine=window.GL_GAME_ENGINE,registry=window.GL_AUTHORITY_ADAPTER;
if(!bridge||!engine||!registry)throw Error('Season 0 RC34 game runtime is unavailable.');
const native=Object.create(engine);
const SESSION={client:'grandis_legacy_pvp_v3801_tab_client_id',seat:'grandis_legacy_pvp_v3801_tab_seat_token',role:'grandis_legacy_pvp_v3801_tab_role'};
const state={ws:null,snapshot:null,seat:null,role:'player',status:'connecting',revision:0,inflight:false,inflightActionId:null,queue:[],seq:0,connected:false,rttMs:null,lastPingAt:0,lastActivityPingAt:0,lastResponsePaintMs:null,lastBoardImportMs:null,pendingTimeout:null,reconnectTimer:null,disconnects:0,clientId:'',name:'',lastCoinChoiceKey:''};
const meta=window.GL_PVP_BUILD_META||{};
const BUILD_ID=String(meta.buildId||'');

const BATTLE_CHANNEL='gl-pvp-battle-transport-v1';
const EMBEDDED=(()=>{try{return window.parent!==window&&new URLSearchParams(location.search).get('embedded')==='1'}catch{return false}})();

// Unique to this document, including after reload. The server stores recently
// acknowledged ids to make retries safe; never reuse an id across page loads.
const ACTION_NONCE=(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const LOCAL_MANA_ACTIONS=new Set(['toggleManaShardPaymentChoice','toggleResponseManaShardChoice','toggleManaPaymentSurgeChoice','selectResponsePaymentChoice']);
const isTuneUpDecision=p=>p?.type==='card_search_choice'&&p.source_card_id==='S0-CLE-029'&&p.decision_side==='PLAYER'&&p.zone==='deck'&&!!p.multi_select;
// Debug sampling stays entirely inside the player's browser; no extra WebSocket packets.
const performanceSamples=[];
const clock=()=>globalThis.performance?.now?.()||Date.now();
const perfEnabled=(()=>{try{return new URLSearchParams(location.search).has('pvpPerf')}catch{return false}})();
let startupLatencyRecorded=false;
function debugPerfText(message){
  if(!perfEnabled||!document.body)return;
  let panel=document.getElementById('glPvpNetStatus');
  if(!panel){
    panel=document.createElement('aside');panel.id='glPvpNetStatus';
    panel.style.cssText='position:fixed;top:9px;right:8px;z-index:2147483549;pointer-events:none;max-width:290px;padding:5px 8px;border:1px solid #47abb8;border-radius:6px;background:rgba(2,14,24,.94);color:#e6faff;font:700 10px/1.4 monospace';
    document.body.appendChild(panel);
  }
  panel.textContent=message;
}
function recordFirstGamePacket(){
  if(startupLatencyRecorded)return;
  startupLatencyRecorded=true;
  let started=0;
  try{started=Number(sessionStorage.getItem('gl_pvp_net_rc6_start_click_at')||0)}catch{}
  if(started>0&&Date.now()-started<120000){
    const elapsed=Date.now()-started;
    if(perfEnabled){console.debug('[GL PvP START to first battle packet]',elapsed+' ms');debugPerfText('START to first battle packet: '+elapsed+'ms')}
    try{sessionStorage.removeItem('gl_pvp_net_rc6_start_click_at')}catch{}
  }
}
let toastTimer=0,slowActionTimer=0;
function actionToast(message,{error=false,duration=3200}={}){
  if(!document.body)return;
  let el=document.getElementById('glPvpActionToast');
  if(!el){
    el=document.createElement('div');el.id='glPvpActionToast';
    el.setAttribute('role','status');el.setAttribute('aria-live','polite');
    el.style.cssText='position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483600;max-width:min(92vw,520px);padding:11px 18px;border-radius:9px;border:1px solid #d0a744;background:rgba(7,18,29,.97);color:#ffdf83;font:700 14px/1.35 system-ui,sans-serif;text-align:center;box-shadow:0 8px 25px #0009;pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent=String(message||'Action unavailable.');el.hidden=false;
  el.style.borderColor=error?'#e77872':'#d0a744';
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true},duration);
}
function reportRejectedAction(r){
  const message=String(r?.error||'Action rejected.');
  pvpIntentError(message);actionToast(message,{error:true,duration:4200});
  return r;
}
function recordActionLatency(id,ack){
  const timing=state.actionTiming;
  if(!timing||timing.id!==id)return;
  const ended=clock();
  const entry={intent:timing.intent,ackMs:Math.round(ended-timing.sentAt),ok:!!ack.ok,serverMs:Number.isFinite(Number(ack.serverActionMs))?Number(ack.serverActionMs):null,phase:timing.phase,at:Date.now()};
  performanceSamples.push(entry);if(performanceSamples.length>50)performanceSamples.shift();
  state.lastActionLatencyMs=entry.ackMs;
  if(perfEnabled){
    console.debug('[GL PvP timing]',entry);
    let panel=document.getElementById('glPvpPerfPanel');
    if(!panel&&document.body){
      panel=document.createElement('aside');panel.id='glPvpPerfPanel';panel.setAttribute('aria-label','PvP network timing');
      panel.style.cssText='position:fixed;top:8px;left:8px;z-index:2147483550;padding:8px 10px;border:1px solid #64b9d4;border-radius:8px;background:rgba(2,15,25,.93);color:#bfefff;font:600 11px/1.5 monospace;pointer-events:none;max-width:300px';
      document.body.appendChild(panel);
    }
    if(panel)panel.textContent=entry.intent+' • ACK '+entry.ackMs+'ms • engine '+(entry.serverMs??'?')+'ms • queue '+state.queue.length;
  }
  state.actionTiming=null;
  clearTimeout(slowActionTimer);
} 
function pvpIntentError(message){
  try{window.dispatchEvent(new CustomEvent('gl-pvp-intent-error',{detail:{message:String(message||'Action rejected.')}}))}catch{}
}
function updateLocalManaDraft(name,args){
  if(state.inflight)return {ok:false,error:'Waiting for the previous server action.'};
  const s=bridge.getSnapshot?.()?.appState,p=s?.pending;
  const draft=window.GL_PVP_MANA_DRAFT;
  if(!draft||!p||p.decision_side!=='PLAYER'||
      !['mana_shard_payment_choice','response_payment_choice'].includes(p.type))
    return {ok:false,error:'No local Mana Payment decision is available.'};
  let ok=false;
  if(name==='toggleManaShardPaymentChoice'&&p.type==='mana_shard_payment_choice')
    ok=draft.toggleShard(s,args?.[0]);
  else if(name==='toggleResponseManaShardChoice'&&p.type==='response_payment_choice')
    ok=draft.toggleShard(s,args?.[0]);
  else if(name==='toggleManaPaymentSurgeChoice'&&p.type==='mana_shard_payment_choice')
    ok=draft.toggleSurge(s);
  else if(name==='selectResponsePaymentChoice'&&p.type==='response_payment_choice')
    ok=draft.toggleDiscard(s,args?.[0]);
  if(!ok)return {ok:false,error:'That Mana or Response cost choice is unavailable.'};
  // Unlike RC4, NO gameplay engine mutation and NO full battlefield render.
  window.GL_GAME_UI?.renderManaDraft?.();
  return {ok:true,local:true};
}
// Tune Up's two Note selections are a local draft. Only the final validated
// choice goes to the authority, saving two full WebSocket RTTs and avoiding
// rebuilding the whole battlefield after each Note tap.
function updateLocalTuneUpDraft(args){
  if(state.inflight||state.queue.length)return {ok:false,error:'Wait for the server action to complete.'};
  const p=bridge.getSnapshot?.()?.appState?.pending;
  if(!isTuneUpDecision(p))return {ok:false,error:'No active Tune Up choice.'};
  const r=bridge.applyServerIntent('selectCardSearchChoice',clone(args));
  if(!r?.ok)return {ok:false,error:String(r?.error||'Tune Up selection rejected.')};
  window.GL_GAME_UI?.render?.();
  return {ok:true,local:true};
}
function toAtomicTuneUpChoice(name,args){
  if(name!=='handleChoiceConfirm')return {name,args};
  const p=bridge.getSnapshot?.()?.appState?.pending;
  if(!isTuneUpDecision(p))return {name,args};
  const selected=p.selected_indices||[];
  const required=Number(p.required_count||2);
  if(!Array.isArray(selected)||selected.length!==required||new Set(selected).size!==required)
    return {error:'Select exactly two different Note Card positions for Tune Up.'};
  return {name:'commitExactTuneUpChoice',args:[selected.map(Number),String(p.commit_token||'')]};
}
function toAtomicPayment(name,args){
  if(name!=='commitManaShardPaymentChoice'&&name!=='commitResponsePaymentChoice')return {name,args};
  const s=bridge.getSnapshot?.()?.appState;
  const p=s?.pending,expected=name==='commitResponsePaymentChoice'?'response_payment_choice':'mana_shard_payment_choice';
  if(!p||p.type!==expected||p.decision_side!=='PLAYER')
    return {error:'Mana Payment is not currently available.'};
  const packet=window.GL_PVP_MANA_DRAFT?.payload(s);
  if(!packet||packet.error)return {error:packet?.error||'Invalid Mana Payment selection.'};
  return packet;
}

// Presentation-only. Show the opponent-owned Response decision without
// leaking private cards or introducing any network action.
function updateOpponentResponseNotice(board){
  const a=board?.appState;
  const responseOwner=a?.responseWindow?.response_owner;
  const opponentDecision=a?.pending?.decision_side==='AI' &&
    a.pending.type==='response_payment_choice';
  const waiting=state.connected&&state.role==='player'&&state.status==='started'&&
    !a?.gameOver&&(responseOwner==='AI'||opponentDecision);
  let notice=document.getElementById('glPvpOpponentResponseNotice');
  if(!notice&&waiting){
    const field=document.querySelector('.battlefield');if(!field?.appendChild)return;
    notice=document.createElement('div');notice.id='glPvpOpponentResponseNotice';
    notice.className='gl-pvp-opponent-response-notice';
    notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
    notice.textContent='WAITING FOR OPPONENT RESPONSE...';
    notice.hidden=true;field.appendChild(notice);
  }
  if(notice)notice.hidden=!waiting;
}

function session(key){try{return sessionStorage.getItem(SESSION[key])||''}catch{return''}}
function showError(message){
  let banner=document.getElementById('pvpS0ConnectionNotice');if(!banner){banner=document.createElement('div');banner.id='pvpS0ConnectionNotice';banner.style.cssText='position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:100000;padding:12px 20px;background:#14263b;color:#ffdc85;border:1px solid #d5aa48;border-radius:8px;font:600 13px sans-serif;max-width:90vw;text-align:center';document.body.appendChild(banner)}
  banner.textContent=message;banner.hidden=false;
}
function clearError(){const e=document.getElementById('pvpS0ConnectionNotice');if(e)e.hidden=true}
function send(type,data={}){if(state.ws?.readyState!==WebSocket.OPEN)return false;state.ws.send(JSON.stringify({type,clientBuildId:BUILD_ID,...data}));return true}
function clearInFlight(){clearTimeout(state.pendingTimeout);clearTimeout(slowActionTimer);state.pendingTimeout=null;state.inflight=false;state.inflightActionId=null;state.actionTiming=null;}
function armTimeout(actionId){
  clearTimeout(state.pendingTimeout);
  state.pendingTimeout=setTimeout(()=>{
    if(state.inflightActionId!==actionId)return; // stale timer must not release another action
    clearInFlight();state.queue.length=0;
    pvpIntentError('Server action timed out. Resyncing.');
    send('resync');showError('Server action timed out. Resyncing.');
  },9000);
}
function tryAction(name,args=[]){
 if(!['started','finished'].includes(state.status)||state.role==='spectator')return {ok:false,error:'Not permitted to act.'};
 if(state.status==='finished'&&name!=='executeConfirmedSurrender')return {ok:false,error:'The match has finished.'};
 if(!state.connected)return {ok:false,error:'Connection unavailable.'};
 if(name!=='executeConfirmedSurrender'&&window.GL_GAME_UI?.openingBusy?.())return {ok:false,error:'Opening animation is still in progress.'};
 if(LOCAL_MANA_ACTIONS.has(name))return updateLocalManaDraft(name,args);
 if(name==='selectCardSearchChoice'&&isTuneUpDecision(state.snapshot?.appState?.pending))
   return updateLocalTuneUpDraft(args);
 if(state.inflight){
   if(name==='executeConfirmedSurrender'){
     // Surrender remains available even when a previous intent is delayed.
     clearInFlight();state.queue.length=0;
   }else return {ok:false,pending:true,busy:true,error:'Waiting for the server to finish the previous action.'};
 }
 return dispatch(name,args);
}
function action(name,args=[]){const r=tryAction(name,args);return r?.ok?r:reportRejectedAction(r)}
function dispatch(name,args=[]){
 const tuneUp=toAtomicTuneUpChoice(name,args);if(tuneUp.error)return {ok:false,error:tuneUp.error};
 name=tuneUp.name;args=tuneUp.args;
 const payment=toAtomicPayment(name,args);if(payment.error)return {ok:false,error:payment.error};
 name=payment.name;args=payment.args;
 // The server may choose a Hero automatically ONLY when exactly one source
 // is legal. Other Play actions keep every player-choice step unchanged.
 if(name==='beginPlayFromHand')name='beginPlayFromHandFast';
 if(name==='beginPlayFromHandFast')state.playFlowStartedAt=clock();
 const s=state.snapshot?.appState;
 if(name!=='executeConfirmedSurrender'){
   const who=s?.pending&&(s.pending.decision_side||s.pending.response_owner||s.pending.side||s.pending.source_side);
   const responseOwner=s?.responseWindow?.response_owner;
   // The viewer-safe server masks response_window pending as UNKNOWN; it does
   // NOT mask the public Response owner. When we own the visible Response,
   // PASS / Defense / Reaction must reach the authoritative server. A genuinely
   // different pending decision is still guarded, and server validation always wins.
   const localResponsePending=responseOwner==='PLAYER'&&s?.pending?.type==='response_window'&&
     (!who||who==='UNKNOWN'||who==='PLAYER');
   if(s?.pending&&!localResponsePending){
     if(who&&who!=='PLAYER')return {ok:false,error:'Opponent decision pending.'};
   }else if(responseOwner&&responseOwner!=='PLAYER')return {ok:false,error:'Opponent Response pending.'};
   else if(!responseOwner&&s?.turn!=='PLAYER')return {ok:false,error:'Opponent turn.'};
 }
 if(name==='selectOpponentManaChoice'){
   const c=s?.pending?.candidates?.[Number(args?.[0])];if(!c?.choice_handle)return {ok:false,error:'Blind Mana choice unavailable.'};
   name='selectOpponentManaChoiceHandle';args=[c.choice_handle,state.revision];
 }
 const id=state.clientId+'.s0.'+ACTION_NONCE+'.'+(++state.seq);
 const sentAt=clock();
 // Use the approved S1-style two-step atomic Response transaction.
 // Selection + confirmation produces ONE server round-trip and ONE revision.
 const isResponsePair=name==='selectAndConfirmResponse';
 const optionIndex=Number(args?.[0]);
 if(isResponsePair&&(!Number.isInteger(optionIndex)||optionIndex<0||
     optionIndex>=(s?.responseWindow?.options||[]).length))return {ok:false,error:'Invalid Response option.'};
 const outbound=isResponsePair?{
   type:'runtime-intent-batch',clientActionId:id,baseRevision:state.revision,
   steps:[{name:'responseSelectNoStuck',args:[optionIndex]},{name:'confirmSelectedResponse',args:[]}]
 }:{type:'runtime-intent',clientActionId:id,baseRevision:state.revision,intent:name,args:clone(args)};
 if(!send(outbound.type,outbound))return {ok:false,error:'WebSocket unavailable.'};
 state.inflight=true;state.inflightActionId=id;
 state.actionTiming={id,intent:name,phase:s?.phase||'',sentAt};
 clearTimeout(slowActionTimer);
 slowActionTimer=setTimeout(()=>{
   if(state.inflightActionId===id)actionToast('Synchronizing '+name.replace(/([A-Z])/g,' $1').toLowerCase()+' with server…',{duration:1600});
 },1300);
 armTimeout(id);return {ok:true,pending:true};
}
// RC5: exactly one outstanding action; no silent queue of old-revision choices.
native.intent=(name,args=[])=>action(name,args);
registry.register('s0-pvp',{mode:'PVP',engine:()=>native,bridge:()=>bridge});
registry.use('s0-pvp');
window.GL_PVP_SHARED_BOARD_ACTIVE=true;
window.GL_PVP_LOCAL_ROLE='player';
function update(snap,{force=false,receivedAt=null}={}){
 const m=snap?.match||{},me=snap?.local||{};
 state.status=m.status||'setup';state.role=me.role||'spectator';state.seat=me.seat||null;
 window.GL_PVP_IDENTITY={playerName:String(me.name||'PLAYER'),opponentName:String((snap.players||[]).find(p=>Number(p.seat)!==Number(me.seat))?.name||'OPPONENT'),playerDeck:String(me.deckName||'Player Deck'),opponentDeck:String((snap.players||[]).find(p=>Number(p.seat)!==Number(me.seat))?.deckName||'Opponent Deck')};
 if(state.status==='setup'){updateOpponentResponseNotice(null);window.GL_PVP_MANA_DRAFT?.clear?.();if(!EMBEDDED)location.replace('/');return}
 const coin=window.GL_S0_RC32_PVP_COIN;
 if(m.status==='coin-flip'){updateOpponentResponseNotice(null);window.GL_PVP_MANA_DRAFT?.clear?.();
   const key=String(m.chooserSeat)+'|'+String(me.seat||'spectator');
   if(key!==state.lastCoinChoiceKey){state.lastCoinChoiceKey=key;coin?.showChoice?.({canChoose:state.role==='player'&&Number(me.seat)===Number(m.chooserSeat)});}
   return;
 }
 if(m.status==='coin-result'){updateOpponentResponseNotice(null);window.GL_PVP_MANA_DRAFT?.clear?.();
   const firstSeat=Number(m.firstSeat||1);
   coin?.showResult?.({choice:m.choice,outcome:m.outcome,firstSeat,localSeat:Number(me.seat||0),
     localWasChooser:Number(m.chooserSeat)===Number(me.seat),
     winnerName:(snap.players||[]).find(p=>Number(p.seat)===firstSeat)?.name||'Player '+firstSeat,
     canStart:state.role==='player'&&!!m.canStartOpening});
   return;
 }
 coin?.release?.();
 document.querySelector('.app')?.classList.remove('gl-lobby-hidden');
 const board=m.board;
 if(board){
   const recipient=state.role==='player'?Number(state.seat):1;
   if(!board.pvpPrivateStateMasked||Number(board.pvpRecipientSeat)!==recipient){showError('Refusing unsafe battle snapshot.');return}
   if(Number(m.revision)<state.revision)return;
   if(!force&&Number(m.revision)===state.revision&&state.snapshot){updateOpponentResponseNotice(board);return;}
   const previousResponse=state.snapshot?.appState?.responseWindow;
   const incomingResponse=board.appState?.responseWindow;
   const responseJustOpened=incomingResponse?.response_owner==='PLAYER'&&
      (!previousResponse||previousResponse.response_owner!=='PLAYER'||
       String(previousResponse.response_window_token||'')!==String(incomingResponse.response_window_token||''));
   state.revision=Number(m.revision||0);state.snapshot=board;
   updateOpponentResponseNotice(board);
   window.GL_PVP_LOCAL_SEAT=state.seat;
   window.GL_PVP_LOCAL_ROLE=state.role;
   try{
     const renderStarted=clock();
     bridge.importSnapshot(board,{skipImportAnimations:true});
     state.lastBoardImportMs=Math.round((clock()-renderStarted)*10)/10;
     // Reconcile the browser-only selection with each authoritative revision.
     window.GL_PVP_MANA_DRAFT?.sync(board.appState,state.revision,engine.getManaPlan?.()?.surge||null);
     // Show the payment prompt BEFORE the heavier scheduled board render.
     // Source/target selections remain server-authoritative.
     if(board.appState?.pending?.decision_side==='PLAYER'&&
         ['mana_shard_payment_choice','response_payment_choice'].includes(board.appState.pending.type)){
       window.GL_GAME_UI?.renderManaDraft?.();
     }
     window.GL_GAME_UI?.render?.();clearError();
     if(responseJustOpened&&typeof globalThis.requestAnimationFrame==='function'){
       const revision=state.revision,packetAt=Number(receivedAt??renderStarted);
       requestAnimationFrame(()=>requestAnimationFrame(()=>{
         if(state.revision!==revision)return;
         const paintMs=Math.round((clock()-packetAt)*10)/10;
         state.lastResponsePaintMs=paintMs;
         const row={type:'response-visible',revision,paintMs,importMs:state.lastBoardImportMs,at:Date.now()};
         performanceSamples.push(row);if(performanceSamples.length>50)performanceSamples.shift();
         if(perfEnabled){
           console.debug('[GL PvP Response paint]',row);
           debugPerfText('RTT '+(state.rttMs??'?')+'ms | Response paint '+paintMs+'ms | import '+state.lastBoardImportMs+'ms');
         }
       }));
     }
     if(state.playFlowStartedAt&&board.appState?.pending?.decision_side==='PLAYER'&&
        ['mana_shard_payment_choice','response_payment_choice'].includes(board.appState?.pending?.type)){
       const start=state.playFlowStartedAt;state.playFlowStartedAt=null;
       const raf=globalThis.requestAnimationFrame;
       if(typeof raf==='function')raf(()=>raf(()=>{
         const visible=!!document.querySelector?.('.gl-center-choice-stage.open.gl-center-mode-pay');
         const ms=Math.round(clock()-start);
         state.lastManaOpenPaintMs=visible?ms:null;
         if(perfEnabled)console.debug('[GL PvP PLAY-to-Mana paint]',{visible,ms});
       }));
     }
     const renderMs=Math.round((clock()-renderStarted)*10)/10;
     state.lastRenderMs=renderMs;
     if(perfEnabled){
       console.debug('[GL PvP render]',{revision:state.revision,renderMs,pending:board.appState?.pending?.type||'none'});
       const panel=document.getElementById('glPvpPerfPanel');
       if(panel)panel.textContent+=' • render '+renderMs+'ms';
     }
     if(!state.pvpOpeningShown&&state.role==='player'&&state.status==='started'&&Number(m.revision)===2){
       state.pvpOpeningShown=true;
       window.GL_GAME_UI?.playPvPOpening?.();
     }
   }
   catch(e){showError('Battlefield synchronization failed: '+String(e.message||e))}
 }
 if(!board)updateOpponentResponseNotice(null);
 if(state.role==='spectator'){
   showError('Spectator mode — both players’ private cards are hidden; actions are disabled.');
 }
 if(m.status==='finished')window.GL_PVP_POSTMATCH_EXPIRES_AT=Date.parse(m.postMatchCleanupAt||'')||0;
}
function onServerMessage(ev){
const receivedAt=clock();let msg;try{msg=JSON.parse(ev.data)}catch{return}
   if(msg.type==='snapshot'){recordFirstGamePacket();update(msg,{force:!!msg.forceImport,receivedAt})}
   else if(msg.type==='intent-result'){
     // Delayed/duplicated ACKs never own the currently pending request.
     if(!state.inflightActionId||String(msg.clientActionId)!==state.inflightActionId){
       if(Number(msg.snapshot?.match?.revision||0)>state.revision)send('resync');
       return;
     }
     recordActionLatency(state.inflightActionId,msg);
     clearInFlight();
     if(msg.snapshot)update(msg.snapshot,{force:!msg.ok});
     if(!msg.ok){state.queue.length=0;pvpIntentError(msg.message);showError(msg.message||'Action rejected.');window.GL_PVP_MANA_DRAFT?.clear?.()}
   }else if(msg.type==='pong'){
     const sent=Number(msg.clientTime||0),now=Date.now();
     if(sent>0&&sent<=now&&now-sent<60000){const value=now-sent;state.rttMs=state.rttMs==null?value:Math.round(state.rttMs*.65+value*.35)}
   }else if(msg.type==='error'){
     // Non-intent errors have no action ID. Never release an unrelated intent.
     if(msg.snapshot)update(msg.snapshot,{force:true});
     pvpIntentError(msg.message);showError(msg.message||'Server rejected action.');
   }else if(msg.type==='idle-timeout'||msg.type==='pregame-recovered')showError(msg.message||'Timed out.');
 }

function connectEmbedded(){
  // One REAL WebSocket lives in the lobby parent. The battlefield receives
  // the same authoritative packets via same-origin postMessage, no reconnect.
  const proxy={readyState:0,send(raw){
    let message;try{message=JSON.parse(raw)}catch{return}
    window.parent.postMessage({channel:BATTLE_CHANNEL,kind:'send',message},location.origin);
  }};
  state.ws=proxy;
  state.clientId=session('client');state.role=session('role')||'player';
  state.name=localStorage.getItem('grandis_legacy_pvp_s0_v380_name')||localStorage.getItem('grandis_legacy_pvp_v380_name')||'Player';
  const onParent=event=>{
    if(event.source!==window.parent||event.origin!==location.origin||event.data?.channel!==BATTLE_CHANNEL||event.data.kind!=='server')return;
    const message=event.data.message;if(!message||typeof message!=='object')return;
    if(message.type==='bridge-transport'){
      state.connected=!!message.connected;
      proxy.readyState=state.connected?WebSocket.OPEN:0;
      if(!state.connected){updateOpponentResponseNotice(null);clearInFlight();state.queue.length=0;showError('Connection interrupted. Reconnecting through lobby...')}
      return;
    }
    if(message.type==='snapshot')state.connected=true;
    onServerMessage({data:JSON.stringify(message)});
  };
  window.addEventListener('message',onParent);
  window.parent.postMessage({channel:BATTLE_CHANNEL,kind:'ready'},location.origin);
}
function connect(){
 if(EMBEDDED){connectEmbedded();return}

 const clientId=session('client'),seatToken=session('seat');state.clientId=clientId;
 if(!clientId){location.replace('/');return}
 const role=session('role')||'player';state.role=role;
 state.name=localStorage.getItem('grandis_legacy_pvp_s0_v380_name')||localStorage.getItem('grandis_legacy_pvp_v380_name')||'Player';
 const qs=new URLSearchParams({client:clientId,name:state.name,role,buildId:BUILD_ID});if(seatToken)qs.set('seatToken',seatToken);
 const ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws?'+qs);
 state.ws=ws;
 // Server immediately supplies one forceImport snapshot on every handshake.
 // Do not ask for a redundant second full state on a healthy connection.
 ws.onopen=()=>{if(ws!==state.ws)return;state.connected=true;state.disconnects=0};
 ws.onmessage=ev=>{if(ws!==state.ws)return;onServerMessage(ev)};
 ws.onclose=ev=>{if(ws!==state.ws)return;pvpIntentError('Connection lost.');state.connected=false;updateOpponentResponseNotice(null);clearInFlight();state.queue.length=0;
   if(ev.code===4003){showError('Server/client version mismatch. Refresh the app.');return}
   if(ev.code===4004||ev.code===4006){showError('Your seat session was replaced. Return to lobby to reconnect.');return}
   showError('Connection lost. Reconnecting…');const delay=Math.min(10000,800*Math.pow(1.5,Math.min(5,++state.disconnects)));
   clearTimeout(state.reconnectTimer);state.reconnectTimer=setTimeout(connect,delay);
 };
 ws.onerror=()=>{};
}
// A visible player watching the opponent remains present without sending
// gameplay intents. Do not keep a hidden/abandoned tab alive indefinitely.
let lastInputActivity=0;
function reportActivity(){
  const n=Date.now();if(n-lastInputActivity<12000)return;lastInputActivity=n;
  if(state.connected)send('activity');
}
for(const type of ['pointerdown','keydown','touchstart'])document.addEventListener(type,reportActivity,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reportActivity()});
if(!EMBEDDED)setInterval(()=>{if(state.connected){
  // Low-frequency lightweight RTT sample, as in S1. Keep input/activity
  // tracking separate so a transport pong never counts as gameplay activity.
  const current=Date.now();
  state.lastPingAt=current;
  send('ping',{clientTime:current,reportedRtt:state.rttMs});
  if(document.visibilityState!=='hidden'&&current-state.lastActivityPingAt>=24000){
    state.lastActivityPingAt=current;send('activity');
  }
}},8000);
window.GL_S0_PVP_NETWORK={state,connect,sendIntent:action,performanceSamples,manaDraft:window.GL_PVP_MANA_DRAFT};

window.GL_PVP_HOST={getSnapshot:()=>state.snapshot,sendIntent:action,identity:()=>({seat:state.seat,role:state.role,localConnected:state.connected}),returnToLobby:()=>send('return-to-lobby'),abortPregame:()=>send('return-to-lobby'),chooseCoin:choice=>send('choose-coin-flip',{choice}),coinPresented:()=>send('coin-presented'),confirmCoin:()=>send('confirm-coin-flip')};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect);else connect();
})();
