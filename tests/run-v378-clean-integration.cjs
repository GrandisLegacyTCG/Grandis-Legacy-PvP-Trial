const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.resolve(__dirname,'..'), P=p=>fs.readFileSync(path.join(R,p),'utf8'), H=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,p))).digest('hex');
function ok(c,m){if(!c)throw new Error(m)}
const html=P('public/index.html'),app=P('public/shared-app/app-runtime.js'),host=P('public/pvp/pvp-host.js'),ad=P('public/runtime/adapters/pvp-adapter.js'),srv=P('server.js');
ok(html.includes('window.GL_APP_MODE="PVP"'),'PVP mode missing');
ok(!html.includes('local-ai-adapter.js'),'local-ai adapter must not load in PvP');
ok(html.includes('shared-app/app-runtime.js'),'approved v6 runtime missing');ok(html.includes('pvp/pvp-host.js'),'PvP host missing');
ok(host.includes('pvp-v260-lobby'),'v3.76.6 lobby unit missing');ok(host.includes('runtime-intent'),'runtime intents not routed server-side');
ok(ad.includes("hub.use('pvp')"),'PvP authority adapter not active');ok(ad.includes('requestCoinFlip'),'authoritative coin seam missing');
ok(!/brotliCompressSync\(|gzipSync\(/.test(srv),'sync compression regression');
ok(!/Option B|GL_OPTION_B|option-b|\.ob-/.test(html+app+ad+host),'experimental Option B naming reintroduced');
for(const bad of ['preparePvpOpening','startPvpOpening','runPvpPostOpeningSequence','pvp-coin-flip.js','pvp-opening.js','pvp-draw.js','pvp-phase-tracker.js','pvp-exp.js','pvp-response-ui.js','pvp-mobile-ui.js'])ok(!host.includes(bad)&&!ad.includes(bad),bad+' must not exist');
const exact={
 'public/shared-ui/battlefield-ui.css':'890680acf6ed763e2ee121cec94a219724bd22f3dfbd25a332d6bafa8dca8114',
 'public/engine/shared-ui/battlefield-ui.js':'110394df12e3052bbcc961de24dad29b5734af65d0a7c0afdd2c8ffdaf8a81cb',
 'public/engine/js/static-data.js':'817b8c7a95c13981be7992d1fa00736ca83ec7aeec75a2659effca0792858648',
 'public/engine/js/runtime-authority.js':'58a09b947a1d25b2e5e6018c6e0dac9508b5d534dd2a51192cd6dbaf2e1d4399',
 'public/engine/shared-app/active-starters.js':'9d536dffd4aa811428285c8db1652b8b509b61dadc2b3e200042a85289a09cfe',
 'public/engine/shared-app/app.bundle.js':'7253f45e57eee3c083e6877b8062fca7210034409e089cbdd4d88622a5569e93',
 'public/runtime/adapters/authority-adapter.js':'859992904b9cc814e8a3ae249e60431c9eafdcd90a7c81db236b60458fabbb00'
};for(const [f,h] of Object.entries(exact))ok(H(f)===h,'approved v6 donor parity failed: '+f);
const audit=JSON.parse(P('release/V378_ASSET_AUDIT.json'));ok(audit.broken_css_urls.length===0,'broken CSS asset refs');ok(audit.broken_html_local_refs.length===0,'broken HTML refs');ok(audit.broken_loaded_script_asset_refs.length===0,'broken loaded-script refs');
const parity=JSON.parse(P('release/PVP_v3.78.0_DONOR_PARITY.json'));ok(parity.lobby_v3766.base_markup_exact,'Lobby donor markup mismatch');ok(parity.lobby_v3766.lobby_css_normalized_exact,'Lobby donor CSS mismatch');
ok(!/touch overlay|mobile-only|tablet-specific/i.test(P('public/pvp/pvp-integration.css')),'PvP-only mobile control layer detected');
console.log(JSON.stringify({ok:true,architecture:'v3.76.6 lobby + v6.91.3 game + v3.51 authority',lobbyDonorMarkup:true,lobbyDonorCss:true,v6ExactCriticalFiles:Object.keys(exact).length,assetAudit:true,noLocalAiAdapter:true,noLegacyPresentationForks:true},null,2));
