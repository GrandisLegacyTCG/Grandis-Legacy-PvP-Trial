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
// Season 1 lobby presentation (from available v3.51 reference), backed by the S0 protocol.
// RC32 gameplay renderer/engine and WebSocket authority above remain untouched.
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
  const total=rows.reduce((n,c)=>n+Number(c.quantity||0),0);
  const items=rows.filter(c=>String(c.card_id||'').startsWith('S0-ITM-')).reduce((n,c)=>n+Number(c.quantity||0),0);
  const events=rows.filter(c=>String(c.card_id||'').startsWith('S0-EVT-')).reduce((n,c)=>n+Number(c.quantity||0),0);
  const num=(n)=>Number.isFinite(n)?n:0;
  return [['Main Deck',num(total)],['Skill Cards',num(total-items-events)],['Item Cards',num(items)],['Event Cards',num(events)],['Mana Deck',num(deck?.mana_deck_count??(deck?.shard_deck||deck?.deck?.shard_deck||[]).reduce((n,c)=>n+Number(c.quantity||0),0))],['Legacy Deck',num(deck?.legacy_deck_count??(deck?.legacy_packages||deck?.deck?.legacy_packages||[]).length*4)]];
}
function drawPreview(){
 const deck=previewDeck();
 const title=document.getElementById('s0PvpDeckTitle');if(!title)return;
 title.textContent=deck?.deck_name||currentDeckLabel();
 document.getElementById('s0PvpDeckClassLine').textContent=draftKey==='CUSTOM'?'CUSTOM SEASON 0 DECK':currentDeckLabel();
 document.getElementById('s0PvpDeckStats').innerHTML=deckStats(deck).map(([k,v],i)=>`<div class="${i===0?'total':''}"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
 const form=formation();
 const keys=['LEFT','CENTER','RIGHT'];
 document.getElementById('s0PvpFormation').innerHTML=keys.map((lane,index)=>{
   const base=form[lane],ids=lineageFor(deck,base),hero=ids[Math.min(previewRank-1,ids.length-1)]||base;
   const heroMarkup=`<div class="pvp-v260-hero"><button type="button" class="pvp-v260-card" data-preview-hero="${esc(lane)}" aria-label="View ${esc(lane)} Hero progression"><img src="${art(hero)}" alt="${esc(lane)} Hero" loading="eager" onerror="this.style.opacity='.25'"></button><div class="pvp-v260-position">${esc(lane)}</div></div>`;
   return index===0?heroMarkup:`<button type="button" class="pvp-v260-swap-button" data-swap="${index-1}" title="Swap adjacent Hero positions" ${state.status==='playing'||state.status==='finished'?'disabled':''}>⇄</button>`+heroMarkup;
 }).join('');
 document.getElementById('s0PvpRankLabel').textContent='RANK '+ranks[previewRank-1];
 document.getElementById('s0PvpRankPrev').disabled=previewRank===1;
 document.getElementById('s0PvpRankNext').disabled=previewRank===3;
 document.getElementById('s0PvpDeck').value=draftKey;
 const status=document.getElementById('s0PvpLoadedDeckStatus');
 if(status)status.textContent=state.deckKey===draftKey&&!(draftFormation&&JSON.stringify(draftFormation)!==JSON.stringify(defaultFormation(deck)))?'Deck loaded on server':'Press LOAD DECK to confirm your selection';
}
function showProgression(lane){
 const d=previewDeck(),base=formation()[lane],ids=lineageFor(d,base);
 const node=document.getElementById('s0PvpProgression');
 node.innerHTML=`<div class="s0-progression-card" role="dialog" aria-modal="true" aria-label="Hero progression"><header><h2>${esc(lane)} · HERO PROGRESSION</h2><button type="button" id="s0PvpProgressionClose">CLOSE</button></header><div class="s0-progression-cards">${ids.map((id,i)=>`<div><img src="${art(id)}" alt="Rank ${ranks[i]||i+1} Hero"><strong>RANK ${ranks[i]||i+1}</strong></div>`).join('')}</div></div>`;
 node.hidden=false;
 node.querySelector('#s0PvpProgressionClose').onclick=()=>{node.hidden=true;node.innerHTML='';};
}
function swapFormation(index){
 const deck=previewDeck();if(!deck||!['lobby','offline'].includes(state.status))return;
 const f={...formation()},lanes=['LEFT','CENTER','RIGHT'],a=lanes[index],b=lanes[index+1];
 [f[a],f[b]]=[f[b],f[a]];
 draftFormation=f;drawPreview();info('Formation updated. Press LOAD DECK to save it to the room.');
}
function selectDeck(key){
 if(key!=='CUSTOM'&&!starters.includes(key))return;
 draftKey=key;draftFormation=null;previewRank=1;drawPreview();
}
function loadDeck(){
 if(state.status!=='lobby'||!state.seat)return info('Join a room before loading your deck.',true);
 const d=previewDeck();if(!d)return info('Choose a valid Season 0 deck.',true);
 const form=formation();
 if(draftKey==='CUSTOM'||JSON.stringify(form)!==JSON.stringify(defaultFormation(d))){
   const clone=JSON.parse(JSON.stringify(d));
   clone.default_formation={...form};
   emit('custom-deck',{deck:clone});
 }else emit('deck',{deckKey:draftKey});
 info('Submitting deck to the server...');
}
function updateRoomStatus(s){
 const connected=state.socket?.readyState===WebSocket.OPEN && !!state.seat;
 const players=s.players||[],occupied=players.filter(p=>p?.occupied).length;
 const connectedCount=players.filter(p=>p?.connected).length;
 const stage=document.getElementById('s0PvpControls');if(!stage)return;
 document.getElementById('s0PvpRoomTitle').textContent=state.room||'Not connected';
 document.getElementById('s0PvpRoomStats').innerHTML=`<div><dt>Players</dt><dd>${occupied}/2</dd></div><div><dt>Online</dt><dd>${connectedCount}/2</dd></div><div><dt>Connection</dt><dd>${connected?'ONLINE':'OFFLINE'}</dd></div><div><dt>Match</dt><dd>${esc(state.status.toUpperCase())}</dd></div>`;
 document.getElementById('s0PvpPlayers').innerHTML=[0,1].map(i=>{
    const p=players[i],online=!!p?.connected,ready=!!p?.ready;
    return `<article class="pvp-v260-seat"><div><span>Player ${i+1}</span><strong>${esc(p?.occupied?p.name:'Empty Seat')}</strong></div><p class="${online?'online':''}"><i></i>${online?'ONLINE':'OFFLINE'}</p><p>${ready?'✓ READY':p?.hasDeck?'DECK LOADED':'NOT READY'}</p></article>`;
 }).join('');
 let controls='';
 if(state.status==='lobby'){
   controls=`<div class="s0-pvp-controls-row"><button id="s0PvpReady" class="pvp-v260-btn pvp-v260-gold" ${!connected||!players.find(p=>p.seat===state.seat)?.hasDeck?'disabled':''}>${state.ready?'UNREADY':'READY'}</button></div>`;
   if(state.seat===1)controls+=`<button id="s0PvpStart" class="pvp-v260-btn pvp-v260-gold" ${!(players[0]?.ready&&players[1]?.ready&&players[0]?.connected&&players[1]?.connected)?'disabled':''}>START MATCH</button>`;
 }else if(state.status==='coin'){
   controls=state.seat===2?'<div class="s0-pvp-coin"><p>Choose HEADS or TAILS for the opening coin flip.</p><div class="s0-pvp-controls-row"><button class="pvp-v260-btn pvp-v260-gold" data-coin="HEADS">HEADS</button><button class="pvp-v260-btn pvp-v260-gold" data-coin="TAILS">TAILS</button></div></div>':'<p class="s0-pvp-coin">Waiting for Player 2 to choose the opening coin...</p>';
 }else if(state.status==='playing'||state.status==='finished'){
   controls=`<p class="s0-pvp-coin">Round ${Number(s.board?.appState?.round||1)} · ${esc(s.board?.appState?.phase||'')} · Revision ${Number(s.revision||0)}</p><button id="s0PvpResume" class="pvp-v260-btn pvp-v260-gold">BACK TO BATTLEFIELD</button>`;
   if(state.status==='finished'&&state.seat===1)controls+='<button id="s0PvpReset" class="pvp-v260-btn pvp-v260-gold-outline">RESET ROOM</button>';
 }
 stage.innerHTML=controls;
 stage.querySelector('#s0PvpReady')?.addEventListener('click',()=>emit('ready',{ready:!state.ready}));
 stage.querySelector('#s0PvpStart')?.addEventListener('click',()=>emit('start'));
 stage.querySelectorAll('[data-coin]').forEach(b=>b.addEventListener('click',()=>emit('coin',{choice:b.dataset.coin})));
 stage.querySelector('#s0PvpResume')?.addEventListener('click',hideLobby);
 stage.querySelector('#s0PvpReset')?.addEventListener('click',()=>emit('reset'));
 const status=document.getElementById('s0PvpStatus');if(status)status.textContent=connected?`Player ${state.seat} · Room ${state.room}`:'Not connected';
 if(state.status==='lobby'&&state.deckKey===draftKey){drawPreview();}
}
function drawControls(s){updateRoomStatus(s);}
function hideLobby(){document.getElementById('s0PvpOverlay').classList.add('playing');document.body.classList.remove('pvp-lobby-mode');}
function showLobby(){document.getElementById('s0PvpOverlay').classList.remove('playing');document.body.classList.add('pvp-lobby-mode');}
function setup(){
 const overlay=document.createElement('div');overlay.id='s0PvpOverlay';overlay.className='pvp-v260-lobby open';overlay.innerHTML=`
 <div class="pvp-v260-page">
  <header class="pvp-v260-topbar">
   <a class="pvp-v260-logo" href="https://grandislegacytcg.github.io/" aria-label="Grandis Legacy home"><img src="assets/lobby/grandis-legacy-logo.webp" alt="Grandis Legacy"></a>
   <div class="pvp-v260-heading"><h1>PVP LOBBY · SEASON 0</h1><p>Choose your deck, then ready up to play.</p></div>
   <nav class="pvp-v260-top-actions"><a class="pvp-v260-btn pvp-v260-outline" href="https://grandislegacytcg.github.io/Grandis-Legacy-Deck-Builder/style-1/" target="_blank" rel="noopener">GO TO DECK BUILDER</a><a class="pvp-v260-btn pvp-v260-blue" href="https://grandislegacytcg.github.io/Grandis-Legacy-VS-AI/" target="_blank" rel="noopener">GO TO VS AI</a></nav>
  </header>
  <main class="pvp-v260-layout">
   <section class="pvp-v260-panel pvp-v260-deck-panel">
    <div class="pvp-v260-picker"><label for="s0PvpDeck">Choose a Deck</label><div class="pvp-v260-select"><select id="s0PvpDeck">${starters.map((k,i)=>`<option value="${k}">${esc(starterLabels[i])}</option>`).join('')}</select></div></div>
    <div class="pvp-v260-title"><h2 id="s0PvpDeckTitle">Starter Deck</h2><p id="s0PvpDeckClassLine">Season 0</p></div>
    <div class="pvp-v260-showcase"><div class="pvp-v260-formation-wrap"><div id="s0PvpFormation" class="pvp-v260-formation"></div><div class="rank-control"><button id="s0PvpRankPrev" type="button" aria-label="Previous Rank">‹</button><strong id="s0PvpRankLabel">RANK I</strong><button id="s0PvpRankNext" type="button" aria-label="Next Rank">›</button></div></div><aside class="pvp-v260-summary"><h3>YOUR DECK</h3><dl id="s0PvpDeckStats"></dl></aside></div>
    <div class="pvp-v260-footer"><input id="s0PvpImport" type="file" accept="application/json,.json" hidden><button id="s0PvpImportButton" class="pvp-v260-btn pvp-v260-gold pvp-v260-compact" type="button">IMPORT CUSTOM DECK</button><button id="s0PvpSelect" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline" type="button">LOAD DECK</button><div id="s0PvpLoadedDeckStatus" class="pvp-v260-status"></div></div>
   </section>
   <aside class="pvp-v260-panel pvp-v260-room-panel">
    <h2>ROOM PANEL</h2><label class="pvp-v260-label" for="s0PvpName">PLAYER NAME</label><div class="pvp-v260-name"><input id="s0PvpName" maxlength="45" placeholder="Your player name" autocomplete="off"><span class="pvp-v260-name-icon" id="s0PvpNameIcon"></span></div>
    <label class="pvp-v260-label s0-room-code-label" for="s0PvpRoom">ROOM CODE</label><input id="s0PvpRoom" maxlength="32" autocomplete="off" placeholder="S0Room01" spellcheck="false">
    <div class="pvp-v260-actions"><button id="s0PvpJoin" class="pvp-v260-btn pvp-v260-gold" type="button">JOIN ROOM</button><button id="s0PvpReconnect" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline" type="button">RECONNECT</button></div>
    <div class="pvp-v260-divider"></div><div class="pvp-v260-room-id"><div class="pvp-v260-room-copy"><span>CURRENT ROOM</span><strong id="s0PvpRoomTitle">Not connected</strong></div><button id="s0PvpCopyInvite" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline pvp-v260-switch" type="button">COPY INVITE LINK</button></div>
    <dl id="s0PvpRoomStats" class="pvp-v260-room-stats"></dl><div id="s0PvpPlayers" class="pvp-v260-seats"></div><div id="s0PvpMessage" class="pvp-v260-message" role="status" aria-live="polite">Enter your name and join a room to begin.</div><div id="s0PvpStatus" class="s0-pvp-status"></div>
    <div id="s0PvpControls" class="pvp-v260-room-footer"></div>
   </aside>
  </main>
 </div>`;
 document.body.appendChild(overlay);
 document.body.classList.add('pvp-lobby-mode');
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
 overlay.querySelector('#s0PvpSelect').onclick=loadDeck;
 overlay.querySelector('#s0PvpImportButton').onclick=()=>overlay.querySelector('#s0PvpImport').click();
 overlay.querySelector('#s0PvpImport').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>90000)return info('Deck file must be 90 KB or smaller.',true);
  try{const deck=JSON.parse(await file.text());if(!deck||typeof deck!=='object'||Array.isArray(deck))throw Error('Not a deck');customPreview=deck;importedDeckName=deck.deck_name||file.name;selectDeck('CUSTOM');
    if(!Array.from(overlay.querySelector('#s0PvpDeck').options).some(o=>o.value==='CUSTOM'))overlay.querySelector('#s0PvpDeck').add(new Option('Imported: '+importedDeckName,'CUSTOM'));
    drawPreview();if(state.status==='lobby'&&state.seat)loadDeck();else info('Custom deck loaded locally. Join a room, then press LOAD DECK.');
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
