const fs=require('fs');
const server=fs.readFileSync('server.js','utf8'),net=fs.readFileSync('public/js/pvp-network.js','utf8'),app=fs.readFileSync('public/js/app.bundle.js','utf8'),css=fs.readFileSync('public/css/app.css','utf8'),html=fs.readFileSync('public/index.html','utf8');
function need(ok,msg){if(!ok)throw new Error(msg)}
need(server.includes('https://grandislegacytcg.github.io/pvp/'),'Public Room 1 URL stale');
need(server.includes('https://grandislegacytcg.github.io/pvp/?server=2'),'Public Room 2 URL stale');
need(app.includes('https://grandislegacytcg.github.io/Grandis-Legacy-Deck-Builder/style-1/'),'Deck Builder link not fixed');
need(app.includes("cardId==='__HIDDEN_CARD_BACK__'"),'Spectator hidden hand back guard missing');
need(net.includes('CHANGE NAME')&&net.includes('commitLobbyName'),'CHANGE NAME UX missing');
need(net.includes('spectatorLobbyView')&&net.includes('SPECTATE MATCH')&&net.includes('Back to Room Select'),'Spectator room-select UX missing');
need(server.includes('FINISHED_MATCH_CLEANUP_MS')&&server.includes('cleanupFinishedMatch'),'Finished match cleanup missing');
need(server.includes('bridgeSeat')&&server.includes('bridgeRevision'),'Runtime bridge import cache missing');
need(server.includes('broadcast(room, priorityBroadcastClient)'),'Acting-player priority broadcast missing');
need(!server.includes("url.pathname === '/metrics'")&&!server.includes('function metrics'),'Server tracker should remain skipped');
need(!html.includes('desktop-scale.js')&&css.includes('height:52px!important'),'Standard desktop/mobile phase polish missing');
need(app.includes("var blessingImmune=!!activeAttachmentForSide(state,targetSide,'S1-CLE-025')"),'Blessing any-damage attack guard missing');
console.log('PASS PvP v3.29 UI/performance/public-room locks');
