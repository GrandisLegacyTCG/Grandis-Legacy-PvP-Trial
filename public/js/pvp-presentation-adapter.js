(function(){
  'use strict';
  // v3.75.7 presentation boundary. This file translates viewer-safe PvP v3.51 server boards
  // into the latest VS AI presentation contract. It owns compatibility aliases and seat orientation
  // only; gameplay authority, payment rules, hidden information, and network protocol stay in PvP v3.51.
  var stack=window.GL_SOURCE_STACK||{};
  if(!stack.shared_runtime && stack.runtime_foundation) stack.shared_runtime=stack.runtime_foundation;
  if(window.GRANDIS_LEGACY_RUNTIME_DATA && !window.GL_CARD_DEFINITIONS){
    window.GL_CARD_DEFINITIONS=window.GRANDIS_LEGACY_RUNTIME_DATA;
  }
  if(window.GL_CARD_DEFINITIONS && !window.GL_CARD_DEFINITIONS.families && Array.isArray(window.GL_CARD_DEFINITIONS.cards)){
    window.GL_CARD_DEFINITIONS.families={ALL:{cards:window.GL_CARD_DEFINITIONS.cards}};
  }
  if(window.GL_CARD_DEFINITIONS && !window.GL_CARD_DEFINITIONS.version){
    window.GL_CARD_DEFINITIONS.version='v'+String(window.GL_CARD_DEFINITIONS.schema_version||'0.16.2').replace(/^v/,'');
  }
  if(window.GL_EFFECT_RECIPES && !window.GL_EFFECT_RECIPES.version){
    window.GL_EFFECT_RECIPES.version='v'+String(window.GL_EFFECT_RECIPES.schema_version||'0.15.2').replace(/^v/,'');
  }
  if(!window.GL_ACTIVE_STARTER_DECKS && window.GL_PVP_STARTER_DECK_OPTIONS){
    window.GL_ACTIVE_STARTER_DECKS=window.GL_PVP_STARTER_DECK_OPTIONS;
  }

  function bridge(){ return window.GL_LOCAL_AI_BRIDGE||null; }
  function normalizeSeat(seat){ return Number(seat)===2?2:1; }
  function isViewerSafeSnapshot(snapshot){
    return !!(snapshot && snapshot.pvpPrivateStateMasked===true && snapshot.appState && typeof snapshot.appState==='object');
  }
  function importViewerSafeSnapshot(snapshot,seat,options){
    var b=bridge();
    if(!b || typeof b.importCanonicalSnapshot!=='function') throw new Error('Shared Candidate 15 presentation bridge is unavailable.');
    if(!isViewerSafeSnapshot(snapshot)) throw new Error('Refusing non viewer-safe PvP snapshot at presentation boundary.');
    return b.importCanonicalSnapshot(snapshot,normalizeSeat(seat),options||{});
  }
  function setSharedBoardMode(active){
    var b=bridge();
    if(!b || typeof b.setSharedBoardMode!=='function') return false;
    b.setSharedBoardMode(!!active);
    return true;
  }

  window.GL_PVP_PRESENTATION_ADAPTER={
    version:'PvP v3.43 Candidate 2R-A',
    visualAuthority:'VS AI v6.42 Candidate 15',
    sourceContract:'viewer-safe server board -> seat orientation -> shared Candidate 15 presentation',
    isViewerSafeSnapshot:isViewerSafeSnapshot,
    importViewerSafeSnapshot:importViewerSafeSnapshot,
    setSharedBoardMode:setSharedBoardMode
  };
})();
