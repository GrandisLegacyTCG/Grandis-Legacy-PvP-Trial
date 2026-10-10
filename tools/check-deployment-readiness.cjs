'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const failures = [];
const notes = [];
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

function fail(msg) { failures.push(msg); }
function pass(msg) { notes.push(`PASS: ${msg}`); }

const pkg = JSON.parse(read('package.json'));
const lockPkg = JSON.parse(read('package-lock.json'));
const docker = read('Dockerfile');
const server = read('server.js');
const readme = read('README.md');

if (pkg.version !== '3.78.2') fail(`package.json version is ${pkg.version}, expected 3.78.2`);
else pass('package version is v3.78.2');

if (!pkg.dependencies || !pkg.dependencies.ws) fail('package.json production dependency "ws" is missing');
else pass(`package.json declares ws ${pkg.dependencies.ws}`);

const lockRoot = lockPkg.packages && lockPkg.packages[''];
if (!lockRoot || !lockRoot.dependencies || !lockRoot.dependencies.ws) fail('package-lock.json root does not lock production dependency "ws"');
else pass(`package-lock.json locks ws ${lockRoot.dependencies.ws}`);

if (!/npm\s+ci\s+--omit=dev/.test(docker)) fail('Dockerfile must install production dependencies with npm ci --omit=dev');
else pass('Dockerfile installs production dependencies');

if (!/CMD\s*\[\s*["']node["']\s*,\s*["']server\.js["']\s*\]/.test(docker)) fail('Dockerfile CMD must start node server.js');
else pass('Dockerfile starts server.js');

if (!/process\.env\.PORT/.test(server)) fail('server.js must read process.env.PORT');
else pass('server reads process.env.PORT');
if (!/0\.0\.0\.0/.test(server)) fail('server.js must retain production bind host 0.0.0.0');
else pass('server retains 0.0.0.0 bind fallback');
if (!/url\.pathname\s*===\s*['"]\/health['"]/.test(server)) fail('server.js /health endpoint not found');
else pass('/health endpoint exists');
if (/brotliCompressSync\s*\(|gzipSync\s*\(/.test(server)) fail('synchronous request-path compression helper found in server.js');
else pass('no synchronous Brotli/Gzip helper in server.js');

if (!/Deployment Guardrails|no healthy upstream/i.test(readme)) fail('README.md does not contain the mandatory deployment guardrail section/link');
else pass('README contains deployment guardrails');
if (!exists('DEPLOYMENT_GUARDRAILS.md')) fail('DEPLOYMENT_GUARDRAILS.md is missing');
else pass('DEPLOYMENT_GUARDRAILS.md exists');

const syncDir = path.join(root, 'sync');
const syncFiles = fs.readdirSync(syncDir).filter(n => /^runtime-sync-lock\.v.*\.json$/.test(n)).sort();
if (syncFiles.length !== 1) {
  fail(`expected exactly one runtime sync lock; found ${syncFiles.length}`);
} else {
  const sync = JSON.parse(read(`sync/${syncFiles[0]}`));
  const runtimeFiles = Array.isArray(sync.runtimeFiles) ? sync.runtimeFiles.map(x => x.path) : [];
  if (!runtimeFiles.length) fail('runtime sync lock has no runtimeFiles');
  else {
    const copySources = [];
    for (const raw of docker.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || !/^COPY\s+/i.test(line)) continue;
      const rest = line.replace(/^COPY\s+/i, '').trim();
      if (rest.startsWith('[')) {
        try {
          const arr = JSON.parse(rest.replace(/'/g, '"'));
          if (Array.isArray(arr)) copySources.push(...arr.slice(0, -1));
        } catch {}
      } else {
        const parts = rest.split(/\s+/).filter(Boolean).filter(x => !x.startsWith('--'));
        if (parts.length >= 2) copySources.push(...parts.slice(0, -1));
      }
    }
    const norm = s => s.replace(/^\.\//, '').replace(/\/$/, '');
    const sources = copySources.map(norm);
    const covered = rel => sources.some(src => src === '.' || rel === src || rel.startsWith(src + '/'));
    const uncovered = runtimeFiles.filter(rel => !covered(norm(rel)));
    if (uncovered.length) {
      fail(`Dockerfile omits ${uncovered.length} runtime-sync file(s). First: ${uncovered.slice(0, 8).join(', ')}`);
    } else {
      pass(`Dockerfile covers all ${runtimeFiles.length} runtime-sync files`);
    }
  }
}

const syncCheck = spawnSync(process.execPath, ['sync/runtime-sync-verifier.mjs', '--self-test'], { cwd: root, encoding: 'utf8' });
if (syncCheck.status !== 0) fail(`runtime sync verifier failed:\n${syncCheck.stdout}${syncCheck.stderr}`);
else pass('runtime sync verifier passes');

const manifestCheck = spawnSync(process.execPath, ['tools/verify-package.cjs'], { cwd: root, encoding: 'utf8' });
if (manifestCheck.status !== 0) fail(`package manifest verification failed:\n${manifestCheck.stdout}${manifestCheck.stderr}`);
else pass('package/frontend manifests verify');

for (const line of notes) console.log(line);
if (failures.length) {
  console.error('\nDEPLOYMENT READINESS: FAIL');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log('\nDEPLOYMENT READINESS: STATIC PASS');
console.log('Mandatory next step after npm ci: npm run test:startup');
