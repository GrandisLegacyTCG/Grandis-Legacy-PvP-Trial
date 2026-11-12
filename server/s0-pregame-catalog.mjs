/** Season 0 RC32 approved starter catalog, separate from the S1 UI shell. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
const file = join(import.meta.dirname,'../public/battle/engine/shared-app/active-starters.js');
const context={};context.window=context;
vm.runInNewContext(readFileSync(file,'utf8'),context,{filename:file,timeout:10000});
const meta=context.GL_ACTIVE_STARTER_SET_META;
const catalog=structuredClone(context.GL_ACTIVE_STARTER_DECKS||{});
if(meta?.schema_version!=='GL-ACTIVE-STARTERS-S0-R3.6-RULEBOOK-V3.2'||Object.keys(catalog).length!==5||
   !Object.entries(catalog).every(([k,v])=>k.startsWith('s0_starter_')&&v?.deck?.main_deck_count===50&&v?.deck?.legacy_deck_expanded?.length===12)){
  throw new Error('S0 RC32 starter catalog integrity/format rejected.');
}
export const season0StarterCatalog=Object.freeze(catalog);
