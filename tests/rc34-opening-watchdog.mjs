import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Extract the actual production finalizer into a small deterministic DOM VM.
// This is a handler-level test, NOT a substitute for a real browser test.
const source=readFileSync('public/battle/shared-app/app-runtime.js','utf8');
const start=source.indexOf("let openingFirstSide='PLAYER'");
const end=source.indexOf('let glOpeningHiddenShardUids=new Set()',start);
assert.ok(start>=0 && end>start,'RC34 PvP opening finalizer must exist');
const removed=[],cleared=[],renders=[];
const context={
  window:{GL_APP_MODE:'PVP'},
  clearTimeout:id=>cleared.push(id),
  glHiddenCommittedDrawSlots:{PLAYER:new Map([[0,'a']]),AI:new Map([[0,'b']])},
  glOpeningHiddenShardUids:new Set(['PLAYER|mana-1']),
  handRenderKey:'dirty',opponentHandRenderKey:'dirty',manaRenderKey:'dirty',
  animationLayer:{querySelectorAll:()=>[{remove(){removed.push('one')}},{remove(){removed.push('two')}}]},
  glPresentationActive:2,glPresentationBusyUntil:8000,
  previousVisualState:null,presentationPrimed:false,
  visualStateOf:s=>({from:s}),st:()=>({phase:'Deploy'}),
  renderNow:()=>renders.push('render'),console:{warn:()=>{}}
};
vm.createContext(context);
vm.runInContext(source.slice(start,end),context,{filename:'app-runtime-finalizer.js'});
vm.runInContext('openingPresentationActive=true;pvpOpeningWatchdog=42;pvpOpeningSerial=7;pvpOpeningStartedAt=100;',context);
vm.runInContext('finishPvPOpeningPresentation(7,true)',context);
assert.deepEqual(cleared,[42],'Watchdog must be cleared on finalization');
assert.equal(removed.length,2,'Interrupted animation flies must be removed');
assert.equal(context.glHiddenCommittedDrawSlots.PLAYER.size,0);
assert.equal(context.glHiddenCommittedDrawSlots.AI.size,0);
assert.equal(context.glOpeningHiddenShardUids.size,0);
assert.equal(context.glPresentationActive,0);
assert.equal(context.glPresentationBusyUntil,0);
assert.equal(vm.runInContext('openingPresentationActive',context),false);
assert.equal(vm.runInContext('pvpOpeningSerial',context),8,'Old callbacks must be invalidated');
assert.equal(context.presentationPrimed,true);
assert.equal(renders.length,1);
// Late callback from an old sequence cannot cancel or mutate a new sequence.
vm.runInContext('openingPresentationActive=true;pvpOpeningSerial=9;',context);
vm.runInContext('finishPvPOpeningPresentation(7,true)',context);
assert.equal(vm.runInContext('openingPresentationActive',context),true);
assert.equal(renders.length,1);
assert.ok(source.includes('pvpOpeningWatchdog=setTimeout(()=>finishPvPOpeningPresentation(serial,true),12000)'));
assert.ok(source.includes('Date.now()-pvpOpeningStartedAt>12000)finishPvPOpeningPresentation(pvpOpeningSerial,true)'));
console.log('PASS DL-05: watchdog cleanup, masks removed, stale callback ignored, recovery wiring present');
