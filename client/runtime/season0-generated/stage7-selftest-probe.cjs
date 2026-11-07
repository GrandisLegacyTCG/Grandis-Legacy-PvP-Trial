'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.resolve(__dirname,'../..');
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,performance:{now:()=>0},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},crypto:require('crypto').webcrypto};ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://example.test/index.html'};ctx.navigator={userAgent:'Stage7 VM'};ctx.document={readyState:'loading',addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};vm.createContext(ctx);
for(const f of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f,timeout:60000});
ctx.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true);
const names=Object.keys(ctx).filter(x=>/^GL_.*(QA_SELF_TEST|SELF_TEST)$/.test(x));
console.log('QA hooks',names.length);
const filtered=names.filter(x=>/V6919|MANA|CASTING|V6[23]|STEP|V5(10|23)|V642|V534|V69|V559|DEFEAT/i.test(x));
for(const n of filtered){try{const r=ctx[n]();const ok=r===true||r&&r.ok===true;const msg=ok?'PASS':r===false?'FALSE':JSON.stringify(r).slice(0,500);console.log(n,ok?'PASS':'FAIL',msg)}catch(e){console.log(n,'ERROR',String(e.stack||e).slice(0,400))}}
