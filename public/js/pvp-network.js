/* Grandis Legacy PvP v3.47 safe v3.45 rebuild + approved Rank-selector UI port.
   Candidate 2 source/presentation architecture is preserved. Gameplay is intent-only on the client:
   server validation/canonical runtime commits authoritative state, then viewer-safe snapshots cross the
   PvP presentation adapter before the shared VS AI v6.42 Candidate 15 renderer. */
(function(){
  'use strict';
  var VERSION='Grandis Legacy PvP v3.51 · Final Stability Release · Server-Authoritative Presentation · OSA v1.9.5 · 2 Players + 4 Spectators';
  var STORE_KEY='grandis_legacy_pvp_v20_client_id';
  var ROOM_KEY='grandis_legacy_pvp_v20_room';
  var NAME_KEY='grandis_legacy_pvp_v20_name';
  var ROLE_KEY='grandis_legacy_pvp_v20_role';
  var ws=null,reconnectTimer=null,reconnectDelay=1200,intentTimeoutTimer=null,connectTimeoutTimer=null,matchTimerInterval=null;
  var state={connected:false,connectionState:'idle',connectionMessage:'',connectionUrl:'',snapshot:null,room:'LOBBY',name:'',role:'player',deckKey:'',loadedDeckKey:'',customDeck:null,customDeckName:'',clientId:'',lobbyRankPreview:1,lobbyFormation:null,lastAppliedRevision:0,applyingServer:false,intentInFlight:false,intentBaseRevision:0,intentName:'',intentActionId:'',intentSentAt:0,actionSequence:0,seatToken:'',lastMatchStatus:'setup',seenAnimationIds:{},lastCoinAnimationKey:'',coinResultReadyKey:'',mobileHandScrollLeft:0,mobileHandMode:'preserve',mobileHandApplyToken:0,mobileHandHooksInstalled:false,spectatorLobbyView:false,spectatorBattlefieldEntered:false,nameDraft:'',roomGeneration:0,reloadAfterRoomReset:false,latencyMs:null,opponentLatencyMs:null,lastPingSentAt:0,lastPongAt:0};
  var DEPLOY_CONFIG=window.GL_PVP_CONFIG||window.GL_CONFIG||{};
  var CLIENT_BUILD_ID=String(DEPLOY_CONFIG.buildId||'gl-pvp-3.51-final-stability-r1-2026-09-28');
  function fixedDeploymentRoom(){var n=Number(DEPLOY_CONFIG.roomId||0);return n===1||n===2?n:0;}
  function roomNumber(){var fixed=fixedDeploymentRoom();if(fixed)return fixed;try{return Number(new URL(location.href).searchParams.get('server'))===2?2:1;}catch(e){return 1;}}
  function roomDisplayName(){return DEPLOY_CONFIG.roomName||('PvP Room '+roomNumber());}
  function otherRoomUrl(){if(DEPLOY_CONFIG.otherRoomUrl)return DEPLOY_CONFIG.otherRoomUrl;try{var u=new URL(location.href);if(roomNumber()===1)u.searchParams.set('server','2');else u.searchParams.delete('server');return u.toString();}catch(e){return '';}}
  function deckBuilderUrl(){return DEPLOY_CONFIG.deckBuilderUrl||'https://grandislegacytcg.github.io/Grandis-Legacy-Deck-Builder/style-1/';}
  function aiLobbyUrl(){return DEPLOY_CONFIG.aiLobbyUrl||'https://grandislegacytcg.github.io/Grandis-Legacy-VS-AI/';}
  function homeUrl(){return DEPLOY_CONFIG.homeUrl||'https://grandislegacytcg.github.io/';}
  function seatTokenStorageKey(){return SEAT_TOKEN_KEY+'_room_'+roomNumber();}
  function websocketBase(){var base=roomNumber()===2?DEPLOY_CONFIG.room2WsBase:DEPLOY_CONFIG.room1WsBase;if(base)return String(base).replace(/\/$/,'');var host=String(location.hostname||'').toLowerCase();if(/(^|\.)github\.io$/.test(host))throw new Error('Remote PvP WebSocket endpoint is not configured for '+roomDisplayName()+'.');var protocol=location.protocol==='https:'?'wss:':'ws:';return protocol+'//'+location.host;}
  function connectionTimeoutMs(){var n=Number(DEPLOY_CONFIG.connectionTimeoutMs||10000);return Number.isFinite(n)&&n>=3000?Math.min(n,30000):10000;}
  function clearConnectTimeout(){if(connectTimeoutTimer){clearTimeout(connectTimeoutTimer);connectTimeoutTimer=null;}}
  function setConnectionState(kind,message,url){state.connectionState=kind||'offline';state.connectionMessage=String(message||'');if(url!==undefined)state.connectionUrl=String(url||'');setStatus(kind==='connected'?'online':(kind==='connecting'?'connecting':'offline'),state.connectionMessage||kind);renderLobby();}
  function roomLink(){var u=new URL(location.href);u.searchParams.set('name',state.name||'');u.searchParams.set('role',localRole()||state.role||'player');var deck=activeLoadedDeckKey();if(deck)u.searchParams.set('deck',deck);else u.searchParams.delete('deck');return u.toString();}
  var DECK_OPTIONS=Object.keys(window.GL_PVP_STARTER_DECK_OPTIONS||{}).map(function(key){var o=window.GL_PVP_STARTER_DECK_OPTIONS[key]||{};return {key:key,label:o.label||key};});
  var DECK_KEY='grandis_legacy_pvp_v20_deck';
  var LOADED_DECK_KEY='grandis_legacy_pvp_v20_loaded_deck';
  var SEAT_TOKEN_KEY='grandis_legacy_pvp_v20_seat_token';
  function $(id){return document.getElementById(id);} 
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];});}
  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
  function safeRoom(v){var x=String(v||'LOBBY').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,48);return x||'LOBBY';}
  function safeName(v){var x=String(v||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,48);return x;}
  function id(){try{var existing=localStorage.getItem(STORE_KEY);if(existing)return existing;var x='c_'+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem(STORE_KEY,x);return x;}catch(e){return 'c_'+Math.random().toString(36).slice(2);}}
  function bridge(){return window.GL_LOCAL_AI_BRIDGE||null;}
  function localSeat(){return state.snapshot&&state.snapshot.local&&state.snapshot.local.seat||null;}
  function localRole(){return state.snapshot&&state.snapshot.local&&state.snapshot.local.role||state.role;}
  function match(){return state.snapshot&&state.snapshot.match||null;}
  function appState(){var b=bridge();return b&&b.getSnapshot&&b.getSnapshot().appState||null;}
  function deckLabel(key){var d=DECK_OPTIONS.find(function(x){return x.key===key;});return d?d.label:'';}
  function deckSelectOptions(selected){selected=selected||DECK_OPTIONS[0].key;return DECK_OPTIONS.map(function(d){return '<option value="'+esc(d.key)+'" '+(d.key===selected?'selected':'')+'>'+esc(d.label)+'</option>';}).join('');}
  function activeLoadedDeckKey(){return state.loadedDeckKey||((state.snapshot&&state.snapshot.local&&state.snapshot.local.deckKey)||'');}
  function loadedDeckLabel(){return state.customDeckName||(state.snapshot&&state.snapshot.local&&state.snapshot.local.deckName)||deckLabel(activeLoadedDeckKey())||'';}
  function starterObject(key){var b=bridge();try{var opts=b&&b.getStarterDeckOptions&&b.getStarterDeckOptions();return opts&&(opts[key]||opts[String(key)]);}catch(e){return null;}}
  function starterDeckData(key){var o=starterObject(key);return o&&o.deck?o.deck:null;}
  function cardLookup(id){var defs=window.GL_CARD_DEFINITIONS;if(!defs)return null;if(!cardLookup._map){var map={};if(Array.isArray(defs.cards))defs.cards.forEach(function(c){if(c&&c.card_id)map[c.card_id]=c;});else Object.keys(defs.families||{}).forEach(function(f){((defs.families[f]&&defs.families[f].cards)||[]).forEach(function(c){if(c&&c.card_id)map[c.card_id]=c;});});cardLookup._map=map;}return cardLookup._map[id]||null;}
  function cardDisplayName(id){var c=cardLookup(id);return (c&&(c.name||c.card_name))||id||'Unknown';}
  function thumbFor(id){var root=window.GL_ASSET_MANIFEST||{},ui=root.ui||{},cards=root.cards||{};var p;if(id==='__HIDDEN_CARD_BACK__'||id==='__HIDDEN_CARD__')p=ui.main_deck_card_back;else{var m=cards[id]||root[id]||{};p=m.thumb_url||m.full_url;}p=p||ui.main_deck_card_back||'https://grandislegacytcg.github.io/shared/season1/v1/cards/ui/Back-of-Card-Main-Deck.webp';return p+(p.indexOf('?')===-1?'?':'&')+'v=gl-pvp-3.43-candidate1';}
  function currentSelectedDeckData(){return state.customDeck||starterDeckData(state.deckKey)||starterDeckData(activeLoadedDeckKey());}
  var LOBBY_FORMATION_LANES=['LEFT','CENTER','RIGHT'];
  function baseLobbyFormation(deck){var f=deck&&deck.default_formation||{};return {LEFT:String(f.LEFT||''),CENTER:String(f.CENTER||''),RIGHT:String(f.RIGHT||'')};}
  function formationIsValid(deck,formation){var base=baseLobbyFormation(deck),a=LOBBY_FORMATION_LANES.map(function(l){return String(base[l]||'');}).sort(),b=LOBBY_FORMATION_LANES.map(function(l){return String(formation&&formation[l]||'');}).sort();return a.every(Boolean)&&b.every(Boolean)&&new Set(b).size===3&&a.join('|')===b.join('|');}
  function currentLobbyFormation(deck){deck=deck||currentSelectedDeckData();if(state.lobbyFormation&&formationIsValid(deck,state.lobbyFormation))return clone(state.lobbyFormation);return baseLobbyFormation(deck);}
  function resetLobbyFormation(deck){state.lobbyFormation=clone(baseLobbyFormation(deck||currentSelectedDeckData()));return state.lobbyFormation;}
  function swapLobbyFormation(leftIndex,rightIndex){var d=currentSelectedDeckData();if(!d)return false;var f=currentLobbyFormation(d),lanes=LOBBY_FORMATION_LANES.slice(),a=lanes[Number(leftIndex)],b=lanes[Number(rightIndex)];if(!a||!b||a===b)return false;var t=f[a];f[a]=f[b];f[b]=t;if(!formationIsValid(d,f))return false;state.lobbyFormation=clone(f);if(state.customDeck){state.customDeck=clone(state.customDeck);state.customDeck.default_formation=clone(f);if(state.connected&&localRole()!=='spectator')send('set-deck',{customDeck:state.customDeck,deckName:state.customDeckName});}else if(state.connected&&localRole()!=='spectator'){send('set-deck',{deckKey:state.deckKey||activeLoadedDeckKey(),formation:clone(f)});}renderPanel();return true;}
  function localPlayer(){return state.snapshot&&state.snapshot.local||null;}
  function opponentPlayer(){var snap=state.snapshot,me=localPlayer();if(!snap||!me||!snap.players)return null;return snap.players.find(function(p){return p.seat&&Number(p.seat)!==Number(me.seat);})||null;}
  function cleanDisplayName(v){var name=safeName(v||'');return /^(opponent|player)$/i.test(name)?'':name;}
  function playerNameForSeat(seat){
    seat=Number(seat);var snap=state.snapshot||{},ps=snap.players||[],p=ps.find(function(x){return Number(x.seat)===seat;});
    var direct=cleanDisplayName(p&&p.name);if(direct)return direct;
    var explicit=cleanDisplayName(snap.displayNames&&(snap.displayNames[seat]||snap.displayNames[String(seat)]));if(explicit)return explicit;
    var matchNames=snap.match&&snap.match.playerNames||{};var matchName=cleanDisplayName(matchNames[seat]||matchNames[String(seat)]);if(matchName)return matchName;
    var me=localPlayer();if(me&&Number(me.seat)===seat){var self=cleanDisplayName(me.name);if(self)return self;}
    return 'Player '+seat;
  }
  function opponentLabel(){var seat=localSeat()===2?1:2;return playerNameForSeat(seat);}
  function selfLabel(){var seat=localSeat()||1;return playerNameForSeat(seat);}
  function signalClassForLatency(ms){if(!state.connected)return'offline';if(ms===null||ms===undefined||ms==='')return'connecting';ms=Number(ms);if(!isFinite(ms)||ms<0)return'connecting';if(ms<=90)return'excellent';if(ms<=180)return'good';if(ms<=350)return'fair';return'poor';}
  function opponentSignalClass(){var p=opponentPlayer();if(p&&p.connected===false)return'offline';if(!p)return'connecting';if(state.opponentLatencyMs!==null&&state.opponentLatencyMs!==undefined)return signalClassForLatency(state.opponentLatencyMs);return'online';}
  function syncConnectionSignalGlobals(){window.GL_PVP_LOCAL_SIGNAL=signalClassForLatency(state.latencyMs);window.GL_PVP_OPPONENT_SIGNAL=opponentSignalClass();window.GL_PVP_LOCAL_LATENCY_MS=(state.latencyMs!==null&&state.latencyMs!==undefined&&Number.isFinite(Number(state.latencyMs)))?Math.round(Number(state.latencyMs)):null;window.GL_PVP_OPPONENT_LATENCY_MS=(state.opponentLatencyMs!==null&&state.opponentLatencyMs!==undefined&&Number.isFinite(Number(state.opponentLatencyMs)))?Math.round(Number(state.opponentLatencyMs)):null;}
  function sideLabel(side){return side==='AI'?opponentLabel():(side==='PLAYER'?selfLabel():side);}
  function humanizeRuntimeText(v){return String(v==null?'':v).replace(/\bAI\b/g,opponentLabel()).replace(/\bPLAYER\b/g,selfLabel());}
  function visibleDeckName(v){var full=String(v==null?'':v);return full.length<=25?full:full.slice(0,22)+'...';}
  function formatMatchDuration(ms){var sec=Math.max(0,Math.floor(Number(ms||0)/1000)),min=Math.floor(sec/60),rem=sec%60;return String(min).padStart(2,'0')+':'+String(rem).padStart(2,'0');}
  function currentMatchTimerText(m,now){m=m||match()||{};var started=Date.parse(m.startedAt||'');if(!Number.isFinite(started))return'00:00';var finished=Date.parse(m.finishedAt||''),end=Number.isFinite(finished)?finished:Number(now||Date.now());return formatMatchDuration(Math.max(0,end-started));}
  function syncMatchTimerNode(){var text=String(window.GL_PVP_MATCH_TIMER_TEXT||'00:00');Array.prototype.forEach.call(document.querySelectorAll('[data-pvp-match-timer]'),function(node){if(node.textContent!==text)node.textContent=text;node.setAttribute('aria-label','Match duration '+text);node.setAttribute('title','Match duration '+text);});return text;}
  function syncMatchTimerState(m){m=m||match()||{};window.GL_PVP_MATCH_STARTED_AT=m.startedAt||null;window.GL_PVP_MATCH_FINISHED_AT=m.finishedAt||null;window.GL_PVP_MATCH_TIMER_TEXT=currentMatchTimerText(m);syncMatchTimerNode();return window.GL_PVP_MATCH_TIMER_TEXT;}
  function ensureMatchTimerInterval(){if(matchTimerInterval)return matchTimerInterval;matchTimerInterval=setInterval(function(){var m=match()||{};if(!m.startedAt)return;syncMatchTimerState(m);},1000);return matchTimerInterval;}
  function syncDeckNameNode(node,full){if(!node)return;full=String(full==null?'':full);var visible=visibleDeckName(full);if(node.textContent!==visible)node.textContent=visible;if(node.getAttribute('title')!==full)node.setAttribute('title',full);var aria='Deck: '+full;if(node.getAttribute('aria-label')!==aria)node.setAttribute('aria-label',aria);}
  window.GL_PVP_VISIBLE_DECK_NAME=visibleDeckName;
  function updateSignalNode(node,signal,latency){if(!node)return;var prev=node.getAttribute('data-pvp-signal-state')||'';if(prev!==signal){if(prev)node.classList.remove(prev);node.classList.add(signal);node.setAttribute('data-pvp-signal-state',signal);}var label=signal==='offline'?'Offline':(signal==='connecting'?'Connecting':(latency!=null?'Internet '+signal+' · '+latency+' ms':'Internet '+signal));if(node.getAttribute('aria-label')!==label)node.setAttribute('aria-label',label);if(node.getAttribute('title')!==label)node.setAttribute('title',label);}
  function syncBattlefieldIdentityHeaders(){
    var localName=selfLabel(),remoteName=opponentLabel(),me=localPlayer(),other=opponentPlayer(),st=appState()||{};
    var localDeck=(me&&me.deckName)||st.playerDeckName||loadedDeckLabel()||'Your Deck';
    var remoteDeck=(other&&other.deckName)||st.aiDeckName||'Opponent Deck';
    window.GL_PVP_LOCAL_NAME=localName||'YOU';window.GL_PVP_OPPONENT_NAME=remoteName||'OPPONENT';syncConnectionSignalGlobals();
    var localSignal=window.GL_PVP_LOCAL_SIGNAL||'connecting',remoteSignal=window.GL_PVP_OPPONENT_SIGNAL||'connecting',latency=window.GL_PVP_LOCAL_LATENCY_MS;
    Array.prototype.forEach.call(document.querySelectorAll('[data-pvp-identity-side="PLAYER"]'),function(header){var n=header.querySelector('.pvp-player-display-name'),d=header.querySelector('.pvp-player-deck-name'),sig=header.querySelector('[data-pvp-signal-side="PLAYER"]');if(n&&n.textContent!==localName)n.textContent=localName;syncDeckNameNode(d,localDeck);updateSignalNode(sig,localSignal,latency);});
    Array.prototype.forEach.call(document.querySelectorAll('[data-pvp-identity-side="AI"]'),function(header){var n=header.querySelector('.pvp-player-display-name'),d=header.querySelector('.pvp-player-deck-name'),sig=header.querySelector('[data-pvp-signal-side="AI"]');if(n&&n.textContent!==remoteName)n.textContent=remoteName;syncDeckNameNode(d,remoteDeck);updateSignalNode(sig,remoteSignal,window.GL_PVP_OPPONENT_LATENCY_MS);});
    return true;
  }
  var COIN_HEAD_SRC='https://grandislegacytcg.github.io/shared/season1/v1/cards/ui/Racial-Token-Head.webp?v=gl-pvp-3.07';
  var COIN_TAIL_SRC='https://grandislegacytcg.github.io/shared/season1/v1/cards/ui/Racial-Token-Tail.webp?v=gl-pvp-3.07';
  function coinFaceSrc(face){return String(face||'').toUpperCase()==='TAILS'?COIN_TAIL_SRC:COIN_HEAD_SRC;}
  function coinFaceLabel(face){return String(face||'').toUpperCase()==='TAILS'?'Tails':'Heads';}
  function coinChoiceButton(id,face,scope){var label=coinFaceLabel(face);return '<button id="'+id+'" class="pvp-coin-choice '+(scope||'')+'" type="button" aria-label="Choose '+label+'"><img src="'+coinFaceSrc(face)+'" alt="'+label+'"></button>';}
  function coinChoiceDisplay(face,scope){var label=coinFaceLabel(face);return '<button class="pvp-coin-choice '+(scope||'')+' waiting-display" type="button" disabled aria-disabled="true" aria-label="'+label+' — waiting for opponent choice"><img src="'+coinFaceSrc(face)+'" alt="'+label+'"></button>';}
  function coinFaceDisplay(face,extraClass){var label=coinFaceLabel(face),cls='pvp-coin-result-face'+(extraClass?' '+extraClass:'');return '<img class="'+cls+'" src="'+coinFaceSrc(face)+'" alt="'+label+'">';}
  function setPvpCoinFaceElement(img,face){if(!img)return;var f=String(face||'HEADS').toUpperCase()==='TAILS'?'TAILS':'HEADS';img.src=coinFaceSrc(f);img.alt=coinFaceLabel(f);}
  function pvpCoinResultKey(m){var f=m&&m.openingCoinFlip;return f?[f.choice,f.outcome,f.firstSeat||f.firstPlayerName||''].join('|'):'';}
  function pvpCoinResultReady(m){var key=pvpCoinResultKey(m);return !!key&&state.coinResultReadyKey===key;}
  function requestGameplayAudioUnlock(){var b=bridge();return !!(b&&b.unlockGameplayAudioPlayback&&b.unlockGameplayAudioPlayback());}
  function animatePvpCoinOutcomeFaces(outcome,onComplete){
    if(typeof document==='undefined'){if(onComplete)onComplete();return false;}
    outcome=String(outcome||'HEADS').toUpperCase()==='TAILS'?'TAILS':'HEADS';
    var nodes=Array.prototype.slice.call(document.querySelectorAll('.pvp-coin-outcome-flip'));if(!nodes.length){if(onComplete)onComplete();return false;}
    var audioBridge=bridge();if(audioBridge&&audioBridge.playOpeningCoinSound)audioBridge.playOpeningCoinSound();
    var remaining=nodes.length;
    nodes.forEach(function(img){
      var visualFace=outcome==='HEADS'?'TAILS':'HEADS',step=0,totalSteps=8,halfDuration=72,finished=false;
      setPvpCoinFaceElement(img,visualFace);img.style.filter='none';img.style.backfaceVisibility='hidden';img.style.transform='translateY(0) scaleX(1)';
      function done(){if(finished)return;finished=true;setPvpCoinFaceElement(img,outcome);img.style.transition='none';img.style.transform='translateY(0) scaleX(1)';img.style.filter='none';remaining--;if(!remaining&&onComplete)setTimeout(onComplete,1000);}
      function runStep(){if(step>=totalSteps){done();return;}var progress=(step+1)/totalSteps,lift=Math.round(Math.sin(progress*Math.PI)*18);img.style.transition='transform '+halfDuration+'ms cubic-bezier(.45,0,.55,1)';img.style.transform='translateY(-'+lift+'px) scaleX(.04)';setTimeout(function(){visualFace=visualFace==='HEADS'?'TAILS':'HEADS';setPvpCoinFaceElement(img,visualFace);img.style.transition='transform '+halfDuration+'ms cubic-bezier(.2,.75,.3,1)';img.style.transform='translateY(-'+lift+'px) scaleX(1)';setTimeout(function(){step++;runStep();},halfDuration);},halfDuration);}
      runStep();
    });
    return true;
  }
  function maybeAnimatePvpCoinResult(m){
    if(!m||m.status!=='coin-result'||!m.openingCoinFlip){state.lastCoinAnimationKey='';state.coinResultReadyKey='';return false;}
    var key=pvpCoinResultKey(m);if(state.lastCoinAnimationKey===key)return false;state.lastCoinAnimationKey=key;state.coinResultReadyKey='';
    var start=function(){animatePvpCoinOutcomeFaces(m.openingCoinFlip.outcome,function(){state.coinResultReadyKey=key;renderPanel();syncBattlefieldCoinModal();});};if(typeof requestAnimationFrame==='function')requestAnimationFrame(start);else setTimeout(start,0);return true;
  }
  function openingFlipText(m){var f=m&&m.openingCoinFlip;if(!f)return '';var starter=f.firstPlayerName||f.firstSeatLabel||('Player '+(f.firstSeat||'?'));return 'Opening Coin Flip complete. '+starter+' starts in Draw Phase.';}
  function coinFlipControlHtml(m,me){m=m||{};var cf=m.coinFlip||{},chooser=playerNameForSeat(2);if(m.status==='coin-flip'&&cf.pending){if(me&&me.role==='player'&&me.seat===2){return '<div class="pvp-coin-box"><b>Opening Coin Flip</b><span>Choose one coin face.</span><div class="pvp-coin-actions">'+coinChoiceButton('pvpChooseHeadsButton','HEADS','compact')+coinChoiceButton('pvpChooseTailsButton','TAILS','compact')+'</div></div>';}return '<div class="pvp-coin-box waiting"><b>Opening Coin Flip</b><span>Waiting for '+esc(chooser)+' to choose.</span><div class="pvp-coin-actions">'+coinChoiceDisplay('HEADS','compact')+coinChoiceDisplay('TAILS','compact')+'</div></div>';}if(m.status==='coin-result'&&m.openingCoinFlip){return '<div class="pvp-coin-box result"><b>Opening Coin Flip Result</b><div class="pvp-coin-result-grid compact"><div><span>'+esc(chooser)+' chose</span>'+coinFaceDisplay(m.openingCoinFlip.choice)+'</div><div><span>Coin result</span>'+coinFaceDisplay(m.openingCoinFlip.outcome,'pvp-coin-outcome-flip')+'</div></div><span>'+esc(openingFlipText(m))+'</span><div class="pvp-coin-actions single"><button id="pvpConfirmCoinButton" class="gold" type="button" '+(pvpCoinResultReady(m)?'':'disabled aria-disabled="true"')+'>Start Game</button></div></div>';}if(m.status==='started'&&m.openingCoinFlip){return '<div class="pvp-coin-box done"><b>Opening Coin Flip</b><span>'+esc(openingFlipText(m))+'</span></div>';}return '<div class="pvp-coin-box idle"><b>Opening Coin Flip</b><span>'+esc(chooser)+' chooses one coin face after Player 1 starts the match.</span></div>';}
  function wireCoinButtons(){var h=$('pvpChooseHeadsButton'),t=$('pvpChooseTailsButton'),c=$('pvpConfirmCoinButton');if(h)h.onclick=function(){send('choose-coin-flip',{choice:'HEADS'});};if(t)t.onclick=function(){send('choose-coin-flip',{choice:'TAILS'});};if(c)c.onclick=function(){send('confirm-coin-flip');};}
  function closeBattlefieldCoinModal(){var el=$('pvpBattlefieldCoinModal');if(el)el.remove();}
  function syncBattlefieldCoinModal(){
    var snap=state.snapshot||{},m=snap.match||{},me=snap.local||{},chooser=playerNameForSeat(2),html='';
    if(m.status==='coin-flip'&&m.coinFlip&&m.coinFlip.pending&&m.serverBoard){
      var canChoose=!!(me&&me.role==='player'&&me.seat===2),instruction=canChoose?'Choose Heads or Tails. The winner takes the first Draw Phase.':'Waiting for '+esc(chooser)+' to choose Heads or Tails.';
      html='<section class="gl-opening-coin-card"><h2>Opening Coin Flip</h2><p>'+instruction+'</p><div class="gl-opening-coin-actions"><button id="pvpBattleHeads" type="button" '+(canChoose?'':'disabled aria-disabled="true"')+'>'+coinFaceDisplay('HEADS')+'<span>Heads</span></button><button id="pvpBattleTails" type="button" '+(canChoose?'':'disabled aria-disabled="true"')+'>'+coinFaceDisplay('TAILS')+'<span>Tails</span></button></div></section>';
    }else if(m.status==='coin-result'&&m.openingCoinFlip&&m.serverBoard){
      var f=m.openingCoinFlip,winner=esc(f.firstPlayerName||f.firstSeatLabel||'Winner');
      html='<section class="gl-opening-coin-card result"><h2>Opening Coin Flip Result</h2><div class="gl-opening-coin-winner"><span>WINNER</span><strong>'+winner+'</strong><p>'+winner+' takes the first Draw Phase.</p></div><div class="gl-opening-coin-result"><div><span>'+esc(chooser)+' chose</span>'+coinFaceDisplay(f.choice)+'</div><div><span>Coin result</span>'+coinFaceDisplay(f.outcome,'pvp-coin-outcome-flip')+'</div></div><button id="pvpBattleConfirmCoin" class="gl-opening-start-button" type="button" '+(pvpCoinResultReady(m)?'':'disabled aria-disabled="true"')+'>Start Game</button></section>';
    }else{closeBattlefieldCoinModal();return;}
    var modal=$('pvpBattlefieldCoinModal');if(!modal){modal=document.createElement('div');modal.id='pvpBattlefieldCoinModal';modal.className='gl-opening-coin-modal';document.body.appendChild(modal);}modal.innerHTML=html;
    var h=$('pvpBattleHeads'),t=$('pvpBattleTails'),c=$('pvpBattleConfirmCoin');if(h)h.onclick=function(){send('choose-coin-flip',{choice:'HEADS'});};if(t)t.onclick=function(){send('choose-coin-flip',{choice:'TAILS'});};if(c)c.onclick=function(){send('confirm-coin-flip');};
  }
  function initState(){installMobileHandHooks();var u=new URL(location.href);state.clientId=id();try{state.seatToken=localStorage.getItem(seatTokenStorageKey())||'';}catch(e){state.seatToken='';}state.room='LOBBY';state.name=safeName(u.searchParams.get('name')||localStorage.getItem(NAME_KEY)||'');state.nameDraft=state.name;state.role=(u.searchParams.get('role')||localStorage.getItem(ROLE_KEY)||'player').toLowerCase()==='spectator'?'spectator':'player';state.deckKey=String(u.searchParams.get('deck')||localStorage.getItem(DECK_KEY)||'');if(!DECK_OPTIONS.some(function(d){return d.key===state.deckKey;}))state.deckKey=DECK_OPTIONS[0]&&DECK_OPTIONS[0].key||'';state.loadedDeckKey=String(u.searchParams.get('deck')||localStorage.getItem(LOADED_DECK_KEY)||state.deckKey||'');if(!DECK_OPTIONS.some(function(d){return d.key===state.loadedDeckKey;}))state.loadedDeckKey=state.deckKey;try{localStorage.setItem(DECK_KEY,state.deckKey);localStorage.setItem(LOADED_DECK_KEY,state.loadedDeckKey);}catch(e){}}
  function wsUrl(){var q=new URLSearchParams({room:state.room,client:state.clientId,name:state.name||'Player',role:state.role,buildId:CLIENT_BUILD_ID});if(state.seatToken)q.set('seatToken',state.seatToken);var dk=activeLoadedDeckKey()||state.deckKey;if(dk)q.set('deck',dk);return websocketBase()+(DEPLOY_CONFIG.wsPath||'/ws')+'?'+q.toString();}
  function send(type,payload){if(!ws||ws.readyState!==WebSocket.OPEN){setStatus('offline','Not connected.');return false;}ws.send(JSON.stringify(Object.assign({type:type,clientBuildId:CLIENT_BUILD_ID},payload||{})));return true;}
  function setStatus(cls,msg){var el=$('pvpNetworkStatus');if(el){el.className='pvp-net-status '+cls;el.textContent=msg;} }
  function currentRevision(){var m=match();return Number(m&&m.serverBoardRevision||0);}
  function isMobileHandViewport(){return typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(max-width: 760px)').matches;}
  function playerHandScroller(){return typeof document==='undefined'?null:(document.querySelector('.v96-app .hand-area--player .handPanel')||document.querySelector('.hand-area--player .handPanel'));}
  function mobileHandMax(el){return Math.max(0,Number(el&&el.scrollWidth||0)-Number(el&&el.clientWidth||0));}
  function captureMobileHandScroll(){if(!isMobileHandViewport())return null;var el=playerHandScroller();if(!el)return null;state.mobileHandScrollLeft=Number(el.scrollLeft||0);return{left:state.mobileHandScrollLeft,width:Number(el.scrollWidth||0),client:Number(el.clientWidth||0)};}
  function applyMobileHandPosition(){if(!isMobileHandViewport())return false;var el=playerHandScroller();if(!el)return false;var max=mobileHandMax(el),left=state.mobileHandMode==='follow-latest'?max:Math.max(0,Math.min(Number(state.mobileHandScrollLeft||0),max));try{el.scrollLeft=left;}catch(ignore){}state.mobileHandScrollLeft=left;return true;}
  function scheduleMobileHandPosition(mode,saved){if(!isMobileHandViewport())return false;if(mode==='follow-latest')state.mobileHandMode='follow-latest';else{state.mobileHandMode='preserve';if(saved&&Number.isFinite(Number(saved.left)))state.mobileHandScrollLeft=Number(saved.left);}var token=++state.mobileHandApplyToken,apply=function(){if(token!==state.mobileHandApplyToken)return;applyMobileHandPosition();};apply();if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){requestAnimationFrame(apply);});[40,120,260,520,900].forEach(function(ms){setTimeout(apply,ms);});return true;}
  function restoreMobileHandScroll(saved){return scheduleMobileHandPosition('preserve',saved);}
  function snapshotHasLocalDraw(m,seat){var side=Number(seat)===2?'AI':'PLAYER',events=m&&m.lastAnimationEvents||[];return events.some(function(evt){if(!evt||!evt.id||state.seenAnimationIds[evt.id])return false;if(evt.kind==='draw'&&evt.actor_side===side)return true;if(evt.kind==='draw_batch'&&Array.isArray(evt.events))return evt.events.some(function(e){return e&&(e.side||e.actor_side)===side;});if(evt.kind==='opening_sequence')return ['opening_draw_events','post_opening_draw_events'].some(function(k){return Array.isArray(evt[k])&&evt[k].some(function(e){return e&&(e.side||e.actor_side)===side;});});if(evt.kind==='draw_then_shards'&&Array.isArray(evt.draw_specs))return evt.draw_specs.some(function(e){return e&&e.actor_side===side;});return false;});}
  function installMobileHandHooks(){if(state.mobileHandHooksInstalled||typeof document==='undefined')return;state.mobileHandHooksInstalled=true;document.addEventListener('scroll',function(ev){var el=ev&&ev.target;if(!isMobileHandViewport()||!el||!el.matches||!el.matches('.hand-area--player .handPanel'))return;state.mobileHandScrollLeft=Number(el.scrollLeft||0);},true);['pointerdown','touchstart','wheel'].forEach(function(type){document.addEventListener(type,function(ev){var el=ev&&ev.target&&ev.target.closest&&ev.target.closest('.hand-area--player .handPanel');if(!el||!isMobileHandViewport())return;state.mobileHandMode='preserve';state.mobileHandScrollLeft=Number(el.scrollLeft||0);state.mobileHandApplyToken++;},true);});window.GL_PVP_AFTER_RENDER=function(){syncSpectatorMatchControls();if(!isMobileHandViewport())return;var apply=function(){applyMobileHandPosition();syncSpectatorMatchControls();};if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){requestAnimationFrame(apply);});else setTimeout(apply,0);};window.GL_PVP_NOTIFY_DRAW_COMPLETE=function(){if(!isMobileHandViewport())return;state.mobileHandMode='follow-latest';scheduleMobileHandPosition('follow-latest');};}
  function clearIntentLock(reason){
    if(intentTimeoutTimer){clearTimeout(intentTimeoutTimer);intentTimeoutTimer=null;}
    state.intentInFlight=false;state.intentBaseRevision=0;state.intentName='';state.intentActionId='';state.intentSentAt=0;
    if(reason==='timeout')setStatus('connecting','Server response timed out. Latest board is still usable; retry the action.');
  }
  function armIntentTimeout(){
    if(intentTimeoutTimer)clearTimeout(intentTimeoutTimer);
    intentTimeoutTimer=setTimeout(function(){
      if(!state.intentInFlight)return;
      clearIntentLock('timeout');
      importServerBoard(true);
    },12000);
  }
  function clearTransientUiState(reason){
    clearIntentLock();
    state.seenAnimationIds={};state.lastCoinAnimationKey='';state.coinResultReadyKey='';
    closeBattlefieldCoinModal();
    closeAuthoritativeDrawReview();
    ['choiceOverlay','infoOverlay','responseOverlay','previewOverlay'].forEach(function(id){var el=$(id);if(el){el.classList.remove('open','deck-setup-open','hand-discard-open');el.removeAttribute('data-pvp-authoritative-draw-review');}});
    var clearIds=['choiceBody','infoBody','responseBody','responseFooter','previewBody'];clearIds.forEach(function(id){var el=$(id);if(el)el.innerHTML='';});
    var choiceConfirm=$('choiceConfirm');if(choiceConfirm){choiceConfirm.style.display='';choiceConfirm.disabled=false;choiceConfirm.textContent='Confirm';}
    var title=$('choiceTitle');if(title)title.textContent='Choice';
    var infoTitle=$('infoTitle');if(infoTitle)infoTitle.textContent='Info';
    document.querySelectorAll('.pvp-coin-modal,.pvp-result-modal,.runtime-debug-overlay').forEach(function(el){if(el&&el.parentNode)el.parentNode.removeChild(el);});
    document.body.classList.remove('modal-open','choice-open','response-open');
    if(reason)setStatus('online','Cleared previous match popups.');
  }
  function closeAuthoritativeDrawReview(){
    var overlay=$('choiceOverlay');
    if(overlay&&overlay.getAttribute&&overlay.getAttribute('data-pvp-authoritative-draw-review')==='1'){
      overlay.classList.remove('open');overlay.removeAttribute('data-pvp-authoritative-draw-review');
    }
  }
  function syncAuthoritativePendingChoice(){
    var b=bridge();
    // Every authoritative snapshot may carry a pending interaction. Rehydrate it through
    // the shared canonical dispatcher instead of maintaining a PvP-only whitelist.
    // The shared renderer already enforces local pending ownership and hides remote choices.
    if(b&&b.renderCurrentAuthoritativePendingChoice)return !!b.renderCurrentAuthoritativePendingChoice();
    return false;
  }
  function swapSideForSeat(side,seat){if(Number(seat)!==2)return side;return side==='PLAYER'?'AI':(side==='AI'?'PLAYER':side);}
  function localizeAnimationEvent(evt,seat){
    if(!evt)return null;var x=JSON.parse(JSON.stringify(evt));
    ['side','actor_side','source_side','target_side'].forEach(function(k){if(x[k])x[k]=swapSideForSeat(x[k],seat);});
    if(x.destination&&x.destination.side)x.destination.side=swapSideForSeat(x.destination.side,seat);
    if(x.kind==='draw_batch'&&Array.isArray(x.events))x.events=x.events.map(function(e){return localizeAnimationEvent(e,seat);});
    if(x.kind==='opening_sequence'){
      ['opening_draw_events','post_opening_draw_events'].forEach(function(k){if(Array.isArray(x[k]))x[k]=x[k].map(function(e){return localizeAnimationEvent(e,seat);});});
      ['starting_shard_entries','post_opening_shard_entries'].forEach(function(k){if(Array.isArray(x[k]))x[k]=x[k].map(function(e){var y=JSON.parse(JSON.stringify(e));if(y.side)y.side=swapSideForSeat(y.side,seat);return y;});});
    }
    if(x.kind==='shard_gain'&&Array.isArray(x.entries))x.entries=x.entries.map(function(e){var y=JSON.parse(JSON.stringify(e));if(y.side)y.side=swapSideForSeat(y.side,seat);return y;});
    if(x.kind==='draw_then_shards'){
      if(Array.isArray(x.draw_specs))x.draw_specs=x.draw_specs.map(function(e){return localizeAnimationEvent(e,seat);});
      if(Array.isArray(x.shard_entries))x.shard_entries=x.shard_entries.map(function(e){var y=JSON.parse(JSON.stringify(e));if(y.side)y.side=swapSideForSeat(y.side,seat);return y;});
    }
    return x;
  }
  function unseenAnimationEvents(m){
    var list=Array.isArray(m&&m.lastAnimationEvents)?m.lastAnimationEvents.slice():((m&&m.lastAnimationEvent)?[m.lastAnimationEvent]:[]);
    return list.filter(function(raw){return raw&&raw.id&&!state.seenAnimationIds[raw.id];});
  }
  function prepareAuthoritativeAnimations(m,seat,rev){
    var b=bridge();if(!b)return [];
    var plans=[];
    unseenAnimationEvents(m).forEach(function(raw){
      var evt=localizeAnimationEvent(raw,seat),plan={event:evt,captured:null};
      if(evt.kind==='card_play'&&b.captureAuthoritativePlayedCardMotion){
        plan.captured=b.captureAuthoritativePlayedCardMotion(evt.card_id,evt.actor_side,{hand_index:evt.hand_index,source_side:evt.source_side||evt.actor_side,source_lane:evt.source_lane,target_side:evt.target_side,target_lane:evt.target_lane,target_lanes:evt.target_lanes,triple_shot_area:!!evt.triple_shot_area});
      }else if(evt.kind==='hand_to_discard'&&b.captureAuthoritativeHandDiscardMotion){
        plan.captured=b.captureAuthoritativeHandDiscardMotion(evt.actor_side,evt.hand_index,evt.card_id);
      }else if(evt.kind==='attachment_to_discard'&&b.captureAuthoritativeAttachmentDiscardMotion){
        plan.captured=b.captureAuthoritativeAttachmentDiscardMotion(evt.actor_side,evt.lane,evt.slot,evt.card_id);
      }else if(evt.kind==='legacy_to_deck'&&b.captureAuthoritativeLegacyToDeckMotion){
        plan.captured=b.captureAuthoritativeLegacyToDeckMotion(evt.actor_side,evt.lane,evt.card_id);
      }else if(evt.kind==='tribute'&&b.captureAuthoritativeTributeMotion){
        plan.captured=b.captureAuthoritativeTributeMotion(evt.actor_side,evt.hand_index,evt.card_id,evt.target_lane);
      }else if(evt.kind==='rank_up'&&b.captureAuthoritativeRankUpMotion){
        plan.captured=b.captureAuthoritativeRankUpMotion(evt.actor_side,evt.lane,evt.to_card_id,evt.exp_card_ids||[]);
      }else if(evt.kind==='draw_batch'&&Array.isArray(evt.events)){
        plan.captured={events:evt.events.slice()};
      }else if(evt.kind==='opening_sequence'){
        plan.captured={opening_draw_events:(evt.opening_draw_events||[]).slice(),starting_shard_entries:(evt.starting_shard_entries||[]).slice(),post_opening_draw_events:(evt.post_opening_draw_events||[]).slice(),post_opening_shard_entries:(evt.post_opening_shard_entries||[]).slice()};
      }else if(evt.kind==='shard_gain'){
        plan.captured={entries:(evt.entries||[]).slice()};
      }else if(evt.kind==='draw_then_shards'){
        plan.captured={draw_specs:(evt.draw_specs||[]).slice(),shard_entries:(evt.shard_entries||[]).slice()};
      }
      state.seenAnimationIds[raw.id]=true;
      plans.push(plan);
    });
    return plans;
  }
  function playAuthoritativeAnimations(plans){
    var b=bridge();if(!b)return false;var ok=false;
    (plans||[]).forEach(function(plan){
      var evt=plan&&plan.event;if(!evt)return;
      if(evt.kind==='card_play'){
        var moved=false;
        if(evt.held_until_resolution&&evt.hold_key&&plan.captured&&b.beginAuthoritativeHeldPlayedCardMotion)moved=!!b.beginAuthoritativeHeldPlayedCardMotion(plan.captured,evt.hold_key);
        else if(plan.captured&&b.commitAuthoritativePlayedCardMotion)moved=!!b.commitAuthoritativePlayedCardMotion(plan.captured,evt.destination||{type:'target'});
        if(!moved&&b.playAuthoritativeCardSound)b.playAuthoritativeCardSound();
        ok=moved||ok;
      }
      else if(evt.kind==='held_card_release'&&b.releaseAuthoritativeHeldCardMotion)ok=b.releaseAuthoritativeHeldCardMotion(evt.hold_key,evt.destination||{type:'discard',side:evt.actor_side})||ok;
      else if(evt.kind==='hand_to_discard'&&plan.captured&&b.queueCapturedAuthoritativeHandDiscardMotion)ok=b.queueCapturedAuthoritativeHandDiscardMotion(plan.captured)||ok;
      else if(evt.kind==='attachment_to_discard'&&plan.captured&&b.queueCapturedAuthoritativeAttachmentDiscardMotion)ok=b.queueCapturedAuthoritativeAttachmentDiscardMotion(plan.captured)||ok;
      else if(evt.kind==='legacy_to_deck'&&plan.captured&&b.queueCapturedAuthoritativeLegacyToDeckMotion)ok=b.queueCapturedAuthoritativeLegacyToDeckMotion(plan.captured)||ok;
      else if(evt.kind==='tribute'&&plan.captured&&b.queueAuthoritativeTributeMotion)ok=b.queueAuthoritativeTributeMotion(plan.captured)||ok;
      else if(evt.kind==='rank_up'&&plan.captured&&b.queueCapturedAuthoritativeRankUpMotion)ok=b.queueCapturedAuthoritativeRankUpMotion(plan.captured)||ok;
      else if(evt.kind==='rank_up'&&b.queueAuthoritativeRankUpMotion)ok=b.queueAuthoritativeRankUpMotion(evt.actor_side,evt.lane,evt.to_card_id,evt.exp_card_ids||[])||ok;
      else if(evt.kind==='opening_sequence'&&plan.captured&&b.queueAuthoritativeOpeningSequence)ok=b.queueAuthoritativeOpeningSequence(plan.captured.opening_draw_events||[],plan.captured.starting_shard_entries||[],plan.captured.post_opening_draw_events||[],plan.captured.post_opening_shard_entries||[])||ok;
      else if(evt.kind==='draw_then_shards'&&plan.captured&&b.queueAuthoritativeDrawThenShardMotions)ok=b.queueAuthoritativeDrawThenShardMotions(plan.captured.draw_specs||[],plan.captured.shard_entries||[])||ok;
      else if(evt.kind==='shard_gain'&&plan.captured&&b.queueAuthoritativeShardGainMotions)ok=b.queueAuthoritativeShardGainMotions(plan.captured.entries||[])||ok;
      else if(evt.kind==='draw_batch'&&plan.captured&&b.queueAuthoritativeDrawEvents)ok=b.queueAuthoritativeDrawEvents(plan.captured.events)||ok;
      else if(evt.kind==='draw'&&b.queueAuthoritativeDrawMotions)ok=b.queueAuthoritativeDrawMotions(evt.actor_side,evt.card_ids||[evt.card_id],evt.count||1,evt.reason||'CARD_EFFECT')||ok;
      else if(evt.kind==='draw'&&b.queueAuthoritativeDrawMotion)ok=b.queueAuthoritativeDrawMotion(evt.actor_side,evt.card_id,evt.count||1,evt.reason||'CARD_EFFECT')||ok;
      else if(evt.kind==='legacy_to_field'&&b.queueAuthoritativeLegacyToFieldMotion)ok=b.queueAuthoritativeLegacyToFieldMotion(evt.actor_side,evt.lane,evt.card_id)||ok;
      // battle_feedback plans are intentionally not played here. importServerBoard replays them
      // after the authoritative board render, so the target Hero anchor is paint-ready.
    });
    return ok;
  }
  function battleFeedbackFromAuthoritativePlans(plans){
    return (plans||[]).map(function(plan){return plan&&plan.event;}).filter(function(evt){return evt&&evt.kind==='battle_feedback';}).map(function(evt){
      return {
        id:evt.id||null,kind:(evt.feedback_kind==='heal'?'heal':'attack'),side:evt.side,lane:evt.lane,card_id:evt.card_id||null,
        outcome:evt.outcome||'hit',attack_kind:evt.attack_kind||'P',defense_kind:evt.defense_kind||null,
        has_damage:!!evt.has_damage,play_sound:evt.play_sound!==false
      };
    });
  }
  function playAuthoritativeBattleAudioNow(events){
    events=Array.isArray(events)?events:[];if(!events.length)return false;
    var b=bridge();if(!b||!b.playAuthoritativeBattleFeedbackAudio)return false;
    var ok=false;events.forEach(function(evt){ok=b.playAuthoritativeBattleFeedbackAudio(evt)||ok;});return ok;
  }
  function playAuthoritativeBattleFeedbackAfterRender(events){
    events=Array.isArray(events)?events.slice():[];if(!events.length)return false;
    var b=bridge();if(!b||!b.playAuthoritativeBattleFeedback)return false;
    function play(){events.forEach(function(evt,index){setTimeout(function(){b.playAuthoritativeBattleFeedback(evt);},index*140);});}
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){requestAnimationFrame(play);});else setTimeout(play,34);
    return true;
  }
  function importServerBoard(force){
    var b=bridge(),m=match(),seat=localSeat()||(localRole()==='spectator'?1:null);
    if(!b||!m||!m.serverBoard||!seat)return false;
    var rev=Number(m.serverBoardRevision||0);
    if(!force&&rev<=state.lastAppliedRevision)return false;
    var previousCanonical=(b.snapshot&&b.snapshot().appState)?JSON.parse(JSON.stringify(b.snapshot().appState)):null;
    var savedHandScroll=captureMobileHandScroll(),localDraw=snapshotHasLocalDraw(m,seat);
    var animationPlans=prepareAuthoritativeAnimations(m,seat,rev);
    var battleFeedback=battleFeedbackFromAuthoritativePlans(animationPlans);
    // SFX belongs to the authoritative gameplay revision and must not wait for DOM import/render.
    // The same event objects are marked _sound_played by the bridge so post-render VFX cannot replay audio.
    if(battleFeedback.length)playAuthoritativeBattleAudioNow(battleFeedback);
    if(localDraw)state.mobileHandMode='follow-latest';
    else{state.mobileHandMode='preserve';if(savedHandScroll)state.mobileHandScrollLeft=Number(savedHandScroll.left||0);}
    var adapter=window.GL_PVP_PRESENTATION_ADAPTER;
    if(!adapter||typeof adapter.importViewerSafeSnapshot!=='function'){setStatus('offline','PvP presentation adapter unavailable.');return false;}
    state.applyingServer=true;
    adapter.setSharedBoardMode(true);
    window.GL_PVP_LOCAL_SEAT=seat;window.GL_PVP_LOCAL_ROLE=localRole();
    try{
      var firstNotice=(rev<=2&&!m.lastIntent&&openingFlipText(m))||'';
      var notice=firstNotice||('Server authoritative board r'+rev+' applied.');
      adapter.importViewerSafeSnapshot(m.serverBoard,seat,{notice:notice,skipImportAnimations:true});
      scheduleMobileHandPosition(localDraw?'follow-latest':'preserve',savedHandScroll);
      playAuthoritativeAnimations(animationPlans);
      var currentCanonical=b.snapshot&&b.snapshot().appState;
      if(previousCanonical&&b.playAuthoritativeStateDeltaPresentation)b.playAuthoritativeStateDeltaPresentation(previousCanonical,currentCanonical,{skipBattleFeedback:true});
      // VFX still waits for paint-ready Hero anchors. Audio already fired above before board import/render.
      if(battleFeedback.length)playAuthoritativeBattleFeedbackAfterRender(battleFeedback);
      syncAuthoritativePendingChoice();
      syncBattlefieldIdentityHeaders();
      document.body.classList.remove('pvp-booting');
      state.lastAppliedRevision=rev;
      var ms=Number(m.lastIntent&&m.lastIntent.processingMs||0);
      setStatus('online',firstNotice||('Server board r'+rev+' applied'+(ms?' · '+ms+' ms':'')));
    }finally{state.applyingServer=false;}
    return true;
  }
  function pendingDecisionSide(p){if(!p)return null;return p.decision_side||p.response_owner||p.side||p.source_side||(p.type==='hand_limit_discard'?'PLAYER':null)||(p.type==='manual_reposition'?'PLAYER':null);}
  function localOwnsPending(){var s=appState(),p=s&&s.pending;if(!p)return true;return pendingDecisionSide(p)==='PLAYER';}
  function localOwnsResponse(){var s=appState(),rw=s&&s.responseWindow;if(!rw)return true;return rw.response_owner==='PLAYER';}
  function intentNeedsPendingOwner(intent){return ['chooseHeroFromBoard','setArrowBarrageSpend','selectStatusRemovalChoice','selectSaintPurifyChoice','resolveStonebloodChoice','selectScoutingExpChoice','moveCrystalBallOrder','performDualArrowPairChoice','toggleDiscardIndex','selectCardSearchChoice','selectLegacyDefeatChoice','selectLegacyCostChoice','selectLegacyCardChoice','commitDrawReplacementChoice','confirmDrawReplacement','commitMagicalSurgeChoice','toggleManaShardPaymentChoice','toggleResponseManaShardChoice','commitResponsePaymentChoice','selectOpponentHandChoice','commitOpponentHandChoice','selectOpponentManaChoiceHandle','selectResponsePaymentChoice','performOptionalSwapDecision','performOptionalTargetSwapDecision','performManualReposition','handleChoiceConfirm'].indexOf(intent)!==-1;}
  function intentNeedsResponseOwner(intent){return ['responseSelectNoStuck','confirmSelectedResponse','responsePassNoStuck'].indexOf(intent)!==-1;}
  function nextClientActionId(intent,base){state.actionSequence=(Number(state.actionSequence||0)+1)%1000000000;return String(state.clientId||'client')+'.'+String(base||0)+'.'+String(state.actionSequence)+'.'+String(intent||'action').replace(/[^A-Za-z0-9_.:-]/g,'').slice(0,48);}
  function runtimeIntent(intent,args){var me=state.snapshot&&state.snapshot.local;if(!me||me.role!=='player'){setStatus('offline','Spectator is read-only.');return false;}var m=match();if(!m||m.status!=='started'){setStatus('offline','Start server match first.');return false;}if(state.applyingServer){setStatus('connecting','Applying the latest server board. Please try again.');return false;}if(state.intentInFlight){setStatus('connecting','Waiting for the server to resolve '+(state.intentName||'the previous action')+'...');return false;}if(intentNeedsResponseOwner(intent)&&!localOwnsResponse()){setStatus('online','Waiting for opponent response.');return false;}if(intentNeedsPendingOwner(intent)&&!localOwnsPending()){setStatus('online','Waiting for opponent decision.');return false;}var base=currentRevision(),actionId=nextClientActionId(intent,base);var ok=send('runtime-intent',{intent:intent,args:args||[],baseRevision:base,clientActionId:actionId});if(ok){state.intentInFlight=true;state.intentBaseRevision=base;state.intentName=intent;state.intentActionId=actionId;state.intentSentAt=Date.now();armIntentTimeout();}return ok;}
  function prevent(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}
  function isLocalUiOnlyClick(t){return !!(t&&t.closest&&t.closest('[data-preview],[data-shard-preview-src],#previewClose,#previewOverlay,[data-info-title],#infoClose,#infoOverlay,[data-op-event-id],[data-op-archive-id],[data-discard-side],#historyButton,#historyButtonBottom,#opponentPlayedPreviewButton,#confirmSurrenderNo,#soundToggleButton,#mobileSoundToggleButton,#mobileMatchMenuClose,#mobileMatchMenuOverlay,[data-mobile-hero-action]'));}
  function isGameplayInteractive(t){return !!(t&&t.closest&&t.closest('#app button,#app [role="button"],#app input,#app select,#app textarea,#app .hero-panel,#choiceOverlay button,#responseOverlay button'));}
  function pendingRevealsHiddenInformation(p){
    if(!p)return false;
    if(p.type==='card_search_choice'&&(p.zone==='deck'||p.zone==='legacy_deck'))return true;
    if(p.type==='legacy_card_choice'&&p.choice_zone==='deck_top')return true;
    if(p.type==='opponent_hand_choice'&&p.reveal_cards)return true;
    if(p.type==='crystal_ball_reorder')return true;
    return false;
  }
  function pendingClosePolicy(s,p){
    if(!p)return 'CLOSE_ONLY';
    var bridgePolicy=bridge()&&bridge().getPendingClosePolicy;try{if(bridgePolicy){var x=bridgePolicy();if(x)return x;}}catch(e){}
    if(p.type==='optional_swap'||p.type==='optional_target_swap'||p.type==='post_attack_reposition_choice')return 'POST_RESOLUTION_DECLINE';
    if(['legacy_defeat_choice','hand_limit_discard','draw_replacement_choice','response_window'].indexOf(p.type)!==-1)return 'MANDATORY_NO_CANCEL';
    if(pendingRevealsHiddenInformation(p)||(s&&s.responseWindow))return 'MANDATORY_NO_CANCEL';
    if(['source_selection','target_selection','optional_magical_surge','mana_spend_choice','scouting_target_selection','scouting_exp_selection','status_removal_choice','tribute_target','racial_target_selection','hero_ability_target_selection','legacy_cost_selection','legacy_hero_target_selection','manual_reposition','lane_pair_selection'].indexOf(p.type)!==-1)return 'PRE_COMMIT_CANCEL';
    return 'MANDATORY_NO_CANCEL';
  }
  function blockGameplayClick(ev,msg){prevent(ev);setStatus('connecting',msg||'Waiting for the authoritative server board.');return true;}
  function closePvpUtilityModal(){var old=document.getElementById('pvpUtilityModal');if(old&&old.parentNode)old.parentNode.removeChild(old);}
  function showPvpDeckSetupReview(){
    closePvpUtilityModal();var d=deckData(),stats=deckSummary(d),modal=document.createElement('div');modal.id='pvpUtilityModal';modal.className='pvp-utility-modal';
    modal.innerHTML='<section class="pvp-utility-card pvp-deck-review-card"><header><div><span>DECK SETUP</span><h2>'+esc(deckDisplayTitle(d))+'</h2></div><button type="button" data-pvp-utility-close>Close</button></header><div class="pvp-deck-review-formation">'+deckFormationHtml()+'</div><dl class="pvp-deck-review-stats"><div><dt>Heroes</dt><dd>'+stats.heroes+'</dd></div><div><dt>Legacies</dt><dd>'+stats.legacies+'</dd></div><div><dt>Legacy Deck</dt><dd>'+(stats.heroes+stats.legacies)+'</dd></div><div><dt>Skills</dt><dd>'+stats.skills+'</dd></div><div><dt>Item</dt><dd>'+stats.items+'</dd></div><div><dt>Event</dt><dd>'+stats.events+'</dd></div><div><dt>Main Deck</dt><dd>'+stats.main+'</dd></div></dl></section>';
    document.body.appendChild(modal);modal.onclick=function(ev){if(ev.target===modal||ev.target.closest('[data-pvp-utility-close]'))closePvpUtilityModal();};return true;
  }
  function showPvpSurrenderConfirm(){
    closePvpUtilityModal();var modal=document.createElement('div');modal.id='pvpUtilityModal';modal.className='pvp-utility-modal';modal.innerHTML='<section class="pvp-utility-card"><header><div><span>PVP MATCH</span><h2>Confirm Surrender</h2></div><button type="button" data-pvp-utility-close>Close</button></header><p>Surrender this match? The opponent will immediately win.</p><div class="pvp-utility-actions"><button type="button" data-pvp-utility-close>Cancel</button><button class="danger" type="button" data-pvp-confirm-surrender>Yes, Surrender</button></div></section>';document.body.appendChild(modal);modal.onclick=function(ev){if(ev.target===modal||ev.target.closest('[data-pvp-utility-close]')){closePvpUtilityModal();return;}if(ev.target.closest('[data-pvp-confirm-surrender]')){closePvpUtilityModal();send('surrender-match');}};return true;
  }
  function returnSpectatorToLobby(){state.spectatorLobbyView=true;state.spectatorBattlefieldEntered=false;PVP_MOBILE_MATCH_MENU_OPEN=false;syncPvpMobileMatchMenuState();clearTransientUiState('spectator-lobby');renderLobby();return true;}
  function returnPlayerToLobbyAfterGame(){
    clearTransientUiState('result');PVP_MOBILE_MATCH_MENU_OPEN=false;syncPvpMobileMatchMenuState();
    state.reloadAfterRoomReset=true;if(!send('reset-room')){state.reloadAfterRoomReset=false;setStatus('offline','Unable to return to lobby.');return false;}return true;
  }
  function syncSpectatorMatchControls(){
    var spectator=localRole()==='spectator',m=match(),a=appState(),finished=!!(a&&a.gameOver)||(m&&m.status==='finished'),desktop=$('surrenderButton'),mobile=$('mobileSurrenderButton');
    [desktop,mobile].forEach(function(btn){if(!btn)return;var back=spectator||finished,label=back?'BACK TO LOBBY':'SURRENDER';btn.textContent=label;btn.classList.toggle('pvp-spectator-back',spectator);btn.classList.toggle('pvp-finished-back',!!finished);btn.setAttribute('aria-label',back?'Back to Lobby':'Surrender');});
    return spectator;
  }
  function closeMobileHeroActionMenu(node){
    if(!node||!node.closest||!node.closest('.mobile-hero-action-menu'))return false;
    var overlay=$('infoOverlay');
    if(!overlay)return false;
    overlay.classList.remove('open');
    return true;
  }
  function mapGameplayClick(ev){
    var t=ev.target;
    if(state.applyingServer){if(isGameplayInteractive(t)&&!isLocalUiOnlyClick(t))return blockGameplayClick(ev,'Applying the latest server board...');return false;}
    var node;
    if((node=t.closest&&t.closest('#pvpResultBackLobby'))){prevent(ev);if(localRole()==='spectator'){state.spectatorLobbyView=true;renderLobby();return true;}return returnPlayerToLobbyAfterGame();}
    var panel=ev.target.closest&&ev.target.closest('#pvpNetworkPanel,#pvpSetupOverlay'); if(panel)return false;
    var m=match();
    if((node=t.closest&&t.closest('#surrenderButton,#mobileSurrenderButton'))){prevent(ev);PVP_MOBILE_MATCH_MENU_OPEN=false;syncPvpMobileMatchMenuState();if(localRole()==='spectator')return returnSpectatorToLobby();if(localRole()!=='player'){setStatus('offline','This control is unavailable.');return true;}var a=appState();if((a&&a.gameOver)||(m&&m.status==='finished'))return returnPlayerToLobbyAfterGame();if(!m||['started','coin-flip','coin-result'].indexOf(m.status)===-1){setStatus('offline','No active PvP match to surrender.');return true;}showPvpSurrenderConfirm();return true;}
    if((node=t.closest&&t.closest('#deckSetupButton,#mobileDeckSetupButton'))){prevent(ev);PVP_MOBILE_MATCH_MENU_OPEN=false;syncPvpMobileMatchMenuState();showPvpDeckSetupReview();return true;}
    if((node=t.closest&&t.closest('#pvpRoomMobileButton,#mobilePvpRoomButton'))){prevent(ev);PVP_MOBILE_MATCH_MENU_OPEN=false;syncPvpMobileMatchMenuState();var roomPanel=$('pvpNetworkPanel');if(roomPanel)roomPanel.classList.add('open');return true;}
    if((node=t.closest&&t.closest('#confirmSurrenderYes'))){prevent(ev);send('surrender-match');return true;}
    if(!m||m.status!=='started')return false;
    if(localRole()!=='player'){if(isLocalUiOnlyClick(t))return false;if(isGameplayInteractive(t)){prevent(ev);setStatus('offline','Spectator is read-only. Local gameplay mutation was blocked.');return true;}return false;}
    if((node=t.closest('#nextPhaseButton'))){prevent(ev);return runtimeIntent('advancePhase',[]);}
    if((node=t.closest('#cancelActionButton,#manualRepositionCancel'))){prevent(ev);return runtimeIntent('cancelPendingAction',[]);}
    if((node=t.closest('#choiceConfirm'))){prevent(ev);var cs=appState(),cp=cs&&cs.pending;if(cp&&cp.type==='response_payment_choice')return runtimeIntent('commitResponsePaymentChoice',[]);return runtimeIntent('handleChoiceConfirm',[]);}
    if((node=t.closest('[data-pvp-draw-review]'))){prevent(ev);return runtimeIntent('confirmDrawReplacement',[node.getAttribute('data-pvp-draw-review')]);}
    if((node=t.closest('[data-draw-replacement-choice]'))){prevent(ev);return runtimeIntent('confirmDrawReplacement',[node.getAttribute('data-draw-replacement-choice')==='redraw'?'redraw':'keep']);}
    if((node=t.closest('[data-magical-surge-choice]'))){prevent(ev);return runtimeIntent('commitMagicalSurgeChoice',[node.getAttribute('data-magical-surge-choice')==='yes']);}
    if((node=t.closest('[data-response-mana-uid]'))){prevent(ev);return runtimeIntent('toggleResponseManaShardChoice',[String(node.getAttribute('data-response-mana-uid')||'')]);}
    if((node=t.closest('[data-mana-class-uid]'))){prevent(ev);return runtimeIntent('toggleManaShardPaymentChoice',[String(node.getAttribute('data-mana-class-uid')||'')]);}
    if((node=t.closest('[data-opponent-hand-choice]'))){prevent(ev);return runtimeIntent('selectOpponentHandChoice',[Number(node.getAttribute('data-opponent-hand-choice'))]);}
    if((node=t.closest('[data-opponent-mana-choice]'))){prevent(ev);return runtimeIntent('selectOpponentManaChoiceHandle',[String(node.getAttribute('data-opponent-mana-choice')||''),Number(node.getAttribute('data-opponent-mana-revision')||currentRevision())]);}
    if((node=t.closest('[data-response-payment-index]'))){prevent(ev);return runtimeIntent('selectResponsePaymentChoice',[Number(node.getAttribute('data-response-payment-index'))]);}
    if((node=t.closest('[data-source-swap-lane]'))){prevent(ev);return runtimeIntent('performOptionalSwapDecision',[node.getAttribute('data-source-swap-lane')]);}
    if((node=t.closest('#repositionButton'))){prevent(ev);return runtimeIntent('openManualRepositionChoice',[]);}
    if((node=t.closest('[data-play-index]'))){prevent(ev);return runtimeIntent('beginPlayFromHand',[Number(node.getAttribute('data-play-index'))]);}
    if((node=t.closest('[data-tribute-index]'))){prevent(ev);return runtimeIntent('beginTributeFromHand',[Number(node.getAttribute('data-tribute-index'))]);}
    if((node=t.closest('.hero-panel'))){var s=appState(); if(s&&s.pending&&['source_selection','target_selection','exact_two_target_selection','scouting_target_selection','tribute_target','racial_target_selection','hero_ability_target_selection','legacy_hero_target_selection','double_casting_target_selection'].indexOf(s.pending.type)!==-1){prevent(ev);return runtimeIntent('chooseHeroFromBoard',[node.getAttribute('data-side'),node.getAttribute('data-lane')]);}}
    if((node=t.closest('[data-mana-spend]'))){prevent(ev);return runtimeIntent('setArrowBarrageSpend',[Number(node.getAttribute('data-mana-spend'))]);}
    if((node=t.closest('[data-status-removal-index]'))){prevent(ev);return runtimeIntent('selectStatusRemovalChoice',[Number(node.getAttribute('data-status-removal-index'))]);}
    if((node=t.closest('[data-saint-status-index]'))){prevent(ev);return runtimeIntent('selectSaintPurifyChoice',[Number(node.getAttribute('data-saint-status-index'))]);}
    if((node=t.closest('[data-stoneblood-choice]'))){prevent(ev);return runtimeIntent('resolveStonebloodChoice',[node.getAttribute('data-stoneblood-choice')==='use']);}
    if((node=t.closest('[data-scouting-exp-choice]'))){prevent(ev);return runtimeIntent('selectScoutingExpChoice',[Number(node.getAttribute('data-scouting-exp-choice'))]);}
    if((node=t.closest('[data-crystal-move]'))){prevent(ev);return runtimeIntent('moveCrystalBallOrder',[node.getAttribute('data-crystal-move')]);}
    if((node=t.closest('[data-dual-arrow-target]'))){prevent(ev);return runtimeIntent('performDualArrowPairChoice',[node.getAttribute('data-dual-arrow-target')]);}
    if((node=t.closest('[data-dual-arrow-pair]'))){prevent(ev);return runtimeIntent('performDualArrowPairChoice',[node.getAttribute('data-dual-arrow-pair')]);}
    if((node=t.closest('[data-discard-index]'))){prevent(ev);return runtimeIntent('toggleDiscardIndex',[Number(node.getAttribute('data-discard-index'))]);}
    if((node=t.closest('[data-search-choice-index]'))){prevent(ev);return runtimeIntent('selectCardSearchChoice',[Number(node.getAttribute('data-search-choice-index'))]);}
    if((node=t.closest('[data-legacy-defeat-choice]'))){prevent(ev);return runtimeIntent('selectLegacyDefeatChoice',[Number(node.getAttribute('data-legacy-defeat-choice'))]);}
    if((node=t.closest('[data-legacy-cost-index]'))){prevent(ev);return runtimeIntent('selectLegacyCostChoice',[Number(node.getAttribute('data-legacy-cost-index'))]);}
    if((node=t.closest('[data-legacy-card-choice]'))){prevent(ev);return runtimeIntent('selectLegacyCardChoice',[Number(node.getAttribute('data-legacy-card-choice'))]);}
    if((node=t.closest('[data-response-select]'))){prevent(ev);return runtimeIntent('responseSelectNoStuck',[Number(node.getAttribute('data-response-select'))]);}
    if((node=t.closest('#responseConfirmButton,#responseResolveButton'))){prevent(ev);return runtimeIntent('confirmSelectedResponse',[]);}
    if((node=t.closest('#responsePassButton,#responseClose'))){prevent(ev);return runtimeIntent('responsePassNoStuck',[]);}
    if((node=t.closest('#optionalSwapYes'))){prevent(ev);return runtimeIntent('performOptionalSwapDecision',[true]);}
    if((node=t.closest('#optionalSwapNo'))){prevent(ev);return runtimeIntent('performOptionalSwapDecision',[false]);}
    if((node=t.closest('[data-target-swap-lane]'))){prevent(ev);return runtimeIntent('performOptionalTargetSwapDecision',[node.getAttribute('data-target-swap-lane')]);}
    if((node=t.closest('#optionalTargetSwapNo'))){prevent(ev);return runtimeIntent('performOptionalTargetSwapDecision',[null]);}
    if((node=t.closest('[data-class-ability-id]'))){closeMobileHeroActionMenu(node);prevent(ev);return runtimeIntent('beginActivatedHeroAbility',[node.getAttribute('data-class-ability-side'),node.getAttribute('data-class-ability-lane'),node.getAttribute('data-class-ability-id')]);}
    if((node=t.closest('[data-legacy-id]'))){closeMobileHeroActionMenu(node);prevent(ev);return runtimeIntent('beginActivatedLegacyAbility',[node.getAttribute('data-legacy-side'),node.getAttribute('data-legacy-lane'),node.getAttribute('data-legacy-id')]);}
    if((node=t.closest('[data-racial-id]'))){closeMobileHeroActionMenu(node);prevent(ev);return runtimeIntent('beginActivatedRacialAbility',[node.getAttribute('data-racial-side'),node.getAttribute('data-racial-lane'),node.getAttribute('data-racial-id')]);}
    if((node=t.closest('[data-reposition-pair]'))){prevent(ev);return runtimeIntent('performManualReposition',[node.getAttribute('data-reposition-pair')]);}
    if((node=t.closest('#choiceClose'))){
      var closeState=appState(),closePending=closeState&&closeState.pending;if(!closePending)return false;prevent(ev);
      var policy=pendingClosePolicy(closeState,closePending);
      if(policy==='PRE_COMMIT_CANCEL')return runtimeIntent('cancelPendingAction',[]);
      if(policy==='POST_RESOLUTION_DECLINE'){
        if(closePending.type==='optional_target_swap')return runtimeIntent('performOptionalTargetSwapDecision',[null]);
        if(closePending.type==='post_attack_reposition_choice')return runtimeIntent('performOptionalSwapDecision',[false]);
        return runtimeIntent('performOptionalSwapDecision',[false]);
      }
      if(pendingRevealsHiddenInformation(closePending))setStatus('online','This choice revealed hidden information and must be completed.');
      else if(closeState&&closeState.responseWindow)setStatus('online','This action opened an opponent response window and cannot be cancelled.');
      else setStatus('online','This mandatory or committed choice must be completed.');
      return true;
    }
    if((node=t.closest('#startFromControl,#startMatchButton,#resetDecks,[data-import-side]'))){prevent(ev);setStatus('online','PvP match setup and reset are controlled by the room server.');return true;}
    if((node=t.closest('#choiceConfirm'))){var s2=appState(); if(s2&&s2.pending){prevent(ev);return runtimeIntent('handleChoiceConfirm',[]);}}
    if(isLocalUiOnlyClick(t))return false;
    if(isGameplayInteractive(t)){prevent(ev);setStatus('offline','This control has no authoritative PvP intent route. Local state mutation was blocked.');return true;}
    return false;
  }


  function normalPhaseButtonText(s){return String(s&&s.phase||'')==='End'?'End Turn':'Next Phase';}
  function syncTurnPhaseControl(){
    var s=appState(),btn=$('nextPhaseButton');if(!s||!btn)return;
    var localTurn=s.turn==='PLAYER';
    if(!localTurn){
      btn.removeAttribute('data-pvp-turn-ack');btn.classList.remove('pvp-your-turn-pulse');
      btn.textContent='Opponent Turn — '+String(s.phase||'?')+' Phase';btn.disabled=true;
      return;
    }
    btn.removeAttribute('data-pvp-turn-ack');btn.classList.remove('pvp-your-turn-pulse');btn.textContent=normalPhaseButtonText(s);
    btn.disabled=!!(s.gameOver||s.pending||state.intentInFlight);
  }
  var HUMANIZE_SCHEDULED=false,HUMANIZE_LAST_ROOT_HTML='';
  function humanizeVisibleLabels(){
    if(HUMANIZE_SCHEDULED)return;
    HUMANIZE_SCHEDULED=true;
    var run=function(){
      HUMANIZE_SCHEDULED=false;
      var root=document.getElementById('app');if(!root)return;
      var signature=String(root.childElementCount)+':'+String(root.textContent||'').length+':'+currentRevision();
      if(signature===HUMANIZE_LAST_ROOT_HTML){syncTurnPhaseControl();return;}
      HUMANIZE_LAST_ROOT_HTML=signature;
      var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
        if(!n.nodeValue||(!/\bAI\b/.test(n.nodeValue)&&!/\bPLAYER\b/.test(n.nodeValue)))return NodeFilter.FILTER_REJECT;
        var p=n.parentElement;if(p&&['SCRIPT','STYLE','TEXTAREA','INPUT','SELECT'].indexOf(p.tagName)!==-1)return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }}),nodes=[],n;while((n=walker.nextNode()))nodes.push(n);
      nodes.forEach(function(t){t.nodeValue=t.nodeValue.replace(/\bAI\b/g,opponentLabel()).replace(/\bPLAYER\b/g,selfLabel());});
      syncTurnPhaseControl();
    };
    if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:80});else requestAnimationFrame(function(){setTimeout(run,0);});
  }

  function installTurnPhaseStyles(){
    var style=document.createElement('style');style.id='pvp-turn-phase-style';style.textContent='\
#nextPhaseButton.pvp-your-turn-pulse{animation:pvpYourTurnPulse .9s ease-in-out infinite;will-change:box-shadow,filter,transform}\
@keyframes pvpYourTurnPulse{0%,100%{box-shadow:0 0 0 0 rgba(244,211,94,.12);filter:brightness(1);transform:translateY(0)}50%{box-shadow:0 0 0 4px rgba(244,211,94,.18),0 0 22px rgba(244,211,94,.55);filter:brightness(1.18);transform:translateY(-1px)}}\
@media(prefers-reduced-motion:reduce){#nextPhaseButton.pvp-your-turn-pulse{animation:none;box-shadow:0 0 0 3px rgba(244,211,94,.25),0 0 16px rgba(244,211,94,.35)}}';document.head.appendChild(style);
  }
  function installStyles(){var style=document.createElement('style');style.id='gl-pvp-v260-lobby-style';style.textContent=`
:root{--pvp-bg:#07111f;--pvp-panel:rgba(5,10,17,.82);--pvp-card:rgba(23,39,53,.92);--pvp-gold:#f1d481;--pvp-line:rgba(229,234,243,.20);--pvp-line-strong:rgba(229,234,243,.38);--pvp-white:#f5f7fb;--pvp-muted:#a9acb3;--pvp-success:#20df6f;--pvp-offline:#66707d}
body.pvp-lobby-mode{min-width:0!important;overflow-x:hidden!important;background:#07111f!important}body.pvp-lobby-mode #app,body.pvp-booting #app{display:none!important;pointer-events:none;min-width:0!important}
.pvp-v260-lobby{position:fixed;inset:0;z-index:9997;display:none;overflow:auto;color:var(--pvp-white);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:linear-gradient(180deg,rgba(3,8,14,.60),rgba(6,13,23,.32)),url('assets/lobby/background.webp') center/cover fixed no-repeat;font-weight:650;letter-spacing:.01em}.pvp-v260-lobby.open{display:block}.pvp-v260-lobby *{box-sizing:border-box}.pvp-v260-lobby button,.pvp-v260-lobby input,.pvp-v260-lobby select{font:inherit}.pvp-v260-lobby button{cursor:pointer}.pvp-v260-lobby button:disabled{cursor:not-allowed}
.pvp-v260-page{min-height:100vh;padding:20px 42px 42px}.pvp-v260-topbar{min-height:58px;display:grid;grid-template-columns:194px minmax(280px,1fr) auto;align-items:start;gap:20px;margin-bottom:12px}.pvp-v260-logo{display:block;width:190px;height:58px;overflow:hidden}.pvp-v260-logo img{width:100%;height:100%;object-fit:contain;object-position:left center;filter:drop-shadow(0 3px 8px rgba(0,0,0,.38))}.pvp-v260-heading{padding-top:6px}.pvp-v260-heading h1{margin:0;font-size:17px;line-height:1;font-weight:900;letter-spacing:.02em}.pvp-v260-heading p{margin:7px 0 0;color:#989ca4;font-size:13px;font-weight:500}.pvp-v260-top-actions{display:flex;gap:10px;padding-top:4px}
.pvp-v260-btn{border:1px solid transparent;border-radius:11px;min-height:40px;padding:0 19px;color:var(--pvp-white);background:transparent;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.015em;transition:filter .15s ease,transform .15s ease,opacity .15s ease;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.pvp-v260-btn:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}.pvp-v260-outline{border-color:rgba(236,240,248,.42);background:rgba(4,9,16,.35)}.pvp-v260-blue{min-width:184px;background:#075b86;border-color:#075b86}.pvp-v260-gold{color:#11151c;border-color:#f4d87e;background:linear-gradient(180deg,#f5dc91 0%,#c49b43 100%);box-shadow:inset 0 1px rgba(255,255,255,.42)}.pvp-v260-gold:disabled{border-color:#6e6249;background:linear-gradient(180deg,rgba(146,128,82,.60),rgba(87,73,44,.58));box-shadow:none;opacity:.68}.pvp-v260-gold-outline{color:var(--pvp-gold);border-color:#dcbf68}.pvp-v260-compact{min-height:39px;padding:0 21px;font-family:Georgia,"Times New Roman",serif;font-size:12px}
.pvp-v260-layout{display:grid;grid-template-columns:minmax(0,1fr) 372px;gap:16px;align-items:stretch}.pvp-v260-panel{background:linear-gradient(180deg,rgba(4,9,16,.84),rgba(5,10,17,.78));border:1px solid rgba(255,255,255,.025);border-radius:16px;box-shadow:0 18px 48px rgba(0,0,0,.26);backdrop-filter:blur(2px)}.pvp-v260-deck-panel{padding:22px 25px 20px;display:flex;flex-direction:column}.pvp-v260-picker{display:grid;grid-template-columns:142px minmax(0,1fr);gap:13px;align-items:center}.pvp-v260-picker>label{color:var(--pvp-gold);font-size:17px;font-weight:900;white-space:nowrap}.pvp-v260-select{position:relative}.pvp-v260-select:after{content:"";position:absolute;right:13px;top:50%;width:16px;height:16px;transform:translateY(-50%);background:url("assets/lobby/chevron-down.png") center/16px 16px no-repeat;pointer-events:none}.pvp-v260-lobby select,.pvp-v260-lobby input{width:100%;border:1px solid var(--pvp-line-strong);border-radius:12px;color:var(--pvp-white);background:rgba(4,8,14,.55);outline:none}.pvp-v260-lobby select{height:48px;padding:0 46px 0 17px;appearance:none;font-size:15px;font-weight:750}.pvp-v260-lobby input{height:46px;padding:0 40px 0 14px;font-size:15px;font-weight:760}.pvp-v260-lobby select:focus,.pvp-v260-lobby input:focus{border-color:rgba(241,212,129,.85);box-shadow:0 0 0 3px rgba(241,212,129,.09)}
.pvp-v260-title{display:flex;align-items:baseline;gap:16px;margin-top:24px}.pvp-v260-title h2{font-size:28px;line-height:1;margin:0;font-weight:900;letter-spacing:-.02em}.pvp-v260-title p{margin:0;color:#a9abb1;font-size:13px;font-weight:650;text-transform:uppercase}.pvp-v260-showcase{display:grid;grid-template-columns:minmax(0,1fr) 228px;gap:20px;margin-top:16px;align-items:stretch}.pvp-v260-formation-wrap{min-width:0}.pvp-v260-formation{display:grid;grid-template-columns:minmax(0,1fr) 27px minmax(0,1fr) 27px minmax(0,1fr);gap:6px;align-items:center;justify-content:start}.pvp-v260-swap-button{width:27px;height:27px;padding:0;display:grid;place-items:center;border:0;border-radius:50%;background:#009def;color:#fff;font-size:17px;font-weight:900;cursor:pointer;box-shadow:0 4px 10px rgba(0,157,239,.38);z-index:2}.pvp-v260-swap-button:hover{filter:brightness(1.08)}.pvp-v260-swap-button:disabled{opacity:.25;cursor:not-allowed}.pvp-v260-lobby .rank-control{--gold:#f0d27f;width:max-content;margin:17px auto 0;display:grid;grid-template-columns:31px 74px 31px;align-items:center;border:1px solid #40424c;border-radius:7px;background:#121318;overflow:hidden;font-weight:400}.pvp-v260-lobby .rank-control button{height:31px;padding:revert;border:0;border-radius:revert;background:transparent;color:#fff;font-size:22px;font-weight:inherit;cursor:pointer}.pvp-v260-lobby .rank-control button:hover{background:#24262e}.pvp-v260-lobby .rank-control button:disabled{opacity:.25;cursor:default}.pvp-v260-lobby .rank-control strong{text-align:center;color:var(--gold);font-size:10px}.pvp-v260-hero{min-width:0;border-radius:13px;background:linear-gradient(180deg,#1c3040,#1a2b39);padding:10px 10px 9px;box-shadow:0 10px 20px rgba(0,0,0,.18);display:flex;flex-direction:column}.pvp-v260-card{border:0;border-radius:9px;background:#0d141d;padding:0;overflow:hidden;box-shadow:0 8px 15px rgba(0,0,0,.42);width:100%}.pvp-v260-card img{display:block;width:100%;height:auto;aspect-ratio:320/448;object-fit:cover}.pvp-v260-position{text-align:center;color:var(--pvp-gold);font-size:15px;font-weight:900;margin:auto 0 0;padding-top:9px}.pvp-v260-summary{align-self:stretch;border-radius:13px;background:linear-gradient(180deg,#1c3040,#1a2b39);padding:12px 14px 10px;box-shadow:0 10px 20px rgba(0,0,0,.18);display:flex;flex-direction:column}.pvp-v260-summary h3{margin:0 0 8px;color:var(--pvp-gold);font-size:13px;font-weight:900}.pvp-v260-summary dl{margin:0;flex:1;display:flex;flex-direction:column;justify-content:space-between}.pvp-v260-summary dl>div,.pvp-v260-room-stats>div{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center}.pvp-v260-summary dl>div{min-height:25px;color:#aaadb3;font-size:12px}.pvp-v260-summary dt,.pvp-v260-summary dd,.pvp-v260-room-stats dt,.pvp-v260-room-stats dd{margin:0}.pvp-v260-summary dd{color:#f4f5f8;font-weight:900;text-align:right}.pvp-v260-summary .total{border-top:1px solid var(--pvp-line);border-bottom:1px solid var(--pvp-line);min-height:37px;margin:2px 0 6px}.pvp-v260-footer{margin-top:auto;display:flex;align-items:center;gap:14px;padding-top:14px}.pvp-v260-status{color:#9ca1aa;font-size:12px;font-weight:600}
.pvp-v260-room-panel{padding:22px 23px 20px;display:flex;flex-direction:column}.pvp-v260-room-panel>h2{font-size:17px;margin:0 0 16px;font-weight:900}.pvp-v260-label{font-size:12px;font-weight:900;margin:0 0 7px}.pvp-v260-name{position:relative}.pvp-v260-name-icon{position:absolute;right:14px;top:50%;width:18px;height:18px;transform:translateY(-50%);border-radius:50%;display:none;place-items:center;color:#14181e;background:var(--pvp-gold);font-size:12px}.pvp-v260-name-icon.ready{display:grid}.pvp-v260-name-icon.ready:after{content:'✓'}.pvp-v260-name-icon.spectate{display:grid;background:transparent;border:2px solid var(--pvp-gold)}.pvp-v260-name-icon.spectate:before{content:'';width:5px;height:5px;border-radius:50%;background:var(--pvp-gold)}.pvp-v260-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}.pvp-v260-actions .pvp-v260-btn{padding:0 12px}.pvp-v260-divider{height:1px;background:var(--pvp-line);margin:17px 0 16px}.pvp-v260-room-id{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;margin-bottom:12px}.pvp-v260-room-copy span{display:block;color:#a9adb4;font-size:10px;font-weight:900;letter-spacing:.04em;margin-bottom:3px}.pvp-v260-room-copy strong{display:block;color:var(--pvp-gold);font-size:14px;line-height:1.15;font-weight:900}.pvp-v260-switch{min-height:34px;padding:0 11px;border-radius:9px;font-size:10px;white-space:nowrap}.pvp-v260-room-stats{display:grid;gap:6px;margin:0 0 10px}.pvp-v260-room-stats>div{font-size:12px;color:#a9adb4}.pvp-v260-room-stats dd{color:#f5f6f8;font-weight:900}.pvp-v260-seats{display:grid;gap:6px}.pvp-v260-seat{min-height:55px;border-radius:10px;background:linear-gradient(90deg,rgba(4,9,15,.70),rgba(8,14,23,.84));display:grid;grid-template-columns:minmax(0,1fr) auto auto;column-gap:8px;align-items:center;padding:8px 11px 8px 12px}.pvp-v260-seat span{display:block;color:var(--pvp-gold);font-size:12px;font-weight:900;margin-bottom:2px}.pvp-v260-seat strong{display:block;color:#f5f6f8;font-size:15px;line-height:1.15}.pvp-v260-seat p{margin:0;color:#cbd0d6;font-size:11px;font-weight:650;white-space:nowrap}.pvp-v260-seat i{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px;background:var(--pvp-offline)}.pvp-v260-seat p.online i{background:var(--pvp-success);box-shadow:0 0 9px rgba(32,223,111,.32)}.pvp-v260-message{min-height:23px;padding:6px 0 0;color:#d7b96c;font-size:11px;line-height:1.3;text-align:center}.pvp-v260-room-footer{display:grid;gap:8px;margin-top:auto;padding-top:10px}.pvp-v260-room-footer .pvp-v260-btn{width:100%}
.pvp-net-panel{position:fixed;right:18px;bottom:70px;width:min(360px,calc(100vw - 36px));z-index:9998;background:rgba(5,10,17,.97);border:1px solid rgba(241,212,129,.42);border-radius:14px;padding:14px;color:#f5f7fb;display:none}.pvp-net-panel.open{display:block}.pvp-net-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.pvp-net-head h3{margin:0;font-size:15px}.pvp-net-panel button{border:1px solid #dcbf68;border-radius:9px;background:#101722;color:#f1d481;padding:8px 10px;font-weight:800}.pvp-net-status{margin:10px 0;font-size:12px;color:#bfc7d2}.pvp-net-small{font-size:12px;color:#aeb7c3;line-height:1.4}.pvp-net-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.pvp-net-row button{width:100%}
.pvp-coin-choice.waiting-display{cursor:default!important;opacity:.72!important;filter:saturate(.72)!important;transform:none!important}.pvp-game-result-summary{min-width:min(440px,78vw)!important}.pvp-game-result-actions{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;margin-top:4px!important}.pvp-game-result-actions small{color:#9aabba!important;font-size:10px!important;text-align:center!important;line-height:1.35!important}
@media(max-width:1160px){.pvp-v260-page{padding:22px 24px 70px}.pvp-v260-topbar{grid-template-columns:190px 1fr}.pvp-v260-top-actions{grid-column:1/-1;justify-content:flex-end}.pvp-v260-layout{grid-template-columns:1fr}}
@media(max-width:760px){.pvp-v260-lobby{background-attachment:scroll}.pvp-v260-page{padding:16px 14px 34px}.pvp-v260-topbar{display:flex;flex-wrap:wrap;align-items:center;margin-bottom:10px;gap:9px 12px}.pvp-v260-logo{width:154px;height:54px;flex:0 0 154px}.pvp-v260-heading{padding:0;flex:1;min-width:140px}.pvp-v260-heading h1{font-size:16px}.pvp-v260-heading p{font-size:12px;line-height:1.35;margin-top:6px}.pvp-v260-top-actions{display:none}.pvp-v260-layout{gap:11px}.pvp-v260-panel{border-radius:14px}.pvp-v260-deck-panel{padding:17px 14px 16px}.pvp-v260-picker{grid-template-columns:1fr;gap:7px}.pvp-v260-picker>label{font-size:18px}.pvp-v260-lobby select{height:48px;font-size:14px;padding-left:14px}.pvp-v260-title{margin-top:20px;display:block}.pvp-v260-title h2{font-size:27px}.pvp-v260-title p{font-size:12px;margin-top:7px}.pvp-v260-showcase{display:block;margin-top:15px}.pvp-v260-formation{grid-template-columns:minmax(0,1fr) 25px minmax(0,1fr) 25px minmax(0,1fr);gap:4px;overflow:visible;padding-bottom:0}.pvp-v260-swap-button{width:25px;height:25px;font-size:15px}.pvp-v260-hero{min-width:0;padding:7px}.pvp-v260-position{font-size:17px;margin-top:12px}.pvp-v260-summary{margin-top:10px;padding:13px 14px 12px}.pvp-v260-summary dl{display:grid;grid-template-columns:1fr 1fr;column-gap:20px}.pvp-v260-summary dl>div{min-height:31px}.pvp-v260-summary .total{margin:0;min-height:44px;border:0}.pvp-v260-footer{display:block;margin-top:15px;padding-top:0}.pvp-v260-footer .pvp-v260-btn{width:100%}.pvp-v260-status{text-align:center;margin-top:10px}.pvp-v260-room-panel{padding:19px 16px 17px}.pvp-v260-room-id{grid-template-columns:1fr;gap:8px}.pvp-v260-switch{width:100%;min-height:39px;font-size:11px}.pvp-v260-seat{min-height:60px}}
@media(max-width:420px){.pvp-v260-actions{grid-template-columns:1fr}.pvp-v260-hero{flex-basis:82%}}
`;document.head.appendChild(style);}
  function deckData(){return currentSelectedDeckData();}
  function rankTwoId(deck,rankOneId){var rows=deck&&deck.legacy_deck_expanded||[];var base=rows.find(function(x){return x.card_id===rankOneId;});if(base){var byPackage=rows.filter(function(x){return x.package_id===base.package_id&&String(x.card_type).toLowerCase()==='hero';});var exact=byPackage.find(function(x){var c=cardLookup(x.card_id);return Number(c&&c.rank_numeric)===2;});if(exact)return exact.card_id;}var m=String(rankOneId||'').match(/^(.*-H)(00[14])$/);if(m)return m[1]+(m[2]==='001'?'002':'005');return rankOneId;}
  function heroProgressionIds(deck,rankOneId){
    var rows=deck&&deck.legacy_deck_expanded||[],base=rows.find(function(x){return x.card_id===rankOneId;});
    var heroes=base?rows.filter(function(x){return x.package_id===base.package_id&&String(x.card_type).toLowerCase()==='hero';}):[];
    heroes.sort(function(a,b){return Number(cardLookup(a.card_id)&&cardLookup(a.card_id).rank_numeric||0)-Number(cardLookup(b.card_id)&&cardLookup(b.card_id).rank_numeric||0);});
    if(heroes.length>=3)return heroes.slice(0,3).map(function(x){return x.card_id;});
    var m=String(rankOneId||'').match(/^(.*-H)(00[14])$/);if(m){var n=m[2]==='001'?1:4;return[m[1]+String(n).padStart(3,'0'),m[1]+String(n+1).padStart(3,'0'),m[1]+String(n+2).padStart(3,'0')];}
    return[rankOneId,rankTwoId(deck,rankOneId),rankOneId];
  }
  function lobbyRankLabel(){return 'RANK '+(['I','II','III'][Math.max(1,Math.min(3,Number(state.lobbyRankPreview)||1))-1]||'I');}
  function heroAtLobbyRank(deck,rankOneId){var ids=heroProgressionIds(deck,rankOneId),idx=Math.max(0,Math.min(2,(Number(state.lobbyRankPreview)||1)-1));return ids[idx]||rankOneId;}
  function setLobbyRankPreview(next){var n=Math.max(1,Math.min(3,Number(next)||1));if(n===state.lobbyRankPreview)return false;state.lobbyRankPreview=n;renderLobby();return true;}
  function closeHeroProgression(){var modal=$('pvpHeroProgressionModal');if(modal)modal.remove();}
  var PVP_PROGRESSION_OPEN_TOKEN=0,PVP_PROGRESSION_ASSET_CACHE=Object.create(null);
  function preloadProgressionAsset(src){
    if(PVP_PROGRESSION_ASSET_CACHE[src])return PVP_PROGRESSION_ASSET_CACHE[src];
    PVP_PROGRESSION_ASSET_CACHE[src]=new Promise(function(resolve){
      var img=new Image(),done=false;
      function finish(){if(done)return;done=true;resolve(src);}
      img.onload=function(){if(img.decode){img.decode().then(finish,finish);}else finish();};
      img.onerror=finish;img.src=src;
      if(img.complete)finish();
      setTimeout(finish,3500);
    });
    return PVP_PROGRESSION_ASSET_CACHE[src];
  }
  function preloadProgressionDeck(deck){
    var ids=[];Object.keys(deck&&deck.default_formation||{}).forEach(function(lane){heroProgressionIds(deck,deck.default_formation[lane]).forEach(function(id){if(ids.indexOf(id)===-1)ids.push(id);});});
    var run=function(){ids.map(lobbyCardSrc).forEach(preloadProgressionAsset);};
    if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:500});else setTimeout(run,40);
  }
  function openHeroProgression(rankOneId){
    closeHeroProgression();
    var deck=deckData(),ids=heroProgressionIds(deck,rankOneId),sources=ids.map(lobbyCardSrc),token=++PVP_PROGRESSION_OPEN_TOKEN;
    Promise.all(sources.map(preloadProgressionAsset)).then(function(){
      if(token!==PVP_PROGRESSION_OPEN_TOKEN)return;
      var modal=document.createElement('div');modal.id='pvpHeroProgressionModal';modal.className='pvp-progression-modal';
      var cards=ids.map(function(id,index){return '<article class="pvp-v260-hero pvp-progression-hero '+(index===0?'current':'')+'"><button class="pvp-v260-card pvp-progression-static-card" type="button" data-preview="'+esc(id)+'" aria-label="Preview '+esc(cardDisplayName(id))+' Rank '+(index+1)+'"><img loading="eager" decoding="sync" src="'+esc(sources[index])+'" alt="'+esc(cardDisplayName(id))+'"></button><div class="pvp-v260-position">RANK '+['I','II','III'][index]+'</div></article>';});
      modal.innerHTML='<section class="pvp-progression-card"><header><div><span>HERO PROGRESSION</span><h2>'+esc(cardDisplayName(ids[0]))+'</h2></div><button id="pvpHeroProgressionClose" class="pvp-progression-close" type="button">Close</button></header><div class="pvp-progression-row">'+cards[0]+'<span class="pvp-progression-arrow" aria-hidden="true">→</span>'+cards[1]+'<span class="pvp-progression-arrow" aria-hidden="true">→</span>'+cards[2]+'</div><p>Select a Rank card to open Card Preview.</p></section>';
      document.body.appendChild(modal);$('pvpHeroProgressionClose').onclick=closeHeroProgression;modal.addEventListener('click',function(ev){var preview=ev.target&&ev.target.closest&&ev.target.closest('[data-preview]');if(preview){ev.preventDefault();ev.stopPropagation();if(window.GL_OPEN_CARD_PREVIEW)window.GL_OPEN_CARD_PREVIEW(preview.getAttribute('data-preview'));return;}if(ev.target===modal)closeHeroProgression();});
    });
  }

  function installProgressionModal(){document.addEventListener('keydown',function(ev){if(ev.key==='Escape')closeHeroProgression();});}

  function lobbyCardSrc(id){return thumbFor(id);}
  function deckClassLine(deck){var label=loadedDeckLabel()||deck&&deck.display_name||deck&&deck.deck_name||'';var parts=label.split(/[—-]/);if(parts.length>1)return parts.slice(1).join(' ').trim().replace(/\s*\/\s*/g,', ').toUpperCase();var rows=deck&&deck.legacy_deck_expanded||[],out=[];var packages={};rows.forEach(function(x){if(String(x.card_type).toLowerCase()==='hero')packages[x.package_id]=packages[x.package_id]||[];if(packages[x.package_id])packages[x.package_id].push(x.card_id);});Object.keys(packages).forEach(function(k){var cls='';packages[k].forEach(function(id){var c=cardLookup(id);if(Number(c&&c.rank_numeric)===3)cls=c.display_class||'';});if(cls)out.push(cls);});return (out.join(', ')||'CUSTOM DECK').toUpperCase();}
  function deckDisplayTitle(deck){var label=loadedDeckLabel()||deck&&deck.display_name||deck&&deck.deck_name||'Selected Deck';var m=label.match(/Starter\s*0?(\d+)/i);return m?'Starter Deck '+Number(m[1]):label;}
  function deckSummary(deck){var stats={heroes:0,legacies:0,skills:0,items:0,events:0,main:0};(deck&&deck.legacy_deck_expanded||[]).forEach(function(x){var t=String(x.card_type||'').toLowerCase();if(t==='hero')stats.heroes++;if(t==='legacy')stats.legacies++;});(deck&&deck.main_deck||[]).forEach(function(x){var q=Math.max(0,Number(x.quantity||1)),c=cardLookup(x.card_id),f=String(c&&c.family||c&&c.card_type||'').toLowerCase();stats.main+=q;if(f==='item')stats.items+=q;else if(f==='event')stats.events+=q;else stats.skills+=q;});return stats;}
  function deckFormationHtml(){var d=deckData(),form=currentLobbyFormation(d),lanes=LOBBY_FORMATION_LANES;if(!d)return '<div class="pvp-v260-message">Choose a deck.</div>';var chunks=[];lanes.forEach(function(lane,index){var rankOne=form[lane]||'',id=heroAtLobbyRank(d,rankOne);if(index>0)chunks.push('<button class="pvp-v260-swap-button" type="button" data-swap-left="'+(index-1)+'" data-swap-right="'+index+'" aria-label="Swap '+esc(lanes[index-1])+' and '+esc(lane)+' Heroes"><img src="assets/lobby/swap.png" alt="" aria-hidden="true"></button>');chunks.push('<article class="pvp-v260-hero" data-lobby-lane="'+esc(lane)+'" data-rank-one-hero="'+esc(rankOne)+'" data-lobby-rank="'+esc(state.lobbyRankPreview)+'"><button class="pvp-v260-card" type="button" data-pvp-progression="'+esc(rankOne)+'" aria-label="View '+esc(cardDisplayName(id))+' Hero Progression"><img decoding="async" src="'+esc(lobbyCardSrc(id))+'" alt="'+esc(cardDisplayName(id))+'"></button><div class="pvp-v260-position">'+esc(lane.charAt(0)+lane.slice(1).toLowerCase())+'</div></article>');});return chunks.join('');}
  function installLobbyModal(){var wrap=document.createElement('div');wrap.id='pvpSetupOverlay';wrap.className='pvp-v260-lobby';wrap.innerHTML='<div class="pvp-v260-page"><header class="pvp-v260-topbar"><a id="pvpHomeLogo" class="pvp-v260-logo" aria-label="Back to Grandis Legacy home"><img src="assets/lobby/grandis-legacy-logo.webp" alt="Grandis Legacy"></a><div class="pvp-v260-heading"><h1>PVP LOBBY</h1><p>Choose your deck, then ready up or spectate the room.</p></div><nav class="pvp-v260-top-actions"><a id="pvpDeckBuilderLink" class="pvp-v260-btn pvp-v260-outline">GO TO DECK BUILDER</a><a id="pvpAiLobbyLink" class="pvp-v260-btn pvp-v260-blue">GO TO VS AI</a></nav></header><main class="pvp-v260-layout"><section class="pvp-v260-panel pvp-v260-deck-panel"><div class="pvp-v260-picker"><label for="pvpSetupDeck">Choose a Deck</label><div class="pvp-v260-select"><select id="pvpSetupDeck"></select></div></div><div class="pvp-v260-title"><h2 id="pvpDeckTitle">Starter Deck</h2><p id="pvpDeckClassLine"></p></div><div class="pvp-v260-showcase"><div class="pvp-v260-formation-wrap"><div id="pvpFormationPreview" class="pvp-v260-formation"></div><div class="rank-control" aria-label="Hero Rank Preview"><button id="pvpRankPrev" type="button" aria-label="Previous Hero Rank">‹</button><strong id="pvpRankLabel">RANK I</strong><button id="pvpRankNext" type="button" aria-label="Next Hero Rank">›</button></div></div><aside class="pvp-v260-summary"><h3>YOUR DECK</h3><dl id="pvpDeckStats"></dl></aside></div><div class="pvp-v260-footer"><input id="pvpImportDeckInput" type="file" accept="application/json,.json" hidden><button id="pvpImportDeckButton" class="pvp-v260-btn pvp-v260-gold pvp-v260-compact" type="button">IMPORT CUSTOM DECK</button><div id="pvpLoadedDeckStatus" class="pvp-v260-status"></div></div></section><aside class="pvp-v260-panel pvp-v260-room-panel"><h2>ROOM PANEL</h2><label class="pvp-v260-label" for="pvpSetupName">PLAYER NAME</label><div class="pvp-v260-name"><input id="pvpSetupName" maxlength="48" placeholder="Your player name" autocomplete="off"><span id="pvpNameStateIcon" class="pvp-v260-name-icon"></span></div><div class="pvp-v260-actions"><button id="pvpSetupSpectatorButton" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline" type="button">SPECTATE</button><button id="pvpSetupReadyButton" class="pvp-v260-btn pvp-v260-gold" type="button">READY</button></div><div class="pvp-v260-divider"></div><div class="pvp-v260-room-id"><div class="pvp-v260-room-copy"><span>CURRENT ROOM</span><strong id="pvpRoomName"></strong></div><button id="pvpSetupSwitchRoom" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline pvp-v260-switch" type="button"></button></div><dl id="pvpSetupStats" class="pvp-v260-room-stats"></dl><div id="pvpSetupPeople" class="pvp-v260-seats"></div><div id="pvpSetupHint" class="pvp-v260-message"></div><div class="pvp-v260-room-footer"><button id="pvpSetupStartButton" class="pvp-v260-btn pvp-v260-gold" type="button" disabled>START MATCH</button><button id="pvpSetupReconnectButton" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline" type="button">RECONNECT</button></div></aside></main></div>';document.body.appendChild(wrap);installProgressionModal();wrap.addEventListener('click',function(ev){var kick=ev.target&&ev.target.closest&&ev.target.closest('[data-kick-seat="2"]');if(kick){ev.preventDefault();send('kick-seat-2');return;}var btn=ev.target&&ev.target.closest&&ev.target.closest('[data-pvp-progression]');if(btn){ev.preventDefault();openHeroProgression(btn.getAttribute('data-pvp-progression'));}});
    $('pvpHomeLogo').href=homeUrl();$('pvpDeckBuilderLink').href=deckBuilderUrl();$('pvpAiLobbyLink').href=aiLobbyUrl();$('pvpRoomName').textContent=roomDisplayName();$('pvpSetupSwitchRoom').textContent='SWITCH TO ROOM '+(roomNumber()===1?'2':'1');
    $('pvpSetupDeck').innerHTML=deckSelectOptions(state.deckKey);$('pvpSetupName').value=state.nameDraft||state.name;
    function commitLobbyName(){var input=$('pvpSetupName'),next=safeName(input&&input.value||state.nameDraft||state.name);if(!next)return false;state.nameDraft=next;state.name=next;try{localStorage.setItem(NAME_KEY,state.name);}catch(e){}if(state.connected)send('rename',{name:state.name});renderPanel();return true;}
    $('pvpSetupName').addEventListener('input',function(){state.nameDraft=this.value;});$('pvpSetupName').addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();commitLobbyName();this.blur();}});$('pvpSetupName').addEventListener('blur',function(){if(safeName(this.value||state.nameDraft)!==state.name)commitLobbyName();});
    $('pvpSetupDeck').addEventListener('change',function(){state.deckKey=this.value||DECK_OPTIONS[0].key;state.lobbyRankPreview=1;state.lobbyFormation=null;loadStarterDeck();});
    $('pvpRankPrev').onclick=function(){setLobbyRankPreview((Number(state.lobbyRankPreview)||1)-1);};$('pvpRankNext').onclick=function(){setLobbyRankPreview((Number(state.lobbyRankPreview)||1)+1);};$('pvpFormationPreview').addEventListener('click',function(ev){var btn=ev.target&&ev.target.closest&&ev.target.closest('[data-swap-left][data-swap-right]');if(!btn)return;ev.preventDefault();swapLobbyFormation(Number(btn.getAttribute('data-swap-left')),Number(btn.getAttribute('data-swap-right')));});
    $('pvpImportDeckButton').onclick=function(){$('pvpImportDeckInput').click();};$('pvpImportDeckInput').addEventListener('change',importCustomDeck);
    $('pvpSetupReadyButton').onclick=toggleReady;$('pvpSetupStartButton').onclick=function(){send('start-match',{seed:Math.random().toString(36).slice(2)});};$('pvpSetupReconnectButton').onclick=function(){connect(true);};$('pvpSetupSpectatorButton').onclick=function(){var m=match()||{},active=['coin-flip','coin-result','started','finished'].indexOf(m.status)!==-1;if(localRole()==='spectator'&&active){state.spectatorLobbyView=false;state.spectatorBattlefieldEntered=true;renderLobby();importServerBoard(true);setTimeout(syncSpectatorMatchControls,0);return;}var next=(localRole()==='spectator'?'player':'spectator');send('switch-role',{role:next});};$('pvpSetupSwitchRoom').onclick=function(){var url=otherRoomUrl();if(url)location.assign(url);};
  }
  function closeTeachingViewModal(){var modal=$('pvpTeachingViewModal');if(modal)modal.remove();}
  function openTeachingViewModal(){
    var snap=state.snapshot||{},me=snap.local||{};
    if(!me||me.role!=='spectator')return false;
    closeTeachingViewModal();
    var modal=document.createElement('div');modal.id='pvpTeachingViewModal';modal.className='pvp-teaching-modal';
    modal.innerHTML='<section class="pvp-teaching-card"><h2>Unlock Teaching View</h2><p>Enter the room password to reveal both player Hands for this spectator session.</p><input id="pvpTeachingPassword" type="password" autocomplete="off" placeholder="Password"><div class="pvp-teaching-actions"><button id="pvpTeachingCancel" type="button">Cancel</button><button id="pvpTeachingUnlock" class="gold" type="button">Unlock</button></div></section>';
    document.body.appendChild(modal);
    var input=$('pvpTeachingPassword');if(input)setTimeout(function(){input.focus();},0);
    $('pvpTeachingCancel').onclick=closeTeachingViewModal;
    $('pvpTeachingUnlock').onclick=function(){var password=input&&input.value||'';if(!password){setStatus('offline','Enter the Teaching View password.');return;}send('unlock-teaching-view',{password:password});};
    if(input)input.addEventListener('keydown',function(ev){if(ev.key==='Enter')$('pvpTeachingUnlock').click();if(ev.key==='Escape')closeTeachingViewModal();});
    modal.addEventListener('click',function(ev){if(ev.target===modal)closeTeachingViewModal();});
    return true;
  }
  function toggleTeachingView(){var me=state.snapshot&&state.snapshot.local;if(!me||me.role!=='spectator')return false;if(me.teachingViewUnlocked)return send('lock-teaching-view');return openTeachingViewModal();}
  function loadStarterDeck(){var sel=$('pvpSetupDeck'),key=sel&&sel.value||state.deckKey||DECK_OPTIONS[0].key;if(!key)return false;state.lobbyRankPreview=1;state.deckKey=key;state.loadedDeckKey=key;state.customDeck=null;state.customDeckName='';state.lobbyFormation=clone(baseLobbyFormation(starterDeckData(key)));localStorage.setItem(DECK_KEY,key);localStorage.setItem(LOADED_DECK_KEY,key);if(state.connected&&localRole()!=='spectator')send('set-deck',{deckKey:key});renderPanel();return true;}
  function closeInvalidDeckImportModal(){
    var modal=$('pvpInvalidDeckImportModal');if(!modal)return false;
    var overlay=$('pvpSetupOverlay'),restore=modal.__glRestoreFocus,prevAria=modal.__glPrevSetupAria,prevInert=!!modal.__glPrevSetupInert;
    modal.remove();
    if(overlay){try{overlay.inert=prevInert;}catch(_){}if(prevAria===null||prevAria===undefined)overlay.removeAttribute('aria-hidden');else overlay.setAttribute('aria-hidden',prevAria);overlay.classList.remove('pvp-modal-underlay-blocked');}
    var target=(restore&&restore.isConnected)?restore:$('pvpImportDeckButton');if(target&&typeof target.focus==='function')setTimeout(function(){try{target.focus({preventScroll:true});}catch(_){try{target.focus();}catch(__){}}},0);
    return true;
  }
  function showInvalidDeckImportModal(reason){
    closeInvalidDeckImportModal();
    var overlay=$('pvpSetupOverlay'),restore=document.activeElement,modal=document.createElement('div');
    modal.id='pvpInvalidDeckImportModal';modal.className='pvp-utility-modal pvp-invalid-import-modal';
    modal.innerHTML='<section class="pvp-utility-card" role="dialog" aria-modal="true" aria-labelledby="pvpInvalidImportTitle" aria-describedby="pvpInvalidImportMessage"><header><div><span>DECK IMPORT</span><h2 id="pvpInvalidImportTitle">Invalid Deck Import</h2></div><button id="pvpInvalidImportClose" type="button" aria-label="Close invalid deck import message">CLOSE</button></header><p id="pvpInvalidImportMessage">'+esc(reason||'Invalid custom deck JSON.')+'</p><p>Your current deck remains unchanged. Fix the file and import it again.</p><div class="pvp-utility-actions"><button id="pvpInvalidImportDismiss" type="button">BACK TO DECK SETUP</button></div></section>';
    modal.__glRestoreFocus=restore;modal.__glPrevSetupAria=overlay?overlay.getAttribute('aria-hidden'):null;modal.__glPrevSetupInert=overlay?!!overlay.inert:false;
    document.body.appendChild(modal);
    if(overlay){try{overlay.inert=true;}catch(_){}overlay.setAttribute('aria-hidden','true');overlay.classList.add('pvp-modal-underlay-blocked');}
    var close=function(){closeInvalidDeckImportModal();};$('pvpInvalidImportClose').onclick=close;$('pvpInvalidImportDismiss').onclick=close;
    modal.addEventListener('click',function(ev){if(ev.target===modal)close();});
    modal.addEventListener('keydown',function(ev){if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();close();return;}if(ev.key==='Tab'){var buttons=modal.querySelectorAll('button:not([disabled])');if(buttons.length===1){ev.preventDefault();buttons[0].focus();}}});
    setTimeout(function(){var b=$('pvpInvalidImportDismiss')||$('pvpInvalidImportClose');if(b)try{b.focus({preventScroll:true});}catch(_){b.focus();}},0);
    return true;
  }
  function importCustomDeck(ev){
    var input=ev&&ev.target,file=input&&input.files&&input.files[0];if(!file)return;
    try{input.value='';}catch(_){}
    var reader=new FileReader();
    reader.onload=function(){
      try{
        var parsed=JSON.parse(String(reader.result||'')),b=bridge(),side=localSeat()===2?'AI':'PLAYER';
        if(!b||typeof b.validateImportedDeck!=='function')throw new Error('Deck validator is unavailable. Please reload and try again.');
        var validation=b.validateImportedDeck(parsed,side);
        if(!validation||!validation.ok)throw new Error(validation&&validation.errors&&validation.errors[0]||'Invalid custom deck JSON.');
        parsed=validation.deck||parsed;
        var name=safeName(parsed.display_name||parsed.deck_name||file.name.replace(/\.json$/i,''));
        state.lobbyRankPreview=1;state.customDeck=parsed;state.customDeckName=name||'Imported Deck';state.lobbyFormation=clone(baseLobbyFormation(parsed));state.loadedDeckKey='CUSTOM';state.deckKey='';localStorage.removeItem(LOADED_DECK_KEY);
        if(state.connected&&localRole()!=='spectator')send('set-deck',{customDeck:parsed,deckName:state.customDeckName});
        setStatus('online','Custom deck loaded: '+state.customDeckName);renderPanel();
      }catch(err){
        var reason=String(err&&err.message||'Invalid custom deck JSON.'),msg=$('pvpSetupHint');if(msg)msg.textContent=reason;showInvalidDeckImportModal(reason);
      }
    };
    reader.onerror=function(){var reason='Invalid deck file: the selected file could not be read.',msg=$('pvpSetupHint');if(msg)msg.textContent=reason;showInvalidDeckImportModal(reason);};
    reader.readAsText(file);
  }
  function offlineRemainingMs(p){if(!p||p.connected||!p.offlineExpiresAt)return null;var n=Date.parse(p.offlineExpiresAt)-Date.now();return isFinite(n)?Math.max(0,n):null;}
  function formatOfflineCountdown(p){var ms=offlineRemainingMs(p);if(ms===null)return p&&p.connected?'online':'offline';var total=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(total/60),sec=total%60,label=p.offlineTimeoutAction==='auto-forfeit'?'Auto Forfeit':'Reconnect';return 'offline · '+label+' '+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');}
  function seatHtml(seat,players){var p=(players||[]).find(function(x){return Number(x.seat)===seat;}),online=!!(p&&p.connected),me=localPlayer(),m=match()||{},canKick=seat===2&&p&&me&&Number(me.seat)===1&&m.status==='setup';return '<article class="pvp-v260-seat"><div><span>Player '+seat+'</span><strong>'+esc(p&&p.name||'Empty')+'</strong></div><p class="'+(online?'online':'')+'"><i></i>'+esc(p?formatOfflineCountdown(p):'offline')+(p&&p.ready?' · READY':'')+'</p>'+(canKick?'<button class="pvp-seat-kick" type="button" data-kick-seat="2" aria-label="Kick Player 2" title="Kick Player 2"><img src="assets/lobby/exit.png" alt="" aria-hidden="true"></button>':'')+'</article>'; }
  function ensureLobbyCrossAppNav(show){
    var button=$('glMobileAppMenuButton'),menu=$('glMobileAppMenu');
    if(!show){if(menu)menu.remove();if(button)button.remove();return false;}
    if(!button){button=document.createElement('button');button.id='glMobileAppMenuButton';button.className='gl-mobile-app-menu-button';button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','glMobileAppMenu');button.setAttribute('aria-label','Open Grandis Legacy menu');button.innerHTML='<span></span><span></span><span></span>';document.body.appendChild(button);}
    if(!menu){menu=document.createElement('nav');menu.id='glMobileAppMenu';menu.className='gl-mobile-app-menu';menu.setAttribute('aria-label','Grandis Legacy applications');menu.hidden=true;menu.innerHTML='<a href="'+esc(aiLobbyUrl())+'">VS AI</a><a href="https://grandislegacytcg.github.io/pvp/">PVP</a><a href="'+esc(DEPLOY_CONFIG.mobileDeckBuilderUrl||'https://grandislegacytcg.github.io/Grandis-Legacy-Deck-Builder/style-2/')+'">DECK BUILDER</a>';document.body.appendChild(menu);}
    return true;
  }
  var LAST_SERVER_BUILD_ID='';
  function noteServerBuild(msg){
    var serverBuild=String(msg&&msg.buildId||msg&&msg.match&&msg.match.serverBuildId||'');
    if(serverBuild)LAST_SERVER_BUILD_ID=serverBuild;
    window.GL_PVP_SERVER_BUILD_ID=LAST_SERVER_BUILD_ID||null;
    window.GL_PVP_BUILD_SKEW=!!(LAST_SERVER_BUILD_ID&&LAST_SERVER_BUILD_ID!==CLIENT_BUILD_ID);
    return true;
  }
  function syncCrossAppMobileNavVisibility(inMatch){
    var hide=!!inMatch;
    document.body.classList.toggle('pvp-match-active',hide);
    document.body.setAttribute('data-pvp-gameplay-active',hide?'1':'0');
    // Structural rule: the cross-app hamburger does not exist in active gameplay.
    // It is created only while the lobby is visible, so no CSS/order/cached-layout race can expose it in-match.
    ensureLobbyCrossAppNav(!hide&&document.body.classList.contains('pvp-lobby-mode'));
    return hide;
  }
  window.GL_PVP_QA_SYNC_CROSS_APP_NAV=syncCrossAppMobileNavVisibility;
  window.GL_PVP_QA_SYNC_BATTLEFIELD_IDENTITY=syncBattlefieldIdentityHeaders;
  function renderLobby(){
    var overlay=$('pvpSetupOverlay');if(!overlay)return;
    var snap=state.snapshot,me=snap&&snap.local,m=snap&&snap.match||{},active=['coin-flip','coin-result','started','finished'].indexOf(m.status)!==-1,spectator=!!(me&&me.role==='spectator'),showSpectatorSelect=!!(active&&spectator&&state.spectatorLobbyView),showLobby=!active||showSpectatorSelect;
    overlay.classList.toggle('open',showLobby);overlay.classList.toggle('pvp-spectator-room-select',showSpectatorSelect);document.body.classList.toggle('pvp-lobby-mode',showLobby);document.body.classList.toggle('pvp-booting',showLobby);syncCrossAppMobileNavVisibility(active&&!showLobby);
    var leave=$('pvpLeaveSpectatorViewButton');if(leave)leave.hidden=!(active&&spectator&&!showSpectatorSelect);
    if(!showLobby)return;
    var nameInput=$('pvpSetupName');if(nameInput&&document.activeElement!==nameInput)nameInput.value=state.nameDraft||state.name;
    if($('pvpSetupDeck')){$('pvpSetupDeck').innerHTML=deckSelectOptions(state.deckKey||activeLoadedDeckKey());$('pvpSetupDeck').value=state.deckKey||activeLoadedDeckKey()||DECK_OPTIONS[0].key;}
    var d=deckData(),stats=deckSummary(d);$('pvpDeckTitle').textContent=deckDisplayTitle(d);$('pvpDeckClassLine').textContent=deckClassLine(d);var rankLabel=$('pvpRankLabel'),rankPrev=$('pvpRankPrev'),rankNext=$('pvpRankNext');if(rankLabel)rankLabel.textContent=lobbyRankLabel();if(rankPrev)rankPrev.disabled=Number(state.lobbyRankPreview)<=1;if(rankNext)rankNext.disabled=Number(state.lobbyRankPreview)>=3;$('pvpFormationPreview').innerHTML=deckFormationHtml();preloadProgressionDeck(d);$('pvpDeckStats').innerHTML='<div class="stat-heroes"><dt>HEROES</dt><dd>'+stats.heroes+'</dd></div><div class="stat-legacies"><dt>LEGACIES</dt><dd>'+stats.legacies+'</dd></div><div class="total stat-legacy-deck"><dt>LEGACY DECK</dt><dd>'+(stats.heroes+stats.legacies)+'</dd></div><div class="stat-skills"><dt>SKILLS</dt><dd>'+stats.skills+'</dd></div><div class="stat-item"><dt>ITEM</dt><dd>'+stats.items+'</dd></div><div class="stat-event"><dt>EVENT</dt><dd>'+stats.events+'</dd></div><div class="total stat-main-deck"><dt>MAIN DECK</dt><dd>'+stats.main+'</dd></div>';$('pvpLoadedDeckStatus').textContent=state.customDeck?('Custom Deck Loaded: '+(state.customDeckName||'Imported Deck')):'';
    var ps=snap&&snap.players||[],sp=snap&&snap.spectators||[],teaching=!!(spectator&&me.teachingViewUnlocked),viewLabel=teaching?'BOTH HANDS':'CARD BACKS 🔒',viewClass=spectator?' class="pvp-spectator-view-control" role="button" tabindex="0" aria-label="'+(teaching?'Lock Teaching View':'Unlock Teaching View')+'"':'';
    $('pvpSetupStats').innerHTML='<div><dt>PLAYERS</dt><dd>'+ps.length+'/2</dd></div><div><dt>SPECTATORS</dt><dd>'+sp.length+'/4</dd></div><div'+viewClass+' id="pvpSpectatorViewControl"><dt>SPECTATORS VIEW</dt><dd>'+viewLabel+'</dd></div>';$('pvpSetupPeople').innerHTML=seatHtml(1,ps)+seatHtml(2,ps);
    var control=$('pvpSpectatorViewControl');if(control&&spectator){control.onclick=toggleTeachingView;control.onkeydown=function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();toggleTeachingView();}};}
    var complete=!!(state.name&&(state.customDeck||activeLoadedDeckKey()));$('pvpSetupReadyButton').textContent=me&&me.ready?'UNREADY':'READY';$('pvpSetupReadyButton').disabled=spectator||!state.connected||!complete||m.status!=='setup';$('pvpSetupSpectatorButton').textContent=showSpectatorSelect?'SPECTATE MATCH':(spectator?'JOIN AS PLAYER':'SPECTATE');$('pvpSetupStartButton').disabled=!(me&&me.seat===1)||!state.connected||m.status!=='setup'||!bothPlayersReadyAndDecked(snap);
    var icon=$('pvpNameStateIcon');icon.className='pvp-v260-name-icon'+(spectator?' spectate':(me&&me.ready?' ready':''));var hint=$('pvpSetupHint');if(hint){if(!state.connected)hint.textContent=state.connectionMessage||('Connecting to '+roomDisplayName()+'…');else if(showSpectatorSelect)hint.textContent=m.status==='finished'?'Match finished. View the result/battlefield or switch rooms.':'Match in progress. Spectate this match or switch rooms.';else if(spectator)hint.textContent=teaching?'Teaching View is active. Spectator mode remains read-only.':'Spectator mode is read-only. Both Hands remain hidden.';else if(!complete)hint.textContent='Enter your name and choose a deck before Ready.';else if(me&&me.seat===1&&!bothPlayersReadyAndDecked(snap))hint.textContent='Waiting for both players to be ready.';else hint.textContent='';}
  }
  function installPanel(){var wrap=document.createElement('div');wrap.innerHTML='<aside id="pvpNetworkPanel" class="pvp-net-panel"><div class="pvp-net-head"><h3 id="pvpPanelRoomName">PvP Room</h3><button id="pvpNetworkClose" type="button">Close</button></div><div id="pvpNetworkStatus" class="pvp-net-status">Connecting…</div><div id="pvpBoardStatus" class="pvp-net-small"></div><div id="pvpCoinFlipPanel"></div><div class="pvp-net-row"><button id="pvpPullBoardButton" type="button">Sync Board</button><button id="pvpReconnectButton" type="button">Reconnect</button></div><button id="pvpLeaveSpectatorViewButton" type="button" hidden>Back to Room Select</button></aside>';document.body.appendChild(wrap);$('pvpPanelRoomName').textContent=roomDisplayName();$('pvpNetworkClose').onclick=function(){$('pvpNetworkPanel').classList.remove('open');};$('pvpPullBoardButton').onclick=function(){importServerBoard(true);};$('pvpReconnectButton').onclick=function(){connect(true);};$('pvpLeaveSpectatorViewButton').onclick=function(){$('pvpNetworkPanel').classList.remove('open');returnSpectatorToLobby();};}
  function toggleReady(){var me=localPlayer();if(!me||me.role!=='player'){setStatus('offline','Spectator is read-only.');return;}var nameInput=$('pvpSetupName'),typedName=safeName(nameInput&&nameInput.value||state.nameDraft||state.name);if(typedName&&typedName!==state.name){state.name=typedName;state.nameDraft=typedName;try{localStorage.setItem(NAME_KEY,state.name);}catch(e){}send('rename',{name:state.name});}if(!state.name){state.name=(me&&me.seatLabel)||selfLabel()||'Player';localStorage.setItem(NAME_KEY,state.name);send('rename',{name:state.name});}if(!state.customDeck&&!activeLoadedDeckKey()){setStatus('offline','Choose a deck before Ready.');return;}if(state.customDeck)send('set-deck',{customDeck:state.customDeck,deckName:state.customDeckName});else send('set-deck',{deckKey:activeLoadedDeckKey(),formation:currentLobbyFormation(starterDeckData(activeLoadedDeckKey()))});send('ready',{ready:!(me&&me.ready)});}
  function bothPlayersReadyAndDecked(snap){var ps=snap&&snap.players||[];return ps.length===2&&ps.every(function(p){return p.connected&&p.ready&&p.hasDeck&&p.name;});}
  function renderPanel(){var snap=state.snapshot,me=snap&&snap.local,m=snap&&snap.match||{};var panel=$('pvpNetworkPanel');if(panel){var coin=$('pvpCoinFlipPanel');if(coin){coin.innerHTML=coinFlipControlHtml(m,me);wireCoinButtons();}var st=$('pvpBoardStatus');if(st)st.textContent='Status: '+(m.status||'setup')+' · Server board r'+Number(m.serverBoardRevision||0)+'.';var pull=$('pvpPullBoardButton');if(pull)pull.disabled=!m.serverBoard;}renderLobby();}
  function renderPeople(){return;}
  function handleSnapshot(msg){
    noteServerBuild(msg);
    var previousStatus=state.lastMatchStatus,hadSnapshot=!!state.snapshot;
    var incomingRevision=Number(msg&&msg.match&&msg.match.serverBoardRevision||0),incomingMatch=msg&&msg.match||{},incomingStatus=incomingMatch.status||'setup',lastIntent=incomingMatch.lastIntent||null;
    var reloadOnSetup=hadSnapshot&&incomingStatus==='setup'&&(state.reloadAfterRoomReset||previousStatus==='finished');
    if(reloadOnSetup){state.reloadAfterRoomReset=false;clearIntentLock();if(typeof location!=='undefined'&&typeof location.reload==='function')location.reload();return;}
    if(state.intentInFlight&&(incomingRevision>state.intentBaseRevision||(lastIntent&&Number(lastIntent.fromSeat)===Number(localSeat())&&lastIntent.intent===state.intentName&&(!state.intentActionId||!lastIntent.clientActionId||lastIntent.clientActionId===state.intentActionId))))clearIntentLock();
    if(incomingStatus==='setup'||(incomingStatus==='coin-flip'&&state.lastMatchStatus==='finished'))clearTransientUiState();
    state.lastMatchStatus=incomingStatus;state.snapshot=msg;var me=msg.local||{};
    // Prime persistent presentation values before importing/rendering the new
    // authoritative board so replacement markup never paints a default timer.
    syncMatchTimerState(incomingMatch);
    window.GL_PVP_LOCAL_SEAT=me.seat||null;window.GL_PVP_LOCAL_ROLE=me.role||state.role;
    window.GL_PVP_LOCAL_NAME=selfLabel();window.GL_PVP_OPPONENT_NAME=opponentLabel();syncConnectionSignalGlobals();
    if(me.name){state.name=me.name;var nameInput=$('pvpSetupName');if(!nameInput||document.activeElement!==nameInput)state.nameDraft=me.name;}
    if(me.role){state.role=me.role;try{localStorage.setItem(ROLE_KEY,me.role);}catch(e){}}
    if(me.seatToken){state.seatToken=me.seatToken;try{localStorage.setItem(seatTokenStorageKey(),me.seatToken);}catch(e){}}if(me.teachingViewUnlocked)closeTeachingViewModal();
    if(me.deckKey){state.loadedDeckKey=me.deckKey==='CUSTOM'?'':me.deckKey;if(me.deckKey!=='CUSTOM')state.deckKey=me.deckKey;if(me.deckName&&me.deckKey==='CUSTOM')state.customDeckName=me.deckName;if(me.deckKey!=='CUSTOM'&&me.formation&&formationIsValid(starterDeckData(me.deckKey),me.formation))state.lobbyFormation=clone(me.formation);}
    if(msg.deckOptions&&msg.deckOptions.length)DECK_OPTIONS=msg.deckOptions;
    var incomingGeneration=Number(msg&&msg.room&&msg.room.generation||1);if(state.roomGeneration&&incomingGeneration!==state.roomGeneration){state.seatToken='';state.spectatorBattlefieldEntered=false;try{localStorage.removeItem(seatTokenStorageKey());}catch(e){}}state.roomGeneration=incomingGeneration;var m=msg.match||{},active=(m.status==='coin-flip'||m.status==='coin-result'||m.status==='started'||m.status==='finished');if(me.role==='spectator'&&active&&!state.spectatorBattlefieldEntered)state.spectatorLobbyView=true;if(!active){state.spectatorLobbyView=false;state.spectatorBattlefieldEntered=false;}
    if(active){
      if(m.status==='started'&&previousStatus==='coin-result')closeBattlefieldCoinModal();
      if(window.GL_PVP_PRESENTATION_ADAPTER)window.GL_PVP_PRESENTATION_ADAPTER.setSharedBoardMode(true);
      importServerBoard(false);
    }else{closeBattlefieldCoinModal();state.lastAppliedRevision=0;document.body.classList.add('pvp-booting');if(window.GL_PVP_PRESENTATION_ADAPTER)window.GL_PVP_PRESENTATION_ADAPTER.setSharedBoardMode(false);}
    setStatus('online','Connected · '+(me.role==='player'?(me.seatLabel||('Player '+me.seat)):'Spectator')+' · '+((msg.room&&msg.room.id)||roomDisplayName())+' · r'+Number(m.serverBoardRevision||0));
    renderPanel();syncSpectatorMatchControls();syncBattlefieldCoinModal();maybeAnimatePvpCoinResult(m);humanizeVisibleLabels();setTimeout(function(){syncPvpGameResultUi();syncSpectatorMatchControls();},0);
  }
  var lastActivitySentAt=0;
  function sendUserActivity(force){var now=Date.now();if(!force&&now-lastActivitySentAt<8000)return false;lastActivitySentAt=now;closeIdleWarning();return send('activity',{at:now});}
  function closeIdleWarning(){var modal=$('pvpIdleWarningModal');if(modal)modal.remove();}
  function showIdleWarning(payload){
    if(localRole()!=='player')return;closeIdleWarning();var seconds=Math.max(0,Math.ceil(Number(payload&&payload.remainingMs||0)/1000));
    var modal=document.createElement('div');modal.id='pvpIdleWarningModal';modal.className='pvp-idle-modal';modal.innerHTML='<section class="pvp-idle-card"><h2>Idle Warning</h2><p>You have been inactive for 5 minutes. Your Player seat will be released after 10 minutes of total inactivity.</p><strong id="pvpIdleCountdown">Seat release in '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+'</strong><button id="pvpIdleStay" type="button">STAY IN SEAT</button></section>';document.body.appendChild(modal);
    var tick=setInterval(function(){var el=$('pvpIdleCountdown');if(!el){clearInterval(tick);return;}seconds=Math.max(0,seconds-1);el.textContent='Seat release in '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');},1000);
    $('pvpIdleStay').onclick=function(){sendUserActivity(true);closeIdleWarning();};
  }
  function installActivityTracking(){['pointerdown','keydown','touchstart','wheel'].forEach(function(type){window.addEventListener(type,function(){sendUserActivity(false);},{passive:true,capture:true});});document.addEventListener('visibilitychange',function(){if(!document.hidden)sendUserActivity(true);});}
  function connect(force){
    if(ws&&!force&&(ws.readyState===WebSocket.OPEN||ws.readyState===WebSocket.CONNECTING))return;
    if(ws){try{ws.close(4000,'rejoin');}catch(e){}}
    clearTimeout(reconnectTimer);clearConnectTimeout();
    var target='';
    try{target=wsUrl();}catch(e){state.connected=false;syncConnectionSignalGlobals();setConnectionState('error',String(e&&e.message||'PvP server endpoint configuration error.'),'');scheduleReconnect();return;}
    setConnectionState('connecting','Connecting to '+roomDisplayName()+'…',target);
    try{ws=new WebSocket(target);}catch(e){state.connected=false;syncConnectionSignalGlobals();setConnectionState('error','Could not open '+roomDisplayName()+'. '+String(e&&e.message||'WebSocket error'),target);scheduleReconnect();return;}
    connectTimeoutTimer=setTimeout(function(){if(!ws||ws.readyState!==WebSocket.CONNECTING)return;state.connected=false;syncConnectionSignalGlobals();setConnectionState('error',roomDisplayName()+' did not answer within '+Math.round(connectionTimeoutMs()/1000)+'s. Check the deployed PvP server, then Reconnect.',target);try{ws.close(4001,'connection timeout');}catch(e){}},connectionTimeoutMs());
    ws.onopen=function(){clearConnectTimeout();clearIntentLock();state.connected=true;state.latencyMs=null;state.lastPongAt=Date.now();syncConnectionSignalGlobals();setTimeout(syncBattlefieldIdentityHeaders,0);reconnectDelay=1200;setConnectionState('connected','Connected to '+roomDisplayName(),target);renderPanel();if(state.name)send('rename',{name:state.name});if(state.role==='player'&&state.customDeck)send('set-deck',{customDeck:state.customDeck,deckName:state.customDeckName});else if(state.role==='player'&&activeLoadedDeckKey())send('set-deck',{deckKey:activeLoadedDeckKey(),formation:currentLobbyFormation(starterDeckData(activeLoadedDeckKey()))});};
    ws.onclose=function(ev){clearConnectTimeout();clearIntentLock();state.connected=false;state.latencyMs=null;syncConnectionSignalGlobals();setTimeout(syncBattlefieldIdentityHeaders,0);var msg=state.connectionState==='error'?state.connectionMessage:('Disconnected from '+roomDisplayName()+'. Reconnecting…');setConnectionState(state.connectionState==='error'?'error':'offline',msg,target);renderPanel();scheduleReconnect();};
    ws.onerror=function(){state.connected=false;syncConnectionSignalGlobals();setTimeout(syncBattlefieldIdentityHeaders,0);setConnectionState('error','Cannot reach '+roomDisplayName()+'. Verify the deployed PvP server endpoint and try Reconnect.',target);};
    ws.onmessage=function(ev){var msg;try{msg=JSON.parse(ev.data);}catch(e){return;}if(msg.type==='pong'){noteServerBuild(msg);var now=Date.now(),sent=Number(msg.clientAt||state.lastPingSentAt||0);if(sent>0&&now>=sent)state.latencyMs=Math.max(0,now-sent);state.opponentLatencyMs=(msg.opponentLatencyMs!==null&&msg.opponentLatencyMs!==undefined&&Number.isFinite(Number(msg.opponentLatencyMs)))?Math.max(0,Math.round(Number(msg.opponentLatencyMs))):null;state.lastPongAt=now;state.lastPingSentAt=0;syncConnectionSignalGlobals();syncBattlefieldIdentityHeaders();return;}if(msg.type==='snapshot'){handleSnapshot(msg);return;}if(msg.type==='intent-ack'){if(state.intentInFlight&&(!state.intentActionId||!msg.clientActionId||msg.clientActionId===state.intentActionId))setStatus('connecting','Server received '+(msg.intent||state.intentName||'action')+(msg.duplicate?' · duplicate safely ignored':' · resolving...'));return;}if(msg.type==='idle-warning'){showIdleWarning(msg);return;}if(msg.type==='idle-released'){closeIdleWarning();setStatus('offline',msg.message||'Player seat released due to inactivity.');return;}if(msg.type==='seat-kicked'){state.seatToken='';try{localStorage.removeItem(seatTokenStorageKey());}catch(e){}clearIntentLock();setStatus('offline',msg.message||'You were removed from the room by Player 1.');state.role='spectator';state.spectatorLobbyView=true;renderLobby();return;}if(msg.type==='notice'){if(msg.kind==='error')clearIntentLock();setStatus(msg.kind==='error'?'offline':'online',msg.message||'Notice');return;}if(msg.type==='fatal'){setConnectionState('error',msg.message||'Fatal room error',target);try{ws.close();}catch(e){}}};
  }
  function scheduleReconnect(){clearTimeout(reconnectTimer);reconnectTimer=setTimeout(function(){connect(false);},reconnectDelay);reconnectDelay=Math.min(reconnectDelay*1.6,10000);} 
  function installPvpInterfaceStyles(){var style=document.createElement('style');style.id='gl-pvp-interface-styles';style.textContent=`
/* Battlefield layout is inherited from VS AI v5.55. Preserve the proven PvP coin popup and add only approved lobby refinements. */
.pvp-coin-modal{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:18px}.pvp-coin-modal-card{width:min(460px,calc(100vw - 32px));border:1px solid rgba(255,215,80,.8);border-radius:18px;background:#07121d;color:#f8f4df;box-shadow:0 24px 80px rgba(0,0,0,.72);padding:18px}.pvp-coin-modal-card h2{margin:0 0 8px;color:#ffd84a;font-size:24px}.pvp-coin-modal-card p{margin:8px 0;line-height:1.45}.pvp-coin-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:14px}.pvp-coin-modal-actions .pvp-coin-choice{width:min(148px,100%);justify-self:center}.pvp-coin-modal-actions button:not(.pvp-coin-choice){border-radius:12px;border:1px solid rgba(255,255,255,.25);padding:12px 14px;font-weight:900;background:#1b3048;color:#fff}.pvp-coin-modal-actions button.gold:not(.pvp-coin-choice){background:#f3ce47;color:#111}.pvp-coin-wait{border:1px dashed rgba(255,215,80,.45);border-radius:12px;padding:12px;background:rgba(255,215,80,.08)}.pvp-coin-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.pvp-coin-result-grid div{border:1px solid rgba(255,215,80,.38);border-radius:12px;padding:12px;background:rgba(255,215,80,.08);display:grid;gap:8px;place-items:center}.pvp-coin-result-grid span{font-size:12px;color:#d8d4bd}.pvp-coin-result-face{display:block;width:min(118px,100%);aspect-ratio:1/1;object-fit:contain;border-radius:50%;filter:drop-shadow(0 8px 18px rgba(0,0,0,.4))}.pvp-coin-result-grid.compact .pvp-coin-result-face{width:72px}.pvp-coin-modal-actions.single{grid-template-columns:1fr}
.pvp-coin-choice.waiting-display{cursor:default!important;opacity:.72!important;filter:saturate(.72)!important;transform:none!important}
.pvp-game-result-summary{min-width:min(440px,78vw)!important}.pvp-game-result-actions{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;margin-top:4px!important}.pvp-game-result-actions small{color:#9aabba!important;font-size:10px!important;text-align:center!important;line-height:1.35!important}
.pvp-v260-showcase{grid-template-columns:minmax(0,1fr) minmax(244px,27%);gap:12px!important}.pvp-v260-formation{grid-template-columns:minmax(0,1fr) 27px minmax(0,1fr) 27px minmax(0,1fr)!important;gap:6px!important}.pvp-v260-summary{background:linear-gradient(180deg,rgba(5,11,18,.96),rgba(5,10,17,.92))!important;border:1px solid rgba(255,255,255,.035);box-shadow:0 10px 20px rgba(0,0,0,.28)!important}
.pvp-v260-name-icon.spectate{display:block!important;width:16px!important;height:16px!important;border:2px solid var(--pvp-gold)!important;border-radius:50% 0 50% 0!important;background:transparent!important;transform:translateY(-50%) rotate(45deg)!important}.pvp-v260-name-icon.spectate:before{content:''!important;position:absolute;left:50%;top:50%;width:5px!important;height:5px!important;border-radius:50%!important;background:var(--pvp-gold)!important;transform:translate(-50%,-50%) rotate(-45deg)!important}
.pvp-spectator-view-control{cursor:pointer;border-radius:7px;padding:3px 5px;margin:-3px -5px}.pvp-spectator-view-control:hover,.pvp-spectator-view-control:focus-visible{background:rgba(241,212,129,.08);outline:1px solid rgba(241,212,129,.25)}
.pvp-teaching-modal{position:fixed;inset:0;z-index:10030;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.62)}.pvp-teaching-card{width:min(420px,calc(100vw - 32px));border:1px solid rgba(241,212,129,.72);border-radius:15px;background:#07121d;color:#f5f7fb;box-shadow:0 24px 80px rgba(0,0,0,.72);padding:20px}.pvp-teaching-card h2{margin:0 0 8px;color:#f1d481;font-size:20px}.pvp-teaching-card p{margin:0 0 14px;color:#b9c2ce;font-size:13px;line-height:1.45}.pvp-teaching-card input{width:100%;height:44px;border:1px solid rgba(229,234,243,.38);border-radius:10px;background:#040a11;color:#f5f7fb;padding:0 12px}.pvp-teaching-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:13px}.pvp-teaching-actions button{min-height:40px;border:1px solid #dcbf68;border-radius:9px;background:#101722;color:#f1d481;font-weight:900}.pvp-teaching-actions button.gold{background:linear-gradient(180deg,#f5dc91,#c49b43);color:#11151c}

.pvp-progression-modal{position:fixed;inset:0;z-index:10045;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.72)}.pvp-progression-card{width:min(940px,calc(100vw - 32px));max-height:92vh;overflow:auto;border:1px solid rgba(241,212,129,.72);border-radius:16px;background:linear-gradient(180deg,#08131f,#050b12);box-shadow:0 28px 90px rgba(0,0,0,.8);padding:18px}.pvp-progression-card header{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px}.pvp-progression-card header span{display:block;color:#f1d481;font-size:11px;font-weight:900;letter-spacing:.08em}.pvp-progression-card header h2{margin:3px 0 0;color:#f5f7fb;font-size:22px}.pvp-progression-card header button{min-width:72px;height:36px;padding:0 16px;border:1px solid #4b6b82;border-radius:9px;background:#13283b;color:#f5f7fb;font-size:13px;font-weight:800}.pvp-progression-card header button:hover{filter:brightness(1.08)}.pvp-progression-static-card{cursor:pointer!important}.pvp-progression-static-card img{pointer-events:none}.pvp-progression-row{display:grid;grid-template-columns:minmax(0,1fr) 28px minmax(0,1fr) 28px minmax(0,1fr);gap:8px;align-items:center}.pvp-progression-arrow{display:grid;place-items:center;color:#f1d481;font-size:28px;font-weight:900}.pvp-progression-hero.current{box-shadow:0 0 0 2px rgba(241,212,129,.72),0 12px 28px rgba(0,0,0,.38)}.pvp-progression-card>p{margin:12px 0 0;text-align:center;color:#9ea8b5;font-size:12px}.pvp-lobby-mode #previewOverlay{z-index:10060!important}.pvp-idle-modal{position:fixed;inset:0;z-index:10100;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.68)}.pvp-idle-card{width:min(420px,calc(100vw - 32px));border:1px solid rgba(241,212,129,.75);border-radius:15px;background:#07121d;color:#f5f7fb;box-shadow:0 24px 80px rgba(0,0,0,.75);padding:20px;text-align:center}.pvp-idle-card h2{margin:0 0 8px;color:#f1d481}.pvp-idle-card p{margin:0 0 14px;color:#c5ced9;line-height:1.5}.pvp-idle-card strong{display:block;margin-bottom:14px;color:#f1d481}.pvp-idle-card button{width:100%;min-height:42px;border:1px solid #dcbf68;border-radius:9px;background:linear-gradient(180deg,#f5dc91,#c49b43);color:#11151c;font-weight:900}

.pvp-utility-modal{position:fixed;inset:0;z-index:10140;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.72)}.pvp-utility-card{width:min(620px,calc(100vw - 32px));max-height:90vh;overflow:auto;border:1px solid rgba(241,212,129,.74);border-radius:16px;background:linear-gradient(180deg,#08131f,#050b12);color:#f5f7fb;box-shadow:0 28px 90px rgba(0,0,0,.82);padding:18px}.pvp-utility-card header{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}.pvp-utility-card header span{display:block;color:#f1d481;font-size:10px;font-weight:900;letter-spacing:.08em}.pvp-utility-card header h2{margin:3px 0 0;font-size:20px}.pvp-utility-card header button,.pvp-utility-actions button{min-height:38px;padding:0 15px;border:1px solid #4b6b82;border-radius:9px;background:#13283b;color:#f5f7fb;font-weight:850}.pvp-modal-underlay-blocked{pointer-events:none!important;user-select:none!important}.pvp-invalid-import-modal .pvp-utility-actions{grid-template-columns:1fr}.pvp-utility-card>p{color:#c4ccd6;line-height:1.5}.pvp-utility-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}.pvp-utility-actions .danger{border-color:#a82b40;background:#711426}.pvp-deck-review-formation{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.pvp-deck-review-formation .pvp-v260-hero{padding:7px}.pvp-deck-review-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px 22px;margin:14px 0 0}.pvp-deck-review-stats>div{display:grid;grid-template-columns:1fr auto;gap:10px;border-bottom:1px solid rgba(255,255,255,.10);padding:7px 0}.pvp-deck-review-stats dt,.pvp-deck-review-stats dd{margin:0}.pvp-deck-review-stats dt{color:#aeb7c3}.pvp-deck-review-stats dd{font-weight:900}
@media(max-width:760px){.pvp-coin-modal{padding:12px}.pvp-coin-modal-card{padding:15px}.pvp-coin-modal-card h2{font-size:20px}.pvp-v260-showcase{grid-template-columns:1fr!important}.pvp-v260-formation{display:grid!important;grid-template-columns:minmax(0,1fr) 25px minmax(0,1fr) 25px minmax(0,1fr)!important;gap:4px!important;overflow:visible!important;scroll-snap-type:none!important;padding-bottom:0!important}.pvp-v260-swap-button{width:25px!important;height:25px!important;font-size:15px!important}.pvp-v260-hero{min-width:0!important;flex:initial!important;padding:5px!important;border-radius:8px!important}.pvp-v260-position{font-size:10px!important;margin:0!important;padding-top:5px!important}.pvp-v260-card{border-radius:6px!important}.pvp-v260-title h2{font-size:22px!important}.pvp-v260-title p{font-size:10px!important}.pvp-v260-summary{margin-top:8px!important}.pvp-v260-summary dl{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;grid-template-rows:repeat(3,minmax(31px,auto)) minmax(39px,auto)!important;column-gap:20px!important;row-gap:0!important}.pvp-v260-summary dl>div{margin:0!important;min-height:31px!important;border:0!important}.pvp-v260-summary .stat-heroes{grid-column:1;grid-row:1}.pvp-v260-summary .stat-legacies{grid-column:1;grid-row:2}.pvp-v260-summary .stat-skills{grid-column:2;grid-row:1}.pvp-v260-summary .stat-item{grid-column:2;grid-row:2}.pvp-v260-summary .stat-event{grid-column:2;grid-row:3}.pvp-v260-summary .stat-legacy-deck{grid-column:1;grid-row:4;align-self:end!important}.pvp-v260-summary .stat-main-deck{grid-column:2;grid-row:4;align-self:end!important}.pvp-v260-summary .total{min-height:39px!important;margin:0!important;border-top:1px solid rgba(229,234,243,.20)!important;border-bottom:1px solid rgba(229,234,243,.20)!important}.pvp-progression-card{padding:13px}.pvp-progression-row{grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr) 16px minmax(0,1fr);gap:3px}.pvp-progression-arrow{font-size:17px}.pvp-progression-card header h2{font-size:18px}.pvp-progression-card .pvp-v260-position{font-size:9px!important}.gl-opening-coin-card{width:min(680px,calc(100vw - 32px))!important}.gl-opening-coin-actions,.gl-opening-coin-result{gap:14px!important}.gl-opening-coin-actions button img,.gl-opening-coin-result img{width:min(142px,36vw)!important;height:min(142px,36vw)!important}.pvp-utility-card{padding:14px}.pvp-deck-review-formation{gap:5px}.pvp-deck-review-stats{grid-template-columns:1fr 1fr;gap:5px 14px}}
`;document.head.appendChild(style);}
  var PVP_MOBILE_MATCH_MENU_OPEN=false;
  function syncPvpMobileMatchMenuState(){var overlay=$('mobileMatchMenuOverlay'),button=$('mobileMatchMenuButton');if(!overlay)return false;if(PVP_MOBILE_MATCH_MENU_OPEN){overlay.hidden=false;overlay.classList.add('open');if(button)button.setAttribute('aria-expanded','true');}else{overlay.classList.remove('open');overlay.hidden=true;if(button)button.setAttribute('aria-expanded','false');}return true;}
  function installPvpMobileMatchMenuController(){document.addEventListener('click',function(ev){var target=ev.target&&ev.target.closest?ev.target:null;if(!target)return;var open=target.closest('#mobileMatchMenuButton');if(open){ev.preventDefault();ev.stopImmediatePropagation();PVP_MOBILE_MATCH_MENU_OPEN=true;syncPvpMobileMatchMenuState();return;}var room=target.closest('#mobilePvpRoomButton');if(room){ev.preventDefault();ev.stopImmediatePropagation();PVP_MOBILE_MATCH_MENU_OPEN=false;syncPvpMobileMatchMenuState();var panel=$('pvpNetworkPanel');if(panel)panel.classList.add('open');return;}var close=target.closest('#mobileMatchMenuClose');var overlay=target.id==='mobileMatchMenuOverlay';if(close||overlay){ev.preventDefault();ev.stopImmediatePropagation();PVP_MOBILE_MATCH_MENU_OPEN=false;syncPvpMobileMatchMenuState();return;}if(target.closest('#mobileDeckSetupButton,#mobileSurrenderButton')){PVP_MOBILE_MATCH_MENU_OPEN=false;setTimeout(syncPvpMobileMatchMenuState,0);}},true);window.addEventListener('gl-local-state-rendered',function(){setTimeout(syncPvpMobileMatchMenuState,0);});}
  function syncPvpGameResultUi(){var title=$('infoTitle'),body=$('infoBody');if(!title||!body||title.textContent.trim()!=='PvP Game Result')return;var current=body.querySelector('.pvp-result-body');if(!current||body.querySelector('.pvp-game-result-summary'))return;var snap=state.snapshot||{},m=snap.match||{},a=appState()||m.serverBoard&&m.serverBoard.appState||{},r=m.result||m.pvpGameResult||a.pvpGameResult||{};var winner=r.winnerName||humanizeRuntimeText(a.winner||'Winner'),reason=r.reason||a.gameEndReason||'Game ended.',round=r.round||a.round||1,phase=r.phase||a.phase||'Unknown';body.innerHTML='<div class="game-result-summary pvp-game-result-summary"><section class="game-result-winner"><span>Winner</span><strong>'+esc(winner)+'</strong></section><section class="game-result-reason"><span>Reason</span><strong>'+esc(reason)+'</strong></section><section class="game-result-round"><span>Round</span><strong>'+esc(round)+'</strong><small>'+esc(phase)+' Phase</small></section><div class="pvp-game-result-actions"><button id="pvpResultBackLobby" class="primary" type="button">'+(localRole()==='spectator'?'Back to Room Select':'Back to Lobby')+'</button><small>Finished battle state auto-cleans after 1 minute.</small></div></div>';}
  function observePvpResultUi(){var body=$('infoBody');if(!body||typeof MutationObserver==='undefined')return;new MutationObserver(function(){setTimeout(syncPvpGameResultUi,0);}).observe(body,{childList:true,subtree:true});}
  function boot(){initState();installStyles();installPvpInterfaceStyles();installTurnPhaseStyles();installPanel();installLobbyModal();installPvpMobileMatchMenuController();observePvpResultUi();installActivityTracking();ensureMatchTimerInterval();connect(false);setInterval(function(){var ps=state.snapshot&&state.snapshot.players||[];if(ps.some(function(p){return p.connected===false&&p.offlineExpiresAt;}))renderPanel();},1000);setInterval(function(){if(localRole()!=='player'||!ws||ws.readyState!==WebSocket.OPEN)return;var now=Date.now();if(state.lastPingSentAt&&now-state.lastPingSentAt<22000)return;state.lastPingSentAt=now;send('ping',{clientAt:now,latencyMs:state.latencyMs});},10000);document.addEventListener('pointerdown',requestGameplayAudioUnlock,true);document.addEventListener('touchstart',requestGameplayAudioUnlock,{capture:true,passive:true});document.addEventListener('keydown',requestGameplayAudioUnlock,true);document.addEventListener('click',mapGameplayClick,true);window.addEventListener('gl-local-state-rendered',function(){setTimeout(function(){syncPvpGameResultUi();syncPvpMobileMatchMenuState();syncSpectatorMatchControls();syncBattlefieldIdentityHeaders();var m=match()||{},active=['coin-flip','coin-result','started','finished'].indexOf(m.status)!==-1;syncCrossAppMobileNavVisibility(active&&!document.body.classList.contains('pvp-lobby-mode'));},0);});window.GL_PVP_AFTER_RENDER=function(){syncSpectatorMatchControls();syncBattlefieldIdentityHeaders();var m=match()||{},active=['coin-flip','coin-result','started','finished'].indexOf(m.status)!==-1;syncCrossAppMobileNavVisibility(active&&!document.body.classList.contains('pvp-lobby-mode'));if(!isMobileHandViewport())return;var apply=function(){applyMobileHandPosition();syncSpectatorMatchControls();syncBattlefieldIdentityHeaders();};if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){requestAnimationFrame(apply);});else setTimeout(apply,0);};window.GL_PVP_NETWORK={version:VERSION,buildId:CLIENT_BUILD_ID,send:send,reconnect:function(){connect(true);},getSnapshot:function(){return state.snapshot;},pullBoard:function(){return importServerBoard(true);},sendIntent:runtimeIntent,roomLink:roomLink,getResolvedWsUrl:function(){try{return wsUrl();}catch(e){return '';}},getConnectionDiagnostics:function(){return{room:roomNumber(),displayName:roomDisplayName(),state:state.connectionState,message:state.connectionMessage,url:state.connectionUrl||''};},getLobbyRankPreview:function(){return Number(state.lobbyRankPreview)||1;},getLobbyFormation:function(){return clone(currentLobbyFormation());},swapLobbyFormation:swapLobbyFormation,clearTransientUiState:clearTransientUiState,pendingClosePolicy:pendingClosePolicy};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
