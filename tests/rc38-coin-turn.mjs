/** The winner (either seat) chooses FIRST or SECOND without changing RC6 lobby transport. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {Season0HeadlessAuthority} from '../server/headless-rc32.mjs';
const root=join(process.cwd(),'public/battle');
for(const winnerSeat of [1,2])for(const order of ['FIRST','SECOND']){
 const firstSeat=order==='FIRST'?winnerSeat:(winnerSeat===1?2:1);
 const a=new Season0HeadlessAuthority(root);
 a.start({player1DeckKey:'s0_starter_01_red_white',player2DeckKey:'s0_starter_02_blue_red'});
 a.completeOpening(firstSeat,'HEADS',winnerSeat,order);
 const s=a._canonicalForServerOnly().appState;
 assert.equal(s.turn,firstSeat===1?'PLAYER':'AI');
 assert.equal(s.openingCoinFlip?.winner,winnerSeat===1?'PLAYER':'AI');
 assert.equal(s.openingCoinFlip?.chosenOrder,order);
 assert.equal(s.openingFlowCompleted,true);
 assert.equal(s.phase,'Deploy');
 assert.equal(a.canSeatAct(firstSeat),true);
 assert.equal(a.canSeatAct(firstSeat===1?2:1),false);
}
const source=readFileSync(new URL('../public/battle/shared-app/app-runtime.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/battle/shared-ui/battlefield-ui.css',import.meta.url),'utf8');
const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
const lobby=readFileSync(new URL('../public/pvp/pvp-host.js',import.meta.url),'utf8');
assert.match(source,/'You won the coin flip'/);
assert.match(source,/esc\(info\.winnerName\|\|'Opponent'\)\+' won the coin flip'/);
assert.match(source,/data-gl-coin-order="FIRST"/);
assert.match(source,/data-gl-coin-order="SECOND"/);
assert.match(source,/s0PvpCoinResult/);
assert.match(source,/aria-label=\"Coin flip\"/);
assert.doesNotMatch(source,/<h2 id=\"glCoinTitle\">Opening Coin Flip<\/h2>/);
assert.match(server,/case 'choose-turn-order': chooseTurnOrder/);
assert.match(lobby,/'choose-turn-order'/);
console.log('PASS RC38 Coin Flip winner picks FIRST/SECOND (both seats); no Opening Coin Flip title (VS AI parity); RC6 lobby unchanged');
