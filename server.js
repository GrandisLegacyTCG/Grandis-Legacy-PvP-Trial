import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomInt, createHash } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { V6914Authority, sourceHashes } from './server/v6914-authority.mjs';

const BASE=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC=path.join(BASE,'public');
const PORT=Number(process.env.PORT||3000);
const HOST=String(process.env.HOST||'0.0.0.0').trim()||'0.0.0.0';
const VERSION='3.80.1';
const BUILD_ID='gl-pvp-3.80.1-v6914-shell-reconnect-2026-10-11';
const MAX_SPECTATORS=4;
const MAX_WS_PAYLOAD=2*1024*1024;

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

function freshMatch(){return{status:'setup',chooserSeat:null,choice:null,outcome:null,firstSeat:null,coinPresented:[],openingPresented:[],startedAt:null,finishedAt:null,lastError:null}}
const room={players:new Map(),spectators:new Map(),authority:null,match:freshMatch(),ledger:new Map(),kickedClients:new Set(),createdAt:now()};

function playerBySeat(seat){return [...room.players.values()].find(p=>Number(p.seat)===Number(seat))||null}
function chooseSeat(){return !playerBySeat(1)?1:!playerBySeat(2)?2:null}
function sortedPlayers(){return [...room.players.values()].sort((a,b)=>Number(a.seat)-Number(b.seat))}
function publicPlayer(p){return{clientId:p.clientId,name:p.name,role:'player',seat:p.seat,connected:!!p.connected,ready:!!p.ready,hasDeck:!!(p.deckKey||p.customDeck),deckKey:p.deckKey||null,deckName:p.deckName||null,formation:p.formation?clone(p.formation):null}}
function publicSpectator(p){return{clientId:p.clientId,name:p.name,role:'spectator',connected:!!p.connected}}
function bothPlayersPresent(){return !!playerBySeat(1)&&!!playerBySeat(2)}
function bothPlayersReady(){return bothPlayersPresent()&&sortedPlayers().every(p=>p.connected&&p.ready&&(p.deckKey||p.customDeck))}
function allPlayerSeatsAck(list){return [1,2].every(s=>list.includes(s))}
function selectionOf(p){return{name:p.name,deckKey:p.deckKey||null,customDeck:p.customDeck?clone(p.customDeck):null,formation:p.formation?clone(p.formation):null}}
function closeClientSocket(p,code=4000,reason='Reconnected elsewhere'){try{if(p?.ws?.readyState===WebSocket.OPEN)p.ws.close(code,reason)}catch{}}
function clearMatch(){room.authority=null;room.match=freshMatch();room.ledger.clear();room.kickedClients.clear();for(const p of room.players.values())p.ready=false}

function viewFor(client){
  const local=client?{clientId:client.clientId,name:client.name,role:client.role,seat:client.seat||null,seatToken:client.role==='player'?client.seatToken:null,ready:!!client.ready,hasDeck:!!(client.deckKey||client.customDeck),deckKey:client.deckKey||null,deckName:client.deckName||null,customDeck:room.match.status==='setup'&&client.customDeck?clone(client.customDeck):null,formation:client.formation?clone(client.formation):null}:null;
  let board=null,opening=null;
  if(room.authority){
    if(client?.role==='player'&&client.seat){board=room.authority.viewForSeat(client.seat);opening=room.authority.openingForSeat(client.seat)}
    else board=room.authority.viewForSpectator();
  }
  const match={...clone(room.match),revision:room.authority?.revision||0,canStartOpening:room.match.status==='coin-result'&&allPlayerSeatsAck(room.match.coinPresented||[]),board,opening};
  return{type:'snapshot',version:VERSION,buildId:BUILD_ID,serverTime:now(),local,players:sortedPlayers().map(publicPlayer),spectators:[...room.spectators.values()].map(publicSpectator),match};
}
function send(ws,payload){if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(payload))}
function broadcast(){for(const p of [...room.players.values(),...room.spectators.values()])if(p.connected&&p.ws)send(p.ws,viewFor(p))}
function fail(client,message,code='REQUEST_REJECTED'){send(client?.ws,{type:'error',code,message:String(message||'Request rejected.'),serverTime:now(),snapshot:viewFor(client)})}

function validateFormation(deck,formation){
  if(!formation)return null;const lanes=['LEFT','CENTER','RIGHT'];const base=deck?.default_formation||{};
  const a=lanes.map(l=>String(base[l]||'')).sort(),b=lanes.map(l=>String(formation[l]||'')).sort();
  if(!a.every(Boolean)||!b.every(Boolean)||new Set(b).size!==3||a.join('|')!==b.join('|'))throw new Error('Formation must be a permutation of the selected deck Heroes.');
  return{LEFT:String(formation.LEFT),CENTER:String(formation.CENTER),RIGHT:String(formation.RIGHT)};
}
// One immutable setup authority only supplies the exact v6.91.4 starter catalog. Match authority is always new per match.
const setupAuthority=new V6914Authority();
function setupStarters(){return setupAuthority.starters}

function setDeckFast(client,msg){
  if(room.match.status!=='setup')throw new Error('Deck selection is locked after match start.');
  if(msg.customDeck){
    const raw=clone(msg.customDeck);const json=JSON.stringify(raw);if(json.length>800000)throw new Error('Imported deck is too large.');
    client.customDeck=raw;client.deckKey=null;client.deckName=safeText(msg.deckName||raw.deck_name||'Imported Deck',100);
    client.formation=validateFormation(raw,msg.formation||raw.default_formation)||clone(raw.default_formation||null);
  }else{
    const key=safeText(msg.deckKey,120),opt=setupStarters()[key];if(!opt?.deck)throw new Error('Unknown starter deck.');
    client.deckKey=key;client.customDeck=null;client.deckName=opt.label||key;client.formation=validateFormation(opt.deck,msg.formation||opt.deck.default_formation)||clone(opt.deck.default_formation||null);
  }
  client.ready=false;
}

function startMatch(client){
  if(client.role!=='player'||client.seat!==1)throw new Error('Only Player 1 can start the match.');
  if(room.match.status!=='setup')throw new Error('Match already started.');
  if(!bothPlayersReady())throw new Error('Both players must be connected, have a deck, and be READY.');
  const p1=playerBySeat(1),p2=playerBySeat(2),authority=new V6914Authority();
  authority.start({p1:selectionOf(p1),p2:selectionOf(p2)});
  room.authority=authority;room.ledger.clear();
  room.match={...freshMatch(),status:'coin-flip',chooserSeat:2,startedAt:now()};
}
function chooseCoin(client,msg){
  if(room.match.status!=='coin-flip')throw new Error('Coin choice is not active.');
  if(client.role!=='player'||client.seat!==room.match.chooserSeat)throw new Error('Only Player 2 chooses Heads or Tails.');
  const choice=String(msg.choice||'').toUpperCase();if(!['HEADS','TAILS'].includes(choice))throw new Error('Choose HEADS or TAILS.');
  const outcome=randomInt(2)===0?'HEADS':'TAILS';
  room.match.choice=choice;room.match.outcome=outcome;room.match.firstSeat=choice===outcome?client.seat:(client.seat===1?2:1);room.match.status='coin-result';room.match.coinPresented=[];
}
function coinPresented(client){
  if(client.role!=='player')return;if(room.match.status!=='coin-result')return;
  if(!room.match.coinPresented.includes(client.seat))room.match.coinPresented.push(client.seat);
}
function confirmCoin(client){
  if(client.role!=='player')throw new Error('Spectators cannot start gameplay.');
  if(room.match.status!=='coin-result')throw new Error('Coin result is not ready.');
  if(!allPlayerSeatsAck(room.match.coinPresented))throw new Error('Waiting for both players to finish the Coin Flip presentation.');
  const r=room.authority.commitOpening({choice:room.match.choice,outcome:room.match.outcome,firstSeat:room.match.firstSeat});
  if(!r?.board)throw new Error('Opening setup failed.');
  room.match.status='opening';room.match.openingPresented=[];
}
function openingPresented(client){
  if(client.role!=='player')return;if(room.match.status!=='opening')return;
  if(!room.match.openingPresented.includes(client.seat))room.match.openingPresented.push(client.seat);
  if(allPlayerSeatsAck(room.match.openingPresented)){
    room.authority.beginFirstTurn(room.match.firstSeat);room.match.status='started';
  }
}
function applyIntent(client,msg,batch=false){
  if(client.role!=='player')throw new Error('Spectators are read-only.');
  if(room.match.status!=='started')throw new Error('Gameplay is not ready.');
  const actionId=safeText(msg.clientActionId,160);
  if(actionId&&room.ledger.has(actionId)){
    const prior=room.ledger.get(actionId);if(prior?.clientId!==client.clientId)throw new Error('Duplicate action id belongs to another client.');
    send(client.ws,{type:'intent-ack',clientActionId:actionId,revision:Number(prior?.revision||room.authority.revision)});return;
  }
  const base=Number(msg.baseRevision);if(base!==room.authority.revision)throw Object.assign(new Error('STALE_REVISION'),{code:'STALE_REVISION'});
  if(batch){
    const steps=Array.isArray(msg.steps)?msg.steps.slice(0,8):[];if(!steps.length)throw new Error('Intent batch is empty.');
    room.authority.applyIntentBatch(client.seat,steps);
  }else{
    const name=safeText(msg.intent,100);if(!name)throw new Error('Intent name is required.');
    room.authority.applyIntent(client.seat,name,Array.isArray(msg.args)?msg.args:[]);
  }
  if(actionId){room.ledger.set(actionId,{revision:room.authority.revision,clientId:client.clientId,at:Date.now()});if(room.ledger.size>512){const first=room.ledger.keys().next().value;room.ledger.delete(first)}send(client.ws,{type:'intent-ack',clientActionId:actionId,revision:room.authority.revision})}
  if(room.authority.canonical?.appState?.gameOver){room.match.status='finished';room.match.finishedAt=now()}
}
function resetRoom(client){if(client.role!=='player'||client.seat!==1)throw new Error('Only Player 1 can reset the room.');if(room.match.status!=='setup')throw new Error('Room reset is only available during setup.');clearMatch()}
function returnToLobby(client){if(client.role!=='player')throw new Error('Only players can return the room to lobby.');if(room.match.status!=='finished')throw new Error('Match is not finished.');clearMatch()}
function kickSeat2(client){
  if(room.match.status!=='setup'||client.role!=='player'||client.seat!==1)throw new Error('Only Player 1 can kick Player 2 during setup.');
  const p=playerBySeat(2);if(!p)throw new Error('Player 2 seat is empty.');room.kickedClients.add(p.clientId);room.players.delete(p.clientId);room.spectators.delete(p.clientId);closeClientSocket(p,4002,'Removed by Player 1');p.role='spectator';delete p.seat;p.ready=false;p.connected=false;
}

function handle(client,msg){
  if(!msg||typeof msg!=='object')throw new Error('Invalid message.');
  if(String(msg.clientBuildId||'')!==BUILD_ID)throw Object.assign(new Error('CLIENT_BUILD_MISMATCH'),{code:'CLIENT_BUILD_MISMATCH'});
  switch(msg.type){
    case 'ping': send(client.ws,{type:'pong',serverTime:now()}); return false;
    case 'rename': if(room.match.status!=='setup')throw new Error('Name is locked after match start.'); client.name=safeText(msg.name,20)||client.name;client.ready=false;break;
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
    case 'coin-presented': coinPresented(client);break;
    case 'confirm-coin-flip': confirmCoin(client);break;
    case 'opening-presented': openingPresented(client);break;
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

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
    if(url.pathname==='/health'){
      res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      res.end(JSON.stringify({ok:true,version:VERSION,buildId:BUILD_ID,architecture:'v6.91.4-native-authority-handshake',authoritySources:sourceHashes()}));return;
    }
    let rel=decodeURIComponent(url.pathname);if(rel==='/'||rel==='')rel='/index.html';
    rel=path.posix.normalize(rel).replace(/^\.\.(\/|$)/g,'');const file=path.resolve(PUBLIC,'.'+rel);
    if(!file.startsWith(PUBLIC+path.sep)&&file!==PUBLIC){res.writeHead(403);res.end('Forbidden');return}
    const s=await stat(file);if(!s.isFile())throw new Error('not-file');const data=await readFile(file);const ext=path.extname(file).toLowerCase();
    const noStoreCode=ext==='.html'||ext==='.js'||ext==='.mjs';res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','content-length':data.length,'cache-control':noStoreCode?'no-store':'public, max-age=300'});res.end(data);
  }catch{res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Not found')}
});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:MAX_WS_PAYLOAD,perMessageDeflate:false});
wss.on('connection',(ws,req)=>{
  let client=null;
  try{
    const url=new URL(req.url||'/ws','http://localhost'),clientId=safeClient(url.searchParams.get('client')),name=safeText(url.searchParams.get('name')||'Player',20)||'Player',requested=safeRole(url.searchParams.get('role')),seatToken=url.searchParams.get('seatToken')||'',clientBuildId=String(url.searchParams.get('buildId')||'');
    if(clientBuildId!==BUILD_ID)throw Object.assign(new Error('CLIENT_BUILD_MISMATCH'),{code:'CLIENT_BUILD_MISMATCH'});
    const existing=room.players.get(clientId)||room.spectators.get(clientId);
    if(existing&&existing.role==='player'){
      if(!seatToken||existing.seatTokenHash!==tokenHash(seatToken))throw Object.assign(new Error('SEAT_TOKEN_MISMATCH'),{code:'SEAT_TOKEN_MISMATCH'});
      client=existing;closeClientSocket(client,4006,'Seat session replaced by another tab');client.ws=ws;client.connected=true;client.name=name;
    }else if(existing&&existing.role==='spectator'){
      client=existing;closeClientSocket(client);client.ws=ws;client.connected=true;client.name=name;
    }else if(requested==='player'&&!room.kickedClients.has(clientId)&&room.match.status==='setup'&&chooseSeat()){
      const seat=chooseSeat(),seatTokenNew=token();client={clientId,name,role:'player',seat,seatToken:seatTokenNew,seatTokenHash:tokenHash(seatTokenNew),ready:false,deckKey:null,customDeck:null,deckName:null,formation:null,connected:true,ws};room.players.set(clientId,client);
    }else{
      if(room.spectators.size>=MAX_SPECTATORS)throw new Error('Spectator capacity reached.');client={clientId,name,role:'spectator',ready:false,connected:true,ws};room.spectators.set(clientId,client);
    }
    send(ws,viewFor(client));broadcast();
    ws.on('message',raw=>{try{const msg=JSON.parse(String(raw));const changed=handle(client,msg);if(changed)broadcast()}catch(err){fail(client,err?.message||err,err?.code||'REQUEST_REJECTED')}});
    ws.on('close',()=>{if(client&&client.ws===ws){client.connected=false;client.ws=null;broadcast()}});
    ws.on('error',()=>{});
  }catch(err){const code=err?.code||'CONNECT_REJECTED';send(ws,{type:'error',code,message:String(err?.message||err)});const closeCode=code==='CLIENT_BUILD_MISMATCH'?4003:code==='SEAT_TOKEN_MISMATCH'?4004:4001;const reason=code==='CLIENT_BUILD_MISMATCH'?'Client build mismatch':code==='SEAT_TOKEN_MISMATCH'?'Seat token mismatch':'Connection rejected';try{ws.close(closeCode,reason)}catch{}}
});
server.listen(PORT,HOST,()=>console.log(`[Grandis Legacy PvP v${VERSION}] Listening on http://${HOST}:${PORT}`));
