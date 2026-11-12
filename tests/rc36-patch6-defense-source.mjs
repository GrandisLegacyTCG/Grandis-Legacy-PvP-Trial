/** RC36.8 donor -> PvP behavior-only synchronization.
 * Replays actual PvP route and panel handler from production source in an
 * isolated VM; does not modify the approved battlefield UI or engine. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const runtime=readFileSync(new URL('../public/battle/shared-app/app-runtime.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/battle/index.html',import.meta.url),'utf8');
const between=(start,end)=>{
  const from=runtime.indexOf(start),to=runtime.indexOf(end,from);
  assert.ok(from!==-1&&to>from,`Missing production code section: ${start}`);
  return runtime.slice(from,to);
};
const routeSource=between('const RESPONSE_ALLIED_SOURCE_CARDS=', 'function renderResponseRouteGuide(');
const panelSource=between('  const tributePanelAction=', '  hc.ondblclick=');
assert.match(html,/app-runtime\.js\?v=[^"\s]*-rc39-beta2-repo-rc3-2026-11-12/,'Browser must load changed runtime without using stale cached JS');
assert.doesNotMatch(runtime,/\breturnToLobbyDuringCoin\b/,'No unrelated coin UI control added');

function routeFixture(cardId,sourceLane,targetLane){
  const confirmed=[],rendered=[];
  const choice={optionIndices:[0],stage:'source',selectedOptionIndex:null};
  const rw={response_owner:'PLAYER',kind:'incoming_attack',target_lane:targetLane,
    options:[{card_id:cardId,source_lane:sourceLane,hand_index:2}]};
  const ctx={uiResponseSourceChoice:choice,st:()=>({responseWindow:rw}),
    confirmResponseOption:i=>confirmed.push(i),renderNow:()=>rendered.push('render')};
  vm.runInNewContext(routeSource+'\n;globalThis.routeClick=selectResponseRouteHero;globalThis.legalLanes=responseChoiceLanes;',ctx);
  return {ctx,rw,choice,confirmed,rendered};
}
function handlerFixture({responseSelectable=false,engineSelectable=false,p=null,side='PLAYER',lane='CENTER',onRoute=()=>{},onTribute=()=>{}}={}){
  const calls=[];
  const laneEl={onclick:null};
  const ctx={responseSelectable,engineSelectable,p,side,lane,laneEl,
    directTributeHeroReady:()=>false,
    runTributeLikeHeroAction:(...args)=>{calls.push('tribute');onTribute(...args)},
    selectResponseRouteHero:(...args)=>{calls.push('response');onRoute(...args)}};
  vm.runInNewContext(panelSource,ctx);
  const click=(closestClass=null)=>{
    const event={prevented:false,stopped:false,target:{closest:(selectors)=>
      closestClass&&selectors.includes(closestClass)?{className:closestClass}:null},
    preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true}};
    laneEl.onclick?.(event);
    return event;
  };
  return {laneEl,calls,click};
}

// An exhausted Paladin/Crusader can use an engine-legal team-wide Defense
// from its own attacked lane. Previously only the narrow Hero art was clickable.
for(const targetLane of ['LEFT','RIGHT']){
  const fixture=routeFixture('S0-CLE-025','LEFT',targetLane); // Blessing of Divinity
  const panel=handlerFixture({responseSelectable:true,lane:'LEFT',
    onRoute:(side,lane)=>fixture.ctx.routeClick(side,lane)});
  const event=panel.click('.gl-hp-overlay');
  assert.deepEqual([...fixture.confirmed],[0],`Team-wide Defense must confirm with attacked ${targetLane}`);
  assert.equal(fixture.choice.stage,'source','Allied Defense does not prompt for an arbitrary target');
  assert.deepEqual(panel.calls,['response']);
  assert.ok(event.prevented&&event.stopped);
}

// Holy Barrier remains a two-step source (Crusader) -> attacked target route.
const single=routeFixture('S0-CLE-010','RIGHT','LEFT');
const singleSource=handlerFixture({responseSelectable:true,lane:'RIGHT',
  onRoute:(side,lane)=>single.ctx.routeClick(side,lane)});
singleSource.click('.gl-hero-exp-indicator');
assert.equal(single.choice.stage,'protected');
assert.deepEqual([...single.confirmed],[],'Single-target Defense must not auto-confirm from source');
assert.deepEqual([...single.rendered],['render']);
const singleTarget=handlerFixture({responseSelectable:true,lane:'LEFT',
  onRoute:(side,lane)=>single.ctx.routeClick(side,lane)});
singleTarget.click();
assert.deepEqual([...single.confirmed],[0], 'Only the attacked target can receive Holy Barrier');

// Protect non-response and interactive subtree behavior; only legal source
// lanes get the click handler. The engine remains authoritative for legality.
const noAction=handlerFixture({responseSelectable:false});
assert.equal(noAction.laneEl.onclick,null);
assert.deepEqual(noAction.calls,[]);
const illegal=routeFixture('S0-CLE-025','LEFT','LEFT');
illegal.ctx.routeClick('PLAYER','RIGHT');
assert.deepEqual([...illegal.confirmed],[]);
const buttons=handlerFixture({responseSelectable:true});
for(const child of ['.hero-card','.attachment-card','.gl-legacy-under-hero','.gl-hero-actions','button','a','[role="button"]']){
  const evt=buttons.click(child);
  assert.equal(evt.prevented,false,`${child} should retain its original action`);
}
assert.deepEqual(buttons.calls,[],'Interactive children must not trigger a second Response');
const tribute=handlerFixture({p:{type:'tribute_target'},engineSelectable:true});
tribute.click('.gl-hp-overlay');
assert.deepEqual(tribute.calls,['tribute'],'Tribute click-to-lane must not regress');
console.log('PASS RC36.8 -> PvP behavior-only: 2 Blessing source paths, Holy Barrier 2-stage, illegal source, subtree controls, Tribute and cache bust.');
