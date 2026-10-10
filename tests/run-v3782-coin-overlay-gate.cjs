'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const R=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(R,p),'utf8');
const app=read('public/shared-app/app-runtime.js');
const css=read('public/pvp/pvp-integration.css');
function has(src,needle,msg){assert.ok(src.includes(needle),msg||('Missing: '+needle));}

has(app,"function setPvpCoinGate(active)",'PvP coin interaction gate must exist');
has(app,"root.classList.add('gl-pvp-coin-gated')",'Coin gate must mark the root');
has(app,"appRoot.inert=true",'Battlefield must be inert during Coin Flip');
has(app,"appRoot.setAttribute('aria-hidden','true')",'Battlefield must be removed from accessibility/focus navigation during Coin Flip');
has(app,"appRoot?.classList.remove('gl-lobby-hidden');if(m.status==='coin-flip')",'PvP field must remain mounted/visible under the Coin Flip overlay');
has(app,"if(m.status==='coin-flip'){setPvpCoinGate(true)",'Coin Flip snapshot must enable the interaction gate');
has(app,"if(m.status==='coin-result'&&m.openingCoinFlip){setPvpCoinGate(true);coinOverlay.classList.add('open')",'Coin result must retain an opaque active gate, including reconnect/direct snapshot');
has(app,"appRoot?.classList.remove('gl-lobby-hidden');setPvpCoinGate(false)",'Start Game handoff must release the gate without relying on hide/unhide');
has(app,"if(pvpOpeningStarted){setPvpCoinGate(false);coinOverlay.classList.remove('open');return}",'Later started snapshots must not re-hide or re-gate the active game');
assert.ok(!app.includes("lobbyOverlay.classList.remove('open');appRoot?.classList.add('gl-lobby-hidden');if(m.status==='coin-flip')"),'syncPvpPreGame must never hide the app during Coin Flip');

has(css,'html.gl-pvp-coin-gated .app{','PvP integration CSS must own the battlefield input gate');
has(css,'visibility:visible!important;','Coin-gated battlefield must stay rendered');
has(css,'pointer-events:none!important;','Coin-gated battlefield must not receive pointer/hover events');
has(css,'background:#000!important;','Coin overlay must be fully opaque black');
has(css,'html.gl-pvp-coin-gated .gl-battlefield-hover-preview','Hover preview must be suppressed during Coin Flip');

console.log(JSON.stringify({ok:true,battlefieldVisibleBehindOverlay:true,opaqueBlackOverlay:true,pointerLeakBlocked:true,inertFocusGate:true,hoverPreviewSuppressed:true,noPregameRehide:true},null,2));
