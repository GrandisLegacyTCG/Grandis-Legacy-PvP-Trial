'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='node_modules'||e.name==='.git')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p,out);else if(e.isFile())out.push(p);}return out;}
const files=walk(root).map(p=>({path:path.relative(root,p).replaceAll('\\','/'),bytes:fs.statSync(p).size}));
const repoBytes=files.reduce((n,x)=>n+x.bytes,0),publicFiles=files.filter(x=>x.path.startsWith('public/')),publicBytes=publicFiles.reduce((n,x)=>n+x.bytes,0);
const dirs=new Map();for(const f of files){const parts=f.path.split('/');for(let i=1;i<parts.length;i++){const d=parts.slice(0,i).join('/');dirs.set(d,(dirs.get(d)||0)+f.bytes)}}
const sizeOf=rel=>{const p=path.join(root,rel);if(!fs.existsSync(p))return 0;if(fs.statSync(p).isFile())return fs.statSync(p).size;return walk(p,[]).reduce((n,f)=>n+fs.statSync(f).size,0)};
const report={repoBytes,publicBytes,publicAssetsBytes:sizeOf('public/assets'),publicCardArtBytes:sizeOf('public/card-art'),publicEngineBytes:sizeOf('public/engine'),largest30Files:files.sort((a,b)=>b.bytes-a.bytes).slice(0,30),largest20Directories:[...dirs].map(([path,bytes])=>({path,bytes})).sort((a,b)=>b.bytes-a.bytes).slice(0,20)};
console.log(JSON.stringify(report,null,2));
