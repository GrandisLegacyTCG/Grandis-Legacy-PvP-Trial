/** PvP RC36.8 public combat VFX and target routing smoke tests. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
const runtime=readFileSync(new URL('../public/battle/shared-app/app-runtime.js',import.meta.url),'utf8');
const start=runtime.indexOf('/* PvP-only visual feedback:');
const end=runtime.indexOf('function buildPresentationPlan(s){',start);
assert.ok(start>0&&end>start,'Production combat presentation exists');
const ctx={window:{GL_APP_MODE:'PVP'},console,Set,Map,Number,Math,String,Array};
vm.createContext(ctx);vm.runInContext(runtime.slice(start,end),ctx);
const hero=(hp,statuses=[])=>({hp,statuses,legacy:false});
const visual=(left,center,right)=>({hero:{AI:{LEFT:left,CENTER:center,RIGHT:right},PLAYER:{}}});
const baseline=visual(hero(100),hero(100),hero(100));
const during=visual(hero(100,[{name:'Poison',duration:2}]),hero(100),hero(100));
const resolved=visual(hero(70,[{name:'Poison',duration:2}]),hero(80,[{name:'Burn',duration:3}]),hero(100));
const area={kind:'incoming_attack',card_id:'S0-MAG-AREA',source_side:'PLAYER',source_lane:'CENTER',target_side:'AI',target_lane:'CENTER',attack_type:'Area Attack',damage_type:'Magical',affected_lanes:['LEFT','CENTER','RIGHT']};
assert.equal(ctx.pvpAttackVisualPlan({responseWindow:area,round:2},during,baseline),null,'Wait for all responses');
assert.equal(ctx.pvpAttackVisualPlan({responseWindow:{kind:'incoming_card'},round:2},during,during),null,'Wait for nested card');
assert.equal(ctx.pvpAttackVisualPlan({pending:{type:'response_payment_choice'},round:2},during,during),null,'Wait for Mana');
const batch=ctx.pvpAttackVisualPlan({pending:null,responseWindow:null,round:2},resolved,during);
assert.deepEqual(Array.from(batch.targets,t=>t.lane),['LEFT','CENTER','RIGHT']);
assert.deepEqual(Array.from(batch.targets,t=>t.damage),[30,20,0]);
assert.deepEqual(Array.from(batch.targets[0].statuses),['Poison']);
assert.deepEqual(Array.from(batch.targets[1].statuses),['Burn']);
assert.equal(ctx.pvpAttackVisualPlan({pending:null,responseWindow:null},resolved,resolved),null,'No duplicates');
const screen={clips:[],pulse:0};
function el(tag){return {tagName:tag,children:[],style:{},classList:{add(x){if(x==='gl-battle-damage-card')screen.pulse++},remove(){}},appendChild(n){this.children.push(n);if(n.className==='gl-battle-vfx-clip')screen.clips.push(n);return n},setAttribute(){},remove(){}}}
const layer=el('div');layer.id='glBattleFeedbackLayer';
ctx.document={getElementById:id=>id==='glBattleFeedbackLayer'?layer:null,createElement:el,body:el('body')};
ctx.heroCardEl=()=>({closest(){return{}}});ctx.uiRect=()=>({left:10,top:10,width:90,height:126});
ctx.uiLaneElement=()=>el('lane');ctx.E=()=>({getSoundEnabled:()=>false});ctx.setTimeout=()=>0;
assert.equal(ctx.playPvpCombatVisualBatch(batch),true);
assert.equal(screen.clips.length,3,'All three Attack effects start together');
assert.equal(screen.pulse,2,'Only damaged Heroes shake');
assert.equal(screen.clips.filter(c=>c.children.some(n=>n.src?.includes('Icon-'))).length,2);
assert.ok(screen.clips.every(c=>c.children.some(n=>n.className?.includes('gl-battle-mattack'))));
const raw={appState:{playerHand:[],aiHand:['secret'],playerDeck:[],aiDeck:['hidden'],playerLegacy:[],aiLegacy:[],playerManaDeck:[],aiManaDeck:[],aiManaPoolCards:[],pending:{type:'response_window',decision_side:'AI',private_data:'secret'},responseWindow:{...area,response_owner:'AI',options:[{card_id:'hidden-response'}]}}};
const safe=viewerSafeBoard(raw,{seat:1,revision:5,secret:Buffer.alloc(32,5)});
assertViewerSafeBoard(safe);
assert.deepEqual(safe.appState.responseWindow.affected_lanes,['LEFT','CENTER','RIGHT']);
assert.equal('options' in safe.appState.responseWindow,false);
assert.equal('private_data' in safe.appState.pending,false);
const a=runtime.indexOf('  const tributePanelAction='),b=runtime.indexOf('  hc.ondblclick=',a);
assert.ok(a>0&&b>a);
function click({legal=true,blocked=false}={}){
 const calls=[],laneEl={},g={p:{type:'target_selection'},side:'AI',lane:'CENTER',engineSelectable:legal,responseSelectable:false,
 directTributeHeroReady:()=>false,runTributeLikeHeroAction(){},selectResponseRouteHero(){},
 intent:(name,args)=>calls.push([name,Array.from(args)]),laneEl};
 vm.runInNewContext(runtime.slice(a,b),g);
 laneEl.onclick?.({target:{closest:()=>blocked},preventDefault(){},stopPropagation(){}});
 return calls;
}
assert.deepEqual(click(),[['chooseHeroFromBoard',['AI','CENTER']]]);
assert.deepEqual(click({blocked:true}),[]);
assert.deepEqual(click({legal:false}),[]);
console.log('PASS ST target click and simultaneous Area Attack damage/status after all Responses; viewer privacy intact');
