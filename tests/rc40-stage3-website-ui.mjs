import assert from 'node:assert/strict';
import {readFileSync,existsSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const f=(p)=>readFileSync(path.join(cwd,p),'utf8');
const checks=[];function check(name,fn){try{fn();checks.push(name);console.log('PASS',name)}catch(e){console.error('FAIL',name,e);process.exitCode=1}}
const build='gl-s0-pvp-rc40-patch32-item-discard-2026-11-14';
check('Server/client single build ID and original single WS',()=>{
  assert.match(f('server.js'),new RegExp(build));
  assert.match(f('server.js'),/WebSocketServer\(\{server,path:'\/ws'/);
  assert.match(f('public/pvp/pvp-host.js'),/const BATTLE_CHANNEL='gl-pvp-battle-transport-v1'/);
  assert.match(f('public/pvp/pvp-host.js'),/new WebSocket\(wsUrl\(\)\)/);
  assert.match(f('server.js'),/origin==='https:\/\/grandislegacytcg.web.id'/);
});
check('Official Site hrefs in S1 PvP Lobby and logo',()=>{
  const s=f('public/pvp/pvp-host.js');
  assert.match(s,/GO TO VS AI<\/a>/);assert.match(s,/GO TO DECK BUILDER<\/a>/);
  assert.match(s,/https:\/\/grandislegacytcg.web.id\/deck-builder\//);
  assert.match(s,/https:\/\/grandislegacytcg.web.id\//);
  assert.doesNotMatch(s,/grandislegacytcg\.github\.io/);
  assert.match(f('public/config.js'),/homeUrl:'https:\/\/grandislegacytcg.web.id\//);
});
check('Responsive keyboard accessible Lobby navigation',()=>{
  const s=f('public/pvp/pvp-lobby-opt-rc34.css');
  assert.match(s,/pvp-v260-app-link:focus-visible/);
  assert.match(s,/@media\(max-width:560px\)/);
  assert.match(s,/pvp-v260-app-links/);
});
check('RC40 Deck Builder 1.66 registry has 242 cards',()=>{
  const registry={}; const sandbox={window:registry};
  vm.runInNewContext(f('public/battle/assets/review-db158/js/db166-view-model.js'),sandbox);
  const cards=registry.GL_DB166_REVIEW_CARDS;
  assert.equal(Object.keys(cards).length,242);
  assert.equal(cards['S0-ARC-001']?.name,'Bow Bash');
  assert.match(cards['S0-ARC-001'].image,/card-art\/S0-ARC-001\.webp/);
});
check('Card Review uses DB166 in both Lobby and Battlefield with correct relative iframe base',()=>{
  for(const [target,page,expectBase] of [
    ['public/pvp/db158-card-review.js','https://grandislegacytcg.web.id/pvp/','https://grandislegacytcg.web.id/pvp/battle/'],
    ['public/battle/shared-app/db158-card-review.js','https://grandislegacytcg.web.id/pvp/battle/','https://grandislegacytcg.web.id/pvp/battle/']]){
    const registry={};vm.runInNewContext(f('public/battle/assets/review-db158/js/db166-view-model.js'),{window:registry});
    const document={baseURI:page,readyState:'loading',addEventListener(){}};
    const window={GL_DB166_REVIEW_CARDS:registry.GL_DB166_REVIEW_CARDS,location:new URL(page),document,navigator:{connection:{saveData:true}}};
    vm.runInNewContext(f(target),{window,document,URL,setTimeout(){},console});
    const c=window.GL_DB158_REVIEW.getCard('S0-ARC-001');assert.equal(c.name,'Bow Bash');
    const html=window.GL_DB158_REVIEW.documentHtml(c);
    assert.ok(html.includes(`<base href="${expectBase}">`),`Wrong iframe base in ${target}`);
    assert.match(html,/review-renderer-v158\.js/);
    assert.match(html,/s0-review-clarity\.js/);
  }
});
check('Local artwork stays present and no cross-domain art URLs',()=>{
  const dir=path.join(cwd,'public/battle/card-art');
  assert.equal(readdirSync(dir).filter(x=>x.endsWith('.webp')).length,248);
  assert.doesNotMatch(f('public/config.js'),/raw\.githubusercontent|github\.io\/card-art/);
});
check('No gameplay authority replacement from VS AI donor',()=>{
  assert.match(f('public/battle/runtime/pvp-network.js'),/const EMBEDDED=/);
  assert.match(f('public/pvp/pvp-host.js'),/function connect/);
  assert.match(f('public/battle/shared-app/app-runtime.js'),/Card Played/);
});
if(process.exitCode)process.exit(1);console.log(`RC40 PATCH3 ${checks.length}/${checks.length} PASS`);
