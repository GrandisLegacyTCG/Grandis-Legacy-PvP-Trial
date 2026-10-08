import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const WebSocket=globalThis.WebSocket;
if(typeof WebSocket!=='function') throw new Error('Node WebSocket client unavailable; Node >=18 is required.');
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const HIDDEN='__HIDDEN_CARD_BACK__';
const port=39000+Math.floor(Math.random()*900);
const room='C2RC_'+Date.now().toString(36).toUpperCase();
const starter1='starter_01_elemental_lord_conqueror_renegade';
const starter2='starter_02_saint_crusader_grand_ranger';

function parseMessage(data){try{return JSON.parse(String(data));}catch{return null;}}
function makeClient(url,label){
  const ws=new WebSocket(url); const c={label,ws,snapshot:null,messages:[],notices:[],closed:null};
  let wake=[]; const notify=()=>{for(const f of wake.splice(0))f();};
  ws.addEventListener('message',(ev)=>{const m=parseMessage(ev.data);if(!m)return;c.messages.push(m);if(m.type==='snapshot')c.snapshot=m;else if(m.type==='notice'||m.type==='fatal')c.notices.push(m);notify();});
  ws.addEventListener('close',(ev)=>{c.closed={code:ev.code,reason:ev.reason};notify();});
  c.send=(type,payload={})=>ws.send(JSON.stringify({type,...payload}));
  c.wait=async(pred,label2='condition',ms=16000)=>{const end=Date.now()+ms;while(Date.now()<end){if(pred(c))return c.snapshot||c.messages.at(-1);await Promise.race([new Promise(r=>wake.push(r)),sleep(80)]);}throw new Error(`${c.label}: timeout waiting for ${label2}; notices=${JSON.stringify(c.notices.slice(-4))}; closed=${JSON.stringify(c.closed)}`);};
  c.waitSnapshot=(pred,label2='snapshot',ms=16000)=>c.wait(x=>x.snapshot&&pred(x.snapshot),label2,ms);
  c.waitNotice=(pred,label2='notice',ms=8000)=>c.wait(x=>x.notices.some(pred),label2,ms).then(()=>c.notices.find(pred));
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(`${label}: open timeout`)),8000);ws.addEventListener('open',()=>{clearTimeout(timer);resolve(c);},{once:true});ws.addEventListener('error',()=>{clearTimeout(timer);reject(new Error(`${label}: WebSocket open error`));},{once:true});});
}
function handSafety(app,ownSide='PLAYER'){
  const own=ownSide==='PLAYER'?app.playerHand:app.aiHand; const opp=ownSide==='PLAYER'?app.aiHand:app.playerHand;
  return {ownVisible:Array.isArray(own)&&own.length>0&&own.some(x=>x!==HIDDEN),oppHidden:Array.isArray(opp)&&opp.every(x=>x===HIDDEN)};
}
function spectatorSafe(app){return Array.isArray(app?.playerHand)&&Array.isArray(app?.aiHand)&&app.playerHand.every(x=>x===HIDDEN)&&app.aiHand.every(x=>x===HIDDEN);}
function assert(cond,msg){if(!cond)throw new Error(msg);}
function publicSeats(snap){return (snap.players||[]).filter(p=>p.role==='player').map(p=>[p.clientId,p.seat]).sort((a,b)=>a[1]-b[1]);}
function boardState(snap){return snap?.match?.serverBoard?.appState||null;}

const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port),HOST:'0.0.0.0',PVP_MATCH_DISCONNECT_TIMEOUT_MS:'20000'},stdio:['ignore','pipe','pipe']});
let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
const clients=[];
async function waitHealth(){for(let i=0;i<80;i++){if(child.exitCode!==null)throw new Error(`server exited ${child.exitCode}: ${stderr||stdout}`);try{const r=await fetch(`http://127.0.0.1:${port}/health`);if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`health timeout: ${stderr||stdout}`);}
async function closeClient(c){if(!c)return;try{c.ws.close(1000,'test close');}catch{}await sleep(80);}

try{
  const health=await waitHealth();
  assert(health.ok===true,'health not ok');
  assert(String(health.version||'').includes('PvP v3.43'),'unexpected version');
  const base=`ws://127.0.0.1:${port}/ws?room=${room}`;
  const A=await makeClient(`${base}&client=partca&name=Alice&role=player&deck=${starter1}`,'A');clients.push(A);
  await A.waitSnapshot(s=>s.local?.seat===1&&s.room?.id===room,'A creates room / seat 1');
  const B=await makeClient(`${base}&client=partcb&name=Bob&role=player&deck=${starter2}`,'B');clients.push(B);
  await A.waitSnapshot(s=>s.players?.length===2,'A sees two players');
  await B.waitSnapshot(s=>s.local?.seat===2&&s.players?.length===2,'B joins seat 2');
  assert(JSON.stringify(publicSeats(A.snapshot))===JSON.stringify([['partca',1],['partcb',2]]),'seat identity collision');
  const aToken=A.snapshot.local.seatToken; assert(aToken,'A seat token missing');
  A.send('ready',{ready:true});B.send('ready',{ready:true});
  await A.waitSnapshot(s=>s.players?.filter(p=>p.role==='player').every(p=>p.ready),'both ready');
  A.send('start-match',{seed:'candidate2rc-real-ws'});
  await B.waitSnapshot(s=>s.match?.status==='coin-flip','coin flip');
  B.send('choose-coin-flip',{choice:'HEADS'});
  await A.waitSnapshot(s=>s.match?.status==='coin-result','coin result');
  A.send('confirm-coin-flip');
  await A.waitSnapshot(s=>s.match?.status==='started'&&s.match?.serverBoard,'A match started');
  await B.waitSnapshot(s=>s.match?.status==='started'&&s.match?.serverBoard,'B match started');
  const aBoard=boardState(A.snapshot),bBoard=boardState(B.snapshot);
  assert(aBoard&&bBoard,'viewer boards missing');
  assert(aBoard.pvpPlayerNames?.PLAYER==='Alice'&&aBoard.pvpPlayerNames?.AI==='Bob','A viewer-relative orientation failed');
  assert(bBoard.pvpPlayerNames?.PLAYER==='Bob'&&bBoard.pvpPlayerNames?.AI==='Alice','B viewer-relative orientation failed');
  const ah=handSafety(aBoard),bh=handSafety(bBoard);assert(ah.ownVisible&&ah.oppHidden,'A hidden-info isolation failed');assert(bh.ownVisible&&bh.oppHidden,'B hidden-info isolation failed');
  const revisionBefore=A.snapshot.match.serverBoardRevision;

  // Real disconnect and reconnect cycle 1.
  A.ws.close(1000,'disconnect cycle 1');
  await B.waitSnapshot(s=>s.players?.find(p=>p.seat===1)?.connected===false,'B sees A disconnected');
  const A2=await makeClient(`${base}&client=partca&name=Alice&role=player&seatToken=${encodeURIComponent(aToken)}`,'A2');clients.push(A2);
  await A2.waitSnapshot(s=>s.local?.seat===1&&s.match?.status==='started'&&s.match?.serverBoardRevision>=revisionBefore,'A reconnect cycle 1');
  assert(boardState(A2.snapshot)?.pvpPlayerNames?.PLAYER==='Alice','A orientation flipped after reconnect');
  assert(handSafety(boardState(A2.snapshot)).oppHidden,'A reconnect leaked opponent hand');

  // Real disconnect and reconnect cycle 2.
  A2.ws.close(1000,'disconnect cycle 2');
  await B.waitSnapshot(s=>s.players?.find(p=>p.seat===1)?.connected===false,'B sees A disconnected cycle 2');
  const A3=await makeClient(`${base}&client=partca&name=Alice&role=player&seatToken=${encodeURIComponent(aToken)}`,'A3');clients.push(A3);
  await A3.waitSnapshot(s=>s.local?.seat===1&&s.match?.status==='started','A reconnect cycle 2');
  assert(publicSeats(A3.snapshot).length===2,'duplicate seat after second reconnect');

  // Duplicate socket replacement: new socket with same identity must replace stale socket.
  const A4=await makeClient(`${base}&client=partca&name=Alice&role=player&seatToken=${encodeURIComponent(aToken)}`,'A4');clients.push(A4);
  await A4.waitSnapshot(s=>s.local?.seat===1&&s.match?.status==='started','A duplicate replacement active');
  await A3.wait(x=>x.closed!==null,'old duplicate socket closed',8000);
  assert(A3.closed.code===4000||A3.closed.code===1000,'old duplicate socket not replaced cleanly');
  assert(publicSeats(A4.snapshot).length===2,'duplicate player record after socket replacement');

  // Real spectator, shared-board payload, no-authority, hidden information.
  const S=await makeClient(`${base}&client=partcs&name=Spectator&role=spectator`,'S');clients.push(S);
  await S.waitSnapshot(s=>s.local?.role==='spectator'&&s.match?.status==='started'&&s.match?.serverBoard,'spectator joined active match');
  assert(S.snapshot.local.seat===null,'spectator assigned a player seat');
  assert(spectatorSafe(boardState(S.snapshot)),'spectator hidden-info isolation failed');
  const seatsBeforeSpectator=JSON.stringify(publicSeats(S.snapshot));
  const revBeforeSpectator=S.snapshot.match.serverBoardRevision;
  S.send('runtime-intent',{intent:'advancePhase',args:[],baseRevision:revBeforeSpectator});
  await S.waitNotice(m=>m.type==='notice'&&m.kind==='error'&&/read-only/i.test(m.message||''),'spectator read-only rejection');
  assert(S.snapshot.match.serverBoardRevision===revBeforeSpectator,'spectator changed match state');
  assert(JSON.stringify(publicSeats(S.snapshot))===seatsBeforeSpectator,'spectator changed player seats');

  // Room full: a third requested player is explicitly routed to spectator by current protocol.
  const C=await makeClient(`${base}&client=partcc&name=Third&role=player`,'C');clients.push(C);
  await C.waitSnapshot(s=>s.local?.role==='spectator','third player routed to spectator');
  assert(JSON.stringify(publicSeats(C.snapshot))===seatsBeforeSpectator,'third player overwrote a seat');

  // Malformed/unauthorized message must be rejected safely.
  A4.send('candidate2rc-unknown-message',{x:1});
  await A4.waitNotice(m=>m.type==='notice'&&m.kind==='error'&&/Unknown message type/i.test(m.message||''),'malformed message rejection');
  assert(A4.snapshot.match?.status==='started','malformed message corrupted match');

  // Spectator disconnect/reconnect must not alter seats.
  S.ws.close(1000,'spectator cycle');await sleep(150);
  const S2=await makeClient(`${base}&client=partcs&name=Spectator&role=spectator`,'S2');clients.push(S2);
  await S2.waitSnapshot(s=>s.local?.role==='spectator'&&s.match?.status==='started','spectator reconnect');
  assert(JSON.stringify(publicSeats(S2.snapshot))===seatsBeforeSpectator,'spectator reconnect changed seats');
  assert(spectatorSafe(boardState(S2.snapshot)),'spectator reconnect leaked hidden info');

  // Invalid room IDs are rejected instead of silently mutating/creating a room.
  const bad=new WebSocket(`ws://127.0.0.1:${port}/ws?room=${encodeURIComponent('BAD ROOM!')}&client=badroom&name=Bad&role=player`);
  let badFatal=null,badClosed=false;
  bad.addEventListener('message',e=>{const m=parseMessage(e.data);if(m?.type==='fatal')badFatal=m;});
  bad.addEventListener('close',()=>{badClosed=true;});
  await new Promise((resolve,reject)=>{bad.addEventListener('open',resolve,{once:true});bad.addEventListener('error',()=>reject(new Error('invalid-room socket failed before protocol response')),{once:true});});
  for(let i=0;i<80&&!badFatal;i++)await sleep(50);
  assert(badFatal&&/Invalid room id/i.test(badFatal.message||''),'invalid room did not receive clean fatal error');
  for(let i=0;i<80&&!badClosed;i++)await sleep(25);
  assert(badClosed,'invalid room socket not closed');

  // Production frontend renderer ownership remains adapter -> shared renderer.
  const net=fs.readFileSync(path.join(root,'public/js/pvp-network.js'),'utf8');
  assert(net.includes('adapter.importViewerSafeSnapshot')&&!net.includes('b.importCanonicalSnapshot(m.serverBoard'),'network path bypasses PvP presentation adapter');
  const adapter=fs.readFileSync(path.join(root,'public/js/pvp-presentation-adapter.js'),'utf8');
  assert(adapter.includes('importViewerSafeSnapshot'),'presentation adapter missing');

  console.log(JSON.stringify({ok:true,node:process.version,serverCommand:'node server.js',port,host:'0.0.0.0',health:true,realWebSocket:true,roomCreate:true,roomJoin:true,readyStart:true,playerAOrientation:'SELF bottom/viewer PLAYER',playerBOrientation:'SELF bottom/viewer PLAYER',playerAHiddenInfo:true,playerBHiddenInfo:true,reconnectCycles:2,duplicateSocketOwnership:true,spectator:true,spectatorSharedBoardPayload:true,spectatorNonAuthority:true,spectatorHiddenInfo:true,invalidRoom:true,roomFull:'third player routed to spectator',malformedMessage:true,serverAuthority:true},null,2));
} catch(err){
  throw new Error(`${err.stack||err}\n--- server stdout ---\n${stdout}\n--- server stderr ---\n${stderr}`);
} finally {
  for(const c of clients) await closeClient(c);
  if(child.exitCode===null){child.kill('SIGTERM');for(let i=0;i<30&&child.exitCode===null;i++)await sleep(50);if(child.exitCode===null)child.kill('SIGKILL');}
}
