/* Grandis Legacy PvP v3.70 — static GitHub Pages config.
   The Node server serves its own /config.js dynamically for same-origin deployments. */
(function(){
  'use strict';
  window.GL_APP_MODE='PVP';
  window.GL_PVP_CLIENT_MODE=true;
  window.GL_PVP_SHARED_BOARD_ACTIVE=true;
  window.GL_CONFIG={
    version:'Grandis Legacy PvP v3.70',
    buildId:'gl-pvp-3.70-v680-fresh-r2-2026-10-02',
    mode:'server-authoritative-human-vs-human',
    singleRoom:true,
    roomId:'GRANDIS_PVP',
    roomName:'Grandis PvP',
    wsPath:'/ws',
    /* Reuse the former Room 1 service slot for the single v3.70 room after that backend is redeployed. */
    wsBase:'wss://p01--grandis-legacy-pvp--2kwws8nzlcc2.code.run',
    maxPlayers:2,
    maxSpectators:0,
    spectatorView:null,
    teachingViewAvailable:false
  };
  window.GL_PVP_CONFIG=window.GL_CONFIG;
})();
