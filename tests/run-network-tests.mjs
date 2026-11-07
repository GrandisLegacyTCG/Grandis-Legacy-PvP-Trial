import {spawn} from 'node:child_process';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pickPort=()=>new Promise((yes,no)=>{const sock=net.createServer();sock.once('error',no);sock.listen(0,'127.0.0.1',()=>{const p=sock.address().port;sock.close(()=>yes(p));});});
const port=await pickPort();
const env={...process.env,PORT:String(port),HOST:'127.0.0.1',PVP_TEST_PORT:String(port)};
const server=spawn(process.execPath,['server.js'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
let stderr='';server.stderr.on('data',c=>stderr+=c.toString().slice(-1500));
try{
  let started=false;
  for(let i=0;i<60;i++){
    if(server.exitCode!==null)throw Error('Server terminated: '+stderr);
    try{const r=await fetch(`http://127.0.0.1:${port}/health`);if(r.ok){started=true;break}}catch{}
    await delay(100);
  }
  if(!started)throw Error('HTTP server did not become ready: '+stderr);
  for(const test of ['tests/pvp-network-smoke.mjs','tests/pvp-network-extended.mjs','tests/websocket-origin.mjs','tests/room-reconnect-abuse.mjs','tests/pvp-network-full-match.mjs']){
    await new Promise((yes,no)=>{
      const sub=spawn(process.execPath,[test],{cwd:root,env,stdio:'inherit'});
      sub.once('error',no);sub.once('exit',(code)=>code===0?yes():no(Error(test+' exited '+code)));
    });
  }
}finally{server.kill('SIGTERM');}
