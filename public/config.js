/* Grandis Legacy PvP v3.51 Final — static GitHub Pages frontend config.
   The Website /pvp/ frontend connects to the two remote Northflank-compatible WebSocket room services. */
(function(){
  'use strict';
  window.GL_APP_MODE='PVP';
  window.GL_CONFIG={
    version:'Grandis Legacy PvP v3.51 — Same-Version Minor Correction' ,
    buildId:'gl-pvp-3.51-minor-correction-r2-2026-09-28',
    mode:'server-authoritative-human-vs-human',
    wsPath:'/ws',
    connectionTimeoutMs:10000,
    publicFrontendUrl:'https://grandislegacytcg.github.io/pvp/',
    homeUrl:'https://grandislegacytcg.github.io/',
    room1WsBase:'wss://p01--grandis-legacy-pvp--2kwws8nzlcc2.code.run',
    room2WsBase:'wss://p01--grandis-legacy-pvp-room2--2kwws8nzlcc2.code.run',
    deckBuilderUrl:'https://grandislegacytcg.github.io/Grandis-Legacy-Deck-Builder/style-1/',
    mobileDeckBuilderUrl:'https://grandislegacytcg.github.io/Grandis-Legacy-Deck-Builder/style-2/',
    aiLobbyUrl:'https://grandislegacytcg.github.io/Grandis-Legacy-VS-AI/',
    maxPlayers:2,
    maxSpectators:4,
    spectatorView:'CARD_BACKS'
  };
  window.GL_PVP_CONFIG=window.GL_CONFIG;
})();
