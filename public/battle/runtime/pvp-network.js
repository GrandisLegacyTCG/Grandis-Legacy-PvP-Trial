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
// Inform the attacker only while the other player owns an active Response
// decision. This is presentation-only and never sends a gameplay intent.
function updateOpponentResponseNotice(board){
  const s=board?.appState;
  const responseOwner=s?.responseWindow?.response_owner;
  const opponentDecision=s?.pending?.decision_side==='AI' &&
    s.pending.type==='response_payment_choice';
  const waiting=state.connected&&state.role==='player'&&state.status==='started'&&
    !s?.gameOver&&(responseOwner==='AI'||opponentDecision);
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


const BATTLE_CHANNEL='gl-pvp-battle-transport-v1';
const EMBEDDED=(()=>{try{return window.parent!==window&&new URLSearchParams(location.search).get('embedded')==='1'}catch{return false}})();

// Unique to this document, including after reload. The server stores recently
// acknowledged ids to make retries safe; never reuse an id across page loads.
const ACTION_NONCE=(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const LOCAL_MANA_ACTIONS=new Set(['toggleManaShardPaymentChoice','toggleResponseManaShardChoice','toggleManaPaymentSurgeChoice','selectResponsePaymentChoice']);
// Blind opponent Shard selection is also a LOCAL draft: no server request per tap.
// Physical Shard IDs never enter the browser; only revision-bound opaque handles do.
// Batch 3: only these non-committing selection actions are handled locally.
// The server replays each validated selection on its own RC38 engine once the
// player presses CONFIRM; no private state is committed in the browser.
const LOCAL_CHOICE_ACTIONS=new Map([
  ['trialSelectRankUpReturn','trial_rankup_return_exp'],
  ['selectScoutingExpChoice','scouting_exp_selection'],
  ['toggleDiscardIndex','hand_limit_discard'],
  ['toggleS0BardDrawIndex','s0_bard_draw_choice'],
  ['activateS0BardDrawChoice','s0_bard_draw_choice'],
  ['cancelS0BardDrawChoice','s0_bard_draw_choice'],
  ['moveCrystalBallOrder','crystal_ball_reorder'],
  ['selectLegacyCardChoice','legacy_card_choice'],
  ['selectLegacyDefeatChoice','legacy_defeat_choice']
]);
let localChoiceDraft=null;
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
  // Transient in-flight waits are network flow control, not player-facing errors.
  if(r?.busy||/waiting for (?:the )?(?:server|previous server|pending server)|wait for (?:the )?(?:server|pending server)/i.test(message))return r;
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
function updateLocalBlindManaDraft(args){
  if(state.inflight||state.queue.length)return {ok:false,error:'Wait for the pending server action.'};
  const canonical=state.snapshot?.appState?.pending;
  const visible=bridge.getSnapshot?.()?.appState?.pending;
  if(canonical?.type!=='opponent_mana_selection'||canonical.decision_side!=='PLAYER'||
      visible?.type!=='opponent_mana_selection'||visible.decision_side!=='PLAYER')
    return {ok:false,error:'Opponent Mana choice is no longer available.'};
  const idx=Number(args?.[0]);
  if(!Number.isInteger(idx)||idx<0||idx>=canonical.candidates?.length||
      !canonical.candidates[idx]?.choice_handle)return {ok:false,error:'Invalid blind Shard choice.'};
  // The engine's toggle only edits selected_indices. It never resolves or
  // examines a physical Shard, which remains exclusively on the server.
  const result=bridge.applyServerIntent('selectOpponentManaChoice',[idx]);
  if(!result?.ok)return {ok:false,error:String(result?.error||'Blind Shard selection failed.')};
  // RC5 parity: the server-owned Shards and battlefield stay mounted.
  window.GL_GAME_UI?.renderBlindManaDraft?.();
  return {ok:true,local:true};
}
function toAtomicBlindManaChoice(name,args){
  if(name!=='commitOpponentManaSelection')return {name,args};
  const canonical=state.snapshot?.appState?.pending;
  const visible=bridge.getSnapshot?.()?.appState?.pending;
  if(canonical?.type!=='opponent_mana_selection'||canonical.decision_side!=='PLAYER'||
      visible?.type!=='opponent_mana_selection'||visible.decision_side!=='PLAYER')
    return {error:'Opponent Mana choice is no longer available.'};
  const selected=(visible.selected_indices||[]).map(Number);
  const need=Math.min(Number(canonical.required_count||1),(canonical.candidates||[]).length);
  if(!Number.isInteger(need)||need<1||selected.length!==need||new Set(selected).size!==need)
    return {error:'Choose exactly '+need+' face-down Mana Shard(s).'};
  const handles=selected.map(i=>canonical.candidates?.[i]?.choice_handle);
  if(handles.some(x=>typeof x!=='string'||!/^[a-f0-9]{32}$/.test(x)))
    return {error:'Blind Mana selection expired. Please choose again.'};
  return {name:'commitExactOpponentManaSelection',args:[{revision:state.revision,handles}]};
}
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
// Local choice changes are UI-only; never modify HP/Mana/Status or advance
// the authoritative revision before server ACK. Immutable parent snapshots
// retain the original selection and serve as the rollback source.
function updateLocalChoiceDraft(name,args){
  if(state.inflight||state.queue.length)return {ok:false,error:'Waiting for the previous server action.'};
  const type=LOCAL_CHOICE_ACTIONS.get(name);
  const canonical=state.snapshot?.appState?.pending;
  const local=bridge.getSnapshot?.()?.appState?.pending;
  if(!type||!canonical||canonical.type!==type||canonical.decision_side!=='PLAYER'||
      !local||local.type!==type||local.decision_side!=='PLAYER'||
      (localChoiceDraft&&(localChoiceDraft.revision!==state.revision||localChoiceDraft.type!==type))){
    return {ok:false,error:'Local choice is unavailable or no longer current.'};
  }
  let permutation=localChoiceDraft?.permutation;
  let swap=null;
  if(type==='crystal_ball_reorder'){
    const parts=String(args?.[0]??'').match(/^(\d+):(up|down)$/);
    const from=parts?Number(parts[1]):-1;
    const to=parts?from+(parts[2]==='up'?-1:1):-1;
    const n=(canonical.selected_order||[]).length;
    if(!parts||!Number.isInteger(from)||from<0||to<0||from>=n||to>=n||n>5)
      return {ok:false,error:'Invalid Crystal Ball position.'};
    permutation=permutation||Array.from({length:n},(_,i)=>i);
    swap=[from,to];
  }
  const result=bridge.applyServerIntent(name,clone(args));
  if(!result?.ok)return {ok:false,error:String(result?.error||'Local choice rejected.')};
  if(!localChoiceDraft)localChoiceDraft={type,revision:state.revision,permutation:permutation||null};
  if(swap){[permutation[swap[0]],permutation[swap[1]]]=[permutation[swap[1]],permutation[swap[0]]];
    localChoiceDraft.permutation=permutation;}
  // Legacy candidate highlighting changes ONLY the center chooser. Redrawing
  // Hero cards, pools and Hand on each local click caused unnecessary blink.
  if(type==='legacy_defeat_choice'&&window.GL_GAME_UI?.renderLocalChoiceDraft)
    window.GL_GAME_UI.renderLocalChoiceDraft();
  else window.GL_GAME_UI?.render?.();
  return {ok:true,local:true};
}
function toAtomicLocalChoice(name,args){
  const d=localChoiceDraft;
  if(!d)return {name,args};
  const p=bridge.getSnapshot?.()?.appState?.pending;
  if(d.revision!==state.revision||p?.type!==d.type||p?.decision_side!=='PLAYER')
    return {error:'Selection changed. Please choose again.'};
  const isConfirm=d.type==='s0_bard_draw_choice'?
    (name==='commitS0BardDrawChoice'&&args?.[0]===false):name==='handleChoiceConfirm';
  if(!isConfirm)return {name,args};
  const payload={kind:d.type};
  if(d.type==='scouting_exp_selection')payload.index=p.selected_exp_choice;
  else if(d.type==='legacy_defeat_choice'){payload.index=p.selected_index;payload.choiceId=String(p.choice_id||'');}
  else if(d.type==='crystal_ball_reorder')payload.permutation=[...(d.permutation||[])];
  else payload.selected=[...(d.type==='hand_limit_discard'?p.selected:p.selected_indices||[])];
  return {name:'commitExactLocalChoiceDraft',args:[payload]};
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
    clearInFlight();state.queue.length=0;localChoiceDraft=null;
    pvpIntentError('Server action timed out.');
    send('resync');showError('Server did not respond. Trying to reconnect…');
  },9000);
}
function tryAction(name,args=[]){
 if(!['started','finished'].includes(state.status)||state.role==='spectator')return {ok:false,error:'Not permitted to act.'};
 if(state.status==='finished'&&name!=='executeConfirmedSurrender')return {ok:false,error:'The match has finished.'};
 if(!state.connected)return {ok:false,error:'Connection unavailable.'};
 if(name!=='executeConfirmedSurrender'&&window.GL_GAME_UI?.openingBusy?.())return {ok:false,error:'Opening animation is still in progress.'};
 if(LOCAL_MANA_ACTIONS.has(name))return updateLocalManaDraft(name,args);
 if(name==='selectOpponentManaChoice')return updateLocalBlindManaDraft(args);
 if(name==='selectCardSearchChoice'&&isTuneUpDecision(state.snapshot?.appState?.pending))
   return updateLocalTuneUpDraft(args);
 if(LOCAL_CHOICE_ACTIONS.has(name))return updateLocalChoiceDraft(name,args);
 if(localChoiceDraft && name!=='executeConfirmedSurrender' &&
    name!=='cancelAndSkipBardDrawChoice' &&
    !(name==='handleChoiceConfirm'||(name==='commitS0BardDrawChoice'&&args?.[0]===false)))
   return {ok:false,error:'Finish the current local choice before taking another action.'};
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
 const blind=toAtomicBlindManaChoice(name,args);if(blind.error)return {ok:false,error:blind.error};
 name=blind.name;args=blind.args;
 const draft=toAtomicLocalChoice(name,args);if(draft.error)return {ok:false,error:draft.error};
 name=draft.name;args=draft.args;
 const tuneUp=toAtomicTuneUpChoice(name,args);if(tuneUp.error)return {ok:false,error:tuneUp.error};
 name=tuneUp.name;args=tuneUp.args;
 const payment=toAtomicPayment(name,args);if(payment.error)return {ok:false,error:payment.error};
 name=payment.name;args=payment.args;
 // RC39 user choice: a legal source Hero must ALWAYS be selected explicitly,
 // including when only one Hero can use the Skill. Never request auto-source.
 if(name==='beginPlayFromHand')state.playFlowStartedAt=clock();
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
 // Slow actions remain silent. The choice button is locked until ACK/rejection.
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
 if(state.status==='setup'){localChoiceDraft=null;updateOpponentResponseNotice(null);window.GL_PVP_MANA_DRAFT?.clear?.();if(!EMBEDDED)location.replace('/');return}
 const coin=window.GL_S0_RC32_PVP_COIN;
 if(m.status==='coin-flip'){localChoiceDraft=null;updateOpponentResponseNotice(null);window.GL_PVP_MANA_DRAFT?.clear?.();
   const key=String(m.chooserSeat)+'|'+String(me.seat||'spectator');
   if(key!==state.lastCoinChoiceKey){state.lastCoinChoiceKey=key;coin?.showChoice?.({canChoose:state.role==='player'&&Number(me.seat)===Number(m.chooserSeat)});}
   return;
 }
 if(m.status==='coin-result'){localChoiceDraft=null;updateOpponentResponseNotice(null);window.GL_PVP_MANA_DRAFT?.clear?.();
   const winnerSeat=Number(m.winnerSeat||0),firstSeat=Number(m.firstSeat||0);
   coin?.showResult?.({choice:m.choice,outcome:m.outcome,winnerSeat,firstSeat,turnOrder:m.turnOrder||null,localSeat:Number(me.seat||0),
     localWasChooser:Number(m.chooserSeat)===Number(me.seat),
     winnerName:(snap.players||[]).find(p=>Number(p.seat)===winnerSeat)?.name||'Player '+winnerSeat,
     canChoose:state.role==='player'&&winnerSeat===Number(me.seat)&&!m.turnOrder,
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
   localChoiceDraft=null; // server ACK/revision/forced resync wins over local draft
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
   catch(e){showError('Battlefield update failed: '+String(e.message||e))}
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
      if(!state.connected){localChoiceDraft=null;updateOpponentResponseNotice(null);clearInFlight();state.queue.length=0;showError('Connection interrupted. Reconnecting through lobby...')}
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
 ws.onclose=ev=>{if(ws!==state.ws)return;pvpIntentError('Connection lost.');state.connected=false;localChoiceDraft=null;updateOpponentResponseNotice(null);clearInFlight();state.queue.length=0;
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
window.GL_S0_PVP_NETWORK={state,connect,sendIntent:action,performanceSamples,manaDraft:window.GL_PVP_MANA_DRAFT,localChoiceDraft:()=>localChoiceDraft};

window.GL_PVP_HOST={getSnapshot:()=>state.snapshot,sendIntent:action,identity:()=>({seat:state.seat,role:state.role,localConnected:state.connected}),returnToLobby:()=>send('return-to-lobby'),abortPregame:()=>send('return-to-lobby'),chooseCoin:choice=>send('choose-coin-flip',{choice}),chooseTurnOrder:order=>send('choose-turn-order',{order}),coinPresented:()=>send('coin-presented'),confirmCoin:()=>send('confirm-coin-flip')};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect);else connect();
})();
