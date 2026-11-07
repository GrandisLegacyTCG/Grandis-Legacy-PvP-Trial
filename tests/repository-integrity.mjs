/** GitHub repository / Northflank Docker context preflight (static, not runtime QA). */
import assert from 'node:assert/strict';
import {statSync,readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const client=join(root,'client');
const required=['server.js','server/headless-rc32.mjs','server/viewer-safe.mjs','server/ws-lite.mjs',
  'client/index.html','client/runtime/pvp-network.js','client/engine/shared-app/app.bundle.js',
  'client/runtime/overrides/grand-finale-designer-nerf.js','client/engine/js/static-data.js',
  'Dockerfile','package.json','.dockerignore','.gitignore','.github/workflows/staging-qa.yml'];
for(const path of required)assert.ok(statSync(join(root,path)).isFile(),`Missing source file ${path}`);
const html=readFileSync(join(client,'index.html'),'utf8');
const deps=[...html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)=["']([^"']+)["']/gi)].map(x=>x[1]).filter(x=>!/^https?:|^data:|^\/\//i.test(x));
for(const dep of deps){
  const path=decodeURIComponent(dep.split(/[?#]/)[0]);
  assert.ok(path&&!path.startsWith('/'),'Absolute frontend dependency: '+dep);
  const resolved=resolve(client,path);
  assert.ok(resolved.startsWith(client+sep),'Traversal in frontend dependency: '+dep);
  assert.ok(statSync(resolved).isFile(),'Missing browser dependency: '+dep);
}
const artifacts=['node_modules','.git','.env'];
for(const name of artifacts)assert.ok(!readdirSync(root).includes(name),'Private or generated folder must not be shipped: '+name);
const cards=readdirSync(join(client,'card-art')).filter(n=>n.endsWith('.webp'));
assert.ok(cards.length>=150,'RC32 card image assets missing');
console.log(`PASS: GitHub root/Dockerfile required files, ${deps.length} HTML browser dependencies and ${cards.length} card images; no local secrets/deps.`);
