'use strict';
const crypto=require('crypto'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const fixed=[
'package.json','server.js','server/gameplay-intent-router.mjs','server/headless-runtime-compat.mjs',
'authority/browser-runtime/app.bundle.js','authority/browser-runtime/static-data.js','authority/browser-runtime/runtime-authority.js','authority/browser-runtime/pvp-presentation-adapter.js',
'public/index.html','public/shared-ui/battlefield-ui.css','public/shared-app/app-runtime.js',
'public/runtime/adapters/authority-adapter.js','public/runtime/adapters/pvp-adapter.js','public/pvp/pvp-host.js','public/pvp/pvp-integration.css','public/lobby/pvp-lobby-v3.76.6.css',
'public/engine/js/app.bundle.js','public/engine/js/static-data.js','public/engine/js/runtime-authority.js','public/engine/shared-app/app.bundle.js','public/engine/shared-ui/battlefield-ui.js',
'data/config/active-runtime-source-stack.v1.94.2.json','data/season1/cards.runtime.v0.16.2.json','data/season1/effect-recipes.runtime.v0.15.2.json','data/season1/effect-checkpoint.v0.15.2.json','data/season1/hero-components.runtime.v1.1.0.json','data/season1/legality-map.runtime.v1.5.0.json','data/season1/card-preview.generated.v0.16.2.json','data/starter-decks/ACTIVE_STARTERS_v1.6.1.json','data/starter-decks/Grandis_Legacy_Starter_Deck_Presets_v1.6.1_LocalAI_PvP.json','public/starter_deck_examples/Grandis_Legacy_Starter_Deck_Presets_v1.6.1_PvP.json','sync/runtime-sync-verifier.mjs'];
function walk(dir,prefix=''){let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix?`${prefix}/${e.name}`:e.name,p=path.join(dir,e.name);if(e.isDirectory())out=out.concat(walk(p,rel));else out.push(rel);}return out;}
const runtime=walk(path.join(root,'runtime')).map(x=>'runtime/'+x).filter(x=>/\.(?:js|mjs|json)$/.test(x));
const starters=walk(path.join(root,'data/starter-decks/active')).map(x=>'data/starter-decks/active/'+x).filter(x=>x.endsWith('.json'));
const rels=[...new Set([...fixed,...runtime,...starters])].sort();
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
for(const rel of rels)if(!fs.existsSync(path.join(root,rel)))throw new Error(`Missing sync file: ${rel}`);
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const lock={version:'v2.63',schema_version:'2.63-pvp-v351-consumer',policy:'RUNTIME_FIRST_FAIL_CLOSED_SYNC',application:'PvP v3.78.3 Authority Boundary + Presentation Transport Stabilization 2026-10-10',releaseReady:true,sourceAuthority:'v1.9.5',sharedRuntime:'v1.94.2',runtimeData:'v0.16.2',effectRecipe:'v0.15.2',effectCheckpoint:'v0.15.2',heroComponents:'v1.1.0',starterAuthority:'v1.6.1',uiContract:'v2.53',canonicalRegistryHash:'7ac1f90f6a9654cf575ac41db64a052901005905b1cf01f3bfc7532873cc9389',heroComponentRegistryHash:'f36f1cc83eb9845743176c3af71f7823125353eae73e832588e9d8b42c6818be',requiredSourceStack:pkg.grandisLegacySourceStack,runtimeFiles:rels.map(rel=>({path:rel,sha256:sha(path.join(root,rel))})),authorityVerified:true,heroComponentsVerified:true,season1CardCount:200,activeStarterCount:5,networkArchitecture:'SERVER_AUTHORITATIVE_GAMEPLAY_INTENT_ROUTER',hiddenInformationContract:'VIEWER_SAFE_STATE_PRESERVED'};
fs.mkdirSync(path.join(root,'sync'),{recursive:true});
for(const f of fs.readdirSync(path.join(root,'sync')))if(/^runtime-sync-lock\.v.*\.json$/.test(f))fs.unlinkSync(path.join(root,'sync',f));
fs.writeFileSync(path.join(root,'sync/runtime-sync-lock.v2.63.json'),JSON.stringify(lock,null,2)+'\n');
console.log(`PASS: PvP v3.78.3 runtime sync lock generated for ${rels.length} files.`);
