'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const audioRoot = path.join(root, 'public/assets/audio');
const bundle = fs.readFileSync(path.join(root, 'public/js/app.bundle.js'), 'utf8');
const expected = {
  'Coin Flip.mp3': 'b4842f9a3f2d25004223313f5473bef74afd79915b6af9bdb35c70f6df8c2b50',
  'Card Sound.mp3': '1c04e41918b392a643c22d6c02ef34eeab0341c70d46b7d517078725b79d8ee4'
};
const oldNames = [
  'freesound_community-coin-flip-37787',
  'freesound_community-flipcard-91468'
];
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

for (const [name, expectedHash] of Object.entries(expected)) {
  const file = path.join(audioRoot, name);
  assert.ok(fs.existsSync(file), `${name} is missing.`);
  assert.strictEqual(sha(file), expectedHash, `${name} audio bytes changed.`);
  assert.ok(bundle.includes(`assets/audio/${name}`), `${name} executable route is missing.`);
  assert.ok(new URL(`assets/audio/${name}`, 'https://example.invalid/').pathname.includes('%20'), `${name} URL is not safely encoded.`);
}
for (const old of oldNames) {
  assert.ok(!bundle.includes(old), `Stale executable audio reference ${old}.`);
  assert.ok(!fs.readdirSync(audioRoot).some(name => name.includes(old)), `Stale physical audio file ${old}.`);
}
assert.strictEqual(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version, '3.0.42');
console.log('PASS PvP v3.29 audio rename: exact bytes, safe space-bearing URLs, and zero stale executable references.');
