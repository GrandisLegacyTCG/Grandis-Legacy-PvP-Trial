/**
 * RC40 Patch 3.2 production Hand artwork regression.
 * Execute the actual renderHand/renderOpponentHand/binder functions in a small
 * DOM contract harness. This is not a complete browser integration test.
 * Direct /pvp/battle/ browser verification remains a separate release gate.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=fs.readFileSync(path.join(repo,'public/battle/shared-app/app-runtime.js'),'utf8');
const build='gl-s0-pvp-rc40-patch32-item-discard-2026-11-14';
const html=fs.readFileSync(path.join(repo,'public/battle/index.html'),'utf8');
let checks=0;
function ok(test,message){assert.ok(test,message);checks++}
function segment(src,start,end){
 const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
 assert.ok(a>=0 && b>a,'Missing runtime segment '+start);
 return src.slice(a,b);
}
const functions=[
 segment(runtime,'function art(id){','\n// RC40 Patch 3.2: VS AI'),
 segment(runtime,'function glBindPlayerHandArtwork(','\nfunction shardArt('),
 segment(runtime,'function renderHand(s){','\nfunction addAction('),
 segment(runtime,'function renderOpponentHand(s){','\nfunction renderPhase('),
].join('\n');

class Element{
 constructor(tag,base){
  this.tagName=tag.toUpperCase();this.base=base;this.style={};this.dataset={};
  this.children=[];this._src='';this.srcWrites=[];this.listeners=new Map();
  this.classes=new Set();this.classList={add:(...x)=>x.forEach(v=>this.classes.add(v)),remove:(...x)=>x.forEach(v=>this.classes.delete(v)),contains:x=>this.classes.has(x)};
 }
 set className(v){this.classes=new Set(String(v).split(/\s+/).filter(Boolean))}
 get className(){return [...this.classes].join(' ')}
 set innerHTML(v){if(v==='')this.children=[];this._innerHTML=v}
 get innerHTML(){return this._innerHTML||''}
 appendChild(el){this.children.push(el);el.parentElement=this;return el}
 addEventListener(type,fn,opts){const arr=this.listeners.get(type)||[];arr.push({fn,once:!!opts?.once});this.listeners.set(type,arr)}
 emit(type){for(const h of [...(this.listeners.get(type)||[])]){h.fn({target:this});if(h.once)this.listeners.set(type,(this.listeners.get(type)||[]).filter(x=>x!==h))}}
 set src(v){this._src=String(v);this.srcWrites.push(this._src)}
 get src(){return this._src?new URL(this._src,this.base).href:''}
 getAttribute(k){if(k==='src')return this._src;return null}
}
function harness(site=false){
 const base=site?'https://grandislegacytcg.web.id/pvp/battle/':'http://127.0.0.1:3000/battle/';
 const back='assets/ui/back-main.webp',artCalls=[];
 const hand=new Element('div',base),opponent=new Element('div',base),hidden={PLAYER:new Map(),AI:new Map()},reservations={PLAYER:[],AI:[]};
 const ctx=vm.createContext({
  document:{baseURI:base,createElement:tag=>new Element(tag,base),querySelector:()=>null},
  URL,encodeURIComponent,String,JSON,Map,Set,
  E:()=>({getHandModel:()=>[{canPlay:true,canTribute:false},{canPlay:false,canTribute:false},{canPlay:false,canTribute:false}]}),
  cv:id=>({name:'Card '+id}),
  playerHandTrack:hand,oppHandTrack:opponent,
  glHiddenCommittedDrawSlots:hidden,glPendingDrawReservations:reservations,
  handRenderKey:'',opponentHandRenderKey:'',uiResponseSourceChoice:null,
  updateCommittedHandSlotVisibility:()=>{},
  discardSelectionState:()=>({selected:false}),
  isDirectHandCardSearch:()=>false,isHandDiscardPending:()=>false,pendingOwner:()=>null,selectedChoiceIndex:()=>-1,
  bindBattlefieldPreview:()=>{},bindBattlefieldHandHover:()=>{},openCardReview:()=>{},
  applyHandFan:()=>{},requestAnimationFrame:cb=>cb(),
  syncPlayerHandToHeroCenter:()=>{},syncOpponentHand:()=>{},
  addAction:(holder,label)=>{const btn=new Element('button',base);btn.textContent=label;holder.appendChild(btn)},
 });
 // Override just the image root as the Website pack does, with no other edits.
 const source=site?functions.replace("'card-art/'","'/card-art/'"):functions;
 vm.runInContext(source,ctx,{filename:'app-runtime.js'});
 const state={playerHand:['S0-ARC-001','S0-WAR-L001','S0-MAG-001'],aiHand:['__HIDDEN_CARD_BACK__','__HIDDEN_CARD_BACK__'],responseWindow:null,pending:null,turn:'PLAYER'};
 ctx.s=state;
 return {ctx,hand,opponent,hidden,reservations,state,base,back,artCalls,
  render:()=>vm.runInContext('renderHand(s)',ctx),opp:()=>vm.runInContext('renderOpponentHand(s)',ctx),
  bind:(card,img,id)=>ctx.glBindPlayerHandArtwork(card,img,id)};
}
for(const site of [false,true]){
 const t=harness(site),route=site?'Website /pvp/battle/':'Standalone /battle/';
 t.render();
 ok(t.hand.children.length===3,route+' 3 Hand card elements');
 const faces=t.hand.children.map(el=>el.children.find(x=>x.tagName==='IMG'));
 for(let i=0;i<faces.length;i++){
  ok(!!faces[i],route+' Hand image element');
  const expect=(site?'/card-art/':'card-art/')+encodeURIComponent(t.state.playerHand[i])+'.webp';
  ok(faces[i].getAttribute('src')===expect,route+' face artwork src '+i);
  ok(faces[i].style.background.includes('back-'),route+' nonblank loading fallback '+i);
  ok(faces[i].srcWrites.length===1,route+' no initial duplicate src writes '+i);
 }
 t.render();
 ok(t.hand.children[0].children.includes(faces[0]),route+' no re-render unchanged Hand');
 ok(faces[0].srcWrites.length===1,route+' no flicker from repeated rendering');
 t.opp();
 ok(t.opponent.children.length===2,route+' opponent Hand count');
 ok(t.opponent.children.every(c=>c.children.find(x=>x.tagName==='IMG')?.getAttribute('src')===t.back),route+' opponent identity never assigned to image');
 const legacy=faces[1];legacy.emit('error');
 ok(legacy.getAttribute('src')==='assets/ui/back-legacy.webp',route+' missing Legacy hand art shows correct Back');
 legacy.emit('error');
 ok(legacy.srcWrites.length===2,route+' one-shot fallback avoids loop');
 const main=faces[0];main.emit('error');
 ok(main.getAttribute('src')==='assets/ui/back-main.webp',route+' missing Main hand art shows correct Back');
 const mana=new Element('img',t.base);t.bind(new Element('div',t.base),mana,'S0-MAN-001');mana.emit('error');
 ok(mana.getAttribute('src')==='assets/ui/back-shard.webp',route+' missing Mana art shows correct Back');
 // Committed Draw slots remain hidden until the existing animation reveals them.
 t.hidden.PLAYER.set(0,'committed-draw');t.reservations.PLAYER.push({id:'draw-reserve'});t.render();
 ok(t.hand.children.length===4,route+' Draw reservation placeholder');
 ok(t.hand.children[0].classList.contains('gl-presentation-hidden'),route+' committed Draw face hidden before animation');
 ok(t.hand.children[3].classList.contains('gl-presentation-hidden'),route+' reserved Draw slot hidden');
 t.hidden.PLAYER.delete(0);t.reservations.PLAYER.length=0;t.render();
 ok(t.hand.children.length===3&&!t.hand.children[0].classList.contains('gl-presentation-hidden'),route+' Draw face revealed by unchanged animation lifecycle');
}
ok(runtime.includes("glBindPlayerHandArtwork(card,im,id)"),'production renderHand invokes nonempty binder');
const runtimeRef=html.match(/src="(shared-app\/app-runtime\.js\?[^"\n]+)"/)?.[1];
ok(runtimeRef,'production HTML loads patched renderer');
const runtimeUrl=new URL(runtimeRef.replace(/&amp;/g,'&'),'https://test.invalid/battle/');
ok(runtimeUrl.searchParams.get('v')===build,'exact Build ID remains in runtime query');
ok(runtimeUrl.searchParams.get('hotfix')==='handart-20261115','hotfix cache bust does not alter Build ID');
console.log(JSON.stringify({ok:true,checks,scenarios:['standalone-own-Hand','website-own-Hand','fallback-main-legacy-mana','stable-repaint','opponent-privacy','draw-hidden-and-reveal','runtime-cache-bust']}));
