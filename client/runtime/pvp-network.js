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
    applyBoard(snapshot);state.seenGame=true;hideLobby();
    document.body.classList.add('s0-pvp-live');
    if(!wasPlaying){window.GL_GAME_UI?.render?.();}
  }else{showLobby();document.body.classList.remove('s0-pvp-live');}
  const players=snapshot.players||[];
  const me=players.find(p=>p.seat===state.seat);
  state.ready=!!me?.ready;
  state.deckKey=snapshot.myDeckKey||'';
  drawControls(snapshot);
  autoLoadDeckIfNeeded(players);
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
  ws.onclose=()=>{if(state.socket!==ws)return;state.inflight=false;state.queuedIntents.length=0;info('Disconnected. Use Reconnect to rejoin.',true);showLobby();};
  ws.onerror=()=>info('WebSocket connection failed. Check Northflank WS URL / proxy settings.',true);
}
// Lobby markup, layout, controls and progression design ported from the actual Season 1 PvP v3.80.17 public/pvp/pvp-host.js and public/lobby/pvp-lobby-v3.76.6.css.
// Only the Season 0 network protocol/deck sources and necessary room-code controls differ. RC32 game engine remains intact.
let draftKey=starters[0];
let draftFormation=null;
let customPreview=null;
let importedDeckName='';
let previewRank=1;
function starterDeck(key){return window.GL_ACTIVE_STARTER_DECKS?.[key]?.deck||null;}
function previewDeck(){return draftKey==='CUSTOM'?customPreview:starterDeck(draftKey);}
function defaultFormation(deck){const d=deck?.default_formation||{};return {LEFT:String(d.LEFT||''),CENTER:String(d.CENTER||''),RIGHT:String(d.RIGHT||'')};}
function formation(){return draftFormation||defaultFormation(previewDeck());}
const ranks=['I','II','III'];
function lineageFor(deck,baseId){
  const entries=deck?.legacy_deck_expanded||[];
  const first=entries.find(c=>c.card_id===baseId&&String(c.card_type).toLowerCase()==='hero');
  if(!first){
    const pkg=(deck?.legacy_packages||deck?.deck?.legacy_packages||[]).find(p=>Array.isArray(p.hero_rank_ids)&&p.hero_rank_ids[0]===baseId);
    return pkg?.hero_rank_ids?.length?pkg.hero_rank_ids:[baseId];
  }
  const ids=entries.filter(c=>c.package_id===first.package_id&&String(c.card_type).toLowerCase()==='hero').map(c=>c.card_id);
  return ids.length?ids:[baseId];
}
const art=id=>'card-art/'+encodeURIComponent(String(id||''))+'.webp';
function currentDeckLabel(){return draftKey==='CUSTOM'?(importedDeckName||'Imported Season 0 Deck'):(starterLabels[starters.indexOf(draftKey)]||'Starter Deck');}
function deckStats(deck){
 const rows=Array.isArray(deck?.main_deck)?deck.main_deck:[];
 const sum=xs=>xs.reduce((n,c)=>n+Number(c?.quantity||0),0);
 const main=sum(rows);
 const items=sum(rows.filter(c=>String(c?.card_id||'').startsWith('S0-ITM-')));
 const events=sum(rows.filter(c=>String(c?.card_id||'').startsWith('S0-EVT-')));
 const legacy=Array.isArray(deck?.legacy_deck_expanded)?deck.legacy_deck_expanded:[];
 const heroes=legacy.filter(c=>String(c?.card_type||'').toLowerCase()==='hero').length;
 const legacies=legacy.filter(c=>String(c?.card_type||'').toLowerCase()==='legacy').length;
 return {heroes,legacies,legacyTotal:legacy.length,skills:main-items-events,items,events,main};
}
function submitDraftDeck(){
 if(state.status!=='lobby'||!state.seat||state.socket?.readyState!==WebSocket.OPEN)return false;
 const d=previewDeck();if(!d)return false;
 const f=formation();
 if(draftKey==='CUSTOM'||JSON.stringify(f)!==JSON.stringify(defaultFormation(d))){
   const copy=JSON.parse(JSON.stringify(d));copy.default_formation={...f};
   return emit('custom-deck',{deck:copy});
 }
 return emit('deck',{deckKey:draftKey});
}
let automaticDeckUploadKey='';
function autoLoadDeckIfNeeded(players){
 if(state.status!=='lobby'||!state.seat)return;
 const me=players.find(p=>p.seat===state.seat);
 if(me?.hasDeck)return;
 const signature=state.room+'|'+state.seat+'|'+draftKey+'|'+JSON.stringify(formation());
 if(signature===automaticDeckUploadKey)return;
 automaticDeckUploadKey=signature;
 submitDraftDeck();
}

function drawPreview(){
 const deck=previewDeck();
 const title=document.getElementById('s0PvpDeckTitle');if(!title)return;
 title.textContent=draftKey==='CUSTOM'?(importedDeckName||deck?.deck_name||'Imported Deck'):('Starter Deck '+(starters.indexOf(draftKey)+1));
 document.getElementById('s0PvpDeckClassLine').textContent=draftKey==='CUSTOM'?'CUSTOM DECK':currentDeckLabel().replace(/\s*\/\s*/g,', ').toUpperCase();
 const stats=deckStats(deck);
 document.getElementById('s0PvpDeckStats').innerHTML=`
 <div><dt>Heroes</dt><dd>${stats.heroes}</dd></div>
 <div><dt>Legacies</dt><dd>${stats.legacies}</dd></div>
 <div class="total legacy-total"><dt>Legacy Deck</dt><dd>${stats.legacyTotal}</dd></div>
 <div class="deck-section-start"><dt>Skills</dt><dd>${stats.skills}</dd></div>
 <div><dt>Items</dt><dd>${stats.items}</dd></div>
 <div><dt>Events</dt><dd>${stats.events}</dd></div>
 <div class="total main-total"><dt>Main Deck</dt><dd>${stats.main}</dd></div>`;
 const form=formation();
 const keys=['LEFT','CENTER','RIGHT'];
 document.getElementById('s0PvpFormation').innerHTML=keys.map((lane,index)=>{
   const base=form[lane],ids=lineageFor(deck,base),hero=ids[Math.min(previewRank-1,ids.length-1)]||base;
   const heroMarkup=`<div class="pvp-v260-hero"><button type="button" class="pvp-v260-card" data-preview-hero="${esc(lane)}" aria-label="View ${esc(lane)} Hero progression"><img src="${art(hero)}" alt="${esc(lane)} Hero" loading="eager" onerror="this.style.opacity='.25'"></button><div class="pvp-v260-position">${esc(lane)}</div></div>`;
   return index===0?heroMarkup:`<button type="button" class="pvp-v260-swap-button" data-swap="${index-1}" title="Swap adjacent Hero positions" ${state.status==='playing'||state.status==='finished'?'disabled':''}><img src="assets/lobby/swap.png" alt="Swap"></button>`+heroMarkup;
 }).join('');
 document.getElementById('s0PvpRankLabel').textContent='RANK '+ranks[previewRank-1];
 document.getElementById('s0PvpRankPrev').disabled=previewRank===1;
 document.getElementById('s0PvpRankNext').disabled=previewRank===3;
 document.getElementById('s0PvpDeck').value=draftKey;
 const status=document.getElementById('s0PvpLoadedDeckStatus');
 if(status)status.textContent=state.status==='lobby'&&state.seat?(state.deckKey===(draftKey==='CUSTOM'||JSON.stringify(formation())!==JSON.stringify(defaultFormation(deck))?'CUSTOM':draftKey)?'Deck loaded on server':'Deck selection pending…'):'Join a room to load your deck';
}
function showProgression(lane){
 const ids=lineageFor(previewDeck(),formation()[lane]);if(ids.length<3)return;
 const node=document.getElementById('s0PvpProgression');
 node.className='pvp-progression-modal';
 const cards=ids.slice(0,3).map((id,i)=>`<article class="pvp-v260-hero pvp-progression-hero ${i===0?'current':''}"><button type="button" class="pvp-v260-card pvp-progression-static-card" data-progression-card="${esc(id)}"><img src="${art(id)}" alt="Rank ${ranks[i]} Hero"></button><div class="pvp-v260-position">RANK ${ranks[i]}</div></article>`);
 node.innerHTML=`<section class="pvp-progression-card" role="dialog" aria-modal="true" aria-label="Hero progression"><header><div><span>HERO PROGRESSION</span><h2>${esc(lane)}</h2></div><button id="s0PvpProgressionClose" type="button">Close</button></header><div class="pvp-progression-row">${cards.join('<span class="pvp-progression-arrow">→</span>')}</div><p>Select a Rank card to open Card Preview.</p></section>`;
 node.hidden=false;
 const close=()=>{node.hidden=true;node.innerHTML='';};
 node.querySelector('#s0PvpProgressionClose').onclick=close;
 node.onclick=e=>{if(e.target===node)close();const btn=e.target.closest?.('[data-progression-card]');if(btn){const id=btn.dataset.progressionCard;window.GL_GAME_UI?.openCardReview?.(id)}};
}
function swapFormation(index){
 const deck=previewDeck();if(!deck||!['lobby','offline'].includes(state.status))return;
 const f={...formation()},lanes=['LEFT','CENTER','RIGHT'],a=lanes[index],b=lanes[index+1];
 [f[a],f[b]]=[f[b],f[a]];
 draftFormation=f;automaticDeckUploadKey='';drawPreview();if(state.status==='lobby'&&state.seat)submitDraftDeck();
}
function selectDeck(key){
 if(key!=='CUSTOM'&&!starters.includes(key))return;
 draftKey=key;draftFormation=null;previewRank=1;automaticDeckUploadKey='';drawPreview();if(state.status==='lobby'&&state.seat)submitDraftDeck();
}

function updateRoomStatus(s){
 const connected=state.socket?.readyState===WebSocket.OPEN&&!!state.seat;
 const players=s.players||[],me=players.find(p=>p?.seat===state.seat),ready=!!me?.ready;
 const current=document.getElementById('s0PvpRoomTitle');if(!current)return;
 current.textContent=state.room||'Not connected';
 document.getElementById('s0PvpPlayers').innerHTML=[0,1].map(i=>{
   const p=players[i],online=!!p?.connected;
   return `<article class="pvp-v260-seat"><div><span>Player ${i+1}</span><strong>${esc(p?.occupied?p.name:'Empty')}</strong></div><p class="${online?'online':''}"><i></i>${online?'online':'offline'}${p?.ready?' · READY':''}</p></article>`;
 }).join('');
 const readyButton=document.getElementById('s0PvpReady');
 if(readyButton){readyButton.textContent=ready?'UNREADY':'READY';readyButton.disabled=state.status!=='lobby'||!connected||!me?.hasDeck;}
 const join=document.getElementById('s0PvpJoin');if(join)join.disabled=!['lobby','offline'].includes(state.status);
 const start=document.getElementById('s0PvpStart');
 if(start)start.disabled=state.status!=='lobby'||state.seat!==1||!players[0]?.ready||!players[1]?.ready||!players[0]?.connected||!players[1]?.connected;
 const controls=document.getElementById('s0PvpControls');
 controls.querySelector('#s0PvpCoin')?.remove();
 if(state.status==='coin'){
   const node=document.createElement('div');node.id='s0PvpCoin';node.className='s0-pvp-coin';
   node.innerHTML=state.seat===2?'<p>Choose HEADS or TAILS for the opening coin flip.</p><div class="s0-pvp-controls-row"><button class="pvp-v260-btn pvp-v260-gold" data-coin="HEADS">HEADS</button><button class="pvp-v260-btn pvp-v260-gold" data-coin="TAILS">TAILS</button></div>':'<p>Waiting for Player 2 to choose the opening coin...</p>';
   controls.prepend(node);node.querySelectorAll('[data-coin]').forEach(b=>b.addEventListener('click',()=>emit('coin',{choice:b.dataset.coin})));
 }
 if(start)start.hidden=!['lobby','offline'].includes(state.status);
 if(document.getElementById('s0PvpResume'))document.getElementById('s0PvpResume').hidden=!['playing','finished'].includes(state.status);
 if(document.getElementById('s0PvpReset'))document.getElementById('s0PvpReset').hidden=!(state.status==='finished'&&state.seat===1);
 const ic=document.getElementById('s0PvpNameIcon');if(ic)ic.className='pvp-v260-name-icon'+(ready?' ready':'');
 const status=document.getElementById('s0PvpStatus');if(status)status.textContent=connected?`Player ${state.seat} · Room ${state.room}`:'Not connected';
 if(state.status==='lobby')drawPreview();
}

function drawControls(s){updateRoomStatus(s);}
function syncLobbyScale(){
 const el=document.getElementById('s0PvpOverlay');if(!el)return;
 if(document.documentElement.classList.contains('gl-adaptive-stage')){
   el.style.removeProperty('--pvp-lobby-scale');return;
 }
 const fit=window.innerWidth<=1160;
 if(!fit){el.style.removeProperty('--pvp-lobby-scale');return;}
 const scale=Math.max(.2,Math.min(1,(window.innerWidth||1)/1366,(window.innerHeight||1)/768));
 el.style.setProperty('--pvp-lobby-scale',String(scale));
}
function hideLobby(){document.getElementById('s0PvpOverlay').classList.add('playing');document.body.classList.remove('pvp-lobby-mode');}
function showLobby(){document.getElementById('s0PvpOverlay').classList.remove('playing');document.body.classList.add('pvp-lobby-mode');}
function setup(){
 const overlay=document.createElement('div');overlay.id='s0PvpOverlay';overlay.className='pvp-v260-lobby open';
 // Structural source: PvP v3.80.17 public/pvp/pvp-host.js ensureLobby() markup.
 // Deliberate S0 deviations: explicit room code/Join instead of S1 automatic seat,
 // no Spectate (S0 server supports two player seats only), and shared invite link.
 overlay.innerHTML=`<div class="pvp-v260-page">
  <header class="pvp-v260-topbar"><a class="pvp-v260-logo" href="https://grandislegacytcg.github.io/" aria-label="Back to Grandis Legacy home"><img src="assets/lobby/grandis-legacy-logo.webp" alt="Grandis Legacy"></a><div class="pvp-v260-heading"><h1>PVP LOBBY · SEASON 0</h1><p>Choose your deck, then ready up to play.</p></div></header>
  <main class="pvp-v260-layout">
   <section class="pvp-v260-panel pvp-v260-deck-panel">
    <div class="pvp-v260-picker"><label for="s0PvpDeck">Choose a Deck</label><div class="pvp-v260-select"><select id="s0PvpDeck">${starters.map((k,i)=>`<option value="${k}">${esc('Starter '+(i+1)+' — '+starterLabels[i])}</option>`).join('')}</select></div></div>
    <div class="pvp-v260-title"><h2 id="s0PvpDeckTitle">Starter Deck</h2><p id="s0PvpDeckClassLine"></p></div>
    <div class="pvp-v260-showcase"><div class="pvp-v260-formation-wrap"><div id="s0PvpFormation" class="pvp-v260-formation"></div><div class="rank-control"><button id="s0PvpRankPrev" type="button">‹</button><strong id="s0PvpRankLabel">RANK I</strong><button id="s0PvpRankNext" type="button">›</button></div></div><aside class="pvp-v260-summary"><h3>YOUR DECK</h3><dl id="s0PvpDeckStats"></dl></aside></div>
    <div class="pvp-v260-footer"><input id="s0PvpImport" type="file" accept="application/json,.json" hidden><button id="s0PvpImportButton" class="pvp-v260-btn pvp-v260-gold pvp-v260-compact" type="button">IMPORT CUSTOM DECK</button><div id="s0PvpLoadedDeckStatus" class="pvp-v260-status"></div></div>
   </section>
   <aside class="pvp-v260-panel pvp-v260-room-panel">
    <h2>MATCH PANEL</h2><label class="pvp-v260-label" for="s0PvpName">PLAYER NAME</label><div class="pvp-v260-name"><input id="s0PvpName" maxlength="25" placeholder="Your player name" autocomplete="off"><span id="s0PvpNameIcon" class="pvp-v260-name-icon"></span></div>
    <label class="pvp-v260-label s0-room-code-label" for="s0PvpRoom">ROOM CODE</label><input id="s0PvpRoom" maxlength="32" placeholder="S0Room01" autocomplete="off" spellcheck="false">
    <div class="pvp-v260-actions"><button id="s0PvpJoin" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline" type="button">JOIN ROOM</button><button id="s0PvpReady" class="pvp-v260-btn pvp-v260-gold" type="button" disabled>READY</button></div>
    <div class="pvp-v260-divider"></div><div class="pvp-v260-room-id"><div class="pvp-v260-room-copy"><span>CURRENT ROOM</span><strong id="s0PvpRoomTitle">Not connected</strong></div><button id="s0PvpCopyInvite" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline pvp-v260-switch" type="button">COPY INVITE LINK</button></div>
    <div id="s0PvpPlayers" class="pvp-v260-seats"></div><div id="s0PvpMessage" class="pvp-v260-message" role="status" aria-live="polite">Enter your name and join a room to begin.</div><div id="s0PvpStatus" class="s0-pvp-status"></div>
    <div id="s0PvpControls" class="pvp-v260-room-footer"><button id="s0PvpStart" class="pvp-v260-btn pvp-v260-gold" type="button" disabled>START MATCH</button><button id="s0PvpReconnect" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline" type="button">RECONNECT</button><button id="s0PvpResume" class="pvp-v260-btn pvp-v260-gold" type="button" hidden>BACK TO BATTLEFIELD</button><button id="s0PvpReset" class="pvp-v260-btn pvp-v260-gold" type="button" hidden>RESET ROOM</button></div>
   </aside>
  </main>
 </div>`;
 document.body.appendChild(overlay);
 document.body.classList.add('pvp-lobby-mode');
 syncLobbyScale();window.addEventListener('resize',syncLobbyScale,{passive:true});
 window.addEventListener('orientationchange',()=>setTimeout(syncLobbyScale,75),{passive:true});
 const toggle=document.createElement('button');toggle.id='s0PvpToggle';toggle.textContent='PvP Room';toggle.onclick=()=>{if(overlay.classList.contains('playing'))showLobby();else if(state.status==='playing'||state.status==='finished')hideLobby();};document.body.appendChild(toggle);
 const prog=document.createElement('div');prog.id='s0PvpProgression';prog.hidden=true;document.body.appendChild(prog);
 const saved=(()=>{try{return JSON.parse(localStorage.getItem(STOR)||'null')}catch{return null}})();
 overlay.querySelector('#s0PvpName').value=saved?.name||'Player';
 overlay.querySelector('#s0PvpRoom').value=new URLSearchParams(location.search).get('room')||saved?.room||'S0Room01';
 overlay.querySelector('#s0PvpJoin').onclick=()=>{localStorage.removeItem(STOR);connect(overlay.querySelector('#s0PvpRoom').value.trim(),'')};
 overlay.querySelector('#s0PvpReconnect').onclick=()=>{const s=(()=>{try{return JSON.parse(localStorage.getItem(STOR)||'null')}catch{return null}})();if(!s?.token)return info('No saved seat. Use Join Room.',true);connect(s.room,s.token)};
 overlay.querySelector('#s0PvpCopyInvite').onclick=async()=>{const room=(state.seat&&state.room?state.room:overlay.querySelector('#s0PvpRoom').value.trim());if(!/^[a-zA-Z0-9_-]{3,32}$/.test(room))return info('Enter a valid room code.',true);const u=new URL(location.href);u.searchParams.set('room',room);try{await navigator.clipboard.writeText(u.toString());info('Invite link copied.');}catch{info('Share this URL: '+u.toString());}};
 overlay.querySelector('#s0PvpDeck').onchange=e=>selectDeck(e.target.value);
 overlay.querySelector('#s0PvpRankPrev').onclick=()=>{previewRank=Math.max(1,previewRank-1);drawPreview();};
 overlay.querySelector('#s0PvpRankNext').onclick=()=>{previewRank=Math.min(3,previewRank+1);drawPreview();};
 overlay.querySelector('#s0PvpFormation').onclick=e=>{const sw=e.target.closest('[data-swap]');if(sw)return swapFormation(Number(sw.dataset.swap));const hero=e.target.closest('[data-preview-hero]');if(hero)showProgression(hero.dataset.previewHero);};
 overlay.querySelector('#s0PvpReady').onclick=()=>emit('ready',{ready:!state.ready});
 overlay.querySelector('#s0PvpStart').onclick=()=>emit('start');
 overlay.querySelector('#s0PvpResume').onclick=hideLobby;
 overlay.querySelector('#s0PvpReset').onclick=()=>emit('reset');
 overlay.querySelector('#s0PvpImportButton').onclick=()=>overlay.querySelector('#s0PvpImport').click();
 overlay.querySelector('#s0PvpImport').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>90000)return info('Deck file must be 90 KB or smaller.',true);
  try{const deck=JSON.parse(await file.text());if(!deck||typeof deck!=='object'||Array.isArray(deck))throw Error('Not a deck');customPreview=deck;importedDeckName=deck.deck_name||file.name;selectDeck('CUSTOM');
    if(!Array.from(overlay.querySelector('#s0PvpDeck').options).some(o=>o.value==='CUSTOM'))overlay.querySelector('#s0PvpDeck').add(new Option('Imported: '+importedDeckName,'CUSTOM'));
    drawPreview();if(state.status!=='lobby'||!state.seat)info('Custom deck selected. Join a room to load it.');
  }catch(err){info('Invalid JSON file: '+String(err.message||err),true);}
 };
 const startDeck=(saved?.deckKey&&starters.includes(saved.deckKey))?saved.deckKey:starters[0];selectDeck(startDeck);
 updateRoomStatus({players:[]});
 if(saved?.room&&saved.token)connect(saved.room,saved.token);
 setInterval(()=>{if(state.socket?.readyState===WebSocket.OPEN)emit('ping')},20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
window.GL_S0_PVP_NETWORK={state,connect,sendIntent};
})();
