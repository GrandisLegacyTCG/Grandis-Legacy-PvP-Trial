import {spawn} from 'node:child_process';
import http from 'node:http';
import {setTimeout as sleep} from 'node:timers/promises';
import {strict as assert} from 'node:assert';
const PORT=43800+Math.floor(Math.random()*1000);
const proc=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(PORT)},stdio:'ignore'});
const get=(uri,headers={})=>new Promise((resolve,reject)=>{const req=http.get({host:'127.0.0.1',port:PORT,path:uri,headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));});req.on('error',reject);req.setTimeout(3000,()=>req.destroy(new Error('HTTP timeout')));});
try{
 let ready=false;for(let i=0;i<65;i++){try{const r=await get('/health');ready=r.status===200;if(ready)break;}catch{}await sleep(90)}
 assert(ready,'HTTP server did not start');
 const uri='/battle/engine/js/static-data.js';
 const plain=await get(uri);assert.equal(plain.status,200);assert(plain.body.length>6000000);
 const br=await get(uri,{'Accept-Encoding':'br, gzip'});assert.equal(br.status,200);assert.equal(br.headers['content-encoding'],'br');assert(br.body.length<plain.body.length/4);
 const gz=await get(uri,{'Accept-Encoding':'gzip'});assert.equal(gz.headers['content-encoding'],'gzip');
 const conditional=await get(uri,{'If-None-Match':br.headers.etag,'Accept-Encoding':'br'});assert.equal(conditional.status,304);
 const forbidden=await get(uri+'.br');assert.equal(forbidden.status,403);
 const sfx=await get('/battle/engine/assets/audio/Card%20Sound.mp3',{'Range':'bytes=0-1023'});
 assert.equal(sfx.status,206,'SFX playback must support streaming ranges');
 assert.equal(sfx.body.length,1024,'SFX range must not download the entire file');
 assert.match(sfx.headers['content-range'],/^bytes 0-1023\/\d+$/);
 const invalidRange=await get('/battle/engine/assets/audio/Card%20Sound.mp3',{'Range':'bytes=999999999-'});
 assert.equal(invalidRange.status,416);
 const lobby=await get('/');assert.equal(lobby.status,200);assert(!lobby.body.toString().includes('engine/js/static-data.js'),'Lobby must not load game engine');
 console.log(JSON.stringify({ok:true,contentEncodingBR:br.headers['content-encoding'],originalBytes:plain.body.length,encodedBytes:br.body.length,etag304:true,sidecarsHidden:true,lobbyEngineFree:true},null,2));
}finally{proc.kill('SIGTERM');}
