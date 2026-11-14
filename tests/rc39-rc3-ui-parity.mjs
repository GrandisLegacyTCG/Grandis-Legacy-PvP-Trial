/** RC39 Repo RC3: post-RC2 gameplay UI parity vs VS AI RC39; RC6 safety invariants. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {viewerSafeBoard, assertViewerSafeBoard} from '../server/viewer-safe.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const runtime=read('public/battle/shared-app/app-runtime.js');
const css=read('public/battle/shared-ui/battlefield-ui.css');
const html=read('public/battle/index.html');
const server=read('server.js');
const block=(start,end)=>{const a=runtime.indexOf(start),b=runtime.indexOf(end,a);assert(a>=0&&b>a,`Missing ${start}`);return runtime.slice(a,b)};
// EXP Inspector as in donor v2.13: both sides' public attached EXP, full Card Review,
// contextual hover, and lock while Hand is raised. Event/intent requires no server mutation.
assert.match(runtime,/const expInspectorOverlay=document\.createElement\('div'\)/);
assert.match(runtime,/id="glExpInspectorDialog"/);
assert.match(runtime,/function openExpInspector\(side,lane\)/);
assert.match(runtime,/function renderExpInspector\(\)/);
assert.match(runtime,/function syncExpButtonLock\(\)/);
assert.match(runtime,/expBadge=document\.createElement\('button'\)/);
assert.match(runtime,/openExpInspector\(side,lane\)/);
assert.match(runtime,/renderHand\(s\);renderOpponentHand\(s\);syncExpButtonLock\(\);renderExpInspector\(\);/);
assert.match(runtime,/anchor\.closest\?\.\('\.gl-exp-inspector-panel'\)/);
assert.match(runtime,/expPreviewOwnedByInspector=expInspectorOverlay\.classList\.contains\('open'\)/);
assert.match(css,/\.gl-exp-inspector-overlay\.open\{display:flex\}/);
assert.match(css,/\.hero-lane > button\.gl-hero-exp-indicator/);
// Holy Rejuvenation uses the same centered status-icon chooser, not an otherwise
// unstyled status click on the Hero field. Selection/confirm remain server-owned.
assert.match(runtime,/function purifyStatusArt\(name\)/);
assert.match(runtime,/if\(p\.type==='saint_purify_choice'\)return'purify';/);
assert.match(runtime,/if\(mode==='purify'\)return heroCardEl/);
assert.match(runtime,/titleText='HOLY REJUVENATION — REMOVE STATUS'/);
assert.match(runtime,/intent\('selectSaintPurifyChoice',\[i\]\)/);
assert.match(runtime,/REMOVE SELECTED STATUS/);
assert.match(css,/body\.gl-center-purify \.gl-center-choice-cards/);
const srcMode=block('function centerChoiceModeFor(s){','let lastCenterChoiceBodyMode=');
const ctx={responseDiscardStageApprovedKey:'',responseDiscardStageKey:()=>'',pendingOwner:p=>p.decision_side,isHandDiscardPending:()=>false};
vm.runInNewContext(srcMode+'globalThis.chooseMode=centerChoiceModeFor;',ctx);
assert.equal(ctx.chooseMode({pending:{type:'saint_purify_choice',decision_side:'PLAYER'}}),'purify');
assert.equal(ctx.chooseMode({pending:{type:'saint_purify_choice',decision_side:'AI'}}),'');
assert.equal(ctx.chooseMode({pending:{type:'scouting_exp_selection',decision_side:'PLAYER'}}),'discard');
assert.equal(ctx.chooseMode({pending:{type:'trial_rankup_return_exp',decision_side:'PLAYER'}}),'discard');
// Simultaneous Rank Up return flies to exact committed Hand slots, not to the
// centre of the Hand, and guards against relayout, reconnect and hidden tabs.
const rank=block('// The Hand flex fan expands','function queueBattlefieldTributeMotion(');
assert.match(rank,/function runAtomicTrialReturnBatch\(side,items,onComplete\)/);
assert.match(rank,/hand-card\[data-hand-index/);
assert.match(rank,/if\(\+\+geometryAttempts<=6\)/);
assert.match(rank,/const duration=440,fragment=document\.createDocumentFragment\(\)/);
assert.match(rank,/arrivals\.forEach\(item=>/);
assert.match(runtime,/glPresentationEpoch\+\+;for\(const batch of \[\.\.\.glTrialReturnBatches\]\)batch\.cancel\(\)/);
assert.match(runtime,/runAtomicTrialReturnBatch\(side,batchEvents\.map\(e=>\(\{/);
assert.match(runtime,/function updateCommittedHandSlotVisibility\(side\)/);
// Don't accidentally revert to the donor's stale 6+6 hardcoding (Rulebook v3.2 is 5+5).
assert.match(runtime,/for\(let i=0;i<5;i\+\+\)groups\.push/);
assert.doesNotMatch(runtime,/<h2 id="glCoinTitle">Opening Coin Flip<\/h2>/);
assert.match(runtime,/aria-label="Coin flip"/);
assert.match(html,/app-runtime\.js\?v=gl-s0-pvp-rc40-patch32-item-discard-2026-11-14/);
assert.match(server,/const VERSION='S0-RC40-PVP-NET-RC6-STAGE2-PATCH3\.2'/); // RC40 authoritative server identity
assert.doesNotMatch(runtime,/addAction\(actions,'WHY\?'/,'No PvP-only Tune Up button absent from donor UI');
// Public EXP card IDs are visible to either seat, but hidden opposing Hand and
// deck identities must remain masked. The inspector uses only public hero fields.
const blank=()=>({LEFT:null,CENTER:null,RIGHT:null});
const view=viewerSafeBoard({appState:{
 playerHand:['S0-ARC-001'],aiHand:['S0-CLE-020'],playerDeck:['S0-ARC-002'],aiDeck:['S0-CLE-021'],
 playerLegacy:[],aiLegacy:['S0-WAR-H002'],playerManaDeck:[],aiManaDeck:[],
 playerManaPoolCards:[],aiManaPoolCards:[],pending:null,responseWindow:null,
 playerHeroes:{...blank(),CENTER:{card_id:'S0-ARC-H001',exp_cards:['S0-ARC-002'],exp_total:100}},
 aiHeroes:{...blank(),LEFT:{card_id:'S0-CLE-H001',exp_cards:['S0-CLE-001'],exp_total:100}},
 presentationEvents:[{id:'RC3-RET-1',type:'TRIAL_EXP_RETURNED_TO_HAND',side:'PLAYER',lane:'CENTER',card_id:'S0-ARC-002',hand_index:1,rank_up_id:'RC3-RANK-1'}]
}}, {seat:1,revision:44,secret:Buffer.alloc(32,7)});
assertViewerSafeBoard(view);
assert.deepEqual(view.appState.aiHeroes.LEFT.exp_cards,['S0-CLE-001']);
assert.deepEqual(view.appState.playerHeroes.CENTER.exp_cards,['S0-ARC-002']);
assert.equal(view.appState.aiHand[0],'__HIDDEN_CARD_BACK__');
assert.equal(view.appState.playerDeck[0],'__HIDDEN_CARD_BACK__');
assert.equal(view.appState.presentationEvents[0].hand_index,1);
assert.equal(view.appState.presentationEvents[0].card_id,'S0-ARC-002');
// RC8-compatible invariant: RC6 socket, RC5 local Mana Draft, and headless
// authority are byte-identical to RC7. Viewer-safe and combat projections are
// intentionally updated for recipient-only effects and status outcomes.
const fingerprints={
 'public/pvp/pvp-host.js':'58ed3fcf0da6b8bb7c8b24aa44e310f8a9cdf4530d4d01d25b1b732975a258dc',
 'public/battle/runtime/pvp-network.js':'696e8d81c4e125ce3604555ea0a20ecd52777057209e270cf1f1b32d7c9c8c42',
 'public/battle/runtime/pvp-mana-draft.js':'0dfb813cf7c549f01f83d6c7cb46fd5192fc78d554fbd53de90e8b2b572d92b7',
 'server/headless-rc32.mjs':'e5c3013e099051ba1f9bcc43cb2c6b4a7d5b130d1fd5df91ad71d4ec61446864'
};
for(const [p,expected] of Object.entries(fingerprints)){
 const got=createHash('sha256').update(readFileSync(new URL('../'+p,import.meta.url))).digest('hex');
 assert.equal(got,expected,`Authority/network source unexpectedly changed: ${p}`);
}
console.log('PASS RC39 RC3 UI: public EXP inspector, donor Purify chooser, atomic Rank Up Return EXP, RC7 network/headless byte-identical, privacy & 5+5 opening');
