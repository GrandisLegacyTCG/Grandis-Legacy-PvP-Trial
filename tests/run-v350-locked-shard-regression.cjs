'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const ok=(v,m)=>{if(!v)throw new Error(m)};
const pkg=JSON.parse(read('package.json'));
const net=read('public/js/pvp-network.js');
const app=read('public/js/app.bundle.js');
const router=read('server/gameplay-intent-router.mjs');
const server=read('server.js');
ok(pkg.version==='3.0.51','PvP v3.51 must retain the accepted v3.49 Shard system');
ok(JSON.parse(read('public/PVP_FRONTEND_BUILD.json')).release_ready===true,'Final v3.51 must be release-ready');
ok(/v3\.51/.test(net),'PvP browser version not promoted to v3.51');
ok(net.includes('function syncAuthoritativePendingChoice()'),'generic authoritative pending rehydration missing');
ok(!net.includes('function syncAuthoritativeDrawReview()'),'draw-only authoritative pending rehydration still active');
ok(net.includes("syncAuthoritativePendingChoice();"),'authoritative snapshot import does not dispatch pending UI');
ok(net.includes("[data-mana-class-uid]" )&&net.includes("runtimeIntent('toggleManaShardPaymentChoice'"),'normal Class Shard DOM route missing');
ok(net.includes("[data-response-mana-uid]")&&net.includes("runtimeIntent('toggleResponseManaShardChoice'"),'Response Class Shard DOM route missing');
ok(net.includes('[data-shard-preview-src]'),'Shard preview is not preserved as a local inspection action');
ok(router.includes('toggleManaShardPaymentChoice')&&router.includes('toggleResponseManaShardChoice'),'server intent router missing Class Shard choice intents');
ok(app.includes('toggleManaShardPaymentChoice:toggleManaShardPaymentChoice')&&app.includes('toggleResponseManaShardChoice:toggleResponseManaShardChoice'),'shared runtime bridge missing Class Shard choice intents');
ok(app.includes("p.type==='mana_shard_payment_choice'")&&app.includes("p.type==='response_payment_choice'")&&app.includes("p.type==='opponent_mana_selection'"),'canonical pending renderer does not cover Shard pending types');
ok(server.includes('opponentShardChoiceHandle')&&server.includes('STALE_OPPONENT_SHARD_CHOICE'),'v3.48 stable opaque opponent Shard mapping was not retained');
ok(server.includes("requestedRevision !== Number(room.engine?.revision || 0)"),'stale opponent Shard revision guard missing');
ok(server.includes('canonicalSelected')&&server.includes('p.selected_indices = popupOrder')&&server.includes('canonicalSelected.has(Number(entry.index))'),'masked opponent Shard selection is not preserved/remapped across authoritative snapshots');
ok(app.includes("IS_PVP_APP?'':String(idx)")&&app.includes('Refreshing…'),'PvP opponent Shard renderer can fall back to visual array index');

// Execute the real shared runtime's built-in Shard rules QA, not a reimplementation.
const dummy={style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},setAttribute(){},removeAttribute(){},appendChild(){},querySelector(){return null},querySelectorAll(){return[]},focus(){},scrollIntoView(){},click(){},disabled:false,value:'',checked:false,hidden:false,get innerHTML(){return this._h||''},set innerHTML(v){this._h=String(v)},get textContent(){return this._t||''},set textContent(v){this._t=String(v)}};
const document={readyState:'loading',addEventListener(){},removeEventListener(){},getElementById(){return dummy},querySelectorAll(){return[]},querySelector(){return null},createElement(){return {...dummy,style:{},classList:dummy.classList}},body:dummy,head:dummy,documentElement:dummy};
const window={document,GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,console};window.window=window;
const ctx={window,document,console,setTimeout,clearTimeout,URL,CustomEvent:class{},localStorage:{getItem(){return null},setItem(){},removeItem(){}},navigator:{},location:{href:'http://localhost/'}};ctx.globalThis=ctx;window.globalThis=ctx;vm.createContext(ctx);
for(const rel of ['public/js/static-data.js','public/js/runtime-authority.js','public/js/pvp-presentation-adapter.js','public/js/app.bundle.js'])vm.runInContext(read(rel),ctx,{timeout:15000,filename:rel});
const bridge=window.GL_LOCAL_AI_BRIDGE;ok(bridge&&bridge.testPlaytestManaRules,'shared runtime Shard QA bridge missing');
const mana=bridge.testPlaytestManaRules();ok(mana&&mana.ok,'shared runtime Shard rules QA failed: '+JSON.stringify(mana));
ok(mana.matchingValue===2&&mana.nonmatchingValue===1,'matching/nonmatching Class Shard values drifted');
ok(mana.paymentBatchOrder&&mana.matchingClassLast&&mana.laterBatchBelowEarlier,'Shard return batch ordering drifted');
ok(Array.isArray(mana.ultimateTargets)&&mana.ultimateTargets.length===1,'Ultimate Tribute owner + matching Class Shard gate drifted');

// Physical seat mapping must stay symmetric and pure.
const synthetic={mana:2,aiMana:5,manaRegen:1,aiManaRegen:3,playerManaPoolCards:[{uid:'P1',owner_side:'PLAYER'},{uid:'P2',owner_side:'PLAYER'}],aiManaPoolCards:[1,2,3,4,5].map(i=>({uid:'A'+i,owner_side:'AI'})),playerManaDeck:[{uid:'PD',owner_side:'PLAYER'}],aiManaDeck:[{uid:'AD1',owner_side:'AI'},{uid:'AD2',owner_side:'AI'}],playerManaClasses:['Warrior'],aiManaClasses:['Mage']};
const before=JSON.stringify(synthetic),mirrored=bridge.mirrorState(synthetic);
ok(JSON.stringify(synthetic)===before,'viewer mapping mutated canonical source object');
ok(mirrored.mana===5&&mirrored.aiMana===2,'viewer Mana counts did not swap');
ok(mirrored.playerManaPoolCards.length===5&&mirrored.aiManaPoolCards.length===2,'physical Shard Pool did not swap');
ok(mirrored.playerManaDeck.length===2&&mirrored.aiManaDeck.length===1,'physical Shard Deck did not swap');
console.log(JSON.stringify({ok:true,version:'v3.51-locked-v349-shard-retained',genericPendingRehydration:true,normalClassRoute:true,responseClassRoute:true,shardPreviewLocal:true,opaqueOpponentShardMapping:true,staleChoiceGuard:true,manaRules:mana,seatMirror:true},null,2));
