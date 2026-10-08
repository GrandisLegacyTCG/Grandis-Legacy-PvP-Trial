'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const {loadPvp}=require('./vm-pvp-harness.cjs');
const root=path.resolve(__dirname,'..');
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const pkg=JSON.parse(read('package.json'));
const app=read('public/js/app.bundle.js'),net=read('public/js/pvp-network.js'),css=read('public/css/app.css'),html=read('public/index.html'),server=read('server.js'),nav=read('public/js/mobile-app-nav.js');

assert.strictEqual(pkg.version,'3.0.42');
assert(html.includes('gl-pvp-3.42-responsive-ui'),'v3.32 cache marker missing');

// 1) Battle VFX/audio uses one exact server revision-scoped event path after render.
assert(net.includes('function battleFeedbackFromAuthoritativePlans(plans)'),'direct authoritative battle feedback mapper missing');
assert(net.includes('if(battleFeedback.length)playAuthoritativeBattleFeedbackAfterRender(battleFeedback)'),'server animation-event battle feedback is not played after render');
assert(net.includes('skipBattleFeedback:true'),'state-delta presentation must not duplicate authoritative battle feedback');
assert(!net.includes('freshAuthoritativeBattleFeedback'),'obsolete canonical feedback-ledger diff remains');
assert(net.includes("document.addEventListener('touchstart',requestGameplayAudioUnlock"),'mobile touch audio unlock missing');
assert(server.includes("clientAt: Number(msg.clientAt || 0) || null")&&server.includes('opponentLatencyMs:'),'ping RTT / opponent signal echo missing');
assert(net.includes("send('ping',{clientAt:now,latencyMs:state.latencyMs})"),'local RTT is not reported for opponent signal quality');

// 2) Battlefield names are wrapped and network can hard-sync them after every render.
assert(app.includes('data-pvp-identity-side="AI"')&&app.includes('pvp-player-display-name'),'battlefield identity markup missing');
assert(net.includes('function syncBattlefieldIdentityHeaders()'),'live identity DOM synchronizer missing');
assert(net.includes('syncBattlefieldIdentityHeaders();var m=match()'),'after-render identity synchronization missing');
const ctx=loadPvp(root),bridge=ctx.GL_LOCAL_AI_BRIDGE,keys=Object.keys(bridge.getStarterDeckOptions());
ctx.GL_PVP_LOCAL_NAME='JENOZ';ctx.GL_PVP_OPPONENT_NAME='BELEZE';ctx.GL_PVP_LOCAL_SIGNAL='good';ctx.GL_PVP_OPPONENT_SIGNAL='online';
bridge.startSharedMatch({playerDeckKey:keys[0],player2DeckKey:keys[1],player1Name:'STALE LOCAL',player2Name:'OPPONENT'});
const rendered=ctx.document.getElementById('app').innerHTML;
assert(rendered.includes('<b class="pvp-player-display-name">BELEZE</b>'),'remote live lobby name did not win during battlefield render');
assert(rendered.includes('<b class="pvp-player-display-name">JENOZ</b>'),'local live lobby name did not win during battlefield render');
assert(rendered.includes('data-pvp-signal-side="AI"')&&rendered.includes('data-pvp-signal-side="PLAYER"'),'connection signal markup missing from player headers');

// 3) Cross-app hamburger: exercise the actual runtime visibility function without booting network.
function cls(){const s=new Set();return{add(...a){a.forEach(x=>s.add(x));},remove(...a){a.forEach(x=>s.delete(x));},toggle(x,v){if(v===undefined){v=!s.has(x);}v?s.add(x):s.delete(x);return v;},contains(x){return s.has(x);}};}
function style(){const m={};return{setProperty(k,v,p){m[k]=String(v)+(p?' !'+p:'');},removeProperty(k){delete m[k];},get(k){return m[k]||'';},_m:m};}
function node(){return{hidden:false,style:style(),classList:cls(),attrs:{},remove(){this.hidden=true;},setAttribute(k,v){this.attrs[k]=String(v);},removeAttribute(k){delete this.attrs[k];},getAttribute(k){return this.attrs[k]??null;},querySelector(){return null;},querySelectorAll(){return[];},addEventListener(){},removeEventListener(){}};}
const button=node(),menu=node(),body=node(),doc={readyState:'loading',body,documentElement:node(),addEventListener(){},removeEventListener(){},getElementById(id){return id==='glMobileAppMenuButton'?button:id==='glMobileAppMenu'?menu:node();},querySelector(){return null;},querySelectorAll(){return[];},createElement(){return node();},activeElement:null};
const win={document:doc,GL_PVP_CONFIG:{},GL_CONFIG:{},GL_LOCAL_AI_BRIDGE:null,addEventListener(){},removeEventListener(){},localStorage:{getItem(){return null},setItem(){},removeItem(){}}};win.window=win;
const nctx={window:win,document:doc,console,setTimeout,clearTimeout,setInterval,clearInterval,URL,URLSearchParams,location:{href:'https://example.test/pvp/'},localStorage:win.localStorage,navigator:{},Math,Date,JSON,Number,isFinite,Array,Object,String,Boolean,RegExp};nctx.globalThis=nctx;
vm.createContext(nctx);vm.runInContext(net,nctx,{timeout:10000,filename:'pvp-network.js'});
assert.strictEqual(typeof win.GL_PVP_QA_SYNC_CROSS_APP_NAV,'function','QA nav hook missing');
win.GL_PVP_QA_SYNC_CROSS_APP_NAV(true);
assert.strictEqual(button.hidden,true,'hamburger is still visible after active-match sync');
assert.strictEqual(body.getAttribute('data-pvp-gameplay-active'),'1','active gameplay DOM state not stamped');
assert(css.includes('body.pvp-lobby-mode>.gl-mobile-app-menu-button{display:flex!important}'),'lobby-only mobile CSS rule missing');
assert(nav.includes("!document.body.classList.contains('pvp-lobby-mode')"),'hamburger open path ignores rendered lobby state');

// 4) Actual VS-AI-style renderer: paint all four requested battle assets and invoke all four audio files.
const createdImages=[],playedAudio=[],nodesById=new Map();
function classList(){const s=new Set();return{add(...a){a.forEach(x=>s.add(x));},remove(...a){a.forEach(x=>s.delete(x));},toggle(x,v){if(v===undefined)v=!s.has(x);v?s.add(x):s.delete(x);return v;},contains(x){return s.has(x);}};}
function domNode(tag='div'){
  const n={tagName:String(tag).toUpperCase(),style:{},classList:classList(),children:[],parentNode:null,attributes:{},complete:true,naturalWidth:100,offsetWidth:180,
    addEventListener(){},removeEventListener(){},setAttribute(k,v){this.attributes[k]=String(v);if(k==='id')nodesById.set(String(v),this);},removeAttribute(){},appendChild(ch){ch.parentNode=this;this.children.push(ch);if(ch.tagName==='IMG')createdImages.push(ch);return ch;},removeChild(ch){this.children=this.children.filter(x=>x!==ch);ch.parentNode=null;},querySelector(){return null;},querySelectorAll(){return[];},focus(){},scrollIntoView(){},click(){},decode(){return Promise.resolve();},getBoundingClientRect(){return{left:100,top:80,width:180,height:250,right:280,bottom:330};},get innerHTML(){return this._h||'';},set innerHTML(v){this._h=String(v);},get textContent(){return this._t||'';},set textContent(v){this._t=String(v);},disabled:false,value:'',checked:false,hidden:false,draggable:false};
  Object.defineProperty(n,'id',{get(){return this._id||'';},set(v){this._id=String(v);nodesById.set(this._id,this);}});return n;
}
class FakeAudio{constructor(src){this.src=src||'';this.preload='auto';this.volume=1;this.currentTime=0;this.muted=false;}load(){}cloneNode(){return new FakeAudio(this.src);}play(){playedAudio.push(this.src);return Promise.resolve();}pause(){}addEventListener(){}removeEventListener(){}}
const dbody=domNode('body'),dhead=domNode('head'),hero=domNode('img'),dummy=domNode('div');
const ddoc={readyState:'loading',body:dbody,head:dhead,addEventListener(){},removeEventListener(){},querySelectorAll(){return[];},querySelector(sel){return String(sel).includes('.hero-panel[data-side="AI"][data-lane="LEFT"]')?hero:null;},createElement(tag){return domNode(tag);},getElementById(id){return id==='glBattleFeedbackLayer'?(nodesById.get(id)||null):dummy;}};
const w={document:ddoc,GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,console};w.window=w;
const soundStorage={getItem(){return null},setItem(){},removeItem(){}};w.localStorage=soundStorage;
const actx={window:w,document:ddoc,console,setTimeout,clearTimeout,URL,CustomEvent:class{},localStorage:soundStorage,navigator:{},location:{href:'http://localhost/'},isFinite,Date,Math,Audio:FakeAudio};actx.globalThis=actx;w.globalThis=actx;w.Audio=FakeAudio;
vm.createContext(actx);for(const rel of ['public/js/static-data.js','public/js/runtime-authority.js','public/js/app.bundle.js'])vm.runInContext(read(rel),actx,{timeout:20000,filename:rel});
(async()=>{
  const b=w.GL_LOCAL_AI_BRIDGE;b.setRenderSuppressed(false);
  b.playAuthoritativeBattleFeedback({kind:'attack',side:'AI',lane:'LEFT',attack_kind:'P',outcome:'hit',has_damage:true,play_sound:true});
  b.playAuthoritativeBattleFeedback({kind:'attack',side:'AI',lane:'LEFT',attack_kind:'M',outcome:'hit',has_damage:true,play_sound:true});
  b.playAuthoritativeBattleFeedback({kind:'attack',side:'AI',lane:'LEFT',attack_kind:'P',defense_kind:'P',outcome:'block',has_damage:true,play_sound:true});
  b.playAuthoritativeBattleFeedback({kind:'attack',side:'AI',lane:'LEFT',attack_kind:'M',defense_kind:'M',outcome:'block',has_damage:true,play_sound:true});
  await new Promise(r=>setTimeout(r,900));
  const srcs=createdImages.map(x=>x.src).filter(Boolean);
  for(const src of ['assets/battle/P.Attack.png','assets/battle/M.Attack.png','assets/battle/P.Defense.png','assets/battle/M.Defense.png'])assert(srcs.includes(src),`missing VFX ${src}: ${JSON.stringify(srcs)}`);
  for(const src of ['assets/audio/battle/P.Atk.mp3','assets/audio/battle/M.Atk.mp3','assets/audio/battle/P.Def.mp3','assets/audio/battle/M.Def.mp3'])assert(playedAudio.includes(src),`missing audio playback ${src}: ${JSON.stringify(playedAudio)}`);
  console.log('PASS PvP v3.36 runtime parity: direct authoritative battle feedback, live room identity binding, external per-player signals, lobby-only mobile hamburger, and all four battle VFX/audio renderer paths.');
})().catch(err=>{console.error(err);process.exit(1);});
