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
const ALLOWED_INTENT_BATCH_PAIRS=new Set([
  'responseSelectNoStuck>confirmSelectedResponse',
  'selectStatusRemovalChoice>handleChoiceConfirm',
  'selectSaintPurifyChoice>handleChoiceConfirm',
  'selectCardSearchChoice>handleChoiceConfirm',
  'toggleDiscardIndex>handleChoiceConfirm',
  'selectResponsePaymentChoice>commitResponsePaymentChoice',
  'selectLegacyCostChoice>handleChoiceConfirm'
]);
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
    navigator:{maxTouchPoints:0,userAgent:'GrandisLegacy-Headless-v6916'},location:{href:'http://127.0.0.1/'},localStorage,
    MutationObserver,CustomEvent,Audio,Image,requestAnimationFrame:fn=>setTimeout(()=>fn(Date.now()),0),cancelAnimationFrame:clearTimeout,
    matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),CSS:{escape:v=>String(v)},crypto:crypto.webcrypto
  };
  context.window=context;context.globalThis=context;context.self=context;
  context.window.GL_APP_MODE='PVP';
  context.window.addEventListener=()=>{};context.window.removeEventListener=()=>{};context.window.dispatchEvent=()=>true;
  vm.createContext(context);
  for(const {script} of COMPILED_SCRIPTS)script.runInContext(context,{timeout:30000});
  if(!context.GL_LOCAL_AI_BRIDGE||!context.GL_GAME_ENGINE)throw new Error('v6.91.6 authority surface did not initialize.');
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


function swapExactSide(v){return v==='PLAYER'?'AI':v==='AI'?'PLAYER':v}
function swapTextSides(v){
  if(typeof v!=='string')return v;
  return v.replace(/\bPLAYER\b/g,'__GLP__').replace(/\bAI\b/g,'PLAYER').replace(/__GLP__/g,'AI');
}
function deepSwapSides(value){
  if(Array.isArray(value))return value.map(deepSwapSides);
  if(value&&typeof value==='object'){
    const out={};for(const [k,v] of Object.entries(value))out[k]=deepSwapSides(v);return out;
  }
  return swapExactSide(value);
}
function swapSideMapKeys(map){
  if(!map||typeof map!=='object'||Array.isArray(map))return;
  const v=map.PLAYER;map.PLAYER=map.AI;map.AI=v;
}
// Server-owned actor-local seat mirroring. Do not depend on the donor bridge's legacy
// seat-2 mirror because it does not cover Shard ownership/map keys consistently.
// This transform is intentionally involutive: applying it twice restores canonical seat 1.
function mirrorSeatState(state){
  if(!state)return state;
  const s=deepSwapSides(clone(state));
  const sw=(a,b)=>{const ha=Object.hasOwn(s,a),hb=Object.hasOwn(s,b),va=s[a],vb=s[b];if(!ha&&!hb)return;if(hb)s[a]=vb;else delete s[a];if(ha)s[b]=va;else delete s[b]};
  for(const [a,b] of [
    ['mana','aiMana'],['manaRegen','aiManaRegen'],['racial','aiRacial'],
    ['playerDeck','aiDeck'],['playerHand','aiHand'],['playerDiscard','aiDiscard'],
    ['playerHeroes','aiHeroes'],['playerLegacy','aiLegacy'],
    ['playerLegacyPackageSlots','aiLegacyPackageSlots'],['playerDeckName','aiDeckName'],
    ['playerDeckCount','aiDeckCount'],['playerLegacyCount','aiLegacyCount'],
    ['playerManaDeck','aiManaDeck'],['playerManaPoolCards','aiManaPoolCards'],
    ['playerManaClasses','aiManaClasses'],['playerManaDeckCount','aiManaDeckCount']
  ])sw(a,b);
  for(const k of ['pvpPlayerNames','pvpActionEventsBySide','cardsDrawnThisTurn','lastDrawnCardBySide','manualRepositionUsedTurnKey'])swapSideMapKeys(s[k]);
  if(Array.isArray(s.log))s.log=s.log.map(swapTextSides);
  return s;
}
function localizeBoardForSeat(board,seat){
  const out=clone(board);
  if(Number(seat)===2&&out?.appState)out.appState=mirrorSeatState(out.appState);
  return out;
}
function canonicalizeBoardFromSeat(board,seat){return localizeBoardForSeat(board,seat)}

function ownerOfPending(p){return p?.decision_side||p?.response_owner||p?.side||p?.source_side||null}
function assertLocalSeatMayAct(localBoard,intentName){
  const name=String(intentName||''),state=localBoard?.appState||{};
  // Surrender is a player-owned session action and is allowed regardless of phase/turn.
  if(name==='executeConfirmedSurrender')return;
  const pendingOwner=ownerOfPending(state.pending),responseOwner=state.responseWindow?.response_owner||null;
  const owner=pendingOwner||responseOwner||state.turn||null;
  if(owner&&owner!=='PLAYER')throw new Error('NOT_YOUR_ACTION_WINDOW');
}
function publicPendingProjection(p){
  if(!p)return p;
  const out={type:String(p.type||'private_choice'),private_masked:true};
  for(const k of ['decision_side','response_owner','side','source_side','target_side','commit_stage','continuation_from','choice_zone']){
    if(p[k]!=null)out[k]=p[k];
  }
  for(const k of ['committed','multi_select'])if(typeof p[k]==='boolean')out[k]=p[k];
  for(const k of ['required','required_count','max_count'])if(Number.isFinite(Number(p[k])))out[k]=Number(p[k]);
  return out;
}
function maskPending(p,localSide='PLAYER'){
  if(!p)return p;const out=clone(p),owner=ownerOfPending(out);
  // A viewer must never receive the nested payload of another seat's private choice.
  // This is an allow-list projection rather than a blacklist so newly-added donor fields
  // (card_id, drawn_card_id, selected_order, shard_choices, action/rw snapshots, etc.)
  // cannot silently become network leaks in future updates.
  if(localSide===null||(owner&&owner!==localSide)||(!owner&&out.type!=='response_window'))return publicPendingProjection(out);
  // Blind opponent-hand selection must never expose card identity before reveal.
  if(out.type==='opponent_hand_choice'&&!out.reveal_cards&&Array.isArray(out.candidates)){
    out.candidates=out.candidates.map((_,i)=>({choice_index:i,card_id:HIDDEN_CARD,hidden_identity:true,card_back:true}));
  }
  // Keep the donor's shuffled candidate UIDs intact for the acting player. v6.91.6
  // renders these candidates face-down, but its choice UI resolves each shuffled candidate
  // back to the visible opponent Shard Pool by UID. Replacing those UIDs breaks selection.
  return out;
}
function maskResponse(rw,localSide='PLAYER'){
  if(!rw)return rw;const out=clone(rw);if(localSide===null||(out.response_owner&&out.response_owner!==localSide)){if(Array.isArray(out.options))out.options=out.options.map(()=>({hidden_identity:true,card_back:true}));out.private_masked=true}return out;
}
function collectCardIds(value,out=new Set()){
  if(typeof value==='string'){if(/^S1-[A-Z0-9-]+$/i.test(value))out.add(value);return out}
  if(Array.isArray(value)){for(const v of value)collectCardIds(v,out);return out}
  if(value&&typeof value==='object')for(const v of Object.values(value))collectCardIds(v,out);
  return out;
}
function sanitizeViewerLogs(log,{pending=null,localSide='PLAYER',cardNames={}}={}){
  const rows=Array.isArray(log)?log.slice():[],owner=ownerOfPending(pending);
  const hidePending=!!pending&&(localSide===null||(owner&&owner!==localSide)||(!owner&&pending.type!=='response_window'));
  const hiddenIds=hidePending?collectCardIds(pending):new Set();
  const hiddenTerms=[];for(const id of hiddenIds){hiddenTerms.push(id);const n=cardNames?.[id];if(n)hiddenTerms.push(String(n))}
  const prompt=/\bchoose\b|\boffers draw review\b|\bopens compact card choice ui\b/i;
  return rows.map(line=>{
    let text=String(line??'');
    // Instructional choice logs are local UI state, not public battle history. Dropping
    // them also prevents pre-commit card names from becoming visible to the other seat.
    if(prompt.test(text))return null;
    if(/cancelled pending action/i.test(text))return 'A pending action was cancelled before commitment.';
    if(/Card play rollback restored .* to Hand after a resolver failure/i.test(text))return text.replace(/restored .* to Hand after a resolver failure/i,'restored the attempted card to Hand after a resolver failure');
    if(/cannot add .* as EXP because/i.test(text))return text.replace(/cannot add .* as EXP because/i,'cannot add the chosen Hand card as EXP because');
    if(/adds chosen .* from deck to hand/i.test(text))return 'A searched card is added from the Main Deck to Hand.';
    if(/adds .* to hand and shuffles the Main Deck under the hidden-information rule/i.test(text))return text.replace(/adds .* to hand and shuffles the Main Deck under the hidden-information rule/i,'adds a searched card to hand and shuffles the Main Deck under the hidden-information rule');
    if(/offers draw review/i.test(text))return 'A private draw review is pending.';
    // Hidden-zone review results remain private even after the pending object clears.
    // Neutralize the durable log entry itself, otherwise a later snapshot can reveal
    // the reviewed card/order after there is no longer any pending payload to redact.
    if(/returns .* to Main Deck, shuffles, then redraws/i.test(text))return 'A reviewed Draw is returned to the Main Deck, shuffled, then redrawn.';
    if(/(?:Quick Reload|Rapid Chamber|Draw Review).*\bkeeps\b/i.test(text))return 'A reviewed Draw is kept.';
    if(/looks at top \d+ card\(s\):/i.test(text))return text.replace(/looks at top (\d+) card\(s\):.*$/i,'privately inspects the top $1 card(s).');
    if(/returns top \d+ card\(s\) in chosen order:/i.test(text))return 'Crystal Ball returns the inspected cards to the Main Deck in the chosen order.';
    // The exact Class-Shard composition is private network state; only deck size/setup
    // is public. The donor's initialization log listed both players' classes verbatim.
    if(/^Shard Deck: .*Each Shard Deck starts at 12 cards/i.test(text))return 'Shard Decks initialized at 12 cards each. Starting Shards are drawn after the Opening Hand.';
    for(const term of hiddenTerms){if(!term)continue;text=text.split(term).join('Hidden Card')}
    return text;
  }).filter(Boolean);
}

function viewerSafeLocalBoard(board,{spectator=false,cardNames={}}={}){
  const out=clone(board||{}),s=out.appState;if(!s)return out;
  const rawPending=clone(s.pending);
  const maskArray=(arr,val=HIDDEN_CARD)=>Array.from({length:Array.isArray(arr)?arr.length:Number(arr?.length||0)},()=>val);
  const playerHand=Array.isArray(s.playerHand)?s.playerHand:[];
  const aiHand=Array.isArray(s.aiHand)?s.aiHand:[];
  s.playerHandCount=playerHand.length;s.aiHandCount=aiHand.length;
  if(spectator)s.playerHand=maskArray(playerHand);
  s.aiHand=maskArray(aiHand);
  for(const k of ['playerDeck','aiDeck']){const a=Array.isArray(s[k])?s[k]:[];s[k==='playerDeck'?'playerDeckCount':'aiDeckCount']=a.length;s[k]=maskArray(a)}
  for(const k of ['playerLegacy','aiLegacy']){const a=Array.isArray(s[k])?s[k]:[];s[k==='playerLegacy'?'playerLegacyCount':'aiLegacyCount']=a.length;if(spectator||k==='aiLegacy')s[k]=maskArray(a)}
  const maskLegacyPackages=(arr,prefix)=>Array.from({length:Array.isArray(arr)?arr.length:0},(_,i)=>({hidden_identity:true,slot_index:i,slot:arr?.[i]?.slot||null,package_id:`${prefix}-${i}`}));
  if(spectator)s.playerLegacyPackageSlots=maskLegacyPackages(s.playerLegacyPackageSlots,'hidden-player-legacy-package');
  s.aiLegacyPackageSlots=maskLegacyPackages(s.aiLegacyPackageSlots,'hidden-opponent-legacy-package');
  for(const k of ['playerManaDeck','aiManaDeck']){const a=Array.isArray(s[k])?s[k]:[];s[k]=Array.from({length:a.length},(_,i)=>({hidden_identity:true,slot_index:i}))}
  // Shard Pools are public battlefield state in v6.91.6. The cards stay visible during
  // normal play; only the *choice presentation* becomes face-down for effects that choose
  // an opponent Shard. Preserve exact objects/UIDs so donor rendering and payment/choice
  // lookup semantics remain intact.
  // Preserve visible Shard Pool cards, but do not expose the hidden composition of
  // Shards that have not entered the battlefield. The local player keeps their own
  // class inventory; the opponent's inventory remains private network metadata.
  if(s.aiManaClasses)s.aiManaClasses=[];
  if(spectator&&s.playerManaClasses)s.playerManaClasses=[];
  if(s.lastDrawnCardBySide&&typeof s.lastDrawnCardBySide==='object'){s.lastDrawnCardBySide.AI=HIDDEN_CARD;if(spectator)s.lastDrawnCardBySide.PLAYER=HIDDEN_CARD}
  if(s.lastActualDrawEvent&&typeof s.lastActualDrawEvent==='object'&&(spectator||s.lastActualDrawEvent.side==='AI'))s.lastActualDrawEvent.card_id=HIDDEN_CARD;
  if(Array.isArray(s.presentationEvents))s.presentationEvents=s.presentationEvents.map(e=>{const x=clone(e);if(x?.type==='CARD_DRAWN'&&(spectator||x.side==='AI'))x.card_id=HIDDEN_CARD;return x});
  s.pending=spectator?maskPending(rawPending,null):maskPending(rawPending,'PLAYER');
  s.responseWindow=spectator?maskResponse(s.responseWindow,null):maskResponse(s.responseWindow,'PLAYER');
  s.log=sanitizeViewerLogs(s.log,{pending:rawPending,localSide:spectator?null:'PLAYER',cardNames});
  s.pvpPrivateStateMasked=true;
  out.pvpPrivateStateMasked=true;
  return out;
}

function localizeOpening(opening,seat){
  if(!opening)return null;const out=clone(opening);const swap=side=>Number(seat)===2?(side==='PLAYER'?'AI':side==='AI'?'PLAYER':side):side;
  const mapEvent=e=>{const x=clone(e);if(x?.side)x.side=swap(x.side);if(x?.actor_side)x.actor_side=swap(x.actor_side);if(x?.source_side)x.source_side=swap(x.source_side);if(x?.target_side)x.target_side=swap(x.target_side);if(x?.type==='CARD_DRAWN'&&x.side==='AI')x.card_id=HIDDEN_CARD;return x};
  out.handEvents=(out.handEvents||[]).map(mapEvent);
  out.manaEvents=(out.manaEvents||[]).map((e)=>{
    const x=clone(e);if(x?.side)x.side=swap(x.side);
    // Opening animation in v6.91.6 hides the on-board Shard by its real UID until the
    // face-down flying card arrives. Preserve that UID for both sides; otherwise the
    // destination lookup misses and opening presentation diverges/double-falls back.
    if(typeof x?.asset==='string'){const m=x.asset.match(/([^/]+\.webp)(?:\?.*)?$/i);if(m)x.asset='assets/shards/'+m[1]}
    return x;
  });
  out.firstSide=Number(out.firstSeat)===Number(seat)?'PLAYER':'AI';
  return out;
}

export function sourceHashes(){
  const out={};for(const rel of SCRIPT_PATHS){const b=fs.readFileSync(path.join(PUBLIC,rel));out[rel]=crypto.createHash('sha256').update(b).digest('hex')}return out;
}

export class V6916Authority{
  constructor(){this.ctx=makeHeadlessContext();this.bridge=this.ctx.GL_LOCAL_AI_BRIDGE;this.game=this.ctx.GL_GAME_ENGINE;this.canonical=null;this.revision=0;this.opening=null;this.battlePresentationSequence=0;this.starters=clone(this.bridge.getStarterDeckOptions?.()||{});this.cardNames=Object.fromEntries((this.ctx.GL_CARD_DEFINITIONS?.cards||[]).map(c=>[String(c.card_id||''),String(c.name||c.card_name||c.card_id||'')]).filter(x=>x[0]))}
  clearBattleFeedback(){try{return this.bridge.drainBattleFeedback?.()||[]}catch{return[]}}
  drainBattleFeedbackForCanonicalSeat(seat){
    const rows=this.clearBattleFeedback(),viewSeat=Number(seat)===2?2:1;
    return rows.map(raw=>{
      let x=clone(raw||{});delete x.id;delete x._sound_played;
      if(viewSeat===2)x=deepSwapSides(x);
      return x;
    }).filter(x=>x&&['attack','heal'].includes(String(x.kind||''))&&['PLAYER','AI'].includes(String(x.side||''))&&x.lane);
  }
  appendBattlePresentation(rows=[]){
    const state=this.canonical?.appState;if(!state||!rows.length)return;
    if(!Array.isArray(state.presentationEvents))state.presentationEvents=[];
    for(const row of rows){
      state.presentationEvents.push({
        id:'PVP-BATTLE-'+(++this.battlePresentationSequence),type:'BATTLE_FEEDBACK',
        kind:String(row.kind||''),outcome:row.outcome==null?null:String(row.outcome),side:row.side,lane:String(row.lane||''),
        card_id:row.card_id==null?null:String(row.card_id),attack_kind:row.attack_kind==null?null:String(row.attack_kind),
        defense_kind:row.defense_kind==null?null:String(row.defense_kind),has_damage:!!row.has_damage,play_sound:row.play_sound!==false
      });
    }
    if(state.presentationEvents.length>200)state.presentationEvents=state.presentationEvents.slice(-200);
  }
  deckForSelection(sel){if(sel?.customDeck)return normalizeFormation(sel.customDeck,sel.formation);const opt=this.starters?.[sel?.deckKey];if(!opt?.deck)throw new Error('Unknown starter deck: '+String(sel?.deckKey||''));return normalizeFormation(opt.deck,sel.formation)}
  start({p1,p2}){
    const board=this.bridge.startSharedMatch({player1Name:p1.name,player2Name:p2.name,playerDeck:this.deckForSelection(p1),player2Deck:this.deckForSelection(p2)});
    this.canonical=clone(board);this.revision=1;return this.snapshot();
  }
  snapshot(){return clone(this.canonical)}
  commitOpening({choice,outcome,firstSeat}){
    if(!this.canonical)throw new Error('Match not initialized.');this.ctx.GL_PVP_LOCAL_SEAT=1;this.bridge.importSnapshot(localizeBoardForSeat(this.canonical,1),{skipImportAnimations:true});
    const firstSide=Number(firstSeat)===2?'AI':'PLAYER';const r=this.game.commitOpeningSetup(choice,outcome,firstSide);if(!r?.ok)throw new Error(r?.error||'Opening setup failed.');
    this.canonical=canonicalizeBoardFromSeat(this.bridge.getSnapshot(),1);this.revision++;
    this.opening={choice,outcome,firstSeat:Number(firstSeat),firstSide,handEvents:clone(r.handEvents||[]),manaEvents:clone(r.manaEvents||[])};
    return {board:this.snapshot(),opening:clone(this.opening),revision:this.revision};
  }
  autoAdvanceResolvedHumanDraw(){
    const canonicalState=this.canonical?.appState;if(!canonicalState||canonicalState.gameOver)return false;
    const activeSeat=canonicalState.turn==='AI'?2:canonicalState.turn==='PLAYER'?1:null;if(!activeSeat)return false;
    this.ctx.GL_PVP_LOCAL_SEAT=activeSeat;this.bridge.importSnapshot(localizeBoardForSeat(this.canonical,activeSeat),{skipImportAnimations:true});
    const localState=this.bridge.getSnapshot()?.appState;
    // v6.91.6 Local play auto-advances Draw -> Deploy once mandatory Draw, replacements,
    // and Mana Regen are complete. Shared-board mode suppresses that browser timer, so the
    // server reproduces the same terminal transition only when the donor says Draw is done.
    if(!localState||localState.turn!=='PLAYER'||localState.phase!=='Draw'||localState.drawPhaseResolvedFor!=='PLAYER'||localState.drawPresentationPending||localState.pending||localState.responseWindow||localState.gameOver)return false;
    const r=this.bridge.applyServerIntent('advancePhase',[]);if(!r?.ok)throw new Error(r?.error||'Automatic Draw-to-Deploy transition failed.');
    this.canonical=canonicalizeBoardFromSeat(this.bridge.getSnapshot(),activeSeat);this.revision++;return true;
  }
  beginFirstTurn(firstSeat){
    if(!this.canonical)throw new Error('Match not initialized.');
    const seat=Number(firstSeat)===2?2:1;
    // Always execute the active remote human as v6's local PLAYER. Seat orientation
    // is the handshake boundary; calling beginFirstTurn('AI') would invoke Local AI.
    this.ctx.GL_PVP_LOCAL_SEAT=seat;this.bridge.importSnapshot(localizeBoardForSeat(this.canonical,seat),{skipImportAnimations:true});
    const r=this.game.beginFirstTurn('PLAYER');if(!r?.ok)throw new Error(r?.error||'First turn failed.');
    this.canonical=canonicalizeBoardFromSeat(this.bridge.getSnapshot(),seat);this.revision++;this.autoAdvanceResolvedHumanDraw();return {board:this.snapshot(),revision:this.revision};
  }
  autoResolveMeaninglessOpponentShardChoice(){
    const board=this.bridge.getSnapshot(),state=board?.appState,p=state?.pending;if(p?.type!=='opponent_mana_selection')return false;
    const owner=p.decision_side||p.side||null;if(owner&&owner!=='PLAYER')return false;
    const target=p.target_side==='PLAYER'?'PLAYER':'AI',pool=target==='PLAYER'?(state.playerManaPoolCards||[]):(state.aiManaPoolCards||[]),required=Math.min(Math.max(0,Number(p.required_count||1)),Number((p.candidates||[]).length));
    const noMeaningfulChoice=required>=pool.length||!pool.some(sh=>sh&&sh.kind==='CLASS');if(!noMeaningfulChoice)return false;
    for(let i=0;i<required;i++){const pick=this.bridge.applyServerIntent('selectOpponentManaChoice',[i]);if(!pick?.ok)throw new Error(pick?.error||'Automatic opponent Shard selection failed.')}
    const commit=this.bridge.applyServerIntent('commitOpponentManaSelection',[]);if(!commit?.ok)throw new Error(commit?.error||'Automatic opponent Shard commit failed.');return true;
  }
  applyFinalPaymentDraft(name,args=[]){
    const board=this.bridge.getSnapshot(),state=board?.appState,pending=state?.pending;
    const isMana=name==='commitManaShardPaymentChoice',isResponse=name==='commitResponsePaymentChoice';
    if(!isMana&&!isResponse)return null;
    if(isMana&&pending?.type!=='mana_shard_payment_choice')throw new Error('MANA_PAYMENT_NOT_PENDING');
    if(isResponse&&pending?.type!=='response_payment_choice')throw new Error('RESPONSE_PAYMENT_NOT_PENDING');
    // PvP payment seam: Shard clicking changes only an ephemeral centered UI UID draft.
    // PAY submits the final canonical UIDs once; the server validates ownership/pool
    // identity, injects only that submitted selection into the authoritative pending
    // object, then lets the untouched donor commit routine validate exact Mana value.
    if(Array.isArray(args?.[0])){
      const raw=args[0].map(x=>String(x||'')).filter(Boolean);
      if(raw.length>12)throw new Error('TOO_MANY_PAYMENT_SHARDS');
      const uids=[...new Set(raw)];
      if(uids.length!==raw.length)throw new Error('DUPLICATE_PAYMENT_SHARD_UID');
      const side=pending.side==='AI'?'AI':'PLAYER',pool=side==='AI'?(state.aiManaPoolCards||[]):(state.playerManaPoolCards||[]),byUid=new Map(pool.map(sh=>[String(sh?.uid||''),sh]));
      for(const uid of uids)if(!byUid.has(uid))throw new Error('PAYMENT_SHARD_NOT_IN_POOL');
      pending.selected_shard_uids=uids.slice();
      const classUids=uids.filter(uid=>byUid.get(uid)?.kind==='CLASS');
      pending.selected_class_uids=classUids.slice();
      if(isResponse)pending.selected_mana_class_uids=classUids.slice();
    }
    if(isResponse&&Array.isArray(args?.[1])){
      const raw=args[1].map(Number);
      if(raw.some(x=>!Number.isInteger(x)||x<0))throw new Error('INVALID_RESPONSE_PAYMENT_INDEX');
      const indices=[...new Set(raw)];
      if(indices.length!==raw.length)throw new Error('DUPLICATE_RESPONSE_PAYMENT_INDEX');
      const max=(pending.candidates||[]).length;
      if(indices.some(x=>x>=max))throw new Error('RESPONSE_PAYMENT_INDEX_OUT_OF_RANGE');
      pending.selected_indices=indices;
    }
    this.bridge.importSnapshot(board,{skipImportAnimations:true});
    return this.bridge.applyServerIntent(name,[]);
  }
  applyIntent(seat,name,args=[]){
    if(!this.canonical)throw new Error('Match not initialized.');const viewSeat=Number(seat)===2?2:1;this.ctx.GL_PVP_LOCAL_SEAT=viewSeat;this.bridge.importSnapshot(localizeBoardForSeat(this.canonical,viewSeat),{skipImportAnimations:true});
    // Battle VFX/audio are transient donor runtime events, not gameplay state. Start every
    // authoritative action with an empty presentation queue so only this action's result ships.
    this.clearBattleFeedback();
    assertLocalSeatMayAct(this.bridge.getSnapshot(),name);
    const cleanArgs=Array.isArray(args)?clone(args):[],intentName=String(name||'');
    const result=(intentName==='commitManaShardPaymentChoice'||intentName==='commitResponsePaymentChoice')?this.applyFinalPaymentDraft(intentName,cleanArgs):this.bridge.applyServerIntent(intentName,cleanArgs);if(!result?.ok){this.clearBattleFeedback();throw new Error(result?.error||('Intent rejected: '+name))}
    this.autoResolveMeaninglessOpponentShardChoice();
    const battleRows=this.drainBattleFeedbackForCanonicalSeat(viewSeat);
    this.canonical=canonicalizeBoardFromSeat(this.bridge.getSnapshot(),viewSeat);this.revision++;this.appendBattlePresentation(battleRows);this.autoAdvanceResolvedHumanDraw();return {board:this.snapshot(),revision:this.revision};
  }
  applyIntentBatch(seat,steps=[]){
    if(!this.canonical)throw new Error('Match not initialized.');if(!Array.isArray(steps)||steps.length!==2)throw new Error('Intent batch must contain exactly two approved atomic steps.');
    const pair=steps.map(step=>String(step?.name||'')).join('>');if(!ALLOWED_INTENT_BATCH_PAIRS.has(pair))throw new Error('INTENT_BATCH_NOT_ALLOWED');
    const viewSeat=Number(seat)===2?2:1;this.ctx.GL_PVP_LOCAL_SEAT=viewSeat;this.bridge.importSnapshot(localizeBoardForSeat(this.canonical,viewSeat),{skipImportAnimations:true});this.clearBattleFeedback();
    const results=[];let any=false,battleRows=[];
    try{
      for(const step of steps){
        const name=String(step?.name||''),args=Array.isArray(step?.args)?clone(step.args):[];if(!name)throw new Error('Intent batch step is missing a name.');
        // Re-check ownership after every state transition. A valid first step must never grant
        // a stale second step permission merely because both arrived in one transport packet.
        assertLocalSeatMayAct(this.bridge.getSnapshot(),name);
        const r=this.bridge.applyServerIntent(name,args);results.push({name,ok:!!r?.ok,error:r?.error||null});
        if(!r?.ok)throw new Error(r?.error||('Intent batch step rejected: '+name));
        this.autoResolveMeaninglessOpponentShardChoice();battleRows.push(...this.drainBattleFeedbackForCanonicalSeat(viewSeat));any=true;
      }
    }catch(err){this.clearBattleFeedback();throw err}
    if(!any)throw new Error('Intent batch rejected.');
    this.canonical=canonicalizeBoardFromSeat(this.bridge.getSnapshot(),viewSeat);this.revision++;this.appendBattlePresentation(battleRows);this.autoAdvanceResolvedHumanDraw();
    return {board:this.snapshot(),revision:this.revision,results};
  }
  viewForSeat(seat){
    if(!this.canonical)return null;const n=Number(seat)===2?2:1;
    return viewerSafeLocalBoard(localizeBoardForSeat(this.canonical,n),{spectator:false,cardNames:this.cardNames});
  }
  viewForSpectator(){return this.canonical?viewerSafeLocalBoard(this.canonical,{spectator:true,cardNames:this.cardNames}):null}
  openingForSeat(seat){return localizeOpening(this.opening,seat)}
  runNativeSelfTest(name){const fn=this.ctx?.[String(name||'')];if(typeof fn!=='function')throw new Error('Unknown v6.91.6 native self-test: '+String(name||''));return clone(fn())}
}

export const internals={viewerSafeLocalBoard,localizeOpening,mirrorSeatState,localizeBoardForSeat,maskPending,sanitizeViewerLogs,HIDDEN_CARD};
