(()=>{
'use strict';
const registry=new Map();
let activeName='';
function validAdapter(adapter){return !!adapter&&typeof adapter.engine==='function'&&typeof adapter.bridge==='function';}
function register(name,adapter){
  name=String(name||'').trim();
  if(!name)throw new Error('Authority adapter name is required.');
  if(!validAdapter(adapter))throw new Error('Authority adapter must expose engine() and bridge().');
  registry.set(name,adapter);
  return adapter;
}
function use(name){
  if(!registry.has(name))throw new Error('Unknown authority adapter: '+name);
  activeName=name;
  return registry.get(name);
}
function getActive(){return activeName?registry.get(activeName)||null:null;}
function get(name){return registry.get(name)||null;}
window.GL_AUTHORITY_ADAPTER={register,use,get,getActive,activeName:()=>activeName};
})();
