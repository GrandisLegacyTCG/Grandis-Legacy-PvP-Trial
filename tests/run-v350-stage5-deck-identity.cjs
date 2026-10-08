'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const TMP=path.join(ROOT,'.stage5-server-runtime-test.mjs');
const OUT=path.join(ROOT,'tests/artifacts/v350-stage5');fs.mkdirSync(OUT,{recursive:true});
function transformServer(){
  let s=fs.readFileSync(path.join(ROOT,'server.js'),'utf8');
  s=s.replace("import { WebSocketServer, WebSocket } from 'ws';", `class WebSocketServer { constructor(){this.handlers={};} on(ev,fn){this.handlers[ev]=fn;} emit(ev,...args){if(this.handlers[ev])return this.handlers[ev](...args);} handleUpgrade(){} }\nconst WebSocket={OPEN:1};`);
  s=s.replace('const RUNTIME_SYNC_STATUS = verifyRuntimeSyncOrThrow(BASE);','const RUNTIME_SYNC_STATUS = {ok:true,testBypass:true};');
  const idx=s.lastIndexOf('server.listen(PORT, HOST, () => {');assert(idx>=0,'server.listen marker missing');
  s=s.slice(0,idx)+"\nexport { wss, roomState, starterDeckData, safeCustomDeck, createRuntimeEngine };\n";
  fs.writeFileSync(TMP,s);
}
function clone(v){return JSON.parse(JSON.stringify(v));}
function countMain(d){return d.main_deck.reduce((n,e)=>n+Number(e.quantity??e.qty??1),0);}
function sized(base,n){const d=clone(base);let cur=countMain(d);for(let i=d.main_deck.length-1;i>=0&&cur>n;i--){let q=Number(d.main_deck[i].quantity??1),take=Math.min(q,cur-n);q-=take;cur-=take;if(q<=0)d.main_deck.splice(i,1);else d.main_deck[i].quantity=q;}if(n>cur)d.main_deck.push({card_id:'S1-INVALID-STAGE5',quantity:n-cur});d.display_name=`Stage5 ${n} Cards`;d.deck_name=d.display_name;return d;}
class FakeWS{
  constructor(){this.readyState=1;this.handlers={};this.sent=[];this.isAlive=true;this._socket={setNoDelay(){}};}
  on(ev,fn){this.handlers[ev]=fn;}
  send(v){this.sent.push(JSON.parse(String(v)));}
  close(){this.readyState=3;if(this.handlers.close)this.handlers.close();}
  message(obj){assert(this.handlers.message,'message handler missing');this.handlers.message(JSON.stringify(obj));}
  notices(){return this.sent.filter(x=>x.type==='notice');}
  lastSnapshot(){return [...this.sent].reverse().find(x=>x.type==='snapshot')||null;}
}
(async()=>{
  transformServer();
  try{
    const m=await import('file://'+TMP+'?s5='+Date.now());
    const keys=['starter_01_elemental_lord_conqueror_renegade','starter_02_saint_crusader_grand_ranger'];
    const base=m.starterDeckData(keys[0]);assert(base&&countMain(base)===60,'starter baseline must remain 60');
    const matrix={};
    for(const n of [49,50,51,55,59,60,61]){
      let ok=true,error='';try{m.safeCustomDeck(sized(base,n));}catch(e){ok=false;error=String(e.message||e);}matrix[n]={serverValidator:ok,error};
      if(n>=50&&n<=60)assert(ok,`server validator rejected ${n}`);else assert(!ok,`server validator accepted ${n}`);
    }
    const integration={};
    for(const n of [50,51,55,59,60]){
      const room=`STAGE5_${n}`,p1=new FakeWS(),p2=new FakeWS();
      m.wss.emit('connection',p1,{url:`/ws?room=${room}&client=p1_${n}&name=Alice` ,headers:{host:'localhost'}});
      m.wss.emit('connection',p2,{url:`/ws?room=${room}&client=p2_${n}&name=Bob` ,headers:{host:'localhost'}});
      const deck=sized(base,n);
      p1.message({type:'set-deck',customDeck:deck,deckName:`Alice Stage5 ${n}`});
      p2.message({type:'set-deck',customDeck:deck,deckName:`Bob Stage5 ${n}`});
      assert(!p1.notices().some(x=>x.kind==='error'),`${n}: p1 set-deck failed`);
      assert(!p2.notices().some(x=>x.kind==='error'),`${n}: p2 set-deck failed`);
      p1.message({type:'ready',ready:true});p2.message({type:'ready',ready:true});
      assert(!p1.notices().some(x=>x.kind==='error'),`${n}: ready failed`);
      p1.message({type:'start-match',seed:`stage5-${n}`});
      const snap=p1.lastSnapshot();
      assert(snap&&snap.match&&snap.match.status==='coin-flip',`${n}: match did not initialize`);
      assert(snap.match.serverBoardRevision>0,`${n}: runtime board revision missing`);
      integration[n]={setDeck:true,ready:true,matchStart:true,runtimeInitialized:true,revision:snap.match.serverBoardRevision};
    }
    for(const n of [49,61]){
      const room=`STAGE5_BAD_${n}`,ws=new FakeWS();m.wss.emit('connection',ws,{url:`/ws?room=${room}&client=bad_${n}&name=Bad${n}`,headers:{host:'localhost'}});
      ws.message({type:'set-deck',customDeck:sized(base,n),deckName:`Invalid ${n}`});
      const err=ws.notices().find(x=>x.kind==='error');assert(err,`${n}: invalid set-deck did not reject`);
      integration[n]={rejected:true,error:err.message};
    }
    // Official Starter definitions remain 60 and unmodified.
    const starterCounts=keys.map(k=>countMain(m.starterDeckData(k)));assert(starterCounts.every(n=>n===60),'official starter modified');
    const result={ok:true,rule:'50-60 inclusive',matrix,integration,officialStarterCounts:starterCounts};
    fs.writeFileSync(path.join(OUT,'deck-server.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
  }finally{try{fs.unlinkSync(TMP);}catch{}}
})().catch(e=>{try{fs.unlinkSync(TMP);}catch{};console.error(e);process.exit(1);});
