import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const ROOT=resolve(import.meta.dirname,'..');
const port=35000+Math.floor(Math.random()*10000),base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
const clients=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function readyServer(){for(let i=0;i<200;i++){try{const r=await fetch(base+'/health');if(r.ok)return await r.json()}catch{}await delay(50)}throw Error('Server startup failed: '+logs)}
const BUILD='gl-s0-v38017-ui-rc32-data-2026-11-08';
function connect(id,role='player',seatToken=''){return new Promise((resolve,reject)=>{
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws?'+new URLSearchParams({client:id,name:id,role,buildId:BUILD,...(seatToken?{seatToken}:{})}));const c={ws,msg:[],snapshot:null,send(type,data={}){ws.send(JSON.stringify({type,clientBuildId:BUILD,...data}))},wait(predicate,timeout=45000){return new Promise((ok,bad)=>{const start=Date.now();const loop=()=>{if(predicate(c.snapshot,c))return ok(c.snapshot);if(Date.now()-start>timeout)return bad(Error('Timeout '+id+' '+JSON.stringify({status:c.snapshot?.match?.status,logs:logs.slice(-400)})));setTimeout(loop,50)};loop()})}};clients.push(c);
 ws.onmessage=e=>{const m=JSON.parse(e.data);c.msg.push(m);if(m.type==='snapshot')c.snapshot=m;if(m.snapshot?.type==='snapshot')c.snapshot=m.snapshot;if(m.type==='error')console.error('Server rejected:',id,m.message)};
 ws.onerror=reject;ws.onopen=()=>resolve(c);
})}
async function run(){
 const health=await readyServer();assert.match(health.architecture,/s1-v38017-ui__s0-rc32-decks-opening-battle/);
 const s1=readFileSync(ROOT+'/public/pvp/pvp-host.js','utf8');
 assert.ok(!s1.includes('ROOM CODE'));assert.ok(!s1.includes('JOIN ROOM'));
 const a=await connect('s1-to-s0-seat1');let b=await connect('s1-to-s0-seat2');
 await Promise.all([a.wait(s=>s?.players?.length===2),b.wait(s=>s?.players?.length===2)]);
 assert.equal(a.snapshot.local.seat,1);assert.equal(b.snapshot.local.seat,2);
 const s1key='s0_starter_01_red_white';
 const s1key2='s0_starter_02_blue_red';
 a.send('set-deck',{deckKey:s1key});b.send('set-deck',{deckKey:s1key2});
 await Promise.all([a.wait(s=>s?.local?.hasDeck),b.wait(s=>s?.local?.hasDeck)]);
 a.send('ready',{ready:true});b.send('ready',{ready:true});
 await Promise.all([a.wait(s=>s?.players?.every(p=>p.ready)),b.wait(s=>s?.players?.every(p=>p.ready))]);
 a.send('start-match');await Promise.all([a.wait(s=>s?.match?.status==='coin-flip'),b.wait(s=>s?.match?.status==='coin-flip')]);
 assert.equal(a.snapshot.match.chooserSeat,2);
 b.send('choose-coin-flip',{choice:'HEADS'});
 await Promise.all([a.wait(s=>s?.match?.status==='coin-result'),b.wait(s=>s?.match?.status==='coin-result')]);
 a.send('coin-presented');b.send('coin-presented');
 await Promise.all([a.wait(s=>s?.match?.canStartOpening),b.wait(s=>s?.match?.canStartOpening)]);
 a.send('confirm-coin-flip');
 await Promise.all([a.wait(s=>s?.match?.status==='opening'),b.wait(s=>s?.match?.status==='opening')]);
 assert.ok(a.snapshot.match.opening,'S0 opening presentation must exist');
 assert.ok(a.snapshot.match.opening.heroIds.every(id=>id.startsWith('S0-')),'S0 Hero preview must match S0 deck');
 assert.ok(a.snapshot.match.board?.appState?.playerHand?.some(x=>String(x).startsWith('S0-')),'S0 opening cards available before transition');
 a.send('opening-presented');b.send('opening-presented');
 await Promise.all([a.wait(s=>s?.match?.status==='started'),b.wait(s=>s?.match?.status==='started')]);
 for(const c of [a,b]){
   const snap=c.snapshot,board=snap.match.board;
   assert.ok(board?.pvpPrivateStateMasked);assert.equal(board.pvpRecipientSeat,snap.local.seat);
   assert.equal(board.appState.pvpHumanVsHuman,true);
   assert.ok(board.appState.playerHand?.some(x=>String(x).startsWith('S0-')),'S0 cards at game handoff');
   assert.ok(board.appState.aiHand.every(x=>x==='__HIDDEN_CARD_BACK__'),'opponent hand private');
 }
 const spectator=await connect('s1-to-s0-spectator','spectator');
 await spectator.wait(s=>s?.match?.status==='started');
 const sv=spectator.snapshot.match.board.appState;
 assert.ok(sv.playerHand.every(x=>x==='__HIDDEN_CARD_BACK__'),'spectator must not see player 1 hand');
 assert.ok(sv.aiHand.every(x=>x==='__HIDDEN_CARD_BACK__'),'spectator must not see player 2 hand');
 const sessionToken=b.snapshot.local.seatToken;
 assert.ok(sessionToken);
 b=await connect('s1-to-s0-seat2','player',sessionToken);
 await b.wait(s=>s?.match?.status==='started'&&s?.local?.seat===2);
 assert.ok(b.snapshot.match.board.pvpPrivateStateMasked,'reconnect safely restores seat 2 view');
 const before=a.snapshot.match.revision;
 const first=Number(a.snapshot.match.firstSeat),actor=first===1?a:b,other=first===1?b:a;
 other.send('runtime-intent',{intent:'advancePhase',args:[],baseRevision:before,clientActionId:'wrong-seat-check'});
 await other.wait((_s,c)=>c.msg.some(m=>m.type==='intent-result'&&m.clientActionId==='wrong-seat-check'&&!m.ok));
 assert.equal(a.snapshot.match.revision,before,'Wrong seat intent must not change revision');
 const active=actor.snapshot.match.board.appState;
 const intent=active.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase';
 actor.send('runtime-intent',{intent,args:[],baseRevision:before,clientActionId:'normal-s0-intent'});
 await Promise.all([a.wait(s=>s?.match?.revision===before+1),b.wait(s=>s?.match?.revision===before+1)]);
 const prior=a.snapshot.match.revision;
 a.send('runtime-intent',{intent:'executeConfirmedSurrender',args:[],baseRevision:prior,clientActionId:'test-surrender-1'});
 await Promise.all([a.wait(s=>s?.match?.status==='finished'),b.wait(s=>s?.match?.status==='finished')]);
 assert.ok(a.snapshot.match.board.appState.gameOver);
 console.log(JSON.stringify({ok:true,source:'PvP S1 3.80.17 through opening',target:'VS AI Season 0 RC32 after opening',beforeStatus:'opening',afterStatus:'started',seat1Masked:true,seat2Masked:true,revision:prior,terminal:'surrender',normalGameplayIntent: intent,wrongSeatRejected:true,spectatorPrivate:true,seat2Reconnect:true,lobbyUnmodifiedUntilHandoff:true},null,2));
}
try{await run()}finally{for(const c of clients)try{c.ws.close()}catch{};server.kill('SIGTERM')}
