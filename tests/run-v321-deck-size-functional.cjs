'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const dummy={style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},setAttribute(){},removeAttribute(){},appendChild(){},querySelector(){return null},querySelectorAll(){return[]},focus(){},scrollIntoView(){},click(){},disabled:false,value:'',checked:false,hidden:false,get innerHTML(){return this._h||''},set innerHTML(v){this._h=String(v)},get textContent(){return this._t||''},set textContent(v){this._t=String(v)}};
const document={readyState:'loading',addEventListener(){},removeEventListener(){},getElementById(){return dummy},querySelectorAll(){return[]},querySelector(){return null},createElement(){return {...dummy,style:{},classList:dummy.classList}},body:dummy,head:dummy};
const window={document,GL_APP_MODE:'PVP',GL_PVP_SHARED_BOARD_ACTIVE:true,addEventListener(){},removeEventListener(){},dispatchEvent(){},setTimeout,clearTimeout,console};window.window=window;
const ctx={window,document,console,setTimeout,clearTimeout,URL,CustomEvent:class{},localStorage:{getItem(){return null},setItem(){},removeItem(){}},navigator:{},location:{href:'http://localhost/'}};ctx.globalThis=ctx;window.globalThis=ctx;vm.createContext(ctx);
for(const rel of ['public/js/static-data.js','public/js/runtime-authority.js','public/js/app.bundle.js'])vm.runInContext(fs.readFileSync(path.join(root,rel),'utf8'),ctx,{timeout:10000,filename:rel});
const bridge=window.GL_LOCAL_AI_BRIDGE;if(!bridge||!bridge.startSharedMatch)throw new Error('Shared runtime bridge missing');
const starter=JSON.parse(fs.readFileSync(path.join(root,'public/starter_deck_examples/starter_01_elemental_lord_conqueror_renegade_GL_DECK_1_0.json'),'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x));
function count(deck){return deck.main_deck.reduce((n,e)=>n+Number(e.quantity||1),0)}
function resize(deck,target){const d=clone(deck);let total=count(d);for(let i=d.main_deck.length-1;i>=0&&total>target;i--){const q=Number(d.main_deck[i].quantity||1),cut=Math.min(q,total-target);d.main_deck[i].quantity=q-cut;total-=cut;if(d.main_deck[i].quantity<=0)d.main_deck.splice(i,1);}d.main_deck_count=total;if(total!==target)throw new Error('Could not resize deck');return d;}
function shouldStart(deck,label){const snap=bridge.startSharedMatch({playerDeck:deck,aiDeckKey:'starter_02_saint_crusader_grand_ranger'});if(!snap||!snap.appState)throw new Error(label+' should start');}
function shouldReject(deck,fragment,label){let err=null;try{bridge.startSharedMatch({playerDeck:deck,aiDeckKey:'starter_02_saint_crusader_grand_ranger'});}catch(e){err=String(e&&e.message||e)}if(!err||!err.includes(fragment))throw new Error(label+' should reject with '+fragment+'; got '+err);}
const d50=resize(starter,50),d55=resize(starter,55),d60=resize(starter,60);
shouldStart(d50,'50-card deck');
shouldStart(d60,'60-card deck');
shouldReject(d55,'exactly 50 or 60','55-card deck');
const d4=clone(d60);const first=d4.main_deck.find(e=>Number(e.quantity||1)<=2);const original=Number(first.quantity||1);first.quantity=4;let delta=4-original;for(let i=d4.main_deck.length-1;i>=0&&delta>0;i--){if(d4.main_deck[i]===first)continue;const q=Number(d4.main_deck[i].quantity||1);const cut=Math.min(q,delta);d4.main_deck[i].quantity=q-cut;delta-=cut;if(d4.main_deck[i].quantity<=0)d4.main_deck.splice(i,1);}d4.main_deck_count=count(d4);
if(d4.main_deck_count!==60)throw new Error('4-copy test deck must remain 60');
shouldReject(d4,'normal card max 3','4-copy normal card deck');
console.log('PASS v3.21 functional: 50/60 start; 55 rejects; normal x4 rejects.');
