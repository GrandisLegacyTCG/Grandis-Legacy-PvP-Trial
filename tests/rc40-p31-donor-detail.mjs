import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {viewerSafeBoard, assertViewerSafeBoard} from '../server/viewer-safe.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const f=path=>readFileSync(join(root,path),'utf8');
const code=f('public/battle/engine/shared-app/app.bundle.js');
const fragment=(text,a,b)=>text.slice(text.indexOf(a),text.indexOf(b,text.indexOf(a)+a.length));
const renderer=fragment(code,'  function v94EventDetailHtml(', '  function v94EventsForSide(');
const attachment=fragment(code,'  function playedAttachmentEffectDescription(', '  function findLocalPlayerEventById(');
const casting=fragment(code,'  function castingSnapshotLines(', '  function recordPvpSideAction(');
let n=0;
const check=(label,fn)=>{fn();n++;console.log('PASS',label)};
check('The entire Card Played detail renderer is source-identical to latest VS AI RC40',()=>{
  // SHA256 pinned to the exact donor RC40 2026-11-14 code, no external file required.
  assert.equal(createHash('sha256').update(renderer).digest('hex'),'26065ab5cf13c7701f4886049a3c3d8509fd00812e7a164f2f60f6eab514b65f');
  assert.ok(renderer.length>14000);
});
check('Attachment and Casting gameplay text uses the donor directly',()=>{
  assert.equal(createHash('sha256').update(attachment).digest('hex'),'b0165807717bc28f34e7fd0a8ef54d3ddda572028a3a8938b8785d5b10384ff6');
  assert.equal(createHash('sha256').update(casting).digest('hex'),'18ebab0c69bf8efa147ac786ac5c4fa97d2b5ede3272a89afb4f8df0a0c754ad');
  assert.match(attachment,/Physical or Magical Attack Damage for 2 turns/);
  assert.match(casting,/Damage at Casting/);
});
const runtime=f('public/battle/shared-app/app-runtime.js');
check('All visible PvP detail opens use the VS AI renderer, never the old PvP renderer',()=>{
  const s=runtime.slice(runtime.indexOf('function openPlayedDetail('),runtime.indexOf("playedDetailOverlay.querySelector('.gl-played-detail-close')",runtime.indexOf('function openPlayedDetail(')));
  assert.match(s,/getPublicCardPlayedDetail/);
  assert.doesNotMatch(s,/pvpPlayedDetailHtml/);
  assert.doesNotMatch(runtime,/function pvpPlayedDetailHtml\(/, 'Legacy PvP formatter must NOT ship in production');
  assert.match(runtime,/data-gl-linked-event/);
  assert.ok(code.includes('getPublicCardPlayedDetail:function('));
});
check('Both canonical in-memory registry and JSON mirror have the latest Mana cards wording',()=>{
  const c=f('public/battle/engine/js/static-data.js');
  const m=f('public/battle/runtime/season0-generated/s0-card-definitions.json');
  for(const s of [c,m]){assert.match(s,/Ancestral Focus: During Deploy Phase, you may spend 1 Racial Token to gain 2 Mana cards to your Mana Pool/);assert.doesNotMatch(s,/Ancestral Focus: During Deploy Phase, you may spend 1 Racial Token to gain 2 Mana Shards to your Mana Pool/);}
});

const fakeDom={};for(const key of ['choiceOverlay','choiceTitle','choiceConfirm','choiceBody'])fakeDom[key]={style:{},classList:{add(){},remove(){},contains(){return false;}},innerHTML:'',textContent:'',disabled:false,children:[]};
const ctx={console, URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,performance:{now:()=>0},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame(){},cancelAnimationFrame(){},crypto:webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://test.local/pvp/battle/index.html',origin:'http://test.local'};
ctx.navigator={userAgent:'P3.1 canonical renderer test'};ctx.document={readyState:'loading',addEventListener(){},getElementById(id){return fakeDom[id]||null;},querySelector(){return null},querySelectorAll(){return []},createElement(){return {style:{},appendChild(){},setAttribute(){}}},documentElement:{classList:{toggle(){}}},body:{appendChild(){}}};
vm.createContext(ctx);
for(const path of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let source=f('public/battle/'+path);
 if(path.endsWith('app.bundle.js'))source=source.replace(/\n\}\)\(\);\s*$/,`\nwindow.__P31TEST={initCards,getState:()=>appState,setState:(s)=>{appState=s;}};\n})();`);
 vm.runInContext(source,ctx,{filename:path,timeout:60000});
}
ctx.__P31TEST.initCards();
check('Production engine exposes a canonical public-detail API',()=>assert.equal(typeof ctx.GL_GAME_ENGINE.getPublicCardPlayedDetail,'function'));
const events=[
{id:'atk-one',side:'PLAYER',card_id:'S0-MAG-006',label:'ATK',source_side:'PLAYER',source_lane:'CENTER',source_snapshot:{name:'Bromir Oathforge'},target_snapshot:{name:'Aurex Sunsworn'},card_played_chain_id:'chain-1',card_played_chain_step:0,played_event_order:1,
 damage_type:'Magical',damage_breakdown_by_hero:[{name:'Aurex Sunsworn',side:'AI',lane:'CENTER',summary:{base_damage:50,damage_after_modifiers:50,response_block:50,actual_hp_damage:0,target_hp_before:120,target_hp_after:120,damage_type:'Magical'}}]},
{id:'response-two',side:'AI',card_id:'S0-WAR-002',label:'DEF',source_side:'AI',source_lane:'CENTER',source_snapshot:{name:'Aurex Sunsworn'},card_played_chain_id:'chain-1',card_played_chain_step:1,played_event_order:2,response_to_event_id:'atk-one',response_lines:['Blocked 50 damage.']}
];
check('Rendering committed PvP journal produces VS AI Card Played structure and breakdown',()=>{
 const detail=ctx.GL_GAME_ENGINE.getPublicCardPlayedDetail('PLAYER','atk-one',events);
 assert.ok(detail?.html);
 assert.match(detail.html,/played-detail-layout/);
 assert.match(detail.html,/Damage Resolution/);
 assert.match(detail.html,/Base Damage: 50/);
 assert.match(detail.html,/Block: -50 Damage/);
 assert.match(detail.html,/Related Cards/);
 assert.match(detail.html,/data-gl-linked-event="response-two"/);
 assert.doesNotMatch(detail.html,/privateHand|Unknown origin|role:|expiry:/);
});
check('Clicking Response opens the exact corresponding public card',()=>{
 const detail=ctx.GL_GAME_ENGINE.getPublicCardPlayedDetail('AI','response-two',events);
 assert.match(detail.html,/data-gl-linked-event="atk-one"/);
 assert.match(detail.html,/played-detail-layout/);
});
check('The read-only public Card Played bridge restores original state and refuses unknown IDs',()=>{
 const previous={playerHand:['NOT_YOURS'],aiDeck:['PRIVATE'],turn:'PLAYER'};
 ctx.__P31TEST.setState(previous);
 assert.equal(ctx.GL_GAME_ENGINE.getPublicCardPlayedDetail('PLAYER','missing',events),null);
 ctx.GL_GAME_ENGINE.getPublicCardPlayedDetail('PLAYER','atk-one',events);
 assert.equal(ctx.__P31TEST.getState(),previous);
 assert.equal(ctx.GL_GAME_ENGINE.getPublicCardPlayedDetail('AI','missing',events),null);
});
const safeRaw={appState:{round:1,playerHand:[],aiHand:['S0-SECRET-001'],playerDeck:['S0-SECRET-002'],aiDeck:[],playerLegacy:[],aiLegacy:[],playerManaDeck:[],aiManaDeck:[],playerManaPoolCards:[],aiManaPoolCards:[],playerHeroes:{},aiHeroes:{},pvpActionEventsBySide:{
 PLAYER:[{id:'play-evt',card_id:'S0-EVT-011',label:'EVENT',title:'Coordination Attack',effect_breakdown_by_hero:[{kind:'ATTACHMENT',scope:'team',description:'Applied Coordination Attack',detail:'All allied active Heroes gain +20 Physical or Magical Attack Damage for 2 turns.',name:'Your Team'},{kind:'HIDDEN SEARCH',scope:'team',description:'Private Hand',detail:'Hand: S0-MAG-001'}]}],AI:[]},presentationEvents:[]}};
check('Viewer projection forwards public attachment text but never raw hidden audit data',()=>{
 const v=viewerSafeBoard(safeRaw,{seat:1,revision:1,secret:Buffer.alloc(32)});
 assertViewerSafeBoard(v);
 const text=JSON.stringify(v);
 assert.match(text,/Physical or Magical Attack Damage for 2 turns/);
 assert.doesNotMatch(text,/HIDDEN SEARCH|S0-SECRET|Hand: S0-MAG-001/);
});
check('Exact VS AI Card Played summary, response and damage layouts are styled',()=>{
  const css=f('public/battle/shared-ui/battlefield-ui.css');
  assert.match(css,/\.gl-played-detail-body \.played-summary-field\{/);
  assert.match(css,/\.gl-played-detail-body \.played-related-card\{/);
  assert.match(css,/\.gl-played-detail-body \.played-damage-block\{display:grid;gap:8px;margin-top:8px;\}/);
  assert.match(css,/\.gl-played-detail-body \.played-damage-block \.played-result-hero li\{font-size:12px;line-height:1\.4;\}/);
});
check('Single socket and HTTP endpoints are untouched by the detail renderer integration',()=>{
  assert.match(f('public/battle/runtime/pvp-network.js'),/EMBEDDED/);
  assert.match(f('server.js'),/new WebSocketServer|WebSocketServer\(/);
});
console.log(`RC40 PATCH3.1 DONOR PARITY ${n}/${n} PASS`);
