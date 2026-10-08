'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const app=read('public/js/app.bundle.js');
const css=read('public/css/app.css');
const html=read('public/index.html');
const pkg=JSON.parse(read('package.json'));

assert.strictEqual(pkg.version,'3.0.42','PvP v3.29 package marker missing');
assert(app.includes('Grandis Legacy PvP v3.42'),'PvP v3.29 app marker missing');
assert(html.includes('gl-pvp-3.42-responsive-ui'),'v3.26 cache-bust marker missing');

// VS AI v6.24 Card Played preview contract. Normal desktop is 2 columns x 3 rows
// with the six newest combined actions. The shared responsive rules then reduce
// the visible preview to four only where the VS AI stylesheet does so.
assert(app.includes('recent=events.slice(0,6)'),'normal Card Played preview is not using the VS AI six-event source window');
assert(/\.v96-app \.played-grid\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important;[\s\S]*?grid-template-rows:repeat\(3,minmax\(52px,1fr\)\)!important;/.test(css),'normal desktop Card Played grid is not the VS AI 2x3 layout');
assert(css.includes('.v96-app .played-grid{grid-template-rows:repeat(3,minmax(42px,1fr))!important;gap:4px!important}'),'shorter desktop Card Played rows do not match VS AI');
assert(css.includes('.v96-app .played-grid .combined-played-card:nth-child(n+7){display:none!important}'),'mobile/shared six-card cap does not match VS AI');
assert(css.includes('.v96-app .played-grid .combined-played-card:nth-child(n+5){display:none!important}'),'constrained desktop four-card fallback from VS AI is missing');

// Structure and archive/detail interactions must remain the same shared component,
// not a separate PvP-only card list.
for(const token of [
  '<section class="control-panel card-played-panel">',
  '<div class="played-grid">'+"'", // source concatenation marker below is checked separately
  'id="cardPlayedHistoryButton"',
  'Full Card History',
  'function v96ShowCardPlayedHistory()',
  'function v96ShowCardPlayedDetail(side,eventId)',
  'class="combined-played-card"'
]) {
  if(token==='<div class="played-grid">'+"'") continue;
  assert(app.includes(token),`shared Card Played UI token missing: ${token}`);
}
assert(app.includes("<div class=\"played-grid\">'+tiles+'<"),'shared Card Played grid renderer missing');

console.log('PASS PvP v3.29: Card Played preview/UI contract matches VS AI v6.24, including normal six-card layout and constrained four-card fallback.');
