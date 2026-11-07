import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { season0StarterCatalog } from '../server/s0-pregame-catalog.mjs';
const ROOT=resolve(import.meta.dirname,'..');
const catalogKeys=Object.keys(season0StarterCatalog);
assert.equal(catalogKeys.length,5);
for(const key of catalogKeys){
 const d=season0StarterCatalog[key].deck;
 assert.ok(key.startsWith('s0_starter_'));
 assert.equal(d.main_deck_count,50);
 assert.equal(d.main_deck.reduce((a,c)=>a+c.quantity,0),50);
 assert.equal(d.legacy_deck_expanded.length,12);
 assert.equal(d.mana_deck_count,12);
 for(const id of Object.values(d.default_formation)){assert.ok(id.startsWith('S0-'));assert.ok(existsSync(resolve(ROOT,'public/battle/card-art',id+'.webp')),'Missing hero artwork '+id)}
 for(const entry of d.main_deck)assert.match(entry.card_id,/^S0-/);
}
const context={};context.window=context;
vm.runInNewContext(readFileSync(resolve(ROOT,'public/pvp/s0-lobby-catalog.js'),'utf8'),context);
assert.deepEqual(Object.keys(context.GL_S0_LOBBY_STARTERS),catalogKeys);
const cardctx={};cardctx.window=cardctx;
vm.runInNewContext(readFileSync(resolve(ROOT,'public/pvp/s0-lobby-card-definitions.js'),'utf8'),cardctx);
assert.ok(cardctx.GL_S0_LOBBY_CARD_DEFINITIONS.cards.every(x=>x.card_id.startsWith('S0-')));
const host=readFileSync(resolve(ROOT,'public/pvp/pvp-host.js'),'utf8');
assert.ok(host.includes('window.GL_S0_LOBBY_STARTERS||{}'));
assert.ok(host.includes('window.GL_S0_LOBBY_CARD_DEFINITIONS||{}'));
assert.ok(host.includes('battle/card-art/'));
assert.ok(!host.includes('function starters(){try{return bridge()?.getStarterDeckOptions'));
const port=38030+Math.floor(Math.random()*3000),base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PORT:String(port)},stdio:'ignore'});
const clients=[];
const delay=t=>new Promise(r=>setTimeout(r,t));
async function ready(){for(let i=0;i<200;i++){try{const r=await fetch(base+'/health');if(r.ok)return (await r.json()).buildId}catch{}await delay(40)}throw Error('Server not ready')}
function connect(name,build){return new Promise((done,fail)=>{
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws?'+new URLSearchParams({client:name,name,buildId:build,role:'player'}));
 const client={ws,snap:null,errors:[],send(type,data={}){ws.send(JSON.stringify({type,clientBuildId:build,...data}))},async wait(cb){for(let i=0;i<240;i++){if(cb(client))return client.snap;await delay(30)}throw Error('Timeout '+name+' '+JSON.stringify({status:client.snap?.match?.status,errors:client.errors}))}};
 ws.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.type==='snapshot')client.snap=msg;if(msg.snapshot)client.snap=msg.snapshot;if(msg.type==='error')client.errors.push(msg.message)};
 ws.onerror=fail;ws.onopen=()=>done(client);clients.push(client);
})}
try{
 const build=await ready();const a=await connect('s0-catalog-custom-1',build),b=await connect('s0-catalog-custom-2',build);
 await Promise.all([a.wait(x=>x.snap?.players?.length===2),b.wait(x=>x.snap?.players?.length===2)]);
 // Old Season 1 imported data must be rejected, not silently transformed.
 const season1={deck_name:'invalid-S1',main_deck_count:60,main_deck:[{card_id:'S1-WAR-001',quantity:60}],default_formation:{LEFT:'S1-WAR-H001',CENTER:'S1-MAG-H001',RIGHT:'S1-CLE-H001'}};
 b.send('set-deck',{customDeck:season1,deckName:'invalid-S1'});
 await b.wait(x=>x.errors.length>0);
 assert.match(b.errors.at(-1),/Season 0/);
 assert.ok(!b.snap.local.hasDeck);
 const deck=JSON.parse(readFileSync(resolve(ROOT,'public/battle/runtime/season0-authority/DeckBuilder-v1.58-Starter-01.json'),'utf8'));
 a.send('set-deck',{deckKey:'s0_starter_05_white_green'});
 b.send('set-deck',{customDeck:deck,deckName:'Imported Red-White Deck',formation:deck.default_formation});
 await Promise.all([a.wait(x=>x.snap?.local?.hasDeck),b.wait(x=>x.snap?.local?.hasDeck)]);
 assert.equal(a.snap.local.deckKey,'s0_starter_05_white_green');
 assert.equal(b.snap.local.deckName,'Imported Red-White Deck');
 a.send('ready',{ready:true});b.send('ready',{ready:true});await a.wait(x=>x.snap?.players?.every(p=>p.ready));
 a.send('start-match');await a.wait(x=>x.snap?.match?.status==='coin-flip');
 b.send('choose-coin-flip',{choice:'TAILS'});await a.wait(x=>x.snap?.match?.status==='coin-result');
 a.send('coin-presented');b.send('coin-presented');await a.wait(x=>x.snap?.match?.canStartOpening);
 a.send('confirm-coin-flip');await Promise.all([a.wait(x=>x.snap?.match?.status==='opening'),b.wait(x=>x.snap?.match?.status==='opening')]);
 const o=b.snap.match.opening;
 assert.deepEqual(o.heroIds, ['S0-WAR-H004','S0-WAR-H007','S0-CLE-H004']);
 assert.ok(b.snap.match.board.appState.playerHand.every(id=>id.startsWith('S0-')));
 assert.ok(a.snap.match.board.appState.aiHand.every(id=>id==='__HIDDEN_CARD_BACK__'));
 a.send('opening-presented');b.send('opening-presented');
 await Promise.all([a.wait(x=>x.snap?.match?.status==='started'),b.wait(x=>x.snap?.match?.status==='started')]);
 assert.equal(b.snap.match.board.appState.playerHeroes.LEFT.card_id,'S0-WAR-H004');
 console.log(JSON.stringify({ok:true,starterCatalog:5,sourceSeason:'S0',S0HeroArtPresent:true,S1ImportedRejected:true,S0DeckBuilderImport:true,S0OpeningBothPlayers:true,correctHeroesInBattle:true},null,2));
}finally{for(const c of clients)try{c.ws.close()}catch{}server.kill('SIGTERM')}
