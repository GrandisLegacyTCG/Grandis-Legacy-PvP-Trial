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
for(const needle of ['window.GL_APP_MODE="PVP"','window.GL_PVP_SHARED_BOARD_ACTIVE=true','pvp/pvp-v370.js','pvp/pvp-v370.css','pvp-mobile-device','pvp-mobile-portrait','pvpLandscapeGate']) if(!index.includes(needle)) throw new Error('index wiring missing '+needle);

const optionRuntime=readFileSync(join(root,'public/option-b-runtime.js'),'utf8');
for(const needle of ['isPvpMobileDevice','showBattlefieldCardPreview','hideBattlefieldCardPreview','if(isPvpMobileDevice())return;']) if(!optionRuntime.includes(needle)) throw new Error('mobile preview contract missing '+needle);
const docker=readFileSync(join(root,'Dockerfile'),'utf8');
if(/COPY\s+(runtime|sync)\b/.test(docker)) throw new Error('Dockerfile still copies removed legacy runtime/sync directories.');
for(const src of ['server.js','server','public','data']) if(!existsSync(join(root,src))) throw new Error('Docker COPY source missing '+src);

const client=readFileSync(join(root,'public/pvp/pvp-v370.js'),'utf8');
for(const needle of ["const ROOM='GRANDIS_PVP'",'fitIdentity','sendIntent','confirm-coin-flip','choose-coin-flip','pvp370-match-timer',"const sep=' - ',MAX=40",'maxlength=\"40\"','actions.prepend(timer)',"signalHtml(signalClass(state.opponentLatencyMs","signalHtml(signalClass(state.latencyMs","l.deckSource==='custom'&&l.deckData"]) if(!client.includes(needle)) throw new Error('PvP client feature missing '+needle);
if(/otherRoomUrl|SWITCH TO|GO TO VS AI|GO TO DECK|CURRENT ROOM|SPECTATE/i.test(client)) throw new Error('Parked/multi-room/spectator navigation leaked into v3.70 client.');
const server=readFileSync(join(root,'server.js'),'utf8');
for(const needle of ["const MAX_SPECTATORS = 0","const FIXED_ROOM_ID = 'GRANDIS_PVP'","engine/shared-app/app.bundle.js","Grandis Legacy PvP v3.70","deckData: client.deckSource === 'custom'","timeout: 15000"]) if(!server.includes(needle)) throw new Error('server wiring missing '+needle);
if(/maxSpectators:\s*[1-9]/.test(server)) throw new Error('Spectator capacity must remain parked at 0.');
const css=readFileSync(join(root,'public/pvp/pvp-v370.css'),'utf8');
if(/\.pvp370-grid|\.pvp370-shell|\.pvp370-brand\s/.test(css)) throw new Error('Stale pre-lobby selectors leaked into final v3.70 CSS.');
if(!css.includes('html.pvp-v370 .bottom-actions{grid-template-columns:1fr 1fr 1fr!important}')) throw new Error('Match timer battlefield slot styling missing.');
const router=readFileSync(join(root,'server/gameplay-intent-router.mjs'),'utf8');
for(const needle of ['commitManaShardPaymentChoice','repairOrphanBlockingState']) if(!router.includes(needle)) throw new Error('Intent router missing '+needle);
console.log('v3.70 static architecture: PASS');
