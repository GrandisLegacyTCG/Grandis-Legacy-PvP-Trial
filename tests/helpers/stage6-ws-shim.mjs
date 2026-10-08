import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
export const WebSocket={OPEN:1,CLOSING:2,CLOSED:3};
function frame(opcode,payload=Buffer.alloc(0)){
  payload=Buffer.isBuffer(payload)?payload:Buffer.from(String(payload));
  let head;
  if(payload.length<126){head=Buffer.alloc(2);head[0]=0x80|opcode;head[1]=payload.length;}
  else if(payload.length<=0xffff){head=Buffer.alloc(4);head[0]=0x80|opcode;head[1]=126;head.writeUInt16BE(payload.length,2);}
  else{head=Buffer.alloc(10);head[0]=0x80|opcode;head[1]=127;head.writeBigUInt64BE(BigInt(payload.length),2);}
  return Buffer.concat([head,payload]);
}
class ServerSocket extends EventEmitter{
  constructor(socket,wss,head){super();this._socket=socket;this._wss=wss;this.readyState=WebSocket.OPEN;this.isAlive=true;this._buf=head&&head.length?Buffer.from(head):Buffer.alloc(0);wss.clients.add(this);socket.on('data',d=>this._onData(d));socket.on('close',()=>this._finishClose());socket.on('end',()=>this._finishClose());socket.on('error',()=>this._finishClose());if(this._buf.length)queueMicrotask(()=>this._parse());}
  send(data){if(this.readyState!==WebSocket.OPEN)return;this._socket.write(frame(1,Buffer.from(String(data))));}
  ping(){if(this.readyState===WebSocket.OPEN)this._socket.write(frame(9));}
  close(code=1000,reason=''){if(this.readyState>=WebSocket.CLOSING)return;this.readyState=WebSocket.CLOSING;const r=Buffer.from(String(reason));const p=Buffer.alloc(2+r.length);p.writeUInt16BE(Number(code)||1000,0);r.copy(p,2);try{this._socket.write(frame(8,p));}catch{};try{this._socket.end();}catch{};}
  terminate(){this.readyState=WebSocket.CLOSED;try{this._socket.destroy();}catch{};this._finishClose();}
  _finishClose(){if(this.readyState===WebSocket.CLOSED)return;this.readyState=WebSocket.CLOSED;this._wss.clients.delete(this);this.emit('close');}
  _onData(d){this._buf=Buffer.concat([this._buf,d]);this._parse();}
  _parse(){while(this._buf.length>=2){let b0=this._buf[0],b1=this._buf[1],opcode=b0&0x0f,masked=!!(b1&0x80),len=b1&0x7f,off=2;if(len===126){if(this._buf.length<4)return;len=this._buf.readUInt16BE(2);off=4;}else if(len===127){if(this._buf.length<10)return;const n=this._buf.readBigUInt64BE(2);if(n>BigInt(Number.MAX_SAFE_INTEGER))return this.terminate();len=Number(n);off=10;}let mask=null;if(masked){if(this._buf.length<off+4)return;mask=this._buf.subarray(off,off+4);off+=4;}if(this._buf.length<off+len)return;let p=Buffer.from(this._buf.subarray(off,off+len));this._buf=this._buf.subarray(off+len);if(mask)for(let i=0;i<p.length;i++)p[i]^=mask[i%4];if(opcode===1)this.emit('message',p);else if(opcode===8){if(this.readyState===WebSocket.OPEN){try{this._socket.write(frame(8,p));}catch{}}try{this._socket.end();}catch{};this._finishClose();return;}else if(opcode===9){try{this._socket.write(frame(10,p));}catch{}}else if(opcode===10)this.emit('pong',p);}}
}
export class WebSocketServer extends EventEmitter{
  constructor(){super();this.clients=new Set();}
  handleUpgrade(req,socket,head,cb){const key=req.headers['sec-websocket-key'];if(!key){socket.destroy();return;}const accept=createHash('sha1').update(String(key)+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');const ws=new ServerSocket(socket,this,head);cb(ws);}
}
