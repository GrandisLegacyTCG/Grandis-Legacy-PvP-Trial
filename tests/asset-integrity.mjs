import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
const root=resolve(process.cwd(),'public');
const docPaths=['index.html','battle/index.html'];
const missing=[];let count=0;
for(const doc of docPaths){
 const html=readFileSync(join(root,doc),'utf8');
 for(const m of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)){
  const ref=m[1].split(/[?#]/)[0];
  if(!ref||/^(?:https?:|data:|blob:|\/\/)/i.test(ref)||ref==='/build-meta.js'||ref==='build-meta.js')continue;
  const target=ref.startsWith('/')?resolve(root,'.'+ref):resolve(root,dirname(doc),ref);
  if(!target.startsWith(root+'/')&&!target.startsWith(root+'\\'))throw new Error('Asset escapes public root: '+ref);
  if(!existsSync(target))missing.push(`${doc}: ${ref}`);else count++;
 }
}
assert.deepEqual(missing,[],'A production script or stylesheet is missing');
const artwork=readdirSync(join(root,'battle/card-art')).filter(x=>/^S0-.*\.webp$/.test(x));
assert.ok(artwork.length>=240,'Some Season 0 card artwork is missing');
for(const p of [
 'assets/lobby/grandis-legacy-logo.webp','engine/assets/lobby/Swap.png',
 'battle/engine/assets/audio/Card Sound.mp3','battle/engine/assets/audio/battle/P.Atk.mp3',
 'battle/engine/assets/audio/battle/M.Atk.mp3','battle/assets/ui/back-shard.webp',
 ...['Racial Beastman Button.png','Racial Dragonborn Button.png','Racial Dwarf Button.png',
 'Racial Elf Button.png','Racial Halfling Button.png','Racial Human Button.png',
 'Racial Legacy Button.png','Support Button.png'].map(n=>'battle/assets/ui/hero-actions/'+n)
])assert.ok(existsSync(join(root,p)),'Essential artwork/audio missing: '+p);
console.log('PASS required root + battlefield scripts/styles ('+count+') and S0 card art ('+artwork.length+')');
