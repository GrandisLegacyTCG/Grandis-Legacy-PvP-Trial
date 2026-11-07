(()=>{
'use strict';
// RC32 engine remains a local card / presentation facade. Never commit game actions locally.
// Server snapshots are masked; no browser can authorize an action by changing local state.
const local=window.GL_GAME_ENGINE;
const bridge=window.GL_LOCAL_AI_BRIDGE;
const registry=window.GL_AUTHORITY_ADAPTER;
if(!local||!bridge||!registry)throw Error('RC32 adapter bootstrap is incomplete.');
const game=Object.create(local);
game.intent=(name,args=[])=>sendIntent(name,args);
const state={socket:null,room:null,seat:null,token:null,revision:0,status:'offline',snapshot:null,deckKey:'',ready:false,inflight:false,queuedIntents:[],seenGame:false};
const STOR='gl-pvp-s0-reconnect';
const starterLabels=['Warrior / Cleric','Mage / Warrior','Cleric / Mage','Archer / Cleric','Thief / Archer'];
const starters=['s0_starter_01_red_white','s0_starter_02_blue_red','s0_starter_03_yellow_blue','s0_starter_04_green_yellow','s0_starter_05_white_green'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getUrl=()=>{const q=new URLSearchParams(location.search);const chosen=q.get('ws');if(chosen&&/^wss?:\/\//.test(chosen))return chosen;return (location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws';};
function info(message,error=false){const el=document.getElementById('s0PvpMessage');if(el){el.textContent=message;el.style.color=error?'#ff9090':'#c8d8eb';}}
function emit(type,payload={}){if(state.socket?.readyState!==WebSocket.OPEN){info('Connection lost. Reconnect before playing.',true);return false;}state.socket.send(JSON.stringify({type,...payload}));return true;}
function sendIntent(name,args){
  if(state.status!=='playing'||state.socket?.readyState!==WebSocket.OPEN)return {ok:false,error:'Waiting for server.'};
  if(state.snapshot?.appState?.gameOver)return {ok:false,error:'Match has ended.'};
  // RC32 UI has genuine composite gestures, e.g. select a Defense and then
  // confirm it inside one click handler. S1 handles these through a server
  // intent queue; without one, the second gesture is silently lost.
  // Never execute a queued command against the previous revision.
  if(state.inflight){
    if(state.queuedIntents.length>=4)return {ok:false,error:'Too many pending actions.'};
    state.queuedIntents.push({name,args});
    return {ok:true,queued:true};
  }
  return dispatchIntent(name,args);
}
function dispatchIntent(name,args){
  const s=state.snapshot?.appState;
  if(s?.pending){const who=s.pending.decision_side||s.pending.response_owner||s.pending.side||s.pending.source_side;if(who&&who!=='PLAYER')return {ok:false,error:'Opponent decision pending.'};}
  else if(s?.responseWindow?.response_owner && s.responseWindow.response_owner!=='PLAYER')return {ok:false,error:'Opponent Response pending.'};
  else if(!s?.responseWindow&&s?.turn!=='PLAYER'&&name!=='executeConfirmedSurrender')return {ok:false,error:'Opponent turn.'};
  if(name==='selectOpponentManaChoice'){
    const selected=s?.pending?.candidates?.[Number(args?.[0])];
    if(!selected?.choice_handle)return {ok:false,error:'Blind Mana choice unavailable.'};
    name='selectOpponentManaChoiceHandle';args=[selected.choice_handle,state.revision];
  }
  state.inflight=true;
  const ok=emit('intent',{intent:name,args,baseRevision:state.revision});
  if(!ok)state.inflight=false;
  return {ok};
}
function flushQueuedIntent(){
  if(state.inflight||!state.queuedIntents.length)return;
  const next=state.queuedIntents.shift();
  const result=dispatchIntent(next.name,next.args);
  if(!result.ok){state.queuedIntents.length=0;info(result.error||'Queued action rejected.',true);}
}

registry.register('s0-pvp',{mode:'PVP',engine:()=>game,bridge:()=>bridge});
registry.use('s0-pvp');
function applyBoard(msg){
  if(!msg.board)return;
  if(!msg.board.pvpPrivateStateMasked||msg.board.pvpRecipientSeat!==state.seat){info('Rejected unsafe server board.',true);return;}
  if(Number(msg.revision)<state.revision)return;
  state.snapshot=msg.board;
  state.revision=Number(msg.revision);
  window.GL_PVP_LOCAL_SEAT=state.seat;
  window.GL_PVP_LOCAL_ROLE='player';
  // Server already converts the board to this seat's perspective. Import as local PLAYER.
  bridge.importSnapshot(msg.board,{skipImportAnimations:true});
  const board=bridge.getSnapshot()?.appState;
  if(board&&msg.board.appState?.pvpHumanVsHuman){window.GL_GAME_UI?.render?.();}
}
function update(snapshot){
  const wasPlaying=state.status==='playing'||state.status==='finished';
  state.status=snapshot.status||'lobby';state.seat=snapshot.seat||null;state.token=snapshot.token||null;state.room=snapshot.room||state.room;
  if(state.room&&state.token)localStorage.setItem(STOR,JSON.stringify({room:state.room,token:state.token,name:document.getElementById('s0PvpName')?.value||'Player'}));
  const hadInflight=state.inflight;
  state.inflight=false;
  if(state.status!=='playing')state.queuedIntents.length=0;
  if(state.status==='playing'||state.status==='finished'){
    applyBoard(snapshot);state.seenGame=true;document.getElementById('s0PvpOverlay').classList.add('playing');
    document.body.classList.add('s0-pvp-live');
    if(!wasPlaying){window.GL_GAME_UI?.render?.();}
  }else{document.getElementById('s0PvpOverlay').classList.remove('playing');document.body.classList.remove('s0-pvp-live');}
  const players=snapshot.players||[];
  const me=players.find(p=>p.seat===state.seat);
  state.ready=!!me?.ready;
  state.deckKey=snapshot.myDeckKey||'';
  drawControls(snapshot);
  if(hadInflight)flushQueuedIntent();
}
function connect(room,token=''){
  if(!/^[a-zA-Z0-9_-]{3,32}$/.test(room)){info('Room code must use 3–32 letters or numbers.',true);return;}
  state.socket?.close();state.room=room;state.inflight=false;state.queuedIntents.length=0;
  info('Connecting to server...');
  const ws=new WebSocket(getUrl());state.socket=ws;
  ws.onopen=()=>{if(state.socket!==ws)return;info('Connected. Joining room...');emit('hello',{room,token,name:document.getElementById('s0PvpName').value||'Player'});};
  ws.onmessage=ev=>{if(state.socket!==ws)return;let msg;try{msg=JSON.parse(ev.data)}catch{return;}
    if(msg.type==='snapshot')update(msg);
    else if(msg.type==='error'){state.inflight=false;state.queuedIntents.length=0;info(msg.message,true);}
  };
  ws.onclose=()=>{if(state.socket!==ws)return;state.inflight=false;state.queuedIntents.length=0;info('Disconnected. Use Reconnect to rejoin.',true);document.getElementById('s0PvpOverlay').classList.remove('playing');};
  ws.onerror=()=>info('WebSocket connection failed. Check Northflank WS URL / proxy settings.',true);
}
function drawControls(s){
  const stage=document.getElementById('s0PvpControls'),players=s.players||[],me=players.find(p=>p.seat===state.seat);
  if(!stage)return;
  const label=x=>x?`${esc(x.name)} ${x.connected?'●':'○'} ${x.ready?'✓ READY':''}`:'Empty seat';
  let content=`<div class="s0-pvp-players"><div>Player 1 — ${label(players[0])}</div><div>Player 2 — ${label(players[1])}</div></div>`;
  if(state.status==='lobby'){
    const selected=state.deckKey==='CUSTOM'?'Custom Season 0 deck (validated)':starters.includes(state.deckKey)?starterLabels[starters.indexOf(state.deckKey)]:'None';
    content+=`<p class="s0-pvp-selected">Selected: ${esc(selected)}</p><label>Season 0 Starter Deck <select id="s0PvpDeck">${state.deckKey==='CUSTOM'?'<option value="CUSTOM" selected disabled>Imported custom deck</option>':''}${starters.map((k,i)=>`<option value="${k}" ${k===state.deckKey?'selected':''}>${esc(starterLabels[i])}</option>`).join('')}</select></label><label>Or import a valid Season 0 Deck Builder JSON<input id="s0PvpImport" type="file" accept=".json,application/json"></label><div class="s0-pvp-row"><button id="s0PvpSelect">SELECT STARTER</button><button id="s0PvpReady" ${!me?.hasDeck?'disabled':''}>${me?.ready?'UNREADY':'READY'}</button></div>`;
    if(state.seat===1)content+='<button id="s0PvpStart" '+(!(players[0]?.ready&&players[1]?.ready&&players[0]?.connected&&players[1]?.connected)?'disabled':'')+'>START MATCH</button>';
  }
  if(state.status==='coin')content+=state.seat===2?'<p>Player 2 chooses Heads or Tails.</p><div class="s0-pvp-row"><button data-coin="HEADS">HEADS</button><button data-coin="TAILS">TAILS</button></div>':'<p>Waiting for Player 2 to choose the coin...</p>';
  if(state.status==='playing'||state.status==='finished'){
    content+=`<p>Round ${Number(s.board?.appState?.round||1)} · ${esc(s.board?.appState?.phase||'')} · revision ${Number(s.revision||0)}</p>`;
    if(s.coin)content+=`<p>Opening coin: ${esc(s.coin.outcome)}, Player ${Number(s.coin.firstSeat)} starts.</p>`;
    content+='<button id="s0PvpResume">BACK TO BATTLEFIELD</button>';
    if(state.status==='finished'&&state.seat===1)content+='<button id="s0PvpReset">RESET ROOM</button>';
  }
  stage.innerHTML=content;
  stage.querySelector('#s0PvpSelect')?.addEventListener('click',()=>{const key=stage.querySelector('#s0PvpDeck').value;if(!starters.includes(key))return info('Choose a starter or import your custom JSON.',true);emit('deck',{deckKey:key})});
  stage.querySelector('#s0PvpImport')?.addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>90000){info('Deck file must be 90 KB or smaller.',true);return;}
    try{const deck=JSON.parse(await file.text());emit('custom-deck',{deck});info('Deck uploaded for server validation.');}
    catch(err){info('Invalid JSON file: '+String(err.message||err),true);}
  });
  stage.querySelector('#s0PvpDeck')?.addEventListener('change',e=>{state.deckKey=e.target.value});
  stage.querySelector('#s0PvpReady')?.addEventListener('click',()=>emit('ready',{ready:!state.ready}));
  stage.querySelector('#s0PvpStart')?.addEventListener('click',()=>emit('start'));
  stage.querySelectorAll('[data-coin]').forEach(b=>b.addEventListener('click',()=>emit('coin',{choice:b.dataset.coin})));
  stage.querySelector('#s0PvpResume')?.addEventListener('click',()=>document.getElementById('s0PvpOverlay').classList.add('playing'));
  stage.querySelector('#s0PvpReset')?.addEventListener('click',()=>emit('reset'));
  const status=document.getElementById('s0PvpStatus');
  if(status)status.textContent=`Room ${state.room||'-'} · Player ${state.seat||'?'} · ${state.status.toUpperCase()}`;
}
function setup(){
  const css=document.createElement('style');css.textContent=`
  #s0PvpOverlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:linear-gradient(140deg,rgba(4,12,24,.97),rgba(19,38,59,.95));padding:18px;overflow:auto}
  #s0PvpOverlay.playing{display:none}
  .s0-pvp-panel{background:#0d1b2a;border:1px solid #d0ab59;border-radius:16px;box-shadow:0 25px 80px #000b;padding:24px;width:min(460px,100%);color:#e6effb}
  .s0-pvp-panel h1{color:#f3cf58;margin:0 0 8px;font-size:24px;letter-spacing:1.5px}
  .s0-pvp-panel p{line-height:1.5;color:#b7cbdf}
  .s0-pvp-panel label{display:block;margin:10px 0;color:#c9d8ea;font-size:14px}
  .s0-pvp-panel input,.s0-pvp-panel select{display:block;width:100%;margin:6px 0 12px;padding:10px;color:white;background:#10273b;border:1px solid #496479;border-radius:7px}
  .s0-pvp-panel button{padding:11px 13px;border:1px solid #bda15c;background:#263b4c;color:#f0dda3;border-radius:7px;cursor:pointer;font-weight:700;margin:4px 0}
  .s0-pvp-panel button:disabled{opacity:.35;cursor:default}
  .s0-pvp-panel button:hover:not(:disabled){background:#3e4f60}
  .s0-pvp-row{display:flex;gap:10px}.s0-pvp-row button{flex:1}
  .s0-pvp-players{background:#071624;padding:10px;border:1px solid #30475b;border-radius:8px;margin:10px 0;line-height:2}
  .s0-pvp-selected{font-weight:700;color:#f3cf58!important;margin-bottom:0}
  #s0PvpStatus{color:#f0d285;font-weight:700;margin:7px 0}#s0PvpMessage{min-height:20px}
  #s0PvpToggle{position:fixed;z-index:99998;top:8px;left:8px;background:#061b2ccc;border:1px solid #c2a45a;color:#f3d789;border-radius:5px;padding:6px 10px;font-size:12px;cursor:pointer}
  `;document.head.appendChild(css);
  const overlay=document.createElement('div');overlay.id='s0PvpOverlay';overlay.innerHTML=`<section class="s0-pvp-panel"><h1>GRANDIS LEGACY · PvP S0</h1><p>RC32 gameplay · Server-authoritative multiplayer</p><label>Player name<input id="s0PvpName" maxlength="45" placeholder="Player"></label><label>Room Code<input id="s0PvpRoom" maxlength="32" placeholder="S0Room01"></label><button id="s0PvpJoin">JOIN ROOM</button> <button id="s0PvpReconnect">RECONNECT</button><p id="s0PvpMessage">Connect to a room to begin.</p><div id="s0PvpStatus"></div><div id="s0PvpControls"></div></section>`;
  document.body.appendChild(overlay);
  const toggle=document.createElement('button');toggle.id='s0PvpToggle';toggle.textContent='PvP Room';toggle.onclick=()=>overlay.classList.toggle('playing');document.body.appendChild(toggle);
  const saved=(()=>{try{return JSON.parse(localStorage.getItem(STOR)||'null')}catch{return null}})();
  overlay.querySelector('#s0PvpName').value=saved?.name||'Player';
  overlay.querySelector('#s0PvpRoom').value=new URLSearchParams(location.search).get('room')||saved?.room||'S0Room01';
  overlay.querySelector('#s0PvpJoin').onclick=()=>{localStorage.removeItem(STOR);connect(overlay.querySelector('#s0PvpRoom').value.trim(),'')};
  overlay.querySelector('#s0PvpReconnect').onclick=()=>{const s=(()=>{try{return JSON.parse(localStorage.getItem(STOR)||'null')}catch{return null}})();if(!s?.token)return info('No saved seat. Use Join Room.',true);connect(s.room,s.token)};
  if(saved?.room&&saved.token)connect(saved.room,saved.token);
  setInterval(()=>{if(state.socket?.readyState===WebSocket.OPEN)emit('ping')},20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
window.GL_S0_PVP_NETWORK={state,connect,sendIntent};
})();
