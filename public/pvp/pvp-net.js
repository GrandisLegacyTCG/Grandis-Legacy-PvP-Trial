/* Grandis Legacy PvP v3.73.10-debug — v3.51 network/lobby stability + VS AI v6.90.7 battlefield presentation. */
(function(){
'use strict';
const VERSION='Grandis Legacy PvP v3.73.10-debug';
const ROOM='GRANDIS_PVP';
const DEFAULT_DECK_KEY='starter_01_elemental_lord_conqueror_renegade';
const STORE={client:'gl_pvp370_client',name:'gl_pvp370_name',token:'gl_pvp370_seat_token',deck:'gl_pvp370_deck',role:'gl_pvp371_role'};
const state={ws:null,connected:false,snapshot:null,clientId:'',name:'',seatToken:'',deckKey:'',customDeck:null,customDeckName:'',preferredRole:'player',spectatorLobbyView:false,lastRevision:0,lastAppliedRevision:-1,lastAppliedStatus:'',intentQueue:[],intentInFlight:null,actionSeq:0,intentTimeoutTimer:null,intentAckRefreshTimer:null,awaitingResync:false,reconnectTimer:null,reconnectDelay:900,pingAt:0,latencyMs:null,opponentLatencyMs:null,lastPongAt:0,lastCoinKey:'',fatal:'',message:'',messageError:false,rank:1,socketEpoch:0,orientationObserver:null,seatExitHold:false,seenAnimationIds:Object.create(null),claimedAnimationIds:Object.create(null),seenBattleAudioIds:Object.create(null),seenBattleVfxIds:Object.create(null),battleVfxPending:Object.create(null),battlefieldRevealToken:0};
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
function isSpectator(){return local()?.role==='spectator'}
function playerBySeat(seat){return players().find(p=>Number(p.seat)===Number(seat))||null}
function viewerSeat(){return isSpectator()?1:(Number(local()?.seat)||1)}
function opponent(){const l=local();if(isSpectator())return playerBySeat(2);return players().find(p=>Number(p.seat)&&Number(p.seat)!==Number(l?.seat))||null}
function activeMatch(){return ['coin-flip','coin-result','started','finished'].includes(match().status)}
function wsBase(){const protocol=location.protocol==='https:'?'wss:':'ws:';return protocol+'//'+location.host+(cfg().wsPath||'/ws')}
function wsUrl(){const q=new URLSearchParams({room:ROOM,client:state.clientId,name:state.name||'Player',role:state.preferredRole==='spectator'?'spectator':'player',buildId:String(cfg().buildId||'')});if(state.seatToken)q.set('seatToken',state.seatToken);if(state.deckKey&&state.deckKey!=='CUSTOM'&&!state.seatToken&&state.preferredRole!=='spectator')q.set('deck',state.deckKey);return wsBase()+'?'+q.toString()}
function send(type,payload={}){if(!state.ws||state.ws.readyState!==WebSocket.OPEN)return false;state.ws.send(JSON.stringify({type,...payload}));return true}
function setMessage(text,error=false){state.message=String(text||'');state.messageError=!!error;renderLobby()}
function statusText(){if(state.fatal)return state.fatal;if(state.connected)return 'Connected';if(state.ws&&state.ws.readyState===WebSocket.CONNECTING)return 'Connecting…';return 'Disconnected'}
function signalClass(latency,connected=true){if(!connected)return'offline';if(latency==null)return'connecting';latency=Number(latency);if(latency<=80)return'excellent';if(latency<=160)return'good';if(latency<=300)return'fair';return'poor'}
function signalHtml(cls,title){return '<span class="pvp-lobby-signal '+esc(cls)+'" title="'+esc(title||'Connection')+'"><span></span><span></span><span></span><span></span></span>'}
function fitIdentity(value,max=25){const a=chars(clean(value||'',120));if(a.length<=max)return a.join('');return a.slice(0,Math.max(1,max-1)).join('')+'…'}
function battlefieldIdentityLimit(){return document.documentElement.classList.contains('pvp-mobile-device')?20:25}
function identityBoxHtml(kind,name,deck){const limit=battlefieldIdentityLimit(),n=esc(fitIdentity(name||'Player',limit)||'Player'),d=esc(fitIdentity(deck||'Deck',limit)||'Deck');return kind==='opponent'?'<span class="pvp-lobby-identity-box pvp-lobby-identity-box--opponent"><span class="pvp-lobby-id-deck">'+d+'</span><span class="pvp-lobby-id-player">'+n+'</span></span>':'<span class="pvp-lobby-identity-box pvp-lobby-identity-box--player"><span class="pvp-lobby-id-player">'+n+'</span><span class="pvp-lobby-id-deck">'+d+'</span></span>'}
function localDeckName(){if(isSpectator()){const p=playerBySeat(1);return p?.deckName||match()?.deckChoices?.[1]?.deckName||'Deck'}return local()?.deckName||match()?.deckChoices?.[local()?.seat]?.deckName||state.customDeckName||deckLabel(state.deckKey)||'Deck'}
function opponentDeckName(){const o=isSpectator()?playerBySeat(2):opponent();return o?.deckName||match()?.deckChoices?.[o?.seat]?.deckName||'Deck'}
function deckLabel(key){const arr=state.snapshot?.deckOptions||[];const hit=arr.find(x=>x.key===key);if(hit?.label)return hit.label;return window.GL_ACTIVE_STARTER_DECKS?.[key]?.label||key||''}
function selectedDeckData(){
  if(state.customDeck){const raw=state.customDeck;return raw?.deck&&raw.deck.main_deck?raw.deck:raw}
  const key=local()?.deckKey||state.deckKey;return window.GL_ACTIVE_STARTER_DECKS?.[key]?.deck||null
}
function cardLookup(id){const defs=window.GL_CARD_DEFINITIONS||{};if(Array.isArray(defs.cards))return defs.cards.find(c=>c?.card_id===id)||null;for(const fam of Object.values(defs.families||{})){const hit=(fam?.cards||[]).find(c=>c?.card_id===id);if(hit)return hit}return null}
function deckDisplayTitle(deck){const label=local()?.deckName||state.customDeckName||deck?.display_name||deck?.deck_name||deckLabel(state.deckKey)||'Selected Deck';const m=String(label).match(/Starter\s*0?(\d+)/i);return m?'Starter Deck '+Number(m[1]):String(label)}
function deckClassLine(deck){const label=local()?.deckName||state.customDeckName||deck?.display_name||deck?.deck_name||deckLabel(state.deckKey)||'';const parts=String(label).split(/[—-]/);if(parts.length>1)return parts.slice(1).join(' ').trim().replace(/\s*\/\s*/g,', ').toUpperCase();const rows=deck?.legacy_deck_expanded||[],packages={};rows.forEach(x=>{if(String(x?.card_type||'').toLowerCase()==='hero'){(packages[x.package_id||'PACKAGE']||(packages[x.package_id||'PACKAGE']=[])).push(x.card_id)}});const out=[];Object.values(packages).forEach(ids=>{let cls='';ids.forEach(id=>{const c=cardLookup(id);if(Number(c?.rank_numeric)===3)cls=c?.display_class||c?.class||''});if(cls)out.push(cls)});return (out.join(', ')||'CUSTOM DECK').toUpperCase()}
function deckSummary(deck){const stats={heroes:0,legacies:0,skills:0,items:0,events:0,main:0};(deck?.legacy_deck_expanded||deck?.side_deck_expanded||[]).forEach(x=>{const t=String(x?.card_type||'').toLowerCase();if(t==='hero')stats.heroes++;if(t==='legacy')stats.legacies++});(deck?.main_deck||[]).forEach(x=>{const q=Math.max(0,Number(x?.quantity||1)),c=cardLookup(x?.card_id),f=String(c?.family||c?.card_type||'').toLowerCase();stats.main+=q;if(f==='item'||String(x?.card_id||'').includes('-ITM-'))stats.items+=q;else if(f==='event'||String(x?.card_id||'').includes('-EVT-'))stats.events+=q;else stats.skills+=q});return stats}
function renderDeckSummary(){const deck=selectedDeckData(),title=$('pvpLobbyDeckTitle'),line=$('pvpLobbyDeckClassLine'),statsEl=$('pvpLobbyDeckStats'),loaded=$('pvpLobbyLoadedDeckStatus');if(title)title.textContent=deckDisplayTitle(deck);if(line)line.textContent=deck?deckClassLine(deck):'';const st=deckSummary(deck);if(statsEl)statsEl.innerHTML='<div><dt>HEROES</dt><dd>'+st.heroes+'</dd></div><div><dt>LEGACIES</dt><dd>'+st.legacies+'</dd></div><div class="total"><dt>LEGACY DECK</dt><dd>'+(st.heroes+st.legacies)+'</dd></div><div><dt>SKILLS</dt><dd>'+st.skills+'</dd></div><div><dt>ITEM</dt><dd>'+st.items+'</dd></div><div><dt>EVENT</dt><dd>'+st.events+'</dd></div><div class="total"><dt>MAIN DECK</dt><dd>'+st.main+'</dd></div>';if(loaded)loaded.textContent=(local()?.deckSource==='custom'||state.customDeck)?('Custom Deck Loaded: '+(local()?.deckName||state.customDeckName||'Imported Deck')):''}
function setGlobals(){const l=local(),spectator=isSpectator(),p1=playerBySeat(1),p2=playerBySeat(2),o=opponent();window.GL_PVP_LOCAL_ROLE=l?.role||'player';window.GL_PVP_LOCAL_SEAT=spectator?null:(l?.seat||null);window.GL_PVP_VIEWER_SEAT=viewerSeat();window.GL_PVP_LOCAL_NAME=clean(spectator?(p1?.name||'Player 1'):(l?.name||state.name||'Player'),25);window.GL_PVP_OPPONENT_NAME=clean(spectator?(p2?.name||'Player 2'):(o?.name||'Opponent'),25);window.GL_PVP_LOCAL_DECK_NAME=localDeckName();window.GL_PVP_OPPONENT_DECK_NAME=opponentDeckName();window.GL_PVP_SHARED_BOARD_ACTIVE=true;window.GL_PVP_CLIENT_MODE=true}

function uiScale(){const app=document.querySelector('.app');if(!app)return 1;const r=app.getBoundingClientRect(),w=Number(app.offsetWidth||0);return w>0&&r.width>0?r.width/w:1}
function alignPortableBattlefieldChrome(){
  const mobile=document.documentElement.classList.contains('pvp-mobile-device');
  const pool=document.querySelector('.player-mana-pool'),handShell=document.querySelector('.bottom-hud .hand.bottom');
  // Do not move the Mana Pool container to chase the Hand. That caused visible
  // up/down jitter on tablet as the hand rerendered. Keep v6.80 rail geometry fixed;
  // only reserve horizontal room for the pool + identity on portable layouts.
  if(!mobile){if(handShell){handShell.style.removeProperty('--pvp-lobby-hand-left');handShell.style.removeProperty('--pvp-lobby-hand-right')}return}
  const scale=uiScale()||1;
  if(handShell){const poolW=pool?pool.getBoundingClientRect().width/scale:0;const self=document.querySelector('.player-name--self')||document.querySelector('.player-name');const selfW=self?self.getBoundingClientRect().width/scale:0;handShell.style.setProperty('--pvp-lobby-hand-left',Math.max(120,poolW+12).toFixed(2)+'px');handShell.style.setProperty('--pvp-lobby-hand-right',Math.max(130,selfW+14).toFixed(2)+'px')}
}
function ensureBattlefieldChrome(){
  if(!activeMatch())return;
  setGlobals();
  const top=document.querySelector('.hand.top .hand-title')||document.querySelector('.player-name--opponent');
  const bottom=document.querySelector('.player-name--self')||document.querySelector('.player-name:not(.player-name--opponent)')||document.querySelector('.player-name');
  const spectator=isSpectator(),p1=playerBySeat(1),p2=playerBySeat(2),o=opponent();
  if(top){
    const cls=spectator?(p2?.connected===false?'offline':'good'):signalClass(state.opponentLatencyMs,o?.connected!==false);
    top.innerHTML=identityBoxHtml('opponent',window.GL_PVP_OPPONENT_NAME,window.GL_PVP_OPPONENT_DECK_NAME)+signalHtml(cls,spectator?'Player 2 connection':'Opponent connection');
  }
  if(bottom){
    const cls=spectator?(p1?.connected===false?'offline':'good'):signalClass(state.latencyMs,state.connected);
    bottom.innerHTML=signalHtml(cls,spectator?'Player 1 connection':'Your connection')+identityBoxHtml('player',window.GL_PVP_LOCAL_NAME,window.GL_PVP_LOCAL_DECK_NAME);
  }
  const danger=document.querySelector('.bottom-actions .danger');if(danger)danger.textContent=spectator?'BACK TO LOBBY':'SURRENDER';
  let timer=document.querySelector('.pvp-lobby-match-timer');const actions=document.querySelector('.bottom-actions');if(actions&&!timer){timer=document.createElement('div');timer.className='pvp-lobby-match-timer';timer.setAttribute('aria-label','Match duration');actions.prepend(timer)}
  if(timer)timer.textContent=formatElapsed(match().startedAt,match().finishedAt);
  requestAnimationFrame(alignPortableBattlefieldChrome);setTimeout(alignPortableBattlefieldChrome,80);
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
  document.documentElement.classList.add('pvp-fresh-app');document.body.classList.add('pvp-booting');
  const lobby=document.createElement('div');lobby.id='pvpLobby';lobby.className='pvp-lobby';lobby.innerHTML=`<div class="pvp-lobby-page"><header class="pvp-lobby-topbar"><div class="pvp-lobby-logo"><img src="assets/lobby/grandis-legacy-logo.webp" alt="Grandis Legacy"></div><div class="pvp-lobby-heading"><h1>PVP LOBBY</h1><p>Choose your deck, then ready up or spectate.</p></div><nav class="pvp-lobby-top-actions" hidden><a id="pvpLobbyDeckBuilderLink" class="pvp-lobby-btn pvp-lobby-outline">GO TO DECK BUILDER</a><a id="pvpLobbyAiLink" class="pvp-lobby-btn pvp-lobby-blue">GO TO VS AI</a></nav><div id="pvpLobbyConnect" class="pvp-lobby-connect"><i></i><span>Connecting…</span></div></header><main class="pvp-lobby-layout"><section class="pvp-lobby-panel pvp-lobby-deck-panel"><div class="pvp-lobby-picker"><label for="pvpLobbyDeck">Choose a Deck</label><div class="pvp-lobby-select-wrap"><select id="pvpLobbyDeck"></select></div></div><div class="pvp-lobby-title"><h2 id="pvpLobbyDeckTitle">Starter Deck</h2><p id="pvpLobbyDeckClassLine"></p></div><div class="pvp-lobby-showcase"><div class="pvp-lobby-formation-wrap"><div id="pvpLobbyFormation" class="pvp-lobby-formation-host"></div></div><aside class="pvp-lobby-summary"><h3>YOUR DECK</h3><dl id="pvpLobbyDeckStats"></dl></aside></div><div class="pvp-lobby-footer"><input id="pvpLobbyFile" type="file" accept="application/json,.json" hidden><button id="pvpLobbyImport" class="pvp-lobby-btn pvp-lobby-gold pvp-lobby-compact" type="button">IMPORT CUSTOM DECK</button><div id="pvpLobbyLoadedDeckStatus" class="pvp-lobby-status"></div></div></section><aside class="pvp-lobby-panel pvp-lobby-room-panel"><h2>ROOM PANEL</h2><label class="pvp-lobby-label" for="pvpLobbyName">PLAYER NAME</label><div class="pvp-lobby-name"><input id="pvpLobbyName" maxlength="25" placeholder="Your player name" autocomplete="nickname"></div><div class="pvp-lobby-actions"><button id="pvpLobbySpectate" class="pvp-lobby-btn pvp-lobby-outline pvp-lobby-gold-outline" type="button">SPECTATE</button><button id="pvpLobbyReady" class="pvp-lobby-btn pvp-lobby-gold" type="button">READY</button></div><div class="pvp-lobby-divider"></div><div class="pvp-lobby-room-id"><div class="pvp-lobby-room-copy"><span>CURRENT ROOM</span><strong>GRANDIS_PVP</strong></div></div><dl id="pvpLobbyStats" class="pvp-lobby-room-stats" hidden></dl><div id="pvpLobbySeats" class="pvp-lobby-seats"></div><div id="pvpLobbyHint" class="pvp-lobby-message"></div><div class="pvp-lobby-room-footer"><button id="pvpLobbyStart" class="pvp-lobby-btn pvp-lobby-gold" type="button">START MATCH</button><button id="pvpLobbyReconnect" class="pvp-lobby-btn pvp-lobby-outline pvp-lobby-gold-outline" type="button">RECONNECT</button></div><div class="pvp-lobby-version">${esc(VERSION)} · VS AI v6.90.7 battlefield</div></aside></main></div>`;orientationRoot().appendChild(lobby);
  const coin=document.createElement('div');coin.id='pvpLobbyCoin';coin.className='pvp-lobby-coin';coin.innerHTML='<section class="pvp-lobby-coin-card"><h2>Opening Coin Flip</h2><div id="pvpLobbyCoinBody"></div></section>';orientationRoot().appendChild(coin);
  $('pvpLobbyName').value=state.name;
  $('pvpLobbyName').addEventListener('input',()=>{state.name=clean($('pvpLobbyName').value,25);saveStore(STORE.name,state.name);updateBudget();});
  $('pvpLobbyName').addEventListener('change',()=>{if(state.name)send('rename',{name:state.name})});
  $('pvpLobbyDeck').addEventListener('change',()=>{if(!isSpectator())selectDeck($('pvpLobbyDeck').value)});
  $('pvpLobbyImport').onclick=()=>{if(!isSpectator())$('pvpLobbyFile').click()};
  $('pvpLobbyFile').onchange=importDeckFile;
  $('pvpLobbyReady').onclick=toggleReady;
  $('pvpLobbySpectate').onclick=toggleSpectatorRole;
  $('pvpLobbyStart').onclick=()=>send('start-match',{});
  $('pvpLobbyReconnect').onclick=()=>{state.seatExitHold=false;connect(true)};
  document.addEventListener('click',e=>{
    const danger=e.target?.closest?.('.bottom-actions .danger');if(!danger||!window.GL_PVP_CLIENT_MODE)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(isSpectator()){state.spectatorLobbyView=true;renderLobby();return}
    if(confirm('Surrender this match?'))sendIntent('executeConfirmedSurrender',[]);
  },true);
}
function updateBudget(){}
/* ---- Hero progression modal (v3.51 lobby spec, decision #5: HARUS ADA) ---- */
let pvpProgressionToken=0;
function closeHeroProgression(){const m=$('pvpHeroProgressionModal');if(m)m.remove();}
function openLobbyCardPreview(cardId){
  closeHeroProgression();
  if(!cardId)return;
  const v=E()?.cardView?.(cardId);
  const modal=document.createElement('div');
  modal.id='pvpHeroProgressionModal';modal.className='pvp-progression-modal';
  modal.innerHTML='<section class="pvp-progression-card pvp-progression-preview"><header><div><span>CARD PREVIEW</span><h2>'+esc(v?.name||cardId)+'</h2></div><button id="pvpHeroProgressionClose" class="pvp-progression-close" type="button">Close</button></header><img class="pvp-progression-large" src="card-art/'+encodeURIComponent(cardId)+'.webp" alt="'+esc(v?.name||cardId)+'"></section>';
  document.body.appendChild(modal);
  $('pvpHeroProgressionClose').onclick=closeHeroProgression;
  modal.addEventListener('click',ev=>{if(ev.target===modal||ev.target.closest('#pvpHeroProgressionClose'))closeHeroProgression();});
}
function openHeroProgression(rankOneId){
  closeHeroProgression();
  if(!rankOneId||!E())return;
  let ids=[];
  try{ids=(E().getHeroProgression?.('PLAYER',rankOneId)?.ids||[]).filter(Boolean);}catch(e){ids=[];}
  if(ids.length<3)return;
  ids=ids.slice(0,3);
  const token=++pvpProgressionToken;
  const first=E().cardView?.(ids[0]);
  const cards=ids.map((id,index)=>{
    const v=E().cardView?.(id);
    return '<article class="pvp-lobby-hero pvp-progression-hero'+(index===0?' current':'')+'"><button class="pvp-lobby-card pvp-progression-static-card" type="button" data-preview="'+esc(id)+'" aria-label="Preview '+esc(v?.name||id)+' Rank '+(index+1)+'"><img loading="eager" decoding="sync" src="card-art/'+encodeURIComponent(id)+'.webp" alt="'+esc(v?.name||id)+'"></button><div class="pvp-lobby-position">RANK '+['I','II','III'][index]+'</div></article>';
  });
  if(token!==pvpProgressionToken)return;
  const modal=document.createElement('div');
  modal.id='pvpHeroProgressionModal';modal.className='pvp-progression-modal';
  modal.innerHTML='<section class="pvp-progression-card"><header><div><span>HERO PROGRESSION</span><h2>'+esc(first?.name||ids[0])+'</h2></div><button id="pvpHeroProgressionClose" class="pvp-progression-close" type="button">Close</button></header><div class="pvp-progression-row">'+cards[0]+'<span class="pvp-progression-arrow" aria-hidden="true">→</span>'+cards[1]+'<span class="pvp-progression-arrow" aria-hidden="true">→</span>'+cards[2]+'</div><p>Select a Rank card to open Card Preview.</p></section>';
  document.body.appendChild(modal);
  $('pvpHeroProgressionClose').onclick=closeHeroProgression;
  modal.addEventListener('click',ev=>{
    const preview=ev.target&&ev.target.closest&&ev.target.closest('[data-preview]');
    if(preview){ev.preventDefault();ev.stopPropagation();openLobbyCardPreview(preview.getAttribute('data-preview'));return;}
    if(ev.target===modal)closeHeroProgression();
  });
}
document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeHeroProgression();});
function renderDeckOptions(){const sel=$('pvpLobbyDeck');if(!sel)return;let options=state.snapshot?.deckOptions||[];if(!options.length)options=Object.entries(window.GL_ACTIVE_STARTER_DECKS||{}).map(([key,v])=>({key,label:v?.label||key}));const current=local()?.deckSource==='custom'?'CUSTOM':(local()?.deckKey||state.deckKey||DEFAULT_DECK_KEY);let html=options.map(d=>'<option value="'+esc(d.key)+'" '+(current===d.key?'selected':'')+'>'+esc(d.label)+'</option>').join('');if(local()?.deckSource==='custom'||state.customDeck)html+='<option value="CUSTOM" selected>'+esc(local()?.deckName||state.customDeckName||'Imported Custom Deck')+'</option>';sel.innerHTML=html}
function syncEngineDeckFromLocal(){const l=local();if(!E()||!l)return;if(l.deckSource==='starter'&&l.deckKey){try{E().selectOptionBDeck('PLAYER',l.deckKey);state.deckKey=l.deckKey;if(l.formation){const view=E().getOptionBLobbyFormationView('PLAYER');const current={};Object.keys(view?.lanes||{}).forEach(k=>current[k]=view.lanes[k].rankOneId);/* server formation is applied by swaps only; reconnect preview can remain canonical if no safe permutation path */}}catch{}}}
function currentFormation(){const view=E()?.getOptionBLobbyFormationView?.('PLAYER'),out={};['LEFT','CENTER','RIGHT'].forEach(l=>out[l]=String(view?.lanes?.[l]?.rankOneId||''));return Object.values(out).every(Boolean)?out:null}
function selectDeck(key){if(!key||key==='CUSTOM')return;const r=E()?.selectOptionBDeck?.('PLAYER',key);if(!r?.ok){setMessage(r?.error||'Could not select deck.',true);return}state.deckKey=key;state.customDeck=null;state.customDeckName='';saveStore(STORE.deck,key);send('set-deck',{deckKey:key,formation:currentFormation()});state.rank=1;renderFormation();renderDeckSummary();updateBudget()}
function importDeckFile(){const file=$('pvpLobbyFile')?.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const raw=JSON.parse(String(reader.result||'')),r=E()?.importOptionBDeck?.('PLAYER',raw);if(!r?.ok)throw new Error(r?.error||'Invalid deck file.');state.customDeck=clone(raw);state.customDeckName=clean(r?.state?.player?.deck_name||raw.display_name||raw.deck_name||'Imported Custom Deck',100);state.deckKey='CUSTOM';saveStore(STORE.deck,'CUSTOM');send('set-deck',{customDeck:state.customDeck,deckName:state.customDeckName});renderDeckOptions();renderFormation();renderDeckSummary();updateBudget();setMessage('Custom deck loaded.')}catch(err){setMessage(err?.message||String(err),true)}finally{$('pvpLobbyFile').value=''}};reader.onerror=()=>setMessage('Could not read the selected deck file.',true);reader.readAsText(file)}
function swapFormation(a,b){const r=E()?.swapOptionBLobbyFormation?.('PLAYER',a,b);if(!r?.ok)return;const formation=currentFormation();if(state.customDeck){state.customDeck=clone(state.customDeck);state.customDeck.default_formation=clone(formation);send('set-deck',{customDeck:state.customDeck,deckName:state.customDeckName})}else if(state.deckKey)send('set-deck',{deckKey:state.deckKey,formation});renderFormation();renderDeckSummary()}
function cycleRank(delta){E()?.cycleOptionBLobbyRank?.('PLAYER',delta);renderFormation()}
function renderFormation(){const host=$('pvpLobbyFormation');if(!host||!E())return;const view=E().getOptionBLobbyFormationView?.('PLAYER')||{rank:1,lanes:{}},lanes=['LEFT','CENTER','RIGHT'],parts=[];lanes.forEach((lane,i)=>{const id=view.lanes?.[lane]?.previewId||view.lanes?.[lane]?.rankOneId||'',rankOne=view.lanes?.[lane]?.rankOneId||'',v=id?E().cardView?.(id):null;parts.push('<div class="pvp-lobby-hero"'+(rankOne?' data-pvp-progression="'+esc(rankOne)+'" role="button" tabindex="0" title="View Hero Progression"':'')+'>'+(id?'<img src="card-art/'+encodeURIComponent(id)+'.webp" alt="'+esc(v?.name||id)+'">':'')+'<small>'+lane.charAt(0)+lane.slice(1).toLowerCase()+'</small></div>');if(i<2)parts.push('<button class="pvp-lobby-swap" type="button" data-pvp-swap="'+lane+'|'+lanes[i+1]+'"><img src="assets/lobby/swap.png" alt="Swap"></button>')});host.innerHTML='<div class="pvp-lobby-formation">'+parts.join('')+'</div><div class="pvp-lobby-rank"><button type="button" data-pvp-rank="-1">‹</button><strong>RANK '+['I','II','III'][Math.max(1,Math.min(3,Number(view.rank||1)))-1]+'</strong><button type="button" data-pvp-rank="1">›</button></div>';host.querySelectorAll('[data-pvp-swap]').forEach(b=>b.onclick=()=>{const[a,c]=b.dataset.pvpSwap.split('|');swapFormation(a,c)});host.querySelectorAll('[data-pvp-rank]').forEach(b=>b.onclick=()=>cycleRank(Number(b.dataset.pvpRank||0)));host.querySelectorAll('[data-pvp-progression]').forEach(el=>{el.onclick=e=>{e.preventDefault();openHeroProgression(el.dataset.pvpProgression)};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openHeroProgression(el.dataset.pvpProgression)}}})}
function toggleSpectatorRole(){
  const l=local();if(!state.connected||!l)return;
  if(isSpectator()&&activeMatch()){state.spectatorLobbyView=false;renderLobby();forceBattlefieldRender();ensureBattlefieldChrome();return}
  if(match().status!=='setup'){setMessage('Role switching is only available in setup lobby.',true);return}
  const next=isSpectator()?'player':'spectator';
  state.preferredRole=next;saveStore(STORE.role,next);
  send('switch-role',{role:next});
}
function toggleReady(){const l=local();if(!l||!state.connected)return;const n=clean($('pvpLobbyName')?.value||state.name||l.name,25)||l.seatLabel||'Player';if(n!==state.name){state.name=n;saveStore(STORE.name,n);send('rename',{name:n})}if(!l.deckKey&&!state.deckKey&&!state.customDeck){setMessage('Choose a deck before Ready.',true);return}send('ready',{ready:!l.ready})}
function playerSeatHtml(seat){
  const p=players().find(x=>Number(x.seat)===seat);
  if(!p)return'<article class="pvp-lobby-seat"><div class="pvp-lobby-seat-top"><span class="pvp-lobby-seat-label">PLAYER '+seat+'</span><span class="pvp-lobby-ready-chip">EMPTY</span></div><strong>Waiting for player…</strong><div class="pvp-lobby-seat-state">offline</div></article>';
  const online=p.connected!==false,l=local(),localSeat=Number(l?.seat||0),isSelf=p.clientId===l?.clientId;
  const canRemove=match().status==='setup'&&(isSelf||(localSeat===1&&seat===2)||(localSeat===2&&seat===1&&!online));
  const title=isSelf?'Leave Seat':(localSeat===2&&seat===1?'Remove Offline Player 1':'Remove Player 2');
  return'<article class="pvp-lobby-seat"><div class="pvp-lobby-seat-top"><span class="pvp-lobby-seat-label">PLAYER '+seat+'</span><span class="pvp-lobby-ready-chip '+(p.ready?'ready':'')+'">'+(p.ready?'READY':'NOT READY')+'</span></div><strong>'+esc(p.name||('Player '+seat))+'</strong><div class="pvp-lobby-seat-state '+(online?'online':'')+'">'+(online?'online':'reconnecting…')+(p.hasDeck?' · Deck loaded':' · No deck')+'</div>'+(canRemove?'<button class="pvp-lobby-kick" type="button" data-target-seat="'+seat+'" data-self="'+(isSelf?'1':'0')+'" title="'+esc(title)+'"><img src="assets/lobby/exit.png" alt="'+esc(title)+'"></button>':'')+'</article>';
}
function renderLobby(){
  if(!$('pvpLobby'))return;
  const m=match(),spectator=isSpectator(),show=!activeMatch()||(spectator&&state.spectatorLobbyView);
  $('pvpLobby').classList.toggle('open',show);document.body.classList.toggle('pvp-lobby-mode',show);
  document.body.classList.toggle('pvp-booting',show);
  document.body.classList.toggle('pvp-spectator-mode',spectator);
  if(show)window.GL_OPTION_B_UI?.setPvpLobbyOpen?.(true);else window.GL_OPTION_B_UI?.setPvpLobbyOpen?.(false);
  const connect=$('pvpLobbyConnect');if(connect){connect.className='pvp-lobby-connect '+(state.connected?'online':(state.ws&&state.ws.readyState===WebSocket.CONNECTING?'connecting':'offline'));connect.querySelector('span').textContent=statusText()}
  if(!show)return;
  renderDeckOptions();renderFormation();renderDeckSummary();
  const l=local();$('pvpLobbyName').value=state.name||l?.name||'';updateBudget();
  $('pvpLobbySeats').innerHTML=playerSeatHtml(1)+playerSeatHtml(2);
  $('pvpLobbySeats').querySelectorAll('.pvp-lobby-kick').forEach(btn=>{btn.onclick=()=>{const targetSeat=Number(btn.dataset.targetSeat||0),self=btn.dataset.self==='1';const prompt=self?('Leave Player '+targetSeat+' seat?'):(targetSeat===1?'Remove offline Player 1 from this lobby?':'Remove Player 2 from this lobby?');if(confirm(prompt))send('remove-seat',{seat:targetSeat})}});
  // Hidden for now (trial): room counters. Kept in DOM so they can be unhidden later.
  const stats=$('pvpLobbyStats');
  if(stats){const ps=players();stats.innerHTML='<div><dt>PLAYERS</dt><dd>'+ps.length+'/2</dd></div><div><dt>SPECTATORS</dt><dd>—</dd></div>';}
  const complete=!spectator&&!!(l&&(l.deckKey||state.deckKey||state.customDeck));
  const ready=$('pvpLobbyReady');ready.disabled=spectator||!state.connected||!complete||m.status!=='setup';ready.textContent=l?.ready?'UNREADY':'READY';ready.classList.toggle('ready',!!l?.ready);
  const spectate=$('pvpLobbySpectate');if(spectate){
    spectate.textContent=spectator?(activeMatch()?'SPECTATE MATCH':'JOIN AS PLAYER'):'SPECTATE';
    spectate.disabled=!state.connected||(!spectator&&m.status!=='setup')||(spectator&&!activeMatch()&&m.status!=='setup');
  }
  const deckSelect=$('pvpLobbyDeck'),deckImport=$('pvpLobbyImport');if(deckSelect)deckSelect.disabled=spectator||m.status!=='setup';if(deckImport)deckImport.disabled=spectator||m.status!=='setup';
  document.querySelectorAll('#pvpLobbyFormation button').forEach(btn=>btn.disabled=spectator||m.status!=='setup');
  const both=players().length===2&&players().every(p=>p.connected!==false&&p.ready&&p.hasDeck);
  const start=$('pvpLobbyStart');start.disabled=!(Number(l?.seat)===1&&state.connected&&m.status==='setup'&&both);start.style.display=!spectator&&Number(l?.seat)===1?'block':'none';
  const hint=$('pvpLobbyHint');let text=state.message;
  if(!text){
    if(!state.connected)text='Connecting to the PvP server…';
    else if(spectator)text=activeMatch()?'Spectator mode is read-only. Both Hands remain hidden. Select SPECTATE MATCH to return to the battlefield.':'Spectator mode is read-only. Both Hands remain hidden.';
    else if(!complete)text='Enter your name and choose a deck.';
    else if(Number(l?.seat)===1&&!both)text='Waiting for both players to be READY.';
    else if(Number(l?.seat)===2)text='Ready up and wait for Player 1 to start the match.';
  }
  hint.textContent=text||'';hint.classList.toggle('error',state.messageError||!!state.fatal);
}

function coinFace(face){return String(face).toUpperCase()==='TAILS'?'assets/ui/Racial-Token-Tail.webp':'assets/ui/Racial-Token-Head.webp'}
function renderCoin(){
  const modal=$('pvpLobbyCoin'),body=$('pvpLobbyCoinBody'),m=match(),l=local();if(!modal||!body)return;
  const coinState=m.status==='coin-flip'||m.status==='coin-result';
  // Modal tutup segera setelah match start. Animasi deal jalan di board yang
  // terlihat (prime sembunyikan kartu + 380ms jeda), jadi tidak ada flash.
  const open=coinState;
  modal.classList.toggle('open',open);
  document.body.classList.toggle('pvp-coin-gate',open);
  if(!open)return;
  window.GL_OPTION_B_UI?.setPvpLobbyOpen?.(false);document.body.classList.remove('pvp-lobby-mode');
  if(m.status==='coin-flip'){
    const coinBtns='<div class="pvp-lobby-coin-actions"><button data-coin="HEADS" disabled><img src="'+coinFace('HEADS')+'"><strong>HEADS</strong></button><button data-coin="TAILS" disabled><img src="'+coinFace('TAILS')+'"><strong>TAILS</strong></button></div>';
    if(Number(l?.seat)===2){
      body.innerHTML='<p>You call the opening coin. Choose Heads or Tails.</p><div class="pvp-lobby-coin-actions"><button data-coin="HEADS"><img src="'+coinFace('HEADS')+'"><strong>HEADS</strong></button><button data-coin="TAILS"><img src="'+coinFace('TAILS')+'"><strong>TAILS</strong></button></div>';
      body.querySelectorAll('[data-coin]').forEach(b=>b.onclick=()=>{b.disabled=true;send('choose-coin-flip',{choice:b.dataset.coin})});
    }else body.innerHTML='<p>'+esc(opponent()?.name||'Player 2')+' is choosing Heads or Tails…</p>'+coinBtns;
    return;
  }
  const f=m.openingCoinFlip||m.coinFlip||{},winner=clean(f.firstPlayerName||m.firstPlayerName||'Player',25),key=[f.choice,f.outcome,f.firstSeat].join('|');
  const outcome=String(f.outcome||'HEADS'),choice=String(f.choice||'—');
  const caller=clean(playerBySeat(2)?.name||'Player 2',25);
  const finalHtml=()=>'<div class="pvp-lobby-coin-winner"><span>WINNER</span><strong>'+esc(winner)+'</strong></div><p class="pvp-lobby-coin-first">'+esc(winner)+' takes the first Draw Phase.</p><div class="pvp-lobby-coin-faces"><div><span>'+esc(caller)+' chose</span><img src="'+coinFace(choice)+'" alt="'+esc(choice)+'"></div><div><span>Coin result</span><img src="'+coinFace(outcome)+'" alt="'+esc(outcome)+'"></div></div>'+(isSpectator()?'<p>Waiting for a player to start the battlefield…</p>':'<button class="pvp-lobby-coin-start" type="button">START GAME</button>');
  const wireStart=()=>{const start=body.querySelector('.pvp-lobby-coin-start');if(start)start.onclick=()=>{
    if(match().status==='started'){
      // Match sudah di-start pemain lain; server akan reject confirm baru.
      // Langsung tutup modal saja.
      document.body.classList.remove('pvp-coin-gate');renderCoin();return;
    }
    start.disabled=true;start.textContent='STARTING…';
    document.body.classList.add('pvp-coin-gate');
    console.log('[PvP fresh] sending confirm-coin-flip');
    if(!send('confirm-coin-flip',{})){
      console.warn('[PvP fresh] WebSocket not open; cannot send confirm-coin-flip');
      start.disabled=false;start.textContent='START GAME';
      document.body.classList.remove('pvp-coin-gate');
      return;
    }
    // Anti-stuck: kalau server tidak merespon dalam 6 detik, aktifkan lagi tombolnya.
    clearTimeout(wireStart._t);
    wireStart._t=setTimeout(()=>{
      if(match().status!=='started'){
        console.warn('[PvP fresh] confirm-coin-flip timed out; re-enabling START GAME');
        start.disabled=false;start.textContent='START GAME';
        document.body.classList.remove('pvp-coin-gate');
      }
    },6000);
  }};
  if(state.lastCoinKey!==key){
    // Phase 1: coin spins, winner stays hidden until it lands.
    state.lastCoinKey=key;state.coinSpinKey=key;
    try{B()?.playOpeningCoinSound?.()}catch{}
    body.innerHTML='<div class="pvp-lobby-coin-flipping"><div class="pvp-lobby-coin-spinner"><img src="'+coinFace('HEADS')+'" alt="Heads"><img src="'+coinFace('TAILS')+'" alt="Tails"></div><p>Flipping the coin…</p></div>';
    setTimeout(()=>{if(state.coinSpinKey!==key)return;state.coinSpinKey=null;body.innerHTML=finalHtml();wireStart()},1400);
    return;
  }
  if(state.coinSpinKey===key)return; // spin in progress — don't disturb it
  body.innerHTML=finalHtml();wireStart();
}

function runtimeBoardHydrated(){const s=B()?.getSnapshot?.()?.appState;if(!s)return false;const ph=s.playerHeroes||{},ah=s.aiHeroes||{};const heroes=['LEFT','CENTER','RIGHT'].every(l=>!!ph?.[l]?.card_id)&&['LEFT','CENTER','RIGHT'].every(l=>!!ah?.[l]?.card_id);const decks=Math.max(Number(s.playerDeckCount||0),Array.isArray(s.playerDeck)?s.playerDeck.length:0)>0&&Math.max(Number(s.aiDeckCount||0),Array.isArray(s.aiDeck)?s.aiDeck.length:0)>0;const shards=(Array.isArray(s.playerManaDeck)&&s.playerManaDeck.length>0)&&(Array.isArray(s.aiManaDeck)&&s.aiManaDeck.length>0);return !!(heroes&&decks&&shards)}
function serverBoardHydrated(board){const s=board?.appState;if(!s)return false;return ['LEFT','CENTER','RIGHT'].every(l=>!!s.playerHeroes?.[l]?.card_id)&&['LEFT','CENTER','RIGHT'].every(l=>!!s.aiHeroes?.[l]?.card_id)&&Math.max(Number(s.playerDeckCount||0),Array.isArray(s.playerDeck)?s.playerDeck.length:0)>0&&Math.max(Number(s.aiDeckCount||0),Array.isArray(s.aiDeck)?s.aiDeck.length:0)>0}
function forceBattlefieldRender(){try{window.GL_OPTION_B_UI?.setPvpLobbyOpen?.(false);window.GL_OPTION_B_UI?.render?.()}catch(err){console.error('[PvP fresh] battlefield render failed',err)}}
function swapSideForSeat(side,seat){if(Number(seat)!==2)return side;return side==='PLAYER'?'AI':(side==='AI'?'PLAYER':side)}
function localizeAnimationEvent(evt,seat){
  if(!evt)return null;const x=clone(evt);
  ['side','actor_side','source_side','target_side'].forEach(k=>{if(x[k])x[k]=swapSideForSeat(x[k],seat)});
  if(x.destination?.side)x.destination.side=swapSideForSeat(x.destination.side,seat);
  if(x.kind==='draw_batch'&&Array.isArray(x.events))x.events=x.events.map(e=>localizeAnimationEvent(e,seat));
  if(x.kind==='opening_sequence'){
    ['opening_draw_events','post_opening_draw_events'].forEach(k=>{if(Array.isArray(x[k]))x[k]=x[k].map(e=>localizeAnimationEvent(e,seat))});
    ['starting_shard_entries','post_opening_shard_entries'].forEach(k=>{if(Array.isArray(x[k]))x[k]=x[k].map(e=>{const y=clone(e);if(y.side)y.side=swapSideForSeat(y.side,seat);return y})});
  }
  if(x.kind==='shard_gain'&&Array.isArray(x.entries))x.entries=x.entries.map(e=>{const y=clone(e);if(y.side)y.side=swapSideForSeat(y.side,seat);return y});
  if(x.kind==='draw_then_shards'){
    if(Array.isArray(x.draw_specs))x.draw_specs=x.draw_specs.map(e=>localizeAnimationEvent(e,seat));
    if(Array.isArray(x.shard_entries))x.shard_entries=x.shard_entries.map(e=>{const y=clone(e);if(y.side)y.side=swapSideForSeat(y.side,seat);return y});
  }
  return x;
}
function pruneSeenMap(map,max=640,keep=320){const keys=Object.keys(map||{});if(keys.length>max)keys.slice(0,keys.length-keep).forEach(k=>delete map[k])}
function unseenAnimationEvents(m){const list=Array.isArray(m?.lastAnimationEvents)?m.lastAnimationEvents.slice():(m?.lastAnimationEvent?[m.lastAnimationEvent]:[]);return list.filter(raw=>raw&&raw.id&&!state.seenAnimationIds[raw.id]&&!state.claimedAnimationIds[raw.id])}
function prepareAuthoritativeAnimations(m,seat){
  const A=window.GL_PVP_ANIMATOR;if(!A)return[];
  const plans=[];
  unseenAnimationEvents(m).forEach(raw=>{
    const evt=localizeAnimationEvent(raw,seat),plan={event:evt,animatorPlan:null,captured:null};
    if(evt.kind==='opening_sequence'){
      plan.captured={opening_draw_events:(evt.opening_draw_events||[]).slice(),starting_shard_entries:(evt.starting_shard_entries||[]).slice(),post_opening_draw_events:(evt.post_opening_draw_events||[]).slice(),post_opening_shard_entries:(evt.post_opening_shard_entries||[]).slice()};
    }else{
      // Two-phase: capture source rect from CURRENT (pre-import) visible DOM.
      // GL_PVP_ANIMATOR replaces the old GL_LOCAL_AI_BRIDGE capture path, whose
      // selectors targeted the hidden .ob-engine-host DOM and never produced motion.
      try{ plan.animatorPlan=A.prepare(evt); }catch(e){ plan.animatorPlan=null; }
    }
    plan.rawId=raw.id;state.claimedAnimationIds[raw.id]=true;plans.push(plan);
  });
  pruneSeenMap(state.claimedAnimationIds);return plans;
}
function playAuthoritativeAnimations(plans){
  const A=window.GL_PVP_ANIMATOR,ob=window.GL_OPTION_B_PRESENTATION;let ok=false;
  const finish=(plan,handled)=>{const id=plan?.rawId||plan?.event?.id;if(id){delete state.claimedAnimationIds[id];if(handled)state.seenAnimationIds[id]=true}if(handled)ok=true};
  (plans||[]).forEach(plan=>{
    const evt=plan?.event;if(!evt){finish(plan,false);return}
    if(evt.kind==='battle_feedback'){finish(plan,true);return}
    if(plan.primed){finish(plan,true);return} // opening sudah di-prime; animasi via playPrimedOpeningSequence
    let handled=false;
    try{
      if(evt.kind==='opening_sequence'&&plan.captured&&ob?.queueAuthoritativeOpeningSequence){
        handled=!!ob.queueAuthoritativeOpeningSequence(plan.captured.opening_draw_events||[],plan.captured.starting_shard_entries||[],plan.captured.post_opening_draw_events||[],plan.captured.post_opening_shard_entries||[]);
      }else if(['draw','draw_batch','draw_then_shards','shard_gain','rank_up','legacy_to_field'].includes(evt.kind)){
        handled=true; // Option-B derives these motions from the imported authoritative state/presentation ledger.
      }else if(A&&plan.animatorPlan){
        // Visible Option-B motion: fly from captured pre-import rect to live anchor.
        handled=!!A.play(plan.animatorPlan);
      }else if(A){
        var p=null;try{p=A.prepare(evt);}catch(e){}
        handled=!!(p&&A.play(p));
      }
    }catch(err){console.warn('[PvP fresh] authoritative animation playback failed',evt.kind,err);handled=false}
    finish(plan,handled);
  });
  pruneSeenMap(state.seenAnimationIds);pruneSeenMap(state.claimedAnimationIds);return ok;
}
function battleFeedbackFromPlans(plans){return(plans||[]).map(p=>p?.event).filter(evt=>evt?.kind==='battle_feedback').map(evt=>({id:evt.id||null,kind:evt.feedback_kind==='heal'?'heal':'attack',side:evt.side,lane:evt.lane,card_id:evt.card_id||null,outcome:evt.outcome||'hit',attack_kind:evt.attack_kind||'P',defense_kind:evt.defense_kind||null,has_damage:!!evt.has_damage,play_sound:evt.play_sound!==false}))}
function playBattleAudioNow(events){
  const b=B();if(!b?.playAuthoritativeBattleFeedbackAudio)return false;let ok=false;
  for(const evt of events||[]){if(!evt?.id||state.seenBattleAudioIds[evt.id])continue;try{ok=!!b.playAuthoritativeBattleFeedbackAudio(evt)||ok}catch(err){console.warn('[PvP fresh] battle audio failed',err)}state.seenBattleAudioIds[evt.id]=true}
  pruneSeenMap(state.seenBattleAudioIds);return ok;
}
function scheduleBattleVfx(events){
  if(!B()?.playAuthoritativeBattleFeedback)return false;let queued=false;
  for(const raw of events||[]){
    if(!raw?.id||state.seenBattleVfxIds[raw.id]||state.battleVfxPending[raw.id])continue;
    queued=true;state.battleVfxPending[raw.id]=true;const evt=raw;let attempt=0;
    const tryPlay=()=>{
      if(state.seenBattleVfxIds[evt.id]){delete state.battleVfxPending[evt.id];return}
      attempt++;let played=false;
      try{played=!!B()?.playAuthoritativeBattleFeedback?.(evt)}catch(err){console.warn('[PvP fresh] battle VFX retry failed',err)}
      if(played){state.seenBattleVfxIds[evt.id]=true;delete state.battleVfxPending[evt.id];pruneSeenMap(state.seenBattleVfxIds);return}
      if(attempt>=14){delete state.battleVfxPending[evt.id];console.warn('[PvP fresh] battle VFX anchor never became ready',evt);return}
      setTimeout(()=>{if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>requestAnimationFrame(tryPlay));else tryPlay()},Math.min(180,25+attempt*18));
    };
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>requestAnimationFrame(tryPlay));else setTimeout(tryPlay,34);
  }return queued;
}
function revealBattlefieldWhenAnchored(callback){
  const token=++state.battlefieldRevealToken;
  forceBattlefieldRender();
  const done=()=>{if(token!==state.battlefieldRevealToken)return;document.body.classList.remove('pvp-coin-gate');renderCoin();ensureBattlefieldChrome();if(typeof callback==='function'){
    // PvP fresh: biarkan board kosong terlihat sejenak ("from 0") sebelum kartu
    // di-deal satu-satu, agar sensasi draw kelihatan jelas.
    setTimeout(()=>{if(token!==state.battlefieldRevealToken)return;callback()},380);
  }};
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>requestAnimationFrame(done));else setTimeout(done,32);
}
function importBoard(msg){
  const m=msg.match||{},board=m.serverBoard,seat=msg.local?.role==='spectator'?1:Number(msg.local?.seat||0);if(!board||!seat)return;
  const rev=Number(m.serverBoardRevision||0),status=String(m.status||''),same=rev===state.lastAppliedRevision&&status===state.lastAppliedStatus;
  if(same&&runtimeBoardHydrated())return;
  try{
    if(!serverBoardHydrated(board))throw new Error('Authoritative server board is missing Hero/deck state.');
    adapter()?.setSharedBoardMode?.(true);
    // Follow the proven PvP v3.51 orchestration: capture from the old board, fire
    // authoritative battle SFX immediately, import the new state, then queue all
    // non-battle motions without an extra paint delay. Battle VFX alone waits for
    // the imported Hero anchors to become paint-ready.
    const animationPlans=prepareAuthoritativeAnimations(m,seat),battleFeedback=battleFeedbackFromPlans(animationPlans);
    if(battleFeedback.length)playBattleAudioNow(battleFeedback);
    const ok=adapter()?.importViewerSafeSnapshot?.(board,seat,{skipImportAnimations:true});
    if(ok===false||!runtimeBoardHydrated())throw new Error('Viewer-safe board import did not hydrate the local shared runtime.');
    state.lastAppliedRevision=rev;state.lastAppliedStatus=status;
    const ob=window.GL_OPTION_B_PRESENTATION;
    const openingPlan=(animationPlans||[]).find(p=>p?.event?.kind==='opening_sequence');
    // PvP fresh: first reveal dideteksi dari transisi state (coin-result -> started),
    // bukan dari class DOM lokal pvp-booting (hanya ada di browser yang klik START GAME).
    const firstStartedReveal=status==='started'&&['coin-flip','coin-result','setup'].includes(state.lastAppliedStatus);
    // PvP fresh: opening draw harus dari 0. Prime (sembunyikan kartu) SEBELUM board
    // di-reveal, agar user tidak pernah melihat full hand sebelum animasi.
    let openingPrimed=false;
    if(firstStartedReveal&&openingPlan?.captured&&ob?.primeAuthoritativeOpeningSequence){
      openingPrimed=!!ob.primeAuthoritativeOpeningSequence(
        openingPlan.captured.opening_draw_events||[],
        openingPlan.captured.starting_shard_entries||[],
        openingPlan.captured.post_opening_draw_events||[],
        openingPlan.captured.post_opening_shard_entries||[]
      );
      if(openingPrimed){
        // Tandai sudah di-prime agar playAuthoritativeAnimations melewatinya.
        openingPlan.primed=true;
        const id=openingPlan.rawId||openingPlan.event?.id;
        if(id){delete state.claimedAnimationIds[id];state.seenAnimationIds[id]=true;}
      }
    }
    const playImportedPresentation=()=>{
      if(!openingPrimed)forceBattlefieldRender();
      playAuthoritativeAnimations(animationPlans);
      if(openingPrimed&&ob?.playPrimedOpeningSequence)ob.playPrimedOpeningSequence();
      ensureBattlefieldChrome();
      if(battleFeedback.length)scheduleBattleVfx(battleFeedback);
    };
    if(firstStartedReveal){
      // Reveal after the visible Option-B DOM has had two paint frames. The opening
      // presentation itself waits only for its Main/Shard Deck + Hand/Pool anchors.
      revealBattlefieldWhenAnchored(playImportedPresentation);
    }else{
      // Normal gameplay revisions must not wait two RAFs before Draw / Rank Up /
      // Card / Shard sound+motion. This is the key PvP v3.51 timing behavior.
      playImportedPresentation();
    }
  }catch(err){console.error('[PvP fresh] board import failed',err);state.lastAppliedRevision=-1;state.lastAppliedStatus='';setMessage('Battlefield sync failed: '+String(err?.message||err),true)}
}
function handleSnapshot(msg){
  const previousRole=local()?.role||null;
  state.snapshot=msg;const l=msg.local||{},status=String(msg.match?.status||'');
  state.awaitingResync=false;clearIntentAckRefresh();
  if(status==='setup'){
    state.lastAppliedRevision=-1;state.lastAppliedStatus='';state.seenAnimationIds=Object.create(null);state.claimedAnimationIds=Object.create(null);state.seenBattleAudioIds=Object.create(null);state.seenBattleVfxIds=Object.create(null);state.battleVfxPending=Object.create(null);
  }else if(status==='coin-flip'||status==='coin-result')document.body.classList.add('pvp-coin-gate');
  else document.body.classList.remove('pvp-coin-gate');
  if(l.role){state.preferredRole=l.role==='spectator'?'spectator':'player';saveStore(STORE.role,state.preferredRole)}
  if(l.role==='spectator'){state.seatToken='';saveStore(STORE.token,'')}
  if(l.seatToken){state.seatToken=l.seatToken;saveStore(STORE.token,state.seatToken)}
  if(l.name){state.name=clean(l.name,25);saveStore(STORE.name,state.name)}
  if(l.deckKey&&l.deckKey!=='CUSTOM'){state.deckKey=l.deckKey;saveStore(STORE.deck,l.deckKey)}
  if(status==='setup'&&l.deckSource==='custom'&&l.deckData){
    const incoming=clone(l.deckData),incomingName=clean(l.deckName||incoming?.display_name||incoming?.deck_name||'Imported Custom Deck',100);
    if(!state.customDeck||JSON.stringify(state.customDeck)!==JSON.stringify(incoming)){state.customDeck=incoming;state.customDeckName=incomingName;state.deckKey='CUSTOM';saveStore(STORE.deck,'CUSTOM');const r=E()?.importOptionBDeck?.('PLAYER',state.customDeck);if(!r?.ok)console.warn('[PvP fresh] custom deck reconnect preview could not be restored:',r?.error||r)}
  }
  if(previousRole&&previousRole!==l.role)state.message='';
  if(l.role==='spectator'&&activeMatch()&&previousRole!=='spectator')state.spectatorLobbyView=false;
  state.lastRevision=Number(msg.match?.serverBoardRevision||0);setGlobals();if(status==='setup'&&l.role==='player')syncEngineDeckFromLocal();
  if(status==='setup'&&l.role==='player'&&!l.deckKey&&!l.deckData&&state.deckKey&&state.deckKey!=='CUSTOM')send('set-deck',{deckKey:state.deckKey,formation:currentFormation()});
  if(activeMatch())importBoard(msg);
  resolveIntentFromSnapshot(msg);renderLobby();renderCoin();ensureBattlefieldChrome();
}
function clearIntentAckRefresh(){if(state.intentAckRefreshTimer){clearTimeout(state.intentAckRefreshTimer);state.intentAckRefreshTimer=null}}
function clearIntentTimeout(){if(state.intentTimeoutTimer){clearTimeout(state.intentTimeoutTimer);state.intentTimeoutTimer=null}}
function clearIntentTimers(){clearIntentAckRefresh();clearIntentTimeout()}
function requestAuthoritativeResync(reason='sync'){
  if(!state.connected)return false;
  state.awaitingResync=true;
  return send('sync-request',{reason,knownRevision:Number(match().serverBoardRevision||state.lastRevision||0)});
}
function armIntentTimeout(){
  clearIntentTimeout();
  state.intentTimeoutTimer=setTimeout(()=>{
    const inflight=state.intentInFlight;if(!inflight)return;
    state.intentQueue.length=0;state.intentInFlight=null;clearIntentTimers();
    requestAuthoritativeResync('intent-timeout');
    state.message='Server response delayed. Battlefield resync requested; retry the action after the board refreshes.';
    state.messageError=true;renderLobby();
  },12000);
}
function handleIntentAck(msg){
  const inflight=state.intentInFlight;if(!inflight)return;
  if(msg.clientActionId&&msg.clientActionId!==inflight.clientActionId)return;
  inflight.ackedAt=Date.now();inflight.committedRevision=Number(msg.committedRevision||0);
  clearIntentAckRefresh();
  state.intentAckRefreshTimer=setTimeout(()=>{
    if(state.intentInFlight===inflight)requestAuthoritativeResync('ack-without-snapshot');
  },2500);
}
function resolveIntentFromSnapshot(msg){
  const inflight=state.intentInFlight;if(!inflight){clearIntentTimeout();return}
  const rev=Number(msg.match?.serverBoardRevision||0),last=msg.match?.lastIntent||{};
  if(rev>inflight.baseRevision||last.clientActionId===inflight.clientActionId){
    state.intentInFlight=null;clearIntentTimers();state.messageError=false;
    if(state.message&&state.message.startsWith('Server response delayed.'))state.message='';
    pumpIntent();
  }
}
function sendIntent(name,args=[]){
  name=String(name||'');if(!name)return{ok:false,error:'Missing intent'};
  if(isSpectator())return{ok:false,error:'Spectator is read-only.'};
  if(state.awaitingResync)return{ok:false,error:'Waiting for authoritative resync.'};
  state.intentQueue.push({name,args:Array.isArray(args)?args:[],clientActionId:'a'+Date.now().toString(36)+'_'+(++state.actionSeq).toString(36)});
  pumpIntent();return{ok:true,queued:true};
}
function pumpIntent(){
  if(state.intentInFlight||state.awaitingResync||!state.intentQueue.length||!state.connected||!activeMatch()||isSpectator())return;
  const item=state.intentQueue.shift();item.baseRevision=Number(match().serverBoardRevision||state.lastRevision||0);item.sentAt=Date.now();state.intentInFlight=item;
  if(!send('runtime-intent',{intent:item.name,args:item.args,baseRevision:item.baseRevision,clientActionId:item.clientActionId})){state.intentInFlight=null;state.intentQueue.unshift(item);return}
  armIntentTimeout();
}
function clearIntentQueue(){state.intentQueue.length=0;state.intentInFlight=null;state.awaitingResync=false;clearIntentTimers()}

function scheduleReconnect(){
  if(state.fatal||state.seatExitHold||state.reconnectTimer||navigator.onLine===false)return;
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
  ws.onmessage=(ev)=>{if(!live())return;let msg;try{msg=JSON.parse(ev.data)}catch{return}if(msg.type==='snapshot'){handleSnapshot(msg);return}if(msg.type==='pong'){const now=Date.now(),sent=Number(msg.clientAt||state.pingAt||0);if(sent)state.latencyMs=Math.max(0,now-sent);state.opponentLatencyMs=msg.opponentLatencyMs==null?state.opponentLatencyMs:Number(msg.opponentLatencyMs);state.lastPongAt=now;ensureBattlefieldChrome();return}if(msg.type==='intent-ack'){handleIntentAck(msg);return}if(msg.type==='notice'){if(msg.kind==='error'){clearIntentQueue();state.messageError=true}state.message=msg.message||'Server notice';renderLobby();return}if(msg.type==='seat-kicked'){state.seatToken='';saveStore(STORE.token,'');state.seatExitHold=true;state.message=msg.message||'You left the player seat.';state.messageError=msg.kind!=='left';renderLobby();return}if(msg.type==='fatal'){state.fatal=msg.message||'Connection rejected.';state.messageError=true;renderLobby();try{ws.close()}catch{}}};
  ws.onclose=()=>{if(!live())return;state.connected=false;state.ws=null;clearIntentQueue();renderLobby();scheduleReconnect()};
  ws.onerror=()=>{if(!live())return;renderLobby()};
}
function resetRoom(){send('reset-room',{})}
function boot(){
  state.clientId=makeId();
  state.name=clean(loadStore(STORE.name,'Player'),25)||'Player';
  state.seatToken=loadStore(STORE.token,'');
  state.preferredRole=loadStore(STORE.role,'player')==='spectator'?'spectator':'player';
  const storedDeck=loadStore(STORE.deck,'');
  state.deckKey=storedDeck&&storedDeck!=='CUSTOM'?storedDeck:DEFAULT_DECK_KEY;
  orientationRoot();
  if(state.deckKey){try{E()?.selectOptionBDeck?.('PLAYER',state.deckKey)}catch{}}
  installDom();adapter()?.setSharedBoardMode?.(true);B()?.setSharedBoardMode?.(true);
  // Match PvP v3.51: unlock/preroll audio on a real user gesture and warm battle
  // presentation assets early so authoritative SFX/VFX do not start cold.
  const requestGameplayAudioUnlock=()=>{try{return !!B()?.unlockGameplayAudioPlayback?.()}catch{return false}};
  ['pointerdown','touchstart','keydown'].forEach(type=>document.addEventListener(type,requestGameplayAudioUnlock,{capture:true,passive:type==='touchstart'}));
  try{B()?.prepareAuthoritativeBattleAssets?.()}catch{}
  window.GL_PVP_NETWORK={version:VERSION,send,sendIntent,getSnapshot:()=>state.snapshot,reconnect:()=>{state.seatExitHold=false;connect(true)},resetRoom,surrender:()=>sendIntent('executeConfirmedSurrender',[]),fitIdentity};
  connect();
  setInterval(()=>{if(state.ws?.readyState===WebSocket.OPEN){state.pingAt=Date.now();send('ping',{clientAt:state.pingAt,latencyMs:state.latencyMs})}},10000);
  setInterval(()=>{if(state.ws?.readyState===WebSocket.OPEN&&state.lastPongAt&&Date.now()-state.lastPongAt>45000&&document.visibilityState!=='hidden')connect(true);ensureBattlefieldChrome();if(activeMatch())renderCoin()},1000);
  window.addEventListener('online',()=>{if(!state.ws||state.ws.readyState>WebSocket.OPEN)connect(true)},{passive:true});
  window.addEventListener('pageshow',()=>{if(!state.ws||state.ws.readyState===WebSocket.CLOSED)connect(true)},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&(!state.ws||state.ws.readyState===WebSocket.CLOSED))connect(true)},{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
