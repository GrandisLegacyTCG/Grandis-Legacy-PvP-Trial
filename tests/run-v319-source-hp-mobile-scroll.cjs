
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const data=require(path.join(root,'data/season1/cards.runtime.v0.15.0.json'));const by=Object.fromEntries(data.cards.map(c=>[c.card_id,c]));const hp={"S1-ARC-H001":90,"S1-ARC-H002":110,"S1-ARC-H003":130,"S1-WAR-H001":90,"S1-WAR-H002":120,"S1-WAR-H003":150,"S1-WAR-H004":100,"S1-WAR-H005":120,"S1-WAR-H006":150};
assert.strictEqual(data.canonical_registry_hash,'ce79e5a97c115507f68734887160b575840899056e1533488e3fddd3a11fec1f');for(const [id,v] of Object.entries(hp))assert.strictEqual(by[id].hp,v,`${id} HP`);
const css=fs.readFileSync(path.join(root,'public/css/app.css'),'utf8'),app=fs.readFileSync(path.join(root,'public/js/app.bundle.js'),'utf8');assert(css.includes('html.gl-mobile-game-scroll-active #app{')&&css.includes('touch-action:pan-x pan-y pinch-zoom!important')&&css.includes('#app::after'));assert(!css.includes('\\n'));assert(app.includes("document.getElementById('app')")&&app.includes('setMobileGameplayScrollMode(true)'));
assert.strictEqual(require('../package.json').version,'3.0.42');console.log('PASS PvP v3.29 Source Stack v1.8.2 Hero HP + permanent #app mobile scroll contract');
