'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..');
const ok=(v,m)=>{if(!v)throw new Error(m)};
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const net=read('public/js/pvp-network.js'),app=read('public/js/app.bundle.js'),css=read('public/css/app.css'),battle=read('public/css/battlefield-authority.css'),serverSrc=read('server.js');
ok(JSON.parse(read('package.json')).version==='3.0.51','v3.51 package version missing');
ok(fs.existsSync(path.join(root,'public/assets/lobby/swap.png')),'approved Lobby swap PNG missing');
ok(net.includes('assets/lobby/swap.png'),'Lobby formation does not use approved swap PNG');
ok(!app.includes('assets/lobby/swap.png'),'Swap PNG leaked into Battlefield runtime');

ok(serverSrc.includes('requestWs && requestWs !== requester.ws'),'stale Seat 1 socket identity guard missing');
ok(serverSrc.includes("case 'kick-seat-2': kickSeat2(room, client, ws); break;"),'Seat 1 kick route missing');
ok(css.includes('z-index:12051')&&css.includes('z-index:12050'),'mobile Lobby nav stacking fix missing');
ok(css.includes('grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)!important'),'Surrender 3-control layout fix missing');
ok(!css.includes('.hover-card-zoom.is-modal-zoom img{box-shadow:0 0 0 2px rgba(244,202,82,.72)!important;background:#02070b!important}'),'redundant modal preview ring remains');
ok(battle.includes('gl-lab-hand--opponent')&&battle.includes('border-width:0!important'),'opponent-hand gold perimeter owner missing');

// Verify the shared seat mirror now includes physical Shard collections.
const dummy={style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},setAttribute(){},removeAttribute(){},appendChild(){},querySelector(){return null},querySelectorAll(){return[]},focus(){},scrollIntoView(){},click(){},disabled:false,value:'',checked:false,hidden:false,get innerHTML(){return this._h||''},set innerHTML(v){this._h=String(v)},get textContent(){return this._t||''},set textContent(v){this._t=String(v)}};
const document={readyState:'loading',addEventListener(){},removeEventListener(){},getElementById(){return dummy},querySelectorAll(){return[]},querySelector(){return null},createElement(){return {...dummy,style:{},classList:dummy.classList}},body:dummy,head:dummy,documentElement:dummy};
const window={document,GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,console};window.window=window;
const ctx={window,document,console,setTimeout,clearTimeout,URL,CustomEvent:class{},localStorage:{getItem(){return null},setItem(){},removeItem(){}},navigator:{},location:{href:'http://localhost/'}};ctx.globalThis=ctx;window.globalThis=ctx;vm.createContext(ctx);
for(const rel of ['public/js/static-data.js','public/js/runtime-authority.js','public/js/pvp-presentation-adapter.js','public/js/app.bundle.js'])vm.runInContext(read(rel),ctx,{timeout:10000,filename:rel});
const bridge=window.GL_LOCAL_AI_BRIDGE;ok(bridge&&bridge.mirrorState,'shared bridge mirror unavailable');
const synthetic={mana:2,aiMana:5,manaRegen:1,aiManaRegen:3,playerManaPoolCards:[{uid:'P1',owner_side:'PLAYER'},{uid:'P2',owner_side:'PLAYER'}],aiManaPoolCards:[1,2,3,4,5].map(i=>({uid:'A'+i,owner_side:'AI'})),playerManaDeck:[{uid:'PD',owner_side:'PLAYER'}],aiManaDeck:[{uid:'AD1',owner_side:'AI'},{uid:'AD2',owner_side:'AI'}],playerManaClasses:['Warrior'],aiManaClasses:['Mage']};
const mirrored=bridge.mirrorState(synthetic);
ok(mirrored.mana===5&&mirrored.aiMana===2,'viewer Mana counts did not swap');
ok(mirrored.playerManaPoolCards.length===5&&mirrored.aiManaPoolCards.length===2,'physical Shard Pool did not swap');
ok(mirrored.playerManaDeck.length===2&&mirrored.aiManaDeck.length===1,'physical Shard Deck did not swap');
ok(mirrored.playerManaClasses[0]==='Mage'&&mirrored.aiManaClasses[0]==='Warrior','Shard class collection did not swap');

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const WebSocket=globalThis.WebSocket;
function parse(x){try{return JSON.parse(String(x))}catch{return null}}
function mk(url,label){return new Promise((resolve,reject)=>{const ws=new WebSocket(url),c={ws,label,snapshot:null,messages:[],notices:[],kicked:null,closed:null};let wakes=[];const notify=()=>wakes.splice(0).forEach(f=>f());ws.addEventListener('message',e=>{const m=parse(e.data);if(!m)return;c.messages.push(m);if(m.type==='snapshot')c.snapshot=m;if(m.type==='notice'||m.type==='fatal')c.notices.push(m);if(m.type==='seat-kicked')c.kicked=m;notify();});ws.addEventListener('close',e=>{c.closed={code:e.code,reason:e.reason};notify()});c.send=(type,p={})=>ws.send(JSON.stringify({type,...p}));c.wait=async(pred,name,ms=12000)=>{const end=Date.now()+ms;while(Date.now()<end){if(pred(c))return;await Promise.race([new Promise(r=>wakes.push(r)),sleep(60)]);}throw new Error(label+' timeout '+name+' notices='+JSON.stringify(c.notices.slice(-3)));};ws.addEventListener('open',()=>resolve(c),{once:true});ws.addEventListener('error',()=>reject(new Error(label+' open error')),{once:true});});}
(async()=>{
 const port=39700+Math.floor(Math.random()*200),room='V350_'+Date.now().toString(36).toUpperCase();
 const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',PVP_LOBBY_WITH_DECK_TIMEOUT_MS:'20000',PVP_LOBBY_NO_DECK_TIMEOUT_MS:'20000'},stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>err+=d);const cs=[];
 try{
  for(let i=0;i<100;i++){try{const r=await fetch(`http://127.0.0.1:${port}/health`);if(r.ok)break}catch{}await sleep(60);if(i===99)throw new Error('health timeout '+err+out)}
  const base=`ws://127.0.0.1:${port}/ws?room=${room}`,s1='starter_01_elemental_lord_conqueror_renegade',s2='starter_02_saint_crusader_grand_ranger';
  const A=await mk(`${base}&client=v350a&name=Alice&role=player&deck=${s1}`,'A');cs.push(A);await A.wait(c=>c.snapshot?.local?.seat===1,'seat1');
  const B=await mk(`${base}&client=v350b&name=Bob&role=player&deck=${s2}`,'B');cs.push(B);await B.wait(c=>c.snapshot?.local?.seat===2,'seat2');const oldBToken=B.snapshot.local.seatToken;ok(oldBToken,'Seat2 token missing');
  B.send('kick-seat-2');await B.wait(c=>c.notices.some(n=>n.kind==='error'&&/Only the current Player 1/i.test(n.message||'')),'seat2 kick rejected');
  A.send('kick-seat-2');await A.wait(c=>c.snapshot?.players?.length===1&&!c.snapshot.players.some(p=>Number(p.seat)===2),'seat2 removed');await B.wait(c=>!!c.kicked,'kicked feedback');
  const C=await mk(`${base}&client=v350c&name=Carol&role=player&deck=${s2}`,'C');cs.push(C);await C.wait(c=>c.snapshot?.local?.seat===2,'new player takes seat2');
  try{B.ws.close()}catch{} await sleep(80);
  const B2=await mk(`${base}&client=v350b2&name=Bob&role=player&seatToken=${encodeURIComponent(oldBToken)}`,'B2');cs.push(B2);await B2.wait(c=>c.snapshot?.local?.role==='spectator','old token cannot reclaim occupied seat2');
  A.send('ready',{ready:true});C.send('ready',{ready:true});await A.wait(c=>c.snapshot?.players?.length===2&&c.snapshot.players.every(p=>p.ready),'both ready');A.send('start-match',{seed:'v350-final'});await C.wait(c=>c.snapshot?.match?.status==='coin-flip','coin flip');C.send('choose-coin-flip',{choice:'HEADS'});await A.wait(c=>c.snapshot?.match?.status==='coin-result','coin result');A.send('confirm-coin-flip');await A.wait(c=>c.snapshot?.match?.status==='started','match start');await C.wait(c=>c.snapshot?.match?.status==='started','match start C');
  A.send('kick-seat-2');await A.wait(c=>c.notices.some(n=>n.kind==='error'&&/only be removed before the match starts/i.test(n.message||'')),'active match kick rejected');
  const a=A.snapshot.match.serverBoard.appState,c=C.snapshot.match.serverBoard.appState;
  ok(Array.isArray(a.playerManaPoolCards)&&a.playerManaPoolCards.some(x=>x&&!x.hidden),'Seat1 own physical Shards not visible');
  ok(Array.isArray(a.aiManaPoolCards)&&a.aiManaPoolCards.every(x=>x&&x.hidden&&!('uid'in x)&&!('kind'in x)&&!('class_name'in x)),'Seat1 received hidden identity for Seat2 pool');
  ok(Array.isArray(c.aiManaPoolCards)&&c.aiManaPoolCards.some(x=>x&&!x.hidden),'Seat2 own canonical pool not present in its viewer-safe payload');
  ok(Array.isArray(c.playerManaPoolCards)&&c.playerManaPoolCards.every(x=>x&&x.hidden&&!('uid'in x)&&!('kind'in x)&&!('class_name'in x)),'Seat2 received hidden identity for Seat1 pool');
  console.log(JSON.stringify({ok:true,version:'v3.51',seatKick:true,oldSeat2TokenInvalidated:true,newPlayerSeat2:true,activeMatchKickRejected:true,manaPerspectiveMirror:true,remoteShardIdentityHidden:true,lobbySwapPngOnly:true,cardPresentationCleanup:true},null,2));
 }catch(e){throw new Error((e.stack||e)+'\nSERVER OUT\n'+out+'\nSERVER ERR\n'+err)}finally{for(const c of cs){try{c.ws.close()}catch{}}if(child.exitCode===null)child.kill('SIGTERM')}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
