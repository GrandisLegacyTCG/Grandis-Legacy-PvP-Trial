/** RC38 Hotfix3 public combat FX + opponent Mana privacy + legal ST lane click. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
const src=readFileSync(new URL('../public/battle/shared-app/app-runtime.js',import.meta.url),'utf8');
const start=src.indexOf('/* RC36.8 Hotfix3 retained in RC38:');
const end=src.indexOf('function buildPresentationPlan(s){',start);
assert.ok(start>0&&end>start);
const c={window:{GL_APP_MODE:'PVP'},console,Set,Map,Math,Number,String,Array,presentationPrimed:true,E(){return null;}};
c.findActiveAttackWindow=s=>s.responseWindow?.kind==='incoming_attack'?s.responseWindow:
   s.responseWindow?.original_attack_context?.kind==='incoming_attack'?s.responseWindow.original_attack_context:
   s.pending?.incoming_response_window||null;
vm.createContext(c);vm.runInContext(src.slice(start,end),c);
const hero=(hp,statuses=[])=>({hp,statuses,legacy:false});
const screen=(l,m,r)=>({hero:{AI:{LEFT:l,CENTER:m,RIGHT:r},PLAYER:{}}});
const old=screen(hero(100),hero(100),hero(100));
const pending=screen(hero(100),hero(100),hero(100));
const next=screen(hero(80,[{name:'Poison',duration:2}]),hero(90,[{name:'Burn',duration:3}]),hero(100));
const attack={kind:'incoming_attack',card_id:'S0-MAG-AREA',source_side:'PLAYER',source_lane:'CENTER',target_side:'AI',target_lane:'CENTER',attack_type:'Area Attack',damage_type:'Magical',affected_lanes:['LEFT','CENTER','RIGHT']};
assert.equal(c.pvpAttackVisualPlan({responseWindow:attack,round:2},pending,old),null);
assert.equal(c.pvpAttackVisualPlan({responseWindow:{kind:'incoming_card'},round:2},pending,pending),null,'nested Response waits');
assert.equal(c.pvpAttackVisualPlan({pending:{type:'response_payment_choice'},round:2},pending,pending),null);
const batch=c.pvpAttackVisualPlan({pending:null,responseWindow:null,round:2},next,pending);
assert.deepEqual(Array.from(batch[0].targets,x=>x.lane),['LEFT','CENTER','RIGHT']);
assert.deepEqual(Array.from(batch[0].targets,x=>x.damage),[20,10,0]);
assert.deepEqual(Array.from(batch[0].targets[0].statuses),['Poison']);
assert.deepEqual(Array.from(batch[0].targets[1].statuses),['Burn']);
assert.equal(c.pvpAttackVisualPlan({},next,next),null,'do not replay VFX');
const observed={clips:[],shakes:0};
function el(tag){return {tag,children:[],style:{},classList:{remove(){},add(n){if(n==='gl-battle-damage-card')observed.shakes++}},appendChild(x){this.children.push(x);if(x.className==='gl-battle-vfx-clip')observed.clips.push(x);return x},setAttribute(){},remove(){}}}
const layer=el('div');c.document={getElementById:id=>id==='glBattleFeedbackLayer'?layer:null,createElement:el,body:el('body')};
c.heroCardEl=()=>({closest(){return{}}});c.uiRect=()=>({left:0,top:0,width:100,height:140});
c.uiLaneElement=()=>el('lane');c.setTimeout=()=>0;
assert.equal(c.playPvpCombatVisualBatch(batch[0]),true);
assert.equal(observed.clips.length,3,'three simultaneous target effects');
assert.equal(observed.shakes,2,'zero-damage Hero never shakes');
assert.equal(observed.clips.filter(x=>x.children.some(y=>y.src?.includes('Icon-'))).length,2);
assert.match(src,/legalHeroPanelAction=engineSelectable\?\(\)=>intent\('chooseHeroFromBoard',\[side,lane\]\):null;/);
assert.match(src,/panelClickAction=responsePanelAction\|\|tributeClickAction\|\|legalHeroPanelAction/);
const view=viewerSafeBoard({appState:{
  playerHand:[],aiHand:['secret'],playerDeck:[],aiDeck:['hidden'],playerLegacy:[],aiLegacy:[],
  playerManaDeck:[],aiManaDeck:[],playerManaPoolCards:[],
  aiManaPoolCards:[{uid:'CANON-1',kind:'CLASS',class_name:'Mage'}],
  pending:{type:'response_window',decision_side:'AI',private_data:'secret'},
  responseWindow:{...attack,response_owner:'AI',options:[{card_id:'SECRET-RESPONSE'}]}
}},{seat:1,revision:5,secret:Buffer.alloc(32,5)});
assertViewerSafeBoard(view);
assert.deepEqual(view.appState.responseWindow.affected_lanes,['LEFT','CENTER','RIGHT']);
assert.equal('options' in view.appState.responseWindow,false);
assert.equal('private_data' in view.appState.pending,false);
assert.deepEqual(view.appState.aiManaPoolCards,[{uid:'PVP-OPPONENT-PUBLIC-0',kind:'CLASS',class_name:'Mage',owner_side:'AI',hidden:false}]);
console.log('PASS RC38: ST legal lane; Area Attack parallel damage+Status after Responses; visible opponent Mana; hidden private Response');
