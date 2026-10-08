'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function need(ok,msg){if(!ok)throw new Error(msg)}
const server=read('server.js'),css=read('public/css/app.css'),html=read('public/index.html'),app=read('public/js/app.bundle.js'),data=JSON.parse(read('data/season1/cards.runtime.v0.15.0.json')),effects=JSON.parse(read('data/season1/effect-recipes.runtime.v0.14.0.json'));
need(data.schema_version==='1.5.0'&&effects.schema_version==='1.5.0','Active runtime schemas must be 1.5.0');
need(server.includes("cards.schema_version !== '1.5.0'")&&server.includes("effects.schema_version !== '1.5.0'"),'Northflank startup schema guard is stale');
need(server.includes('Grandis Legacy PvP v3.42')&&app.includes('Grandis Legacy PvP v3.42'),'PvP v3.29 version lock missing');
need(html.includes('gl-pvp-3.42-responsive-ui')&&!html.includes('gl-pvp-3.08'),'PvP cache revision missing');
need(!html.includes('desktop-scale.js'),'Whole-app desktop scale script must not load');
need(css.includes('Grandis Legacy PvP v2.6.11 — VS AI desktop scale restore + mobile Hand lock'),'Standard desktop battlefield baseline missing');
need(app.includes('GL_BATTLE_FEEDBACK_QUEUE')&&app.includes('glPvpImportBattleFeedback'),'Client-side authoritative battle feedback import missing');
need(app.includes('gl-casting-pair-highlight')&&app.includes('applyCastingPairHighlights'),'Casting pair highlights missing');
need(server.includes('setImmediate(sendSpectators)')&&server.includes("priorityClient.role === 'player'"),'Player-first broadcast latency guard missing');
need(server.includes("client.role !== 'player'")&&server.includes('Spectators cannot reset the room.'),'Spectator reset authority must be blocked server-side');
console.log('PASS PvP v3.29 startup-health/standard-UI/battle-feedback hotfix');
