'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..','public'),out=path.join(root,'PVP_FRONTEND_SHA256.csv');
const rows=[];
function walk(dir){for(const name of fs.readdirSync(dir).sort()){const abs=path.join(dir,name),st=fs.statSync(abs);if(st.isDirectory())walk(abs);else{const rel=path.relative(root,abs).split(path.sep).join('/');if(rel==='PVP_FRONTEND_SHA256.csv')continue;const b=fs.readFileSync(abs);rows.push([rel,crypto.createHash('sha256').update(b).digest('hex'),b.length])}}}
walk(root);const q=v=>'"'+String(v).replace(/"/g,'""')+'"';fs.writeFileSync(out,'path,sha256,size\n'+rows.map(r=>r.map(q).join(',')).join('\n')+'\n');console.log(`PASS: public manifest generated for ${rows.length} files.`);
