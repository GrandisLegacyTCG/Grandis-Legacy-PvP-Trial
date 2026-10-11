'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),skipDirs=new Set(['node_modules','.git']);
function walk(base,prefix=''){const out=[];for(const e of fs.readdirSync(base,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){if(e.isDirectory()&&skipDirs.has(e.name))continue;const rel=prefix?`${prefix}/${e.name}`:e.name,abs=path.join(base,e.name);if(e.isDirectory())out.push(...walk(abs,rel));else if(e.isFile()&&rel!=='FILE_MANIFEST_SHA256.csv')out.push(rel)}return out}
const rows=['path,sha256,bytes'];for(const rel of walk(root)){const b=fs.readFileSync(path.join(root,rel));rows.push(`${rel},${crypto.createHash('sha256').update(b).digest('hex')},${b.length}`)}fs.writeFileSync(path.join(root,'FILE_MANIFEST_SHA256.csv'),rows.join('\n')+'\n');console.log(`PASS: PvP v3.80.1 repository manifest generated for ${rows.length-1} files.`);
