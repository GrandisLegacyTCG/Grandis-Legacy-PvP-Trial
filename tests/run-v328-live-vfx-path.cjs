'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const app=read('public/js/app.bundle.js');
const net=read('public/js/pvp-network.js');
const html=read('public/index.html');
const pkg=JSON.parse(read('package.json'));

assert.strictEqual(pkg.version,'3.0.42');
assert(html.includes('gl-pvp-3.42-responsive-ui'),'v3.34 cache marker missing');
assert(!app.includes('__gl_vfx_retry'),'obsolete VFX retry patch still exists');
assert(net.includes('function battleFeedbackFromAuthoritativePlans(plans)'),'authoritative animation-event battle feedback mapper is missing');
assert(net.includes('if(battleFeedback.length)playAuthoritativeBattleFeedbackAfterRender(battleFeedback)'),'post-render authoritative battle feedback is not enabled');
assert(net.includes('skipBattleFeedback:true'),'heuristic state-delta battle VFX is still active');
assert(!net.includes('freshAuthoritativeBattleFeedback'),'obsolete state-ledger battle-feedback diff still exists');

const createdImages=[];
const playedAudio=[];
const nodesById=new Map();
function makeClassList(){const s=new Set();return{add(...xs){xs.forEach(x=>s.add(x));},remove(...xs){xs.forEach(x=>s.delete(x));},toggle(x,v){if(v===undefined){if(s.has(x)){s.delete(x);return false;}s.add(x);return true;}v?s.add(x):s.delete(x);return !!v;},contains(x){return s.has(x);}};}
function makeNode(tag='div'){
  const node={tagName:String(tag).toUpperCase(),style:{},classList:makeClassList(),children:[],parentNode:null,attributes:{},complete:true,naturalWidth:100,
    addEventListener(){},removeEventListener(){},setAttribute(k,v){this.attributes[k]=String(v);if(k==='id')nodesById.set(String(v),this);},removeAttribute(){},
    appendChild(ch){ch.parentNode=this;this.children.push(ch);if(ch.tagName==='IMG')createdImages.push(ch);return ch;},removeChild(ch){this.children=this.children.filter(x=>x!==ch);ch.parentNode=null;},
    querySelector(){return null;},querySelectorAll(){return[];},focus(){},scrollIntoView(){},click(){},decode(){return Promise.resolve();},
    getBoundingClientRect(){return{left:100,top:80,width:180,height:250,right:280,bottom:330};},
    get innerHTML(){return this._h||'';},set innerHTML(v){this._h=String(v);},get textContent(){return this._t||'';},set textContent(v){this._t=String(v);},
    disabled:false,value:'',checked:false,hidden:false,draggable:false,offsetWidth:180
  };
  Object.defineProperty(node,'id',{get(){return this._id||'';},set(v){this._id=String(v);nodesById.set(this._id,this);}});
  return node;
}
class FakeAudio{constructor(src=''){this.src=src;this.volume=1;this.currentTime=0;this.muted=false;}load(){}cloneNode(){return new FakeAudio(this.src)}play(){playedAudio.push(this.src);return Promise.resolve()}pause(){}addEventListener(){}removeEventListener(){}}
const dummy=makeNode('div'), body=makeNode('body'), head=makeNode('head'), heroAnchor=makeNode('img');
const document={readyState:'loading',body,head,addEventListener(){},removeEventListener(){},getElementById(id){return id==='glBattleFeedbackLayer'?(nodesById.get(id)||null):dummy;},querySelectorAll(){return[];},
  querySelector(sel){if(String(sel).includes('.hero-panel[data-side="AI"][data-lane="LEFT"]'))return heroAnchor;return null;},createElement(tag){return makeNode(tag);}};
const storage={getItem(){return null},setItem(){},removeItem(){}};
const window={document,Audio:FakeAudio,localStorage:storage,GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,console};window.window=window;
const ctx={window,document,Audio:FakeAudio,console,setTimeout,clearTimeout,URL,CustomEvent:class{},localStorage:storage,navigator:{},location:{href:'http://localhost/'},isFinite,Date,Math};ctx.globalThis=ctx;window.globalThis=ctx;
vm.createContext(ctx);
for(const rel of ['public/js/static-data.js','public/js/runtime-authority.js','public/js/app.bundle.js'])vm.runInContext(read(rel),ctx,{timeout:20000,filename:rel});

(async()=>{
  const bridge=window.GL_LOCAL_AI_BRIDGE;
  assert(bridge&&bridge.playAuthoritativeBattleFeedback,'battle feedback bridge missing');
  bridge.setRenderSuppressed(false);
  const events=[
    {kind:'attack',side:'AI',lane:'LEFT',attack_kind:'P',outcome:'hit',has_damage:true,play_sound:true},
    {kind:'attack',side:'AI',lane:'LEFT',attack_kind:'M',outcome:'hit',has_damage:true,play_sound:true},
    {kind:'attack',side:'AI',lane:'LEFT',attack_kind:'P',defense_kind:'P',outcome:'block',has_damage:true,play_sound:true},
    {kind:'attack',side:'AI',lane:'LEFT',attack_kind:'M',defense_kind:'M',outcome:'block',has_damage:true,play_sound:true}
  ];
  for(const evt of events){
    assert.strictEqual(bridge.playAuthoritativeBattleFeedback(evt),true,'authoritative battle feedback did not queue: '+JSON.stringify(evt));
    await new Promise(r=>setTimeout(r,320));
  }
  const srcs=createdImages.map(x=>x.src).filter(Boolean);
  for(const expected of ['assets/battle/P.Attack.png','assets/battle/P.Defense.png','assets/battle/M.Attack.png','assets/battle/M.Defense.png'])
    assert(srcs.includes(expected),`${expected} VFX was not painted: ${JSON.stringify(srcs)}`);
  for(const expected of ['assets/audio/battle/P.Atk.mp3','assets/audio/battle/P.Def.mp3','assets/audio/battle/M.Atk.mp3','assets/audio/battle/M.Def.mp3'])
    assert(playedAudio.includes(expected),`${expected} audio was not played: ${JSON.stringify(playedAudio)}`);
  console.log('PASS PvP v3.36 clean VFX path: authoritative animation events paint and play P.Atk/M.Atk/P.Def/M.Def exactly through the VS AI presentation semantics, without retry/state-ledger patches.');
})().catch(err=>{console.error(err);process.exit(1);});
