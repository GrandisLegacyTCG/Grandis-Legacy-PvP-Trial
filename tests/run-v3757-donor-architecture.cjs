'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const ok=(v,m)=>{if(!v)throw new Error(m)};
const pkg=JSON.parse(read('package.json'));
const net=read('public/js/pvp-network.js');
const app=read('public/js/app.bundle.js');
const ui=read('public/js/pvp-ui-runtime.js');
const router=read('server/gameplay-intent-router.mjs');
const index=read('public/index.html');
ok(pkg.version==='3.75.7','package version must be 3.75.7');
ok(index.includes('js/app.bundle.js?v=3.75.7')&&index.includes('js/pvp-ui-runtime.js?v=3.75.7')&&index.includes('js/pvp-network.js?v=3.75.7'),'v3.51-style public/js load order missing');
ok(net.includes('intentInFlight')&&!net.includes('intentQueue=[]')&&!net.includes('pumpIntent'),'v3.73 intent queue leaked into v3.75.7');
ok(net.includes('function syncAuthoritativePendingChoice()')&&net.includes('syncAuthoritativePendingChoice();'),'v3.51 authoritative pending lifecycle missing');
ok(router.includes('toggleManaShardPaymentChoice')&&router.includes('toggleResponseManaShardChoice'),'v3.51 Class Shard payment intents missing');
ok(router.includes('selectOpponentManaChoice'),'v3.51 hidden Shard canonical intent missing');
ok(app.includes('function computeManaPayment(')&&!app.includes('function computeExactManaPayment('),'v6 exact-payment gameplay engine leaked into browser core');
ok(app.includes('GL_PVP_V3757_OPTION_B_ADAPTER'),'v6.90.7 UI adapter missing');
ok(ui.includes("intent('handleChoiceConfirm',[])")&&!ui.includes("intent('commitManaShardPaymentChoice',[])") ,'normal payment UI is not committed through v3.51 handleChoiceConfirm');
ok(ui.includes('selectOpponentManaChoiceHandle'),'opaque opponent Shard handle path missing from latest UI');
ok(router.includes('selectOpponentManaChoiceHandle')||router.includes('selectOpponentManaChoice'),'authoritative opponent Shard selection route missing');
ok(read('server.js').includes('function opponentShardPermutationKey')&&read('server.js').includes('choice_handle: opponentShardChoiceHandle')&&read('server.js').includes('pvp_pool_revision'),'v3.51 opaque Steal server protocol missing');
ok(read('server.js').includes('Battlefield Shard Pools are public information'),'Steal field/popup information boundary drifted');
ok(ui.includes('return net.sendIntent(name,args)')&&!ui.includes('sendIntent(name,args);setTimeout(renderNow,0)'),'PvP UI still performs immediate local render after network intent');
ok(ui.includes('Approved opening choreography')&&ui.includes('animateDraws(draw1,190,12')&&ui.includes('animateShards(shard1,190,12')&&ui.includes('animateDraws(draw2,360,35'),'approved opening choreography missing');
ok(ui.includes('function allEvents(s){const a=[];(s.playerPlayedEvents||[])')&&ui.includes('(s.opponentPlayedEvents||[]).forEach')&&!/function allEvents\(s\)[^\n]*(opening|draw_events|presentationEvents)/.test(ui),'Card Played history must be sourced only from public played-card events');
ok(!index.includes('LOCAL AI'),'player-facing index still exposes LOCAL AI label');
ok(ui.includes('resetForMatch:resetPresentationState')&&net.includes("incomingStatus==='coin-flip'&&previousStatus!=='coin-flip'"),'new-match presentation/history reset missing');
// Windows-safe asset paths: no case-insensitive duplicate file paths.
const files=[];(function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())walk(full);else files.push(path.relative(root,full).replace(/\\/g,'/'));}})(path.join(root,'public'));
const seen=new Map();for(const rel of files){const key=rel.toLowerCase();ok(!seen.has(key),'case-insensitive public path collision: '+seen.get(key)+' <-> '+rel);seen.set(key,rel);}
// Strip the presentation-only adapter and lock the remaining browser gameplay core to the exact v3.51 app bundle hash.
const a=app.indexOf('  /* GL_PVP_V3757_OPTION_B_ADAPTER'),b=app.indexOf('  var __glPvpBaseRender=render;',a);
ok(a>=0&&b>a,'adapter boundaries not found');
const core=app.slice(0,a)+app.slice(b);
const coreHash=crypto.createHash('sha256').update(core).digest('hex');
ok(coreHash==='ff42da9f22fedb80dda944df28699a6d3eeae9d1fa8fb5aa05321abd766713e7','browser gameplay core drifted from PvP v3.51: '+coreHash);
// Execute the actual v3.51 runtime bridge and its accepted Shard/payment QA.
const dummy={style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},setAttribute(){},removeAttribute(){},appendChild(){},querySelector(){return null},querySelectorAll(){return[]},focus(){},scrollIntoView(){},click(){},disabled:false,value:'',checked:false,hidden:false,get innerHTML(){return this._h||''},set innerHTML(v){this._h=String(v)},get textContent(){return this._t||''},set textContent(v){this._t=String(v)}};
const document={readyState:'loading',addEventListener(){},removeEventListener(){},getElementById(){return dummy},querySelectorAll(){return[]},querySelector(){return null},createElement(){return {...dummy,style:{},classList:dummy.classList}},body:dummy,head:dummy,documentElement:dummy};
const window={document,GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,console};window.window=window;
const ctx={window,document,console,setTimeout,clearTimeout,URL,CustomEvent:class{},localStorage:{getItem(){return null},setItem(){},removeItem(){}},navigator:{},location:{href:'http://localhost/'}};ctx.globalThis=ctx;window.globalThis=ctx;vm.createContext(ctx);
for(const rel of ['public/js/static-data.js','public/js/runtime-authority.js','public/js/pvp-presentation-adapter.js','public/js/app.bundle.js'])vm.runInContext(read(rel),ctx,{timeout:20000,filename:rel});
const bridge=window.GL_LOCAL_AI_BRIDGE;ok(bridge&&bridge.testPlaytestManaRules,'v3.51 runtime bridge Shard QA missing');
const mana=bridge.testPlaytestManaRules();ok(mana&&mana.ok,'v3.51 Shard/payment QA failed: '+JSON.stringify(mana));
console.log(JSON.stringify({ok:true,version:pkg.version,coreHash,manaRules:true,singleIntent:true,opaqueShard:true,openingChoreography:true},null,2));
