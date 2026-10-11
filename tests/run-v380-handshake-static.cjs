'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'3.80.8');
const html=read('public/index.html'),host=read('public/pvp/pvp-host.js'),channel=read('public/pvp/intent-channel.js'),app=read('public/shared-app/app-runtime.js'),pvpCss=read('public/pvp/pvp-integration.css'),server=read('server.js'),authority=read('server/v6914-authority.mjs'),donor=read('public/engine/shared-app/app.bundle.js');
assert.match(html,/GL_APP_MODE\s*=\s*["']PVP["']/,'index must boot the v6 presentation in PVP mode');
assert.doesNotMatch(html,/local-ai-adapter\.js/i,'PvP must not load the local-AI authority adapter');
const channelPos=html.indexOf('pvp/intent-channel.js'),hostPos=html.indexOf('pvp/pvp-host.js'),appPos=html.indexOf('shared-app/app-runtime.js');
assert.ok(channelPos>=0&&hostPos>channelPos&&appPos>hostPos,'intent channel must load before PvP host, and host must register authority before external v6 app runtime boots');
for(const f of ['public/runtime/adapters/authority-adapter.js','public/runtime/adapters/pvp-adapter.js'])assert.ok(fs.existsSync(path.join(root,f)),`${f} missing`);

// Authoritative intent handshake. One browser action -> one server intent-result carrying the resulting viewer-safe snapshot.
assert.match(channel,/runtime-intent/);assert.match(channel,/runtime-intent-batch/);assert.match(host,/intent-result/,'client must complete gameplay actions from one atomic server result');assert.match(host,/send\('resync'\)/,'client must request a fresh snapshot after a transport timeout');assert.doesNotMatch(host,/intentQueue|ackRevision/,'client must not maintain a silent action queue or ACK/snapshot correlation lock');assert.match(host,/GL_CREATE_PVP_AUTHORITY_ADAPTER/);
assert.match(channel,/exactly one gameplay action may be in flight/,'intent channel must serialize browser actions explicitly');assert.match(channel,/busy:true/,'a second click while one action is in flight must be rejected rather than silently queued');assert.match(channel,/Server response timed out/,'intent channel must have timeout recovery');
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
assert.doesNotMatch(pvpCss,/\.gl-coin-overlay\s*\{[^}]*background\s*:/s,'PvP integration must not override the v6.91.4 Coin Flip backdrop');
assert.match(pvpCss,/html\.gl-pvp-coin-gated \.app\{pointer-events:none!important/,'Coin Flip gate must block battlefield pointer interaction');
assert.doesNotMatch(pvpCss,/\.app\s*\{[^}]*visibility\s*:/s,'PvP integration must not force the battlefield visible during the donor Coin Flip lifecycle');
assert.match(app,/function pvpCoinChoice\(info=\{\}\)\{[^}]*gl-lobby-hidden/s,'PvP Coin Flip choice must keep the donor battlefield hidden');
assert.doesNotMatch(app,/Waiting for ['\"]?\+?esc\(info\.chooserName|Waiting for .*choose Heads or Tails/i,'non-chooser must not get a separate waiting-card Coin Flip presentation');
assert.match(app,/Both seats use the exact donor coin-choice presentation/,'both PvP seats must render the same Heads/Tails choice layout');
assert.match(app,/else body\.querySelectorAll\('\[data-coin-choice\]'\).*aria-disabled/s,'non-chooser coin faces must remain visible but inert');
assert.match(app,/function pvpCoinResult\(info=\{\}\)\{[^}]*gl-lobby-hidden/s,'PvP Coin Flip result must keep the donor battlefield hidden');
assert.match(host,/if\(m\.status==='opening'\)[\s\S]*importBoard\(state\.snapshot,\{render:false\}\)/,'opening board must import silently before the single explicit v6.91.4 opening presentation');
assert.match(server,/openingId='opening:'/,'server must assign one stable Opening presentation id per match');
assert.match(host,/m\.openingId/,'client opening dedupe must use the server-owned stable Opening id, not match revision');
assert.match(app,/r\?\.presentationId/,'presentation layer must dedupe repeated Opening snapshots by the same stable id');

// Server authority, client-version isolation, reconnect ownership and dedupe ordering.
assert.match(server,/V6914Authority/);assert.match(server,/runtime-intent-batch/);assert.match(server,/STALE_REVISION/);assert.match(server,/type:'intent-result'/,'server must complete accepted/rejected gameplay actions with an atomic result');assert.match(server,/snapshot:viewFor\(client\)/,'intent-result must carry the viewer-safe authoritative snapshot for the sender');assert.match(server,/case 'resync': send\(client\.ws,viewFor\(client\)\)/,'server must support transport timeout resync');assert.match(server,/coinPresented/);assert.match(server,/openingPresented/);
assert.match(server,/if\(String\(msg\.clientBuildId\|\|''\)!==BUILD_ID\).*CLIENT_BUILD_MISMATCH/s,'every websocket request must be tied to the current build');
assert.match(server,/if\(clientBuildId!==BUILD_ID\)throw Object\.assign\(new Error\('CLIENT_BUILD_MISMATCH'\),\{code:'CLIENT_BUILD_MISMATCH'\}\)/,'connection handshake must reject stale client builds with a dedicated error code');
assert.match(server,/if\(!seatToken\|\|existing\.seatTokenHash!==tokenHash\(seatToken\)\)throw Object\.assign\(new Error\('SEAT_TOKEN_MISMATCH'\),\{code:'SEAT_TOKEN_MISMATCH'\}\)/,'existing player seat must require its seat token on reconnect');
const dedupePos=server.indexOf('if(actionId&&room.ledger.has(actionId))'),stalePos=server.indexOf("const base=Number(msg.baseRevision)");
assert.ok(dedupePos>=0&&stalePos>dedupePos,'idempotent action dedupe must run before stale-revision rejection');
assert.match(server,/kickedClients\.add\(p\.clientId\)/,'kick must mark the removed client for the current setup');
assert.match(host,/code===4002.*state\.role='spectator'/s,'kicked client must reconnect as spectator instead of reclaiming Player 2');

// v6.91.4 remains the exact gameplay base. PvP payment reconciliation lives outside the donor engine.
assert.match(authority,/engine\/js\/static-data\.js/);assert.match(authority,/engine\/shared-app\/app\.bundle\.js/);
assert.match(authority,/beginFirstTurn\('PLAYER'\)/,'server must execute whichever remote seat is active as actor-local v6 PLAYER');
assert.match(authority,/\['playerManaDeck','aiManaDeck'\]/,'seat mirror must include Shard deck ownership');
assert.match(authority,/\['playerManaPoolCards','aiManaPoolCards'\]/,'seat mirror must include Shard pool ownership');
assert.match(authority,/lastActualDrawEvent.*HIDDEN_CARD/s,'viewer-safe state must mask opponent last draw metadata');
assert.doesNotMatch(authority,/hidden-opponent-pool/,'opponent Shard Pool must stay visible like v6.91.4 normal gameplay');
assert.match(authority,/Shard Pools are public battlefield state in v6\.91\.4/,'authority must document the public Shard Pool boundary');
assert.match(authority,/autoAdvanceResolvedHumanDraw/,'server authority must reproduce v6.91.4 automatic Draw-to-Deploy behavior for remote humans');
assert.doesNotMatch(authority,/from .*v3\.51|require\(.*v3\.51/i,'authority must not import legacy v3.51 code; it is architecture reference only');
assert.equal(fs.existsSync(path.join(root,'authority')),false,'legacy v3.51 authority tree must not be shipped');
assert.equal(fs.existsSync(path.join(root,'sync')),false,'v3.78 runtime-sync compatibility layer must not be shipped');
assert.match(server,/architecture:'v6\.91\.4-native-authority-handshake'/);


// v3.80 privacy/lifecycle hardening.
assert.match(authority,/publicPendingProjection/,'opponent pending state must use an allow-list projection');
assert.match(authority,/drawn_card_id, selected_order, shard_choices/,'privacy boundary must explicitly cover future nested donor fields by projection');
assert.match(authority,/sanitizeViewerLogs/,'viewer-safe board must sanitize private choice log text');
assert.doesNotMatch(authority,/hidden-opening-shard-/,'opening Shard presentation must preserve canonical UIDs for donor destination lookup');
assert.match(authority,/Opening animation in v6\.91\.4 hides the on-board Shard by its real UID/,'opening Shard privacy must be presentation-owned rather than UID-destructive');
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


assert.match(html,/class="player-name gl-hover-geometry-only"/,'removed identity UI must leave the exact donor player-name geometry invisibly for Hand-preview placement');
assert.match(app,/uiRect\(document\.querySelector\('\.player-name'\)\)/,'Hand hover preview must use the exact v6.91.4 player-name anchor selector, not the Hand center');
assert.doesNotMatch(app,/kind==='hand'[\s\S]{0,220}querySelector\('\.hand\.bottom'\)/,'Hand hover preview must not drift by anchoring to the Hand container');

// PvP Mana payment: preserve v6.91.4 exact-Shard semantics while keeping the browser
// free of local donor gameplay mutation. Only the centered UI owns an ephemeral UID draft.
assert.match(host,/window\.GL_PVP_SHARED_BOARD_ACTIVE=true/,'browser donor must run in shared-board mode');
assert.match(host,/centered payment UI holds only an ephemeral UID draft/,'PvP host must document the UI-only payment draft boundary');
assert.doesNotMatch(app,/function localRuntimeIntent\(/,'PvP payment must not expose a generic local donor gameplay-intent escape hatch');
assert.doesNotMatch(app,/B\(\)\?\.applyServerIntent/,'browser payment selection must never mutate the mounted donor bridge');
assert.match(app,/let manaPaymentDraft=\{key:'',uids:\[\],responseIndices:\[\]\}/,'centered payment must keep only an ephemeral UI UID/discard draft');
assert.match(app,/function exactManaDraftPlan\(/,'centered payment must calculate exact Mana legality from the authoritative visible Pool plus the UI draft');
assert.match(app,/cards=pool\.map\(\(sh,i\)=>\(\{[^}]*clickable:true/s,'every normal Mana and Class Shard must remain selectable in the centered donor-style payment UI');
assert.match(app,/toggleManaPaymentDraftUid\(s,p,rawPool,c\.dataset\.choiceUid\)/,'centered Shard click must preserve the clicked canonical UID inside the UI-only draft');
assert.doesNotMatch(app,/wrap\.addEventListener\('click',[\s\S]{0,260}toggleManaPaymentDraftUid/,'real battlefield Shards must not be a Mana-payment click surface');
assert.match(app,/Battlefield Shards are presentation-only in PvP/,'battlefield Shard Pool must be explicitly hover\/presentation-only for payment');
assert.doesNotMatch(app,/gl-pay-button/,'legacy battlefield PAY button must be removed; center payment is the only PAY owner');
assert.match(app,/responsePay\?\[finalUids,selectedIndices\]:\[finalUids\]/,'PAY must send the final Shard UID set once; Response PAY must include its final discard draft too');
assert.match(app,/BF\?\.addEventListener\('click',e=>e\.stopPropagation\(\)\)/,'battlefield clicks must stop before the donor body router can perform a second local gameplay mutation');
assert.match(app,/laneEl\.onclick=heroSingleAction/,'the full legal Hero panel must route source\/target clicks through the authoritative PvP handler');
assert.doesNotMatch(app,/animateCenterChoiceExit\(keys,selectedTarget,otherTarget,\{returnSide:'PLAYER'\}\).*commitManaShardPaymentChoice/s,'PAY must not play a fake spend animation before the server accepts the commit');
assert.match(donor,/function computeExactManaPayment\(/,'active gameplay donor must retain v6.91.4 exact Shard payment');
assert.match(donor,/function recommendedExactManaShardUids\(/,'donor recommendation must remain intact');
assert.match(donor,/function manaSelectionAfterToggle\(/,'donor Shard toggle semantics must remain intact');
assert.match(donor,/The recommended payment is preselected\. You may change any Mana Shard or Class Shard before confirming\./,'donor payment presentation must keep all-Shard manual adjustment wording');
assert.doesNotMatch(donor,/auto_mana_fifo|class_manual_enabled|payment_ready/,'the removed PvP Class-only\/FIFO policy must not remain in the active donor engine');
assert.match(authority,/applyFinalPaymentDraft\(name,args=\[\]\)/,'server must expose one narrow final-payment reconciliation seam');
assert.match(authority,/PAYMENT_SHARD_NOT_IN_POOL/,'server must reject final Shard UIDs that are not in the actor authoritative pool');
assert.match(authority,/DUPLICATE_PAYMENT_SHARD_UID/,'server must reject duplicate final Shard UIDs');
assert.match(authority,/pending\.selected_shard_uids=uids\.slice\(\)/,'server must inject only the validated final draft before donor commit');
assert.match(authority,/return this\.bridge\.applyServerIntent\(name,\[\]\)/,'server must call the untouched donor payment commit exactly once after draft validation');

// Asset warm-up: never show text-only card fallbacks while art is decoding, without
// revealing deck order or warming the entire game catalog.
assert.match(host,/function preloadDeckAssets\(/,'selected own-deck artwork must be preloaded as an unordered lobby asset set');
assert.doesNotMatch(host,/function warmAllCardArt\(|warmAllCardArt\(\)/,'full-game artwork warm-up must stay removed');
assert.match(host,/function installImageDecodeGuard\(/,'dynamic card\/shard images need a decode guard');
assert.match(host,/preloadImages\(visibleBoardAssetUrls\(state\.snapshot\)\)/,'opening must wait for visible board art before starting motions');
assert.match(pvpCss,/img\.gl-image-pending\{color:transparent!important/,'loading images must not expose alt-text card names');

// Deck summary must reflect the two physical decks as two visual groups.
const statsMarkup=host.match(/\$\('pvpDeckStats'\)\.innerHTML=([^;]+);/)?.[1]||'';
assert.ok(statsMarkup.indexOf('Heroes')<statsMarkup.indexOf('Legacies')&&statsMarkup.indexOf('Legacies')<statsMarkup.indexOf('Legacy Deck'),'Legacy Deck total must immediately follow its Hero/Legacy components');
assert.ok(statsMarkup.indexOf('Legacy Deck')<statsMarkup.indexOf('Skills')&&statsMarkup.indexOf('Skills')<statsMarkup.indexOf('Items')&&statsMarkup.indexOf('Items')<statsMarkup.indexOf('Events')&&statsMarkup.indexOf('Events')<statsMarkup.indexOf('Main Deck'),'Main Deck total must follow Skill/Item/Event components as a separate group');

// Explicit product requirement: imported Custom Decks keep the existing 50–60 Main Deck acceptance.
// Do not silently tighten this to 60 cards in this PvP hotfix.
assert.match(donor,/mainIds\.length<50\|\|mainIds\.length>60/,'custom deck 50–60 Main Deck acceptance must remain unchanged');
assert.match(donor,/main_deck must contain 50 through 60 cards/,'custom deck validation text must remain unchanged');


// v3.80.x donor-shell cleanup and tab-safe reconnect.
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
console.log(JSON.stringify({ok:true,version:pkg.version,presentation:'VS AI v6.91.4',lobby:'PvP v3.76.6',v351:'architecture/networking reference only',legacyAuthorityShipped:false,legacySyncLayerShipped:false,automaticDrawToDeploy:true,authoritativeRematchReset:true,legacyIdentityBadgesRemoved:true,customDeck50to60Preserved:true,privacyProjection:true,publicShardPoolParity:true,openingSinglePresentationOwner:true,donorCoinFlipLifecycle:true,resetRoomGuarded:true,customDeckReconnectSafe:true,buildMismatchRecovery:true,pvpPresentationLabels:true},null,2));
