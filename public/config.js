/* Grandis Legacy PvP v3.70 — static GitHub Pages config.
   The Node server serves its own /config.js dynamically for same-origin deployments. */
(function(){
  'use strict';
  window.GL_APP_MODE='PVP';
  window.GL_PVP_CLIENT_MODE=true;
  window.GL_PVP_SHARED_BOARD_ACTIVE=true;
  window.GL_CONFIG={
    version:'Grandis Legacy PvP v3.70',
    buildId:'gl-pvp-3.70-v680-fresh-r3-northflank-mobile-2026-10-02',
    mode:'server-authoritative-human-vs-human',
    singleRoom:true,
    roomId:'GRANDIS_PVP',
    roomName:'Grandis PvP',
    wsPath:'/ws',
    // Same-origin WebSocket only. Northflank serves /ws from this exact deployment.
    wsBase:'',
    maxPlayers:2,
    maxSpectators:0,
    spectatorView:null,
    teachingViewAvailable:false
  };
  window.GL_PVP_CONFIG=window.GL_CONFIG;
})();
