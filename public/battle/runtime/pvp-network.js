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
if(!bridge||!engine||!registry)throw Error('Season 0 RC32 game runtime is unavailable.');
const native=Object.create(engine);
const SESSION={client:'grandis_legacy_pvp_v3801_tab_client_id',seat:'grandis_legacy_pvp_v3801_tab_seat_token',role:'grandis_legacy_pvp_v3801_tab_role'};
const state={ws:null,snapshot:null,seat:null,role:'player',status:'connecting',revision:0,inflight:false,queue:[],seq:0,connected:false,pendingTimeout:null,reconnectTimer:null,disconnects:0,clientId:'',name:'',lastCoinChoiceKey:''};
const meta=window.GL_PVP_BUILD_META||{};
const BUILD_ID=String(meta.buildId||'');
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function session(key){try{return sessionStorage.getItem(SESSION[key])||''}catch{return''}}
function showError(message){
  let banner=document.getElementById('pvpS0ConnectionNotice');if(!banner){banner=document.createElement('div');banner.id='pvpS0ConnectionNotice';banner.style.cssText='position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:100000;padding:12px 20px;background:#14263b;color:#ffdc85;border:1px solid #d5aa48;border-radius:8px;font:600 13px sans-serif;max-width:90vw;text-align:center';document.body.appendChild(banner)}
  banner.textContent=message;banner.hidden=false;
}
function clearError(){const e=document.getElementById('pvpS0ConnectionNotice');if(e)e.hidden=true}
function send(type,data={}){if(state.ws?.readyState!==WebSocket.OPEN)return false;state.ws.send(JSON.stringify({type,clientBuildId:BUILD_ID,...data}));return true}
function armTimeout(){clearTimeout(state.pendingTimeout);state.pendingTimeout=setTimeout(()=>{state.inflight=false;state.queue.length=0;send('resync');showError('Server action timed out. Resyncing.');},9000)}
function action(name,args=[]){
 if(!['started','finished'].includes(state.status)||state.role==='spectator')return {ok:false,error:'Not permitted to act.'};
 if(state.status==='finished'&&name!=='executeConfirmedSurrender')return {ok:false,error:'The match has finished.'};
 if(!state.connected)return {ok:false,error:'Connection unavailable.'};
 if(state.inflight){if(state.queue.length>=4)return {ok:false,error:'Too many pending actions.'};state.queue.push({name,args:clone(args)});return {ok:true,queued:true}}
 return dispatch(name,args);
}
function dispatch(name,args=[]){
 const s=state.snapshot?.appState;
 if(s?.pending){const who=s.pending.decision_side||s.pending.response_owner||s.pending.side||s.pending.source_side;
   if(who&&who!=='PLAYER')return {ok:false,error:'Opponent decision pending.'}}
 else if(s?.responseWindow?.response_owner&&s.responseWindow.response_owner!=='PLAYER')return {ok:false,error:'Opponent Response pending.'};
 else if(!s?.responseWindow&&s?.turn!=='PLAYER'&&name!=='executeConfirmedSurrender')return {ok:false,error:'Opponent turn.'};
 if(name==='selectOpponentManaChoice'){
   const c=s?.pending?.candidates?.[Number(args?.[0])];if(!c?.choice_handle)return {ok:false,error:'Blind Mana choice unavailable.'};
   name='selectOpponentManaChoiceHandle';args=[c.choice_handle,state.revision];
 }
 const id=state.clientId+'.s0.'+(++state.seq);
 if(!send('runtime-intent',{clientActionId:id,baseRevision:state.revision,intent:name,args:clone(args)}))return {ok:false,error:'WebSocket unavailable.'};
 state.inflight=true;armTimeout();return {ok:true,pending:true};
}
function queueNext(){if(state.inflight||!state.queue.length)return;const cmd=state.queue.shift();const r=dispatch(cmd.name,cmd.args);if(!r.ok){state.queue.length=0;showError(r.error||'Action rejected.')}}
native.intent=(name,args=[])=>action(name,args);
registry.register('s0-pvp',{mode:'PVP',engine:()=>native,bridge:()=>bridge});
registry.use('s0-pvp');
window.GL_PVP_SHARED_BOARD_ACTIVE=true;
window.GL_PVP_LOCAL_ROLE='player';
function update(snap){
 const m=snap?.match||{},me=snap?.local||{};
 state.status=m.status||'setup';state.role=me.role||'spectator';state.seat=me.seat||null;
 if(state.status==='setup'){location.replace('/');return}
 const coin=window.GL_S0_RC32_PVP_COIN;
 if(m.status==='coin-flip'){
   const key=String(m.chooserSeat)+'|'+String(me.seat||'spectator');
   if(key!==state.lastCoinChoiceKey){state.lastCoinChoiceKey=key;coin?.showChoice?.({canChoose:state.role==='player'&&Number(me.seat)===Number(m.chooserSeat)});}
   return;
 }
 if(m.status==='coin-result'){
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
   state.revision=Number(m.revision||0);state.snapshot=board;
   window.GL_PVP_LOCAL_SEAT=state.seat;
   window.GL_PVP_LOCAL_ROLE=state.role;
   try{bridge.importSnapshot(board,{skipImportAnimations:true});window.GL_GAME_UI?.render?.();clearError()}
   catch(e){showError('Battlefield synchronization failed: '+String(e.message||e))}
 }
 if(state.role==='spectator'){
   showError('Spectator mode — both players’ private cards are hidden; actions are disabled.');
 }
 if(m.status==='finished'){showFinishButton();}
}
function showFinishButton(){
 if(document.getElementById('s0ReturnToLobby'))return;
 const b=document.createElement('button');b.id='s0ReturnToLobby';b.type='button';b.textContent='RETURN TO LOBBY';
 b.style.cssText='position:fixed;top:50px;right:16px;z-index:100000;background:#f0cf64;color:#152338;padding:10px;border:1px solid #e3b83a;border-radius:6px;font-weight:bold;cursor:pointer';
 b.onclick=()=>{if(!send('return-to-lobby'))showError('Cannot return to lobby without a server connection.')};document.body.appendChild(b);
}
function connect(){
 const clientId=session('client'),seatToken=session('seat');state.clientId=clientId;
 if(!clientId){location.replace('/');return}
 const role=session('role')||'player';state.role=role;
 state.name=localStorage.getItem('grandis_legacy_pvp_v380_name')||'Player';
 const qs=new URLSearchParams({client:clientId,name:state.name,role,buildId:BUILD_ID});if(seatToken)qs.set('seatToken',seatToken);
 const ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws?'+qs);
 state.ws=ws;
 ws.onopen=()=>{if(ws!==state.ws)return;state.connected=true;state.disconnects=0;send('resync')};
 ws.onmessage=ev=>{if(ws!==state.ws)return;let msg;try{msg=JSON.parse(ev.data)}catch{return}
   if(msg.type==='snapshot')update(msg);
   else if(msg.type==='intent-result'){
     clearTimeout(state.pendingTimeout);state.inflight=false;
     if(msg.snapshot)update(msg.snapshot);
     if(!msg.ok){state.queue.length=0;showError(msg.message||'Action rejected.')}else queueNext();
   }else if(msg.type==='error'){
     clearTimeout(state.pendingTimeout);state.inflight=false;state.queue.length=0;
     if(msg.snapshot)update(msg.snapshot);showError(msg.message||'Server rejected action.');
   }else if(msg.type==='idle-timeout')showError(msg.message||'Timed out.');
 };
 ws.onclose=ev=>{if(ws!==state.ws)return;state.connected=false;state.inflight=false;clearTimeout(state.pendingTimeout);state.queue.length=0;
   if(ev.code===4003){showError('Server/client version mismatch. Refresh the app.');return}
   if(ev.code===4004||ev.code===4006){showError('Your seat session was replaced. Return to lobby to reconnect.');return}
   showError('Connection lost. Reconnecting…');const delay=Math.min(10000,800*Math.pow(1.5,Math.min(5,++state.disconnects)));
   clearTimeout(state.reconnectTimer);state.reconnectTimer=setTimeout(connect,delay);
 };
 ws.onerror=()=>{};
}
window.GL_S0_PVP_NETWORK={state,connect,sendIntent:action};
window.GL_PVP_HOST={getSnapshot:()=>state.snapshot,sendIntent:action,identity:()=>({seat:state.seat,role:state.role,localConnected:state.connected}),returnToLobby:()=>send('return-to-lobby'),chooseCoin:choice=>send('choose-coin-flip',{choice}),coinPresented:()=>send('coin-presented'),confirmCoin:()=>send('confirm-coin-flip')};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect);else connect();
})();
