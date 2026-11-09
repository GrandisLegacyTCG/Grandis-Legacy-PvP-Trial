'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
const context={console,URL,Math,Date,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,
  performance:{now:()=>0},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},
  requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},crypto:require('crypto').webcrypto};
context.window=context;context.globalThis=context;context.location={href:'http://localhost',origin:'http://localhost'};
context.navigator={userAgent:'RC36 Poison QA'};
context.document={readyState:'loading',addEventListener:()=>{},getElementById:()=>null,
  querySelector:()=>null,querySelectorAll:()=>[],body:null,documentElement:null};
vm.createContext(context);
for(const file of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file,timeout:60000});
}
const tests=['GL_RC36_POISON_LETHAL_AI_QA_SELF_TEST','GL_LOCAL_AI_V634_ACTIVE_STRATEGY_QA_SELF_TEST'];
let fails=0;
for(const name of tests){
  const fn=context[name];if(typeof fn!=='function'){console.error('FAIL',name,'test entry point missing');fails++;continue;}
  const res=fn(); console.log(name,JSON.stringify(res));if(!res||!res.ok)fails++;
}
process.exitCode=fails?1:0;
