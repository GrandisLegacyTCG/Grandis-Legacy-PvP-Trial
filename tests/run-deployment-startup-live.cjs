'use strict';

const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');

const root = path.resolve(__dirname, '..');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function getHealth(port) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/health', timeout: 1000 }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('timeout', () => req.destroy(new Error('health request timeout')));
    req.on('error', reject);
  });
}

(async () => {
  const port = await getFreePort();
  let stdout = '';
  let stderr = '';
  let exited = false;
  let exitCode = null;

  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', d => stdout += d.toString());
  child.stderr.on('data', d => stderr += d.toString());
  child.on('exit', code => { exited = true; exitCode = code; });

  const deadline = Date.now() + 15000;
  let health = null;
  try {
    while (Date.now() < deadline) {
      if (exited) throw new Error(`server exited before health became ready (code ${exitCode})`);
      try {
        const r = await getHealth(port);
        if (r.status === 200) {
          const data = JSON.parse(r.body);
          if (data && data.ok === true) { health = data; break; }
        }
      } catch {}
      await new Promise(r => setTimeout(r, 150));
    }
    if (!health) throw new Error('server did not return healthy /health within 15 seconds');
    console.log(`PASS: real server startup healthy on ${port}`);
    console.log(`PASS: /health version = ${health.version || 'unknown'}`);
  } catch (err) {
    console.error(`DEPLOYMENT STARTUP LIVE TEST: FAIL — ${err.message}`);
    if (stdout) console.error(`\n--- server stdout ---\n${stdout}`);
    if (stderr) console.error(`\n--- server stderr ---\n${stderr}`);
    try { child.kill('SIGTERM'); } catch {}
    process.exit(1);
  }

  child.kill('SIGTERM');
  await new Promise(resolve => {
    const t = setTimeout(resolve, 3000);
    child.once('exit', () => { clearTimeout(t); resolve(); });
  });
  console.log('DEPLOYMENT STARTUP LIVE TEST: PASS');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
