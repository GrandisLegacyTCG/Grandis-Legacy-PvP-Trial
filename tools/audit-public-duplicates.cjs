'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),pub=path.join(root,'public');
const fail=process.argv.includes('--fail-on-identical-path-copies');
function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p,out);else if(e.isFile())out.push(p);}return out;}
const groups=new Map();
for(const file of walk(pub)){const buf=fs.readFileSync(file),h=crypto.createHash('sha256').update(buf).digest('hex');const arr=groups.get(h)||[];arr.push({path:path.relative(pub,file).replaceAll('\\','/'),bytes:buf.length});groups.set(h,arr);}
const dups=[...groups.entries()].filter(([,v])=>v.length>1).map(([sha,files])=>({sha256:sha,bytesEach:files[0].bytes,copies:files.length,wastedBytes:files[0].bytes*(files.length-1),files})).sort((a,b)=>b.wastedBytes-a.wastedBytes);
const report={ok:dups.length===0,duplicateGroups:dups.length,duplicateWastedBytes:dups.reduce((n,x)=>n+x.wastedBytes,0),largestDuplicateGroups:dups.slice(0,20)};
console.log(JSON.stringify(report,null,2));
if(fail&&dups.length)process.exit(1);
