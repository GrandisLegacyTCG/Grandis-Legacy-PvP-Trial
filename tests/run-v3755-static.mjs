import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve(new URL('..',import.meta.url).pathname);
const read=(f)=>readFileSync(join(root,f),'utf8');
const sha=(f)=>createHash('sha256').update(readFileSync(join(root,f))).digest('hex');
const must=[
  'public/index.html','public/js/pvp-ui-runtime.js','public/css/pvp-ui.css',
  'public/js/pvp-network.js','public/js/pvp-animator.js','public/css/pvp-lobby.css','public/js/pvp-presentation-adapter.js','public/config.js',
  'public/js/app.bundle.js','server.js','server/gameplay-intent-router.mjs','server/runtime/static-data.js','server/runtime/runtime-authority.js','server/runtime/app.bundle.js','Dockerfile'
];
for(const f of must) if(!existsSync(join(root,f))) throw new Error('Missing '+f);

const index=read('public/index.html');
for(const n of ['Grandis Legacy — PvP v3.75.5','--hero-base-w','--hero-layout-w','--hand-w','ob-phase-tint','ob-phase-underline','ob-phase-diamond','js/pvp-network.js','js/pvp-animator.js','css/pvp-lobby.css']) if(!index.includes(n)) throw new Error('v3.75.5/index wiring missing '+n);
if(index.includes('id="matchTimer"')) throw new Error('VS AI local match timer leaked into PvP; PvP timer must remain server-timestamp based.');
if(index.includes('<div class="hand-title">LOCAL AI</div>')) throw new Error('Player-facing AI label leaked into the PvP shell.');

const fallbackConfig=read('public/config.js');
for(const n of ["version:'Grandis Legacy PvP v3.75.5'","buildId:'gl-pvp-3.75.5-v351-gameplay-v6907-ui-2026-10-08'",'maxSpectators:4',"spectatorView:'CARD_BACKS'",'teachingViewAvailable:false']) if(!fallbackConfig.includes(n)) throw new Error('Static fallback config stale: '+n);

const client=read('public/js/pvp-network.js');
for(const n of [
  "const VERSION='Grandis Legacy PvP v3.75.5'","role:state.preferredRole==='spectator'?'spectator':'player'",
  'pvpLobbySpectate','JOIN AS PLAYER','SPECTATE MATCH','Spectator mode is read-only. Both Hands remain hidden.',
  'function armIntentTimeout','12000','ack-without-snapshot','sync-request','handleIntentAck',
  "msg.type==='intent-ack'","if(isSpectator())return{ok:false,error:'Spectator is read-only.'}",
  "msg.local?.role==='spectator'?1",'pvp-lobby-match-timer','startedAt','finishedAt',
  'claimedAnimationIds','prepareAuthoritativeAnimations','GL_OPTION_B_PRESENTATION','queueAuthoritativeOpeningSequence',
  'playBattleAudioNow','scheduleBattleVfx','revealBattlefieldWhenAnchored','GL_PVP_ANIMATOR',
  'notifyUiIntentFailure','notifyUiIntentResolved','getIntentState','clientActionId:item.clientActionId',
  'syncAuthoritativePendingChoice','state.applyingServer',
  "if(state.intentInFlight)return{ok:false,busy:true,error:'Waiting for the server to resolve the previous action.'}",
  'intentNeedsPendingOwner','intentNeedsResponseOwner','getRevision:()=>Number'
]) if(!client.includes(n)) throw new Error('PvP v3.75.5 client contract missing '+n);
if(client.includes('intentQueue')||client.includes('pumpIntent')) throw new Error('v3.73.20 queued gameplay-intent model leaked into v3.75.5; v3.51 single in-flight handshake is required.');
if(client.includes('B().renderCurrentAuthoritativePendingChoice')) throw new Error('Newer local pending renderer is controlling PvP state; v3.51 authoritative snapshot/UI adapter must own the lifecycle.');
if(!client.includes('window.GL_OPTION_B_UI?.onAuthoritativeSnapshot')) throw new Error('Authoritative snapshots are not forwarded to the PvP UI adapter.');
for(const forbidden of ['waitForBattlefieldPaintReady','SWITCH TO ROOM 2','SPECTATORS VIEW','· VS AI v6.90.7 battlefield']) if(client.includes(forbidden)) throw new Error('Removed/stale PvP UI path leaked back: '+forbidden);

const server=read('server.js');
for(const n of [
  'Grandis Legacy PvP v3.75.5','const MAX_SPECTATORS = 4',"spectatorView: 'CARD_BACKS'",
  'function teachingViewConfigured() { return false; }',"case 'switch-role'","case 'sync-request'",
  'Public spectators always use Card Backs','spectatorBoardCache','process.memoryUsage()',
  'if (wantsSpectator || room.players.size >= 2)','Spectator mode is read-only.','processingMs','perMessageDeflate: false',
  "server/runtime/static-data.js","server/runtime/runtime-authority.js","server/runtime/app.bundle.js"
]) if(!server.includes(n)) throw new Error('PvP v3.75.5 server/network contract missing '+n);
if(/const MAX_SPECTATORS\s*=\s*0/.test(server)||server.includes("pvpSpectatorView = revealBothHands ? 'BOTH_HANDS'")) throw new Error('Spectator restoration/security regression.');

// Hard boundary: match gameplay authority is the exact proven v3.51 runtime/router.
const expectedHashes={
  'server/runtime/static-data.js':'ce80a5cf5e8fd78a3b2d5b9b02a1076ce2bbb584a7cd93522b29f49da2010fc6',
  'server/runtime/runtime-authority.js':'bacafbe720fa83ddb68267114ba7a718f16c44a4b20453decc86ed63b190c8f4',
  'server/runtime/app.bundle.js':'ff42da9f22fedb80dda944df28699a6d3eeae9d1fa8fb5aa05321abd766713e7',
  'server/gameplay-intent-router.mjs':'7ac076d8909ae909d80398728bad09dfbe57a8b21524b694705412386503c55a'
};
for(const [f,h] of Object.entries(expectedHashes)) if(sha(f)!==h) throw new Error('v3.51 gameplay authority drifted: '+f);
const authority=read('server/runtime/app.bundle.js');
for(const n of ['function computeManaPayment','function autoManaPaymentWithoutPrompt','function shouldPromptManaPayment','function firstPlayerAttackRestrictedNow',"state.phase==='Battle'",'openingFirstSide(state)===side']) if(!authority.includes(n)) throw new Error('v3.51 authority contract missing '+n);
if(authority.includes('function computeExactManaPayment')) throw new Error('v3.73+/v6 exact-Shard payment engine leaked into authoritative server runtime.');

const router=read('server/gameplay-intent-router.mjs');
for(const n of ['beginTributeFromHand','toggleManaShardPaymentChoice','toggleResponseManaShardChoice','commitResponsePaymentChoice','handleChoiceConfirm','selectOpponentManaChoice']) if(!router.includes(n)) throw new Error('v3.51 intent router regression: '+n);
for(const forbidden of ['commitManaShardPaymentChoice','repairOrphanBlockingState']) if(router.includes(forbidden)) throw new Error('Post-v3.51 gameplay intent leaked into authoritative router: '+forbidden);

const css=read('public/css/pvp-lobby.css');
for(const n of ['.pvp-lobby-actions','body.pvp-spectator-mode .phase-actions','body.pvp-spectator-mode .card-actions','.pvp-lobby-identity-box']) if(!css.includes(n)) throw new Error('PvP v3.75.5 CSS contract missing '+n);

const ob=read('public/js/pvp-ui-runtime.js');
for(const n of [
  'centerChoiceStage','centerChoiceModeFor','renderCenterChoiceStage','backgroundPreviewSuppressed',
  "intent(responsePay?'toggleResponseManaShardChoice':'toggleManaShardPaymentChoice'",
  "responsePay?'commitResponsePaymentChoice':'handleChoiceConfirm'",
  'authoritativeV351ManaPlan','Mana Shards fill the remaining cost automatically',
  'queueAuthoritativeOpeningSequenceVisible','window.GL_OPTION_B_PRESENTATION',
  'queueOptionBTributeMotion','renderInteractionFocus','itemEventArrowContexts','bindBattlefieldPreview',
  'placePhaseIndicator','initStableBattlefieldReviewGestures','hc.ondblclick',
  'startAuthoritativeCenterCommit','onPvpIntentFailure','onPvpIntentResolved','onAuthoritativeSnapshot','intentThen',
  'selectOpponentManaChoiceHandle','pvpRevision()',
  "window.GL_PVP_LOCAL_ROLE==='spectator'"
]) if(!ob.includes(n)) throw new Error('VS AI v6.90.7 presentation / v3.51 decision adapter missing '+n);
for(const forbidden of ['matchStartedAt','updateMatchTimer','id="matchTimer"',"commitManaShardPaymentChoice"]) if(ob.includes(forbidden)) throw new Error('Forbidden local/newer PvP transaction leaked into UI runtime: '+forbidden);
for(const forbidden of ['>VS AI LOBBY<','AI Deck','LOCAL AI WON THE COIN FLIP','Local AI will take the first turn.']) if(ob.includes(forbidden)) throw new Error('Player-facing AI donor label leaked into PvP UI runtime: '+forbidden);
if(/GL_PVP_CLIENT_MODE[^\n]*sendIntent\(name,args\);setTimeout\(renderNow,0\)/.test(ob)) throw new Error('Regression: PvP client renders local gameplay state immediately after sendIntent instead of waiting for the authoritative snapshot.');
if(ob.includes("intent('selectOpponentManaChoice',[")) throw new Error('Regression: hidden opponent Shard selection uses client index instead of opaque choice_handle + revision.');
if(!ob.includes("startAuthoritativeCenterCommit(responsePay?'commitResponsePaymentChoice':'handleChoiceConfirm'")) throw new Error('PAY is not using the v3.51 authoritative confirm transaction.');

for(const n of [
  'PVP_OPENING_MOTION_MS=190','PVP_OPENING_INTER_CARD_GAP_MS=0','PVP_OPENING_TO_FIRST_TURN_GAP_MS=280',
  'PVP_TURN_DRAW_MOTION_MS=360','openingEventRound','openingSideOrder','orderedOpeningEvents',
  'animateDrawsInterleaved','animateShardsInterleaved',
  "animateDrawsInterleaved(draw1,PVP_OPENING_MOTION_MS",
  "animateShardsInterleaved(shard1,PVP_OPENING_MOTION_MS",
  'setTimeout(firstTurnDraw,PVP_OPENING_TO_FIRST_TURN_GAP_MS)',
  "animateDrawsInterleaved(draw2,PVP_TURN_DRAW_MOTION_MS",
  "animateShardsInterleaved(shard2,PVP_TURN_DRAW_MOTION_MS"
]) if(!ob.includes(n)) throw new Error('v3.75.5 opening choreography contract missing '+n);

const obcss=read('public/css/pvp-ui.css');
for(const n of ['.ob-center-choice-stage','.ob-center-choice-card.is-selected','body.ob-center-pay','.ob-focus-dimmer','grid-template-columns:repeat(7,96px)','-webkit-text-stroke:.35px #b8952f','.battlefield.ob-focus-blind-mana .opponent-mana-pool{position:absolute!important}']) if(!obcss.includes(n)) throw new Error('v6.90.7 presentation CSS missing '+n);
if(!index.includes('--hover-preview-w:259px')||!index.includes('--hero-hover-preview-w:248px')) throw new Error('Battlefield hover preview sizing variables missing from index root.');

const adapter=read('public/js/pvp-presentation-adapter.js');
for(const n of ["PvP v3.75.5 VS AI v6.90.7 Presentation Boundary","visualAuthority:'VS AI v6.90.7'"]) if(!adapter.includes(n)) throw new Error('Presentation adapter version contract missing '+n);

// Browser keeps v6.90.7 presentation/runtime vocabulary; it is NOT the server gameplay authority.
const shared=read('public/js/app.bundle.js');
for(const n of ["sw('playerManaDeck','aiManaDeck')",'recordPvpBattleFeedbackEvent','AudioContext','primeWebAudioAsset','playWebAudio']) if(!shared.includes(n)) throw new Error('Browser presentation/runtime contract missing '+n);

for(const f of ['public/js/app.bundle.js','public/js/static-data.js']){
  if(read(f).includes('https://grandislegacytcg.github.io/shared/season1/v1/')) throw new Error('Remote browser gameplay asset dependency remains in '+f);
}
for(const f of [
  'public/assets/ui/Back-of-Card-Main-Deck.webp','public/assets/ui/Back-of-Card-Legacy-Deck.webp',
  'public/assets/shards/Generic.webp','public/assets/shards/Warrior.webp','public/assets/shards/Mage.webp',
  'public/assets/audio/battle/P.Atk.mp3','public/assets/audio/battle/M.Atk.mp3','public/assets/battle/P.Attack.png',
  'public/assets/audio/Card Sound.mp3','public/assets/lobby/Swap.png'
]) if(!existsSync(join(root,f))) throw new Error('Bundled asset missing '+f);
if(existsSync(join(root,'public/assets/lobby/swap.png'))) throw new Error('Windows case-collision regression: both Swap.png and swap.png are present.');
if(!client.includes("assets/lobby/Swap.png")||client.includes("assets/lobby/swap.png")) throw new Error('Lobby swap asset casing is not normalized.');

console.log('v3.75.5 static: v3.51 gameplay authority + v6.90.7 UI boundary + PvP network contracts: PASS');
