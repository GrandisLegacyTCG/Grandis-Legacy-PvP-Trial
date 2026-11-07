import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

// Execute the actual lobby host top-level code. A syntax-only check does not
// catch references to deleted functions inside GL_PVP_HOST's exported API.
const hostPath = resolve(import.meta.dirname, '../public/pvp/pvp-host.js');
const source = readFileSync(hostPath, 'utf8');
const events = new Map();
const window = {
  GL_PVP_BUILD_META: { versionLabel: 'Grandis Legacy PvP', buildId: 'test-build' },
  GL_PVP_CONFIG: {},
  GL_CREATE_PVP_AUTHORITY_ADAPTER: () => ({}),
  GL_AUTHORITY_ADAPTER: { register() {}, use() {} }
};
const document = {
  readyState: 'loading',
  addEventListener(name, cb) { events.set(name, cb); }
};
vm.runInNewContext(source, { window, document, location: { protocol: 'https:', host: 'test.invalid' } }, {
  filename: 'public/pvp/pvp-host.js',
  timeout: 5000
});

assert.ok(window.GL_PVP_HOST, 'Lobby host must initialize without ReferenceError');
for (const method of [
  'getSnapshot', 'subscribe', 'sendIntent', 'sendIntentBatch', 'startMatch',
  'chooseCoin', 'coinPresented', 'confirmCoin', 'matchClock',
  'surrender', 'returnToLobby', 'identity', 'reconnect', 'getConnection'
]) {
  assert.equal(typeof window.GL_PVP_HOST[method], 'function', `Missing host API: ${method}`);
}
assert.equal(Object.hasOwn(window.GL_PVP_HOST, 'openingPresented'), false,
  'Obsolete opening-presented API must not return');
assert.equal(typeof events.get('DOMContentLoaded'), 'function', 'Lobby boot listener must be registered');
console.log('PASS: lobby host exports initialize without deleted-function references');
