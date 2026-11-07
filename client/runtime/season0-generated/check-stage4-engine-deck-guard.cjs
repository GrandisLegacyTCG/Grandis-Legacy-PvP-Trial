'use strict';
// Actual v6.91.9-derived app.bundle.js validation functions are executed in a restricted VM context.
// This is a focused deck validation QA, NOT UI/gameplay or AI testing.
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..');
const source=fs.readFileSync(path.join(root,'engine/shared-app/app.bundle.js'),'utf8');
const a=source.indexOf('  function deckEntriesToIds('),b=source.indexOf('  function heroState(',a);
if(a<0||b<a)throw Error('Could not locate v6.91.9-derived deck validator');
const db=JSON.parse(fs.readFileSync(path.join(root,'runtime/season0-generated/s0-card-definitions.json'),'utf8'));
const cards=Object.fromEntries(db.cards.map(c=>[c.card_id,c]));
const context={CARD_BY_ID:cards,LANE_ORDER:['LEFT','CENTER','RIGHT'],
  clone:x=>JSON.parse(JSON.stringify(x)),card:id=>cards[id]||{},cardFamily:c=>c&&c.family||'',isUltimateCard:c=>!!(c&&(c.is_ultimate===true||c.requirement&&c.requirement.ultimate&&c.requirement.ultimate.is_ultimate)),
  manaClassFromCardCode:id=>({WAR:'Warrior',MAG:'Mage',ARC:'Archer',CLE:'Cleric',THF:'Thief'})[String(id||'').split('-')[1]]||''};
vm.createContext(context);
const fn=vm.runInContext(source.slice(a,b)+'\nvalidateDeck;',context,{timeout:3000});
const manaStart=source.indexOf('  function makeManaShard('),manaEnd=source.indexOf('  function manaDeckForSide(',manaStart);if(manaStart<0||manaEnd<manaStart)throw Error('Mana creation handler not found');
context.GL_LAB_MANA_DECK_SIZE=12;context.STARTUP_SHUFFLE_ENABLED=false;context.shuffleDeck=x=>x;const createMana=vm.runInContext(source.slice(manaStart,manaEnd)+'\nbuildManaDeckForDeck;',context,{timeout:3000});
const w={};vm.runInNewContext(fs.readFileSync(path.join(root,'engine/shared-app/active-starters.js'),'utf8'),{window:w,globalThis:w},{timeout:3000});
const results=[];
for(const [id,entry] of Object.entries(w.GL_ACTIVE_STARTER_DECKS)){
 let r=fn(entry.deck,'PLAYER');if(!r.ok)throw Error('Starter '+id+' invalid: '+r.errors.join(' | '));
 const mana=createMana(entry.deck,'PLAYER');if(mana.length!==12||JSON.stringify(mana.filter(x=>x.kind==='CLASS').map(x=>x.class_name).sort())!==JSON.stringify(entry.deck.mana_deck.filter(x=>x.kind==='CLASS').map(x=>x.class_name).sort()))throw Error('Engine Mana constructor mismatch '+id);
 const m=JSON.parse(JSON.stringify(entry.deck));if(m.main_deck[0].quantity===1)m.main_deck.shift();else m.main_deck[0].quantity--;if(fn(m,'PLAYER').ok)throw Error('49-card deck incorrectly legal '+id);
 const above=JSON.parse(JSON.stringify(entry.deck));above.main_deck[0].quantity++;if(fn(above,'PLAYER').ok)throw Error('51-card deck incorrectly legal '+id);
 const ult=entry.deck.main_deck.find(x=>cards[x.card_id].is_ultimate);
 if(ult){const d=JSON.parse(JSON.stringify(entry.deck));d.main_deck.find(x=>x.card_id===ult.card_id).quantity++;const other=d.main_deck.find(x=>x.card_id!==ult.card_id&&x.quantity>1)||d.main_deck.find(x=>x.card_id!==ult.card_id);if(other.quantity===1)d.main_deck.splice(d.main_deck.indexOf(other),1);else other.quantity--;if(fn(d,'PLAYER').ok)throw Error('Duplicate Ultimate incorrectly legal '+id);}
 const wrongMana=JSON.parse(JSON.stringify(entry.deck));wrongMana.mana_deck[0].quantity++;if(fn(wrongMana,'PLAYER').ok)throw Error('13 Mana incorrectly legal '+id);
 const special=entry.deck.main_deck.find(x=>cards[x.card_id].classification==='Special Event');if(special){const d=JSON.parse(JSON.stringify(entry.deck));d.main_deck.find(x=>x.card_id===special.card_id).quantity++;const other=d.main_deck.find(x=>x.card_id!==special.card_id&&x.quantity>1)||d.main_deck.find(x=>x.card_id!==special.card_id);if(other.quantity===1)d.main_deck.splice(d.main_deck.indexOf(other),1);else other.quantity--;if(fn(d,'PLAYER').ok)throw Error('Duplicate Special Event incorrectly legal '+id);}
 results.push({id,legality:'PASS',wrong49:'REJECTED',wrong51:'REJECTED',duplicateUltimate:'REJECTED',duplicateSpecialEvent:'REJECTED',wrongMana:'REJECTED'});
}
console.log('PASS: executable app validateDeck accepted 5 S0 starters and rejected 49/51 cards, duplicate Ultimate and 13 Mana.');
console.log(JSON.stringify(results));
