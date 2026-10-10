import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const PUBLIC=path.join(ROOT,'public');
const SCRIPT_PATHS=[
  'engine/js/static-data.js',
  'engine/js/runtime-authority.js',
  'engine/shared-app/active-starters.js',
  'engine/shared-app/app.bundle.js'
];
const HIDDEN_CARD='__GL_HIDDEN_CARD__';
const COMPILED_SCRIPTS=SCRIPT_PATHS.map(rel=>({rel,script:new vm.Script(fs.readFileSync(path.join(PUBLIC,rel),'utf8'),{filename:rel})}));

const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));

function dummyElement(){
  const el={
    style:{setProperty(){},removeProperty(){}},dataset:{},children:[],
    classList:{add(){},remove(){},toggle(){},contains(){return false}},
    appendChild(){return el},replaceChildren(){},remove(){},setAttribute(){},getAttribute(){return null},removeAttribute(){},
    addEventListener(){},removeEventListener(){},querySelector(){return null},querySelectorAll(){return []},matches(){return false},
    focus(){},blur(){},contains(){return false},closest(){return null},
    getBoundingClientRect(){return {left:0,top:0,right:0,bottom:0,width:0,height:0}},
    textContent:'',innerHTML:'',hidden:false,inert:false,tagName:'DIV',nodeType:1,isConnected:true
  };
  return el;
}

function makeHeadlessContext(){
  const body=dummyElement(),head=dummyElement(),html=dummyElement();
  const document={
    readyState:'loading',body,head,documentElement:html,activeElement:null,
    addEventListener(){},removeEventListener(){},getElementById(){return dummyElement()},querySelector(){return dummyElement()},querySelectorAll(){return []},
    createElement(tag){const el=dummyElement();el.tagName=String(tag||'div').toUpperCase();return el;},createDocumentFragment(){return dummyElement();}
  };
  class MutationObserver{constructor(cb){this.cb=cb}observe(){}disconnect(){}}
  class CustomEvent{constructor(type,init){this.type=type;this.detail=init?.detail}}
  class Audio{constructor(src){this.src=src;this.volume=1;this.currentTime=0;this.preload=''}play(){return Promise.resolve()}pause(){}load(){}}
  class Image{constructor(){Object.assign(this,dummyElement());this.complete=true;this.naturalWidth=1}decode(){return Promise.resolve()}}
  const localStorage={getItem(){return null},setItem(){},removeItem(){}};
  const context={
    console,setTimeout,clearTimeout,setInterval,clearInterval,Date,Math,JSON,Promise,URL,
    structuredClone:globalThis.structuredClone,performance:{now:()=>Date.now()},document,
    navigator:{maxTouchPoints:0,userAgent:'GrandisLegacy-Headless-v6913'},location:{href:'http://127.0.0.1/'},localStorage,
    MutationObserver,CustomEvent,Audio,Image,requestAnimationFrame:fn=>setTimeout(()=>fn(Date.now()),0),cancelAnimationFrame:clearTimeout,
    matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),CSS:{escape:v=>String(v)},crypto:crypto.webcrypto
  };
  context.window=context;context.globalThis=context;context.self=context;
  context.window.GL_APP_MODE='PVP';
  context.window.addEventListener=()=>{};context.window.removeEventListener=()=>{};context.window.dispatchEvent=()=>true;
  vm.createContext(context);
  for(const {script} of COMPILED_SCRIPTS)script.runInContext(context,{timeout:30000});
  if(!context.GL_LOCAL_AI_BRIDGE||!context.GL_GAME_ENGINE)throw new Error('v6.91.3 authority surface did not initialize.');
  context.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true);
  context.GL_LOCAL_AI_BRIDGE.setSharedBoardMode(true);
  context.GL_LOCAL_AI_BRIDGE.setExternalHumanUi(true);
  context.GL_GAME_ENGINE.setExternalHumanUi?.(true);
  return context;
}

function normalizeFormation(deck,formation){
  const out=clone(deck||{}),src=out.default_formation||{},f=formation||src,lanes=['LEFT','CENTER','RIGHT'];
  const base=lanes.map(k=>String(src?.[k]||'')),ids=lanes.map(k=>String(f?.[k]||''));
  const valid=base.every(Boolean)&&ids.every(Boolean)&&new Set(ids).size===3&&base.slice().sort().join('|')===ids.slice().sort().join('|');
  if(valid)out.default_formation={LEFT:ids[0],CENTER:ids[1],RIGHT:ids[2]};
  return out;
}

function ownerOfPending(p){return p?.decision_side||p?.response_owner||p?.side||p?.source_side||null}
function assertLocalSeatMayAct(localBoard,intentName){
  const name=String(intentName||''),state=localBoard?.appState||{};
  // Surrender is a player-owned session action and is allowed regardless of phase/turn.
  if(name==='executeConfirmedSurrender')return;
  const pendingOwner=ownerOfPending(state.pending),responseOwner=state.responseWindow?.response_owner||null;
  const owner=pendingOwner||responseOwner||state.turn||null;
  if(owner&&owner!=='PLAYER')throw new Error('NOT_YOUR_ACTION_WINDOW');
}
function maskPending(p,localSide='PLAYER'){
  if(!p)return p;const out=clone(p),owner=ownerOfPending(out);
  if(owner&&owner!==localSide){
    for(const k of ['options','cards','choices','hand','cost_candidates'])if(Array.isArray(out[k]))out[k]=out[k].map(()=>({hidden_identity:true,card_back:true}));
    if(Array.isArray(out.candidates))out.candidates=out.candidates.map((x,i)=>({hidden_identity:true,card_back:true,choice_index:i}));
    out.private_masked=true;return out;
  }
  // Blind opponent-hand selection must never expose card identity before reveal.
  if(out.type==='opponent_hand_choice'&&!out.reveal_cards&&Array.isArray(out.candidates)){
    out.candidates=out.candidates.map((x,i)=>({hand_index:Number(x?.hand_index??i),choice_index:i,card_id:HIDDEN_CARD}));
  }
  return out;
}
function maskResponse(rw,localSide='PLAYER'){
  if(!rw)return rw;const out=clone(rw);if(out.response_owner&&out.response_owner!==localSide){if(Array.isArray(out.options))out.options=out.options.map(()=>({hidden_identity:true,card_back:true}));out.private_masked=true}return out;
}

function viewerSafeLocalBoard(board,{spectator=false}={}){
  const out=clone(board||{}),s=out.appState;if(!s)return out;
  const maskArray=(arr,val=HIDDEN_CARD)=>Array.from({length:Array.isArray(arr)?arr.length:Number(arr?.length||0)},()=>val);
  const playerHand=Array.isArray(s.playerHand)?s.playerHand:[];
  const aiHand=Array.isArray(s.aiHand)?s.aiHand:[];
  s.playerHandCount=playerHand.length;s.aiHandCount=aiHand.length;
  if(spectator)s.playerHand=maskArray(playerHand);
  s.aiHand=maskArray(aiHand);
  for(const k of ['playerDeck','aiDeck']){const a=Array.isArray(s[k])?s[k]:[];s[k==='playerDeck'?'playerDeckCount':'aiDeckCount']=a.length;s[k]=maskArray(a)}
  for(const k of ['playerLegacy','aiLegacy']){const a=Array.isArray(s[k])?s[k]:[];s[k==='playerLegacy'?'playerLegacyCount':'aiLegacyCount']=a.length;if(spectator||k==='aiLegacy')s[k]=maskArray(a)}
  for(const k of ['playerManaDeck','aiManaDeck']){const a=Array.isArray(s[k])?s[k]:[];s[k]=Array.from({length:a.length},(_,i)=>({hidden_identity:true,slot_index:i}))}
  if(s.lastDrawnCardBySide&&typeof s.lastDrawnCardBySide==='object'){s.lastDrawnCardBySide.AI=HIDDEN_CARD;if(spectator)s.lastDrawnCardBySide.PLAYER=HIDDEN_CARD}
  if(Array.isArray(s.presentationEvents))s.presentationEvents=s.presentationEvents.map(e=>{const x=clone(e);if(x?.type==='CARD_DRAWN'&&(spectator||x.side==='AI'))x.card_id=HIDDEN_CARD;return x});
  s.pending=spectator?maskPending(s.pending,null):maskPending(s.pending,'PLAYER');
  s.responseWindow=spectator?maskResponse(s.responseWindow,null):maskResponse(s.responseWindow,'PLAYER');
  if(Array.isArray(s.log))s.log=s.log.slice(-24);
  s.pvpPrivateStateMasked=true;
  out.pvpPrivateStateMasked=true;
  return out;
}

function localizeOpening(opening,seat){
  if(!opening)return null;const out=clone(opening);const swap=side=>Number(seat)===2?(side==='PLAYER'?'AI':side==='AI'?'PLAYER':side):side;
  const mapEvent=e=>{const x=clone(e);if(x?.side)x.side=swap(x.side);if(x?.actor_side)x.actor_side=swap(x.actor_side);if(x?.source_side)x.source_side=swap(x.source_side);if(x?.target_side)x.target_side=swap(x.target_side);if(x?.type==='CARD_DRAWN'&&x.side==='AI')x.card_id=HIDDEN_CARD;return x};
  out.handEvents=(out.handEvents||[]).map(mapEvent);out.manaEvents=(out.manaEvents||[]).map(e=>{const x=clone(e);if(x?.side)x.side=swap(x.side);return x});
  out.firstSide=Number(out.firstSeat)===Number(seat)?'PLAYER':'AI';
  return out;
}

export function sourceHashes(){
  const out={};for(const rel of SCRIPT_PATHS){const b=fs.readFileSync(path.join(PUBLIC,rel));out[rel]=crypto.createHash('sha256').update(b).digest('hex')}return out;
}

export class V6913Authority{
  constructor(){this.ctx=makeHeadlessContext();this.bridge=this.ctx.GL_LOCAL_AI_BRIDGE;this.game=this.ctx.GL_GAME_ENGINE;this.canonical=null;this.revision=0;this.opening=null;this.starters=clone(this.bridge.getStarterDeckOptions?.()||{})}
  deckForSelection(sel){if(sel?.customDeck)return normalizeFormation(sel.customDeck,sel.formation);const opt=this.starters?.[sel?.deckKey];if(!opt?.deck)throw new Error('Unknown starter deck: '+String(sel?.deckKey||''));return normalizeFormation(opt.deck,sel.formation)}
  start({p1,p2}){
    const board=this.bridge.startSharedMatch({player1Name:p1.name,player2Name:p2.name,playerDeck:this.deckForSelection(p1),player2Deck:this.deckForSelection(p2)});
    this.canonical=clone(board);this.revision=1;return this.snapshot();
  }
  snapshot(){return clone(this.canonical)}
  commitOpening({choice,outcome,firstSeat}){
    if(!this.canonical)throw new Error('Match not initialized.');this.bridge.importCanonicalSnapshot(this.canonical,1,{skipImportAnimations:true});
    const firstSide=Number(firstSeat)===2?'AI':'PLAYER';const r=this.game.commitOpeningSetup(choice,outcome,firstSide);if(!r?.ok)throw new Error(r?.error||'Opening setup failed.');
    this.canonical=this.bridge.getCanonicalSnapshot(1);this.revision++;
    this.opening={choice,outcome,firstSeat:Number(firstSeat),firstSide,handEvents:clone(r.handEvents||[]),manaEvents:clone(r.manaEvents||[])};
    return {board:this.snapshot(),opening:clone(this.opening),revision:this.revision};
  }
  beginFirstTurn(firstSeat){
    if(!this.canonical)throw new Error('Match not initialized.');
    const seat=Number(firstSeat)===2?2:1;
    // Always execute the active remote human as v6's local PLAYER. Seat orientation
    // is the handshake boundary; calling beginFirstTurn('AI') would invoke Local AI.
    this.bridge.importCanonicalSnapshot(this.canonical,seat,{skipImportAnimations:true});
    const r=this.game.beginFirstTurn('PLAYER');if(!r?.ok)throw new Error(r?.error||'First turn failed.');
    this.canonical=this.bridge.getCanonicalSnapshot(seat);this.revision++;return {board:this.snapshot(),revision:this.revision};
  }
  applyIntent(seat,name,args=[]){
    if(!this.canonical)throw new Error('Match not initialized.');const viewSeat=Number(seat)===2?2:1;this.bridge.importCanonicalSnapshot(this.canonical,viewSeat,{skipImportAnimations:true});
    assertLocalSeatMayAct(this.bridge.getSnapshot(),name);
    const result=this.bridge.applyServerIntent(String(name||''),Array.isArray(args)?clone(args):[]);if(!result?.ok)throw new Error(result?.error||('Intent rejected: '+name));
    this.canonical=this.bridge.getCanonicalSnapshot(viewSeat);this.revision++;return {board:this.snapshot(),revision:this.revision};
  }
  applyIntentBatch(seat,steps=[]){
    if(!this.canonical)throw new Error('Match not initialized.');if(!Array.isArray(steps)||!steps.length)throw new Error('Intent batch is empty.');
    const viewSeat=Number(seat)===2?2:1;this.bridge.importCanonicalSnapshot(this.canonical,viewSeat,{skipImportAnimations:true});
    assertLocalSeatMayAct(this.bridge.getSnapshot(),steps[0]?.name);
    const results=[];let any=false;
    for(const step of steps.slice(0,8)){
      const name=String(step?.name||''),args=Array.isArray(step?.args)?clone(step.args):[];if(!name)continue;
      const r=this.bridge.applyServerIntent(name,args);results.push({name,ok:!!r?.ok,error:r?.error||null});if(r?.ok)any=true;
      if(!r?.ok&&/Unknown Local AI runtime intent/i.test(String(r?.error||'')))throw new Error(r.error);
    }
    if(!any)throw new Error(results.map(x=>x.error).filter(Boolean).join('; ')||'Intent batch rejected.');
    this.canonical=this.bridge.getCanonicalSnapshot(viewSeat);this.revision++;
    return {board:this.snapshot(),revision:this.revision,results};
  }
  viewForSeat(seat){
    if(!this.canonical)return null;const n=Number(seat)===2?2:1;this.bridge.importCanonicalSnapshot(this.canonical,n,{skipImportAnimations:true});
    return viewerSafeLocalBoard(this.bridge.getSnapshot(),{spectator:false});
  }
  viewForSpectator(){return this.canonical?viewerSafeLocalBoard(this.canonical,{spectator:true}):null}
  openingForSeat(seat){return localizeOpening(this.opening,seat)}
  runNativeSelfTest(name){const fn=this.ctx?.[String(name||'')];if(typeof fn!=='function')throw new Error('Unknown v6.91.3 native self-test: '+String(name||''));return clone(fn())}
}

export const internals={viewerSafeLocalBoard,localizeOpening,HIDDEN_CARD};
