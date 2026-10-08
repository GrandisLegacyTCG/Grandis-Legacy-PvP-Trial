'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const {loadPvp}=require('./vm-pvp-harness.cjs');
const root=path.resolve(__dirname,'..');
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const app=read('public/js/app.bundle.js');
const net=read('public/js/pvp-network.js');
const html=read('public/index.html');
const pkg=JSON.parse(read('package.json'));

assert.strictEqual(pkg.version,'3.0.42');
assert(html.includes('gl-pvp-3.42-responsive-ui'),'v3.31 cache marker missing');
assert(net.includes('var explicit=cleanDisplayName(snap.displayNames')&&net.includes('window.GL_PVP_LOCAL_NAME=selfLabel();window.GL_PVP_OPPONENT_NAME=opponentLabel()'), 'server-explicit live room names are not authoritative in the network snapshot');
assert(app.includes('var liveName=side===\'PLAYER\''),'battlefield does not prioritize the live room name');
assert(app.includes('liveName||names[side]||fallback'),'stale canonical name can still override the live room name');

// Functional reproduction of the reported bug: canonical board still says OPPONENT,
// while the room snapshot already knows the remote player's actual lobby name.
const ctx=loadPvp(root);
const bridge=ctx.GL_LOCAL_AI_BRIDGE;
const keys=Object.keys(bridge.getStarterDeckOptions());
assert(keys.length>=2,'starter decks missing');
ctx.GL_PVP_LOCAL_NAME='JENOZ';
ctx.GL_PVP_OPPONENT_NAME='RIVAL NAME';
bridge.startSharedMatch({
  playerDeckKey:keys[0],
  player2DeckKey:keys[1],
  player1Name:'STALE LOCAL',
  player2Name:'OPPONENT'
});
const rendered=ctx.document.getElementById('app').innerHTML;
assert(rendered.includes('<b class="pvp-player-display-name">RIVAL NAME</b>'),'remote battlefield header did not use the live lobby/room name');
assert(rendered.includes('<b class="pvp-player-display-name">JENOZ</b>'),'local battlefield header did not use the live lobby/room name');
assert(!rendered.includes('<b class="pvp-player-display-name">OPPONENT</b>'),'stale OPPONENT label still wins over the live remote name');

console.log('PASS PvP v3.31 player-name binding: live room/lobby names override stale canonical OPPONENT/player labels for both battlefield headers.');
