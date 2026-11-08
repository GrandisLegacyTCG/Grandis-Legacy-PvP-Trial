import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { season0StarterCatalog } from '../server/s0-pregame-catalog.mjs';
const ROOT=resolve(import.meta.dirname,'..');
const catalogKeys=Object.keys(season0StarterCatalog);
assert.equal(catalogKeys.length,5);
for(const key of catalogKeys){
 const d=season0StarterCatalog[key].deck;
 assert.ok(key.startsWith('s0_starter_'));
 assert.equal(d.main_deck_count,50);
 assert.equal(d.main_deck.reduce((a,c)=>a+c.quantity,0),50);
 assert.equal(d.legacy_deck_expanded.length,12);
 assert.equal(d.mana_deck_count,12);
 for(const id of Object.values(d.default_formation)){assert.ok(id.startsWith('S0-'));assert.ok(existsSync(resolve(ROOT,'public/battle/card-art',id+'.webp')),'Missing hero artwork '+id)}
 for(const entry of d.main_deck)assert.match(entry.card_id,/^S0-/);
}
const context={};context.window=context;
vm.runInNewContext(readFileSync(resolve(ROOT,'public/pvp/s0-lobby-catalog.js'),'utf8'),context);
assert.deepEqual(Object.keys(context.GL_S0_LOBBY_STARTERS),catalogKeys);
const cardctx={};cardctx.window=cardctx;
vm.runInNewContext(readFileSync(resolve(ROOT,'public/pvp/s0-lobby-card-definitions.js'),'utf8'),cardctx);
assert.ok(cardctx.GL_S0_LOBBY_CARD_DEFINITIONS.cards.every(x=>x.card_id.startsWith('S0-')));
const host=readFileSync(resolve(ROOT,'public/pvp/pvp-host.js'),'utf8');
assert.ok(host.includes('window.GL_S0_LOBBY_STARTERS||{}'));
assert.ok(host.includes('window.GL_S0_LOBBY_CARD_DEFINITIONS||{}'));
assert.ok(host.includes('battle/card-art/'));
assert.ok(!host.includes('function starters(){try{return bridge()?.getStarterDeckOptions'));
console.log(JSON.stringify({ok:true,source:'S0 RC34 compatible catalog',starterDecks:5,deckHeroArt:true},null,2));
