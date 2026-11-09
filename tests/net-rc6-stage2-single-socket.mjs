import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync('public/pvp/pvp-host.js','utf8');
const BUILD_ID='gl-s0-pvp-rc36p4-net-rc6s2-2026-11-09';
const nodes=new Map(),messages=[],listeners=new Map(),sockets=[],posted=[];
const hasClass=new Set();
function el(tag='div'){
 const o={tagName:tag.toUpperCase(),id:'',style:{removeProperty(){},setProperty(){}},dataset:{},hidden:false,disabled:false,
  classList:{add(){},remove(){},toggle(){return false},contains(){return false}},
  querySelectorAll(){return []},querySelector(){return el('button')},closest(){return null},
  setAttribute(){},getAttribute(){return null},addEventListener(){},removeEventListener(){},remove(){this.removed=true;nodes.delete(this.id)},
  appendChild(){},click(){},value:'',textContent:'',innerHTML:''};
 return o;
}
const childWin={postMessage(msg,origin){posted.push({msg,origin})}};
const doc={readyState:'complete',visibilityState:'visible',documentElement:{classList:{toggle(){}}},
 body:{appendChild(n){nodes.set(n.id,n)},querySelectorAll(){return []}},
 head:{appendChild(){}},
 getElementById(id){return nodes.get(id)||null},
 querySelector(selector){return selector==='.app'?null:el()},querySelectorAll(){return []},
 createElement(tag){const node=el(tag);if(tag==='iframe')node.contentWindow=childWin;return node}
};
for(const id of ['pvpHomeLogo','pvpSetupName','pvpSetupDeck','pvpRankPrev','pvpRankNext','pvpRankLabel','pvpLoadedDeckStatus','pvpFormationPreview','pvpDeckTitle','pvpDeckClassLine','pvpDeckStats','pvpSetupPeople','pvpSetupSpectatorButton','pvpSetupReadyButton','pvpSetupReconnectButton','pvpSetupStartButton','pvpSetupHint','pvpNameStateIcon','pvpImportDeckButton','pvpImportDeckInput'])nodes.set(id,el());
class Sock{
 static OPEN=1;static CONNECTING=0;
 constructor(url){this.url=url;this.readyState=0;sockets.push(this)}
 send(raw){messages.push(JSON.parse(raw))}
 open(){this.readyState=1;this.onopen?.({})}
 receive(data){this.onmessage?.({data:JSON.stringify(data)})}
 close(){this.readyState=3;this.onclose?.({code:1000})}
}
const session=new Map(),storage=new Map();
const winEvents=[];
const ctx={window:null,document:doc,WebSocket:Sock,JSON,Math,Date,console,URL,URLSearchParams,Map,Set,
 crypto:{randomUUID:()=> 'stage2-nonce'},
 Image:class{decode(){return Promise.resolve()}set src(_){}},
 MutationObserver:class{observe(){}},
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 sessionStorage:{getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)},
 location:{origin:'https://unit.invalid',protocol:'https:',host:'unit.invalid',href:'https://unit.invalid/',search:'',replace(v){throw Error('Unexpected full document navigation '+v)}},
 setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},
 CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}},
 dispatchEvent:ev=>winEvents.push(ev),
 addEventListener:(type,fn)=>listeners.set(type,fn),
 GL_PVP_BUILD_META:{buildId:BUILD_ID,versionLabel:'Stage2'},GL_PVP_CONFIG:{},
 GL_S0_LOBBY_STARTERS:{},GL_S0_LOBBY_CARD_DEFINITIONS:{cards:[]}};
ctx.window=ctx;ctx.globalThis=ctx;
vm.runInNewContext(source,ctx,{filename:'pvp-host.js'});
assert.equal(sockets.length,1,'Lobby boot must open a single WebSocket');
const sock=sockets[0];sock.open();
const setup={type:'snapshot',local:{clientId:'qa-p1',seat:1,role:'player',seatToken:'seat-token',name:'Player 1'},players:[{seat:1,name:'Player 1'}],match:{status:'setup',revision:0}};
sock.receive(setup);
assert.equal(nodes.has('glPvpBattleStage'),false,'No battlefield while in setup');
const coin={...setup,match:{status:'coin-flip',chooserSeat:2,revision:1}};
sock.receive(coin);
assert.equal(sockets.length,1,'Coin Flip must NOT create a new WebSocket');
assert.ok(nodes.has('glPvpBattleStage'),'Coin Flip uses embedded battle document');
const frame=nodes.get('glPvpBattleStage');
assert.equal(frame.src,'/battle/?embedded=1');
const messageHandler=listeners.get('message');
assert.ok(messageHandler);
const fromChild=(kind,message)=>messageHandler({origin:'https://unit.invalid',source:childWin,data:{channel:'gl-pvp-battle-transport-v1',kind,message}});
fromChild('ready');
assert.ok(posted.some(x=>x.msg.message?.type==='snapshot'&&x.msg.message?.match?.status==='coin-flip'));
const before=messages.length;
fromChild('send',{type:'choose-coin-flip',clientBuildId:BUILD_ID,choice:'HEADS'});
assert.equal(messages.length,before+1);
assert.equal(messages.at(-1).type,'choose-coin-flip');
fromChild('send',{type:'runtime-intent',clientBuildId:'wrong-build',clientActionId:'bad',intent:'advancePhase',args:[]});
assert.equal(messages.length,before+1,'Wrong build rejected by parent');
messageHandler({origin:'https://evil.invalid',source:childWin,data:{channel:'gl-pvp-battle-transport-v1',kind:'send',message:{type:'runtime-intent',clientBuildId:BUILD_ID}}});
assert.equal(messages.length,before+1,'Cross-origin message rejected');
const board={pvpPrivateStateMasked:true,pvpRecipientSeat:1,appState:{turn:'PLAYER',phase:'Battle'}};
sock.receive({...coin,match:{status:'started',revision:2,board}});
assert.equal(sockets.length,1,'Gameplay must retain lobby WebSocket');
assert.ok(posted.some(x=>x.msg.message?.match?.status==='started'));
const reply={type:'intent-result',clientActionId:'action-1',ok:true,snapshot:{...coin,match:{status:'started',revision:3,board}}};
sock.receive(reply);
assert.ok(posted.some(x=>x.msg.message?.type==='intent-result'&&x.msg.message?.clientActionId==='action-1'));
sock.receive(setup);
assert.equal(nodes.has('glPvpBattleStage'),false,'Match cleanup removes battlefield iframe');
assert.equal(sockets.length,1,'Returning to lobby retains one socket');
console.log('PASS Stage2 one parent socket across lobby, coin, battlefield, result, setup; origin-gated child intents and ACK relay');
