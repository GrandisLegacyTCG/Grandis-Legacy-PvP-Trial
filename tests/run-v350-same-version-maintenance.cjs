'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const ok=(v,m)=>{if(!v)throw new Error(m)};
const server=read('server.js'), net=read('public/js/pvp-network.js'), css=read('public/css/app.css');
const pkg=JSON.parse(read('package.json')), build=JSON.parse(read('public/PVP_FRONTEND_BUILD.json'));

ok(pkg.version==='3.0.51','semantic package version changed');
ok(build.pvp_version==='v3.51'&&build.package_version==='3.0.51','frontend semantic version changed');
ok(build.website_target_version==='v1.40','website target version changed');
ok(server.includes("const PLAYER1_SETUP_RECONNECT_GRACE_MS = Math.max(1000, Number(process.env.PVP_PLAYER1_SETUP_RECONNECT_GRACE_MS || 60 * 1000));"),'Player 1 60-second grace constant missing');
ok(server.includes("Number(client?.seat) === 1")&&server.includes("reason: 'Player 1 pre-match 60-second reconnect grace'"),'Player 1 pre-match disconnect policy missing');
ok(server.includes('expireDisconnectedPlayers(room, Date.now());'),'connection path does not synchronously reconcile expired reservations');
ok(server.includes("code: 'PLAYER1_RECONNECT_GRACE_EXPIRED'")&&server.includes("role: 'spectator'"),'late Player 1 reconnect Spectator fallback missing');
ok(server.includes("delete client.seatTokenHash")&&server.includes("client.role = 'spectator'"),'expired authority object is not invalidated');
ok(server.includes("Player 1 reconnect requires the current seat token."),'Seat 1 reconnect token guard missing');
ok(server.includes('requestWs && requestWs !== requester.ws'),'stale Seat 1 kick socket guard regressed');
ok(net.includes('aria-label="Kick Player 2"')&&net.includes('assets/lobby/exit.png'),'Kick exit.png markup missing');
ok(net.includes('grid-template-columns:minmax(0,1fr) auto auto'),'Seat row does not reserve a dedicated Kick icon column');
ok(css.includes('.pvp-seat-kick{position:static')&&css.includes('border-radius:50%'),'Kick icon still absolute/overlapping or not circular');
ok(!/v3\.52/.test(server+net+JSON.stringify(pkg)+JSON.stringify(build)),'unexpected post-v3.51 bump detected');

function extractFunction(name){
  const marker=`function ${name}(`, start=server.indexOf(marker); ok(start>=0,`missing ${name}`);
  const brace=server.indexOf('{',start); let depth=0,end=-1;
  for(let i=brace;i<server.length;i++){
    if(server[i]==='{')depth++;
    else if(server[i]==='}'&&--depth===0){end=i+1;break;}
  }
  ok(end>brace,`could not extract ${name}`); return server.slice(start,end);
}
const ctx={
  PLAYER1_SETUP_RECONNECT_GRACE_MS:60000,LOBBY_WITH_DECK_TIMEOUT_MS:300000,LOBBY_NO_DECK_TIMEOUT_MS:180000,MATCH_DISCONNECT_TIMEOUT_MS:300000,
  Date,Math,Number,String,Array,Map,Boolean,
  nowIso:()=>new Date(0).toISOString(), safeText:(v)=>String(v||''), tokenHash:(v)=>v?`hash:${v}`:'',
  publicSeatLabel:(s)=>`Player ${s}`, addLog:()=>{}, clearDisconnectReservation:(c)=>{c.offlineExpiresAt=null;c.offlineTimeoutReason=null;},
  matchIsActive:(room)=>['coin-flip','coin-result','started'].includes(room&&room.match&&room.match.status),
  clientHasLoadedDeck:(c)=>!!(c&&(c.deckKey||c.deckData))
};
vm.createContext(ctx);
for(const fn of ['disconnectPolicy','rememberExpiredSeat1Authority','expiredSeat1Authority','releaseTimedOutSeat']) vm.runInContext(extractFunction(fn),ctx);
let room={match:{status:'setup'},players:new Map(),expiredSeat1Authorities:[]};
let p1={clientId:'a',role:'player',seat:1,seatToken:'tok1',seatTokenHash:'hash:tok1',deckKey:'starter',ready:true,name:'Alice'};
let p2={clientId:'b',role:'player',seat:2,seatToken:'tok2',seatTokenHash:'hash:tok2',deckKey:'starter',ready:true,name:'Bob'};
room.players.set('a',p1);room.players.set('b',p2);
let pol1=ctx.disconnectPolicy(room,p1),pol2=ctx.disconnectPolicy(room,p2);
ok(pol1.timeoutMs===60000&&/60-second/.test(pol1.reason),'Player 1 grace is not exactly 60 seconds');
ok(pol2.timeoutMs===300000,'Player 2 pre-match policy should remain existing deck-loaded policy');
ctx.releaseTimedOutSeat(room,p1,pol1.reason);
ok(!room.players.has('a'),'expired Player 1 seat not released');
ok(p1.role==='spectator'&&!('seat' in p1)&&!('seatTokenHash' in p1),'stale Player 1 object retained authority');
ok(ctx.expiredSeat1Authority(room,'a','tok1'),'expired Player 1 authority tombstone not resolvable');
console.log(JSON.stringify({ok:true,semanticVersion:'v3.51',websiteVersion:'v1.40',player1GraceMs:pol1.timeoutMs,lateReconnect:'spectator',staleSeat1AuthorityInvalidated:true,kickIconLayout:'dedicated-grid-column'},null,2));
