/* Grandis Legacy PvP v3.72 — static fallback config.
   The Node server serves its own /config.js dynamically for same-origin deployments. */
(function(){
  'use strict';
  window.GL_APP_MODE='PVP';
  window.GL_PVP_CLIENT_MODE=true;
  window.GL_PVP_SHARED_BOARD_ACTIVE=true;
  window.GL_CONFIG={
    version:'Grandis Legacy PvP v3.73.8',
    buildId:'gl-pvp-3.72-v351-net-v6907-battlefield-2026-10-04',
    mode:'server-authoritative-human-vs-human',
    singleRoom:true,
    roomId:'GRANDIS_PVP',
    roomName:'Grandis PvP',
    wsPath:'/ws',
    // Same-origin WebSocket only. Northflank serves /ws from this exact deployment.
    wsBase:'',
    maxPlayers:2,
    maxSpectators:4,
    spectatorView:'CARD_BACKS',
    teachingViewAvailable:false
  };
  window.GL_PVP_CONFIG=window.GL_CONFIG;
})();
