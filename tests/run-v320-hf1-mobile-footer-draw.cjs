
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'public/css/app.css'),'utf8'),app=fs.readFileSync(path.join(root,'public/js/app.bundle.js'),'utf8'),html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
assert(css.includes('height:max(2px,env(safe-area-inset-bottom,0px))')&&!css.includes('height:calc(64px + env(safe-area-inset-bottom,0px))'));
assert(app.includes("e.reason==='MANDATORY_DRAW_PHASE'")&&app.includes('window.scrollBy(0,overlap)'));
assert(html.includes('gl-pvp-3.42-responsive-ui'));assert.strictEqual(require('../package.json').version,'3.0.42');
console.log('PASS PvP v3.29 Mobile UI HF2');
