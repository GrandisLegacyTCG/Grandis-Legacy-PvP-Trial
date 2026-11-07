(()=>{
'use strict';
/*
  Inactive PvP integration slot.

  The shared app runtime does not contain a PvP fork. A future multiplayer host
  should create an adapter that exposes the same engine()/bridge() surface used
  by the Local AI adapter, then activate it through GL_AUTHORITY_ADAPTER.use().

  Required host contract:
    source.engine  -> presentation-facing authoritative game facade
    source.bridge  -> transport/snapshot bridge facade

  The host facade should implement the normalized methods used by app-runtime.js
  (for example getSnapshot(), intent(), prepareLocalMatch(), commitOpeningSetup(),
  beginFirstTurn()) while preserving server authority and viewer-safe state.
*/
window.GL_CREATE_PVP_AUTHORITY_ADAPTER=function(source){
  source=source||{};
  return {
    mode:'PVP',
    engine:()=>source.engine||null,
    bridge:()=>source.bridge||null
  };
};
})();
