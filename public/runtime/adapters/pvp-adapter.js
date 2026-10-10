(()=>{
'use strict';
const hub=window.GL_AUTHORITY_ADAPTER;if(!hub)throw new Error('authority-adapter.js must load before pvp-adapter.js');
const host=()=>window.GL_PVP_HOST||null, base=()=>window.GL_GAME_ENGINE||null, bridge=()=>window.GL_LOCAL_AI_BRIDGE||null;
const readOnlyMethods=['cardView','getCardPlayedDetail','getHandModel','getHeroActions','getRepositionPairs','getManaPlan','getResponseModel','getStatusLabel','getStatusDetail','getSoundEnabled','setSoundEnabled','toggleSound','playCardMotionSound','flushBattleFeedback','setExternalHumanUi','getExternalHumanUi'];
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
};
for(const name of readOnlyMethods)engine[name]=(...args)=>base()?.[name]?.(...args);
const bridgeFacade={getSnapshot:()=>bridge()?.getSnapshot?.(),setRenderSuppressed:v=>bridge()?.setRenderSuppressed?.(v),setExternalHumanUi:v=>bridge()?.setExternalHumanUi?.(v),playOpeningCoinSound:()=>bridge()?.playOpeningCoinSound?.()};
const adapter={mode:'PVP',engine:()=>engine,bridge:()=>bridgeFacade};
hub.register('pvp',adapter);hub.use('pvp');window.GL_CREATE_PVP_AUTHORITY_ADAPTER=()=>adapter;
})();
