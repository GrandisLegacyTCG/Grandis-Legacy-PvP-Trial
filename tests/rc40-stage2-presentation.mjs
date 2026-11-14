import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
const src=readFileSync(new URL('../public/battle/shared-app/app-runtime.js',import.meta.url),'utf8') + '\n' + readFileSync(new URL('./fixtures/rc9-legacy-cardplayed-helpers.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/battle/shared-ui/battlefield-ui.css',import.meta.url),'utf8');
const extract=name=>{const start=src.indexOf('function '+name+'(');assert.ok(start>=0,name);const end=src.indexOf('\nfunction ',start+1);assert.ok(end>start,name+' boundary');return src.slice(start,end)};
let checks=0;
function check(name,fn){fn();console.log('PASS '+name);checks++}
const cards={
  'S0-WAR-H004':{name:'Bromir Oathforge'},
  'S0-ARC-H004':{name:'Akra Norixius'},
  'S0-ARC-007':{name:'Dragon Scale'},
  'S0-MAG-001':{name:'Arcane Disruption'}
};
const ctx={window:{GL_APP_MODE:'PVP'},console,Set,Map,Math,Number,String,Array,Object,JSON,
  cv:id=>cards[id]||{name:id},esc:v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),
  art:id=>'card-art/'+id+'.webp',laneOrder:['LEFT','CENTER','RIGHT'],
  sideHeroes:(s,side)=>side==='AI'?s.aiHeroes:s.playerHeroes,
  heroImageId:h=>h?.card_id,
  rawCardDef:()=>({family:'item',classification:'utility'}),isDefenseResponseArrowCard:()=>false,
  heroCardEl:(side,lane)=>({side,lane,closest:()=>null,parentElement:{side,lane}}),
  st:()=>ctx.scene,requestAnimationFrame:fn=>fn(),
  layoutManaPoolCards:()=>{},glOpeningHiddenShardUids:new Set(),
  pendingOwner:p=>p?.decision_side,centerChoiceModeFor:()=>null,
  sortedShardPoolForDisplay:(p)=>p,
  pvpManaInfo:()=>null,
  battlefieldHoverSource:null,hideBattlefieldHoverPreview:()=>{},
  shardArt:sh=>'card-art/'+sh.uid+'.webp',bindBattlefieldPreview:()=>{},
  playPvpBattleSound:(file)=>{ctx.sounds.push(file)},
  sounds:[],E:()=>({getSoundEnabled:()=>true}),
  uiRect:()=>({left:40,top:30,width:120,height:180}),uiLaneElement:()=>({classList:{remove(){},add(){}}}),
  setTimeout:()=>0
};
ctx.scene={playerHeroes:{LEFT:{card_id:'S0-WAR-H004'},CENTER:{card_id:'S0-ARC-H004'}},aiHeroes:{},pending:null};
createContext(ctx);
for(const name of ['currentLaneForTargetHero','normalizeAction','itemEventArrowContexts',
  'targetElementForContext','playPvpCombatVisualBatch']) runInContext(extract(name),ctx);
check('Arrow uses target Hero identity through position swap, never stale lane',()=>{
  const act=ctx.normalizeAction({card_id:'S0-ITM-001',source_side:'PLAYER',target_side:'PLAYER',target_lane:'CENTER',target_hero_card_id:'S0-WAR-H004'});
  assert.equal(act.target_hero_card_id,'S0-WAR-H004');
  const contexts=ctx.itemEventArrowContexts({...act,side:'PLAYER'});
  assert.equal(contexts.length,1);
  const tar=ctx.targetElementForContext(contexts[0]);
  assert.equal(tar.lane,'LEFT');
  assert.equal(ctx.targetElementForContext({...contexts[0],target_hero_card_id:'S0-UNKNOWN-H007'}),null);
});
class FakeElement {
  constructor(tag){this.tagName=tag;this.dataset={};this.children=[];this.parentElement=null;this.attributes={};this.className='';this.style={};this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};}
  appendChild(node){if(node.parentElement)node.parentElement.removeChild(node);this.children.push(node);node.parentElement=this;return node;}
  insertBefore(node,ref){if(node.parentElement)node.parentElement.removeChild(node);let idx=ref?this.children.indexOf(ref):-1;if(idx<0)idx=this.children.length;this.children.splice(idx,0,node);node.parentElement=this;return node;}
  removeChild(node){const idx=this.children.indexOf(node);if(idx>=0)this.children.splice(idx,1);node.parentElement=null;return node;}
  remove(){this.parentElement?.removeChild(this)}
  querySelectorAll(){return this.children.filter(x=>x.className.split(' ').includes('mana-card'))}
  querySelector(sel){return sel==='img'?this.children.find(x=>x.tagName==='img')||null:null}
  getAttribute(n){return this.attributes[n]||null}
  setAttribute(n,v){this.attributes[n]=String(v)}
}
ctx.document={createElement:tag=>new FakeElement(tag),getElementById:()=>null,body:new FakeElement('body')};
ctx.playerManaHost=new FakeElement('host');ctx.aiManaHost=new FakeElement('host');
ctx.playerManaCount={textContent:''};ctx.aiManaCount={textContent:''};
ctx.intent=()=>{};
runInContext(extract('renderPool'),ctx);
check('Mana Pool retains physical DOM nodes on pending/local selection and opponent snapshot',()=>{
  const a=[{uid:'A',kind:'MANA'},{uid:'B',kind:'CLASS',class_name:'Mage'}];
  ctx.renderPool(ctx.playerManaHost,ctx.playerManaCount,a,'PLAYER');
  const original=[...ctx.playerManaHost.children],images=original.map(x=>x.children[0]);
  ctx.scene.pending={type:'mana_shard_payment_choice',decision_side:'PLAYER',selected_shard_uids:['A']};
  ctx.pvpManaInfo=()=>({plan:{selected_shard_uids:['A']}});
  ctx.renderPool(ctx.playerManaHost,ctx.playerManaCount,a,'PLAYER');
  assert.strictEqual(ctx.playerManaHost.children[0],original[0]);
  assert.strictEqual(ctx.playerManaHost.children[1],original[1]);
  assert.strictEqual(ctx.playerManaHost.children[0].children[0],images[0]);
  assert.match(ctx.playerManaHost.children[0].className,/gl-selected/);
  ctx.renderPool(ctx.playerManaHost,ctx.playerManaCount,[...a,{uid:'C',kind:'MANA'}],'PLAYER');
  assert.equal(ctx.playerManaHost.children.length,3);
  assert.strictEqual(ctx.playerManaHost.children[0],original[0]);
  assert.strictEqual(ctx.playerManaHost.children[1],original[1]);
  ctx.scene.pending=null;
  ctx.renderPool(ctx.playerManaHost,ctx.playerManaCount,a,'PLAYER');
  assert.equal(ctx.playerManaHost.children.length,2);
  assert.strictEqual(ctx.playerManaHost.children[0],original[0]);
  assert.strictEqual(ctx.playerManaHost.children[1],original[1]);
});
check('Full Block/Dodge at 0 HP damage has no additional Attack VFX or sound',()=>{
  ctx.sounds=[];
  assert.equal(ctx.playPvpCombatVisualBatch({attack:{damage_type:'Magical'},targets:[{side:'PLAYER',lane:'LEFT',damage:0,statuses:[]}]}),false);
  assert.deepEqual(ctx.sounds,[]);
  // An Attack that only changes Status is allowed status icons but never damage sound.
  ctx.document.getElementById=()=>null;
  ctx.playPvpCombatVisualBatch({attack:{damage_type:'Magical'},targets:[{side:'PLAYER',lane:'LEFT',damage:0,statuses:['Burn']} ]});
  assert.deepEqual(ctx.sounds,[]);
});
check('Actual damage still creates one sound; partial Block may retain Defense + damage',()=>{
  ctx.sounds=[];
  ctx.playPvpCombatVisualBatch({attack:{damage_type:'Magical'},targets:[
    {side:'PLAYER',lane:'LEFT',damage:20,statuses:[]},
    {side:'PLAYER',lane:'CENTER',damage:0,statuses:[]}
  ]});
  assert.deepEqual(ctx.sounds,['M.Atk.mp3']);
});
check('Card Played adopts per-Hero modifier amounts and donor-style compact rows',()=>{
  assert.ok(src.includes('g.modifiers.push({name:'));
  assert.ok(css.includes('gl-played-gameplay-row>strong{display:block'));
  assert.ok(src.includes('Actual HP Damage: 0'));
  assert.ok(src.includes('pvpPlayedResponseDetail(e)'));
  assert.ok(src.includes('pvpPlayedRelatedCards(e)'));
});
check('Viewer-safe Card Played modifier projection cannot leak private names',()=>{
  const state={round:1,playerHand:[],aiHand:['S0-SECRET-001'],playerDeck:[],aiDeck:['S0-SECRET-002'],playerLegacy:[],aiLegacy:[],playerManaDeck:[],aiManaDeck:[],playerManaPoolCards:[],aiManaPoolCards:[],playerHeroes:{},aiHeroes:{},pvpActionEventsBySide:{
    PLAYER:[{id:'played-1',label:'ATK',card_id:'S0-MAG-001',title:'Arcane Disruption',damage_breakdown_by_hero:[{
      name:'Akra Norixius',side:'AI',lane:'CENTER',summary:{base_damage:50,actual_hp_damage:20},
      modifiers:[{source_type:'Attachment',source_name:'Secret Hand: Hidden Card',amount:30},{source_type:'Attachment',source_name:'Coordination Attack',amount:20}]
    }]}],AI:[]},presentationEvents:[]};
  const view=viewerSafeBoard({appState:state},{seat:1,revision:1,secret:Buffer.alloc(32)});
  assertViewerSafeBoard(view);
  const s=JSON.stringify(view);
  assert.ok(!s.includes('Secret Hand')&&!s.includes('Hidden Card')&&!s.includes('S0-SECRET'));
  assert.ok(s.includes('Coordination Attack'));
});
check('Network runtime and local Mana draft preserved byte-for-byte from Patch1',()=>{
  const paths=['public/battle/runtime/pvp-network.js','public/battle/runtime/pvp-mana-draft.js','server/ws-lite.mjs','server/headless-rc32.mjs'];
  for(const path of paths){
    const a=readFileSync(new URL('../'+path,import.meta.url));
    const b=readFileSync(new URL('../../pvp_rc40_stage1/'+path,import.meta.url));
    assert.equal(createHash('sha256').update(a).digest('hex'),createHash('sha256').update(b).digest('hex'),path);
  }
});
console.log(`RC40 Stage2 presentation/parity: ${checks}/${checks} PASS`);
