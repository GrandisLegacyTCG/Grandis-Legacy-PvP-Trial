'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.resolve(__dirname,'../..');
let context={console,URL,Math,Date,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,performance:{now:()=>0},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},requestAnimationFrame:()=>0, cancelAnimationFrame:()=>{},crypto:require('crypto').webcrypto};
context.window=context; context.globalThis=context;context.location={href:'http://example.test/index.html',origin:'http://example.test'};context.navigator={userAgent:'Node Stage7'};
context.document={readyState:'loading',addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],body:null,documentElement:null};
vm.createContext(context);
for(const file of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 const txt=fs.readFileSync(path.join(root,file),'utf8');
 try{vm.runInContext(txt,context,{filename:file,timeout:60000});console.log('LOADED',file)}catch(e){console.error('FAILED',file,e.stack);process.exit(1)}
}
console.log('BRIDGE',Object.keys(context).filter(x=>x.startsWith('GL_')));
context.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true); const r=context.GL_GAME_ENGINE.startLocalMatch('PLAYER');console.log('START MATCH',r.ok,r.error, r.snapshot&&{turn:r.snapshot.appState.turn,phase:r.snapshot.appState.phase,opening:r.snapshot.appState.openingHandsDrawn,mano:r.snapshot.appState.mana});
