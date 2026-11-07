/** Grandis Legacy PvP Season 0 - RC32 authoritative multiplayer staging. */
import http from 'node:http';
import {stat,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join,extname,sep} from 'node:path';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {Season0HeadlessAuthority} from './server/headless-rc32.mjs';
import {viewerSafeBoard,assertViewerSafeBoard,makeBlindChoices} from './server/viewer-safe.mjs';
import {attachWebSocket} from './server/ws-lite.mjs';

const BASE=fileURLToPath(new URL('.',import.meta.url));
const ROOT=resolve(BASE,'client');
const HOST=process.env.HOST||'0.0.0.0';
const PORT=Number(process.env.PORT||3000);
const BUILD='s0-rc32-pvp-staging';
const LIMIT=Number(process.env.PVP_MAX_ROOMS||32);
const GRACE_MS=Math.max(1000,Number(process.env.PVP_RECONNECT_MS||300_000));
const ROOM_IDLE_MS=60*60*1000;
const LOBBY_IDLE_MS=Math.max(GRACE_MS,Number(process.env.PVP_LOBBY_IDLE_MS||300_000));
const secret=randomBytes(32);
const rooms=new Map();
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg','.ico':'image/x-icon'};
const token=()=>randomBytes(32).toString('hex');
const hash=t=>createHash('sha256').update(String(t)).digest();
const matchToken=(t,stored)=>Boolean(stored&&typeof t==='string'&&t.length===64&&timingSafeEqual(hash(t),stored));
const safeName=n=>String(n||'Player').replace(/[<>\x00-\x1f]/g,'').slice(0,45)||'Player';
function roomFor(id){
  if(!/^[a-zA-Z0-9_-]{3,32}$/.test(id))throw Error('Room code must contain 3-32 letters, numbers, _ or -.');
  let room=rooms.get(id);
  if(!room){if(rooms.size>=LIMIT)throw Error('Server has reached its room limit.');room={id,players:[null,null],game:null,status:'lobby',created:Date.now(),updated:Date.now(),coin:null};rooms.set(id,room)}
  return room;
}
const side=(seat)=>seat===2?'AI':'PLAYER';
function sent(client,msg){try{client?.send(msg);}catch{}}
function broadcast(room){for(const p of room.players)if(p?.ws)sent(p.ws,projection(room,p));}
function projection(room,p){
  const players=room.players.map((x,i)=>({seat:i+1,name:x?.name||`Player ${i+1}`,occupied:!!x,connected:!!x?.ws,ready:!!x?.ready,hasDeck:!!x?.deckKey}));
  const payload={type:'snapshot',build:BUILD,room:room.id,status:room.status,seat:p.seat,token:p.token,players,coin:room.coin,revision:room.game?.revision||0,deckOptions:room.game?.starterIds||p.availableDecks,myDeckKey:p.deckKey||null,board:null};
  if(room.game && ['playing','finished'].includes(room.status)){
    const view=room.game._viewForMaskingOnly(p.seat);
    payload.board=viewerSafeBoard(view,{seat:p.seat,revision:room.game.revision,secret});
    assertViewerSafeBoard(payload.board);
    if(payload.board.appState?.gameOver) payload.status='finished';
  }
  return payload;
}
function requireSeat(p){if(!p?.seat)throw Error('You have no player seat.');}
function checkMessageSize(obj){if(!obj||typeof obj!=='object'||Array.isArray(obj)||JSON.stringify(obj).length>100000)throw Error('Invalid request.');}
function changeRoom(room,p,msg){
  requireSeat(p);
  if(msg.type==='deck'){
    if(room.status!=='lobby')throw Error('Deck selection is locked.');
    if(typeof msg.deckKey!=='string'||!p.availableDecks.includes(msg.deckKey))throw Error('Unknown Season 0 starter deck.');
    p.deckKey=msg.deckKey;p.deckData=null;p.ready=false;return;
  }
  if(msg.type==='custom-deck'){
    if(room.status!=='lobby')throw Error('Deck selection is locked.');
    if(!msg.deck||typeof msg.deck!=='object'||Array.isArray(msg.deck)||JSON.stringify(msg.deck).length>90000)throw Error('Invalid custom Season 0 deck file.');
    const candidate=structuredClone(msg.deck);
    // Reuse actual RC32 validation rather than duplicating Deck Builder rules.
    const validator=new Season0HeadlessAuthority(ROOT);
    validator.start({player1Deck:candidate,player2DeckKey:validator.starterIds[0]});
    p.deckKey='CUSTOM';p.deckData=candidate;p.ready=false;return;
  }
  if(msg.type==='ready'){
    if(room.status!=='lobby')throw Error('Match already started.');
    if(!p.deckKey)throw Error('Select a deck first.');
    p.ready=msg.ready===true;return;
  }
  if(msg.type==='start'){
    if(p.seat!==1||room.status!=='lobby')throw Error('Only Player 1 can start from the lobby.');
    const [a,b]=room.players;
    if(!a?.ready||!b?.ready||!a.ws||!b.ws)throw Error('Both connected players must be Ready.');
    const game=new Season0HeadlessAuthority(ROOT);
    game.start({player1DeckKey:a.deckKey,player2DeckKey:b.deckKey,player1Deck:a.deckData||undefined,player2Deck:b.deckData||undefined,player1Name:a.name,player2Name:b.name});
    room.game=game;room.coin=null;room.status='coin';return;
  }
  if(msg.type==='coin'){
    if(p.seat!==2||room.status!=='coin')throw Error('Player 2 must choose the opening coin.');
    if(!['HEADS','TAILS'].includes(msg.choice))throw Error('Invalid coin choice.');
    const result=randomBytes(1)[0]%2===0?'HEADS':'TAILS';
    const firstSeat=msg.choice===result?2:1;
    room.game.completeOpening(firstSeat,result);
    room.coin={choice:msg.choice,outcome:result,firstSeat};room.status='playing';return;
  }
  if(msg.type==='intent'){
    if(room.status!=='playing'||!room.game)throw Error('No active game.');
    if(Number(msg.baseRevision)!==room.game.revision)throw Error(`Stale revision. Server is at ${room.game.revision}.`);
    let name=msg.intent,args=msg.args||[];
    if(name==='selectOpponentManaChoiceHandle'){
      const candidate=makeBlindChoices(room.game._viewForMaskingOnly(p.seat).appState,room.game.revision,secret,p.seat);
      const index=candidate.get(String(args[0]||''));
      if(!Number.isInteger(index)||Number(args[1])!==room.game.revision)throw Error('Stale blind Mana choice.');
      name='selectOpponentManaChoice';args=[index];
    }
    // Abort stale/malicious/wrong-seat requests before engine mutation.
    room.game.applyIntent(p.seat,name,args);
    if(room.game._canonicalForServerOnly().appState?.gameOver)room.status='finished';
    return;
  }
  if(msg.type==='reset'){
    if(p.seat!==1)throw Error('Only Player 1 can reset the room.');
    if(room.status==='playing')throw Error('Cannot reset an active match.');
    room.game=null;room.status='lobby';room.coin=null;
    room.players=room.players.map(pl=>pl?.tokenHash?pl:null);
    for(const pl of room.players)if(pl)pl.ready=false;
    return;
  }
  throw Error('Unsupported request type.');
}
const server=http.createServer(async(req,res)=>{
  try{
    const path=new URL(req.url,'http://localhost').pathname;
    if(path==='/health'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({ok:true,build:BUILD,rooms:rooms.size}));return;}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    let decoded=decodeURIComponent(path);
    if(decoded==='/'||decoded==='/pvp')decoded='/index.html';
    const target=resolve(ROOT,'.'+decoded);
    if(target!==ROOT&&!target.startsWith(ROOT+sep)){res.writeHead(403);res.end();return;}
    const info=await stat(target).catch(()=>null);
    if(!info?.isFile()){res.writeHead(404);res.end('Not found');return;}
    const bytes=await readFile(target);
    res.writeHead(200,{'content-type':MIME[extname(target).toLowerCase()]||'application/octet-stream','x-content-type-options':'nosniff','cache-control':'no-store','content-length':bytes.length});
    res.end(req.method==='HEAD'?undefined:bytes);
  }catch(err){res.writeHead(400);res.end('Bad request');}
});
attachWebSocket(server,(ws)=>{
  let player=null,room=null;
  ws.on('message',msg=>{
    try{
      checkMessageSize(msg);
      if(!player){
        if(msg.type!=='hello')throw Error('Send hello first.');
        const roomCode=String(msg.room||'');
        if(!/^[a-zA-Z0-9_-]{3,32}$/.test(roomCode))throw Error('Invalid room code.');
        const reconnect=String(msg.token||'');
        // Never allocate a room for an unknown reconnect token. Otherwise a
        // single invalid-token request can consume one of the bounded rooms.
        room=reconnect?rooms.get(roomCode):roomFor(roomCode);
        if(!room)throw Error('Unknown or expired reconnect token.');
        let found=room.players.find(p=>p&&matchToken(reconnect,p.tokenHash));
        if(found){if(found.ws&&found.ws!==ws)found.ws.close(4000,'Reconnected from another tab');found.ws=ws;found.name=safeName(msg.name||found.name);player=found;}
        else{
          if(reconnect)throw Error('Unknown or expired reconnect token.');
          if(room.status!=='lobby')throw Error('Active/finished room cannot be joined without a reconnect token.');
          const seatIndex=room.players.findIndex(p=>!p);
          if(seatIndex<0)throw Error('Room already has two players.');
          const t=token();player={seat:seatIndex+1,token:t,tokenHash:hash(t),name:safeName(msg.name||`Player ${seatIndex+1}`),ws,deckKey:null,ready:false,offlineAt:null};
          room.players[seatIndex]=player;
        }
        player.availableDecks=['s0_starter_01_red_white','s0_starter_02_blue_red','s0_starter_03_yellow_blue','s0_starter_04_green_yellow','s0_starter_05_white_green'];
        player.offlineAt=null;room.updated=Date.now();broadcast(room);return;
      }
      if(player.ws!==ws)throw Error('Old connection no longer has seat authority.');
      if(msg.type==='ping'){sent(ws,{type:'pong',at:Date.now()});return;}
      changeRoom(room,player,msg);room.updated=Date.now();broadcast(room);
    }catch(err){sent(ws,{type:'error',message:String(err.message||err).slice(0,250),revision:room?.game?.revision});if(room&&player?.ws===ws)sent(ws,projection(room,player));}
  });
  ws.on('close',()=>{if(!room||!player||player.ws!==ws)return;player.ws=null;player.offlineAt=Date.now();room.updated=Date.now();broadcast(room);});
});
setInterval(()=>{
  const now=Date.now();
  for(const [id,room] of rooms){
    for(let i=0;i<2;i++){
      const p=room.players[i];
      if(p&&!p.ws&&p.offlineAt&&now-p.offlineAt>GRACE_MS){
        if(room.game && room.status==='playing'){
          try{room.game.forfeit(i+1);room.status='finished';}catch(err){console.warn('Disconnected seat forfeit failed:',err.message);}
        }
        if(room.status==='lobby')room.players[i]=null;
        else{p.offlineAt=null;p.tokenHash=null;p.token=null;} // invalidate old authority, never expose Hand to a replacement

      }
    }
    // Finished/expired seats remain as audit placeholders, so an offline room
    // must be reaped by connected presence rather than empty seat objects.
    const idleLimit=room.status==='lobby'?LOBBY_IDLE_MS:ROOM_IDLE_MS;
    if(room.players.every(x=>!x?.ws)&&now-room.updated>idleLimit)rooms.delete(id);
  }
},5000).unref();
if(process.env.NODE_ENV!=='test')server.listen(PORT,HOST,()=>console.log(`Grandis S0 PvP staged server http://${HOST}:${PORT} [${BUILD}]`));
export {server,rooms,projection,changeRoom};
