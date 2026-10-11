(()=>{
'use strict';
const VERSION='Grandis Legacy PvP v3.80.1';
const BUILD_ID='gl-pvp-3.80.1-v6914-shell-reconnect-2026-10-11';
const CFG=window.GL_PVP_CONFIG||{};
const STORE={name:'grandis_legacy_pvp_v380_name',deck:'grandis_legacy_pvp_v380_deck',custom:'grandis_legacy_pvp_v380_custom_deck',customName:'grandis_legacy_pvp_v380_custom_deck_name'};
const STORE_PREV={name:'grandis_legacy_pvp_v379_name',deck:'grandis_legacy_pvp_v379_deck'};
// Connection identity is tab-scoped. Player 1 and Player 2 must be able to use two tabs
// on the same origin without sharing one localStorage client id / seat token and kicking
// each other into an endless reconnect loop. sessionStorage survives reload in one tab.
const SESSION={client:'grandis_legacy_pvp_v3801_tab_client_id',seat:'grandis_legacy_pvp_v3801_tab_seat_token',role:'grandis_legacy_pvp_v3801_tab_role'};
const state={ws:null,connected:false,snapshot:null,name:'',role:'player',deckKey:'',customDeck:null,customDeckName:'',formation:null,rank:1,clientId:'',seatToken:'',reconnectDelay:1200,reconnectTimer:null,connectionError:'',sessionInvalid:false,intentSeq:0,intentInFlight:null,intentQueue:[],lastImportedRevision:-1,lastImportedStatus:'',lastCoinChoiceKey:'',lastOpeningKey:'',fatalBuildMismatch:false,listeners:new Set()};
const INTENT_QUEUE_LIMIT=32;
const $=id=>document.getElementById(id),clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeName=v=>String(v||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,20);
function stored(key){try{return (STORE[key]&&localStorage.getItem(STORE[key]))||(STORE_PREV[key]&&localStorage.getItem(STORE_PREV[key]))||''}catch{return''}}
function persist(key,value){try{if(!STORE[key])return;if(value==null||value==='')localStorage.removeItem(STORE[key]);else localStorage.setItem(STORE[key],String(value))}catch{}}
function sessionStored(key){try{return sessionStorage.getItem(SESSION[key])||''}catch{return''}}
function persistSession(key,value){try{if(value==null||value==='')sessionStorage.removeItem(SESSION[key]);else sessionStorage.setItem(SESSION[key],String(value))}catch{}}
function newClientId(){return 'c_'+Math.random().toString(36).slice(2)+Date.now().toString(36)}
function makeClientId(){let x=sessionStored('client');if(x)return x;x=newClientId();persistSession('client',x);return x}
function forkConnectionIdentity(){state.clientId=newClientId();state.seatToken='';state.sessionInvalid=false;persistSession('client',state.clientId);persistSession('seat','')}
function clearReconnectTimer(){if(state.reconnectTimer){clearTimeout(state.reconnectTimer);state.reconnectTimer=null}}
function scheduleReconnect(delay=state.reconnectDelay){if(state.fatalBuildMismatch||state.sessionInvalid)return;clearReconnectTimer();state.reconnectTimer=setTimeout(()=>{state.reconnectTimer=null;connect(false)},Math.max(50,Number(delay)||1200));state.reconnectDelay=Math.min(10000,Math.round(state.reconnectDelay*1.6))}
function bridge(){return window.GL_LOCAL_AI_BRIDGE||null}
function nativeEngine(){return window.GL_GAME_ENGINE||null}
function presentation(){return window.GL_V6914_PVP_PRESENTATION||null}
function starters(){try{return bridge()?.getStarterDeckOptions?.()||{}}catch{return {}}}
function optionKeys(){return Object.keys(starters())}
function starterDeck(k){return starters()?.[k]?.deck||null}
function local(){return state.snapshot?.local||null}
function match(){return state.snapshot?.match||null}
function opponent(){const me=local();return (state.snapshot?.players||[]).find(p=>p.seat&&Number(p.seat)!==Number(me?.seat))||null}
function currentDeck(){return state.customDeck||starterDeck(state.deckKey)||null}
function baseFormation(deck=currentDeck()){const f=deck?.default_formation||{};return{LEFT:String(f.LEFT||''),CENTER:String(f.CENTER||''),RIGHT:String(f.RIGHT||'')}}
function formationValid(deck,f){const lanes=['LEFT','CENTER','RIGHT'],a=lanes.map(l=>String((deck?.default_formation||{})[l]||'')).sort(),b=lanes.map(l=>String(f?.[l]||'')).sort();return a.every(Boolean)&&b.every(Boolean)&&new Set(b).size===3&&a.join('|')===b.join('|')}
function currentFormation(){const d=currentDeck();return state.formation&&formationValid(d,state.formation)?clone(state.formation):baseFormation(d)}
function cardDef(id){const d=window.GL_CARD_DEFINITIONS||{};if(!cardDef.m)cardDef.m=new Map((d.cards||[]).filter(Boolean).map(c=>[String(c.card_id),c]));return cardDef.m.get(String(id))||null}
function cardName(id){const c=cardDef(id);return c?.name||c?.card_name||id||'Unknown'}
function localCardArt(id){return id?'card-art/'+encodeURIComponent(String(id))+'.webp':''}
function localManaArt(sh){const key=sh?.kind==='CLASS'?String(sh.class_name||'').trim():'Generic';return 'assets/shards/'+encodeURIComponent(key||'Generic')+'.webp'}
function cardSrc(id){return localCardArt(id)}
function heroProgressionIds(deck,rankOneId){const rows=(deck?.legacy_deck_expanded||[]).filter(x=>String(x.card_type||'').toLowerCase()==='hero'),seed=rows.find(x=>x.card_id===rankOneId);if(!seed)return[rankOneId];return rows.filter(x=>x.package_id===seed.package_id).sort((a,b)=>Number(cardDef(a.card_id)?.rank_numeric||0)-Number(cardDef(b.card_id)?.rank_numeric||0)).map(x=>x.card_id).slice(0,3)}
function heroAtRank(deck,rankOneId){const ids=heroProgressionIds(deck,rankOneId);return ids[Math.max(0,Math.min(ids.length-1,state.rank-1))]||rankOneId}
function deckTitle(d){const label=state.customDeckName||starters()?.[state.deckKey]?.label||d?.display_name||d?.deck_name||'Selected Deck',m=label.match(/Starter\s*0?(\d+)/i);return m?'Starter Deck '+Number(m[1]):label}
function deckClassLine(d){const label=state.customDeckName||starters()?.[state.deckKey]?.label||d?.display_name||d?.deck_name||'',parts=label.split(/[—-]/);return parts.length>1?parts.slice(1).join(' ').trim().replace(/\s*\/\s*/g,', ').toUpperCase():'CUSTOM DECK'}
function deckStats(d){const s={heroes:0,legacies:0,skills:0,items:0,events:0,main:0};(d?.legacy_deck_expanded||[]).forEach(x=>{const t=String(x.card_type||'').toLowerCase();if(t==='hero')s.heroes++;if(t==='legacy')s.legacies++});(d?.main_deck||[]).forEach(x=>{const q=Math.max(0,Number(x.quantity||1)),c=cardDef(x.card_id),f=String(c?.family||c?.card_type||'').toLowerCase();s.main+=q;if(f==='item')s.items+=q;else if(f==='event')s.events+=q;else s.skills+=q});return s}
function wsBase(){if(CFG.wsBase)return String(CFG.wsBase).replace(/\/$/,'');const proto=location.protocol==='https:'?'wss:':'ws:';return proto+'//'+location.host}
function wsUrl(){const q=new URLSearchParams({client:state.clientId,name:state.name||'Player',role:state.role,buildId:BUILD_ID});if(state.seatToken)q.set('seatToken',state.seatToken);return wsBase()+(CFG.wsPath||'/ws')+'?'+q}
function send(type,payload={}){const ws=state.ws;if(!ws||ws.readyState!==WebSocket.OPEN)return false;ws.send(JSON.stringify({type,clientBuildId:BUILD_ID,...payload}));return true}
function notify(){for(const fn of state.listeners){try{fn(state.snapshot)}catch(e){console.error(e)}}window.dispatchEvent(new CustomEvent('gl-pvp-snapshot',{detail:state.snapshot}))}
function identity(){const me=local(),op=opponent();return{localName:me?.name||'PLAYER',opponentName:op?.name||'OPPONENT',localDeck:me?.deckName||'',opponentDeck:op?.deckName||'',seat:me?.seat||null,role:me?.role||state.role}}
function matchClock(){const m=match()||{},start=Date.parse(m.startedAt||''),finish=Date.parse(m.finishedAt||'');if(!Number.isFinite(start))return{active:false,elapsedMs:0};return{active:['coin-flip','coin-result','opening','started'].includes(m.status),elapsedMs:Math.max(0,(Number.isFinite(finish)?finish:Date.now())-start)}}
function syncSetupSelection(){
  const me=local(),m=match();if(!state.connected||m?.status!=='setup'||me?.role!=='player')return;
  // Never overwrite a server-retained deck on refresh/reconnect. This is critical for
  // imported Custom Decks whose full payload may only exist on the server after reconnect.
  if(me?.hasDeck||me?.deckKey||me?.deckName)return;
  if(state.customDeck){send('set-deck',{customDeck:state.customDeck,deckName:state.customDeckName,formation:currentFormation()});return;}
  if(state.deckKey)send('set-deck',{deckKey:state.deckKey,formation:currentFormation()});
}

function dispatchIntent(item){
  const me=local(),m=match();if(me?.role!=='player'||m?.status!=='started')return{ok:false,error:'PvP intent unavailable.'};
  const base=Number(m.revision||0),id=state.clientId+'.'+base+'.'+(++state.intentSeq)+'.'+String(item.kind==='batch'?'batch':item.name||'intent').slice(0,48),payload={baseRevision:base,clientActionId:id};
  const ok=item.kind==='batch'?send('runtime-intent-batch',{...payload,steps:item.steps}):send('runtime-intent',{...payload,intent:item.name,args:item.args});
  if(!ok)return{ok:false,error:'WebSocket unavailable.'};state.intentInFlight={...item,base,id};return{ok:true,pending:true};
}
function queueAction(item){
  if(state.intentInFlight){if(state.intentQueue.length>=INTENT_QUEUE_LIMIT)return{ok:false,error:'PvP intent queue is full.'};state.intentQueue.push(item);return{ok:true,pending:true,queued:true}}
  return dispatchIntent(item);
}
function sendIntent(name,args=[]){return queueAction({kind:'single',name:String(name||''),args:Array.isArray(args)?clone(args):[]})}
function sendIntentBatch(steps=[]){const rows=(Array.isArray(steps)?steps:[]).slice(0,8).filter(x=>x?.name).map(x=>({name:String(x.name),args:Array.isArray(x.args)?clone(x.args):[]}));if(!rows.length)return{ok:false,error:'Intent batch is empty.'};return queueAction({kind:'batch',steps:rows})}
function clearIntent(error=''){state.intentInFlight=null;if(error){state.intentQueue.length=0;window.dispatchEvent(new CustomEvent('gl-pvp-intent-error',{detail:{message:error}}))}}
function flushIntent(){if(state.intentInFlight||!state.intentQueue.length)return;const item=state.intentQueue.shift(),r=dispatchIntent(item);if(!r?.ok)clearIntent(r?.error||'Queued intent failed.')}

function importBoard(snap,_skip=false){const b=snap?.match?.board;if(!b||!bridge()?.importSnapshot)return false;const rev=Number(snap.match.revision||0),status=String(snap.match.status||'');if(rev===state.lastImportedRevision&&status===state.lastImportedStatus)return false;/* Authoritative state import is deliberately silent. The external v6.91.4 presentation runtime owns visible animation/SFX and resolves media from this package; donor bridge import animation here would double-play presentation and can use donor CDN URLs. */bridge().importSnapshot(b,{notice:'',skipImportAnimations:true});state.lastImportedRevision=rev;state.lastImportedStatus=status;window.GL_GAME_UI?.render?.();return true}
function playerName(seat){return(state.snapshot?.players||[]).find(p=>Number(p.seat)===Number(seat))?.name||('Player '+seat)}
function syncPresentation(prevStatus){
  const m=match(),me=local(),p=presentation();if(!m)return;
  const active=['coin-flip','coin-result','opening','started','finished'].includes(m.status);$('pvpSetupOverlay')?.classList.toggle('open',!active);document.documentElement.classList.toggle('gl-pvp-game-active',active);document.querySelector('.app')?.classList.toggle('gl-lobby-hidden',!active);
  if(m.status==='setup'){state.lastImportedRevision=-1;state.lastImportedStatus='';state.lastCoinChoiceKey='';state.lastOpeningKey='';p?.setCoinGate?.(false);window.GL_GAME_UI?.resetForLobby?.();return}
  if(m.status==='coin-flip'){
    importBoard(state.snapshot,true);
    const key='choice|'+m.chooserSeat+'|'+me?.seat;if(key!==state.lastCoinChoiceKey&&p){state.lastCoinChoiceKey=key;p.showCoinChoice({canChoose:me?.role==='player'&&Number(me?.seat)===Number(m.chooserSeat),chooserName:playerName(m.chooserSeat)})}
    return;
  }
  if(m.status==='coin-result'){
    importBoard(state.snapshot,true);if(p){const localSeat=Number(me?.seat||1),firstSeat=Number(m.firstSeat||1);p.showCoinResult({choice:m.choice,outcome:m.outcome,firstSeat,localSeat,localWasChooser:Number(m.chooserSeat)===localSeat,winnerName:playerName(firstSeat),opponentName:opponent()?.name||'Opponent',canStartOpening:me?.role==='player'&&!!m.canStartOpening})}return;
  }
  if(m.status==='opening'){
    importBoard(state.snapshot,true);
    if(me?.role==='player'&&m.opening&&p){const key=[m.revision,m.opening.choice,m.opening.outcome].join('|');if(key!==state.lastOpeningKey){state.lastOpeningKey=key;p.playOpening({opening:m.opening})}}
    else p?.releaseGate?.();
    return;
  }
  if(m.status==='started'||m.status==='finished'){
    p?.releaseGate?.();importBoard(state.snapshot,false);return;
  }
}
function onSnapshot(msg){
  const prevStatus=match()?.status||'setup',prevRev=Number(match()?.revision||0);state.snapshot=msg;state.connected=true;
  if(msg.local?.seatToken){state.seatToken=msg.local.seatToken;persistSession('seat',state.seatToken)}
  if(msg.local?.role){state.role=msg.local.role;persistSession('role',state.role)}
  if(msg.local?.customDeck){state.customDeck=clone(msg.local.customDeck);state.customDeckName=msg.local.deckName||state.customDeck?.display_name||state.customDeck?.deck_name||'Imported Deck';state.deckKey='';state.formation=msg.local.formation||baseFormation(state.customDeck);persist('custom',JSON.stringify(state.customDeck));persist('customName',state.customDeckName);persist('deck','')}
  else if(msg.local?.deckKey){state.deckKey=msg.local.deckKey;state.customDeck=null;state.customDeckName='';state.formation=msg.local.formation||state.formation;persist('deck',state.deckKey);persist('custom','');persist('customName','')}
  else if(msg.local?.hasDeck&&msg.local?.deckName&&!state.customDeck){state.deckKey='';state.customDeckName=msg.local.deckName;state.formation=msg.local.formation||state.formation}
  const rev=Number(msg.match?.revision||0);if(state.intentInFlight&&Number.isFinite(Number(state.intentInFlight.ackRevision))&&rev>=Number(state.intentInFlight.ackRevision)){state.intentInFlight=null;setTimeout(flushIntent,0)}else if(!state.intentInFlight&&state.intentQueue.length)setTimeout(flushIntent,0);
  renderLobby();syncPresentation(prevStatus);syncSetupSelection();notify();
  if(!presentation()&&msg.match?.status!=='setup')setTimeout(()=>syncPresentation(prevStatus),80);
}
function recoverBuildMismatch(){
  if(state.fatalBuildMismatch)return;state.fatalBuildMismatch=true;state.connected=false;clearIntent('PvP client update required.');
  try{const k='grandis_legacy_pvp_build_reload',seen=sessionStorage.getItem(k);if(seen!==BUILD_ID){sessionStorage.setItem(k,BUILD_ID);const u=new URL(location.href);u.searchParams.set('_glbuild',Date.now().toString(36));location.replace(u.toString());return}}catch{}
  renderLobby();
}
function connect(force=false){
  if(state.fatalBuildMismatch)return;
  if(state.sessionInvalid&&force){forkConnectionIdentity();state.connectionError=''}
  if(state.sessionInvalid&&!force)return;
  if(state.ws&&!force&&(state.ws.readyState===WebSocket.OPEN||state.ws.readyState===WebSocket.CONNECTING))return;
  clearReconnectTimer();
  if(state.ws)try{state.ws.close(4000,'rejoin')}catch{}
  let ws;try{ws=new WebSocket(wsUrl())}catch{scheduleReconnect();return}state.ws=ws;
  ws.onopen=()=>{if(state.ws!==ws)return;state.connected=true;state.connectionError='';state.sessionInvalid=false;state.reconnectDelay=1200;renderLobby()};
  ws.onclose=ev=>{if(state.ws!==ws)return;state.connected=false;clearIntent('Connection closed before the authoritative action completed.');const code=Number(ev?.code||0);
    if(code===4003){recoverBuildMismatch();return}
    if(code===4002){state.role='spectator';state.seatToken='';persistSession('role','spectator');persistSession('seat','');renderLobby();scheduleReconnect(250);return}
    if(code===4006){/* Another tab/page took over this exact seat session. Fork this tab into a fresh player identity instead of fighting for the same socket forever. */forkConnectionIdentity();state.role='player';persistSession('role','player');state.connectionError='';renderLobby();scheduleReconnect(250);return}
    if(code===4004){/* This tab does not own the stored seat token. Treat it as a new tab/player session, never as a retry of the protected seat. */forkConnectionIdentity();state.role='player';persistSession('role','player');state.connectionError='';renderLobby();scheduleReconnect(250);return}
    if(code===4001){state.sessionInvalid=true;state.connectionError='Connection was rejected. Reconnect to retry with a fresh tab session.';renderLobby();return}
    renderLobby();scheduleReconnect();
  };
  ws.onerror=()=>{if(state.ws!==ws)return;state.connected=false;renderLobby()};
  ws.onmessage=ev=>{if(state.ws!==ws)return;let m;try{m=JSON.parse(ev.data)}catch{return}if(m.type==='snapshot')onSnapshot(m);else if(m.type==='intent-ack'){if(state.intentInFlight&&String(m.clientActionId||'')===String(state.intentInFlight.id||''))state.intentInFlight.ackRevision=Number(m.revision);/* Wait for the matching authoritative snapshot before releasing the serialized queue. */}else if(m.type==='error'){const message=String(m.message||'Authoritative PvP request failed.');if(m.code==='CLIENT_BUILD_MISMATCH'||/CLIENT_BUILD_MISMATCH/.test(message)){recoverBuildMismatch();return}if(m.code==='SEAT_TOKEN_MISMATCH'){/* close code 4004 will fork this tab into a fresh session */state.connectionError='Seat session changed. Opening a fresh tab session…'}clearIntent(message);console.warn('[PvP]',m.code,message);if(m.snapshot)onSnapshot(m.snapshot);renderLobby();window.GL_GAME_UI?.render?.()}else if(m.type==='pong'){}else console.warn('[PvP] Unknown server message',m)};
}

function chooseCoin(choice){return send('choose-coin-flip',{choice:String(choice).toUpperCase()})}
function coinPresented(){return send('coin-presented')}
function confirmCoin(){return send('confirm-coin-flip')}
function openingPresented(){return send('opening-presented')}
function startMatch(){return send('start-match')}
function surrender(){const m=match();return send('surrender-match',{baseRevision:Number(m?.revision||0),clientActionId:state.clientId+'.surrender.'+(++state.intentSeq)})?{ok:true,pending:true}:{ok:false,error:'WebSocket unavailable.'}}
function returnToLobby(){return send('return-to-lobby')?{ok:true,pending:true}:{ok:false,error:'WebSocket unavailable.'}}

// Presentation-facing authority facade: reads come from the exact v6.91.4 engine; gameplay writes become server intents.
const engineFacade=new Proxy({}, {get(_t,prop){
  if(prop==='intent')return sendIntent;if(prop==='intentBatch')return sendIntentBatch;if(prop==='prepareLocalMatch'||prop==='commitOpeningSetup'||prop==='beginFirstTurn')return()=>({ok:false,error:'PvP lifecycle is server-owned.'});
  // Standalone asset boundary. The exact donor engine can still contain website CDN
  // URLs internally, but every visible card/shard lookup exposed to the PvP UI resolves locally.
  if(prop==='cardView')return id=>{const e=nativeEngine(),v=e?.cardView?.(id)||{id};const local=localCardArt(id);return{...v,thumb:local,full:local}};
  if(prop==='manaAsset')return sh=>localManaArt(sh);
  const e=nativeEngine(),value=e?.[prop];return typeof value==='function'?value.bind(e):value;
}});
const adapter=window.GL_CREATE_PVP_AUTHORITY_ADAPTER?.({engine:engineFacade,bridge:bridge()});
if(!adapter)throw new Error('PvP authority adapter factory is unavailable.');window.GL_AUTHORITY_ADAPTER.register('PVP',adapter);window.GL_AUTHORITY_ADAPTER.use('PVP');

function setDeck(key){state.customDeck=null;state.customDeckName='';state.deckKey=key;state.rank=1;state.formation=baseFormation(starterDeck(key));persist('deck',key);persist('custom','');persist('customName','');if(state.connected&&local()?.role!=='spectator')send('set-deck',{deckKey:key,formation:currentFormation()});renderLobby()}
function swapFormation(a,b){const lanes=['LEFT','CENTER','RIGHT'],f=currentFormation(),x=lanes[a],y=lanes[b];if(!x||!y)return;[f[x],f[y]]=[f[y],f[x]];state.formation=f;if(state.customDeck)send('set-deck',{customDeck:state.customDeck,deckName:state.customDeckName,formation:f});else send('set-deck',{deckKey:state.deckKey,formation:f});renderLobby()}
function closeProgression(){document.getElementById('pvpHeroProgressionModal')?.remove()}
async function openProgression(rankOne){closeProgression();const ids=heroProgressionIds(currentDeck(),rankOne);if(ids.length<3)return;const modal=document.createElement('div');modal.id='pvpHeroProgressionModal';modal.className='pvp-progression-modal';const cards=ids.map((id,i)=>'<article class="pvp-v260-hero pvp-progression-hero '+(i===0?'current':'')+'"><button class="pvp-v260-card pvp-progression-static-card" type="button" data-preview="'+esc(id)+'"><img src="'+esc(cardSrc(id))+'" alt="'+esc(cardName(id))+'"></button><div class="pvp-v260-position">RANK '+['I','II','III'][i]+'</div></article>');modal.innerHTML='<section class="pvp-progression-card"><header><div><span>HERO PROGRESSION</span><h2>'+esc(cardName(ids[0]))+'</h2></div><button id="pvpHeroProgressionClose" class="pvp-progression-close" type="button">Close</button></header><div class="pvp-progression-row">'+cards[0]+'<span class="pvp-progression-arrow">→</span>'+cards[1]+'<span class="pvp-progression-arrow">→</span>'+cards[2]+'</div><p>Select a Rank card to open Card Preview.</p></section>';document.body.appendChild(modal);$('pvpHeroProgressionClose').onclick=closeProgression;modal.onclick=e=>{const b=e.target.closest?.('[data-preview]');if(b){e.preventDefault();e.stopPropagation();window.GL_GAME_UI?.openCardReview?.(b.dataset.preview);return}if(e.target===modal)closeProgression()}}
function formationHtml(){const d=currentDeck(),f=currentFormation(),lanes=['LEFT','CENTER','RIGHT'],parts=[];lanes.forEach((lane,i)=>{const r1=f[lane]||'',id=heroAtRank(d,r1);if(i)parts.push('<button class="pvp-v260-swap-button" type="button" data-swap-left="'+(i-1)+'" data-swap-right="'+i+'"><img src="assets/lobby/swap.png" alt=""></button>');parts.push('<article class="pvp-v260-hero"><button class="pvp-v260-card" type="button" data-pvp-progression="'+esc(r1)+'"><img decoding="async" src="'+esc(cardSrc(id))+'" alt="'+esc(cardName(id))+'"></button><div class="pvp-v260-position">'+esc(lane[0]+lane.slice(1).toLowerCase())+'</div></article>')});return parts.join('')}
function seatHtml(n){const p=(state.snapshot?.players||[]).find(x=>Number(x.seat)===n),online=!!p?.connected,me=local(),canKick=n===2&&p&&Number(me?.seat)===1&&match()?.status==='setup';return'<article class="pvp-v260-seat"><div><span>Player '+n+'</span><strong>'+esc(p?.name||'Empty')+'</strong></div><p class="'+(online?'online':'')+'"><i></i>'+esc(p?(online?'online':'offline'):'offline')+(p?.ready?' · READY':'')+'</p>'+(canKick?'<button class="pvp-seat-kick" type="button" data-kick-seat="2" aria-label="Kick Player 2"><img src="assets/lobby/exit.png" alt=""></button>':'')+'</article>'}
function ensureLobby(){
  if($('pvpSetupOverlay'))return;const wrap=document.createElement('div');wrap.id='pvpSetupOverlay';wrap.className='pvp-v260-lobby open';
  wrap.innerHTML='<div class="pvp-v260-page"><header class="pvp-v260-topbar"><a id="pvpHomeLogo" class="pvp-v260-logo" aria-label="Back to Grandis Legacy home"><img src="assets/lobby/grandis-legacy-logo.webp" alt="Grandis Legacy"></a><div class="pvp-v260-heading"><h1>PVP LOBBY</h1><p>Choose your deck, then ready up or spectate.</p></div></header><main class="pvp-v260-layout"><section class="pvp-v260-panel pvp-v260-deck-panel"><div class="pvp-v260-picker"><label for="pvpSetupDeck">Choose a Deck</label><div class="pvp-v260-select"><select id="pvpSetupDeck"></select></div></div><div class="pvp-v260-title"><h2 id="pvpDeckTitle">Starter Deck</h2><p id="pvpDeckClassLine"></p></div><div class="pvp-v260-showcase"><div class="pvp-v260-formation-wrap"><div id="pvpFormationPreview" class="pvp-v260-formation"></div><div class="rank-control"><button id="pvpRankPrev" type="button">‹</button><strong id="pvpRankLabel">RANK I</strong><button id="pvpRankNext" type="button">›</button></div></div><aside class="pvp-v260-summary"><h3>YOUR DECK</h3><dl id="pvpDeckStats"></dl></aside></div><div class="pvp-v260-footer"><input id="pvpImportDeckInput" type="file" accept="application/json,.json" hidden><button id="pvpImportDeckButton" class="pvp-v260-btn pvp-v260-gold pvp-v260-compact" type="button">IMPORT CUSTOM DECK</button><div id="pvpLoadedDeckStatus" class="pvp-v260-status"></div></div></section><aside class="pvp-v260-panel pvp-v260-room-panel"><h2>MATCH PANEL</h2><label class="pvp-v260-label" for="pvpSetupName">PLAYER NAME</label><div class="pvp-v260-name"><input id="pvpSetupName" maxlength="20" placeholder="Your player name" autocomplete="off"><span id="pvpNameStateIcon" class="pvp-v260-name-icon"></span></div><div class="pvp-v260-actions"><button id="pvpSetupSpectatorButton" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline" type="button">SPECTATE</button><button id="pvpSetupReadyButton" class="pvp-v260-btn pvp-v260-gold" type="button">READY</button></div><div class="pvp-v260-divider"></div><div id="pvpSetupPeople" class="pvp-v260-seats"></div><div id="pvpSetupHint" class="pvp-v260-message"></div><div class="pvp-v260-room-footer"><button id="pvpSetupStartButton" class="pvp-v260-btn pvp-v260-gold" type="button" disabled>START MATCH</button><button id="pvpSetupReconnectButton" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline" type="button">RECONNECT</button></div></aside></main></div>';
  document.body.appendChild(wrap);$('pvpHomeLogo').href=CFG.homeUrl||'https://grandislegacytcg.github.io/';wrap.onclick=e=>{const k=e.target.closest?.('[data-kick-seat="2"]');if(k){send('kick-seat-2');return}const p=e.target.closest?.('[data-pvp-progression]');if(p)openProgression(p.dataset.pvpProgression)};
  $('pvpSetupName').onblur=()=>{const n=safeName($('pvpSetupName').value);if(n){state.name=n;try{localStorage.setItem(STORE.name,n)}catch{};send('rename',{name:n});renderLobby()}};
  $('pvpSetupDeck').onchange=e=>setDeck(e.target.value);$('pvpRankPrev').onclick=()=>{state.rank=Math.max(1,state.rank-1);renderLobby()};$('pvpRankNext').onclick=()=>{state.rank=Math.min(3,state.rank+1);renderLobby()};
  $('pvpSetupReadyButton').onclick=()=>send('ready',{ready:!local()?.ready});$('pvpSetupSpectatorButton').onclick=()=>{state.role=local()?.role==='spectator'?'player':'spectator';persistSession('role',state.role);send('switch-role',{role:state.role})};$('pvpSetupStartButton').onclick=startMatch;$('pvpSetupReconnectButton').onclick=()=>connect(true);$('pvpImportDeckButton').onclick=()=>$('pvpImportDeckInput').click();
  $('pvpImportDeckInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(String(r.result||''));state.customDeck=d;state.customDeckName=d.display_name||d.deck_name||f.name.replace(/\.json$/i,'');state.deckKey='';state.formation=baseFormation(d);persist('custom',JSON.stringify(d));persist('customName',state.customDeckName);persist('deck','');send('set-deck',{customDeck:d,deckName:state.customDeckName,formation:state.formation});renderLobby()}catch(err){$('pvpLoadedDeckStatus').textContent=String(err.message||err)}};r.readAsText(f)};
}
function renderLobby(){
  ensureLobby();const active=['coin-flip','coin-result','opening','started','finished'].includes(match()?.status),wrap=$('pvpSetupOverlay');wrap.classList.toggle('open',!active);if(active)return;
  const keys=optionKeys(),meNow=local();if(!state.deckKey&&!state.customDeck&&!meNow?.hasDeck&&keys[0]){state.deckKey=keys[0];state.formation=baseFormation(starterDeck(keys[0]));persist('deck',state.deckKey);if(state.connected&&meNow?.role==='player')send('set-deck',{deckKey:state.deckKey,formation:state.formation})}
  const sel=$('pvpSetupDeck'),serverCustom=!!(meNow?.hasDeck&&!meNow?.deckKey&&!state.customDeck);sel.innerHTML=keys.map(k=>'<option value="'+esc(k)+'" '+(k===state.deckKey?'selected':'')+'>'+esc(starters()[k]?.label||k)+'</option>').join('')+((state.customDeck||serverCustom)?'<option selected value="">'+esc(state.customDeckName||meNow?.deckName||'Imported Deck')+'</option>':'');
  const d=currentDeck(),stats=deckStats(d);$('pvpDeckTitle').textContent=deckTitle(d);$('pvpDeckClassLine').textContent=deckClassLine(d);$('pvpFormationPreview').innerHTML=formationHtml();$('pvpFormationPreview').querySelectorAll('[data-swap-left]').forEach(b=>b.onclick=()=>swapFormation(Number(b.dataset.swapLeft),Number(b.dataset.swapRight)));$('pvpRankLabel').textContent='RANK '+['I','II','III'][state.rank-1];
  $('pvpDeckStats').innerHTML='<div><dt>Heroes</dt><dd>'+stats.heroes+'</dd></div><div><dt>Legacies</dt><dd>'+stats.legacies+'</dd></div><div><dt>Skills</dt><dd>'+stats.skills+'</dd></div><div><dt>Items</dt><dd>'+stats.items+'</dd></div><div><dt>Events</dt><dd>'+stats.events+'</dd></div><div class="total"><dt>Legacy Deck</dt><dd>'+(d?.legacy_deck_expanded?.length||0)+'</dd></div><div class="total"><dt>Main Deck</dt><dd>'+stats.main+'</dd></div>';
  $('pvpSetupPeople').innerHTML=seatHtml(1)+seatHtml(2);$('pvpSetupName').value=state.name||'';const me=local(),spec=me?.role==='spectator';$('pvpSetupReadyButton').textContent=me?.ready?'UNREADY':'READY';$('pvpSetupReadyButton').disabled=!state.connected||spec||(!d&&!me?.hasDeck);$('pvpSetupSpectatorButton').textContent=spec?'JOIN AS PLAYER':'SPECTATE';$('pvpSetupStartButton').disabled=!(me?.seat===1&&(state.snapshot?.players||[]).length===2&&(state.snapshot?.players||[]).every(p=>p.connected&&p.ready&&p.hasDeck));$('pvpSetupReconnectButton').textContent=state.sessionInvalid?'NEW SESSION':'RECONNECT';$('pvpSetupHint').textContent=state.fatalBuildMismatch?'Client update required. Refresh this page.':state.connectionError||(!state.connected?'Connecting to PvP service…':spec?'Spectator mode is read-only. Both Hands remain hidden.':me?.seat===1?'Waiting for both players to be ready.':'Ready up when your deck is selected.');const ic=$('pvpNameStateIcon');ic.className='pvp-v260-name-icon'+(spec?' spectate':me?.ready?' ready':'');
}
function boot(){state.clientId=makeClientId();try{const u=new URL(location.href),explicitDeck=u.searchParams.get('deck')||'';state.name=safeName(u.searchParams.get('name')||stored('name')||'Player');state.role=(u.searchParams.get('role')||sessionStored('role')||'player')==='spectator'?'spectator':'player';state.seatToken=sessionStored('seat')||'';const rawCustom=localStorage.getItem(STORE.custom)||'';if(rawCustom&&!explicitDeck){try{state.customDeck=JSON.parse(rawCustom);state.customDeckName=localStorage.getItem(STORE.customName)||state.customDeck?.display_name||state.customDeck?.deck_name||'Imported Deck';state.formation=baseFormation(state.customDeck)}catch{persist('custom','');persist('customName','')}}state.deckKey=explicitDeck||(!state.customDeck?stored('deck'):'')||''}catch{}persist('name',state.name);persistSession('role',state.role);ensureLobby();renderLobby();connect(false)}

window.GL_PVP_HOST={version:VERSION,buildId:BUILD_ID,getSnapshot:()=>state.snapshot,subscribe(fn){state.listeners.add(fn);return()=>state.listeners.delete(fn)},sendIntent,sendIntentBatch,startMatch,chooseCoin,coinPresented,confirmCoin,openingPresented,matchClock,surrender,returnToLobby,identity,reconnect:()=>connect(true),getConnection:()=>({connected:state.connected,buildMismatch:state.fatalBuildMismatch})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
