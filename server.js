import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomInt, createHash } from 'node:crypto';
import { WebSocketServer as LiteWebSocketServer, WebSocket as LiteWebSocket } from './server/ws-compat.mjs';
// Season 1 uses ws. Production installs the same transport; the built-in
// RFC6455 adapter remains available for offline QA and isolated development.
let WebSocketServer=LiteWebSocketServer,WebSocket=LiteWebSocket,WS_BACKEND='lite';
try {
  const nativeWs=await import('ws');
  WebSocketServer=nativeWs.WebSocketServer;WebSocket=nativeWs.WebSocket;WS_BACKEND='ws';
} catch(error) {
  if(process.env.PVP_REQUIRE_WS==='1')throw new Error('Production requires ws transport: '+String(error.message||error));
}

import {readFileSync} from 'node:fs';
import { Season0HeadlessAuthority, primeSeason0Runtime } from './server/headless-rc32.mjs';
import { season0StarterCatalog } from './server/s0-pregame-catalog.mjs';
import { viewerSafeBoard, assertViewerSafeBoard, makeBlindChoices } from './server/viewer-safe.mjs';

const BASE=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC=path.join(BASE,'public');
const PORT=Number(process.env.PORT||3000);
const HOST=String(process.env.HOST||'0.0.0.0').trim()||'0.0.0.0';
const VERSION='S0-RC39-PVP-NET-RC6-STAGE2-REPO-RC6-P3';
const BUILD_ID='gl-s0-pvp-rc39-beta2-repo-rc6-p3-2026-11-13';
const BUILD_LABEL=`Grandis Legacy PvP · S0 RC39 Repo RC6 P3 · Network RC6 Stage 2`;
const AUTHORITY_BUNDLE_SHA256=createHash('sha256').update(readFileSync(path.join(PUBLIC,'battle/engine/shared-app/app.bundle.js'))).digest('hex');
// Parse the immutable RC39 engine BEFORE the server accepts players. This
// removes script reads + JS compilation from the synchronous START MATCH path.
// Each match still runs those scripts in its OWN vm.createContext.
primeSeason0Runtime(path.join(PUBLIC,'battle'));
const MAX_SPECTATORS=4;
const MAX_WS_PAYLOAD=2*1024*1024;
const MAX_WS_BUFFERED_BYTES=2*1024*1024;
const ROOM_NETWORK_STATS={slowClientDisconnects:0};
const LOBBY_IDLE_MS=60*1000;
// The owner of the active decision is the only person subject to a match
// idle deadline. A waiting opponent is never silently surrendered.
const MATCH_IDLE_MS=Math.max(1000,Number(process.env.MATCH_IDLE_MS)||10*60*1000);
const MATCH_DISCONNECT_GRACE_MS=Math.max(1000,Number(process.env.MATCH_DISCONNECT_GRACE_MS)||3*60*1000);
const COIN_CHOICE_TIMEOUT_MS=Math.max(1000,Number(process.env.COIN_CHOICE_TIMEOUT_MS)||90*1000);
const COIN_RESULT_TIMEOUT_MS=Math.max(1000,Number(process.env.COIN_RESULT_TIMEOUT_MS)||90*1000);
const COIN_ACK_GRACE_MS=Math.max(500,Number(process.env.COIN_ACK_GRACE_MS)||12*1000);
const COIN_DISCONNECT_GRACE_MS=Math.max(1000,Number(process.env.COIN_DISCONNECT_GRACE_MS)||45*1000);
const IDLE_SWEEP_MS=Math.max(200,Number(process.env.IDLE_SWEEP_MS)||5000);
const POST_MATCH_CLEANUP_MS=Math.max(1000,Number(process.env.POST_MATCH_CLEANUP_MS)||60000);

const mime={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp',
  '.svg':'image/svg+xml','.ico':'image/x-icon','.mp3':'audio/mpeg','.wav':'audio/wav','.woff2':'font/woff2',
  '.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8','.csv':'text/csv; charset=utf-8'
};
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const now=()=>new Date().toISOString();
const safeText=(v,max=120)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,max);
const safeClient=v=>safeText(v,80).replace(/[^a-zA-Z0-9_.:-]/g,'')||('c_'+randomBytes(8).toString('hex'));
const safeRole=v=>String(v)==='spectator'?'spectator':'player';
const token=()=>randomBytes(24).toString('base64url');
const tokenHash=v=>v?createHash('sha256').update(String(v)).digest('hex'):'';

function freshMatch(){return{status:'setup',chooserSeat:null,choice:null,outcome:null,firstSeat:null,winnerSeat:null,turnOrder:null,coinPresented:[],startedAt:null,finishedAt:null,stageChangedAt:null,lastProgressAt:null,presentationGraceOpen:false,lastError:null}}
const room={players:new Map(),spectators:new Map(),authority:null,match:freshMatch(),ledger:new Map(),kickedClients:new Set(),createdAt:now()};

function playerBySeat(seat){return [...room.players.values()].find(p=>Number(p.seat)===Number(seat))||null}
function chooseSeat(){return !playerBySeat(1)?1:!playerBySeat(2)?2:null}
function sortedPlayers(){return [...room.players.values()].sort((a,b)=>Number(a.seat)-Number(b.seat))}
function publicPlayer(p){return{clientId:p.clientId,name:p.name,role:'player',seat:p.seat,connected:!!p.connected,rttMs:Number.isFinite(Number(p.rttMs))?Math.max(0,Math.round(Number(p.rttMs))):null,ready:!!p.ready,hasDeck:!!(p.deckKey||p.customDeck),deckKey:p.deckKey||null,deckName:p.deckName||null,formation:p.formation?clone(p.formation):null}}
function publicSpectator(p){return{clientId:p.clientId,name:p.name,role:'spectator',connected:!!p.connected}}
function connectionRows(){return sortedPlayers().map(p=>({seat:Number(p.seat),connected:!!p.connected,rttMs:Number.isFinite(Number(p.rttMs))?Math.max(0,Math.round(Number(p.rttMs))):null}))}
function bothPlayersPresent(){return !!playerBySeat(1)&&!!playerBySeat(2)}
function bothPlayersReady(){return bothPlayersPresent()&&sortedPlayers().every(p=>p.connected&&p.ready&&(p.deckKey||p.customDeck))}
function allPlayerSeatsAck(list){return [1,2].every(s=>list.includes(s))}
function selectionOf(p){return{name:p.name,deckKey:p.deckKey||null,customDeck:p.customDeck?clone(p.customDeck):null,formation:p.formation?clone(p.formation):null}}
function closeClientSocket(p,code=4000,reason='Reconnected elsewhere'){try{if(p?.ws?.readyState===WebSocket.OPEN)p.ws.close(code,reason)}catch{}}
function clearMatch(reason=''){room.authority=null;room.match=freshMatch();room.match.lastError=reason||null;room.ledger.clear();room.kickedClients.clear();for(const p of room.players.values())p.ready=false}
function abortPregame(reason){
  if(!['coin-flip','coin-result'].includes(room.match.status))return false;
  clearMatch(reason||'Coin Flip canceled.');
  for(const p of [...room.players.values(),...room.spectators.values()])send(p.ws,{type:'pregame-recovered',message:room.match.lastError,serverTime:now()});
  return true;
}

function viewFor(client){
  const local=client?{clientId:client.clientId,name:client.name,role:client.role,seat:client.seat||null,seatToken:client.role==='player'?client.seatToken:null,ready:!!client.ready,hasDeck:!!(client.deckKey||client.customDeck),deckKey:client.deckKey||null,deckName:client.deckName||null,customDeck:room.match.status==='setup'&&client.customDeck?clone(client.customDeck):null,formation:client.formation?clone(client.formation):null}:null;
  let board=null;
  if(room.authority&&['started','finished'].includes(room.match.status)){
    if(client?.role==='player'&&client.seat)board=room.authority.viewForSeat(client.seat);
    else board=room.authority.viewForSpectator();
  }
  const match={...clone(room.match),postMatchCleanupAt:room.match.status==='finished'&&room.match.finishedAt?new Date(Date.parse(room.match.finishedAt)+POST_MATCH_CLEANUP_MS).toISOString():null,revision:room.authority?.revision||0,canStartOpening:room.match.status==='coin-result'&&!!room.match.turnOrder&&(allPlayerSeatsAck(room.match.coinPresented||[])||room.match.presentationGraceOpen),board};
  return{type:'snapshot',version:VERSION,buildId:BUILD_ID,serverTime:now(),local,players:sortedPlayers().map(publicPlayer),spectators:[...room.spectators.values()].map(publicSpectator),match};
}
// Do not accumulate infinite per-player snapshots if a mobile socket stalls.
// Reconnect sends one fresh authoritative view; old queued views are obsolete.
function send(ws,payload){
  if(ws?.readyState!==WebSocket.OPEN)return false;
  if(Number(ws.bufferedAmount||0)>MAX_WS_BUFFERED_BYTES){
    ROOM_NETWORK_STATS.slowClientDisconnects++;
    try{ws.close(4008,'Slow connection; resynchronize')}catch{}
    return false;
  }
  try{ws.send(JSON.stringify(payload));return true}catch{return false}
}
function broadcast(exceptClient=null){for(const p of [...room.players.values(),...room.spectators.values()])if(p!==exceptClient&&p.connected&&p.ws)send(p.ws,viewFor(p))}
function fail(client,message,code='REQUEST_REJECTED'){send(client?.ws,{type:'error',code,message:String(message||'Request rejected.'),serverTime:now(),snapshot:viewFor(client)})}
function intentResult(client,{clientActionId='',ok=true,code=null,message='',appliedRevision=null,serverActionMs=null}={}){
  send(client?.ws,{type:'intent-result',clientActionId:String(clientActionId||''),ok:!!ok,code:code||null,message:String(message||''),revision:Number(room.authority?.revision||0),appliedRevision:appliedRevision==null?Number(room.authority?.revision||0):Number(appliedRevision),serverActionMs:Number.isFinite(serverActionMs)?Math.round(serverActionMs*10)/10:null,serverTime:now(),snapshot:viewFor(client)});
}

function validateFormation(deck,formation){
  if(!formation)return null;const lanes=['LEFT','CENTER','RIGHT'];const base=deck?.default_formation||{};
  const a=lanes.map(l=>String(base[l]||'')).sort(),b=lanes.map(l=>String(formation[l]||'')).sort();
  if(!a.every(Boolean)||!b.every(Boolean)||new Set(b).size!==3||a.join('|')!==b.join('|'))throw new Error('Formation must be a permutation of the selected deck Heroes.');
  return{LEFT:String(formation.LEFT),CENTER:String(formation.CENTER),RIGHT:String(formation.RIGHT)};
}
// Keep S1 room/ready lifecycle, but RC32 S0 owns coin UI, opening and battle.
function setupStarters(){return season0StarterCatalog}

function setDeckFast(client,msg){
  if(room.match.status!=='setup')throw new Error('Deck selection is locked after match start.');
  if(msg.customDeck){
    const raw=clone(msg.customDeck);const json=JSON.stringify(raw);if(json.length>800000)throw new Error('Imported deck is too large.');
    const input=raw?.deck&&typeof raw.deck==='object'?raw.deck:raw;
    const cards=[...(Array.isArray(input.main_deck)?input.main_deck:[]),...(Array.isArray(input.legacy_deck_expanded)?input.legacy_deck_expanded:[])];
    if(raw.season&&String(raw.season).toUpperCase()!=='S0')throw new Error('Only Season 0 decks may be imported.');
    if(!cards.length||cards.some(x=>x?.card_id&&!String(x.card_id).startsWith('S0-')))throw new Error('Only Season 0 card IDs are supported.');
    if(input.main_deck_count!=null&&Number(input.main_deck_count)!==50)throw new Error('Season 0 Main Deck must contain 50 cards.');
    client.customDeck=raw;client.deckKey=null;client.deckName=safeText(msg.deckName||raw.deck_name||'Imported Deck',100);
    client.formation=validateFormation(raw,msg.formation||raw.default_formation)||clone(raw.default_formation||null);
  }else{
    const key=safeText(msg.deckKey,120),opt=setupStarters()[key];if(!opt?.deck)throw new Error('Unknown starter deck.');
    client.deckKey=key;client.customDeck=null;client.deckName=opt.label||key;client.formation=validateFormation(opt.deck,msg.formation||opt.deck.default_formation)||clone(opt.deck.default_formation||null);
  }
  client.ready=false;
}

// S1 owns UI/room/ready lifecycle. RC32 S0 owns coin UI, opening
// cards/Mana and battle; no Season 1 card is ever used for an S0 match.
function season0DeckFor(player){
  const src=player.customDeck||setupStarters()?.[player.deckKey]?.deck;
  if(!src)throw new Error('Please select a Season 0 starter or import a Season 0 deck.');
  const deck=clone(src);
  deck.default_formation=validateFormation(deck,player.formation||deck.default_formation)||deck.default_formation;
  return deck;
}
class Season0BattleAuthority {
  constructor(){this.engine=new Season0HeadlessAuthority(path.join(PUBLIC,'battle'));this.safeRevision=-1;this.safeBoards=new Map()}
  static prepare(p1,p2){
    // Normalize and validate each selected deck only once. The authoritative
    // RC38 engine still does the complete deck-legality checks in start().
    const deck1=season0DeckFor(p1),deck2=season0DeckFor(p2);
    const a=new Season0BattleAuthority();
    a.deckHeroIds={1:['LEFT','CENTER','RIGHT'].map(k=>deck1.default_formation[k]),2:['LEFT','CENTER','RIGHT'].map(k=>deck2.default_formation[k])};
    a.engine.start({player1Deck:deck1,player2Deck:deck2,
      player1Name:p1.name,player2Name:p2.name});
    return a;
  }
  complete(firstSeat,face,winnerSeat,chosenOrder){
    this.engine.completeOpening(firstSeat,face,winnerSeat,chosenOrder);
  }
  get revision(){return this.engine.revision}
  get canonical(){return this.engine._canonicalForServerOnly()}
  canSeatAct(seat){return this.engine.canSeatAct(seat)}
  // Cache only recipient-safe state, never the full hidden canonical board.
  // A fresh cache is built on every gameplay revision. Spectator masking MUST
  // operate on a separate clone and cannot mutate the Player 1 cache.
  boardCache(){if(this.safeRevision!==this.revision){this.safeRevision=this.revision;this.safeBoards.clear()}return this.safeBoards}
  viewForSeat(seat){
    if(![1,2].includes(Number(seat)))throw new Error('Invalid viewer seat.');
    const cache=this.boardCache();if(cache.has(seat))return cache.get(seat);
    const safe=viewerSafeBoard(this.engine._viewForMaskingOnly(seat),{seat,revision:this.revision,secret:BLIND_SECRET});
    // Committed public battle events survive skipped intermediate Response
    // snapshots, including either player seat and reconnect. No private data.
    safe.appState.presentationEvents=[...(safe.appState.presentationEvents||[]),
      ...this.engine.combatPresentationForSeat(seat),
      ...this.engine.discardPresentationForSeat(seat)].slice(-120);
    assertViewerSafeBoard(safe);cache.set(seat,safe);return safe;
  }
  viewForSpectator(){
    const cache=this.boardCache();if(cache.has('spectator'))return cache.get('spectator');
    const safe=clone(this.viewForSeat(1)),st=safe.appState;
    // A spectator must not see EITHER player's unpublished hand or Mana.
    st.playerHand=Array.from({length:st.playerHandCount||st.playerHand?.length||0},()=> '__HIDDEN_CARD_BACK__');
    st.playerLegacy=Array.from({length:st.playerLegacyCount||st.playerLegacy?.length||0},()=> '__HIDDEN_CARD_BACK__');
    st.playerManaPoolCards=(st.playerManaPoolCards||[]).map((_,i)=>({uid:'SPECTATOR-SHARD-'+i,hidden:true,kind:'HIDDEN',class_name:'',owner_side:'PLAYER'}));
    delete st.playerLegacyPackageSlots;delete st.playerManaClasses;st.pending=st.pending?{type:st.pending.type,private_masked:true,decision_side:'UNKNOWN'}:null;
    if(st.lastDrawnCardBySide){st.lastDrawnCardBySide.PLAYER='__HIDDEN_CARD_BACK__';st.lastDrawnCardBySide.AI='__HIDDEN_CARD_BACK__';}
    // Presentation metadata must not reveal an unrevealed Draw to spectators.
    st.presentationEvents=(st.presentationEvents||[])
      .filter(ev=>ev?.type!=='MANA_LOSS_COMMITTED'&&ev?.type!=='PVP_OPPONENT_DISCARD')
      .map(ev=>ev&&ev.type==='CARD_DRAWN'?{...ev,card_id:'__HIDDEN_CARD_BACK__'}:ev);

    st.responseWindow=st.responseWindow?{kind:st.responseWindow.kind,private_masked:true}:null;
    assertViewerSafeBoard(safe);cache.set('spectator',safe);
    return safe;
  }
  applyIntent(seat,name,args=[]){
    // No direct unblinded numeric candidate indices via the network. The
    // only supported commit path is the revision-bound opaque handle packet.
    if(['selectOpponentManaChoice','commitOpponentManaSelection','commitExactOpponentManaSelectionIndices'].includes(name))
      throw new Error('Blind Mana choice must use the protected commit.');
    if(name==='commitExactOpponentManaSelection'){
      const payload=args?.[0];
      if(!payload||!Array.isArray(args)||args.length!==1||
          !Number.isInteger(payload.revision)||payload.revision!==this.revision)
        throw new Error('Stale blind Mana selection.');
      const local=this.engine._viewForMaskingOnly(seat).appState;
      const pending=local?.pending,choiceMap=makeBlindChoices(local,this.revision,BLIND_SECRET,seat);
      const handles=payload.handles,need=Math.min(Number(pending?.required_count||1),choiceMap.size);
      if(pending?.type!=='opponent_mana_selection'||pending.decision_side!=='PLAYER'||
          !Array.isArray(handles)||need<1||need>12||handles.length!==need||
          new Set(handles).size!==need||
          handles.some(h=>typeof h!=='string'||!choiceMap.has(h)))
        throw new Error('Invalid or expired blind Mana selection.');
      // Only server-owned opaque handles are accepted, never a physical UID.
      // The engine validates and commits the complete selection as ONE revision.
      const indices=handles.map(h=>choiceMap.get(h));
      return this.engine.applyIntent(seat,'commitExactOpponentManaSelectionIndices',[indices]);
    }
    if(name==='selectOpponentManaChoiceHandle'){
      const map=makeBlindChoices(this.engine._viewForMaskingOnly(seat).appState,this.revision,BLIND_SECRET,seat);
      const index=map.get(String(args?.[0]||''));
      if(!Number.isInteger(index)||Number(args?.[1])!==this.revision)throw new Error('Stale blind Mana choice.');
      return this.engine.applyIntent(seat,'selectOpponentManaChoice',[index]);
    }
    return this.engine.applyIntent(seat,name,args);
  }
  applyIntentBatch(seat,steps){return this.engine.applyIntentBatch(seat,steps);}
}
const BLIND_SECRET=randomBytes(32);
function startMatch(client){
  if(client.role!=='player'||client.seat!==1)throw new Error('Only Player 1 can start the match.');
  if(room.match.status!=='setup')throw new Error('Match already started.');
  if(!bothPlayersReady())throw new Error('Both players must be connected, have a deck, and be READY.');
  const p1=playerBySeat(1),p2=playerBySeat(2);
  // prepare() validates both decks and starts the isolated canonical RC38
  // authority BEFORE modifying the live room / Coin Flip status.
  const startTime=process.hrtime.bigint();
  const authority=Season0BattleAuthority.prepare(p1,p2);
  if(process.env.PVP_PERF_LOG==='1'){
    const elapsed=Number(process.hrtime.bigint()-startTime)/1e6;
    console.info('[PvP startup] prepare authority + two decks:',Math.round(elapsed*10)/10,'ms');
  }
  room.authority=authority;room.ledger.clear();
  room.match={...freshMatch(),status:'coin-flip',chooserSeat:2,startedAt:now(),stageChangedAt:now()};
}
function chooseCoin(client,msg){
  if(client.role!=='player'||client.seat!==room.match.chooserSeat)throw new Error('Only Player 2 chooses Heads or Tails.');
  const choice=String(msg.choice||'').toUpperCase();if(!['HEADS','TAILS'].includes(choice))throw new Error('Choose HEADS or TAILS.');
  // Duplicate/reconnected requests must never reroll the server outcome.
  if(room.match.status==='coin-result'&&room.match.choice===choice)return;
  if(room.match.status!=='coin-flip')throw new Error('Coin choice is not active.');
  const outcome=randomInt(2)===0?'HEADS':'TAILS';
  room.match.choice=choice;room.match.outcome=outcome;
  room.match.winnerSeat=choice===outcome?client.seat:(client.seat===1?2:1);
  room.match.turnOrder=null;room.match.firstSeat=null;room.match.status='coin-result';
  room.match.coinPresented=[];room.match.stageChangedAt=now();room.match.presentationGraceOpen=false;
}
function finalizeCoinIfReady(){
  if(room.match.status!=='coin-result'||!room.match.turnOrder||!room.match.firstSeat)return false;
  if(!sortedPlayers().every(p=>p.connected))return false;
  if(!allPlayerSeatsAck(room.match.coinPresented)&&!room.match.presentationGraceOpen)return false;
  room.authority.complete(room.match.firstSeat,room.match.outcome,room.match.winnerSeat,room.match.turnOrder);
  room.ledger.clear();room.match.status='started';room.match.stageChangedAt=now();room.match.lastProgressAt=Date.now();
  return true;
}
function coinPresented(client){
  if(client.role!=='player'||room.match.status!=='coin-result')return;
  if(!room.match.coinPresented.includes(client.seat))room.match.coinPresented.push(client.seat);
  // A winner may choose FIRST/SECOND before the other client finishes flipping.
  finalizeCoinIfReady();
}
function chooseTurnOrder(client,msg){
  if(room.match.status!=='coin-result')throw new Error('Coin result is not ready.');
  if(client.role!=='player'||client.seat!==room.match.winnerSeat)throw new Error('Only the Coin Flip winner chooses the turn order.');
  const order=String(msg.order||'').toUpperCase();
  if(order!=='FIRST'&&order!=='SECOND')throw new Error('Choose GO FIRST or GO SECOND.');
  if(room.match.turnOrder){if(room.match.turnOrder===order)return;throw new Error('Turn order already selected.');}
  room.match.turnOrder=order;
  room.match.firstSeat=order==='FIRST'?room.match.winnerSeat:(room.match.winnerSeat===1?2:1);
  finalizeCoinIfReady();
}
// Compatibility with earlier client tests only: no one can skip the winner's
// FIRST/SECOND choice. The result UI does NOT expose a Start Game button.
function confirmCoin(client){
  if(client.role!=='player')throw new Error('Spectators cannot start gameplay.');
  if(room.match.status!=='coin-result'||!room.match.turnOrder)throw new Error('Waiting for Coin Flip winner to choose GO FIRST or GO SECOND.');
  if(!finalizeCoinIfReady())throw new Error('Waiting for both players to finish Coin Flip presentation.');
}
function applyIntent(client,msg,batch=false){
  const actionStartedAt=process.hrtime.bigint();
  if(client.role!=='player')throw new Error('Spectators are read-only.');
  if(room.match.status!=='started')throw new Error('Gameplay is not ready.');
  const actionId=safeText(msg.clientActionId,160);
  if(actionId&&room.ledger.has(actionId)){
    const prior=room.ledger.get(actionId);if(prior?.clientId!==client.clientId)throw new Error('Duplicate action id belongs to another client.');
    intentResult(client,{clientActionId:actionId,ok:true,appliedRevision:Number(prior?.revision||room.authority.revision)});return;
  }
  // A verified player may concede even if an opponent decision advanced the
  // revision while the local tab was suspended or reconnecting.
  const isSurrender=!batch&&String(msg.intent)==='executeConfirmedSurrender';
  const base=Number(msg.baseRevision);if(!isSurrender&&base!==room.authority.revision)throw Object.assign(new Error('STALE_REVISION'),{code:'STALE_REVISION'});
  if(batch){
    const steps=Array.isArray(msg.steps)?msg.steps:[];if(steps.length!==2)throw new Error('Exactly two approved atomic steps are required.');
    room.authority.applyIntentBatch(client.seat,steps);
  }else{
    const name=safeText(msg.intent,100);if(!name)throw new Error('Intent name is required.');
    room.authority.applyIntent(client.seat,name,Array.isArray(msg.args)?msg.args:[]);
  }
  room.match.lastProgressAt=Date.now();
  if(room.authority.canonical?.appState?.gameOver){room.match.status='finished';room.match.finishedAt=now()}
  if(actionId){
    room.ledger.set(actionId,{revision:room.authority.revision,clientId:client.clientId,at:Date.now()});
    if(room.ledger.size>512){const first=room.ledger.keys().next().value;room.ledger.delete(first)}
    // Complete the originating browser action atomically: result + the exact viewer-safe
    // authoritative snapshot produced by that action. The normal room broadcast follows for
    // the opponent/spectators, but the sender never has to correlate a separate ACK and snapshot.
    intentResult(client,{clientActionId:actionId,ok:true,appliedRevision:room.authority.revision,serverActionMs:Number(process.hrtime.bigint()-actionStartedAt)/1e6});
  }
}
function resetRoom(client){
  if(client.role!=='player'||client.seat!==1)throw new Error('Only Player 1 can reset the room.');
  if(room.match.status==='setup'){clearMatch();return}
  if(abortPregame('Coin Flip canceled by Player 1.'))return;
  throw new Error('An active match cannot be reset.');
}
function returnToLobby(client){
  if(client.role!=='player')throw new Error('Only players can return the room to lobby.');
  if(abortPregame('Coin Flip canceled by a player.'))return;
  if(room.match.status!=='finished')throw new Error('Match is not finished.');
  clearMatch();
}
function kickSeat2(client){
  if(room.match.status!=='setup'||client.role!=='player'||client.seat!==1)throw new Error('Only Player 1 can kick Player 2 during setup.');
  const p=playerBySeat(2);if(!p)throw new Error('Player 2 seat is empty.');room.kickedClients.add(p.clientId);room.players.delete(p.clientId);room.spectators.delete(p.clientId);closeClientSocket(p,4002,'Removed by Player 1');p.role='spectator';delete p.seat;p.ready=false;p.connected=false;
}

function handle(client,msg){
  if(!msg||typeof msg!=='object')throw new Error('Invalid message.');
  if(String(msg.clientBuildId||'')!==BUILD_ID)throw Object.assign(new Error('CLIENT_BUILD_MISMATCH'),{code:'CLIENT_BUILD_MISMATCH'});
  if(!['ping','resync'].includes(String(msg.type||'')))client.lastActivityAt=Date.now();
  switch(msg.type){
    case 'activity': client.lastActivityAt=Date.now(); return false;
    case 'ping': {const reported=Number(msg.reportedRtt);if(msg.reportedRtt!=null&&Number.isFinite(reported)&&reported>=0&&reported<=60000)client.rttMs=Math.round(reported);client.lastSeenAt=Date.now();send(client.ws,{type:'pong',serverTime:now(),clientTime:Number(msg.clientTime)||0,connections:connectionRows()}); return false;}
    case 'resync': send(client.ws,{...viewFor(client),forceImport:true}); return false;
    case 'rename': client.lastActivityAt=Date.now(); if(room.match.status!=='setup')throw new Error('Name is locked after match start.'); client.name=safeText(msg.name,25)||client.name;client.ready=false;break;
    case 'switch-role':{
      if(room.match.status!=='setup')throw new Error('Role is locked after match start.');const role=safeRole(msg.role);if(role===client.role)break;
      if(role==='spectator'){if(client.role==='player')room.players.delete(client.clientId);client.role='spectator';delete client.seat;client.ready=false;room.spectators.set(client.clientId,client)}
      else{if(room.kickedClients.has(client.clientId))throw new Error('Player 2 was removed from this setup.');const seat=chooseSeat();if(!seat)throw new Error('Both player seats are occupied.');room.spectators.delete(client.clientId);client.role='player';client.seat=seat;client.ready=false;client.seatToken=token();client.seatTokenHash=tokenHash(client.seatToken);room.players.set(client.clientId,client)}
      break;
    }
    case 'set-deck': if(client.role!=='player')throw new Error('Spectators cannot choose a deck.');setDeckFast(client,msg);break;
    case 'ready': if(client.role!=='player')throw new Error('Spectators cannot ready.');if(room.match.status!=='setup')throw new Error('Ready state is locked.');if(!(client.deckKey||client.customDeck))throw new Error('Choose a deck first.');client.ready=!!msg.ready;break;
    case 'start-match': startMatch(client);break;
    case 'choose-coin-flip': chooseCoin(client,msg);break;
    case 'choose-turn-order': chooseTurnOrder(client,msg);break;
    case 'coin-presented': coinPresented(client);break;
    case 'confirm-coin-flip': confirmCoin(client);break;
    case 'runtime-intent': applyIntent(client,msg,false);break;
    case 'runtime-intent-batch': applyIntent(client,msg,true);break;
    case 'surrender-match': applyIntent(client,{...msg,intent:'executeConfirmedSurrender',args:[]},false);break;
    case 'kick-seat-2': kickSeat2(client);break;
    case 'reset-room': resetRoom(client);break;
    case 'return-to-lobby': returnToLobby(client);break;
    default: throw new Error('Unknown message type: '+safeText(msg.type,80));
  }
  return true;
}

function moveIdleLobbyPlayerToSpectator(p){
  if(!p||p.role!=='player')return false;
  room.players.delete(p.clientId);p.role='spectator';delete p.seat;p.ready=false;p.seatToken='';p.seatTokenHash='';room.spectators.set(p.clientId,p);
  send(p.ws,{type:'idle-timeout',scope:'lobby',message:'Moved to Spectator after 1 minute of inactivity.',serverTime:now()});
  return true;
}
function surrenderIdleMatchPlayer(p,reason){
  if(!p||p.role!=='player'||room.match.status!=='started'||!room.authority)return false;
  try{room.authority.applyIntent(p.seat,'executeConfirmedSurrender',[]);}catch(err){console.warn('[idle] surrender failed',err?.message||err);return false}
  room.match.status='finished';room.match.finishedAt=now();
  room.match.lastError=reason;
  send(p.ws,{type:'idle-timeout',scope:'match',message:reason,serverTime:now()});return true;
}
function enforceIdleTimeouts(){
  const t=Date.now();let changed=false;
  if(room.match.status==='setup'){
    for(const p of [...room.players.values()])if(t-Number(p.lastActivityAt||t)>=LOBBY_IDLE_MS)changed=moveIdleLobbyPlayerToSpectator(p)||changed;
  }else if(['coin-flip','coin-result'].includes(room.match.status)){
    const elapsed=t-Date.parse(room.match.stageChangedAt||room.match.startedAt||now());
    const disconnected=sortedPlayers().find(p=>!p.connected&&t-Number(p.disconnectedAt||t)>=COIN_DISCONNECT_GRACE_MS);
    const expired=room.match.status==='coin-flip'?elapsed>=COIN_CHOICE_TIMEOUT_MS:elapsed>=COIN_RESULT_TIMEOUT_MS;
    if(disconnected||expired){
      const reason=disconnected?'Coin Flip canceled: a player disconnected.':'Coin Flip timed out; both players may READY again.';
      changed=abortPregame(reason)||changed;
    }else if(room.match.status==='coin-result'&&!room.match.presentationGraceOpen&&elapsed>=COIN_ACK_GRACE_MS){
      // Client animation ACK is advisory after the grace window: the game state
      // cannot remain hostage to a browser timer that never fired.
      room.match.presentationGraceOpen=true;changed=true;
      if(room.match.turnOrder)finalizeCoinIfReady();
    }
  }else if(room.match.status==='finished'){
    // Server-owned post-match expiry: runs even when BOTH players close tabs.
    // Clear only the match; deck choices, formation and connected seats persist.
    const ended=Date.parse(room.match.finishedAt||'');
    if(Number.isFinite(ended)&&t-ended>=POST_MATCH_CLEANUP_MS){
      clearMatch();changed=true;
    }
  }else if(room.match.status==='started'&&!room.authority?.canonical?.appState?.gameOver){
    const active=sortedPlayers().filter(p=>room.authority.canSeatAct(p.seat));
    // A turn/Response owner gets a fresh decision interval when the opponent
    // finishes an action. Waiting players are not penalized for being idle.
    const timedOut=active.find(p=>{
      if(!p.connected)return t-Math.max(Number(p.disconnectedAt||t),Number(room.match.lastProgressAt||0))>=MATCH_DISCONNECT_GRACE_MS;
      return t-Math.max(Number(p.lastActivityAt||t),Number(room.match.lastProgressAt||0))>=MATCH_IDLE_MS;
    });
    if(timedOut){
      const reason=timedOut.connected?'Match surrendered after 10 minutes without activity while a decision was due.':'Match surrendered after the active player disconnected and the reconnect grace elapsed.';
      changed=surrenderIdleMatchPlayer(timedOut,reason)||changed;
    }
  }
  if(changed)broadcast();
}
setInterval(enforceIdleTimeouts,IDLE_SWEEP_MS).unref?.();

const server=http.createServer(async(req,res)=>{
  try{
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'allow':'GET, HEAD'});res.end('Method not allowed');return;}
    const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
    if(url.pathname==='/build-meta.js'){
      const js=`window.GL_PVP_BUILD_META=Object.freeze(${JSON.stringify({version:VERSION,versionLabel:BUILD_LABEL,buildId:BUILD_ID})});\n`;
      res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','content-length':Buffer.byteLength(js),'cache-control':'no-store'});
      res.end(js);return;
    }
    if(url.pathname==='/health'){
      res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      res.end(JSON.stringify({ok:true,version:VERSION,buildId:BUILD_ID,architecture:'s1-v38017-lite-lobby__s0-rc39-authority',transport:WS_BACKEND,authoritySources:{'engine/shared-app/app.bundle.js':AUTHORITY_BUNDLE_SHA256}}));return;
    }
    let rel=decodeURIComponent(url.pathname);if(rel==='/'||rel==='')rel='/index.html';if(rel==='/battle'||rel==='/battle/')rel='/battle/index.html';
    rel=path.posix.normalize(rel).replace(/^\.\.(\/|$)/g,'');const file=path.resolve(PUBLIC,'.'+rel);
    if(!file.startsWith(PUBLIC+path.sep)&&file!==PUBLIC){res.writeHead(403);res.end('Forbidden');return}
    // HTTP delivery is independent of gameplay authority. Keep the RC38 donor data intact.
    if(/\.(br|gz)$/.test(file)){res.writeHead(403);res.end('Forbidden');return;}
    const original=await stat(file);if(!original.isFile())throw new Error('not-file');
    const ext=path.extname(file).toLowerCase(),compressible=['.js','.mjs','.css','.html','.json','.svg'].includes(ext);
    const etag='"'+original.size.toString(16)+'-'+Math.round(original.mtimeMs).toString(16)+'"';
    const noCache=['.html','.js','.mjs','.css','.json'].includes(ext);
    // Versioned URLs can be cached through the lobby -> battlefield switch.
    // A new build ID changes every gameplay script URL, avoiding stale code.
    const fingerprinted=url.searchParams.get('v')===BUILD_ID&&['.js','.mjs','.css','.json'].includes(ext);
    const cacheControl=fingerprinted?'public, max-age=86400, immutable':
      noCache?'public, max-age=0, must-revalidate':'public, max-age=86400';
    const common={'content-type':mime[ext]||'application/octet-stream','cache-control':cacheControl,
      'etag':etag,'x-content-type-options':'nosniff','vary':'Accept-Encoding'};
    if(['.mp3','.wav'].includes(ext))common['accept-ranges']='bytes';
    if(req.headers['if-none-match']===etag){res.writeHead(304,common);res.end();return;}
    // Audio is browser-owned, not a gameplay-server workload. Honor HTTP byte
    // ranges so a seek/resume does not need another full music download.
    if(['.mp3','.wav'].includes(ext) && req.headers.range){
      const r=/^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range).trim());
      let begin=0,end=original.size-1,valid=!!r && !!(r[1]||r[2]);
      if(valid){
        if(!r[1]){const length=Number(r[2]);valid=Number.isSafeInteger(length)&&length>0;
          begin=Math.max(0,original.size-length);
        }else{begin=Number(r[1]);valid=Number.isSafeInteger(begin)&&begin>=0;
          if(r[2]){end=Number(r[2]);valid=valid&&Number.isSafeInteger(end);}
        }
        valid=valid && begin<original.size && end>=begin;
        end=Math.min(end,original.size-1);
      }
      if(!valid){res.writeHead(416,{...common,'content-range':`bytes */${original.size}`});res.end();return;}
      res.writeHead(206,{...common,'content-range':`bytes ${begin}-${end}/${original.size}`,'content-length':end-begin+1});
      if(req.method==='HEAD'){res.end();return;}
      const audio=createReadStream(file,{start:begin,end});audio.on('error',()=>res.destroy());audio.pipe(res);return;
    }
    let payload=file,encoding=null,info=original;
    if(compressible&&original.size>=1024){
      const accepted=String(req.headers['accept-encoding']||'');
      for(const [suffix,label] of [['.br','br'],['.gz','gzip']]){
        if(!new RegExp('(?:^|[,\\s])'+label+'(?:[,;\\s]|$)','i').test(accepted))continue;
        try{const candidate=await stat(file+suffix);if(candidate.isFile()&&candidate.size<info.size){payload=file+suffix;encoding=label;info=candidate;break;}}catch{}
      }
    }
    if(encoding)common['content-encoding']=encoding;
    res.writeHead(200,{...common,'content-length':info.size});
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(payload);stream.on('error',()=>res.destroy());stream.pipe(res);
  }catch{res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Not found')}
});
function allowedWsOrigin(req){
  const origin=String(req.headers.origin||'');if(!origin)return true;
  const allowlist=String(process.env.PVP_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
  try{
    const parsed=new URL(origin);
    return ['http:','https:'].includes(parsed.protocol)&&
      (allowlist.length?allowlist.includes(origin):parsed.host===String(req.headers.host||''));
  }catch{return false}
}
const wss=new WebSocketServer({server,path:'/ws',maxPayload:MAX_WS_PAYLOAD,perMessageDeflate:false,
  verifyClient:({req})=>allowedWsOrigin(req)});
wss.on('connection',(ws,req)=>{
  let client=null;
  try{
    const url=new URL(req.url||'/ws','http://localhost'),clientId=safeClient(url.searchParams.get('client')),name=safeText(url.searchParams.get('name')||'Player',25)||'Player',requested=safeRole(url.searchParams.get('role')),seatToken=url.searchParams.get('seatToken')||'',clientBuildId=String(url.searchParams.get('buildId')||'');
    if(clientBuildId!==BUILD_ID)throw Object.assign(new Error('CLIENT_BUILD_MISMATCH'),{code:'CLIENT_BUILD_MISMATCH'});
    const existing=room.players.get(clientId)||room.spectators.get(clientId);
    if(existing&&existing.role==='player'){
      if(!seatToken||existing.seatTokenHash!==tokenHash(seatToken))throw Object.assign(new Error('SEAT_TOKEN_MISMATCH'),{code:'SEAT_TOKEN_MISMATCH'});
      client=existing;closeClientSocket(client,4006,'Seat session replaced by another tab');client.ws=ws;client.connected=true;client.name=name;client.lastActivityAt=Date.now();client.disconnectedAt=null;
    }else if(existing&&existing.role==='spectator'){
      client=existing;closeClientSocket(client);client.ws=ws;client.connected=true;client.name=name;client.lastActivityAt=Date.now();client.disconnectedAt=null;
    }else if(requested==='player'&&!room.kickedClients.has(clientId)&&room.match.status==='setup'&&chooseSeat()){
      const seat=chooseSeat(),seatTokenNew=token();client={clientId,name,role:'player',seat,seatToken:seatTokenNew,seatTokenHash:tokenHash(seatTokenNew),ready:false,deckKey:null,customDeck:null,deckName:null,formation:null,connected:true,ws,lastActivityAt:Date.now()};room.players.set(clientId,client);
    }else{
      if(room.spectators.size>=MAX_SPECTATORS)throw new Error('Spectator capacity reached.');client={clientId,name,role:'spectator',ready:false,connected:true,ws,lastActivityAt:Date.now()};room.spectators.set(clientId,client);
    }
    send(ws,{...viewFor(client),forceImport:true});broadcast(client);
    ws.on('message',raw=>{let msg=null;try{msg=JSON.parse(String(raw));const changed=handle(client,msg);if(changed){const gameplay=['runtime-intent','runtime-intent-batch','surrender-match'].includes(String(msg?.type||''));broadcast(gameplay?client:null)}}catch(err){
      const code=err?.code||'REQUEST_REJECTED',actionId=safeText(msg?.clientActionId,160),isGameplay=!!actionId&&['runtime-intent','runtime-intent-batch','surrender-match'].includes(String(msg?.type||''));
      if(isGameplay)intentResult(client,{clientActionId:actionId,ok:false,code,message:String(err?.message||err),appliedRevision:room.authority?.revision||0});
      else fail(client,err?.message||err,code);
    }});
    ws.on('close',()=>{if(client&&client.ws===ws){client.connected=false;client.disconnectedAt=Date.now();client.ws=null;broadcast()}});
    ws.on('error',()=>{});
  }catch(err){const code=err?.code||'CONNECT_REJECTED';send(ws,{type:'error',code,message:String(err?.message||err)});const closeCode=code==='CLIENT_BUILD_MISMATCH'?4003:code==='SEAT_TOKEN_MISMATCH'?4004:4001;const reason=code==='CLIENT_BUILD_MISMATCH'?'Client build mismatch':code==='SEAT_TOKEN_MISMATCH'?'Seat token mismatch':'Connection rejected';try{ws.close(closeCode,reason)}catch{}}
});
server.listen(PORT,HOST,()=>console.log(`[Grandis Legacy PvP v${VERSION}] Listening on http://${HOST}:${PORT}`));
for (const signal of ['SIGTERM','SIGINT']) {
  process.once(signal, () => {
    console.log(`[shutdown] ${signal} received; closing PvP room.`);
    for (const p of [...room.players.values(),...room.spectators.values()]) closeClientSocket(p,1001,'Server restarting');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  });
}
