'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),skipDirs=new Set(['node_modules','.git']);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function actualFiles(base,{exclude=new Set()}={}){const out=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){if(e.isDirectory()&&skipDirs.has(e.name))continue;const abs=path.join(dir,e.name),rel=path.relative(base,abs).split(path.sep).join('/');if(e.isDirectory())walk(abs);else if(e.isFile()&&!exclude.has(rel))out.push(rel)}}walk(base);return out}
function parseRoot(){const file=path.join(root,'FILE_MANIFEST_SHA256.csv');if(!fs.existsSync(file))throw new Error('FILE_MANIFEST_SHA256.csv missing');const lines=fs.readFileSync(file,'utf8').trim().split(/\r?\n/);if(lines.shift()!=='path,sha256,bytes')throw new Error('bad root manifest header');return lines.map(line=>{const m=line.match(/^(.*),([a-f0-9]{64}),(\d+)$/i);if(!m)throw new Error('bad root manifest row: '+line);return{rel:m[1],hash:m[2],bytes:Number(m[3])}})}
function parsePublic(){const file=path.join(root,'public/PVP_FRONTEND_SHA256.csv');if(!fs.existsSync(file))throw new Error('public/PVP_FRONTEND_SHA256.csv missing');const lines=fs.readFileSync(file,'utf8').trim().split(/\r?\n/);if(lines.shift()!=='path,sha256,size')throw new Error('bad public manifest header');return lines.map(line=>{const m=line.match(/^"(.*)","([a-f0-9]{64})","(\d+)"$/i);if(!m)throw new Error('bad public manifest row: '+line);return{rel:m[1].replace(/""/g,'"'),hash:m[2],bytes:Number(m[3])}})}
function verify(rows,base){for(const r of rows){const f=path.join(base,r.rel);if(!fs.existsSync(f))throw new Error(`${r.rel} missing`);const b=fs.readFileSync(f);if(b.length!==r.bytes)throw new Error(`${r.rel} size mismatch`);if(sha(b)!==r.hash)throw new Error(`${r.rel} hash mismatch`)}}
const rr=parseRoot(),pr=parsePublic();verify(rr,root);verify(pr,path.join(root,'public'));
const rootActual=actualFiles(root,{exclude:new Set(['FILE_MANIFEST_SHA256.csv'])}),rootExpected=rr.map(x=>x.rel).sort();
if(JSON.stringify(rootActual.sort())!==JSON.stringify(rootExpected))throw new Error('root manifest file-set mismatch (missing or extra file)');
const pubActual=actualFiles(path.join(root,'public'),{exclude:new Set(['PVP_FRONTEND_SHA256.csv'])}),pubExpected=pr.map(x=>x.rel).sort();
if(JSON.stringify(pubActual.sort())!==JSON.stringify(pubExpected))throw new Error('frontend manifest file-set mismatch (missing or extra file)');
console.log(JSON.stringify({ok:true,rootManifest:{files:rr.length,missing:0,extra:0,hashMismatch:0,sizeMismatch:0},frontendManifest:{files:pr.length,missing:0,extra:0,hashMismatch:0,sizeMismatch:0}},null,2));
