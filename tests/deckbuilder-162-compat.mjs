/** Deck Builder v1.62 export SHAPE regression, derived from its s0Export() implementation.
 * This is a schema-shaped fixture from a current approved S0 starter; it is not
 * an actual click-to-export browser test of the v1.62 Deck Builder UI. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {Season0HeadlessAuthority} from '../server/headless-rc32.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../client');
const approved=JSON.parse(readFileSync(resolve(root,'runtime/season0-authority/DeckBuilder-v1.58-Starter-01.json'),'utf8'));
const canonical=approved.deck;
const draft={
  main_deck:structuredClone(canonical.main_deck),
  legacy_packages:structuredClone(canonical.legacy_packages),
  shard_deck:structuredClone(canonical.shard_deck)
};
const formation=structuredClone(approved.default_formation);
// Match the field names in the actual Deck Builder v1.62 `s0Export()`.
const exported={
  schema:'GL-SEASON0-DECK-DRAFT-1',schema_version:'GL-SEASON0-DECK-DRAFT-1',
  source_authority:'R3.4-MainDeck-LegacyDeck-PlayerRulebook-v2.9',
  rulebook:'v2.9',season:'S0',builder_version:'1.61',style:'style1',
  exported_at:'2026-11-07T00:00:00.000Z',name:'Builder v1.62 format fixture',deck_name:'Builder v1.62 format fixture',
  deck:draft,validation:{ok:true,errors:[],warnings:[]},is_valid:true,
  validation_issues:[],validation_warnings:[],main_deck:structuredClone(draft.main_deck),
  shard_deck:structuredClone(draft.shard_deck),legacy_packages:structuredClone(draft.legacy_packages),
  legacy_deck_package_slots:draft.legacy_packages.map(pkg=>({progression:pkg.hero_rank_ids[0],legacy:pkg.legacy_card_id})),
  default_formation:formation
};
export function builder162Fixture(){return structuredClone(exported);}
const game=new Season0HeadlessAuthority(root);
const ret=game.start({player1Deck:builder162Fixture(),player2DeckKey:game.starterIds[1]});
assert.equal(ret.revision,1);
const app=game._canonicalForServerOnly().appState;
assert.equal(app.playerDeck.length,50);
assert.equal(app.playerManaDeck.length,12);
assert.equal(app.pvpHumanVsHuman,true);
game.completeOpening(1);
const opened=game._canonicalForServerOnly().appState;
assert.equal(opened.playerHand.length,7);
assert.equal(opened.playerManaPoolCards.length,4);
for(const change of [
  data=>data.season='S1',
  data=>data.deck.legacy_packages[0].hero_rank_ids.pop(),
  data=>data.deck.main_deck[0].card_id='S1-FAKE-000',
]){
  const bad=builder162Fixture();change(bad);
  const host=new Season0HeadlessAuthority(root);
  assert.throws(()=>host.start({player1Deck:bad,player2DeckKey:host.starterIds[0]}));
}
console.log('PASS: v1.62 s0Export()-shaped custom deck schema accepted by RC32 engine (50/12/12), invalid S1/legacy/card rejected. Not an actual v1.62 UI export test.');
