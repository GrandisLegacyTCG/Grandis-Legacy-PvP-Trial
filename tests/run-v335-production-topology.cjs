'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const exists=r=>fs.existsSync(path.join(root,r));
const html=read('public/index.html');
const cfg=read('public/config.js');
const app=read('public/js/app.bundle.js');
const net=read('public/js/pvp-network.js');
const css=read('public/css/app.css');
const server=read('server.js');
const meta=JSON.parse(read('public/PVP_FRONTEND_BUILD.json'));
assert.strictEqual(meta.pvp_version,'v3.42');
assert.strictEqual(meta.build_id,'gl-pvp-3.42-2026-09-13');
assert.strictEqual(meta.production_frontend_url,'https://grandislegacytcg.github.io/pvp/');
assert.strictEqual(meta.deployment_mode,'website-embedded-production-frontend');
assert(cfg.includes("buildId:'gl-pvp-3.42-2026-09-13'"));
assert(html.includes('gl-pvp-3.42-responsive-ui'));
// Match-time hamburger is dynamic/lobby-only; static gameplay HTML must not contain the old node.
assert(!html.includes('id="glMobileAppMenuButton"'),'static gameplay hamburger leaked into PvP HTML');
assert(net.includes('installPvpMobileMatchMenuController')&&net.includes('syncPvpMobileMatchMenuState'),'mobile lobby/match nav lifecycle missing');
// Player identity and connection signal are rendered by the actual PvP battlefield path.
assert(app.includes('pvp-player-display-name')&&app.includes('data-pvp-identity-side="AI"'),'battlefield opponent identity binding missing');
assert(app.includes('pvp-net-signal')&&css.includes('.pvp-net-signal'),'connection signal UI missing');
assert(net.includes('syncBattlefieldIdentityHeaders')&&net.includes('GL_PVP_OPPONENT_NAME'),'live room identity sync missing');
// VS AI battle feedback parity assets must physically ship with the production frontend.
for(const f of ['assets/battle/P.Attack.png','assets/battle/M.Attack.png','assets/battle/P.Defense.png','assets/battle/M.Defense.png','assets/audio/battle/P.Atk.mp3','assets/audio/battle/M.Atk.mp3','assets/audio/battle/P.Def.mp3','assets/audio/battle/M.Def.mp3']) assert(exists('public/'+f),'missing production VFX/audio asset '+f);
assert(net.includes('battleFeedbackFromAuthoritativePlans'),'revision-scoped authoritative battle-feedback delivery missing');
assert(!net.includes('freshAuthoritativeBattleFeedback'),'client is still diffing the canonical battle-feedback ledger');
assert(server.includes('st.pvpBattleFeedbackEvents = []'),'recipient snapshots still duplicate the internal battle-feedback ledger');
// v3.33 hard gate must stay gone from current server/client.
assert(!server.includes("ws.close(4409, 'PvP build mismatch')"),'server hard build gate returned');
assert(!server.includes('clientBuildId !== BUILD_ID'),'server exact-build reject condition returned');
assert(!net.includes("ws.close(4409,'PvP build mismatch')"),'client hard build gate returned');
// Low overhead locks.
assert(server.includes('perMessageDeflate: false'),'WebSocket compression should remain disabled on low-vCPU rooms');
assert(server.includes('const RUNTIME_SCRIPT = new vm.Script'),'browser runtime must remain precompiled once at process boot');
console.log('PASS PvP v3.41 production topology: real /pvp payload includes separated identity/signal UI, direct revision-scoped battle feedback, mobile nav lifecycle, and low-overhead server locks.');
