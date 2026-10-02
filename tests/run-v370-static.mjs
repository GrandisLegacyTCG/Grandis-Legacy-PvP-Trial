import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);
const must=[
  'public/index.html','public/option-b-runtime.js','public/pvp/pvp-v370.js','public/pvp/pvp-v370.css','public/pvp/pvp-presentation-adapter.js',
  'public/engine/shared-app/app.bundle.js','public/engine/shared-app/app.css','public/engine/shared-ui/battlefield-ui.js','public/engine/shared-ui/battlefield-ui.css',
  'server.js','server/gameplay-intent-router.mjs','Dockerfile'
];
for(const f of must) if(!existsSync(join(root,f))) throw new Error('Missing '+f);
const index=readFileSync(join(root,'public/index.html'),'utf8');
for(const needle of ['window.GL_APP_MODE="PVP"','window.GL_PVP_SHARED_BOARD_ACTIVE=true','pvp/pvp-v370.js','pvp/pvp-v370.css','pvp-mobile-device','pvp-mobile-portrait','pvpOrientationRoot','assets/favicon.png']) if(!index.includes(needle)) throw new Error('index wiring missing '+needle);

const optionRuntime=readFileSync(join(root,'public/option-b-runtime.js'),'utf8');
for(const needle of ['isPvpMobileDevice','showBattlefieldCardPreview','hideBattlefieldCardPreview','if(isPvpMobileDevice())return;']) if(!optionRuntime.includes(needle)) throw new Error('mobile preview contract missing '+needle);
const docker=readFileSync(join(root,'Dockerfile'),'utf8');
if(/COPY\s+(runtime|sync)\b/.test(docker)) throw new Error('Dockerfile still copies removed legacy runtime/sync directories.');
for(const src of ['server.js','server','public','data']) if(!existsSync(join(root,src))) throw new Error('Docker COPY source missing '+src);

const client=readFileSync(join(root,'public/pvp/pvp-v370.js'),'utf8');
for(const needle of ["const ROOM='GRANDIS_PVP'","const DEFAULT_DECK_KEY='starter_01_elemental_lord_conqueror_renegade'",'fitIdentity','battlefieldIdentityLimit','identityBoxHtml','sendIntent','confirm-coin-flip','choose-coin-flip','pvp370-match-timer','maxlength=\"25\"','actions.prepend(timer)',"identityBoxHtml('opponent'","identityBoxHtml('player'","l.deckSource==='custom'&&l.deckData"]) if(!client.includes(needle)) throw new Error('PvP client feature missing '+needle);
if(/otherRoomUrl|SWITCH TO|GO TO VS AI|GO TO DECK|CURRENT ROOM|SPECTATE/i.test(client)) throw new Error('Parked/multi-room/spectator navigation leaked into v3.70 client.');
for(const needle of ["send('remove-seat',{seat:targetSeat})",'seatExitHold=true','localSeat===2&&seat===1&&!online']) if(!client.includes(needle)) throw new Error('Leave/Kick seat client contract missing '+needle);
const server=readFileSync(join(root,'server.js'),'utf8');
for(const needle of ["const MAX_SPECTATORS = 0","const FIXED_ROOM_ID = 'GRANDIS_PVP'","engine/shared-app/app.bundle.js","Grandis Legacy PvP v3.70","deckData: client.deckSource === 'custom'","timeout: 15000",'function normalizeHumanPvpProgression','st.drawPhaseResolvedFor === side',"st.phase = 'Deploy'"]) if(!server.includes(needle)) throw new Error('server wiring missing '+needle);
if(/maxSpectators:\s*[1-9]/.test(server)) throw new Error('Spectator capacity must remain parked at 0.');
for(const needle of ['function removePlayerSeat','canP2RemoveOfflineP1',"case 'remove-seat'"]) if(!server.includes(needle)) throw new Error('Leave/Kick seat server contract missing '+needle);
const css=readFileSync(join(root,'public/pvp/pvp-v370.css'),'utf8');
if(/\.pvp370-grid|\.pvp370-shell|\.pvp370-brand\s/.test(css)) throw new Error('Stale pre-lobby selectors leaked into final v3.70 CSS.');
if(!css.includes('html.pvp-v370 .bottom-actions{grid-template-columns:1fr 1fr 1fr!important}')) throw new Error('Match timer battlefield slot styling missing.');
for(const needle of ['.pvp370-identity-box','.opponent-field .zone-label{top:1px']) if(!css.includes(needle)) throw new Error('PvP battlefield layout fix missing '+needle);
if(css.includes('--pvp370-pool-shift-y')||css.includes('html.pvp-mobile-device.pvp-v370 .player-mana-pool{')) throw new Error('Portable Mana Pool container must stay fixed; old vertical chase rule leaked back in.');
for(const needle of ['maximum-scale=1','user-scalable=no','viewport-fit=cover','touch-action:none','gesturestart']) if(!index.includes(needle)) throw new Error('Tablet zoom/scroll lock missing '+needle);
for(const needle of ['compactStep','cards.length>=9?0.46:0.56','isPortable&&!isPlayer&&cards.length>4']) if(!optionRuntime.includes(needle)) throw new Error('Portable opponent Shard stacking fix missing '+needle);
if(!optionRuntime.includes("pendingOwner(p)==='PLAYER'&&!p?.private_masked")) throw new Error('Remote pending CANCEL ownership guard missing.');
const sharedApp=readFileSync(join(root,'public/engine/shared-app/app.bundle.js'),'utf8');
for(const needle of ["sw('playerManaDeck','aiManaDeck')","sw('playerManaPoolCards','aiManaPoolCards')","sw('playerManaClasses','aiManaClasses')","sw('playerManaDeckCount','aiManaDeckCount')"]) if(!sharedApp.includes(needle)) throw new Error('Seat-2 Shard mirror regression guard missing '+needle);
for(const needle of ['recordPvpBattleFeedbackEvent','playAuthoritativeBattleFeedbackAudio','playAuthoritativeBattleFeedback']) if(!sharedApp.includes(needle)) throw new Error('Authoritative battle presentation bridge missing '+needle);
for(const needle of ['prepareAuthoritativeAnimations','playAuthoritativeAnimations','playBattleAudioNow','scheduleBattleVfx','seenAnimationIds','seenBattleAudioIds','seenBattleVfxIds']) if(!client.includes(needle)) throw new Error('PvP authoritative presentation client transport missing '+needle);

// Tester build must be self-contained: no gameplay/card/shard asset may depend on the public website.
const publicTextFiles=['public/engine/shared-app/app.bundle.js','public/engine/js/app.bundle.js','public/engine/js/static-data.js'];
for(const f of publicTextFiles){
  const text=readFileSync(join(root,f),'utf8');
  if(text.includes('https://grandislegacytcg.github.io/shared/season1/v1/')) throw new Error('Remote shared gameplay asset dependency remains in '+f);
}
for(const f of [
  'public/assets/ui/Back-of-Card-Main-Deck.webp','public/assets/ui/Back-of-Card-Legacy-Deck.webp','public/assets/ui/Mana-Shard-Thumb.webp',
  'public/assets/ui/Racial-Token-Head.webp','public/assets/ui/Racial-Token-Tail.webp',
  'public/assets/shards/Generic.webp','public/assets/shards/Warrior.webp','public/assets/shards/Mage.webp','public/assets/shards/Archer.webp','public/assets/shards/Cleric.webp','public/assets/shards/Thief.webp'
]) if(!existsSync(join(root,f))) throw new Error('Bundled PvP asset missing '+f);
for(const id of ['S1-MAG-H001','S1-WAR-H001','S1-THF-H001','S1-WAR-001','S1-ITM-001','S1-EVT-001']) if(!existsSync(join(root,'public/card-art',id+'.webp'))) throw new Error('Bundled card art missing '+id);
for(const f of ['public/engine/assets/battle/P.Attack.png','public/engine/assets/battle/M.Attack.png','public/engine/assets/battle/P.Defense.png','public/engine/assets/battle/M.Defense.png','public/engine/assets/battle/Heal.png','public/engine/assets/audio/battle/P.Atk.mp3','public/engine/assets/audio/battle/M.Atk.mp3','public/engine/assets/audio/battle/P.Def.mp3','public/engine/assets/audio/battle/M.Def.mp3','public/engine/assets/audio/battle/Dodge.mp3','public/engine/assets/audio/battle/Heal.mp3']) if(!existsSync(join(root,f))) throw new Error('Bundled battle presentation asset missing '+f);
if(!client.includes('runtimeBoardHydrated')||!client.includes("if(status==='setup')syncEngineDeckFromLocal()")) throw new Error('Active-match runtime hydration guard missing.');
for(const needle of ["skipImportAnimations:true","revealBattlefieldAfterHydration","waitForBattlefieldPaintReady","document.body.classList.add('pvp-booting'","state.seenAnimationIds=Object.create(null)"]) if(!client.includes(needle)) throw new Error('First-hydration regression guard missing '+needle);
for(const needle of ['queueAuthoritativeOpeningSequence','queueAuthoritativeDrawThenShardMotions','queueAuthoritativeShardGainMotions','captureAuthoritativeAttachmentDiscardMotion','captureAuthoritativeLegacyToDeckMotion','beginAuthoritativeHeldPlayedCardMotion']) if(!sharedApp.includes(needle)) throw new Error('v3.51-style authoritative animation bridge missing '+needle);
for(const needle of ['body.pvp-booting .app','.pvp370-coin{z-index:30050','active-card-visual','object-fit:contain']) if(!css.includes(needle)) throw new Error('Coin/first-paint/portable Active Card presentation guard missing '+needle);

const router=readFileSync(join(root,'server/gameplay-intent-router.mjs'),'utf8');
for(const needle of ['commitManaShardPaymentChoice','repairOrphanBlockingState']) if(!router.includes(needle)) throw new Error('Intent router missing '+needle);
console.log('v3.70 static architecture: PASS');
