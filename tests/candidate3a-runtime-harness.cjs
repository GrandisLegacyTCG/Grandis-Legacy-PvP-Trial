'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function dummyNode(){
  return {
    style:{},dataset:{},children:[],classList:{add(){},remove(){},toggle(){},contains(){return false}},
    addEventListener(){},removeEventListener(){},setAttribute(){},removeAttribute(){},appendChild(c){this.children.push(c);return c},
    querySelector(){return null},querySelectorAll(){return[]},closest(){return null},focus(){},scrollIntoView(){},click(){},
    disabled:false,value:'',checked:false,hidden:false,
    getBoundingClientRect(){return{x:0,y:0,left:0,top:0,right:100,bottom:140,width:100,height:140}},
    get innerHTML(){return this._h||''},set innerHTML(v){this._h=String(v)},get textContent(){return this._t||''},set textContent(v){this._t=String(v)}
  };
}

function loadCandidate3aRuntime(root){
  const dummy=dummyNode();
  const document={
    readyState:'loading',addEventListener(){},removeEventListener(){},getElementById(){return dummy},querySelectorAll(){return[]},querySelector(){return null},
    createElement(){return dummyNode()},body:dummy,head:dummy,documentElement:dummy
  };
  const window={document,GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,console};
  window.window=window;
  const ctx={window,document,console,setTimeout,clearTimeout,setInterval(){return 0},clearInterval(){},URL,
    CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}},
    localStorage:{getItem(){return null},setItem(){},removeItem(){}},navigator:{userAgent:'candidate3a-node'},location:{href:'http://localhost/'},
    performance:{now(){return 0}},requestAnimationFrame(fn){if(fn)fn(0);return 0},cancelAnimationFrame(){},getComputedStyle(){return{}},
    alert(){},confirm(){return true},Audio:function(){return{currentTime:0,volume:1,play(){return Promise.resolve()},pause(){}}}
  };
  ctx.globalThis=ctx; window.globalThis=ctx; vm.createContext(ctx);
  for(const rel of ['public/js/static-data.js','public/js/pvp-presentation-adapter.js','public/js/runtime-authority.js','public/js/app.bundle.js']){
    vm.runInContext(fs.readFileSync(path.join(root,rel),'utf8'),ctx,{timeout:15000,filename:rel});
  }
  const bridge=window.GL_LOCAL_AI_BRIDGE;
  if(!bridge?.startSharedMatch||!bridge?.applyServerIntent) throw new Error('Shared Candidate 15 gameplay bridge unavailable.');
  bridge.setSharedBoardMode(true); bridge.setRenderSuppressed(true);
  return {ctx,window,bridge,tutorial:window.GL_TUTORIAL_BRIDGE};
}

function deepClone(v){return JSON.parse(JSON.stringify(v));}
function genericShards(side,count){return Array.from({length:count},(_,i)=>({uid:`C3A:${side}:GEN:${i+1}`,kind:'GENERIC',class_name:'',owner_side:side,bottom_locked:false}));}
function setPlayerMana(state,count){state.playerManaPoolCards=genericShards('PLAYER',count);state.playerManaPool=count;state.mana=count;}

module.exports={loadCandidate3aRuntime,deepClone,genericShards,setPlayerMana};
