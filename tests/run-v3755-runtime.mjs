import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { normalizeHeadlessRuntimeMetadata } from '../server/headless-runtime-compat.mjs';
const root=resolve(new URL('..',import.meta.url).pathname);

function createRuntime(files,label){
  const code=files.map(f=>readFileSync(join(root,f),'utf8')).join('\n');
  const dummy={style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},removeAttribute(){},querySelectorAll(){return[]},querySelector(){return null},closest(){return null},focus(){},scrollIntoView(){},click(){},getBoundingClientRect(){return{left:0,top:0,width:0,height:0,right:0,bottom:0}},disabled:false,value:'',checked:false,get innerHTML(){return this._h||''},set innerHTML(v){this._h=String(v??'')},get textContent(){return this._t||''},set textContent(v){this._t=String(v??'')}};
  const doc={readyState:'loading',body:dummy,documentElement:dummy,addEventListener(){},removeEventListener(){},getElementById(){return dummy},querySelectorAll(){return[]},querySelector(){return null},createElement(){return {...dummy,style:{},classList:dummy.classList}},createDocumentFragment(){return dummy}};
  const win={document:doc,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,requestAnimationFrame:(fn)=>setTimeout(fn,0),cancelAnimationFrame:clearTimeout,console,GL_PVP_SHARED_BOARD_ACTIVE:true,GL_APP_MODE:'PVP'};
  const ctx={window:win,document:doc,console,setTimeout,clearTimeout,requestAnimationFrame:win.requestAnimationFrame,cancelAnimationFrame:clearTimeout,URL,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}},localStorage:{getItem(){return null},setItem(){},removeItem(){}},navigator:{},location:{href:'http://localhost/'},performance:{now:()=>0},Image:class{}};
  ctx.globalThis=ctx;win.window=win;win.globalThis=ctx;
  vm.createContext(ctx);
  new vm.Script(code,{filename:label}).runInContext(ctx,{timeout:7000});
  normalizeHeadlessRuntimeMetadata(win);
  return win;
}

const starterKey='starter_01_elemental_lord_conqueror_renegade';

// Browser side: keep the latest v6.90.7-derived presentation/runtime and verify seat mirroring/local assets.
const browserWin=createRuntime([
  'public/js/static-data.js','public/js/runtime-authority.js','public/js/active-starters.js','public/js/app.bundle.js'
],'v3755-browser-runtime.js');
const browser=browserWin.GL_LOCAL_AI_BRIDGE;
for(const method of ['startSharedMatch','getCanonicalSnapshot','completeOpeningFlow','importCanonicalSnapshot','queueAuthoritativeOpeningSequence','queueAuthoritativeDrawThenShardMotions']) if(typeof browser?.[method]!=='function') throw new Error('Browser presentation bridge unavailable: '+method);
browser.setSharedBoardMode?.(true);browser.setRenderSuppressed?.(true);
const start=browser.startSharedMatch({player1Name:'Alice',player2Name:'Bob',playerDeckKey:starterKey,player2DeckKey:starterKey});
if(!start?.appState?.pvpHumanVsHuman) throw new Error('Human-vs-human flag was not enabled');
if((start.appState.playerDeck||[]).length!==60||(start.appState.aiDeck||[]).length!==60) throw new Error('Shared browser runtime started without 60-card decks');
const localThumb=browserWin.GL_OPTION_B_ENGINE?.cardView?.('S1-MAG-H001')?.thumb||'';
if(!/\/card-art\/S1-MAG-H001\.webp(?:\?|$)/.test(localThumb)) throw new Error('Browser card art is not using bundled local card-art: '+localThumb);
browser.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'TAILS',firstSeat:1},{holdAtDraw:true,bridgeImmediate:false});
const p1=browser.getCanonicalSnapshot(1),p2=browser.getCanonicalSnapshot(2);
if(!p1?.appState||!p2?.appState) throw new Error('Seat-oriented canonical snapshots unavailable');
const asym=structuredClone(p1);
asym.appState.playerManaPoolCards=(asym.appState.playerManaPoolCards||[]).slice(0,1);
asym.appState.aiManaPoolCards=(asym.appState.aiManaPoolCards||[]).slice(0,2);
asym.appState.playerManaDeck=(asym.appState.playerManaDeck||[]).slice(0,7);
asym.appState.aiManaDeck=(asym.appState.aiManaDeck||[]).slice(0,5);
asym.appState.playerManaClasses=['Warrior'];asym.appState.aiManaClasses=['Mage','Thief'];
asym.appState.playerManaDeckCount=7;asym.appState.aiManaDeckCount=5;asym.appState.mana=1;asym.appState.aiMana=2;
if(!browser.importCanonicalSnapshot(asym,1,{skipImportAnimations:true})) throw new Error('Could not load asymmetric browser mirror QA state');
const seat2=browser.getCanonicalSnapshot(2).appState;
if((seat2.playerManaPoolCards||[]).length!==2||(seat2.aiManaPoolCards||[]).length!==1) throw new Error('Seat 2 Shard Pool mirror is cross-wired');
if((seat2.playerManaDeck||[]).length!==5||(seat2.aiManaDeck||[]).length!==7) throw new Error('Seat 2 Shard Deck mirror is cross-wired');

// Server side: the authoritative match engine is the v3.51 runtime, isolated from the newer browser engine.
const serverWin=createRuntime([
  'server/runtime/static-data.js','server/runtime/runtime-authority.js','server/runtime/app.bundle.js'
],'v3755-v351-authority.js');
const authority=serverWin.GL_LOCAL_AI_BRIDGE;
for(const method of ['startSharedMatch','getCanonicalSnapshot','importCanonicalSnapshot','applyServerIntent','testPlaytestManaRules']) if(typeof authority?.[method]!=='function') throw new Error('v3.51 authority bridge unavailable: '+method);
authority.setSharedBoardMode?.(true);authority.setRenderSuppressed?.(true);
authority.startSharedMatch({player1Name:'Alice',player2Name:'Bob',playerDeckKey:starterKey,player2DeckKey:starterKey});
const manaQA=authority.testPlaytestManaRules();
if(!manaQA?.ok) throw new Error('v3.51 Mana rules QA failed: '+JSON.stringify(manaQA));

function prepAuthority(cardId){
  const snap=structuredClone(authority.getCanonicalSnapshot(1));
  const s=snap.appState;
  s.preGame=null;
  s.openingCoinFlip={firstPlayer:'PLAYER'};
  s.turn='PLAYER';
  s.round=1;
  s.phase='Deploy';
  s.pending=null;
  s.responseWindow=null;
  s.playerHand=[cardId];
  while((s.playerManaPoolCards||[]).length<4 && (s.playerManaDeck||[]).length) s.playerManaPoolCards.push(s.playerManaDeck.shift());
  s.mana=(s.playerManaPoolCards||[]).length;
  if(!authority.importCanonicalSnapshot(snap,1,{skipImportAnimations:true})) throw new Error('Could not prepare authoritative QA state for '+cardId);
}

// Round-1 restriction is Attack-only. Event must be legal in Deploy on the first player's first turn.
prepAuthority('S1-EVT-002');
const eventStart=authority.applyServerIntent('beginPlayFromHand',[0]);
if(!eventStart?.ok) throw new Error('Round-1 Event was incorrectly blocked: '+JSON.stringify(eventStart));
const eventPending=authority.getCanonicalSnapshot(1).appState.pending;
if(!eventPending||eventPending.card_id!=='S1-EVT-002') throw new Error('Round-1 Event did not enter its normal authoritative resolution flow');

// Meditation regression: source choice must resolve fully in the server authority, not only on the acting browser.
prepAuthority('S1-MAG-006');
const medStart=authority.applyServerIntent('beginPlayFromHand',[0]);
if(!medStart?.ok) throw new Error('Meditation did not start: '+JSON.stringify(medStart));
const medPending=authority.getCanonicalSnapshot(1).appState.pending;
if(medPending?.type!=='source_selection'||!(medPending.legal_sources||[]).includes('LEFT')) throw new Error('Meditation source_selection regression');
const medResolve=authority.applyServerIntent('chooseHeroFromBoard',['PLAYER','LEFT']);
if(!medResolve?.ok) throw new Error('Meditation source selection did not resolve: '+JSON.stringify(medResolve));
const medAfter=authority.getCanonicalSnapshot(1).appState;
if(medAfter.pending!==null) throw new Error('Meditation left a stale authoritative pending state');
if((medAfter.playerHand||[]).includes('S1-MAG-006')||!(medAfter.playerDiscard||[]).includes('S1-MAG-006')) throw new Error('Meditation card custody did not settle to Discard');

console.log('v3.75.5 runtime: v6.90.7 browser presentation + exact v3.51 authoritative gameplay/Event/Meditation/Mana rules: PASS');
