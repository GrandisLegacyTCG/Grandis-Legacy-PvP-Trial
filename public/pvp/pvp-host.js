(()=>{
'use strict';
const BUILD_META=window.GL_PVP_BUILD_META||{};
const VERSION=String(BUILD_META.versionLabel||'Grandis Legacy PvP');
const BUILD_ID=String(BUILD_META.buildId||'MISSING_BUILD_META');
const CFG=window.GL_PVP_CONFIG||{};
const STORE={name:'grandis_legacy_pvp_v380_name',deck:'grandis_legacy_pvp_v380_deck',custom:'grandis_legacy_pvp_v380_custom_deck',customName:'grandis_legacy_pvp_v380_custom_deck_name'};
const STORE_PREV={name:'grandis_legacy_pvp_v379_name',deck:'grandis_legacy_pvp_v379_deck'};
// Connection identity is tab-scoped. Player 1 and Player 2 must be able to use two tabs
// on the same origin without sharing one localStorage client id / seat token and kicking
// each other into an endless reconnect loop. sessionStorage survives reload in one tab.
const SESSION={client:'grandis_legacy_pvp_v3801_tab_client_id',seat:'grandis_legacy_pvp_v3801_tab_seat_token',role:'grandis_legacy_pvp_v3801_tab_role'};
const state={ws:null,connected:false,snapshot:null,name:'',role:'player',deckKey:'',customDeck:null,customDeckName:'',formation:null,rank:1,clientId:'',seatToken:'',reconnectDelay:1200,reconnectTimer:null,connectionError:'',sessionInvalid:false,intentSeq:0,lastImportedRevision:-1,lastImportedStatus:'',lastCoinChoiceKey:'',lastOpeningKey:'',openingAssetKey:'',openingAssetPromise:null,fatalBuildMismatch:false,listeners:new Set(),pingTimer:null,pingSentAt:0,rttMs:null,peerConnections:new Map(),idleNotice:''};
const INTENT_BATCH_LIMIT=2;
let intentChannel=null;
// PvP is a shared human-vs-human board. Keep the donor runtime in its native shared-board mode
// so browser-side timers/AI-only branches never compete with server authority.
window.GL_PVP_SHARED_BOARD_ACTIVE=true;
window.GL_PVP_LOCAL_ROLE='player';
const $=id=>document.getElementById(id),clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeName=v=>String(v||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,25);
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
const imagePreloadCache=new Map();
function preloadImage(src){
  src=String(src||'');if(!src||typeof Image==='undefined')return Promise.resolve(false);if(imagePreloadCache.has(src))return imagePreloadCache.get(src);
  const job=new Promise(resolve=>{const im=new Image();im.decoding='async';let settled=false;const finish=ok=>{if(settled)return;settled=true;resolve(!!ok)};im.onload=()=>{const d=typeof im.decode==='function'?im.decode():Promise.resolve();Promise.resolve(d).catch(()=>{}).finally(()=>finish(true))};im.onerror=()=>finish(false);im.src=src;if(im.complete&&im.naturalWidth>0)im.onload()});imagePreloadCache.set(src,job);return job;
}
function preloadImages(urls){return Promise.allSettled([...new Set((urls||[]).filter(Boolean).map(String))].map(preloadImage))}
function deckAssetUrls(deck){const ids=new Set();(deck?.legacy_deck_expanded||[]).forEach(x=>x?.card_id&&ids.add(String(x.card_id)));(deck?.main_deck||[]).forEach(x=>x?.card_id&&ids.add(String(x.card_id)));return [...ids].map(localCardArt)}
function visibleBoardAssetUrls(snap){const s=snap?.match?.board?.appState||snap?.appState||null;if(!s)return[];const ids=new Set(),walk=v=>{if(typeof v==='string'){if(/^S1-[A-Z0-9-]+$/i.test(v)&&v!=='__GL_HIDDEN_CARD__')ids.add(v);return}if(Array.isArray(v)){v.forEach(walk);return}if(v&&typeof v==='object')Object.values(v).forEach(walk)};for(const k of ['playerHand','playerDiscard','aiDiscard','playerHeroes','aiHeroes','activeAttachments','presentationEvents'])walk(s[k]);return [...ids].map(localCardArt)}
function preloadDeckAssets(deck){return preloadImages([...deckAssetUrls(deck),'assets/ui/back-main.webp','assets/ui/back-legacy.webp','assets/ui/back-shard.webp','assets/shards/Generic.webp','assets/shards/Warrior.webp','assets/shards/Mage.webp','assets/shards/Archer.webp','assets/shards/Cleric.webp','assets/shards/Thief.webp'])}
const BATTLE_VFX_ASSETS=['engine/assets/battle/P.Attack.png','engine/assets/battle/M.Attack.png','engine/assets/battle/P.Defense.png','engine/assets/battle/M.Defense.png','engine/assets/battle/Heal.png','engine/assets/battle/Blade.png'];
const BATTLE_AUDIO_ASSETS=['engine/assets/audio/battle/P.Atk.mp3','engine/assets/audio/battle/M.Atk.mp3','engine/assets/audio/battle/P.Def.mp3','engine/assets/audio/battle/M.Def.mp3','engine/assets/audio/battle/Dodge.mp3','engine/assets/audio/battle/Heal.mp3'];
const battleAudioPrime=new Map();
const earlyBattleEventIds=new Set();
window.GL_PVP_EARLY_BATTLE_EVENT_IDS=earlyBattleEventIds;
function primeBattleAssets(){
  preloadImages(BATTLE_VFX_ASSETS);
  if(typeof Audio!=='undefined'&&!battleAudioPrime.size)for(const src of BATTLE_AUDIO_ASSETS){try{const a=new Audio();a.preload='auto';a.src=src;a.load();battleAudioPrime.set(src,a)}catch{}}
}
function battleAudioSpec(evt){
  if(!evt||evt.play_sound===false)return null;
  if(evt.kind==='heal')return['engine/assets/audio/battle/Heal.mp3',.52];
  if(evt.outcome==='dodge')return['engine/assets/audio/battle/Dodge.mp3',.62];
  if(evt.outcome==='block')return[(evt.defense_kind||'P')==='M'?'engine/assets/audio/battle/M.Def.mp3':'engine/assets/audio/battle/P.Def.mp3',.60];
  return[(evt.attack_kind||'P')==='M'?'engine/assets/audio/battle/M.Atk.mp3':'engine/assets/audio/battle/P.Atk.mp3',.60];
}
function playEarlyBattleAudio(evt){
  if(nativeEngine()?.getSoundEnabled?.()===false)return false;
  const spec=battleAudioSpec(evt);if(!spec||typeof Audio==='undefined')return false;
  const [src,volume]=spec;let a=battleAudioPrime.get(src);
  if(!a){try{a=new Audio();a.preload='auto';a.src=src;a.load();battleAudioPrime.set(src,a)}catch{return false}}
  try{a.pause();a.currentTime=0;a.volume=volume;const pr=a.play();if(pr&&typeof pr.catch==='function')pr.catch(()=>{});return true}catch{return false}
}
function battlePresentationEvents(snap){return snap?.match?.board?.appState?.presentationEvents||snap?.appState?.presentationEvents||[]}
function primeEarlyBattleFeedback(previousSnapshot,nextSnapshot){
  const nextStatus=String(nextSnapshot?.match?.status||''),prevStatus=String(previousSnapshot?.match?.status||'');
  if(!['started','finished'].includes(nextStatus)||!['started','finished'].includes(prevStatus))return;
  const previousIds=new Set(battlePresentationEvents(previousSnapshot).filter(e=>e?.type==='BATTLE_FEEDBACK'&&e?.id).map(e=>String(e.id)));
  const rows=battlePresentationEvents(nextSnapshot).filter(e=>e?.type==='BATTLE_FEEDBACK'&&e?.id&&!previousIds.has(String(e.id)));
  if(!rows.length)return;
  for(const row of rows){
    const id=String(row.id);earlyBattleEventIds.add(id);playEarlyBattleAudio(row);
    const visual=clone(row);visual.play_sound=false;
    const engine=nativeEngine();if(engine?.playAuthoritativeBattleFeedback)engine.playAuthoritativeBattleFeedback(visual);else engine?.queueAuthoritativeBattleFeedback?.(visual);
  }
  if(!nativeEngine()?.playAuthoritativeBattleFeedback)nativeEngine()?.flushBattleFeedback?.();
}
function installImageDecodeGuard(){
  const guard=img=>{if(!img)return;const src=String(img.getAttribute('src')||'');if(!/(?:card-art\/|assets\/shards\/|assets\/ui\/back-)/i.test(src))return;if(img.dataset.glGuardedSrc===src)return;img.dataset.glGuardedSrc=src;const alt=img.getAttribute('alt')||'';img.dataset.glResolvedAlt=alt;if(!(img.complete&&img.naturalWidth>0)){img.classList.add('gl-image-pending');img.setAttribute('alt','')}
    const done=async()=>{if(String(img.getAttribute('src')||'')!==src)return;try{await img.decode?.()}catch{}img.classList.remove('gl-image-pending');img.setAttribute('alt',alt)};img.addEventListener('load',done,{once:true});img.addEventListener('error',()=>{if(String(img.getAttribute('src')||'')===src)img.classList.remove('gl-image-pending')},{once:true});if(img.complete&&img.naturalWidth>0)done()};
  document.querySelectorAll('img').forEach(guard);new MutationObserver(rows=>rows.forEach(r=>{if(r.type==='attributes'){guard(r.target);return}r.addedNodes.forEach(n=>{if(n?.nodeType!==1)return;if(n.matches?.('img'))guard(n);n.querySelectorAll?.('img').forEach(guard)})})).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
}
function heroProgressionIds(deck,rankOneId){const rows=(deck?.legacy_deck_expanded||[]).filter(x=>String(x.card_type||'').toLowerCase()==='hero'),seed=rows.find(x=>x.card_id===rankOneId);if(!seed)return[rankOneId];return rows.filter(x=>x.package_id===seed.package_id).sort((a,b)=>Number(cardDef(a.card_id)?.rank_numeric||0)-Number(cardDef(b.card_id)?.rank_numeric||0)).map(x=>x.card_id).slice(0,3)}
function heroAtRank(deck,rankOneId){const ids=heroProgressionIds(deck,rankOneId);return ids[Math.max(0,Math.min(ids.length-1,state.rank-1))]||rankOneId}
function deckTitle(d){const label=state.customDeckName||starters()?.[state.deckKey]?.label||d?.display_name||d?.deck_name||'Selected Deck',m=label.match(/Starter\s*0?(\d+)/i);return m?'Starter Deck '+Number(m[1]):label}
function deckClassLine(d){const label=state.customDeckName||starters()?.[state.deckKey]?.label||d?.display_name||d?.deck_name||'',parts=label.split(/[—-]/);return parts.length>1?parts.slice(1).join(' ').trim().replace(/\s*\/\s*/g,', ').toUpperCase():'CUSTOM DECK'}
function deckStats(d){const s={heroes:0,legacies:0,skills:0,items:0,events:0,main:0};(d?.legacy_deck_expanded||[]).forEach(x=>{const t=String(x.card_type||'').toLowerCase();if(t==='hero')s.heroes++;if(t==='legacy')s.legacies++});(d?.main_deck||[]).forEach(x=>{const q=Math.max(0,Number(x.quantity||1)),c=cardDef(x.card_id),f=String(c?.family||c?.card_type||'').toLowerCase();s.main+=q;if(f==='item')s.items+=q;else if(f==='event')s.events+=q;else s.skills+=q});return s}
function wsBase(){if(CFG.wsBase)return String(CFG.wsBase).replace(/\/$/,'');const proto=location.protocol==='https:'?'wss:':'ws:';return proto+'//'+location.host}
function wsUrl(){const q=new URLSearchParams({client:state.clientId,name:state.name||'Player',role:state.role,buildId:BUILD_ID});if(state.seatToken)q.set('seatToken',state.seatToken);return wsBase()+(CFG.wsPath||'/ws')+'?'+q}
function send(type,payload={}){const ws=state.ws;if(!ws||ws.readyState!==WebSocket.OPEN)return false;ws.send(JSON.stringify({type,clientBuildId:BUILD_ID,...payload}));return true}
function notify(){for(const fn of state.listeners){try{fn(state.snapshot)}catch(e){console.error(e)}}window.dispatchEvent(new CustomEvent('gl-pvp-snapshot',{detail:state.snapshot}))}
function identity(){const me=local(),op=opponent(),opConn=op?.seat?state.peerConnections.get(Number(op.seat)):null;return{localName:me?.name||'PLAYER',opponentName:op?.name||'OPPONENT',localDeck:me?.deckName||'',opponentDeck:op?.deckName||'',seat:me?.seat||null,role:me?.role||state.role,localConnected:!!state.connected,localRttMs:Number.isFinite(Number(state.rttMs))?Number(state.rttMs):null,opponentConnected:!!op?.connected,opponentRttMs:Number.isFinite(Number(opConn?.rttMs??op?.rttMs))?Number(opConn?.rttMs??op?.rttMs):null}}

function clearHeartbeat(){if(state.pingTimer){clearInterval(state.pingTimer);state.pingTimer=null}}
function publishConnection(){window.dispatchEvent(new CustomEvent('gl-pvp-connection',{detail:identity()}))}
function sendPing(){if(!state.ws||state.ws.readyState!==WebSocket.OPEN)return false;state.pingSentAt=Date.now();return send('ping',{clientTime:state.pingSentAt,reportedRtt:Number.isFinite(Number(state.rttMs))?Math.round(Number(state.rttMs)):null})}
function startHeartbeat(){clearHeartbeat();sendPing();state.pingTimer=setInterval(sendPing,4000)}
let lastActivitySentAt=0;
function reportUserActivity(){const now=Date.now();if(now-lastActivitySentAt<4000)return;lastActivitySentAt=now;send('activity',{at:now})}
function installActivityTracking(){const mark=e=>{if(e&&e.isTrusted===false)return;reportUserActivity()};['pointerdown','keydown','touchstart','wheel'].forEach(type=>window.addEventListener(type,mark,{passive:true,capture:true}));window.addEventListener('pointermove',mark,{passive:true,capture:true})}
function matchClock(){const m=match()||{},start=Date.parse(m.startedAt||''),finish=Date.parse(m.finishedAt||'');if(!Number.isFinite(start))return{active:false,elapsedMs:0};return{active:['coin-flip','coin-result','opening','started'].includes(m.status),elapsedMs:Math.max(0,(Number.isFinite(finish)?finish:Date.now())-start)}}
function syncSetupSelection(){
  const me=local(),m=match();if(!state.connected||m?.status!=='setup'||me?.role!=='player')return;
  // Never overwrite a server-retained deck on refresh/reconnect. This is critical for
  // imported Custom Decks whose full payload may only exist on the server after reconnect.
  if(me?.hasDeck||me?.deckKey||me?.deckName)return;
  if(state.customDeck){send('set-deck',{customDeck:state.customDeck,deckName:state.customDeckName,formation:currentFormation()});return;}
  if(state.deckKey)send('set-deck',{deckKey:state.deckKey,formation:currentFormation()});
}

function intentError(message){
  const text=String(message||'Authoritative PvP request failed.');
  window.dispatchEvent(new CustomEvent('gl-pvp-intent-error',{detail:{message:text}}));
  console.warn('[PvP intent]',text);
}
function ensureIntentChannel(){
  if(intentChannel)return intentChannel;
  const create=window.GL_CREATE_PVP_INTENT_CHANNEL;if(typeof create!=='function')throw new Error('PvP intent channel is unavailable.');
  intentChannel=create({
    clientId:()=>state.clientId,
    getSnapshot:()=>state.snapshot,
    send:(type,payload)=>send(type,payload),
    timeoutMs:6000,
    onError:message=>intentError(message),
    onBusy:message=>console.warn('[PvP intent]',message),
    onTimeout:()=>{send('resync');window.GL_GAME_UI?.render?.()}
  });
  return intentChannel;
}
function sendIntent(name,args=[]){return ensureIntentChannel().sendIntent(String(name||''),Array.isArray(args)?clone(args):[])}
function sendIntentBatch(steps=[]){const rows=(Array.isArray(steps)?steps:[]).slice(0,INTENT_BATCH_LIMIT).filter(x=>x?.name).map(x=>({name:String(x.name),args:Array.isArray(x.args)?clone(x.args):[]}));if(!rows.length)return{ok:false,error:'Intent batch is empty.'};return ensureIntentChannel().sendBatch(rows)}
function clearIntent(error=''){if(intentChannel)intentChannel.reset(error)}

function importBoard(snap,opts={}){const b=snap?.match?.board;if(!b||!bridge()?.importSnapshot)return false;const rev=Number(snap.match.revision||0),status=String(snap.match.status||'');if(!opts.force&&rev===state.lastImportedRevision&&status===state.lastImportedStatus)return false;/* Accepted/rejected intent results and explicit resync may force-import the server snapshot even at the same revision, so stale browser-only state can never survive authority recovery. */bridge().importSnapshot(b,{notice:'',skipImportAnimations:true});state.lastImportedRevision=rev;state.lastImportedStatus=status;if(opts.render!==false)window.GL_GAME_UI?.render?.();return true}
function playerName(seat){return(state.snapshot?.players||[]).find(p=>Number(p.seat)===Number(seat))?.name||('Player '+seat)}
function syncPresentation(prevStatus,opts={}){
  const m=match(),me=local(),p=presentation();if(!m)return;
  const active=['coin-flip','coin-result','opening','started','finished'].includes(m.status),app=document.querySelector('.app');$('pvpSetupOverlay')?.classList.toggle('open',!active);document.documentElement.classList.toggle('gl-pvp-game-active',active);document.documentElement.classList.toggle('gl-pvp-opening-gated',m.status==='opening');if(app&&m.status==='opening')app.inert=true;
  // Match v6.91.6 presentation lifecycle: battlefield stays hidden throughout Coin Flip.
  // Opening itself removes gl-lobby-hidden only when the first opening motion is ready.
  if(app)app.classList.toggle('gl-lobby-hidden',m.status==='setup'||m.status==='coin-flip'||m.status==='coin-result');
  if(m.status==='setup'){state.lastImportedRevision=-1;state.lastImportedStatus='';state.lastCoinChoiceKey='';state.lastOpeningKey='';state.openingAssetKey='';state.openingAssetPromise=null;p?.setCoinGate?.(false);window.GL_GAME_UI?.resetForLobby?.();return}
  if(m.status==='coin-flip'){
    const key='choice|'+m.chooserSeat+'|'+me?.seat;if(key!==state.lastCoinChoiceKey&&p){state.lastCoinChoiceKey=key;p.showCoinChoice({canChoose:me?.role==='player'&&Number(me?.seat)===Number(m.chooserSeat),chooserName:playerName(m.chooserSeat)})}
    return;
  }
  if(m.status==='coin-result'){
    if(p){const localSeat=Number(me?.seat||1),firstSeat=Number(m.firstSeat||1);p.showCoinResult({choice:m.choice,outcome:m.outcome,firstSeat,localSeat,localWasChooser:Number(m.chooserSeat)===localSeat,winnerName:playerName(firstSeat),opponentName:opponent()?.name||'Opponent',canStartOpening:me?.role==='player'&&!!m.canStartOpening})}return;
  }
  if(m.status==='opening'){
    // Import the already-committed Opening Hand/Shard state silently. Rendering before
    // playOpening() would let the normal diff presenter see the same draws first, causing
    // duplicate opening motions and Card Sound leaking under the Coin Flip screen.
    importBoard(state.snapshot,{render:false,force:!!opts.force});
    if(me?.role==='player'&&m.opening&&p){const key=String(m.openingId||['opening',m.startedAt||'',m.opening.choice,m.opening.outcome,m.firstSeat||''].join('|'));if(key!==state.lastOpeningKey&&key!==state.openingAssetKey){state.openingAssetKey=key;state.openingAssetPromise=preloadImages(visibleBoardAssetUrls(state.snapshot)).finally(()=>{if(match()?.status!=='opening'||state.openingAssetKey!==key)return;state.lastOpeningKey=key;state.openingAssetKey='';state.openingAssetPromise=null;const opening=clone(match()?.opening||m.opening)||{};opening.presentationId=key;p.playOpening({opening});if(app)app.inert=true})}}
    else{p?.releaseGate?.();app?.classList.remove('gl-lobby-hidden');window.GL_GAME_UI?.render?.()}
    return;
  }
  if(m.status==='started'||m.status==='finished'){
    app?.classList.remove('gl-lobby-hidden');if(app)app.inert=false;p?.releaseGate?.();importBoard(state.snapshot,{render:true,force:!!opts.force});return;
  }
}
function onSnapshot(msg,opts={}){
  const previousSnapshot=state.snapshot,prevStatus=match()?.status||'setup',prevRev=Number(match()?.revision||0);primeEarlyBattleFeedback(previousSnapshot,msg);state.snapshot=msg;state.connected=true;if(msg.local?.role==='player')state.idleNotice='';
  if(msg.local?.seatToken){state.seatToken=msg.local.seatToken;persistSession('seat',state.seatToken)}
  if(msg.local?.role){state.role=msg.local.role;window.GL_PVP_LOCAL_ROLE=state.role;persistSession('role',state.role)}
  if(msg.local?.customDeck){state.customDeck=clone(msg.local.customDeck);state.customDeckName=msg.local.deckName||state.customDeck?.display_name||state.customDeck?.deck_name||'Imported Deck';state.deckKey='';state.formation=msg.local.formation||baseFormation(state.customDeck);persist('custom',JSON.stringify(state.customDeck));persist('customName',state.customDeckName);persist('deck','')}
  else if(msg.local?.deckKey){state.deckKey=msg.local.deckKey;state.customDeck=null;state.customDeckName='';state.formation=msg.local.formation||state.formation;persist('deck',state.deckKey);persist('custom','');persist('customName','')}
  else if(msg.local?.hasDeck&&msg.local?.deckName&&!state.customDeck){state.deckKey='';state.customDeckName=msg.local.deckName;state.formation=msg.local.formation||state.formation}
  renderLobby();syncPresentation(prevStatus,opts);syncSetupSelection();notify();
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
  ws.onopen=()=>{if(state.ws!==ws)return;state.connected=true;state.connectionError='';state.sessionInvalid=false;state.reconnectDelay=1200;startHeartbeat();renderLobby();publishConnection()};
  ws.onclose=ev=>{if(state.ws!==ws)return;clearHeartbeat();state.connected=false;state.rttMs=null;publishConnection();clearIntent('Connection closed before the authoritative action completed.');const code=Number(ev?.code||0);
    if(code===4003){recoverBuildMismatch();return}
    if(code===4002){state.role='spectator';state.seatToken='';persistSession('role','spectator');persistSession('seat','');renderLobby();scheduleReconnect(250);return}
    if(code===4006){/* Another tab/page took over this exact seat session. Fork this tab into a fresh player identity instead of fighting for the same socket forever. */forkConnectionIdentity();state.role='player';persistSession('role','player');state.connectionError='';renderLobby();scheduleReconnect(250);return}
    if(code===4004){/* This tab does not own the stored seat token. Treat it as a new tab/player session, never as a retry of the protected seat. */forkConnectionIdentity();state.role='player';persistSession('role','player');state.connectionError='';renderLobby();scheduleReconnect(250);return}
    if(code===4001){state.sessionInvalid=true;state.connectionError='Connection was rejected. Reconnect to retry with a fresh tab session.';renderLobby();return}
    renderLobby();scheduleReconnect();
  };
  ws.onerror=()=>{if(state.ws!==ws)return;state.connected=false;publishConnection();renderLobby()};
  ws.onmessage=ev=>{if(state.ws!==ws)return;let m;try{m=JSON.parse(ev.data)}catch{return}
    if(m.type==='snapshot')onSnapshot(m,{force:!!m.forceImport});
    else if(m.type==='intent-result'){
      const result=ensureIntentChannel().handleResult(m);
      if(m.snapshot)onSnapshot(m.snapshot,{force:true});
      if(!result.matched&&m.ok===false)intentError(m.message||'Authoritative PvP request failed.');
    }
    else if(m.type==='intent-ack'){/* Legacy rolling-deploy compatibility only. v3.80.13 completes actions with intent-result + snapshot. */}
    else if(m.type==='error'){const message=String(m.message||'Authoritative PvP request failed.');if(m.code==='CLIENT_BUILD_MISMATCH'||/CLIENT_BUILD_MISMATCH/.test(message)){recoverBuildMismatch();return}if(m.code==='SEAT_TOKEN_MISMATCH'){/* close code 4004 will fork this tab into a fresh session */state.connectionError='Seat session changed. Opening a fresh tab session…'}clearIntent(message);console.warn('[PvP]',m.code,message);if(m.snapshot)onSnapshot(m.snapshot,{force:true});else{renderLobby();window.GL_GAME_UI?.render?.()}}
    else if(m.type==='idle-timeout'){state.idleNotice=String(m.message||'');if(m.scope==='lobby'){state.role='spectator';state.seatToken='';persistSession('role','spectator');persistSession('seat','')}renderLobby();}
    else if(m.type==='pong'){const sent=Number(m.clientTime||state.pingSentAt||0);if(sent>0){const rtt=Math.max(0,Date.now()-sent);state.rttMs=state.rttMs==null?rtt:Math.round(state.rttMs*.65+rtt*.35)}state.peerConnections.clear();for(const row of (m.connections||[])){if(Number.isFinite(Number(row?.seat)))state.peerConnections.set(Number(row.seat),{connected:!!row.connected,rttMs:Number.isFinite(Number(row.rttMs))?Number(row.rttMs):null})}publishConnection()}
    else console.warn('[PvP] Unknown server message',m)
  };
}

function chooseCoin(choice){return send('choose-coin-flip',{choice:String(choice).toUpperCase()})}
function coinPresented(){return send('coin-presented')}
function confirmCoin(){return send('confirm-coin-flip')}
function openingPresented(){return send('opening-presented')}
function startMatch(){return send('start-match')}
function surrender(){const m=match();return send('surrender-match',{baseRevision:Number(m?.revision||0),clientActionId:state.clientId+'.surrender.'+(++state.intentSeq)})?{ok:true,pending:true}:{ok:false,error:'WebSocket unavailable.'}}
function returnToLobby(){return send('return-to-lobby')?{ok:true,pending:true}:{ok:false,error:'WebSocket unavailable.'}}

// PvP payment keeps v6.91.6 exact-Shard semantics without mutating donor gameplay state
// in the browser. The centered payment UI holds only an ephemeral UID draft; PAY sends the
// final UID set once, and the authoritative server validates it before donor commit.
function pvpIntent(name,args=[]){return sendIntent(String(name||''),Array.isArray(args)?args:[])}
// Presentation-facing authority facade: reads come from the exact v6.91.6 engine; gameplay writes become server intents.
const engineFacade=new Proxy({}, {get(_t,prop){
  if(prop==='intent')return pvpIntent;if(prop==='intentBatch')return sendIntentBatch;if(prop==='prepareLocalMatch'||prop==='commitOpeningSetup'||prop==='beginFirstTurn')return()=>({ok:false,error:'PvP lifecycle is server-owned.'});
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
function formationHtml(){const d=currentDeck(),f=currentFormation(),lanes=['LEFT','CENTER','RIGHT'],parts=[];lanes.forEach((lane,i)=>{const r1=f[lane]||'',id=heroAtRank(d,r1);if(i)parts.push('<button class="pvp-v260-swap-button" type="button" data-swap-left="'+(i-1)+'" data-swap-right="'+i+'"><img src="assets/lobby/swap.png" alt=""></button>');parts.push('<article class="pvp-v260-hero"><button class="pvp-v260-card" type="button" data-pvp-progression="'+esc(r1)+'"><img decoding="async" src="'+esc(cardSrc(id))+'" alt=""></button><div class="pvp-v260-position">'+esc(lane[0]+lane.slice(1).toLowerCase())+'</div></article>')});return parts.join('')}
function seatHtml(n){const p=(state.snapshot?.players||[]).find(x=>Number(x.seat)===n),online=!!p?.connected,me=local(),canKick=n===2&&p&&Number(me?.seat)===1&&match()?.status==='setup';return'<article class="pvp-v260-seat"><div><span>Player '+n+'</span><strong>'+esc(p?.name||'Empty')+'</strong></div><p class="'+(online?'online':'')+'"><i></i>'+esc(p?(online?'online':'offline'):'offline')+(p?.ready?' · READY':'')+'</p>'+(canKick?'<button class="pvp-seat-kick" type="button" data-kick-seat="2" aria-label="Kick Player 2"><img src="assets/lobby/exit.png" alt=""></button>':'')+'</article>'}
function ensureLobby(){
  if($('pvpSetupOverlay'))return;const wrap=document.createElement('div');wrap.id='pvpSetupOverlay';wrap.className='pvp-v260-lobby open';
  wrap.innerHTML='<div class="pvp-v260-page"><header class="pvp-v260-topbar"><a id="pvpHomeLogo" class="pvp-v260-logo" aria-label="Back to Grandis Legacy home"><img src="assets/lobby/grandis-legacy-logo.webp" alt="Grandis Legacy"></a><div class="pvp-v260-heading"><h1>PVP LOBBY</h1><p>Choose your deck, then ready up or spectate.</p></div></header><main class="pvp-v260-layout"><section class="pvp-v260-panel pvp-v260-deck-panel"><div class="pvp-v260-picker"><label for="pvpSetupDeck">Choose a Deck</label><div class="pvp-v260-select"><select id="pvpSetupDeck"></select></div></div><div class="pvp-v260-title"><h2 id="pvpDeckTitle">Starter Deck</h2><p id="pvpDeckClassLine"></p></div><div class="pvp-v260-showcase"><div class="pvp-v260-formation-wrap"><div id="pvpFormationPreview" class="pvp-v260-formation"></div><div class="rank-control"><button id="pvpRankPrev" type="button">‹</button><strong id="pvpRankLabel">RANK I</strong><button id="pvpRankNext" type="button">›</button></div></div><aside class="pvp-v260-summary"><h3>YOUR DECK</h3><dl id="pvpDeckStats"></dl></aside></div><div class="pvp-v260-footer"><input id="pvpImportDeckInput" type="file" accept="application/json,.json" hidden><button id="pvpImportDeckButton" class="pvp-v260-btn pvp-v260-gold pvp-v260-compact" type="button">IMPORT CUSTOM DECK</button><div id="pvpLoadedDeckStatus" class="pvp-v260-status"></div></div></section><aside class="pvp-v260-panel pvp-v260-room-panel"><h2>MATCH PANEL</h2><label class="pvp-v260-label" for="pvpSetupName">PLAYER NAME</label><div class="pvp-v260-name"><input id="pvpSetupName" maxlength="25" placeholder="Your player name" autocomplete="off"><span id="pvpNameStateIcon" class="pvp-v260-name-icon"></span></div><div class="pvp-v260-actions"><button id="pvpSetupSpectatorButton" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline" type="button">SPECTATE</button><button id="pvpSetupReadyButton" class="pvp-v260-btn pvp-v260-gold" type="button">READY</button></div><div class="pvp-v260-divider"></div><div id="pvpSetupPeople" class="pvp-v260-seats"></div><div id="pvpSetupHint" class="pvp-v260-message"></div><div class="pvp-v260-room-footer"><button id="pvpSetupStartButton" class="pvp-v260-btn pvp-v260-gold" type="button" disabled>START MATCH</button><button id="pvpSetupReconnectButton" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline" type="button">RECONNECT</button></div></aside></main></div>';
  document.body.appendChild(wrap);$('pvpHomeLogo').href=CFG.homeUrl||'https://grandislegacytcg.github.io/';wrap.onclick=e=>{const k=e.target.closest?.('[data-kick-seat="2"]');if(k){send('kick-seat-2');return}const p=e.target.closest?.('[data-pvp-progression]');if(p)openProgression(p.dataset.pvpProgression)};
  $('pvpSetupName').onblur=()=>{const n=safeName($('pvpSetupName').value);if(n){state.name=n;try{localStorage.setItem(STORE.name,n)}catch{};send('rename',{name:n});renderLobby()}};
  $('pvpSetupDeck').onchange=e=>setDeck(e.target.value);$('pvpRankPrev').onclick=()=>{state.rank=Math.max(1,state.rank-1);renderLobby()};$('pvpRankNext').onclick=()=>{state.rank=Math.min(3,state.rank+1);renderLobby()};
  $('pvpSetupReadyButton').onclick=()=>send('ready',{ready:!local()?.ready});$('pvpSetupSpectatorButton').onclick=()=>{state.role=local()?.role==='spectator'?'player':'spectator';persistSession('role',state.role);send('switch-role',{role:state.role})};$('pvpSetupStartButton').onclick=startMatch;$('pvpSetupReconnectButton').onclick=()=>connect(true);$('pvpImportDeckButton').onclick=()=>$('pvpImportDeckInput').click();
  $('pvpImportDeckInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(String(r.result||''));state.customDeck=d;state.customDeckName=d.display_name||d.deck_name||f.name.replace(/\.json$/i,'');state.deckKey='';state.formation=baseFormation(d);persist('custom',JSON.stringify(d));persist('customName',state.customDeckName);persist('deck','');send('set-deck',{customDeck:d,deckName:state.customDeckName,formation:state.formation});renderLobby()}catch(err){$('pvpLoadedDeckStatus').textContent=String(err.message||err)}};r.readAsText(f)};
}
function syncLobbyScale(){const wrap=$('pvpSetupOverlay');if(!wrap)return;if(document.documentElement.classList.contains('gl-adaptive-stage')){wrap.style.removeProperty('--pvp-lobby-scale');return}const fit=window.innerWidth<=1160;if(!fit){wrap.style.removeProperty('--pvp-lobby-scale');return}const scale=Math.max(.2,Math.min(1,(window.innerWidth||1)/1366,(window.innerHeight||1)/768));wrap.style.setProperty('--pvp-lobby-scale',String(scale))}
function renderLobby(){
  ensureLobby();syncLobbyScale();const active=['coin-flip','coin-result','opening','started','finished'].includes(match()?.status),wrap=$('pvpSetupOverlay');wrap.classList.toggle('open',!active);if(active)return;
  const keys=optionKeys(),meNow=local();if(!state.deckKey&&!state.customDeck&&!meNow?.hasDeck&&keys[0]){state.deckKey=keys[0];state.formation=baseFormation(starterDeck(keys[0]));persist('deck',state.deckKey);if(state.connected&&meNow?.role==='player')send('set-deck',{deckKey:state.deckKey,formation:state.formation})}
  const sel=$('pvpSetupDeck'),serverCustom=!!(meNow?.hasDeck&&!meNow?.deckKey&&!state.customDeck);sel.innerHTML=keys.map(k=>'<option value="'+esc(k)+'" '+(k===state.deckKey?'selected':'')+'>'+esc(starters()[k]?.label||k)+'</option>').join('')+((state.customDeck||serverCustom)?'<option selected value="">'+esc(state.customDeckName||meNow?.deckName||'Imported Deck')+'</option>':'');
  const d=currentDeck(),stats=deckStats(d);if(d)preloadDeckAssets(d);$('pvpDeckTitle').textContent=deckTitle(d);$('pvpDeckClassLine').textContent=deckClassLine(d);$('pvpFormationPreview').innerHTML=formationHtml();$('pvpFormationPreview').querySelectorAll('[data-swap-left]').forEach(b=>b.onclick=()=>swapFormation(Number(b.dataset.swapLeft),Number(b.dataset.swapRight)));$('pvpRankLabel').textContent='RANK '+['I','II','III'][state.rank-1];
  $('pvpDeckStats').innerHTML='<div><dt>Heroes</dt><dd>'+stats.heroes+'</dd></div><div><dt>Legacies</dt><dd>'+stats.legacies+'</dd></div><div class="total legacy-total"><dt>Legacy Deck</dt><dd>'+(d?.legacy_deck_expanded?.length||0)+'</dd></div><div class="deck-section-start"><dt>Skills</dt><dd>'+stats.skills+'</dd></div><div><dt>Items</dt><dd>'+stats.items+'</dd></div><div><dt>Events</dt><dd>'+stats.events+'</dd></div><div class="total main-total"><dt>Main Deck</dt><dd>'+stats.main+'</dd></div>';
  $('pvpSetupPeople').innerHTML=seatHtml(1)+seatHtml(2);$('pvpSetupName').value=state.name||'';const me=local(),spec=me?.role==='spectator';$('pvpSetupReadyButton').textContent=me?.ready?'UNREADY':'READY';$('pvpSetupReadyButton').disabled=!state.connected||spec||(!d&&!me?.hasDeck);$('pvpSetupSpectatorButton').textContent=spec?'JOIN AS PLAYER':'SPECTATE';$('pvpSetupStartButton').disabled=!(me?.seat===1&&(state.snapshot?.players||[]).length===2&&(state.snapshot?.players||[]).every(p=>p.connected&&p.ready&&p.hasDeck));$('pvpSetupReconnectButton').textContent=state.sessionInvalid?'NEW SESSION':'RECONNECT';$('pvpSetupHint').textContent=state.idleNotice||(state.fatalBuildMismatch?'Client update required. Refresh this page.':state.connectionError||(!state.connected?'Connecting to PvP service…':spec?'Spectator mode is read-only. Both Hands remain hidden.':me?.seat===1?'Waiting for both players to be ready.':'Ready up when your deck is selected.'));const ic=$('pvpNameStateIcon');ic.className='pvp-v260-name-icon'+(spec?' spectate':me?.ready?' ready':'');
}
function boot(){state.clientId=makeClientId();try{const u=new URL(location.href),explicitDeck=u.searchParams.get('deck')||'';state.name=safeName(u.searchParams.get('name')||stored('name')||'Player');state.role=(u.searchParams.get('role')||sessionStored('role')||'player')==='spectator'?'spectator':'player';state.seatToken=sessionStored('seat')||'';const rawCustom=localStorage.getItem(STORE.custom)||'';if(rawCustom&&!explicitDeck){try{state.customDeck=JSON.parse(rawCustom);state.customDeckName=localStorage.getItem(STORE.customName)||state.customDeck?.display_name||state.customDeck?.deck_name||'Imported Deck';state.formation=baseFormation(state.customDeck)}catch{persist('custom','');persist('customName','')}}state.deckKey=explicitDeck||(!state.customDeck?stored('deck'):'')||''}catch{}persist('name',state.name);persistSession('role',state.role);window.GL_PVP_LOCAL_ROLE=state.role;installImageDecodeGuard();primeBattleAssets();installActivityTracking();ensureLobby();renderLobby();window.addEventListener('resize',syncLobbyScale,{passive:true});connect(false)}

window.GL_PVP_HOST={version:VERSION,buildId:BUILD_ID,getSnapshot:()=>state.snapshot,subscribe(fn){state.listeners.add(fn);return()=>state.listeners.delete(fn)},sendIntent,sendIntentBatch,startMatch,chooseCoin,coinPresented,confirmCoin,openingPresented,matchClock,surrender,returnToLobby,identity,reconnect:()=>connect(true),getConnection:()=>({connected:state.connected,buildMismatch:state.fatalBuildMismatch,rttMs:Number.isFinite(Number(state.rttMs))?Number(state.rttMs):null,peers:[...state.peerConnections.entries()].map(([seat,v])=>({seat,...v}))})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
