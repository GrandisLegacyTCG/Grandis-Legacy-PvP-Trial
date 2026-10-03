import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);
const read=(f)=>readFileSync(join(root,f),'utf8');
const must=[
  'public/index.html','public/option-b-runtime.js','public/option-b-integration.css',
  'public/pvp/pvp-v371.js','public/pvp/pvp-v371.css','public/pvp/pvp-presentation-adapter.js','public/config.js',
  'public/engine/shared-app/app.bundle.js','server.js','server/gameplay-intent-router.mjs','Dockerfile'
];
for(const f of must) if(!existsSync(join(root,f))) throw new Error('Missing '+f);

const index=read('public/index.html');
for(const n of ['Grandis Legacy — PvP v3.71','--hero-base-w','--hero-layout-w','--hand-w','ob-phase-tint','ob-phase-underline','ob-phase-diamond','pvp/pvp-v371.js','pvp/pvp-v371.css']) if(!index.includes(n)) throw new Error('v6.88/index wiring missing '+n);
if(index.includes('id="matchTimer"')) throw new Error('VS AI local match timer leaked into PvP; PvP timer must remain server-timestamp based.');


const fallbackConfig=read('public/config.js');
for(const n of ["version:'Grandis Legacy PvP v3.71'","buildId:'gl-pvp-3.71-v351-net-v688-battlefield-2026-10-03'",'maxSpectators:4',"spectatorView:'CARD_BACKS'",'teachingViewAvailable:false']) if(!fallbackConfig.includes(n)) throw new Error('Static fallback config is stale: '+n);

const client=read('public/pvp/pvp-v371.js');
for(const n of [
  "const VERSION='Grandis Legacy PvP v3.71'","role:state.preferredRole==='spectator'?'spectator':'player'",
  'pvp370Spectate','JOIN AS PLAYER','SPECTATE MATCH','Spectator mode is read-only. Both Hands remain hidden.',
  'function armIntentTimeout','12000','ack-without-snapshot','sync-request','handleIntentAck',
  "msg.type==='intent-ack'","if(isSpectator())return{ok:false,error:'Spectator is read-only.'}",
  "msg.local?.role==='spectator'?1","pvp370-match-timer","startedAt","finishedAt",
  'prepareAuthoritativeAnimations','playBattleAudioNow','scheduleBattleVfx'
]) if(!client.includes(n)) throw new Error('PvP v3.71 client contract missing '+n);
for(const forbidden of ['id="pvp370RoomStats"','CURRENT ROOM','SWITCH TO ROOM 2','SPECTATORS VIEW']) if(client.includes(forbidden)) throw new Error('Removed lobby block leaked back: '+forbidden);

const server=read('server.js');
for(const n of [
  "Grandis Legacy PvP v3.71","const MAX_SPECTATORS = 4","spectatorView: 'CARD_BACKS'",
  'function teachingViewConfigured() { return false; }',"case 'switch-role'","case 'sync-request'",
  "Public spectators always use Card Backs","spectatorBoardCache","process.memoryUsage()",
  "if (wantsSpectator || room.players.size >= 2)","Spectator mode is read-only.",
  'processingMs'
]) if(!server.includes(n)) throw new Error('PvP v3.71 server contract missing '+n);
if(/const MAX_SPECTATORS\s*=\s*0/.test(server)||server.includes("pvpSpectatorView = revealBothHands ? 'BOTH_HANDS'")) throw new Error('Spectator restoration/security regression.');
if(!server.includes("perMessageDeflate: false")) throw new Error('WebSocket memory/CPU guard missing.');

const css=read('public/pvp/pvp-v371.css');
for(const n of [
  '.pvp370-actions{display:grid;grid-template-columns:1fr 1fr',
  'html.pvp-v370 .bottom-actions{grid-template-columns:1fr 1fr 1fr!important}',
  'body.pvp-spectator-mode .phase-actions',
  'body.pvp-spectator-mode .card-actions',
  '.pvp370-identity-box'
]) if(!css.includes(n)) throw new Error('PvP v3.71 CSS contract missing '+n);

const ob=read('public/option-b-runtime.js');
for(const n of [
  'queueOptionBTributeMotion','renderInteractionFocus','itemEventArrowContexts','bindBattlefieldPreview',
  'placePhaseIndicator','initStableBattlefieldReviewGestures','transientConnectorUntil',
  "required===1&&candidates.length===1","window.GL_PVP_LOCAL_ROLE==='spectator'",
  "active.side==='PLAYER'?'PLAYER 1':'PLAYER 2'"
]) if(!ob.includes(n)) throw new Error('VS AI v6.88 battlefield parity missing '+n);
for(const forbidden of ['matchStartedAt','updateMatchTimer','id="matchTimer"']) if(ob.includes(forbidden)) throw new Error('Local VS AI timer leaked into PvP runtime: '+forbidden);

const obcss=read('public/option-b-integration.css');
for(const n of ['.ob-focus-dimmer','grid-template-columns:repeat(7,96px)','-webkit-text-stroke:.35px #b8952f']) if(!obcss.includes(n)) throw new Error('VS AI v6.88 presentation CSS missing '+n);
if(!index.includes('--hover-preview-w:259px')||!index.includes('--hero-hover-preview-w:248px')) throw new Error('VS AI v6.88 hover preview sizing variables missing from index root.');

const adapter=read('public/pvp/pvp-presentation-adapter.js');
for(const n of ["PvP v3.71 VS AI v6.88 Presentation Boundary","visualAuthority:'VS AI v6.88'"]) if(!adapter.includes(n)) throw new Error('Presentation adapter version contract missing '+n);

const shared=read('public/engine/shared-app/app.bundle.js');
for(const n of ["sw('playerManaDeck','aiManaDeck')","sw('playerManaPoolCards','aiManaPoolCards')",'recordPvpBattleFeedbackEvent','playAuthoritativeBattleFeedbackAudio']) if(!shared.includes(n)) throw new Error('Preserved PvP runtime bridge missing '+n);

const router=read('server/gameplay-intent-router.mjs');
for(const n of ['beginTributeFromHand','commitManaShardPaymentChoice','repairOrphanBlockingState']) if(!router.includes(n)) throw new Error('Intent router regression: '+n);

for(const f of ['public/engine/shared-app/app.bundle.js','public/engine/js/app.bundle.js','public/engine/js/static-data.js']){
  if(read(f).includes('https://grandislegacytcg.github.io/shared/season1/v1/')) throw new Error('Remote gameplay asset dependency remains in '+f);
}
for(const f of [
  'public/assets/ui/Back-of-Card-Main-Deck.webp','public/assets/ui/Back-of-Card-Legacy-Deck.webp',
  'public/assets/shards/Generic.webp','public/assets/shards/Warrior.webp','public/assets/shards/Mage.webp',
  'public/engine/assets/audio/battle/P.Atk.mp3','public/engine/assets/audio/battle/M.Atk.mp3','public/engine/assets/battle/P.Attack.png'
]) if(!existsSync(join(root,f))) throw new Error('Bundled asset missing '+f);

console.log('v3.71 static architecture + spectator + v6.88 battlefield parity: PASS');
