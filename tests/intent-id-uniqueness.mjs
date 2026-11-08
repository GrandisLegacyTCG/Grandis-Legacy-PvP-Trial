import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
const client=readFileSync(join(process.cwd(),'public/pvp/intent-channel.js'),'utf8');
function makeDoc(nonce){
  const sent=[];
  const root={console,Math,Date,setTimeout,clearTimeout,crypto:{randomUUID:()=>nonce}};
  root.window=root;root.globalThis=root;
  vm.runInNewContext(client,root);
  const c=root.GL_CREATE_PVP_INTENT_CHANNEL({
    clientId:()=> 'same-connection-id',
    getSnapshot:()=>({local:{role:'player'},match:{status:'started',revision:5}}),
    send:(type,packet)=>{sent.push(packet);return true},
    setTimeout:()=>42,clearTimeout:()=>{}
  });
  assert.equal(c.sendIntent('advancePhase').ok,true);
  return sent[0].clientActionId;
}
const first=makeDoc('fresh-document-1');
const second=makeDoc('fresh-document-2');
assert.notEqual(first,second,'A reload must not reuse an acknowledged clientActionId');
const network=readFileSync(join(process.cwd(),'public/battle/runtime/pvp-network.js'),'utf8');
assert.match(network,/\.s0\.'\+ACTION_NONCE\+'\.'\+\(\+\+state\.seq\)/,'Battle action id must include a per-document nonce');
const host=readFileSync(join(process.cwd(),'public/pvp/pvp-host.js'),'utf8');
assert.match(host,/\.surrender\.'\+ACTION_NONCE/,'Surrender id must include a per-document nonce');
console.log('PASS reconnect-safe action ids across two browser documents');
