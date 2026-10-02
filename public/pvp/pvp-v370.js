/* Grandis Legacy PvP v3.70 — single-room two-human client shell over VS AI v6.80. */
(function(){
'use strict';
const VERSION='Grandis Legacy PvP v3.70';
const ROOM='GRANDIS_PVP';
const DEFAULT_DECK_KEY='starter_01_elemental_lord_conqueror_renegade';
const STORE={client:'gl_pvp370_client',name:'gl_pvp370_name',token:'gl_pvp370_seat_token',deck:'gl_pvp370_deck'};
const state={ws:null,connected:false,snapshot:null,clientId:'',name:'',seatToken:'',deckKey:'',customDeck:null,customDeckName:'',lastRevision:0,lastAppliedRevision:-1,lastAppliedStatus:'',intentQueue:[],intentInFlight:null,actionSeq:0,reconnectTimer:null,reconnectDelay:900,pingAt:0,latencyMs:null,opponentLatencyMs:null,lastPongAt:0,lastCoinKey:'',fatal:'',message:'',messageError:false,rank:1,socketEpoch:0,orientationObserver:null};
const $=(id)=>document.getElementById(id);
const E=()=>window.GL_OPTION_B_ENGINE;
const B=()=>window.GL_LOCAL_AI_BRIDGE;
const adapter=()=>window.GL_PVP_PRESENTATION_ADAPTER;
const cfg=()=>window.GL_PVP_CONFIG||window.GL_CONFIG||{};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return v}}
function chars(v){return Array.from(String(v??''));}
function clean(v,max=120){return chars(String(v??'').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim()).slice(0,max).join('');}
function makeId(){try{let x=localStorage.getItem(STORE.client);if(x)return x;x='c_'+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem(STORE.client,x);return x}catch{return 'c_'+Math.random().toString(36).slice(2)}}
function loadStore(k,fallback=''){try{return localStorage.getItem(k)||fallback}catch{return fallback}}
function saveStore(k,v){try{if(v)localStorage.setItem(k,v);else localStorage.removeItem(k)}catch{}}
function local(){return state.snapshot?.local||null}
function match(){return state.snapshot?.match||{}}
function players(){return state.snapshot?.players||[]}
function me(){const l=local();return players().find(p=>p.clientId===l?.clientId)||l||null}
function opponent(){const l=local();return players().find(p=>Number(p.seat)&&Number(p.seat)!==Number(l?.seat))||null}
function activeMatch(){return ['coin-flip','coin-result','started','finished'].includes(match().status)}
function wsBase(){const protocol=location.protocol==='https:'?'wss:':'ws:';return protocol+'//'+location.host+(cfg().wsPath||'/ws')}
function wsUrl(){const q=new URLSearchParams({room:ROOM,client:state.clientId,name:state.name||'Player',buildId:String(cfg().buildId||'')});if(state.seatToken)q.set('seatToken',state.seatToken);if(state.deckKey&&state.deckKey!=='CUSTOM'&&!state.seatToken)q.set('deck',state.deckKey);return wsBase()+'?'+q.toString()}
function send(type,payload={}){if(!state.ws||state.ws.readyState!==WebSocket.OPEN)return false;state.ws.send(JSON.stringify({type,...payload}));return true}
function setMessage(text,error=false){state.message=String(text||'');state.messageError=!!error;renderLobby()}
function statusText(){if(state.fatal)return state.fatal;if(state.connected)return 'Connected';if(state.ws&&state.ws.readyState===WebSocket.CONNECTING)return 'Connecting…';return 'Disconnected'}
function signalClass(latency,connected=true){if(!connected)return'offline';if(latency==null)return'connecting';latency=Number(latency);if(latency<=80)return'excellent';if(latency<=160)return'good';if(latency<=300)return'fair';return'poor'}
function signalHtml(cls,title){return '<span class="pvp370-signal '+esc(cls)+'" title="'+esc(title||'Connection')+'"><span></span><span></span><span></span><span></span></span>'}
function fitIdentity(name,deck){name=clean(name||'Player',40)||'Player';deck=clean(deck||'Deck',100)||'Deck';const sep=' - ',MAX=40,full=chars(name+sep+deck);if(full.length<=MAX)return full.join('');let n=chars(name);if(n.length>36)n=n.slice(0,35).concat('…');let budget=MAX-n.length-chars(sep).length;if(budget<=0)return n.slice(0,MAX).join('');let d=chars(deck);if(d.length>budget){if(budget>=2)d=d.slice(0,budget-1).concat('…');else d=d.slice(0,budget)}return n.join('')+sep+d.join('')}
function localDeckName(){return local()?.deckName||match()?.deckChoices?.[local()?.seat]?.deckName||state.customDeckName||deckLabel(state.deckKey)||'Deck'}
function opponentDeckName(){const o=opponent();return o?.deckName||match()?.deckChoices?.[o?.seat]?.deckName||'Deck'}
function deckLabel(key){const arr=state.snapshot?.deckOptions||[];const hit=arr.find(x=>x.key===key);if(hit?.label)return hit.label;return window.GL_ACTIVE_STARTER_DECKS?.[key]?.label||key||''}
function selectedDeckData(){
  if(state.customDeck){const raw=state.customDeck;return raw?.deck&&raw.deck.main_deck?raw.deck:raw}
  const key=local()?.deckKey||state.deckKey;return window.GL_ACTIVE_STARTER_DECKS?.[key]?.deck||null
}
function cardLookup(id){const defs=window.GL_CARD_DEFINITIONS||{};if(Array.isArray(defs.cards))return defs.cards.find(c=>c?.card_id===id)||null;for(const fam of Object.values(defs.families||{})){const hit=(fam?.cards||[]).find(c=>c?.card_id===id);if(hit)return hit}return null}
function deckDisplayTitle(deck){const label=local()?.deckName||state.customDeckName||deck?.display_name||deck?.deck_name||deckLabel(state.deckKey)||'Selected Deck';const m=String(label).match(/Starter\s*0?(\d+)/i);return m?'Starter Deck '+Number(m[1]):String(label)}
function deckClassLine(deck){const label=local()?.deckName||state.customDeckName||deck?.display_name||deck?.deck_name||deckLabel(state.deckKey)||'';const parts=String(label).split(/[—-]/);if(parts.length>1)return parts.slice(1).join(' ').trim().replace(/\s*\/\s*/g,', ').toUpperCase();const rows=deck?.legacy_deck_expanded||[],packages={};rows.forEach(x=>{if(String(x?.card_type||'').toLowerCase()==='hero'){(packages[x.package_id||'PACKAGE']||(packages[x.package_id||'PACKAGE']=[])).push(x.card_id)}});const out=[];Object.values(packages).forEach(ids=>{let cls='';ids.forEach(id=>{const c=cardLookup(id);if(Number(c?.rank_numeric)===3)cls=c?.display_class||c?.class||''});if(cls)out.push(cls)});return (out.join(', ')||'CUSTOM DECK').toUpperCase()}
function deckSummary(deck){const stats={heroes:0,legacies:0,skills:0,items:0,events:0,main:0};(deck?.legacy_deck_expanded||deck?.side_deck_expanded||[]).forEach(x=>{const t=String(x?.card_type||'').toLowerCase();if(t==='hero')stats.heroes++;if(t==='legacy')stats.legacies++});(deck?.main_deck||[]).forEach(x=>{const q=Math.max(0,Number(x?.quantity||1)),c=cardLookup(x?.card_id),f=String(c?.family||c?.card_type||'').toLowerCase();stats.main+=q;if(f==='item'||String(x?.card_id||'').includes('-ITM-'))stats.items+=q;else if(f==='event'||String(x?.card_id||'').includes('-EVT-'))stats.events+=q;else stats.skills+=q});return stats}
function renderDeckSummary(){const deck=selectedDeckData(),title=$('pvp370DeckTitle'),line=$('pvp370DeckClassLine'),statsEl=$('pvp370DeckStats'),loaded=$('pvp370LoadedDeckStatus');if(title)title.textContent=deckDisplayTitle(deck);if(line)line.textContent=deck?deckClassLine(deck):'';const st=deckSummary(deck);if(statsEl)statsEl.innerHTML='<div><dt>HEROES</dt><dd>'+st.heroes+'</dd></div><div><dt>LEGACIES</dt><dd>'+st.legacies+'</dd></div><div class="total"><dt>LEGACY DECK</dt><dd>'+(st.heroes+st.legacies)+'</dd></div><div><dt>SKILLS</dt><dd>'+st.skills+'</dd></div><div><dt>ITEM</dt><dd>'+st.items+'</dd></div><div><dt>EVENT</dt><dd>'+st.events+'</dd></div><div class="total"><dt>MAIN DECK</dt><dd>'+st.main+'</dd></div>';if(loaded)loaded.textContent=(local()?.deckSource==='custom'||state.customDeck)?('Custom Deck Loaded: '+(local()?.deckName||state.customDeckName||'Imported Deck')):''}
function setGlobals(){const l=local(),o=opponent();window.GL_PVP_LOCAL_SEAT=l?.seat||null;window.GL_PVP_LOCAL_NAME=clean(l?.name||state.name||'Player',40);window.GL_PVP_OPPONENT_NAME=clean(o?.name||'Opponent',40);window.GL_PVP_LOCAL_DECK_NAME=localDeckName();window.GL_PVP_OPPONENT_DECK_NAME=opponentDeckName();window.GL_PVP_SHARED_BOARD_ACTIVE=true;window.GL_PVP_CLIENT_MODE=true}

function ensureBattlefieldChrome(){
  if(!activeMatch())return;
  setGlobals();
  const top=document.querySelector('.hand.top .hand-title'),bottom=document.querySelector('.player-name');
  const o=opponent(),l=local();
  if(top){top.innerHTML=signalHtml(signalClass(state.opponentLatencyMs,o?.connected!==false),'Opponent connection')+'<span class="pvp370-identity-text"></span>';top.querySelector('.pvp370-identity-text').textContent=fitIdentity(window.GL_PVP_OPPONENT_NAME,window.GL_PVP_OPPONENT_DECK_NAME)}
  if(bottom){bottom.innerHTML=signalHtml(signalClass(state.latencyMs,state.connected),'Your connection')+'<span class="pvp370-identity-text"></span>';bottom.querySelector('.pvp370-identity-text').textContent=fitIdentity(window.GL_PVP_LOCAL_NAME,window.GL_PVP_LOCAL_DECK_NAME)}
  let timer=document.querySelector('.pvp370-match-timer');const actions=document.querySelector('.bottom-actions');if(actions&&!timer){timer=document.createElement('div');timer.className='pvp370-match-timer';timer.setAttribute('aria-label','Match duration');actions.prepend(timer)}
  if(timer)timer.textContent=formatElapsed(match().startedAt,match().finishedAt);
}
function formatElapsed(start,end){if(!start)return'00:00';const a=Date.parse(start),b=end?Date.parse(end):Date.now();if(!Number.isFinite(a)||!Number.isFinite(b))return'00:00';const sec=Math.max(0,Math.floor((b-a)/1000)),m=Math.floor(sec/60),s=sec%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}

function orientationRoot(){
  let root=$('pvpOrientationRoot');
  if(root)return root;
  root=document.createElement('div');root.id='pvpOrientationRoot';
  document.body.insertBefore(root,document.body.firstChild);
  const movable=[...document.body.children].filter(el=>el!==root&&!['SCRIPT','STYLE','LINK'].includes(el.tagName));
  movable.forEach(el=>root.appendChild(el));
  if(!state.orientationObserver){
    state.orientationObserver=new MutationObserver(records=>{
      records.forEach(rec=>[...rec.addedNodes].forEach(node=>{
        if(node.nodeType!==1||node===root||['SCRIPT','STYLE','LINK'].includes(node.tagName)||node.parentNode!==document.body)return;
        root.appendChild(node);
      }));
    });
    state.orientationObserver.observe(document.body,{childList:true});
  }
  return root;
}

function installDom(){
  document.documentElement.classList.add('pvp-v370');
  const lobby=document.createElement('div');lobby.id='pvp370Lobby';lobby.className='pvp370-lobby';lobby.innerHTML=`<div class="pvp370-page"><header class="pvp370-topbar"><div class="pvp370-logo"><img src="assets/lobby/grandis-legacy-logo.webp" alt="Grandis Legacy"></div><div class="pvp370-heading"><h1>PVP LOBBY</h1><p>Choose your deck, then ready up.</p></div><div id="pvp370Connect" class="pvp370-connect"><i></i><span>Connecting…</span></div></header><main class="pvp370-layout"><section class="pvp370-panel pvp370-deck-panel"><div class="pvp370-picker"><label for="pvp370Deck">Choose a Deck</label><div class="pvp370-select-wrap"><select id="pvp370Deck"></select></div></div><div class="pvp370-title"><h2 id="pvp370DeckTitle">Starter Deck</h2><p id="pvp370DeckClassLine"></p></div><div class="pvp370-showcase"><div class="pvp370-formation-wrap"><div id="pvp370Formation" class="pvp370-formation-host"></div></div><aside class="pvp370-summary"><h3>YOUR DECK</h3><dl id="pvp370DeckStats"></dl></aside></div><div class="pvp370-footer"><input id="pvp370File" type="file" accept="application/json,.json" hidden><button id="pvp370Import" class="pvp370-btn pvp370-gold pvp370-compact" type="button">IMPORT CUSTOM DECK</button><div id="pvp370LoadedDeckStatus" class="pvp370-status"></div></div></section><aside class="pvp370-panel pvp370-room-panel"><h2>ROOM PANEL</h2><label class="pvp370-label" for="pvp370Name">PLAYER NAME</label><div class="pvp370-name"><input id="pvp370Name" maxlength="40" placeholder="Your player name" autocomplete="nickname"></div><div class="pvp370-actions"><button id="pvp370Ready" class="pvp370-btn pvp370-gold" type="button">READY</button></div><div class="pvp370-divider"></div><dl id="pvp370RoomStats" class="pvp370-room-stats"></dl><div id="pvp370Seats" class="pvp370-seats"></div><div id="pvp370Hint" class="pvp370-message"></div><div class="pvp370-room-footer"><button id="pvp370Start" class="pvp370-btn pvp370-gold" type="button">START MATCH</button><button id="pvp370Reconnect" class="pvp370-btn pvp370-outline pvp370-gold-outline" type="button">RECONNECT</button></div><div class="pvp370-version">${esc(VERSION)} · VS AI v6.80 battlefield base</div></aside></main></div>`;orientationRoot().appendChild(lobby);
  const coin=document.createElement('div');coin.id='pvp370Coin';coin.className='pvp370-coin';coin.innerHTML='<section class="pvp370-coin-card"><h2>Opening Coin Flip</h2><div id="pvp370CoinBody"></div></section>';orientationRoot().appendChild(coin);
  $('pvp370Name').value=state.name;
  $('pvp370Name').addEventListener('input',()=>{state.name=clean($('pvp370Name').value,40);saveStore(STORE.name,state.name);updateBudget();});
  $('pvp370Name').addEventListener('change',()=>{if(state.name)send('rename',{name:state.name})});
  $('pvp370Deck').addEventListener('change',()=>selectDeck($('pvp370Deck').value));
  $('pvp370Import').onclick=()=>$('pvp370File').click();
  $('pvp370File').onchange=importDeckFile;
  $('pvp370Ready').onclick=toggleReady;
  $('pvp370Start').onclick=()=>send('start-match',{});
  $('pvp370Reconnect').onclick=()=>connect(true);
  document.addEventListener('click',e=>{const danger=e.target?.closest?.('.bottom-actions .danger');if(!danger||!window.GL_PVP_CLIENT_MODE)return;e.preventDefault();e.stopImmediatePropagation();if(confirm('Surrender this match?'))sendIntent('executeConfirmedSurrender',[])},true);
}
function updateBudget(){}
function renderDeckOptions(){const sel=$('pvp370Deck');if(!sel)return;let options=state.snapshot?.deckOptions||[];if(!options.length)options=Object.entries(window.GL_ACTIVE_STARTER_DECKS||{}).map(([key,v])=>({key,label:v?.label||key}));const current=local()?.deckSource==='custom'?'CUSTOM':(local()?.deckKey||state.deckKey||DEFAULT_DECK_KEY);let html=options.map(d=>'<option value="'+esc(d.key)+'" '+(current===d.key?'selected':'')+'>'+esc(d.label)+'</option>').join('');if(local()?.deckSource==='custom'||state.customDeck)html+='<option value="CUSTOM" selected>'+esc(local()?.deckName||state.customDeckName||'Imported Custom Deck')+'</option>';sel.innerHTML=html}
function syncEngineDeckFromLocal(){const l=local();if(!E()||!l)return;if(l.deckSource==='starter'&&l.deckKey){try{E().selectOptionBDeck('PLAYER',l.deckKey);state.deckKey=l.deckKey;if(l.formation){const view=E().getOptionBLobbyFormationView('PLAYER');const current={};Object.keys(view?.lanes||{}).forEach(k=>current[k]=view.lanes[k].rankOneId);/* server formation is applied by swaps only; reconnect preview can remain canonical if no safe permutation path */}}catch{}}}
function currentFormation(){const view=E()?.getOptionBLobbyFormationView?.('PLAYER'),out={};['LEFT','CENTER','RIGHT'].forEach(l=>out[l]=String(view?.lanes?.[l]?.rankOneId||''));return Object.values(out).every(Boolean)?out:null}
function selectDeck(key){if(!key||key==='CUSTOM')return;const r=E()?.selectOptionBDeck?.('PLAYER',key);if(!r?.ok){setMessage(r?.error||'Could not select deck.',true);return}state.deckKey=key;state.customDeck=null;state.customDeckName='';saveStore(STORE.deck,key);send('set-deck',{deckKey:key,formation:currentFormation()});state.rank=1;renderFormation();renderDeckSummary();updateBudget()}
function importDeckFile(){const file=$('pvp370File')?.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const raw=JSON.parse(String(reader.result||'')),r=E()?.importOptionBDeck?.('PLAYER',raw);if(!r?.ok)throw new Error(r?.error||'Invalid deck file.');state.customDeck=clone(raw);state.customDeckName=clean(r?.state?.player?.deck_name||raw.display_name||raw.deck_name||'Imported Custom Deck',100);state.deckKey='CUSTOM';saveStore(STORE.deck,'CUSTOM');send('set-deck',{customDeck:state.customDeck,deckName:state.customDeckName});renderDeckOptions();renderFormation();renderDeckSummary();updateBudget();setMessage('Custom deck loaded.')}catch(err){setMessage(err?.message||String(err),true)}finally{$('pvp370File').value=''}};reader.onerror=()=>setMessage('Could not read the selected deck file.',true);reader.readAsText(file)}
function swapFormation(a,b){const r=E()?.swapOptionBLobbyFormation?.('PLAYER',a,b);if(!r?.ok)return;const formation=currentFormation();if(state.customDeck){state.customDeck=clone(state.customDeck);state.customDeck.default_formation=clone(formation);send('set-deck',{customDeck:state.customDeck,deckName:state.customDeckName})}else if(state.deckKey)send('set-deck',{deckKey:state.deckKey,formation});renderFormation();renderDeckSummary()}
function cycleRank(delta){E()?.cycleOptionBLobbyRank?.('PLAYER',delta);renderFormation()}
function renderFormation(){const host=$('pvp370Formation');if(!host||!E())return;const view=E().getOptionBLobbyFormationView?.('PLAYER')||{rank:1,lanes:{}},lanes=['LEFT','CENTER','RIGHT'],parts=[];lanes.forEach((lane,i)=>{const id=view.lanes?.[lane]?.previewId||view.lanes?.[lane]?.rankOneId||'',v=id?E().cardView?.(id):null;parts.push('<div class="pvp370-hero">'+(id?'<img src="card-art/'+encodeURIComponent(id)+'.webp" alt="'+esc(v?.name||id)+'">':'')+'<small>'+lane.charAt(0)+lane.slice(1).toLowerCase()+'</small></div>');if(i<2)parts.push('<button class="pvp370-swap" type="button" data-pvp-swap="'+lane+'|'+lanes[i+1]+'"><img src="assets/lobby/swap.png" alt="Swap"></button>')});host.innerHTML='<div class="pvp370-formation">'+parts.join('')+'</div><div class="pvp370-rank"><button type="button" data-pvp-rank="-1">‹</button><strong>RANK '+['I','II','III'][Math.max(1,Math.min(3,Number(view.rank||1)))-1]+'</strong><button type="button" data-pvp-rank="1">›</button></div>';host.querySelectorAll('[data-pvp-swap]').forEach(b=>b.onclick=()=>{const[a,c]=b.dataset.pvpSwap.split('|');swapFormation(a,c)});host.querySelectorAll('[data-pvp-rank]').forEach(b=>b.onclick=()=>cycleRank(Number(b.dataset.pvpRank||0)))}
function toggleReady(){const l=local();if(!l||!state.connected)return;const n=clean($('pvp370Name')?.value||state.name||l.name,40)||l.seatLabel||'Player';if(n!==state.name){state.name=n;saveStore(STORE.name,n);send('rename',{name:n})}if(!l.deckKey&&!state.deckKey&&!state.customDeck){setMessage('Choose a deck before Ready.',true);return}send('ready',{ready:!l.ready})}
function playerSeatHtml(seat){const p=players().find(x=>Number(x.seat)===seat);if(!p)return'<article class="pvp370-seat"><div class="pvp370-seat-top"><span class="pvp370-seat-label">PLAYER '+seat+'</span><span class="pvp370-ready-chip">EMPTY</span></div><strong>Waiting for player…</strong><div class="pvp370-seat-state">offline</div></article>';const online=p.connected!==false;const canKick=seat===2&&Number(local()?.seat)===1&&match().status==='setup';return'<article class="pvp370-seat"><div class="pvp370-seat-top"><span class="pvp370-seat-label">PLAYER '+seat+'</span><span class="pvp370-ready-chip '+(p.ready?'ready':'')+'">'+(p.ready?'READY':'NOT READY')+'</span></div><strong>'+esc(p.name||('Player '+seat))+'</strong><div class="pvp370-seat-state '+(online?'online':'')+'">'+(online?'online':'reconnecting…')+(p.hasDeck?' · Deck loaded':' · No deck')+'</div>'+(canKick?'<button class="pvp370-kick" type="button" title="Remove Player 2"><img src="assets/lobby/exit.png" alt="Remove"></button>':'')+'</article>'}
function renderLobby(){if(!$('pvp370Lobby'))return;const m=match(),show=!activeMatch();$('pvp370Lobby').classList.toggle('open',show);document.body.classList.toggle('pvp-lobby-mode',show);if(show)window.GL_OPTION_B_UI?.setPvpLobbyOpen?.(true);const connect=$('pvp370Connect');if(connect){connect.className='pvp370-connect '+(state.connected?'online':(state.ws&&state.ws.readyState===WebSocket.CONNECTING?'connecting':'offline'));connect.querySelector('span').textContent=statusText()}
  if(!show)return;renderDeckOptions();renderFormation();renderDeckSummary();const l=local();$('pvp370Name').value=state.name||l?.name||'';updateBudget();const roomStats=$('pvp370RoomStats');if(roomStats)roomStats.innerHTML='<div><dt>CONNECTION</dt><dd>'+esc(statusText())+'</dd></div><div><dt>PLAYERS</dt><dd>'+players().filter(p=>p.connected!==false).length+' / 2</dd></div>';$('pvp370Seats').innerHTML=playerSeatHtml(1)+playerSeatHtml(2);const kick=$('pvp370Seats').querySelector('.pvp370-kick');if(kick)kick.onclick=()=>{if(confirm('Remove Player 2 from this lobby?'))send('kick-seat-2',{})};const complete=!!(l&&(l.deckKey||state.deckKey||state.customDeck));const ready=$('pvp370Ready');ready.disabled=!state.connected||!complete||m.status!=='setup';ready.textContent=l?.ready?'UNREADY':'READY';ready.classList.toggle('ready',!!l?.ready);const both=players().length===2&&players().every(p=>p.connected!==false&&p.ready&&p.hasDeck);const start=$('pvp370Start');start.disabled=!(Number(l?.seat)===1&&state.connected&&m.status==='setup'&&both);start.style.display=Number(l?.seat)===1?'block':'none';const hint=$('pvp370Hint');let text=state.message;if(!text){if(!state.connected)text='Connecting to the PvP server…';else if(!complete)text='Enter your name and choose a deck.';else if(Number(l?.seat)===1&&!both)text='Waiting for both players to be READY.';else if(Number(l?.seat)===2)text='Ready up and wait for Player 1 to start the match.'}hint.textContent=text||'';hint.classList.toggle('error',state.messageError||!!state.fatal)}

function coinFace(face){return String(face).toUpperCase()==='TAILS'?'assets/ui/Racial-Token-Tail.webp':'assets/ui/Racial-Token-Head.webp'}
function renderCoin(){const modal=$('pvp370Coin'),body=$('pvp370CoinBody'),m=match(),l=local();if(!modal||!body)return;const open=m.status==='coin-flip'||m.status==='coin-result';modal.classList.toggle('open',open);if(!open)return;window.GL_OPTION_B_UI?.setPvpLobbyOpen?.(false);document.body.classList.remove('pvp-lobby-mode');if(m.status==='coin-flip'){if(Number(l?.seat)===2){body.innerHTML='<p>You call the opening coin. Choose Heads or Tails.</p><div class="pvp370-coin-actions"><button data-coin="HEADS"><img src="'+coinFace('HEADS')+'"><strong>HEADS</strong></button><button data-coin="TAILS"><img src="'+coinFace('TAILS')+'"><strong>TAILS</strong></button></div>';body.querySelectorAll('[data-coin]').forEach(b=>b.onclick=()=>{b.disabled=true;send('choose-coin-flip',{choice:b.dataset.coin})})}else body.innerHTML='<p>Waiting for '+esc(opponent()?.name||'Player 2')+' to choose Heads or Tails…</p>';return}
  const f=m.openingCoinFlip||m.coinFlip||{},winner=clean(f.firstPlayerName||m.firstPlayerName||'Player',40),key=[f.choice,f.outcome,f.firstSeat].join('|');if(state.lastCoinKey!==key){state.lastCoinKey=key;try{B()?.playOpeningCoinSound?.()}catch{}}
  body.innerHTML='<div class="pvp370-coin-winner">'+esc(winner)+' wins the coin flip</div><div class="pvp370-coin-result"><div><span>Player 2 called</span><strong>'+esc(f.choice||'—')+'</strong></div><div><span>Coin result</span><strong>'+esc(f.outcome||'—')+'</strong></div></div><p>'+esc(winner)+' will take the first turn.</p><button class="pvp370-coin-start" type="button">START GAME</button>';body.querySelector('.pvp370-coin-start').onclick=()=>{body.querySelector('.pvp370-coin-start').disabled=true;send('confirm-coin-flip',{})}}

function runtimeBoardHydrated(){const s=B()?.getSnapshot?.()?.appState;if(!s)return false;const ph=s.playerHeroes||{},ah=s.aiHeroes||{};const heroes=['LEFT','CENTER','RIGHT'].every(l=>!!ph?.[l]?.card_id)&&['LEFT','CENTER','RIGHT'].every(l=>!!ah?.[l]?.card_id);const decks=Math.max(Number(s.playerDeckCount||0),Array.isArray(s.playerDeck)?s.playerDeck.length:0)>0&&Math.max(Number(s.aiDeckCount||0),Array.isArray(s.aiDeck)?s.aiDeck.length:0)>0;const shards=(Array.isArray(s.playerManaDeck)&&s.playerManaDeck.length>0)&&(Array.isArray(s.aiManaDeck)&&s.aiManaDeck.length>0);return !!(heroes&&decks&&shards)}
function serverBoardHydrated(board){const s=board?.appState;if(!s)return false;return ['LEFT','CENTER','RIGHT'].every(l=>!!s.playerHeroes?.[l]?.card_id)&&['LEFT','CENTER','RIGHT'].every(l=>!!s.aiHeroes?.[l]?.card_id)&&Math.max(Number(s.playerDeckCount||0),Array.isArray(s.playerDeck)?s.playerDeck.length:0)>0&&Math.max(Number(s.aiDeckCount||0),Array.isArray(s.aiDeck)?s.aiDeck.length:0)>0}
function forceBattlefieldRender(){try{window.GL_OPTION_B_UI?.setPvpLobbyOpen?.(false);window.GL_OPTION_B_UI?.render?.()}catch(err){console.error('[PvP v3.70] battlefield render failed',err)}}
function importBoard(msg){const m=msg.match||{},board=m.serverBoard,seat=msg.local?.seat;if(!board||!seat)return;const rev=Number(m.serverBoardRevision||0),status=String(m.status||'');const same=rev===state.lastAppliedRevision&&status===state.lastAppliedStatus;if(same&&runtimeBoardHydrated())return;try{if(!serverBoardHydrated(board))throw new Error('Authoritative server board is missing Hero/deck state.');adapter()?.setSharedBoardMode?.(true);const firstHydration=state.lastAppliedRevision<0||!runtimeBoardHydrated();let ok;try{ok=adapter()?.importViewerSafeSnapshot?.(board,seat,{skipImportAnimations:firstHydration})}catch(importErr){if(firstHydration)throw importErr;console.warn('[PvP v3.70] animated board import failed; retrying state-only hydration',importErr);ok=adapter()?.importViewerSafeSnapshot?.(board,seat,{skipImportAnimations:true})}if(ok===false||!runtimeBoardHydrated())throw new Error('Viewer-safe board import did not hydrate the local v6.80 runtime.');state.lastAppliedRevision=rev;state.lastAppliedStatus=status;forceBattlefieldRender();requestAnimationFrame(()=>forceBattlefieldRender());setTimeout(()=>forceBattlefieldRender(),60)}catch(err){console.error('[PvP v3.70] board import failed',err);state.lastAppliedRevision=-1;state.lastAppliedStatus='';setMessage('Battlefield sync failed: '+String(err?.message||err),true)}}
function handleSnapshot(msg){state.snapshot=msg;const l=msg.local||{};if(msg.match?.status==='setup'){state.lastAppliedRevision=-1;state.lastAppliedStatus=''}if(l.seatToken){state.seatToken=l.seatToken;saveStore(STORE.token,state.seatToken)}if(l.name){state.name=clean(l.name,40);saveStore(STORE.name,state.name)}if(l.deckKey&&l.deckKey!=='CUSTOM'){state.deckKey=l.deckKey;saveStore(STORE.deck,l.deckKey)}if(msg.match?.status==='setup'&&l.deckSource==='custom'&&l.deckData){const incoming=clone(l.deckData);const incomingName=clean(l.deckName||incoming?.display_name||incoming?.deck_name||'Imported Custom Deck',100);if(!state.customDeck||JSON.stringify(state.customDeck)!==JSON.stringify(incoming)){state.customDeck=incoming;state.customDeckName=incomingName;state.deckKey='CUSTOM';saveStore(STORE.deck,'CUSTOM');const r=E()?.importOptionBDeck?.('PLAYER',state.customDeck);if(!r?.ok)console.warn('[PvP v3.70] custom deck reconnect preview could not be restored:',r?.error||r)}}state.lastRevision=Number(msg.match?.serverBoardRevision||0);setGlobals();if(msg.match?.status==='setup')syncEngineDeckFromLocal();if(msg.match?.status==='setup'&&!l.deckKey&&!l.deckData&&state.deckKey&&state.deckKey!=='CUSTOM')send('set-deck',{deckKey:state.deckKey,formation:currentFormation()});if(activeMatch())importBoard(msg);resolveIntentFromSnapshot(msg);renderLobby();renderCoin();ensureBattlefieldChrome()}
function resolveIntentFromSnapshot(msg){const inflight=state.intentInFlight;if(!inflight)return;const rev=Number(msg.match?.serverBoardRevision||0),last=msg.match?.lastIntent||{};if(rev>inflight.baseRevision||last.clientActionId===inflight.clientActionId){state.intentInFlight=null;pumpIntent()}}
function sendIntent(name,args=[]){name=String(name||'');if(!name)return{ok:false,error:'Missing intent'};state.intentQueue.push({name,args:Array.isArray(args)?args:[],clientActionId:'a'+Date.now().toString(36)+'_'+(++state.actionSeq).toString(36)});pumpIntent();return{ok:true,queued:true}}
function pumpIntent(){if(state.intentInFlight||!state.intentQueue.length||!state.connected||!activeMatch())return;const item=state.intentQueue.shift();item.baseRevision=Number(match().serverBoardRevision||state.lastRevision||0);state.intentInFlight=item;send('runtime-intent',{intent:item.name,args:item.args,baseRevision:item.baseRevision,clientActionId:item.clientActionId})}
function clearIntentQueue(){state.intentQueue.length=0;state.intentInFlight=null}

function scheduleReconnect(){
  if(state.fatal||state.reconnectTimer||navigator.onLine===false)return;
  state.reconnectTimer=setTimeout(()=>{state.reconnectTimer=null;connect(true)},state.reconnectDelay);
  state.reconnectDelay=Math.min(8000,Math.round(state.reconnectDelay*1.55));
}
function connect(force=false){
  if(state.reconnectTimer){clearTimeout(state.reconnectTimer);state.reconnectTimer=null}
  const current=state.ws;
  if(current&&!force&&(current.readyState===WebSocket.OPEN||current.readyState===WebSocket.CONNECTING))return;
  const epoch=++state.socketEpoch;
  if(current){try{current.onopen=current.onmessage=current.onclose=current.onerror=null;current.close()}catch{}}
  state.connected=false;state.ws=null;renderLobby();
  if(navigator.onLine===false){scheduleReconnect();return}
  let ws;try{ws=new WebSocket(wsUrl())}catch(err){state.fatal=String(err?.message||err);renderLobby();return}
  state.ws=ws;
  const live=()=>state.ws===ws&&state.socketEpoch===epoch;
  ws.onopen=()=>{if(!live())return;state.connected=true;state.fatal='';state.messageError=false;state.reconnectDelay=900;state.lastPongAt=Date.now();send('rename',{name:state.name||'Player'});renderLobby();pumpIntent()};
  ws.onmessage=(ev)=>{if(!live())return;let msg;try{msg=JSON.parse(ev.data)}catch{return}if(msg.type==='snapshot'){handleSnapshot(msg);return}if(msg.type==='pong'){const now=Date.now(),sent=Number(msg.clientAt||state.pingAt||0);if(sent)state.latencyMs=Math.max(0,now-sent);state.opponentLatencyMs=msg.opponentLatencyMs==null?state.opponentLatencyMs:Number(msg.opponentLatencyMs);state.lastPongAt=now;ensureBattlefieldChrome();return}if(msg.type==='intent-ack')return;if(msg.type==='notice'){if(msg.kind==='error'){clearIntentQueue();state.messageError=true}state.message=msg.message||'Server notice';renderLobby();return}if(msg.type==='seat-kicked'){state.seatToken='';saveStore(STORE.token,'');state.message=msg.message||'You were removed by Player 1.';state.messageError=true;renderLobby();return}if(msg.type==='fatal'){state.fatal=msg.message||'Connection rejected.';state.messageError=true;renderLobby();try{ws.close()}catch{}}};
  ws.onclose=()=>{if(!live())return;state.connected=false;state.ws=null;clearIntentQueue();renderLobby();scheduleReconnect()};
  ws.onerror=()=>{if(!live())return;renderLobby()};
}
function resetRoom(){send('reset-room',{})}
function boot(){
  state.clientId=makeId();
  state.name=clean(loadStore(STORE.name,'Player'),40)||'Player';
  state.seatToken=loadStore(STORE.token,'');
  const storedDeck=loadStore(STORE.deck,'');
  state.deckKey=storedDeck&&storedDeck!=='CUSTOM'?storedDeck:DEFAULT_DECK_KEY;
  orientationRoot();
  if(state.deckKey){try{E()?.selectOptionBDeck?.('PLAYER',state.deckKey)}catch{}}
  installDom();adapter()?.setSharedBoardMode?.(true);B()?.setSharedBoardMode?.(true);
  window.GL_PVP_NETWORK={version:VERSION,send,sendIntent,getSnapshot:()=>state.snapshot,reconnect:()=>connect(true),resetRoom,surrender:()=>sendIntent('executeConfirmedSurrender',[]),fitIdentity};
  connect();
  setInterval(()=>{if(state.ws?.readyState===WebSocket.OPEN){state.pingAt=Date.now();send('ping',{clientAt:state.pingAt,latencyMs:state.latencyMs})}},10000);
  setInterval(()=>{if(state.ws?.readyState===WebSocket.OPEN&&state.lastPongAt&&Date.now()-state.lastPongAt>45000&&document.visibilityState!=='hidden')connect(true);ensureBattlefieldChrome();if(activeMatch())renderCoin()},1000);
  window.addEventListener('online',()=>{if(!state.ws||state.ws.readyState>WebSocket.OPEN)connect(true)},{passive:true});
  window.addEventListener('pageshow',()=>{if(!state.ws||state.ws.readyState===WebSocket.CLOSED)connect(true)},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&(!state.ws||state.ws.readyState===WebSocket.CLOSED))connect(true)},{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
