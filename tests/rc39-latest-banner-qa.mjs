import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const runtime=read('public/battle/shared-app/app-runtime.js');
const css=read('public/battle/shared-ui/battlefield-ui.css');
const engine=read('public/battle/engine/shared-app/app.bundle.js');
assert.match(css,/\.gl-counter-banner\.is-mana/);
assert.match(runtime,/counterBanner\.classList\.toggle\('is-mana',item\.kind==='mana'\)/);
assert.match(runtime,/counterBanner\.classList\.remove\('show','is-racial','is-mana'\)/);
assert.match(engine,/type:'MANA_LOSS_COMMITTED'/);
const first=runtime.indexOf('function describeResolvedManaShards(');
const last=runtime.indexOf('function buildPresentationPlan(s){',first);
assert.ok(first>0&&last>first);
const messages=[];
const context={window:{GL_APP_MODE:'PVP'},Number,String,Map,Array,Math,
  queuePresentationNotice(...args){messages.push(args)},pvpNoticeMs:base=>base+1000,
  // The latest notification resolves a potential Mana Steal gain from the
  // already-projected action ledger. The legacy VM test needs that dependency.
  st:()=>({pvpActionEventsBySide:{PLAYER:[],AI:[]}})};
vm.createContext(context);vm.runInContext(runtime.slice(first,last),context);
const evt={type:'MANA_LOSS_COMMITTED',side:'PLAYER',source_side:'AI',
 effect_name:'Mana Burn',removed_count:3,
 removed_shards:[{kind:'CLASS',class_name:'Mage'}, {kind:'MANA'}, {kind:'MANA'}]};
context.presentPvpManaLossNotice(evt);
assert.equal(messages.length,1);
assert.equal(messages[0][0],'mana');
assert.equal(messages[0][1],'Opponent used Mana Burn.');
assert.match(messages[0][2],/1 Blue Mana Shard and 2 Regular Mana Shards/);
assert.equal(messages[0][3],3000);
context.presentPvpManaLossNotice({...evt,side:'AI'});
context.presentPvpManaLossNotice({...evt,type:'MANA_LOSS_PREVIEW'});
context.presentPvpManaLossNotice({...evt,removed_count:0});
assert.equal(messages.length,1,'No opponent/preview/zero-count popup');
context.presentPvpManaLossNotice({...evt,source_side:'PLAYER',effect_name:'Paladin Shield',removed_count:1,removed_shards:[{kind:'CLASS',class_name:'Cleric'}]});
assert.equal(messages.length,2);
assert.equal(messages[1][1],'You used Paladin Shield.');
assert.equal(messages[1][2],'Spent 1 White Mana Shard.');
assert.equal(JSON.stringify(messages).includes('physical-shard-uid'),false);
const buildInfo=JSON.parse(read('docs/donor-rc39/RC39_BUILD_INFO.json'));
assert.equal(buildInfo.rc39_delta.intermediate_ai_aura_combo_guard_changed,true);
assert.equal(buildInfo.rc39_delta.mana_loss_notice_changed,true);
assert.equal(buildInfo.rc39_delta.pvp_donor_adapter_changed_in_aura_hotfix,false);
const host=read('public/pvp/pvp-host.js');
assert.match(host,/BATTLE_CHANNEL='gl-pvp-battle-transport-v1'/);
assert.match(read('server.js'),/S0-RC39-PVP-NET-RC6-STAGE2-REPO-RC\d+/);
assert.match(read('server.js'),/ev\?\.type!=='MANA_LOSS_COMMITTED'&&ev\?\.type!=='PVP_OPPONENT_DISCARD'/,'Spectator receives no per-player Mana or Discard notices');
console.log('PASS RC39 latest: committed English centered Mana queue, dedup/privacy, current donor provenance, RC6 transport unchanged');
