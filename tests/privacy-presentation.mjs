import assert from 'node:assert/strict';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';

const HIDDEN='__HIDDEN_CARD_BACK__';
const raw={appState:{
  playerHand:['S0-WAR-001','S0-ITM-001'],aiHand:['S0-MAG-001'],
  playerDeck:['S0-WAR-002'],aiDeck:['S0-MAG-002'],
  playerLegacy:['S0-WAR-H001'],aiLegacy:['S0-MAG-H001'],
  playerManaDeck:[{uid:'secret1',kind:'CLASS',class_name:'Warrior'}],
  aiManaDeck:[{uid:'secret2',kind:'CLASS',class_name:'Mage'}],
  playerManaPoolCards:[{uid:'own',kind:'GENERIC',class_name:''}],
  aiManaPoolCards:[{uid:'opponentManaUID',kind:'CLASS',class_name:'Mage'}],
  aiLegacyPackageSlots:[{secret:'package'}],aiManaClasses:['Mage'],
  lastDrawnCardBySide:{PLAYER:'S0-WAR-001',AI:'S0-MAG-001'},
  presentationEvents:[
    {type:'CARD_DRAWN',id:'d1',side:'PLAYER',reason:'DRAW_PHASE',card_id:'S0-WAR-001',hand_index:0,secret:'must-not-leak'},
    {type:'CARD_DRAWN',id:'d2',side:'AI',reason:'DRAW_PHASE',card_id:'S0-MAG-001',hand_index:0,secret:'must-not-leak'},
    {type:'CARD_NEGATED',id:'n1',counter_side:'PLAYER',counter_card_id:'S0-DEF-001',target_side:'AI',target_card_id:'S0-MAG-002',hidden_future_draw:'S0-MAG-017'},
    {type:'RACIAL_TOKEN_USED',id:'r1',side:'AI',ability_name:'Stoneblood',source_hero_card_id:'S0-WAR-H002',token_cost:1,hidden_hand:['S0-ITM-014']}
  ],pending:null,responseWindow:null,log:['secret card'],lastActualDrawEvent:{secret:'S0-MAG-004'}
}};
const safe=viewerSafeBoard(raw,{seat:1,revision:2,secret:Buffer.alloc(32)});
assertViewerSafeBoard(safe);
const st=safe.appState;
assert.deepEqual(st.aiHand,[HIDDEN]);
assert.equal(st.lastDrawnCardBySide.AI,HIDDEN);
assert.deepEqual(st.aiManaPoolCards.map(x=>[x.hidden,x.kind]),[[true,'HIDDEN']]);
assert.equal(st.presentationEvents[0].card_id,'S0-WAR-001');
assert.equal(st.presentationEvents[1].card_id,undefined);
assert.deepEqual(st.presentationEvents[2],{
 id:'n1',type:'CARD_NEGATED',counter_side:'PLAYER',counter_card_id:'S0-DEF-001',target_side:'AI',target_card_id:'S0-MAG-002'
});
assert.deepEqual(st.presentationEvents[3],{
 id:'r1',type:'RACIAL_TOKEN_USED',side:'AI',ability_name:'Stoneblood',source_hero_card_id:'S0-WAR-H002',token_cost:1
});
assert.equal(st.presentationEvents[3].hidden_hand,undefined);
assert.equal(st.log.length,0);
assert.equal(st.lastActualDrawEvent,undefined);
console.log('PASS viewer privacy + public Counter/Racial Trait event metadata');
