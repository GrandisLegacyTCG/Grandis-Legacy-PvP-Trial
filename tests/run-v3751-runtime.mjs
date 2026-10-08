import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { normalizeHeadlessRuntimeMetadata } from '../server/headless-runtime-compat.mjs';
const root=resolve(new URL('..',import.meta.url).pathname);
const pub=join(root,'public');
const code=[
  join(pub,'js/static-data.js'),
  join(pub,'js/runtime-authority.js'),
  join(pub,'js/active-starters.js'),
  join(pub,'js/app.bundle.js')
].map(f=>readFileSync(f,'utf8')).join('\n');
const dummy={style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},removeAttribute(){},querySelectorAll(){return[]},querySelector(){return null},closest(){return null},focus(){},scrollIntoView(){},click(){},getBoundingClientRect(){return{left:0,top:0,width:0,height:0,right:0,bottom:0}},disabled:false,value:'',checked:false,get innerHTML(){return this._h||''},set innerHTML(v){this._h=String(v??'')},get textContent(){return this._t||''},set textContent(v){this._t=String(v??'')}};
const doc={readyState:'loading',body:dummy,documentElement:dummy,addEventListener(){},removeEventListener(){},getElementById(){return dummy},querySelectorAll(){return[]},querySelector(){return null},createElement(){return {...dummy,style:{},classList:dummy.classList}},createDocumentFragment(){return dummy}};
const win={document:doc,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,requestAnimationFrame:(fn)=>setTimeout(fn,0),cancelAnimationFrame:clearTimeout,console,GL_PVP_SHARED_BOARD_ACTIVE:true,GL_APP_MODE:'PVP'};
const ctx={window:win,document:doc,console,setTimeout,clearTimeout,requestAnimationFrame:win.requestAnimationFrame,cancelAnimationFrame:clearTimeout,URL,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}},localStorage:{getItem(){return null},setItem(){},removeItem(){}},navigator:{},location:{href:'http://localhost/'},performance:{now:()=>0},Image:class{}};
ctx.globalThis=ctx;win.window=win;win.globalThis=ctx;vm.createContext(ctx);new vm.Script(code,{filename:'v3751-runtime.js'}).runInContext(ctx,{timeout:5000});normalizeHeadlessRuntimeMetadata(win);
const b=win.GL_LOCAL_AI_BRIDGE;
for(const method of ['startSharedMatch','getCanonicalSnapshot','completeOpeningFlow','playAuthoritativeBattleFeedbackAudio','playAuthoritativeBattleFeedback','unlockGameplayAudioPlayback','prepareAuthoritativeBattleAssets','captureAuthoritativePlayedCardMotion','beginAuthoritativeHeldPlayedCardMotion','releaseAuthoritativeHeldCardMotion','captureAuthoritativeHandDiscardMotion','queueCapturedAuthoritativeHandDiscardMotion','captureAuthoritativeAttachmentDiscardMotion','queueCapturedAuthoritativeAttachmentDiscardMotion','captureAuthoritativeLegacyToDeckMotion','queueCapturedAuthoritativeLegacyToDeckMotion','queueAuthoritativeShardGainMotions','queueAuthoritativeOpeningSequence','queueAuthoritativeDrawThenShardMotions','captureAuthoritativeRankUpMotion','queueCapturedAuthoritativeRankUpMotion']) if(typeof b?.[method]!=='function') throw new Error('v3.75.1 shared PvP runtime bridge unavailable: '+method);
b.setSharedBoardMode?.(true);b.setRenderSuppressed?.(true);
const starterKey='starter_01_elemental_lord_conqueror_renegade';
const start=b.startSharedMatch({player1Name:'Alice',player2Name:'Bob',playerDeckKey:starterKey,player2DeckKey:starterKey});if(!start?.appState?.pvpHumanVsHuman) throw new Error('Human-vs-human flag was not enabled');
if(!start.appState.playerHeroes?.LEFT?.card_id||!start.appState.aiHeroes?.LEFT?.card_id) throw new Error('Shared match started without Hero state');
if((start.appState.playerDeck||[]).length!==60||(start.appState.aiDeck||[]).length!==60) throw new Error('Shared match started without 60-card decks');
const localThumb=win.GL_OPTION_B_ENGINE?.cardView?.('S1-MAG-H001')?.thumb||'';
if(!/\/card-art\/S1-MAG-H001\.webp(?:\?|$)/.test(localThumb)) throw new Error('Runtime card art is not using bundled local card-art: '+localThumb);
const opening=b.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'TAILS',firstSeat:1},{holdAtDraw:true,bridgeImmediate:false});
if(!opening?.snapshot?.appState) throw new Error('Opening flow did not produce a canonical snapshot');
const p1=b.getCanonicalSnapshot(1),p2=b.getCanonicalSnapshot(2);if(!p1?.appState||!p2?.appState) throw new Error('Seat-oriented canonical snapshots unavailable');
if((p1.appState.playerHand||[]).length<1||(p2.appState.playerHand||[]).length<1) throw new Error('Seat hand mirroring did not expose each player local hand');
// Regression: seat 2 must mirror physical Shard Deck/Pool/Class state, not only hand/hero state.
const asym=structuredClone(p1);
asym.appState.playerManaPoolCards=(asym.appState.playerManaPoolCards||[]).slice(0,1);
asym.appState.aiManaPoolCards=(asym.appState.aiManaPoolCards||[]).slice(0,2);
asym.appState.playerManaDeck=(asym.appState.playerManaDeck||[]).slice(0,7);
asym.appState.aiManaDeck=(asym.appState.aiManaDeck||[]).slice(0,5);
asym.appState.playerManaClasses=['Warrior'];
asym.appState.aiManaClasses=['Mage','Thief'];
asym.appState.playerManaDeckCount=7;asym.appState.aiManaDeckCount=5;asym.appState.mana=1;asym.appState.aiMana=2;
if(!b.importCanonicalSnapshot(asym,1,{skipImportAnimations:true})) throw new Error('Could not load asymmetric Shard mirror QA state');
const seat2ShardView=b.getCanonicalSnapshot(2).appState;
if((seat2ShardView.playerManaPoolCards||[]).length!==2||(seat2ShardView.aiManaPoolCards||[]).length!==1) throw new Error('Seat 2 Shard Pool mirror is cross-wired');
if((seat2ShardView.playerManaDeck||[]).length!==5||(seat2ShardView.aiManaDeck||[]).length!==7) throw new Error('Seat 2 Shard Deck mirror is cross-wired');
if(JSON.stringify(seat2ShardView.playerManaClasses)!==JSON.stringify(['Mage','Thief'])||JSON.stringify(seat2ShardView.aiManaClasses)!==JSON.stringify(['Warrior'])) throw new Error('Seat 2 Class Shard mirror is cross-wired');
if(Number(seat2ShardView.playerManaDeckCount)!==5||Number(seat2ShardView.aiManaDeckCount)!==7||Number(seat2ShardView.mana)!==2||Number(seat2ShardView.aiMana)!==1) throw new Error('Seat 2 Shard counters are cross-wired');
const exact=b.testExactManaPaymentV3751?.();
if(!exact?.ok) throw new Error('v3.75.1 exact Mana payment QA failed: '+JSON.stringify(exact));
console.log('v3.75.1 shared human-vs-human runtime + exact Mana payment: PASS');
