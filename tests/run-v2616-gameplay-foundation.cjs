'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
function dummy(){return{style:{},dataset:{},children:[],parentElement:null,classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},setAttribute(){},removeAttribute(){},getAttribute(){return null},appendChild(child){this.children.push(child);return child},querySelector(){return dummy()},querySelectorAll(){return[]},closest(){return null},focus(){},scrollIntoView(){},click(){},disabled:false,value:'',checked:false,hidden:false,innerHTML:'',textContent:'',getBoundingClientRect(){return{x:0,y:0,left:0,top:0,right:100,bottom:140,width:100,height:140}}};}
const d=dummy();
const document={readyState:'loading',addEventListener(){},removeEventListener(){},getElementById(){return d},querySelectorAll(){return[]},querySelector(){return d},createElement(){return dummy()},body:d,head:d,documentElement:d};
const ctx={console,setTimeout:(fn)=>{try{fn()}catch{}return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},Math,Date,JSON,structuredClone:global.structuredClone,Uint32Array,crypto:{getRandomValues(arr){for(let i=0;i<arr.length;i++)arr[i]=i>>>0;return arr}},performance:{now(){return 0}},requestAnimationFrame:(fn)=>{try{fn(0)}catch{}return 0},cancelAnimationFrame(){},navigator:{userAgent:'node-test'},location:{href:'http://localhost/',reload(){}},getComputedStyle(){return{}},alert(){},confirm(){return true},document,localStorage:{getItem(){return null},setItem(){},removeItem(){}},Audio:function(){return{play(){return Promise.resolve()},pause(){}}}};
ctx.globalThis=ctx;ctx.window=ctx;ctx.GL_APP_MODE='PVP';ctx.GL_PVP_SHARED_BOARD_ACTIVE=true;
vm.createContext(ctx);
for(const rel of ['public/js/static-data.js','public/js/runtime-authority.js','public/js/app.bundle.js']) vm.runInContext(fs.readFileSync(path.join(root,rel),'utf8'),ctx,{timeout:10000,filename:rel});
const bridge=ctx.GL_LOCAL_AI_BRIDGE;
if(!bridge || typeof bridge.testGameplayFoundationFixes!=='function') throw new Error('Gameplay foundation fix bridge test missing');
const result=bridge.testGameplayFoundationFixes();
if(!result.ok) throw new Error(JSON.stringify(result,null,2));
console.log(JSON.stringify({ok:true,source:'PvP v3.29',...result},null,2));
