/* Grandis Legacy PvP v3.75.1 — static fallback config.
   The Node server serves its own /config.js dynamically for same-origin deployments. */
(function(){
  'use strict';
  window.GL_APP_MODE='PVP';
  window.GL_PVP_CLIENT_MODE=true;
  window.GL_PVP_SHARED_BOARD_ACTIVE=true;
  window.GL_CONFIG={
    version:'Grandis Legacy PvP v3.75.1',
    buildId:'gl-pvp-3.75.1-v351-network-v6907-ui-2026-10-08',
    mode:'server-authoritative-human-vs-human',
    singleRoom:true,
    roomId:'GRANDIS_PVP',
    roomName:'Grandis PvP',
    wsPath:'/ws',
    wsBase:'',
    maxPlayers:2,
    maxSpectators:4,
    spectatorView:'CARD_BACKS',
    teachingViewAvailable:false
  };
  window.GL_PVP_CONFIG=window.GL_CONFIG;
})();
