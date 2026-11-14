/* PvP RC9 Stage3 — 13 November 2026. Focused behavioral QA, no hosting changes. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {webcrypto,createHash} from 'node:crypto';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
let count=0;function check(label,fn){fn();count++;console.log('PASS',label)}
const read=x=>readFileSync(resolve(x),'utf8');
const runtime=read('public/battle/shared-app/app-runtime.js')+'\n'+read('tests/fixtures/rc9-legacy-cardplayed-helpers.js');
const css=read('public/battle/shared-ui/battlefield-ui.css');
const uiHtml=read('public/battle/index.html');
const network=read('public/battle/runtime/pvp-network.js');
const server=read('server/headless-rc32.mjs');
const engine=read('public/battle/engine/shared-app/app.bundle.js');

// Test actual recipient-projected Card Played renderer, not local-only donor data.
function bodyOf(name){const start=runtime.indexOf('function '+name+'(');assert.ok(start>=0,name);const end=runtime.indexOf('\nfunction ',start+1);assert.ok(end>start,name);return runtime.slice(start,end)}
const names={'S0-MAG-H004':'Lucien Voss','S0-WAR-H004':'Bromir Oathforge','S0-ARC-H004':'Akra Norixius'};
const context={console,window:{GL_APP_MODE:'PVP',GL_PVP_IDENTITY:{playerName:'Jenoz',opponentName:'Playerhh'}},Set,Map,Object,Number,String,Array,
  cv:id=>({name:names[id]||id||'Hero',subtype:'Magical Attack'}),
  art:id=>'card-art/'+id+'.webp',
  esc:x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
  sideHeroes:()=>({}),heroImageId:h=>h.card_id,st:()=>({}),resolvedHistory:[],
  playedChronology:(a,b)=>Number(a.played_event_order||0)-Number(b.played_event_order||0)};
vm.createContext(context);
for(const name of ['pvpPlayedHeroName','pvpPlayedActionName','pvpPlayedDamageResults',
 'pvpPlayedEffectRows','pvpPlayedRelatedCards','pvpPlayedAdditionalLines',
 'pvpPlayedHeroOutcomeHtml','pvpPlayedResponseDetail','pvpPlayedDetailHtml','pvpTurnName'])
 vm.runInContext(bodyOf(name),context,{filename:'app-runtime.js:'+name});
const atk={id:'committed-test',side:'AI',label:'ATK',card_id:'S0-WAR-009',
  damage_type:'Magical',source_hero_card_id:'S0-MAG-H004',target_side:'PLAYER',target_lane:'CENTER',
  damage_by_hero:[
    {name:'Bromir Oathforge',side:'PLAYER',lane:'CENTER',summary:{base_damage:20,damage_after_modifiers:20,actual_hp_damage:10,burn_damage:10,passive_reduction:20,target_hp_before:80,target_hp_after:70}},
    {name:'Bromir Oathforge',side:'PLAYER',lane:'CENTER',summary:{base_damage:20,damage_after_modifiers:20,actual_hp_damage:20,target_hp_before:70,target_hp_after:50}},
    {name:'Akra Norixius',side:'PLAYER',lane:'LEFT',summary:{base_damage:10,damage_after_modifiers:10,actual_hp_damage:10,target_hp_before:90,target_hp_after:80}}],
  status_by_hero:[{name:'Bromir Oathforge',side:'PLAYER',lane:'CENTER',status:'Burn',before:0,after:3},
    {name:'Akra Norixius',side:'PLAYER',lane:'LEFT',status:'Poison',before:0,after:2}],
  result_lines:['Final HP damage: 20.','Burn added +10 damage.','Opponent activated Invincible.']};
check('Card Played groups multi-hit Damage + Status in one box per Hero',()=>{
 const html=context.pvpPlayedDetailHtml(atk);
 assert.equal((html.match(/class="gl-played-hero-group"/g)||[]).length,2);
 assert.equal((html.match(/<h4>Bromir Oathforge<\/h4>/g)||[]).length,1);
 assert.equal((html.match(/<h4>Akra Norixius<\/h4>/g)||[]).length,1);
 assert.ok(html.includes('Final Magical Damage: 30 (2 hits)'));
 assert.ok(html.includes('Burn: 0 → 3 turns'));
 assert.ok(html.includes('Poison: 0 → 2 turns'));
 assert.equal((html.match(/Burn Bonus/g)||[]).length,1);
 assert.ok(!html.includes('Final HP damage: 20.')&&!html.includes('Burn added +10 damage.'));
 assert.ok(!html.includes('<strong>Target</strong>'),'Hero group already names its target');
 assert.ok(html.includes('Opponent activated Invincible.'));
});
check('Actual Healing and Status share a single per-Hero result box',()=>{
 const html=context.pvpPlayedDetailHtml({...atk,label:'SUPPORT',damage_by_hero:[],result_lines:[],
  healing_by_hero:[{name:'Bromir Oathforge',side:'PLAYER',lane:'CENTER',healed:30}],
  status_by_hero:[{name:'Bromir Oathforge',side:'PLAYER',lane:'CENTER',status:'Bleed',before:2,after:0}]});
 assert.equal((html.match(/class="gl-played-hero-group"/g)||[]).length,1);
 assert.ok(html.includes('+30 HP')&&html.includes('Bleed: 2 → 0 turns'));
});
check('No zero-damage/unchanged HP/status cards clutter Card Played',()=>{
 const html=context.pvpPlayedDetailHtml({...atk,result_lines:[],damage_by_hero:[
  {name:'Akra Norixius',side:'PLAYER',lane:'LEFT',summary:{actual_hp_damage:0,base_damage:0,damage_after_modifiers:0,target_hp_before:80,target_hp_after:80}}],
  status_by_hero:[{name:'Akra Norixius',side:'PLAYER',lane:'LEFT',status:'Burn',before:1,after:1}]});
 assert.ok(!html.includes('Damage Dealt')&&!html.includes('80 → 80')&&!html.includes('gl-played-hero-group'));
});
check('Group values are escaped and never inject markup',()=>{
 const html=context.pvpPlayedHeroOutcomeHtml({...atk,damage_by_hero:[
  {name:'<script>bad</script>',side:'PLAYER',lane:'CENTER',summary:{actual_hp_damage:10}}],status_by_hero:[]});
 assert.ok(html.includes('&lt;script&gt;')&&!html.includes('<script>'));
});
check('Turn banners use live lobby names and viewer-relative color classification',()=>{
 assert.equal(context.pvpTurnName({turn:'PLAYER'}),"JENOZ'S TURN");
 assert.equal(context.pvpTurnName({turn:'AI'}),"PLAYERHH'S TURN");
 context.window.GL_PVP_IDENTITY.opponentName='<img onerror=alert(1)>';
 assert.ok(context.pvpTurnName({turn:'AI'}).includes('IMG ONERROR')&&
  !runtime.includes("turnBanner.innerHTML='<strong>'"));
 assert.ok(runtime.includes('turnBanner.replaceChildren(title,subtitle)')&&runtime.includes('title.textContent=pvpTurnName(s)'));
 assert.ok(css.includes('.gl-turn-banner.is-turn-player')&&css.includes('.gl-turn-banner.is-turn-opponent'));
});
check('Active Card has viewport-adaptive ratio and no forced artwork crop',()=>{
 assert.ok(uiHtml.includes('container-type:size')&&css.includes('71.4286cqh'));
 assert.ok(css.includes('aspect-ratio:5/7!important')&&css.includes('object-fit:contain!important'));
 assert.ok(css.includes('.history-head h3{font-size:14px;white-space:nowrap'));
});
check('Legacy centered selection is local-only, modal suppression and CONFIRM available',()=>{
 assert.ok(runtime.includes("if(p.type==='legacy_defeat_choice')return'legacy'"));
 assert.ok(runtime.includes("'stoneblood','legacy'].forEach"));
 assert.ok(runtime.includes("intent('selectLegacyDefeatChoice',[i])"));
 assert.ok(runtime.includes("makeBtn('CONFIRM LEGACY'"));
 assert.ok(network.includes("['selectLegacyDefeatChoice','legacy_defeat_choice']"));
 assert.ok(network.includes("payload.choiceId=String(p.choice_id||'')"));
 assert.ok(network.includes("window.GL_GAME_UI.renderLocalChoiceDraft()"));
 assert.ok(runtime.includes("renderLocalChoiceDraft:()=>renderCenterChoiceStage(st())"));
 assert.ok(css.includes('body.gl-center-legacy #choiceOverlay{display:none'));
 assert.ok(runtime.includes("allowed=['card_search_choice','legacy_card_choice','crystal_ball_reorder']"));
});
check('Card Review reuses frame + lazy preloads styles without per-action fetch',()=>{
 const review=read('public/battle/shared-app/db158-card-review.js');
 assert.ok(runtime.includes('ready.glReviewVisualReady'));
 assert.ok(review.includes("if(existing.dataset.glReviewKey===key)return true"));
 assert.ok(review.includes('requestIdleCallback(warmStyles'));
 assert.ok(!/fetch\(['"]api\//.test(runtime));
});
check('Network architecture remains one socket, local draft is one confirmed packet',()=>{
 const sha=x=>createHash('sha256').update(x).digest('hex');
 assert.equal(sha(read('server/ws-lite.mjs')),'1e29b60b2ce0ee357df98518db12a2b5063c5a224635df478d7588f8c5862047');
 assert.equal(sha(read('public/battle/runtime/pvp-mana-draft.js')),'0dfb813cf7c549f01f83d6c7cb46fd5192fc78d554fbd53de90e8b2b572d92b7');
 assert.ok(server.includes("if (kind === 'legacy_defeat_choice')"));
 assert.ok(network.includes("name:'commitExactLocalChoiceDraft',args:[payload]"));
});

// Actual server/engine test with two real, mirrored human seats. Local UI
// selection is not transmitted; a SINGLE commitExactLocalChoiceDraft advances
// one authoritative revision, protected by owner + choice ID + candidate index.
const raw=server;
const injectMark='  /** A verified seat may concede without turn/response ownership. */';
const inject=raw.replace("import {PvpCombatPresentationLedger} from './combat-presentation.mjs';",
  `import {PvpCombatPresentationLedger} from '${pathToFileURL(resolve('server/combat-presentation.mjs')).href}';`)
 .replace("import {PvpDiscardPresentationLedger} from './discard-presentation.mjs';",
  `import {PvpDiscardPresentationLedger} from '${pathToFileURL(resolve('server/discard-presentation.mjs')).href}';`)
 .replace(injectMark,`  injectFixtureForQA(snapshot) {this.#canonical=clone(snapshot);this.#bridgeSeat=null;this.#bridgeRevision=-1;}\n${injectMark}`);
assert.ok(inject.includes('injectFixtureForQA(snapshot)'));
const {Season0HeadlessAuthority}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(inject));
for(const seat of [1,2]){
 const a=new Season0HeadlessAuthority(join(process.cwd(),'public/battle'));
 a.start({player1DeckKey:'s0_starter_01_red_white',player2DeckKey:'s0_starter_02_blue_red'});
 a.completeOpening(1,'HEADS');
 const seed=a._canonicalForServerOnly(),s=seed.appState,side=seat===1?'PLAYER':'AI';
 const h=s[seat===1?'playerHeroes':'aiHeroes'].LEFT;
 s.turn=side;s.phase='End';s.pending=null;s.responseWindow=null;s.gameOver=false;
 s.autoEndTurnPending=seat===1;h.hp=5;h.statuses=[{name:'Poison',duration:1}];
 a.injectFixtureForQA(seed);
 const rev=a.revision;
 check('Seat '+seat+' lethal Poison opens mandatory Legacy with valid candidates',()=>{
  const r=a.applyIntent(seat,'advancePhase',[]);assert.ok(r.ok);
  const next=a._canonicalForServerOnly().appState;
  assert.equal(next.pending?.type,'legacy_defeat_choice');
  assert.ok(next.pending.choice_id&&next.pending.candidates.length>=1);
  assert.equal(next[seat===1?'playerHeroes':'aiHeroes'].LEFT.hp,0);
  const view=viewerSafeBoard(a._viewForMaskingOnly(seat),{seat,revision:a.revision,secret:Buffer.alloc(32,3)});
  assertViewerSafeBoard(view);
 });
 const pending=a._canonicalForServerOnly().appState.pending;
 const packet={kind:'legacy_defeat_choice',choiceId:pending.choice_id,index:0};
 check('Seat '+seat+' rejects cross-seat, stale choice and out-of-range without revision',()=>{
  const original=a.revision;
  assert.throws(()=>a.applyIntent(seat===1?2:1,'commitExactLocalChoiceDraft',[packet]),/turn|decision/i);
  assert.throws(()=>a.applyIntent(seat,'commitExactLocalChoiceDraft',[{...packet,choiceId:'stale'}]),/stale/i);
  assert.throws(()=>a.applyIntent(seat,'commitExactLocalChoiceDraft',[{...packet,index:1000}]),/stale/i);
  assert.equal(a.revision,original);
 });
 check('Seat '+seat+' confirms Legacy in one atomic revision; replay is denied',()=>{
  const rev=a.revision,r=a.applyIntent(seat,'commitExactLocalChoiceDraft',[packet]);
  assert.equal(r.ok,true);assert.equal(a.revision,rev+1);
  const next=a._canonicalForServerOnly().appState;
  assert.notEqual(next.pending?.type,'legacy_defeat_choice');
  assert.ok(next[seat===1?'playerHeroes':'aiHeroes'].LEFT.legacy_mode||
    next[seat===1?'playerHeroes':'aiHeroes'].LEFT.mode==='LEGACY');
  assert.throws(()=>a.applyIntent(seat,'commitExactLocalChoiceDraft',[packet]));
 });
}
// Batch2 1v1 is patched in the same authoritative engine; verifies actual
// rule helpers rather than relying on string matches alone.
const eCtx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,
 performance:{now:()=>0},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},
 requestAnimationFrame(){},cancelAnimationFrame(){},crypto:webcrypto};
eCtx.window=eCtx;eCtx.globalThis=eCtx;
eCtx.location={href:'http://test/battle',origin:'http://test'};
eCtx.navigator={userAgent:'RC9 Stage3 QA'};
eCtx.document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []},createElement(){return{style:{},appendChild(){},setAttribute(){}}},documentElement:{classList:{toggle(){}}},body:{appendChild(){}}};
vm.createContext(eCtx);
const engineInjection='window.__S3={initCards,buildInitialMatchState,heroIdFrom,heroState,positionLockedOneVsOne,activeNonLegacyLanes,manualRepositionAvailable,manualRepositionPairsForSide,repositionPairsForSide,sourceSwapOptions,soulBlastTargetSwapOptions,shadowSwitchCanReposition,swapBoardStateLanes,autoCenterOneVsOne,setState:(s)=>{appState=s;matchStarted=true;SUPPRESS_RENDER=true}};\n})();';
for(const file of ['public/battle/engine/js/static-data.js','public/battle/engine/js/runtime-authority.js',
 'public/battle/engine/shared-app/active-starters.js','public/battle/engine/shared-app/app.bundle.js']){
 let src=read(file);if(file.endsWith('app.bundle.js'))src=src.replace(/\n\}\)\(\);\s*$/,engineInjection);
 vm.runInContext(src,eCtx,{filename:file,timeout:60000});
}
const q=eCtx.__S3;q.initCards();
const s=q.buildInitialMatchState();q.setState(s);
s.turn='PLAYER';s.phase='Deploy';s.pending=null;s.responseWindow=null;s.gameOver=false;
for(const lane of ['CENTER','RIGHT'])s.playerHeroes[lane].hp=0;
for(const lane of ['LEFT','CENTER'])s.aiHeroes[lane].hp=0;
const pId=q.heroIdFrom(s.playerHeroes.LEFT),aId=q.heroIdFrom(s.aiHeroes.RIGHT);
check('Batch2 1v1 locks manual/effect swaps for both players and AI',()=>{
 assert.ok(q.positionLockedOneVsOne(s));
 assert.equal(q.manualRepositionAvailable(s),false);
 assert.equal(q.manualRepositionPairsForSide(s,'PLAYER').length,0);
 assert.equal(q.repositionPairsForSide(s,'AI').length,0);
 assert.equal(q.sourceSwapOptions(s,{card_id:'S0-THF-024',source_side:'PLAYER',source_lane:'LEFT',target_lane:'CENTER'}).length,0);
 assert.equal(q.soulBlastTargetSwapOptions(s,{card_id:'S0-ARC-016',source_side:'PLAYER',source_lane:'LEFT',target_side:'AI',target_lane:'RIGHT'}).length,0);
 assert.equal(q.shadowSwitchCanReposition(s,'PLAYER',{target_lane:'LEFT',source_lane:'LEFT'}),false);
 assert.equal(q.swapBoardStateLanes(s,'PLAYER','LEFT','CENTER'),false);
 assert.equal(q.heroIdFrom(s.playerHeroes.LEFT),pId);
});
check('Automatic 1v1 Center is allowed and remains protected afterwards',()=>{
 assert.equal(q.autoCenterOneVsOne(s),true);
 assert.equal(q.heroIdFrom(s.playerHeroes.CENTER),pId);
 assert.equal(q.heroIdFrom(s.aiHeroes.CENTER),aId);
 assert.ok(q.positionLockedOneVsOne(s));
 assert.equal(q.autoCenterOneVsOne(s),false);
});
check('Reviving a Hero unlocks 2v1 swaps and relocks if back to 1v1',()=>{
 s.playerHeroes.LEFT=q.heroState('S0-WAR-H001','PLAYER','LEFT');
 assert.equal(q.positionLockedOneVsOne(s),false);
 assert.equal(q.manualRepositionAvailable(s),true);
 s.playerHeroes.LEFT.hp=0;
 assert.equal(q.positionLockedOneVsOne(s),true);
});
console.log('RC9 Stage3 UI + donor Batch2 + 2-seat Legacy '+count+'/'+count+' PASS');
