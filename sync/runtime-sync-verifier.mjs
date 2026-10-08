import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const here=dirname(fileURLToPath(import.meta.url));
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
export function verifyRuntimeSyncOrThrow(baseDir){
  const lockPath=join(baseDir,'sync/runtime-sync-lock.v2.63.json');
  if(!existsSync(lockPath))throw new Error('Runtime sync lock v2.63 missing.');
  const lock=JSON.parse(readFileSync(lockPath,'utf8')),errors=[];
  if(lock.version!=='v2.63'||lock.policy!=='RUNTIME_FIRST_FAIL_CLOSED_SYNC')errors.push('lock-version');
  for(const item of lock.runtimeFiles||[]){const file=join(baseDir,item.path);if(!existsSync(file))errors.push(item.path+':missing');else if(sha(file)!==item.sha256)errors.push(item.path+':hash');}
  const pkg=JSON.parse(readFileSync(join(baseDir,'package.json'),'utf8')),stack=pkg.grandisLegacySourceStack||{};
  const expected={sourceAuthorityStackBundle:'1.9.5',oneSourceAuthority:'1.9.5',canonicalCardAuthority:'1.6.0',runtimeData:'0.16.2',effectCheckpoint:'0.15.2',effectRecipe:'0.15.2',heroComponentAuthority:'1.1.0',runtimeFoundation:'1.94.2',uiLock:'2.53',starter60:'1.6.1',applicationRuntimeSync:'2.63',activeStarterCount:5};
  for(const [k,v] of Object.entries(expected))if(String(stack[k])!==String(v))errors.push('sourceStack.'+k);
  if(stack.canonicalRegistryHash!=='7ac1f90f6a9654cf575ac41db64a052901005905b1cf01f3bfc7532873cc9389')errors.push('canonical-hash');
  if(stack.heroComponentRegistryHash!=='f36f1cc83eb9845743176c3af71f7823125353eae73e832588e9d8b42c6818be')errors.push('hero-component-hash');
  const cards=JSON.parse(readFileSync(join(baseDir,'data/season1/cards.runtime.v0.16.2.json'),'utf8'));
  const hero=JSON.parse(readFileSync(join(baseDir,'data/season1/hero-components.runtime.v1.1.0.json'),'utf8'));
  const effects=JSON.parse(readFileSync(join(baseDir,'data/season1/effect-recipes.runtime.v0.15.2.json'),'utf8'));
  if(cards.schema_version!=='0.16.2'||cards.cards?.length!==200||cards.canonical_registry_hash!==stack.canonicalRegistryHash)errors.push('runtime-data');
  if(hero.schema_version!=='1.1.0'||hero.registry_hash!==stack.heroComponentRegistryHash)errors.push('hero-components');
  if(effects.schema_version!=='0.15.2'||effects.effect_recipes?.length!==200)errors.push('effect-recipes');
  const manifest=JSON.parse(readFileSync(join(baseDir,'data/starter-decks/ACTIVE_STARTERS_v1.6.1.json'),'utf8'));
  if(manifest.authority_version!=='v1.6.1'||manifest.active_starter_count!==5)errors.push('starter-manifest');
  const expectedIds=['starter_01_elemental_lord_conqueror_renegade','starter_02_saint_crusader_grand_ranger','starter_03_arcane_duelist_elemental_lord_saint','starter_04_grand_ranger_grand_arbalest_renegade','starter_05_renegade_arcane_duelist_elemental_lord'];
  if(JSON.stringify(manifest.starters.map(x=>x.starter_id))!==JSON.stringify(expectedIds))errors.push('starter-ids');
  const sandbox={window:{},globalThis:{}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);vm.runInContext(readFileSync(join(baseDir,'public/js/static-data.js'),'utf8'),sandbox);
  const w=sandbox.window;
  if(w.GL_SOURCE_STACK?.source_authority_stack_bundle!=='v1.9.5'||w.GL_SOURCE_STACK?.starter60!=='v1.6.1')errors.push('browser-source-stack');
  if(Object.keys(w.GL_PVP_STARTER_DECK_OPTIONS||{}).length!==5)errors.push('browser-starters');
  if(Object.keys(w.GL_ASSET_MANIFEST?.cards||{}).length!==200||w.GL_ASSET_MANIFEST?.counts?.cards_with_local_thumb!==0)errors.push('asset-manifest');
  for(const id of expectedIds){const d=w.GL_PVP_STARTER_DECK_OPTIONS?.[id]?.deck;if(!d)errors.push('starter:'+id);else if((d.main_deck||[]).reduce((n,e)=>n+Number(e.quantity||0),0)!==60||d.legacy_deck_expanded?.length!==12)errors.push('starter-total:'+id);}
  if(errors.length)throw new Error('Runtime sync startup gate failed: '+errors.join(', '));
  return {ok:true,version:lock.version,policy:lock.policy,authorityVerified:true,heroComponentsVerified:true,verifiedFiles:(lock.runtimeFiles||[]).length,activeStarterCount:5,canonicalCardCount:200};
}
if(process.argv.includes('--self-test'))console.log(JSON.stringify(verifyRuntimeSyncOrThrow(join(here,'..')),null,2));
