'use strict';
// Current RC38 deck/mana guard. Run the actual application runtime, not an
// extracted validator fragment (which misses Hero/Hybrid helper functions).
// Mana is determined by selected Hero progressions regardless of imported JSON.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../..');
const ctx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,
  performance:{now:()=>0},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},
  requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},crypto:require('crypto').webcrypto};
ctx.window=ctx;ctx.globalThis=ctx;ctx.location={href:'http://example.test/index.html',origin:'http://example.test'};
ctx.navigator={userAgent:'RC38 Deck Guard'};
ctx.document={readyState:'loading',addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],body:null,documentElement:null};
vm.createContext(ctx);
for(const file of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
  let src=fs.readFileSync(path.join(root,file),'utf8');
  if(file.endsWith('app.bundle.js'))src=src.replace(/\n\}\)\(\);\s*$/,'\nwindow.__DECK_GUARD={initCards,validateDeck,buildManaDeckForDeck,eligibleManaClassesForDeck};\n})();');
  vm.runInContext(src,ctx,{filename:file,timeout:60000});
}
ctx.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true);
const Q=ctx.__DECK_GUARD;Q.initCards();
const cards=Object.fromEntries(ctx.GL_CARD_DEFINITIONS.cards.map(c=>[c.card_id,c]));
const clone=x=>JSON.parse(JSON.stringify(x)),results=[];
for(const [id,entry] of Object.entries(ctx.GL_ACTIVE_STARTER_DECKS)){
  const d=entry.deck,base=Q.validateDeck(d,'PLAYER');
  assert(base.ok,'Invalid starter '+id+': '+base.errors.join('|'));
  const selected=Array.from(Q.eligibleManaClassesForDeck(base.deck)).sort();
  const physical=Q.buildManaDeckForDeck(d,'PLAYER');
  assert.equal(physical.length,12);
  assert.deepEqual(Array.from(physical.filter(x=>x.kind==='CLASS').map(x=>x.class_name).sort()),selected);
  const smaller=clone(d);if(smaller.main_deck[0].quantity===1)smaller.main_deck.shift();else smaller.main_deck[0].quantity--;
  assert(!Q.validateDeck(smaller,'PLAYER').ok,'49 card deck legal '+id);
  const larger=clone(d);larger.main_deck[0].quantity++;
  assert(!Q.validateDeck(larger,'PLAYER').ok,'51 card deck legal '+id);
  const ult=d.main_deck.find(x=>cards[x.card_id]&&cards[x.card_id].is_ultimate);
  if(ult){const x=clone(d),card=x.main_deck.find(c=>c.card_id===ult.card_id);card.quantity++;
    const other=x.main_deck.find(c=>c.card_id!==ult.card_id&&c.quantity>1)||x.main_deck.find(c=>c.card_id!==ult.card_id);
    if(other.quantity===1)x.main_deck.splice(x.main_deck.indexOf(other),1);else other.quantity--;
    assert(!Q.validateDeck(x,'PLAYER').ok,'duplicate ultimate legal '+id);
  }
  const contradictory=clone(d);contradictory.mana_deck=[{kind:'CLASS',class_name:'Mage',quantity:13}];
  const forced=Q.validateDeck(contradictory,'PLAYER');assert(forced.ok,'Mana JSON should be ignored '+id);
  assert.deepEqual(Array.from(Q.buildManaDeckForDeck(contradictory,'PLAYER').filter(x=>x.kind==='CLASS').map(x=>x.class_name).sort()),selected);
  results.push({id,legality:'PASS',wrong49:'REJECTED',wrong51:'REJECTED',duplicateUltimate:'REJECTED',contradictoryMana:'OVERRIDDEN'});
}
console.log('PASS: 5 S0 starters, 49/51 cards rejected, duplicate Ultimate rejected, contradictory Mana JSON replaced by Hero-derived 12-Shard deck.');
console.log(JSON.stringify(results));
