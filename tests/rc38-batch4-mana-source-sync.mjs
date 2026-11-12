/** PvP Batch 4: latest 12 Nov 2026 RC38 auto Mana app policy, actual RC38 VM. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {Season0HeadlessAuthority} from '../server/headless-rc32.mjs';
import {season0StarterCatalog} from '../server/s0-pregame-catalog.mjs';

const root=join(process.cwd(),'public/battle');
const starters=Object.values(season0StarterCatalog).map(s=>s.deck);
const prefix={WAR:'Warrior',MAG:'Mage',ARC:'Archer',CLE:'Cleric',THF:'Thief'};
const hybrid={
  'S0-WAR-H008':'Cleric','S0-WAR-H009':'Cleric',
  'S0-MAG-H008':'Warrior','S0-MAG-H009':'Warrior',
  'S0-CLE-H008':'Archer','S0-CLE-H009':'Archer',
  'S0-THF-H008':'Mage','S0-THF-H009':'Mage',
  'S0-ARC-H008':'Thief','S0-ARC-H009':'Thief'
};
function classesForLegacy(legacy){
 const names=new Set();
 for(const entry of legacy){
  const id=typeof entry==='string'?entry:entry.card_id;
  if(!/H\d{3}$/.test(id))continue;
  names.add(prefix[id.split('-')[1]]);
  if(hybrid[id])names.add(hybrid[id]);
 }
 return [...names].sort();
}
function manaFromState(s,side){
 const cards=(side==='PLAYER'?[...(s.playerManaDeck||[]),...(s.playerManaPoolCards||[])]:
   [...(s.aiManaDeck||[]),...(s.aiManaPoolCards||[])]);
 assert.equal(cards.length,12,`${side} has exactly 12 physical Mana`);
 assert.ok(cards.every(x=>x&&x.uid&&['CLASS','GENERIC'].includes(x.kind)));
 const classes=cards.filter(x=>x.kind==='CLASS').map(x=>x.class_name).sort();
 assert.equal(classes.length,new Set(classes).size,'Color Mana has no duplicates');
 assert.equal(cards.filter(x=>x.kind==='GENERIC').length,12-classes.length);
 return classes;
}
function startDeck(aDeck,bDeck){
 const a=new Season0HeadlessAuthority(root);
 a.start({player1Deck:aDeck,player2Deck:bDeck});
 const s=a._canonicalForServerOnly().appState;
 return {a,s};
}
// Every official starter is already consistent; the new RC38 rule must also
// produce exactly the same physically shuffled colors for both local seats.
for(const deck of starters){
 const raw=structuredClone(deck),before=JSON.stringify(raw);
 const {s}=startDeck(raw,raw);
 assert.deepEqual(manaFromState(s,'PLAYER'),classesForLegacy(deck.legacy_deck_expanded));
 assert.deepEqual(manaFromState(s,'AI'),classesForLegacy(deck.legacy_deck_expanded));
 assert.equal(JSON.stringify(raw),before,'Input deck is not mutated');
}
console.log('PASS Batch4: all five starter decks derive 12 Mana from selected Hero lineages on both seats');

// A v1.64-shaped export with contradictory, missing, or wildly oversized Mana
// must succeed. Main/Legacy remain authoritative and still validate normally.
function builderExport(deck){
 const legacy_packages=deck.legacy_deck_package_slots.map(p=>({
   hero_rank_ids:deck.legacy_deck_expanded.filter(x=>x.package_id===p.package_id&&x.card_type==='Hero').map(x=>x.card_id),
   legacy_card_id:p.legacy
 }));
 return {season:'S0',schema:'GL-SEASON0-DECK-DRAFT-1',
   main_deck:structuredClone(deck.main_deck),legacy_packages:structuredClone(legacy_packages),
   shard_deck:[{kind:'CLASS',class_name:'Thief',quantity:999}],
   deck:{main_deck:structuredClone(deck.main_deck),legacy_packages,
     default_formation:structuredClone(deck.default_formation),
     shard_deck:[{kind:'CLASS',class_name:'Unknown',quantity:-4}]}};
}
const raw=builderExport(starters[0]);const rawBefore=JSON.stringify(raw);
const {a,s}=startDeck(raw,raw);
const expectation=classesForLegacy(starters[0].legacy_deck_expanded);
assert.deepEqual(manaFromState(s,'PLAYER'),expectation);
assert.deepEqual(manaFromState(s,'AI'),expectation);
assert.equal(JSON.stringify(raw),rawBefore,'Imported original nested JSON not mutated');
a.completeOpening(1,'HEADS',1,'FIRST');
const afterOpening=a._canonicalForServerOnly().appState;
assert.deepEqual(manaFromState(afterOpening,'PLAYER'),expectation);
assert.deepEqual(manaFromState(afterOpening,'AI'),expectation);
assert.ok(afterOpening.playerManaPoolCards.length>=3,'Opening has >=3 Shards, including any first Draw Phase Mana Regen');
assert.ok(afterOpening.aiManaPoolCards.length>=3,'Opponent opening has >=3 Shards');
console.log('PASS Batch4: v1.64 nested export ignores conflicting/off-Class/oversized Mana on both seats through Opening');

// Hybrid example combining 3 selected progressions yields five distinct
// eligible base Classes; old code capped at 3 or followed Ultimate classes.
const lanes=['LEFT','CENTER','RIGHT'];
const hybridProgressions=['S0-WAR-H007','S0-THF-H007','S0-ARC-H007'];
const custom=structuredClone(starters[0]);
custom.legacy_deck_expanded=[];custom.legacy_deck_package_slots=[];custom.default_formation={};
for(let i=0;i<3;i++){
 const prog=hybridProgressions[i];
 const donor=starters.find(d=>d.legacy_deck_package_slots.some(p=>p.progression===prog));
 assert.ok(donor,'Missing approved hybrid '+prog);
 const p=donor.legacy_deck_package_slots.find(x=>x.progression===prog);
 custom.legacy_deck_package_slots.push({...structuredClone(p),slot:lanes[i]});
 custom.legacy_deck_expanded.push(...structuredClone(donor.legacy_deck_expanded.filter(e=>e.package_id===p.package_id)));
 custom.default_formation[lanes[i]]=prog;
}
custom.mana_deck=[{kind:'MANA',quantity:12}];custom.shard_deck='not even an array';
const mix=startDeck(custom,custom).s;
for(const side of ['PLAYER','AI'])assert.deepEqual(manaFromState(mix,side),['Archer','Cleric','Mage','Thief','Warrior']);
console.log('PASS Batch4: 3 hybrid packages yield 5 distinct Color Mana without artificial 3-color cap');

const engine=readFileSync(join(root,'engine/shared-app/app.bundle.js'),'utf8');
const client=readFileSync(join(root,'runtime/pvp-network.js'),'utf8');
const lobby=readFileSync(join(process.cwd(),'public/pvp/pvp-host.js'),'utf8');
const review=readFileSync(join(root,'assets/review-db158/js/review-renderer-v158.js'),'utf8');
assert.match(engine,/manaDeckCompositionForSelectedHeroes\(deck\)/);
assert.match(engine,/applyExactResponsePayment/);
assert.match(engine,/applyExactManaPayment/);
assert.match(engine,/glPvpSwapKeys/);
assert.match(client,/commitExactLocalChoiceDraft/);
assert.match(lobby,/BATTLE_CHANNEL='gl-pvp-battle-transport-v1'/);
assert.match(review,/return 2 EXP cards to your Hand/);
console.log('PASS Batch4: RC5 atomic Mana, RC6 single-socket lobby, Batch3 drafts and v3.2 Rank Up review preserved');
