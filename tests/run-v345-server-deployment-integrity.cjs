'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const importPattern=()=>/\b(?:import\s+(?:[^'";]+?\s+from\s+)?|export\s+[^'";]+?\s+from\s+|import\s*\()(['"])(\.\.?\/[^'"]+)\1/g;
const visited=new Set(),edges=[];
function resolveLocal(from,spec){
  const base=path.resolve(path.dirname(from),spec);
  const candidates=[base,base+'.js',base+'.mjs',base+'.cjs',path.join(base,'index.js'),path.join(base,'index.mjs')];
  return candidates.find(fs.existsSync)||null;
}
function walk(file){
  const abs=path.resolve(file); if(visited.has(abs)) return; visited.add(abs);
  const src=fs.readFileSync(abs,'utf8'); const imports=importPattern(); let m;
  while((m=imports.exec(src))){
    const target=resolveLocal(abs,m[2]);
    assert(target,`Missing local production import ${m[2]} from ${path.relative(root,abs)}`);
    assert(fs.statSync(target).isFile(),`Production import is not a file: ${target}`);
    edges.push([path.relative(root,abs).replace(/\\/g,'/'),path.relative(root,target).replace(/\\/g,'/')]);
    walk(target);
  }
}
walk(path.join(root,'server.js'));
const expected=['sync/runtime-sync-verifier.mjs','server/gameplay-intent-router.mjs','server/headless-runtime-compat.mjs'];
for(const rel of expected) assert(visited.has(path.join(root,rel)),`Expected server import not reachable: ${rel}`);
assert.strictEqual(sha(path.join(root,'server/gameplay-intent-router.mjs')),'ac36cef76f8ee9e57996eed9d9c79a3174a9806d798792cc5ff70e15b3e7394b','Canonical gameplay router changed unexpectedly');
assert.strictEqual(sha(path.join(root,'server/headless-runtime-compat.mjs')),'8fdf32801f2ea1646ec3231cea60dbdf81da46c7eba8dcdffc529cf20bf6f13d','Headless runtime compatibility module changed unexpectedly');
const docker=fs.readFileSync(path.join(root,'Dockerfile'),'utf8');
assert(/COPY\s+server\.js\s+\.\/server\.js/.test(docker),'Dockerfile must copy server.js');
assert(/COPY\s+server\s+\.\/server/.test(docker),'Dockerfile must copy server/ production modules');
assert(/COPY\s+sync\s+\.\/sync/.test(docker),'Dockerfile must copy sync/');
assert(/COPY\s+runtime\s+\.\/runtime/.test(docker),'Dockerfile must copy runtime/');
assert(/COPY\s+data\s+\.\/data/.test(docker),'Dockerfile must copy data/');
assert(/COPY\s+public\s+\.\/public/.test(docker),'Dockerfile must copy public/');
const di=fs.readFileSync(path.join(root,'.dockerignore'),'utf8');
assert(!/^server\/?$/mi.test(di),'server/ must not be excluded by .dockerignore');
console.log(JSON.stringify({ok:true,entry:'server.js',localModules:[...visited].map(x=>path.relative(root,x).replace(/\\/g,'/')).sort(),edges,dockerServerDirectory:true,routerHash:sha(path.join(root,'server/gameplay-intent-router.mjs'))},null,2));
