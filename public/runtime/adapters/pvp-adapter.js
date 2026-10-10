(()=>{
'use strict';
const hub=window.GL_AUTHORITY_ADAPTER;if(!hub)throw new Error('authority-adapter.js must load before pvp-adapter.js');
const host=()=>window.GL_PVP_HOST||null, base=()=>window.GL_GAME_ENGINE||null, bridge=()=>window.GL_LOCAL_AI_BRIDGE||null;
const readOnlyMethods=['cardView','getCardPlayedDetail','getHandModel','getHeroActions','getRepositionPairs','getManaPlan','getResponseModel','getStatusLabel','getStatusDetail','getSoundEnabled','setSoundEnabled','toggleSound','playCardMotionSound','setExternalHumanUi','getExternalHumanUi'];
const audioCache=new Map(),activeAudio=new Set();
function soundEnabled(){try{return base()?.getSoundEnabled?.()!==false}catch{return true}}
function primeAudio(src){if(!src||typeof Audio==='undefined')return null;if(audioCache.has(src))return audioCache.get(src);try{const a=new Audio(src);a.preload='auto';if(typeof a.load==='function')a.load();audioCache.set(src,a);return a}catch{return null}}
function playPresentationAudio(src,volume=.55){
  if(!src||!soundEnabled()||typeof Audio==='undefined')return false;
  try{const seed=primeAudio(src),a=seed&&typeof seed.cloneNode==='function'?seed.cloneNode(true):new Audio(src);a.preload='auto';a.volume=Math.max(0,Math.min(1,Number(volume)||.55));a.currentTime=0;const release=()=>{activeAudio.delete(a);try{a.removeEventListener?.('ended',release);a.removeEventListener?.('error',release)}catch{}};activeAudio.add(a);a.addEventListener?.('ended',release,{once:true});a.addEventListener?.('error',release,{once:true});const p=a.play();if(p&&typeof p.catch==='function')p.catch(release);return true}catch{return false}
}
// Battle-feedback audio is presentation transport owned by the external v6 battlefield.
// Normal card-motion and Coin Flip SFX stay delegated to the exact v6.91.3 donor sound helpers.
// Do not duplicate donor media: canonical files stay under engine/assets/.
const engine={
  getSnapshot(){return bridge()?.getSnapshot?.()||host()?.getSnapshot?.()?.match?.serverBoard||null},
  intent(name,args){if(name==='executeConfirmedSurrender')return host()?.surrender?.()||{ok:false,error:'PvP host unavailable.'};return host()?.sendIntent?.(name,args||[])||{ok:false,error:'PvP host unavailable.'}},
  prepareLocalMatch(){return {ok:!!host()?.startMatch?.(),pending:true}},
  requestCoinFlip(choice){return host()?.chooseCoin?.(choice)},
  commitOpeningSetup(){return host()?.confirmCoin?.()},
  getStartedOpeningSetup(){return host()?.getStartedOpening?.()},
  beginFirstTurn(){return host()?.beginFirstTurn?.()||{ok:true}},
  getIdentity(){return host()?.identity?.()||{}},
  getMatchClock(){return host()?.matchClock?.()||{active:false,elapsedMs:0}},
  playPresentationAudio,
};
for(const name of readOnlyMethods)engine[name]=(...args)=>base()?.[name]?.(...args);
const bridgeFacade={getSnapshot:()=>bridge()?.getSnapshot?.(),setRenderSuppressed:v=>bridge()?.setRenderSuppressed?.(v),setExternalHumanUi:v=>bridge()?.setExternalHumanUi?.(v),playOpeningCoinSound:()=>bridge()?.playOpeningCoinSound?.()};
const adapter={mode:'PVP',engine:()=>engine,bridge:()=>bridgeFacade};
hub.register('pvp',adapter);hub.use('pvp');window.GL_CREATE_PVP_AUTHORITY_ADAPTER=()=>adapter;
})();
