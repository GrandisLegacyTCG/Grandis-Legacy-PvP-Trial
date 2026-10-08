import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root=resolve(new URL('..',import.meta.url).pathname),mod=join(root,'node_modules/ws');
rmSync(join(root,'node_modules'),{recursive:true,force:true});mkdirSync(mod,{recursive:true});
writeFileSync(join(mod,'package.json'),JSON.stringify({name:'ws',version:'8.21.0-test-stub',type:'module',exports:'./index.js'}));
writeFileSync(join(mod,'index.js'),`import { EventEmitter } from 'node:events';\nexport class WebSocket extends EventEmitter { static OPEN=1; constructor(){super();this.readyState=1;this._socket={setNoDelay(){}};} send(){} close(){this.readyState=3;} }\nexport class WebSocketServer extends EventEmitter { constructor(){super();this.clients=new Set();globalThis.__GL_TEST_WSS__=this;} handleUpgrade(req,socket,head,cb){const ws=new WebSocket();this.clients.add(ws);cb(ws);} close(cb){if(cb)cb();} }\n`);
try{
  const r=spawnSync(process.execPath,[join(root,'tests/server-sim-child-v3755.mjs')],{cwd:root,env:{...process.env,PORT:'0',HOST:'127.0.0.1'},encoding:'utf8',timeout:60000});
  if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);if(r.status!==0)throw new Error('Server simulation exited '+r.status);
}finally{rmSync(join(root,'node_modules'),{recursive:true,force:true});}
