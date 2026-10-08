'use strict';
const {spawn}=require('child_process'),path=require('path');const WebSocket=globalThis.WebSocket;if(typeof WebSocket!=='function')throw new Error('Node WebSocket client unavailable');
const root=path.resolve(__dirname,'..'),port=36500+Math.floor(Math.random()*1000),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const expected=['starter_01_elemental_lord_conqueror_renegade','starter_02_saint_crusader_grand_ranger','starter_03_arcane_duelist_elemental_lord_saint','starter_04_grand_ranger_grand_arbalest_renegade','starter_05_renegade_arcane_duelist_elemental_lord'];
function client(url){const ws=new WebSocket(url),s={ws,snapshot:null,notices:[]};ws.addEventListener('message',ev=>{let m;try{m=JSON.parse(String(ev.data))}catch{return}if(m.type==='snapshot')s.snapshot=m;else s.notices.push(m)});s.wait=async(pred,label)=>{for(let i=0;i<160;i++){if(s.snapshot&&pred(s.snapshot))return s.snapshot;await sleep(75)}throw new Error('timeout '+label+' '+JSON.stringify(s.notices.slice(-3)))};s.send=(type,payload={})=>ws.send(JSON.stringify({type,...payload}));return new Promise((r,j)=>{ws.addEventListener('open',()=>r(s),{once:true});ws.addEventListener('error',()=>j(new Error('ws error')),{once:true})})}
(async()=>{const proc=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});let err='';proc.stderr.on('data',d=>err+=d);const cs=[];try{await sleep(850);const base=`ws://127.0.0.1:${port}/ws?room=C1CURRENT`;
 const a=await client(`${base}&client=c1a&name=Alice&role=player&deck=${expected[2]}`);cs.push(a);const b=await client(`${base}&client=c1b&name=Bob&role=player&deck=${expected[3]}`);cs.push(b);
 const sa=await a.wait(x=>x.players?.length===2,'two players');const sb=await b.wait(x=>x.players?.length===2,'two players b');
 if(JSON.stringify((sa.deckOptions||[]).map(x=>x.key))!==JSON.stringify(expected))throw new Error('server deckOptions mismatch '+JSON.stringify(sa.deckOptions));
 if(sa.local.deckKey!==expected[2]||sb.local.deckKey!==expected[3])throw new Error('initial current Starter 3/4 mismatch');
 // Exercise current Starter 5 on the server/client path too, then switch back to Starter 3 for match start.
 a.send('set-deck',{deckKey:expected[4]});await a.wait(x=>x.local?.deckKey===expected[4],'starter 5 accepted');
 a.send('set-deck',{deckKey:expected[2]});await a.wait(x=>x.local?.deckKey===expected[2],'starter 3 restored');
 const opp=sa.players.find(p=>p.seat!==sa.local.seat);if(opp&&(opp.deckKey||opp.deckName||opp.deckSource))throw new Error('opponent deck identity leaked in lobby');
 a.send('ready',{ready:true});b.send('ready',{ready:true});await a.wait(x=>x.players?.every(p=>p.ready),'both ready');a.send('start-match',{seed:'candidate1-current-decks'});await b.wait(x=>x.match?.status==='coin-flip','current starter match coin flip');
 if(a.notices.some(n=>n.kind==='error')||b.notices.some(n=>n.kind==='error'))throw new Error('server notices '+JSON.stringify([a.notices,b.notices]));
 console.log(JSON.stringify({ok:true,serverDeckOptions:expected,starter3:true,starter4:true,starter5Accepted:true,matchStart:true,hiddenOpponentDeckIdentity:true},null,2));
 }catch(e){throw new Error((e.stack||e)+'\nserver stderr:\n'+err)}finally{for(const c of cs)try{c.ws.close()}catch{}proc.kill('SIGTERM');await sleep(200)}})().catch(e=>{console.error(e.stack||e);process.exit(1)});
