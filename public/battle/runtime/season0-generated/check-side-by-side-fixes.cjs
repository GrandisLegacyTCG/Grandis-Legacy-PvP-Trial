'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../..'); const cx={console,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,URL,setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},crypto:require('crypto').webcrypto,performance:{now:()=>0}};
cx.window=cx;cx.globalThis=cx;cx.location={href:'https://game.test/',origin:'https://game.test'};cx.navigator={userAgent:'Targeted regression VM'};cx.document={readyState:'loading',addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],body:null,documentElement:null};vm.createContext(cx);
for(const name of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']) {
 let s=fs.readFileSync(path.join(root,name),'utf8');
 if(name.endsWith('app.bundle.js')) s=s.replace(/\n\}\)\(\);\s*$/, '\n  window.__audit={normalizeDeck,validateDeck,fullFor,card};\n})();');
 vm.runInContext(s,cx,{timeout:50000,filename:name});
}
const game=cx.GL_GAME_ENGINE; assert(game,'Engine object missing'); cx.GL_LOCAL_AI_BRIDGE.setRenderSuppressed(true); const started=game.startLocalMatch('PLAYER');assert(started.ok,JSON.stringify(started));
const id='S0-ARC-008'; let art=cx.__audit.fullFor(id);
assert(art.startsWith('card-art/S0-ARC-008.webp'),'Full art should resolve official local S0 asset: '+art);
const starter=JSON.parse(fs.readFileSync(path.join(root,'engine/starter_deck_examples/s0_starter_01_red_white_GL_DECK_1_0.json')));
const oldId=starter.legacy_deck_package_slots[0].progression;starter.legacy_deck_package_slots[0].lineage=oldId;
const normalized=cx.__audit.normalizeDeck(starter);const expected=cx.__audit.card(oldId).identity.fixed_class_lineage_id;
assert(normalized.legacy_deck_package_slots[0].lineage===expected,'S0 Hero-ID package lineage must be canonically inferred');
assert(cx.__audit.validateDeck(starter,'PLAYER').ok,'S0 starter with canonical Hero-ID lineage should be legal');
const f=fs.readFileSync(path.join(root,'engine/shared-app/app.bundle.js'),'utf8');
assert(!f.includes("var staleFullArt={ 'S0-ARC-008': true }"));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'runtime/season0-generated/s0-asset-manifest-stage4.json')));
assert(manifest.cards[id].verified_local_full_path===art.replace(/\?.*$/,''),'Official full asset differs');
console.log(JSON.stringify({ok:true,full_art:art,s0_lineage_normalized_to:normalized.legacy_deck_package_slots[0].lineage,starter_legal:true,legacy_stale_S1_image_override:false},null,2));
