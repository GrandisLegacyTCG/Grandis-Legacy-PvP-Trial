'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..','public');
const out=path.join(root,'PVP_FRONTEND_SHA256.csv');
const skip=new Set(['PVP_FRONTEND_SHA256.csv']);
const rows=[];
function walk(dir){for(const name of fs.readdirSync(dir).sort()){const abs=path.join(dir,name);const st=fs.statSync(abs);if(st.isDirectory())walk(abs);else{const rel=path.relative(root,abs).split(path.sep).join('/');if(skip.has(rel))continue;const hash=crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');rows.push([rel,hash,st.size]);}}}
walk(root);
const esc=v=>'"'+String(v).replace(/"/g,'""')+'"';
fs.writeFileSync(out,'path,sha256,size\n'+rows.map(r=>r.map(esc).join(',')).join('\n')+'\n');
console.log(`Wrote ${path.relative(path.resolve(__dirname,'..'),out)} with ${rows.length} files.`);
