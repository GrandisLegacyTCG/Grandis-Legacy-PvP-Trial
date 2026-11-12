/** Prove hidden READY prewarm never creates a second socket / skips server. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../public/pvp/pvp-host.js',import.meta.url),'utf8');
const nodes=new Map(),outgoing=[],posted=[],listeners=new Map(),sockets=[],idle=[];
function element(tag='div'){
  const e={tagName:tag.toUpperCase(),id:'',children:[],style:{removeProperty(){},setProperty(){}},dataset:{},inert:false,hidden:false,disabled:false,
    className:'',classList:{add(){},remove(){},toggle(){return false},contains(){return false}},
    querySelectorAll(){return []},querySelector(){return element('button')},closest(){return null},
    setAttribute(){},getAttribute(){return null},addEventListener(){},removeEventListener(){},
    remove(){this.removed=true;nodes.delete(this.id)},appendChild(e){this.children.push(e);return e},
    click(){},value:'',textContent:'',innerHTML:''};
  if(tag==='iframe')e.contentWindow={postMessage(msg,origin){posted.push({msg,origin})}};
  return e;
}
const doc={readyState:'complete',visibilityState:'visible',documentElement:{classList:{toggle(){}}},
  body:{appendChild(n){nodes.set(n.id,n)},querySelectorAll(){return []}},head:{appendChild(){}},
  getElementById:id=>nodes.get(id)||null,querySelector:q=>q==='.app'?null:element(),
  querySelectorAll(){return []},createElement:element};
for(const id of ['pvpHomeLogo','pvpSetupName','pvpSetupDeck','pvpRankPrev','pvpRankNext','pvpRankLabel',
'pvpLoadedDeckStatus','pvpFormationPreview','pvpDeckTitle','pvpDeckClassLine','pvpDeckStats',
'pvpSetupPeople','pvpSetupSpectatorButton','pvpSetupReadyButton','pvpSetupReconnectButton',
'pvpSetupStartButton','pvpSetupHint','pvpNameStateIcon','pvpImportDeckButton','pvpImportDeckInput'])nodes.set(id,element());
class Socket{
  static OPEN=1;static CONNECTING=0;
  constructor(url){this.url=url;this.readyState=0;sockets.push(this)}
  send(raw){outgoing.push(JSON.parse(raw))}
  open(){this.readyState=1;this.onopen?.({})}
  receive(x){this.onmessage?.({data:JSON.stringify(x)})}
}
const sessions=new Map(),storage=new Map();
const ctx={window:null,globalThis:null,document:doc,WebSocket:Socket,JSON,Date,Math,console,URL,URLSearchParams,Map,Set,
 navigator:{deviceMemory:8,connection:{saveData:false}},
 performance:{now:()=>420},
 crypto:{randomUUID:()=> 'startup-nonce'},
 Image:class{decode(){return Promise.resolve()}set src(_){}},MutationObserver:class{observe(){}},
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 sessionStorage:{getItem:k=>sessions.get(k)||null,setItem:(k,v)=>sessions.set(k,v),removeItem:k=>sessions.delete(k)},
 location:{origin:'https://unit.invalid',protocol:'https:',host:'unit.invalid',href:'https://unit.invalid/',search:'',replace(){throw Error('Unexpected navigation')}},
 setTimeout(){return 4},clearTimeout(){},setInterval(){return 2},clearInterval(){},
 requestIdleCallback(fn){idle.push(fn);return idle.length},
 CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},
 dispatchEvent(){},addEventListener(type,fn){listeners.set(type,fn)},
 GL_PVP_BUILD_META:{buildId:'gl-s0-pvp-rc39-beta2-repo-rc3-2026-11-12',versionLabel:'Batch2'},
 GL_PVP_CONFIG:{},GL_S0_LOBBY_STARTERS:{},GL_S0_LOBBY_CARD_DEFINITIONS:{cards:[]}};
ctx.window=ctx;ctx.globalThis=ctx;
vm.runInNewContext(src,ctx,{filename:'pvp-host.js'});
const sock=sockets[0];sock.open();
function setup(ready){return {type:'snapshot',local:{clientId:'t',seat:1,role:'player',seatToken:'token',name:'P1',ready},
 players:[{seat:1,name:'P1',connected:true,ready},{seat:2,name:'P2',connected:true,ready}],match:{status:'setup',revision:0}}}
const drain=()=>{while(idle.length)idle.shift()({didTimeout:false,timeRemaining:()=>20})};
sock.receive(setup(true));
assert.equal(nodes.has('glPvpBattleStage'),false,'READY snapshot must not block lobby with synchronous VM startup');
drain();
const warmFrame=nodes.get('glPvpBattleStage');
assert.ok(warmFrame,'Hidden frame created after idle callback');
assert.equal(warmFrame.style.visibility,'hidden');assert.equal(warmFrame.inert,true);
assert.equal(warmFrame.style.pointerEvents,'none');assert.equal(sockets.length,1);
const handler=listeners.get('message');
handler({origin:'https://unit.invalid',source:warmFrame.contentWindow,data:{channel:'gl-pvp-battle-transport-v1',kind:'ready'}});
assert.ok(posted.some(p=>p.msg.message?.match?.status==='setup'));
const coin={...setup(true),match:{status:'coin-flip',revision:1,chooserSeat:2}};
sock.receive(coin);
assert.equal(nodes.get('glPvpBattleStage'),warmFrame,'Coin must reuse the exact prewarmed iframe');
assert.equal(warmFrame.style.visibility,'visible');assert.equal(warmFrame.inert,false);
assert.ok(posted.some(p=>p.msg.message?.match?.status==='coin-flip'));
assert.equal(sockets.length,1,'Stage2 parent still owns one socket');
sock.receive(setup(false));
assert.equal(nodes.has('glPvpBattleStage'),false,'Return from match disposes the warm/active stage');
// Warm-frame abandonment: UNREADY must dispose it while still hidden.
sock.receive(setup(true));drain();
assert.equal(nodes.get('glPvpBattleStage')?.style.visibility,'hidden');
sock.receive(setup(false));
assert.equal(nodes.has('glPvpBattleStage'),false);
// Browser memory saver disables aggressive iframe prewarming (prefetch remains).
ctx.navigator.deviceMemory=2;
sock.receive(setup(true));drain();
assert.equal(nodes.has('glPvpBattleStage'),false,'Low memory device should not allocate another engine in the lobby');
assert.equal(sockets.length,1);
// Room errors during a prewarm must be handled by the actual lobby, not
// swallowed by the hidden game iframe. Disconnect also releases the frame.
ctx.navigator.deviceMemory=8;
sock.receive(setup(true));drain();
assert.equal(nodes.get('glPvpBattleStage')?.style.visibility,'hidden');
const postedBeforeError=posted.length;
sock.receive({type:'error',code:'REQUEST_REJECTED',message:'A lobby error while READY'});
assert.equal(posted.length,postedBeforeError,'Lobby errors must not be relayed into a hidden iframe');
sock.onclose({code:1000});
assert.equal(nodes.has('glPvpBattleStage'),false,'Disconnect releases the READY warm iframe');
assert.equal(sockets.length,1);
assert.equal(outgoing.filter(x=>x.type==='start-match').length,0,'Warmframe never starts the match');
console.log('PASS Batch2 warmframe: deferred load, invisible/no input, Coin reuse, cleanup, disconnect/error routing, low-memory guard, one WebSocket');
