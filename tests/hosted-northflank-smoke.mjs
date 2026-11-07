/**
 * Hosted transport acceptance for an already-running S0 PvP staging service.
 * Usage: PVP_PUBLIC_URL=https://<northflank-host> npm run test:hosted
 * Runs only in a random disposable room; performs no deployment or repository changes.
 * This is real HTTP(S) + WSS from Node, NOT a two-browser UI test.
 */
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

const supplied=process.env.PVP_PUBLIC_URL;
if(!supplied)throw Error('Set PVP_PUBLIC_URL to the staging service HTTPS URL. Refusing to guess a target.');
const base=new URL(supplied);
if(base.username||base.password||base.search||base.hash||base.pathname!=='/'||
   !['https:','http:'].includes(base.protocol))throw Error('PVP_PUBLIC_URL must be a bare HTTP(S) origin without path, query or credentials.');
if(base.protocol==='http:'&&!['127.0.0.1','localhost','[::1]'].includes(base.hostname))
  throw Error('External staging URL must use HTTPS / WSS.');
const wsurl=new URL('/ws',base);wsurl.protocol=base.protocol==='https:'?'wss:':'ws:';
const room='QA_'+randomBytes(10).toString('hex');
const check=async path=>{
  const response=await fetch(new URL(path,base),{signal:AbortSignal.timeout(15000),cache:'no-store'});
  assert.equal(response.status,200,`${path} returned ${response.status}`);
  return response;
};
const health=await (await check('/health')).json();
assert.equal(health.ok,true);
assert.match(health.build,/s0-rc32-pvp/);
assert.match(await (await check('/')).text(),/PvP Season 0/);
const appJs=await check('/runtime/pvp-network.js');
assert.match(await appJs.text(),/GL_S0_PVP_NETWORK/);
await check('/engine/shared-app/app.bundle.js');
console.log(`HOSTED HTTP PASS: ${base.origin} /health build=${health.build}, index and RC32 scripts`);

const watchers=[];
async function connect(label){
  const sock=new WebSocket(wsurl.href);
  const history=[];
  let connected=false;
  let closed=false;
  sock.addEventListener('message',e=>{try{history.push(JSON.parse(e.data))}catch{}});
  sock.addEventListener('close',()=>closed=true);
  await Promise.race([
    new Promise((resolve,reject)=>{sock.addEventListener('open',()=>{connected=true;resolve();},{once:true});sock.addEventListener('error',()=>reject(Error(`${label}: WebSocket refused`)),{once:true});}),
    delay(12000).then(()=>{if(!connected)throw Error(`${label}: WSS connection timed out`);})
  ]);
  const item={sock,history,label,send(type,payload={}){sock.send(JSON.stringify({type,...payload}));},
    async wait(predicate,from=0,timeoutMs=15000){const stop=Date.now()+timeoutMs;
      while(Date.now()<stop){const found=history.slice(from).find(predicate);if(found)return found;if(closed)throw Error(`${label}: connection closed unexpectedly`);await delay(25);}
      throw Error(`${label}: timed out waiting for message. Last: ${JSON.stringify(history.at(-1))?.slice(0,700)}`);
    },close(){try{sock.close()}catch{}}};
  watchers.push(item);return item;
}
try{
  const alice=await connect('seat 1'),bob=await connect('seat 2');
  alice.send('hello',{room,name:'Northflank QA Alice'});
  const a0=await alice.wait(x=>x.type==='snapshot'&&x.seat===1);
  bob.send('hello',{room,name:'Northflank QA Bob'});
  const b0=await bob.wait(x=>x.type==='snapshot'&&x.seat===2);
  assert.notEqual(a0.token,b0.token);
  alice.send('deck',{deckKey:a0.deckOptions[0]});
  bob.send('deck',{deckKey:b0.deckOptions[1]});
  await alice.wait(x=>x.type==='snapshot'&&x.players.every(p=>p.hasDeck));
  alice.send('ready',{ready:true});bob.send('ready',{ready:true});
  await alice.wait(x=>x.type==='snapshot'&&x.players.every(p=>p.ready));
  alice.send('start');await alice.wait(x=>x.type==='snapshot'&&x.status==='coin');
  bob.send('coin',{choice:'HEADS'});
  const game1=await alice.wait(x=>x.type==='snapshot'&&x.status==='playing');
  const game2=await bob.wait(x=>x.type==='snapshot'&&x.status==='playing');
  assert.equal(game1.revision,2);assert.equal(game2.revision,2);
  assert.equal(game1.board.pvpPrivateStateMasked,true);
  assert.ok(game1.board.appState.aiHand.every(x=>x==='__HIDDEN_CARD_BACK__'));
  assert.ok(game2.board.appState.aiHand.every(x=>x==='__HIDDEN_CARD_BACK__'));
  assert.ok(game1.board.appState.aiManaPoolCards.every(x=>x.hidden));
  assert.ok(game2.board.appState.aiManaPoolCards.every(x=>x.hidden));
  const player=game1.coin.firstSeat===1?alice:bob;
  const nonplayer=game1.coin.firstSeat===1?bob:alice;
  const startCount=nonplayer.history.length;
  nonplayer.send('intent',{intent:'advancePhase',args:[],baseRevision:2});
  await nonplayer.wait(x=>x.type==='error'&&/not your/i.test(x.message),startCount);
  const action=game1.coin.firstSeat===1?game1:game2;
  const intent=action.board.appState.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase';
  player.send('intent',{intent,args:[],baseRevision:2});
  const advanced=await player.wait(x=>x.type==='snapshot'&&x.revision===3);
  assert.equal(advanced.revision,3);
  // Drop one connection, reattach with its private token and verify the authoritative revision.
  bob.close();await delay(100);
  const resumed=await connect('reconnect seat 2');
  resumed.send('hello',{room,name:'QA Bob reconnected',token:b0.token});
  const snap=await resumed.wait(x=>x.type==='snapshot'&&x.seat===2);
  assert.equal(snap.revision,3);assert.equal(snap.token,b0.token);
  const from=alice.history.length;
  alice.send('intent',{intent:'executeConfirmedSurrender',args:[],baseRevision:3});
  const terminal=await alice.wait(x=>x.type==='snapshot'&&x.status==='finished',from);
  await resumed.wait(x=>x.type==='snapshot'&&x.status==='finished');
  assert.equal(terminal.board.appState.gameOver,true);
  console.log(`HOSTED WSS PASS: disposable room ${room}: 2 seats, private cards, ready, coin, rejection, turn, reconnect, surrender`);
  console.log('NOT VERIFIED by this script: native browser/phone UI, full card coverage, complete normal 3-Hero victory, restarts, load.');
}finally{for(const w of watchers)w.close();}
