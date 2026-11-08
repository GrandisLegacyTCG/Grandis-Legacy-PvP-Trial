// Optional, reproducible build step. Only static textual assets are compressed;
// game engine and game/card data are never rewritten or minified.
import {readdir,readFile,writeFile,stat} from 'node:fs/promises';
import {join,extname} from 'node:path';
import {brotliCompressSync,gzipSync,constants} from 'node:zlib';
const root=new URL('../public/',import.meta.url);
const allowed=new Set(['.js','.mjs','.css','.json','.html','.svg']);
let count=0,originalBytes=0,brBytes=0;
async function crawl(path){
  for(const entry of await readdir(path,{withFileTypes:true})){
    const file=join(path,entry.name);
    if(entry.isDirectory()){await crawl(file);continue;}
    if(!entry.isFile()||!allowed.has(extname(entry.name).toLowerCase()))continue;
    const info=await stat(file);if(info.size<1024)continue;
    const original=await readFile(file);
    const br=brotliCompressSync(original,{params:{[constants.BROTLI_PARAM_QUALITY]:6}});
    const gz=gzipSync(original,{level:6});
    if(br.length<original.length){await writeFile(file+'.br',br);count++;originalBytes+=original.length;brBytes+=br.length;}
    if(gz.length<original.length)await writeFile(file+'.gz',gz);
  }
}
await crawl(new URL('.',root).pathname);
console.log(JSON.stringify({compressedAssets:count,originalMiB:Math.round(originalBytes/1048576*100)/100,brotliMiB:Math.round(brBytes/1048576*100)/100,brotliSavingsPct:Math.round((1-brBytes/originalBytes)*1000)/10},null,2));
