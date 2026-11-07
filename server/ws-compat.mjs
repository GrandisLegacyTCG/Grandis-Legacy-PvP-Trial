/* Dependency-free adapter exposing the two `ws` APIs consumed by the exact
 * Season 1 v3.80.17 controller. It preserves the S1 message protocol. */
import {attachWebSocket} from './ws-lite.mjs';
export class WebSocket {static OPEN=1}
export class WebSocketServer {
  #handlers=[];
  constructor({server,path='/ws',maxPayload=2*1024*1024}={}){
    attachWebSocket(server,(raw,req)=>{
      const events={message:[],close:[],error:[]};
      const ws={readyState:WebSocket.OPEN,
        send(message){try{raw.send(JSON.parse(String(message)))}catch{}},
        close(code=1000,reason=''){ws.readyState=3;raw.close(code,reason)},
        on(type,handler){if(events[type])events[type].push(handler);return ws}
      };
      raw.on('message',msg=>{for(const h of events.message)h(Buffer.from(JSON.stringify(msg)))});
      raw.on('close',()=>{ws.readyState=3;for(const h of events.close)h()});
      for(const h of this.#handlers)h(ws,req);
    },{path,maxBytes:maxPayload});
  }
  on(type,handler){if(type==='connection')this.#handlers.push(handler);return this}
}
