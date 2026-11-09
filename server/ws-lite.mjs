/** Small dependency-free RFC6455 text WebSocket host for Node 22. */
import { createHash } from 'node:crypto';
const ACCEPT = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
export function attachWebSocket(server, onClient, {path='/ws', maxBytes=200_000}={}) {
  server.on('upgrade', (req, socket, head) => {
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { socket.destroy();return; }
    if (url.pathname !== path || String(req.headers.upgrade||'').toLowerCase()!=='websocket' ||
        !String(req.headers.connection||'').toLowerCase().split(',').some(v=>v.trim()==='upgrade') ||
        req.headers['sec-websocket-version']!=='13') {socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');return;}
    const key=req.headers['sec-websocket-key'];
    if (!key || !/^[A-Za-z0-9+/]{22}==$/.test(key) || Buffer.from(key,'base64').length!==16) {socket.destroy();return;}
    // Same-origin browser access by default; optional explicit cross-origin Pages origin.
    const origin=String(req.headers.origin||'');
    const allowed=String(process.env.PVP_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
    // Browsers always send Origin. Default to SAME-ORIGIN, not allow-any-origin:
    // a public Northflank room must not be cross-origin socket accessible unless
    // the operator explicitly allowlists a separately hosted frontend.
    // A non-browser client without Origin still requires a secret seat token to reconnect.
    let permitted=!origin;
    if(origin){
      try{
        const parsed=new URL(origin);
        permitted=(parsed.protocol==='http:'||parsed.protocol==='https:')&&
          (allowed.length>0?allowed.includes(origin):parsed.host===String(req.headers.host||''));
      }catch{permitted=false;}
    }
    if(!permitted){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
    const accept=createHash('sha1').update(key+ACCEPT).digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
    let buffer=Buffer.from(head), closed=false;
    const listeners={message:[],close:[]};
    function frame(data, opcode=1) {
      if(closed||socket.destroyed)return false;
      const payload=opcode===1?Buffer.from(typeof data==='string'?data:JSON.stringify(data),'utf8'):Buffer.from(data);
      let header;
      if(payload.length<126){header=Buffer.from([0x80|opcode,payload.length]);}
      else if(payload.length<65536){header=Buffer.alloc(4);header[0]=0x80|opcode;header[1]=126;header.writeUInt16BE(payload.length,2);}
      else{header=Buffer.alloc(10);header[0]=0x80|opcode;header[1]=127;header.writeBigUInt64BE(BigInt(payload.length),2);}
      return socket.write(Buffer.concat([header,payload]));
    }
    const client={send:payload=>frame(payload),get bufferedAmount(){return socket.writableLength},close:(code=1000,reason='')=>{if(closed)return;const r=Buffer.from(reason).subarray(0,120),b=Buffer.alloc(2+r.length);b.writeUInt16BE(code);r.copy(b,2);frame(b,8);socket.end();},on:(kind,fn)=>{if(listeners[kind])listeners[kind].push(fn)},remoteAddress:socket.remoteAddress};
    function shutdown(){if(closed)return;closed=true;for(const fn of listeners.close)try{fn()}catch{}}
    function fail(code=1002){client.close(code);socket.destroy();}
    function consume(){
      while(buffer.length>=2 && !closed){
        const b0=buffer[0],b1=buffer[1],opcode=b0&15,fin=!!(b0&0x80),masked=!!(b1&0x80);
        if((b0&0x70)||!masked||!fin){fail();return;}
        let len=b1&127,header=2;
        if(len===126){if(buffer.length<4)return;len=buffer.readUInt16BE(2);header=4;}
        if(len===127){if(buffer.length<10)return;const l=buffer.readBigUInt64BE(2);if(l>BigInt(maxBytes)){fail(1009);return;}len=Number(l);header=10;}
        if(len>maxBytes || (opcode>=8 && len>125)){fail(1009);return;}
        if(buffer.length<header+4+len)return;
        const mask=buffer.subarray(header,header+4),payload=Buffer.from(buffer.subarray(header+4,header+4+len));
        for(let i=0;i<payload.length;i++)payload[i]^=mask[i&3];
        buffer=buffer.subarray(header+4+len);
        if(opcode===8){client.close();shutdown();return;}
        if(opcode===9){frame(payload,10);continue;}
        if(opcode===10)continue;
        if(opcode!==1){fail(1003);return;}
        try{const text=new TextDecoder('utf-8',{fatal:true}).decode(payload);for(const fn of listeners.message)fn(text);}catch{client.close(1007,'Invalid UTF-8 text');return;}
      }
    }
    socket.on('data', chunk=>{buffer=Buffer.concat([buffer,chunk]);if(buffer.length>maxBytes+32){fail(1009);return;}consume();});
    socket.on('close',shutdown);socket.on('error',shutdown);
    onClient(client,req);
    if(buffer.length)consume();
  });
}
