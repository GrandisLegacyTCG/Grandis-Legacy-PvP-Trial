import assert from 'node:assert/strict';
import net from 'node:net';
import {randomBytes} from 'node:crypto';
const port=Number(process.env.PVP_TEST_PORT||3000);
async function upgrade(origin){
 return await new Promise((resolve,reject)=>{
  const socket=net.createConnection({host:'127.0.0.1',port});
  let data='';const watchdog=setTimeout(()=>{socket.destroy();reject(Error('Handshake timed out'))},4000);
  socket.on('error',e=>{clearTimeout(watchdog);reject(e)});
  socket.on('data',chunk=>{data+=chunk.toString();const idx=data.indexOf('\r\n\r\n');if(idx>=0){clearTimeout(watchdog);socket.destroy();resolve(data.slice(0,idx));}});
  socket.once('connect',()=>{socket.write(`GET /ws HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: ${randomBytes(16).toString('base64')}\r\nOrigin: ${origin}\r\n\r\n`)});
 });
}
assert.match(await upgrade(`http://127.0.0.1:${port}`),/^HTTP\/1\.1 101 /);
assert.match(await upgrade('https://evil.example.invalid'),/^HTTP\/1\.1 403 /);
console.log('PASS: same-origin browser WebSocket accepted; cross-origin browser WebSocket forbidden by default.');
