import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);
const read=(f)=>readFileSync(join(root,f),'utf8');
const must=[
  'public/index.html','public/option-b-runtime.js','public/option-b-integration.css',
  'public/pvp/pvp-net.js','public/pvp/pvp-animator.js','public/pvp/pvp-lobby.css','public/pvp/pvp-presentation-adapter.js','public/config.js',
  'public/engine/shared-app/app.bundle.js','server.js','server/gameplay-intent-router.mjs','Dockerfile'
];
for(const f of must) if(!existsSync(join(root,f))) throw new Error('Missing '+f);

const index=read('public/index.html');
for(const n of ['Grandis Legacy — PvP v3.73','--hero-base-w','--hero-layout-w','--hand-w','ob-phase-tint','ob-phase-underline','ob-phase-diamond','pvp/pvp-net.js','pvp/pvp-animator.js','pvp/pvp-lobby.css']) if(!index.includes(n)) throw new Error('v3.72/index wiring missing '+n);
if(index.includes('id="matchTimer"')) throw new Error('VS AI local match timer leaked into PvP; PvP timer must remain server-timestamp based.');

const fallbackConfig=read('public/config.js');
for(const n of ["version:'Grandis Legacy PvP v3.73.8'","buildId:'gl-pvp-3.72-v351-net-v6907-battlefield-2026-10-04'",'maxSpectators:4',"spectatorView:'CARD_BACKS'",'teachingViewAvailable:false']) if(!fallbackConfig.includes(n)) throw new Error('Static fallback config stale: '+n);

const client=read('public/pvp/pvp-net.js');
for(const n of [
  "const VERSION='Grandis Legacy PvP v3.73.8'","role:state.preferredRole==='spectator'?'spectator':'player'",
  'pvpLobbySpectate','JOIN AS PLAYER','SPECTATE MATCH','Spectator mode is read-only. Both Hands remain hidden.',
  'function armIntentTimeout','12000','ack-without-snapshot','sync-request','handleIntentAck',
  "msg.type==='intent-ack'","if(isSpectator())return{ok:false,error:'Spectator is read-only.'}",
  "msg.local?.role==='spectator'?1",'pvp-lobby-match-timer','startedAt','finishedAt',
  'claimedAnimationIds','prepareAuthoritativeAnimations','GL_OPTION_B_PRESENTATION','queueAuthoritativeOpeningSequence',
  'playBattleAudioNow','scheduleBattleVfx','revealBattlefieldWhenAnchored','GL_PVP_ANIMATOR'
]) if(!client.includes(n)) throw new Error('PvP v3.72 client contract missing '+n);
for(const forbidden of ['waitForBattlefieldPaintReady','renderCurrentAuthoritativePendingChoice','SWITCH TO ROOM 2','SPECTATORS VIEW']) if(client.includes(forbidden)) throw new Error('Removed/stale PvP UI path leaked back: '+forbidden);

const server=read('server.js');
for(const n of [
  'Grandis Legacy PvP v3.72','const MAX_SPECTATORS = 4',"spectatorView: 'CARD_BACKS'",
  'function teachingViewConfigured() { return false; }',"case 'switch-role'","case 'sync-request'",
  'Public spectators always use Card Backs','spectatorBoardCache','process.memoryUsage()',
  'if (wantsSpectator || room.players.size >= 2)','Spectator mode is read-only.','processingMs','perMessageDeflate: false'
]) if(!server.includes(n)) throw new Error('PvP v3.72 server/network contract missing '+n);
if(/const MAX_SPECTATORS\s*=\s*0/.test(server)||server.includes("pvpSpectatorView = revealBothHands ? 'BOTH_HANDS'")) throw new Error('Spectator restoration/security regression.');

const css=read('public/pvp/pvp-lobby.css');
for(const n of ['.pvp-lobby-actions','body.pvp-spectator-mode .phase-actions','body.pvp-spectator-mode .card-actions','.pvp-lobby-identity-box']) if(!css.includes(n)) throw new Error('PvP v3.72 CSS contract missing '+n);

const ob=read('public/option-b-runtime.js');
for(const n of [
  'centerChoiceStage','centerChoiceModeFor','renderCenterChoiceStage','backgroundPreviewSuppressed',
  "intent(responsePay?'toggleResponseManaShardChoice':'toggleManaShardPaymentChoice'",
  "intent(responsePay?'commitResponsePaymentChoice':'commitManaShardPaymentChoice'",
  'queueAuthoritativeOpeningSequenceVisible','window.GL_OPTION_B_PRESENTATION',
  'queueOptionBTributeMotion','renderInteractionFocus','itemEventArrowContexts','bindBattlefieldPreview',
  'placePhaseIndicator','initStableBattlefieldReviewGestures','hc.ondblclick',
  "window.GL_PVP_LOCAL_ROLE==='spectator'"
]) if(!ob.includes(n)) throw new Error('VS AI v6.90.7 selective presentation/decision port missing '+n);
for(const forbidden of ['matchStartedAt','updateMatchTimer','id="matchTimer"']) if(ob.includes(forbidden)) throw new Error('Local VS AI timer leaked into PvP runtime: '+forbidden);

const obcss=read('public/option-b-integration.css');
for(const n of ['.ob-center-choice-stage','.ob-center-choice-card.is-selected','body.ob-center-pay','.ob-focus-dimmer','grid-template-columns:repeat(7,96px)','-webkit-text-stroke:.35px #b8952f','.battlefield.ob-focus-blind-mana .opponent-mana-pool{position:absolute!important}']) if(!obcss.includes(n)) throw new Error('v6.90.7 presentation CSS missing '+n);
if(!index.includes('--hover-preview-w:259px')||!index.includes('--hero-hover-preview-w:248px')) throw new Error('Battlefield hover preview sizing variables missing from index root.');

const adapter=read('public/pvp/pvp-presentation-adapter.js');
for(const n of ["PvP v3.72 VS AI v6.90.7 Presentation Boundary","visualAuthority:'VS AI v6.90.7'"]) if(!adapter.includes(n)) throw new Error('Presentation adapter version contract missing '+n);

const shared=read('public/engine/shared-app/app.bundle.js');
for(const n of [
  "sw('playerManaDeck','aiManaDeck')","sw('playerManaPoolCards','aiManaPoolCards')",'recordPvpBattleFeedbackEvent','playAuthoritativeBattleFeedbackAudio',
  'function computeExactManaPayment','function recommendedExactManaShardUids','function manaSelectionAfterToggle','function spendExactManaPayment',
  'selected_shard_uids','testExactManaPaymentV372','AudioContext','primeWebAudioAsset','ctx.resume','playWebAudio'
]) if(!shared.includes(n)) throw new Error('Shared authoritative/runtime contract missing '+n);

const router=read('server/gameplay-intent-router.mjs');
for(const n of ['beginTributeFromHand','toggleManaShardPaymentChoice','commitManaShardPaymentChoice','toggleResponseManaShardChoice','commitResponsePaymentChoice','repairOrphanBlockingState']) if(!router.includes(n)) throw new Error('Intent router regression: '+n);

for(const f of ['public/engine/shared-app/app.bundle.js','public/engine/js/app.bundle.js','public/engine/js/static-data.js']){
  if(read(f).includes('https://grandislegacytcg.github.io/shared/season1/v1/')) throw new Error('Remote gameplay asset dependency remains in '+f);
}
for(const f of [
  'public/assets/ui/Back-of-Card-Main-Deck.webp','public/assets/ui/Back-of-Card-Legacy-Deck.webp',
  'public/assets/shards/Generic.webp','public/assets/shards/Warrior.webp','public/assets/shards/Mage.webp',
  'public/engine/assets/audio/battle/P.Atk.mp3','public/engine/assets/audio/battle/M.Atk.mp3','public/engine/assets/battle/P.Attack.png',
  'public/engine/assets/audio/Card Sound.mp3'
]) if(!existsSync(join(root,f))) throw new Error('Bundled asset missing '+f);

console.log('fresh static: network + spectator + v6.90.7 battlefield/payment architecture: PASS');
