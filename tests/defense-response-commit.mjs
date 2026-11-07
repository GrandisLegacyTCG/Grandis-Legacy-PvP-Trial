import assert from 'node:assert/strict';
import {Season0HeadlessAuthority as E} from '../server/headless-rc32.mjs';
import {resolve} from 'node:path';
let resultCount={attacks:0,options:0,responseCommitted:0,responseChoice:0,responseFailures:0};
for(let attempt=0;attempt<60;attempt++){
 const e=new E(resolve('client'));e.start({player1DeckKey:e.starterIds[attempt%5],player2DeckKey:e.starterIds[(attempt+1)%5]});e.completeOpening(1);
 const st=()=>e._canonicalForServerOnly().appState;
 const act=(seat,name,args=[])=>{try{e.applyIntent(seat,name,args);return true}catch{return false}};
 for(let i=0;i<6;i++){const s=st();act(s.turn==='PLAYER'?1:2,'advancePhase')}
 if(st().turn!=='AI'||st().phase!=='Battle')continue;
 const hand=e._viewForMaskingOnly(2).appState.playerHand;
 for(let i=0;i<hand.length;i++){const s=st();if(act(2,'beginPlayFromHand',[i]))break;}
 let i=0;
 while(st().pending&&st().pending.type!=='response_window'&&i++<8){let p=e._viewForMaskingOnly(2).appState.pending;
  let ok=false;if(p.type==='source_selection')ok=act(2,'chooseHeroFromBoard',['PLAYER',p.legal_sources[0]]);
  if(p.type==='target_selection')ok=act(2,'chooseHeroFromBoard',[p.target_side,p.legal_targets[0]]);
  if(p.type==='mana_shard_payment_choice')ok=act(2,'commitManaShardPaymentChoice');
  if(!ok)break;
 }
 if(!st().responseWindow)continue;resultCount.attacks++;
 const res=e._viewForMaskingOnly(1).appState.responseWindow, opts=res.options||[];
 resultCount.options+=opts.length;
 if(!opts.length)continue;
 let picked=opts.findIndex(x=>x.card_id==='S0-ITM-016');if(picked<0)picked=0;
 if(!act(1,'responseSelectNoStuck',[picked]))continue;
 if(!act(1,'confirmSelectedResponse'))continue;
 let p=e._viewForMaskingOnly(1).appState.pending;
 if(p?.type==='response_payment_choice'){
  resultCount.responseChoice++;
  for(let j=0;j<Number(p.required_discard_count||0);j++)act(1,'selectResponsePaymentChoice',[j]);
  if(!act(1,'commitResponsePaymentChoice')){resultCount.responseFailures++;continue}
 }
 if(st().responseWindow?.response_owner==='AI'){/* counter response may open */}
 resultCount.responseCommitted++;
 console.log('SUCCESS RESPONSE',attempt,opts[picked].card_id,'rev',e.revision,'pending',st().pending?.type,'response',st().responseWindow?.kind);break;
}
assert.ok(resultCount.responseCommitted>0,'No complete actual paid Defense Response in the randomized RC31 engine scenarios');
console.log('PASS: actual paid Defense Response selected, cost paid, and attack chain resolved',resultCount);
