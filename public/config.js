/* Grandis Legacy PvP v3.76.1 — static frontend config.
   PvP v3.51 remains authoritative; VS AI v6.90.7 supplies presentation only. */
(function(){
  'use strict';
  window.GL_APP_MODE='PVP';
  window.GL_CONFIG={
    version:'Grandis Legacy PvP v3.76.1',
    buildId:'gl-pvp-3.76.1-v351-authority-v6907-ui-2026-10-09',
    mode:'server-authoritative-human-vs-human',
    wsPath:'/ws',
    connectionTimeoutMs:10000,
    publicFrontendUrl:'https://grandislegacytcg.github.io/pvp/',
    homeUrl:'https://grandislegacytcg.github.io/',
    room1WsBase:'wss://p01--grandis-legacy-pvp--2kwws8nzlcc2.code.run',
    deckBuilderUrl:'https://grandislegacytcg.github.io/Grandis-Legacy-Deck-Builder/style-1/',
    mobileDeckBuilderUrl:'https://grandislegacytcg.github.io/Grandis-Legacy-Deck-Builder/style-2/',
    aiLobbyUrl:'https://grandislegacytcg.github.io/Grandis-Legacy-VS-AI/',
    maxPlayers:2,
    maxSpectators:4,
    spectatorView:'CARD_BACKS'
  };
  window.GL_PVP_CONFIG=window.GL_CONFIG;
})();
