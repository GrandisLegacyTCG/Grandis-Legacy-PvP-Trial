const fs=require('fs');const path=require('path');const assert=require('assert');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8'),css=fs.readFileSync(path.join(root,'public/css/app.css'),'utf8'),js=fs.readFileSync(path.join(root,'public/js/mobile-app-nav.js'),'utf8'),net=fs.readFileSync(path.join(root,'public/js/pvp-network.js'),'utf8');
assert(!html.includes('id="glMobileAppMenuButton"'),'v3.33 hamburger must not be statically mounted');
for(const token of ['glMobileAppMenuButton','glMobileAppMenu','Grandis-Legacy-VS-AI/','https://grandislegacytcg.github.io/pvp/','Grandis-Legacy-Deck-Builder/style-2/'])assert(net.includes(token)||js.includes(token),'missing dynamic mobile nav token '+token);
assert(css.includes('@media(max-width:760px){body.pvp-lobby-mode>.gl-mobile-app-menu-button{display:flex!important}.pvp-v260-top-actions{display:none!important}}'),'mobile-only menu contract missing');
assert(js.includes('m.hidden = false'),'menu open controller missing');assert(js.includes("event.key === 'Escape'"),'Escape close missing');
assert(net.includes('if(!show){if(menu)menu.remove();if(button)button.remove();return false;}'),'active gameplay does not remove nav DOM');
console.log('PASS PvP v3.34 dynamic lobby-only mobile cross-app navigation.');
