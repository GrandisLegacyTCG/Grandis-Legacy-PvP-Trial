'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'public/pvp/intent-channel.js'),'utf8');
const context={console,setTimeout(){throw new Error('real timer not expected')},clearTimeout(){},globalThis:{}};context.window=context.globalThis;vm.createContext(context);new vm.Script(src,{filename:'intent-channel.js'}).runInContext(context);
const create=context.globalThis.GL_CREATE_PVP_INTENT_CHANNEL;assert.equal(typeof create,'function');
let snapshot={local:{role:'player'},match:{status:'started',revision:10}},packets=[],timerFn=null,errors=[],timeouts=0,busy=0;
const ch=create({
  clientId:()=> 'clientA',getSnapshot:()=>snapshot,
  send:(type,payload)=>{packets.push({type,payload});return true},
  timeoutMs:6000,setTimeout:fn=>{timerFn=fn;return 1},clearTimeout:()=>{timerFn=null},
  onError:m=>errors.push(String(m)),onBusy:()=>busy++,onTimeout:()=>timeouts++
});
let r=ch.sendIntent('beginPlayFromHand',[0]);assert.equal(r.ok,true);assert.equal(packets.length,1);assert.equal(packets[0].type,'runtime-intent');assert.equal(packets[0].payload.baseRevision,10);assert.equal(ch.getState().inFlight,true);
const blocked=ch.sendIntent('chooseHeroFromBoard',['PLAYER','LEFT']);assert.equal(blocked.ok,false,'second click must be rejected while one action is in flight');assert.equal(blocked.busy,true);assert.equal(packets.length,1,'busy clicks must never enter a silent queue');assert.equal(busy,1);
assert.equal(ch.handleResult({type:'intent-result',clientActionId:'wrong',ok:true}).matched,false);assert.equal(ch.getState().inFlight,true,'unrelated result must not unlock current action');
const id=packets[0].payload.clientActionId;assert.equal(ch.handleResult({type:'intent-result',clientActionId:id,ok:true}).matched,true);assert.equal(ch.getState().inFlight,false,'matching intent-result must unlock immediately');
snapshot={local:{role:'player'},match:{status:'started',revision:11}};r=ch.sendIntent('toggleManaShardPaymentChoice',['CLASS-1']);assert.equal(r.ok,true);assert.equal(packets.at(-1).payload.baseRevision,11);const id2=packets.at(-1).payload.clientActionId;ch.handleResult({clientActionId:id2,ok:false,message:'rejected'});assert.equal(ch.getState().inFlight,false,'rejected action must also unlock');assert.ok(errors.includes('rejected'));
r=ch.sendIntent('commitManaShardPaymentChoice',[]);assert.equal(r.ok,true);assert.equal(typeof timerFn,'function');timerFn();assert.equal(ch.getState().inFlight,false,'timeout must release the action gate');assert.equal(timeouts,1,'timeout callback must request recovery exactly once');
console.log(JSON.stringify({ok:true,noSilentQueue:true,atomicIntentResultUnlock:true,timeoutRecovery:true},null,2));
