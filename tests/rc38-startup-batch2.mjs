/** Batch 2: cached VM compilation is reused, but every match owns its game state. */
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {Season0HeadlessAuthority,primeSeason0Runtime,runtimeBootstrapStatsForQA,RC32_RUNTIME_SOURCES} from '../server/headless-rc32.mjs';
import {season0StarterCatalog} from '../server/s0-pregame-catalog.mjs';

const root=join(import.meta.dirname,'../public/battle');
const before=runtimeBootstrapStatsForQA();
const t0=performance.now();
const scripts=primeSeason0Runtime(root);
const precompiledMs=performance.now()-t0;
assert.equal(scripts.length,RC32_RUNTIME_SOURCES.length);
assert.ok(scripts.every(s=>typeof s.runInContext==='function'));
assert.equal(primeSeason0Runtime(root),scripts,'Same readonly scripts reused across games');
const afterPrime=runtimeBootstrapStatsForQA();
assert.equal(afterPrime.compilations-before.compilations,RC32_RUNTIME_SOURCES.length,'Each source compiled exactly once');
assert.ok(afterPrime.cacheHits>=1);
const keys=Object.keys(season0StarterCatalog);
assert.equal(keys.length,5);
const deck1=season0StarterCatalog[keys[0]].deck,deck2=season0StarterCatalog[keys[1]].deck;
const firstAt=performance.now();
const a=new Season0HeadlessAuthority(root);
const firstMs=performance.now()-firstAt;
const nextAt=performance.now();
const b=new Season0HeadlessAuthority(root);
const nextMs=performance.now()-nextAt;
assert.equal(runtimeBootstrapStatsForQA().compilations,afterPrime.compilations,'Authority construction must not compile more JS');
// Both isolated engines can start simultaneously from identical immutable donor
// scripts without cross-match card, Mana, Hand or turn contamination.
a.start({player1Deck:deck1,player2Deck:deck2,player1Name:'Match A 1',player2Name:'Match A 2'});
b.start({player1Deck:deck2,player2Deck:deck1,player1Name:'Match B 1',player2Name:'Match B 2'});
assert.equal(a.revision,1);assert.equal(b.revision,1);
assert.notDeepEqual(a._canonicalForServerOnly().appState.playerHeroes,b._canonicalForServerOnly().appState.playerHeroes);
a.completeOpening(1,'HEADS');
assert.ok(a.revision>=2);assert.equal(b.revision,1,'One match opening must not mutate another match');
b.completeOpening(2,'TAILS');
assert.ok(b.revision>=2);
assert.equal(runtimeBootstrapStatsForQA().compilations,afterPrime.compilations,'No script compilation during start/opening');
console.log(JSON.stringify({ok:true,sourcesCompiledOnce:scripts.length,precompiledMs:Number(precompiledMs.toFixed(1)),match1ContextMs:Number(firstMs.toFixed(1)),match2ContextMs:Number(nextMs.toFixed(1)),isolatedMatches:true}));
