import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { normalizeHeadlessRuntimeMetadata } from '../server/headless-runtime-compat.mjs';
const root=resolve(new URL('..',import.meta.url).pathname);
const pub=join(root,'public');
const code=[
  join(pub,'engine/js/static-data.js'),
  join(pub,'engine/js/runtime-authority.js'),
  join(pub,'engine/shared-app/active-starters.js'),
  join(pub,'engine/shared-app/app.bundle.js')
].map(f=>readFileSync(f,'utf8')).join('\n');
const dummy={style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},removeAttribute(){},querySelectorAll(){return[]},querySelector(){return null},closest(){return null},focus(){},scrollIntoView(){},click(){},getBoundingClientRect(){return{left:0,top:0,width:0,height:0,right:0,bottom:0}},disabled:false,value:'',checked:false,get innerHTML(){return this._h||''},set innerHTML(v){this._h=String(v??'')},get textContent(){return this._t||''},set textContent(v){this._t=String(v??'')}};
const doc={readyState:'loading',body:dummy,documentElement:dummy,addEventListener(){},removeEventListener(){},getElementById(){return dummy},querySelectorAll(){return[]},querySelector(){return null},createElement(){return {...dummy,style:{},classList:dummy.classList}},createDocumentFragment(){return dummy}};
const win={document:doc,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,requestAnimationFrame:(fn)=>setTimeout(fn,0),cancelAnimationFrame:clearTimeout,console,GL_PVP_SHARED_BOARD_ACTIVE:true,GL_APP_MODE:'PVP'};
const ctx={window:win,document:doc,console,setTimeout,clearTimeout,requestAnimationFrame:win.requestAnimationFrame,cancelAnimationFrame:clearTimeout,URL,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}},localStorage:{getItem(){return null},setItem(){},removeItem(){}},navigator:{},location:{href:'http://localhost/'},performance:{now:()=>0},Image:class{}};
ctx.globalThis=ctx;win.window=win;win.globalThis=ctx;vm.createContext(ctx);new vm.Script(code,{filename:'v680-runtime.js'}).runInContext(ctx,{timeout:5000});normalizeHeadlessRuntimeMetadata(win);
const b=win.GL_LOCAL_AI_BRIDGE;if(!b?.startSharedMatch||!b?.getCanonicalSnapshot||!b?.completeOpeningFlow) throw new Error('v6.80 PvP bridge unavailable');
b.setSharedBoardMode?.(true);b.setRenderSuppressed?.(true);
const start=b.startSharedMatch({player1Name:'Alice',player2Name:'Bob'});if(!start?.appState?.pvpHumanVsHuman) throw new Error('Human-vs-human flag was not enabled');
const opening=b.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'TAILS',firstSeat:1},{holdAtDraw:true,bridgeImmediate:false});
if(!opening?.snapshot?.appState) throw new Error('Opening flow did not produce a canonical snapshot');
const p1=b.getCanonicalSnapshot(1),p2=b.getCanonicalSnapshot(2);if(!p1?.appState||!p2?.appState) throw new Error('Seat-oriented canonical snapshots unavailable');
if((p1.appState.playerHand||[]).length<1||(p2.appState.playerHand||[]).length<1) throw new Error('Seat hand mirroring did not expose each player local hand');
console.log('v6.80 shared human-vs-human runtime bridge: PASS');
