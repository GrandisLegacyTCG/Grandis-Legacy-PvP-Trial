(()=>{
'use strict';
const hub=window.GL_AUTHORITY_ADAPTER;
if(!hub)throw new Error('authority-adapter.js must load before local-ai-adapter.js');
function engine(){return window.GL_GAME_ENGINE||null;}
function bridge(){return window.GL_LOCAL_AI_BRIDGE||null;}
hub.register('local-ai',{mode:'LOCAL_AI',engine,bridge});
hub.use('local-ai');
})();
