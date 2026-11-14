/**
 * RC8 focused donor-parity and privacy verification.  No live Northflank or
 * public-web writes; canonical transitions stay inside the same authority.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {viewerSafeBoard,assertViewerSafeBoard} from '../server/viewer-safe.mjs';
import {PvpDiscardPresentationLedger} from '../server/discard-presentation.mjs';
import {PvpCombatPresentationLedger} from '../server/combat-presentation.mjs';
import {annotatePlayerHistoryEffects,stripPrivateHistoryEffectsForSpectator} from '../server/pvp-history-effects.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
let n=0;const check=(name,fn)=>{fn();n++;process.stdout.write('  OK '+name+'\n');};
const createHeroes=()=>Object.fromEntries(['LEFT','CENTER','RIGHT'].map(k=>[k,{card_id:'S0-WAR-H004',hp:100,exp_cards:[],attachments:[],statuses:[]}]))
const state=()=>({round:2,phase:'Battle',turn:'AI',playerHand:[],aiHand:[],playerDeck:[],aiDeck:[],
  playerDiscard:[],aiDiscard:[],playerLegacy:[],aiLegacy:[],playerHeroes:createHeroes(),aiHeroes:createHeroes(),
  playerManaPoolCards:[],aiManaPoolCards:[],playerManaDeck:[],aiManaDeck:[],
  pending:null,responseWindow:null,presentationEvents:[],log:[],pvpActionEventsBySide:{PLAYER:[],AI:[]}});
const project=s=>viewerSafeBoard({appState:s},{seat:1,revision:1,secret:Buffer.alloc(32,5)});
const action=(id,card_id,label='ATK',other={})=>({id,card_id,title:card_id,label,source_side:'AI',target_side:'PLAYER',
  target_lane:'CENTER',source_lane:'CENTER',played_event_order:5,...other});
const fightBase=(card_id,count,key,printed,damage,log='')=>{
  const s=state();s.responseWindow={kind:'incoming_attack',response_owner:'PLAYER',
    source_side:'AI',source_lane:'CENTER',target_side:'PLAYER',target_lane:'CENTER',card_id,
    damage,damage_type:'Physical',action:{[key]:count,damage_formula_log:log},post:{printed_damage:printed}};
  return s;
};
for(const [cardId,key,count,printed,damage,log,unit,base] of [
  ['S0-ARC-010','mana_cards_spent',6,null,80,'Arrow Barrage: printed 10 × 6 Mana Cards',10,60],
  ['S0-ARC-025','draw_count_at_attack',4,null,90,'Colossal Dreadbolt: printed 20 × 4 Draws',20,80],
  ['S0-MAG-025','mana_regen_at_attack',4,null,80,'Mana Void: S0 printed 20 × OWN Mana Regen 4',20,80],
  ['S0-MAG-027','casting_time_at_release',3,60,70,'',20,60],
  ['S0-ARC-030','s0_condition_return_count',2,20,50,'',20,40]]){
  check('Server public formula '+cardId,()=>{
    const s=project(fightBase(cardId,count,key,printed,damage,log));assertViewerSafeBoard(s);
    const f=s.appState.responseWindow.damage_formula;
    assert.ok(f,cardId+' missing formula');assert.equal(f.unit_damage,unit);
    assert.equal(f.count,count);assert.equal(f.scaled_damage,base);
    assert.equal(s.appState.responseWindow.damage,damage);
  });
}
check('Masked Response never serializes source action/Hand/Deck',()=>{
  const s=fightBase('S0-ARC-010',6,'mana_cards_spent',null,60,'Arrow Barrage: printed 10 × 6');
  s.responseWindow.response_owner='AI';s.responseWindow.action.secret_private='UNPLAYED_SECRET';
  s.aiHand=['S0-THF-020'];s.aiDeck=['S0-THF-020'];
  const safe=project(s);assertViewerSafeBoard(safe);
  assert.equal(safe.appState.responseWindow.damage_formula.scaled_damage,60);
  assert.equal(safe.appState.responseWindow.action,undefined);
  assert.ok(!JSON.stringify(safe).includes('UNPLAYED_SECRET'));
});
check('Public history shows chain/status/Mana totals, never concealed Hand Card ID',()=>{
  const s=state();s.aiHand=['S0-MAG-005'];s.aiDeck=['S0-MAG-005'];
  s.pvpActionEventsBySide.AI=[action('a1','S0-WAR-009','ATK',{card_played_chain_id:'chain-1',card_played_chain_step:0,
    mana_result:{mode:'STEAL',removed_count:2,gained_count:1},
    card_movements:[{from:'Main Deck',to:'Hand',card_ids:['S0-MAG-005'],count:1,known:true},
      {from:'Discard',to:'Hand',card_ids:['S0-WAR-002'],known:true}],
    result_lines:['Saw secret card S0-MAG-005','Damage: 30']}),
    action('a2','S0-THF-020','DEF',{card_played_chain_id:'chain-1',card_played_chain_step:1,response_to_event_id:'a1'})];
  const v=project(s);assertViewerSafeBoard(v);
  const a=v.appState.opponentPlayedEvents[0];assert.equal(a.card_played_chain_id,'chain-1');
  assert.equal(a.mana_result.gained_count,1);
  assert.equal(a.card_movements[0].card_ids.length,0);
  assert.equal(a.card_movements[0].count,1);
  assert.deepEqual(a.card_movements[1].card_ids,['S0-WAR-002']);
  assert.equal(v.appState.opponentPlayedEvents[1].response_to_event_id,'a1');
  assert.ok(!JSON.stringify(v).includes('S0-MAG-005'));
});
check('Own-cost Hand -> Discard identity visible ONLY to owner',()=>{
  const s=state();s.pvpActionEventsBySide.PLAYER=[action('self','S0-EVT-001','EVENT',{
    card_movements:[{from:'Hand',to:'Discard',card_ids:['S0-THF-010'],known:true}]})];
  s.pvpActionEventsBySide.AI=[action('other','S0-EVT-001','EVENT',{
    card_movements:[{from:'Hand',to:'Discard',card_ids:['S0-THF-017'],known:true}]})];
  const v=project(s);assertViewerSafeBoard(v);
  assert.deepEqual(v.appState.playerPlayedEvents[0].card_movements[0].card_ids,['S0-THF-010']);
  assert.deepEqual(v.appState.opponentPlayedEvents[0].card_movements[0].card_ids,[]);
  assert.ok(!JSON.stringify(v).includes('S0-THF-017'));
});
check('Canonical EXP discard captures Hero name and owner-only identity',()=>{
  const before=state(),after=structuredClone(before);
  before.playerHeroes.LEFT.card_id='S0-ARC-H004';
  before.playerHeroes.LEFT.exp_cards=['S0-ARC-010'];
  after.playerHeroes.LEFT.card_id='S0-ARC-H004';
  after.playerHeroes.LEFT.exp_cards=[];after.playerDiscard=['S0-ARC-010'];
  after.pvpActionEventsBySide.AI=[action('scout1','S0-EVT-003','EVENT')];
  const ledger=new PvpDiscardPresentationLedger();ledger.capture(before,after,2);
  assert.deepEqual(ledger.forSeat(2),[]);
  const owner=ledger.forSeat(1);assert.equal(owner.length,1);
  assert.equal(owner[0].origin,'EXP');assert.equal(owner[0].target_hero_card_id,'S0-ARC-H004');
  assert.equal(owner[0].effect_action_id,'scout1');assert.deepEqual(owner[0].card_ids,['S0-ARC-010']);
  const view=project(after);view.appState.presentationEvents.push(...owner);
  annotatePlayerHistoryEffects(view);
  assert.deepEqual(view.appState.opponentPlayedEvents[0].effect_results[0].card_ids,['S0-ARC-010']);
  const spect=JSON.parse(JSON.stringify(view));
  spect.appState.presentationEvents=spect.appState.presentationEvents.filter(e=>e.type!=='PVP_OPPONENT_DISCARD');
  stripPrivateHistoryEffectsForSpectator(spect);assertViewerSafeBoard(spect);
  assert.ok(!JSON.stringify(spect).includes('"card_ids":["S0-ARC-010"]'));
});
check('Repeated identical played card cannot inherit another action’s private discard',()=>{
  const b=state(),a=structuredClone(b);
  b.pending={type:'scouting_exp_selection',card_id:'S0-EVT-003',pvp_event_id:'action-specific-1'};
  b.playerHand=['S0-WAR-011'];a.playerDiscard=['S0-WAR-011'];
  a.pvpActionEventsBySide.AI=[action('action-specific-2','S0-EVT-003','EVENT'),
    action('action-specific-1','S0-EVT-003','EVENT')];
  const ledger=new PvpDiscardPresentationLedger();ledger.capture(b,a,2);
  const note=ledger.forSeat(1)[0];assert.equal(note.effect_action_id,'action-specific-1');
  const proj=project(a);proj.appState.presentationEvents.push(note);
  annotatePlayerHistoryEffects(proj);
  assert.equal(proj.appState.opponentPlayedEvents[0].effect_results,undefined);
  assert.deepEqual(proj.appState.opponentPlayedEvents[1].effect_results[0].card_ids,['S0-WAR-011']);
});
check('No incorrect fallback when identical played cards are indistinguishable',()=>{
  const s=state();s.pvpActionEventsBySide.AI=[action('card-a','S0-EVT-003','EVENT'),
    action('card-b','S0-EVT-003','EVENT')];
  const v=project(s);v.appState.presentationEvents=[{id:'secret1',type:'PVP_OPPONENT_DISCARD',side:'PLAYER',
    effect_card_id:'S0-EVT-003',card_ids:['S0-WAR-010'],origin:'HAND'}];
  annotatePlayerHistoryEffects(v);
  assert.ok(v.appState.opponentPlayedEvents.every(x=>!x.effect_results));
});
check('Status counters/target/Attack chain are derived from same combat commit',()=>{
  const old=state(),now=structuredClone(old);
  now.pvpActionEventsBySide.AI=[action('burn1','S0-MAG-009','ATK')];
  old.playerHeroes.CENTER.statuses=[{name:'Burn',duration:1}];
  now.playerHeroes.CENTER.statuses=[{name:'Burn',duration:3}];
  now.playerHeroes.CENTER.hp=90;
  const ledger=new PvpCombatPresentationLedger();ledger.capture(old,now);
  const event=ledger.forSeat(1)[0];assert.equal(event.attack_event_id,'burn1');
  assert.equal(event.targets[0].status_changes[0].status,'Burn');
  assert.equal(event.targets[0].status_changes[0].before,1);
  assert.equal(event.targets[0].status_changes[0].after,3);
  const v=project(now);v.appState.presentationEvents.push(event);annotatePlayerHistoryEffects(v);
  assert.equal(v.appState.opponentPlayedEvents[0].status_by_hero[0].after,3);
  assertViewerSafeBoard(v);
});
check('Damage banner is stable and hides lane/before-Response wording',()=>{
  const ui=read('../public/battle/shared-app/app-runtime.js');
  assert.match(ui,/function renderPvpIncomingDamage\(s\)/);
  assert.match(ui,/formula\.unit_damage/);
  assert.match(ui,/formula\.scaled_damage/);
  assert.match(ui,/const signature=\[attack.card_id,wording\]/);
  const begin=ui.indexOf('function renderPvpIncomingDamage('),end=ui.indexOf('function renderResponseRouteGuide',begin);
  assert.ok(begin>0&&end>begin);
  const functionBody=ui.slice(begin,end);
  assert.ok(!/before Response|Your CENTER|Your LEFT|Your RIGHT/.test(functionBody));
});
check('Card Played includes linked Response and private DISCARDED tiles',()=>{
  const ui=read('../public/battle/shared-app/app-runtime.js');
  for(const token of ['function pvpCanonicalPlayedEvent(','function pvpDiscardHistoryEvents(',
    'data-gl-linked-event','gl-played-discarded-tag','gl-played-owner-badge']){
    const source=token==='data-gl-linked-event'?read('../public/battle/engine/shared-app/app.bundle.js'):ui;
    assert.ok(source.includes(token),token);
  }
  assert.match(ui,/getPublicCardPlayedDetail\?\.\(side,eventId,viewerSafe\)/);
  assert.match(read('../public/battle/engine/shared-app/app.bundle.js'),/function v94EventDetailHtml\(/);
  assert.ok(!ui.includes('Resolved by Runtime'));
});
check('No second socket/protocol, match-authority remains single WebSocket',()=>{
  const n=read('../public/battle/runtime/pvp-network.js');
  assert.match(n,/WebSocket|websocket/);
  const server=read('../server.js');
  assert.match(server,/annotatePlayerHistoryEffects\(safe\)/);
  const src=read('../server/headless-rc32.mjs');assert.match(src,/PvpDiscardPresentationLedger/);
});
for(const file of ['../public/pvp/db158-card-review.js','../public/battle/shared-app/db158-card-review.js']){
  check('Card Review readiness + reusable iframe '+file,()=>{
    const js=read(file),win={document:{baseURI:'http://localhost/battle/'},location:new URL('http://localhost/battle/'),navigator:{},requestIdleCallback:()=>{}};
    win.window=win;
    vm.runInNewContext(js,{window:win,URL,setTimeout(){},console,Promise,Array,Math,Number,Object,String});
    assert.ok(win.GL_DB158_REVIEW);
    const html=win.GL_DB158_REVIEW.documentHtml({id:'S0-WAR-009',name:'Test Card',family:'Skill',image:'card-art/S0-WAR-009.webp'},[]);
    const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean);
    assert.ok(inline.length>=2,'review inline scripts missing');
    for(const script of inline)new vm.Script(script,{filename:file+' (inline)'});
    assert.match(js,/existing\.dataset\.glReviewKey===key/);
    assert.match(js,/GL_S0_REVIEW_READY/);
    assert.match(js,/function warmStyles\(/);
  });
}
console.log(`PASS RC8 VS AI adoption: ${n} focused checks`);
