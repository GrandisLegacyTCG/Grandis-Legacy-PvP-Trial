'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'3.80.1');
const html=read('public/index.html'),host=read('public/pvp/pvp-host.js'),app=read('public/shared-app/app-runtime.js'),pvpCss=read('public/pvp/pvp-integration.css'),server=read('server.js'),authority=read('server/v6914-authority.mjs'),donor=read('public/engine/shared-app/app.bundle.js');
assert.match(html,/GL_APP_MODE\s*=\s*["']PVP["']/,'index must boot the v6 presentation in PVP mode');
assert.doesNotMatch(html,/local-ai-adapter\.js/i,'PvP must not load the local-AI authority adapter');
const hostPos=html.indexOf('pvp/pvp-host.js'),appPos=html.indexOf('shared-app/app-runtime.js');
assert.ok(hostPos>=0&&appPos>hostPos,'PvP host must register authority before external v6 app runtime boots');
for(const f of ['public/runtime/adapters/authority-adapter.js','public/runtime/adapters/pvp-adapter.js'])assert.ok(fs.existsSync(path.join(root,f)),`${f} missing`);

// Authoritative intent handshake.
assert.match(host,/runtime-intent/);assert.match(host,/runtime-intent-batch/);assert.match(host,/intent-ack/,'client must wait for an explicit action acknowledgement');assert.match(host,/ackRevision/,'intent queue must release only after the acknowledged revision snapshot arrives');assert.doesNotMatch(host,/rev>Number\(state\.intentInFlight\.base/,'opponent revisions must not falsely acknowledge a local intent');assert.match(host,/GL_CREATE_PVP_AUTHORITY_ADAPTER/);
assert.match(host,/skipImportAnimations:true/,'authoritative snapshot import must be silent; v6 external presentation owns visible animation');
assert.match(host,/if\(prop==='cardView'\)/,'client facade must own visible card asset resolution');
assert.match(host,/if\(prop==='manaAsset'\)/,'client facade must own visible shard asset resolution');
assert.match(app,/GL_V6914_PVP_PRESENTATION/,'v6 app runtime must expose its PvP presentation boundary');
assert.match(app,/function intentBatch\(/,'v6 UI must support serialized multi-intent interactions');
assert.match(app,/openingPresented/,'opening presentation must ACK the server instead of locally starting the turn');

// The server has already resolved the Draw by the time it exposes the interactive Draw phase.
// NEXT PHASE therefore must only wait while Draw presentation/resolution is genuinely pending.
assert.match(app,/const drawWaiting=s\.phase==='Draw'&&\(s\.drawPresentationPending\|\|s\.drawPhaseResolvedFor!=='PLAYER'\)/,'Draw phase must not permanently disable NEXT PHASE after authoritative Draw resolution');
assert.doesNotMatch(app,/\|\|s\.gameOver\|\|s\.phase==='Draw'/,'NEXT PHASE must not be unconditionally disabled for every Draw phase');

// Finished match -> shared lobby reset, not a local reload loop.
assert.match(host,/function returnToLobby\(\)\{return send\('return-to-lobby'\)/,'PvP host must request an authoritative return to lobby');
assert.match(app,/GL_PVP_HOST\?\.returnToLobby/,'result screen must return through the PvP server instead of reloading the finished match');
assert.match(server,/case 'return-to-lobby': returnToLobby\(client\)/,'server must handle finished-match lobby reset');
assert.match(server,/function returnToLobby\(client\).*room\.match\.status!=='finished'.*clearMatch\(\)/s,'server must only reset a finished match and clear authoritative match state');

// Removed prototype Local-AI/player identity badges must not survive in final PvP layout or runtime fallbacks.
for(const stale of ['opponentPlayerIdentityName','opponentDeckIdentity','playerIdentityName','playerDeckIdentity'])assert.doesNotMatch(html,new RegExp(stale,'i'),`${stale} legacy identity markup must be removed`);
assert.doesNotMatch(html,/class=["'][^"']*identity-card/i,'legacy identity-card markup must be removed');
assert.match(app,/function syncPlayerNameBox\(\)\{\}/,'legacy battlefield identity sync must be inert after badge removal');
assert.match(app,/hiddenShard=!!sh\?\.hidden_identity/,'masked opponent/spectator Shards must stay face-down in the visible battlefield');
assert.match(app,/hiddenShard\)\?'assets\/ui\/back-shard\.webp'/,'masked Shard identities must render the Shard back rather than a generic front');

// Coin gate and mounted battlefield behavior.
assert.match(app,/appRoot\.inert=on/,'Coin Flip gate must block keyboard/focus interaction as well as pointer input');
assert.match(pvpCss,/\.gl-coin-overlay\{background:#000!important/,'Coin Flip overlay must be fully opaque black');
assert.match(pvpCss,/html\.gl-pvp-coin-gated \.app\{pointer-events:none!important/,'Coin Flip gate must block battlefield pointer interaction');
assert.match(pvpCss,/\.app\{visibility:visible!important\}/,'gameplay field must remain mounted/visible rather than lifecycle-hidden');

// Server authority, client-version isolation, reconnect ownership and dedupe ordering.
assert.match(server,/V6914Authority/);assert.match(server,/runtime-intent-batch/);assert.match(server,/STALE_REVISION/);assert.match(server,/type:'intent-ack'/,'server must explicitly acknowledge accepted/deduplicated intents');assert.match(server,/coinPresented/);assert.match(server,/openingPresented/);
assert.match(server,/if\(String\(msg\.clientBuildId\|\|''\)!==BUILD_ID\).*CLIENT_BUILD_MISMATCH/s,'every websocket request must be tied to the current build');
assert.match(server,/if\(clientBuildId!==BUILD_ID\)throw Object\.assign\(new Error\('CLIENT_BUILD_MISMATCH'\),\{code:'CLIENT_BUILD_MISMATCH'\}\)/,'connection handshake must reject stale client builds with a dedicated error code');
assert.match(server,/if\(!seatToken\|\|existing\.seatTokenHash!==tokenHash\(seatToken\)\)throw Object\.assign\(new Error\('SEAT_TOKEN_MISMATCH'\),\{code:'SEAT_TOKEN_MISMATCH'\}\)/,'existing player seat must require its seat token on reconnect');
const dedupePos=server.indexOf('if(actionId&&room.ledger.has(actionId))'),stalePos=server.indexOf("const base=Number(msg.baseRevision)");
assert.ok(dedupePos>=0&&stalePos>dedupePos,'idempotent action dedupe must run before stale-revision rejection');
assert.match(server,/kickedClients\.add\(p\.clientId\)/,'kick must mark the removed client for the current setup');
assert.match(host,/code===4002.*state\.role='spectator'/s,'kicked client must reconnect as spectator instead of reclaiming Player 2');

// Exact donor gameplay authority remains locked; the server-side seat mirror fixes ownership without patching donor code.
assert.match(authority,/engine\/js\/static-data\.js/);assert.match(authority,/engine\/shared-app\/app\.bundle\.js/);
assert.match(authority,/beginFirstTurn\('PLAYER'\)/,'server must execute whichever remote seat is active as actor-local v6 PLAYER');
assert.match(authority,/\['playerManaDeck','aiManaDeck'\]/,'seat mirror must include Shard deck ownership');
assert.match(authority,/\['playerManaPoolCards','aiManaPoolCards'\]/,'seat mirror must include Shard pool ownership');
assert.match(authority,/lastActualDrawEvent.*HIDDEN_CARD/s,'viewer-safe state must mask opponent last draw metadata');
assert.match(authority,/hidden-opponent-pool/,'viewer-safe state must hide opponent Shard Pool identities');
assert.doesNotMatch(authority,/v3\.51|v351/i,'new authority module must not import or depend on v3.51 implementation');
assert.equal(fs.existsSync(path.join(root,'authority')),false,'legacy v3.51 authority tree must not be shipped');
assert.equal(fs.existsSync(path.join(root,'sync')),false,'v3.78 runtime-sync compatibility layer must not be shipped');
assert.match(server,/architecture:'v6\.91\.4-native-authority-handshake'/);


// v3.80 privacy/lifecycle hardening.
assert.match(authority,/publicPendingProjection/,'opponent pending state must use an allow-list projection');
assert.match(authority,/drawn_card_id, selected_order, shard_choices/,'privacy boundary must explicitly cover future nested donor fields by projection');
assert.match(authority,/sanitizeViewerLogs/,'viewer-safe board must sanitize private choice log text');
assert.match(authority,/hidden-opening-shard-/,'opening Shard events must use synthetic opponent identifiers');
assert.match(authority,/assets\/ui\/back-shard\.webp/,'opponent opening Shards must use the card back');
assert.match(server,/function resetRoom\(client\).*room\.match\.status!=='setup'/s,'reset-room must be rejected after gameplay starts');
assert.match(server,/const noStoreCode=ext==='\.html'\|\|ext==='\.js'\|\|ext==='\.mjs'/,'HTML/JS runtime code must be served no-store to avoid stale-build reconnect loops');
assert.match(server,/4003.*Client build mismatch/s,'build mismatch must close with a dedicated websocket code');
assert.match(host,/function recoverBuildMismatch\(\)/,'client must have a stale-build recovery path');
assert.match(host,/code===4003.*recoverBuildMismatch/s,'build mismatch close must not enter normal reconnect backoff');
assert.match(host,/custom:'grandis_legacy_pvp_v380_custom_deck'/,'imported Custom Deck must be persisted locally for refresh/reconnect');
assert.match(host,/if\(me\?\.hasDeck\|\|me\?\.deckKey\|\|me\?\.deckName\)return/,'setup sync must never overwrite a server-retained deck');
assert.match(host,/!meNow\?\.hasDeck/,'default starter selection must not overwrite a retained server Custom Deck');
assert.doesNotMatch(host,/subscribe\(fn\).*\},send,sendIntent/s,'raw transport send must not be exposed through GL_PVP_HOST');
assert.doesNotMatch(app,/LOCAL AI|AI Deck|Player Deck/,'shared PvP runtime must not retain Local-AI/deck prototype labels');

// Explicit product requirement: imported Custom Decks keep the existing 50–60 Main Deck acceptance.
// Do not silently tighten this to 60 cards in this PvP hotfix.
assert.match(donor,/mainIds\.length<50\|\|mainIds\.length>60/,'custom deck 50–60 Main Deck acceptance must remain unchanged');
assert.match(donor,/main_deck must contain 50 through 60 cards/,'custom deck validation text must remain unchanged');


// v3.80.1 donor-shell cleanup and tab-safe reconnect.
assert.match(html,/class=["']app gl-lobby-hidden["']/,'PvP must inherit the v6.91.4 neutral hidden shell until match activation');
for(const stale of ['TURN 16','Action selected','S1-ARC-H001.webp','S1-WAR-H004.webp','S1-ITM-018.webp','Vaelis Stormweave'])assert.equal(html.toLowerCase().includes(stale.toLowerCase()),false,`authored demo state must not survive: ${stale}`);
assert.doesNotMatch(html,/assets\/cards\//,'retired authored demo-only assets/cards must not be referenced');
assert.doesNotMatch(html,/<h3 class=["']gold["']>VS AI<\/h3>/,'PvP neutral shell must not flash the donor VS AI sidebar label');
assert.match(html,/<h3 class=["']gold["']>PvP<\/h3>/,'PvP shell must carry a neutral PvP sidebar label before runtime state arrives');
assert.match(app,/window\.GL_APP_MODE==='PVP'\?'OPPONENT TURN':'AI TURN'/,'PvP presentation must translate donor AI turn copy to opponent copy');
assert.match(app,/window\.GL_APP_MODE==='PVP'\?'Opponent Mana':'AI Mana'/,'PvP sidebar must translate donor AI resource copy to opponent copy');
assert.match(host,/const SESSION=\{client:'grandis_legacy_pvp_v3801_tab_client_id',seat:'grandis_legacy_pvp_v3801_tab_seat_token',role:'grandis_legacy_pvp_v3801_tab_role'\}/,'connection identity/role must be tab-scoped');
assert.match(host,/sessionStorage\.getItem\(SESSION\[key\]\)/,'client/seat reconnect identity must use sessionStorage');
assert.doesNotMatch(host,/localStorage\.getItem\(STORE\[['"]client['"]\]\)/,'client id must not be shared through localStorage');
assert.doesNotMatch(host,/STORE\.role|persist\('role'/,'player/spectator role must not be shared through localStorage');
assert.match(host,/if\(state\.ws!==ws\)return/,'stale socket callbacks must not tear down a newer connection');
assert.match(host,/code===4006.*forkConnectionIdentity/s,'a seat session replaced by another tab must fork instead of reconnect-fighting');
assert.match(host,/code===4004.*forkConnectionIdentity/s,'seat-token mismatch must fork to a fresh tab identity instead of reconnect-looping');
assert.match(server,/closeClientSocket\(client,4006,'Seat session replaced by another tab'\)/,'server must explicitly supersede the old same-seat socket');
assert.match(server,/SEAT_TOKEN_MISMATCH'\),\{code:'SEAT_TOKEN_MISMATCH'\}/,'seat-token rejection needs a dedicated error code');
assert.match(server,/code==='SEAT_TOKEN_MISMATCH'\?4004/,'seat-token mismatch must not use the normal reconnect close path');
console.log(JSON.stringify({ok:true,version:pkg.version,presentation:'VS AI v6.91.4',lobby:'PvP v3.76.6',v351:'reference only',legacyAuthorityShipped:false,legacySyncLayerShipped:false,nextPhaseDrawUnlocked:true,authoritativeRematchReset:true,legacyIdentityBadgesRemoved:true,customDeck50to60Preserved:true,privacyProjection:true,openingShardPrivacy:true,resetRoomGuarded:true,customDeckReconnectSafe:true,buildMismatchRecovery:true,pvpPresentationLabels:true},null,2));
