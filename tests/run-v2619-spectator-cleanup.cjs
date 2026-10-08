'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function need(ok,msg){if(!ok)throw new Error(msg)}
const server=read('server.js'),net=read('public/js/pvp-network.js'),app=read('public/js/app.bundle.js'),html=read('public/index.html');
need(server.includes('Grandis Legacy PvP v3.42'),'server version missing');
need(html.includes('gl-pvp-3.42-responsive-ui'),'cache version missing');
need(server.includes('FINISHED MATCH STRICT CLEANUP')&&server.includes('room.players = new Map()')&&server.includes('delete c.seatTokenHash'),'strict finished cleanup missing');
need(server.includes('cleanupFinishedMatch(room);')&&server.indexOf('cleanupFinishedMatch(room);')<server.indexOf("const clientId = safeClient(url.searchParams.get('client'))"),'cleanup must happen before reconnect identity recovery');
need(server.includes('CANONICAL_ROOM_1_URL')&&server.includes('CANONICAL_ROOM_2_URL')&&!server.includes("const room1Url = process.env.GL_PVP_ROOM_1_URL"),'canonical room URL lock missing');
need(net.includes("label=back?'BACK TO LOBBY':'SURRENDER'")&&net.includes("if(localRole()==='spectator')return returnSpectatorToLobby()"),'spectator Back to Lobby behavior missing');
need(net.includes("me.role==='spectator'&&active&&!state.spectatorBattlefieldEntered"),'spectator must default to Room Select on active match');
need(net.includes('localStorage.removeItem(seatTokenStorageKey())'),'room-specific client stale seat token cleanup missing');
need(app.includes("if(id==='__HIDDEN_CARD_BACK__'||id==='__HIDDEN_CARD__')return'<article class=\"cardTile hand-card spectator-hand-back"),'bottom hidden Hand direct card-back renderer missing');
console.log('PASS PvP v3.29 spectator/cleanup/room-link hotfix');
