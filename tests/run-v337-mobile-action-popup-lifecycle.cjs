'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const net=fs.readFileSync(path.join(root,'public/js/pvp-network.js'),'utf8');

// Functional check of the actual helper used by the capture-phase PvP click bridge.
const start=net.indexOf('function closeMobileHeroActionMenu(node){');
const end=net.indexOf('\n  function mapGameplayClick(ev){',start);
assert(start>=0&&end>start,'closeMobileHeroActionMenu helper missing');
const helperSource=net.slice(start,end).trim();
let removed=[];
const overlay={classList:{remove(name){removed.push(name);}}};
const context={$:(id)=>id==='infoOverlay'?overlay:null};
vm.createContext(context);
vm.runInContext(helperSource+'; this.closeMobileHeroActionMenu=closeMobileHeroActionMenu;',context);
const inside={closest:(selector)=>selector==='.mobile-hero-action-menu'?{}:null};
const outside={closest:()=>null};
assert.strictEqual(context.closeMobileHeroActionMenu(inside),true,'mobile Hero Action popup should close for an action choice');
assert.deepStrictEqual(removed,['open'],'infoOverlay open class was not removed');
removed=[];
assert.strictEqual(context.closeMobileHeroActionMenu(outside),false,'non-mobile action clicks must not close unrelated info popup');
assert.deepStrictEqual(removed,[],'unrelated click closed info popup');

// Verify the authoritative capture branches use the lifecycle helper before dispatching the intent.
for(const [selector,intent] of [
  ["[data-racial-id]",'beginActivatedRacialAbility'],
  ["[data-class-ability-id]",'beginActivatedHeroAbility'],
  ["[data-legacy-id]",'beginActivatedLegacyAbility']
]){
  const token=`t.closest('${selector}')`;
  const at=net.indexOf(token); assert(at>=0,selector+' authoritative click branch missing');
  const line=net.slice(at,net.indexOf('\n',at));
  assert(line.includes('closeMobileHeroActionMenu(node);prevent(ev);return runtimeIntent(\''+intent+'\''),selector+' must close mobile popup before authoritative intent');
}
console.log('PASS PvP v3.37: mobile Hero Action popup closes before authoritative Racial Trait/Class Ability/Legacy Ability intent dispatch.');
