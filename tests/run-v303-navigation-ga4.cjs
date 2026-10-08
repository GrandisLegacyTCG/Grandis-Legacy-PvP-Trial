
'use strict';
const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('public/index.html','utf8');
const net=fs.readFileSync('public/js/pvp-network.js','utf8');
const cfg=fs.readFileSync('public/config.js','utf8');
assert.ok(html.includes('G-6JD5Q48SXN')&&html.includes('googletagmanager.com/gtag/js'),'PvP GA4 tag missing');
assert.ok(net.includes('https://grandislegacytcg.github.io/Grandis-Legacy-Deck-Builder/style-1/')&&cfg.includes('https://grandislegacytcg.github.io/Grandis-Legacy-Deck-Builder/style-1/'),'PvP Deck Builder must open Style 1');
console.log('PASS PvP v3.29 GA4 and Deck Builder Style 1 navigation');
