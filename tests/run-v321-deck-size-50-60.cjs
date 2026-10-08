const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function must(ok,msg){if(!ok)throw new Error(msg)}
const app=fs.readFileSync(path.join(root,'public/js/app.bundle.js'),'utf8');
const net=fs.readFileSync(path.join(root,'public/js/pvp-network.js'),'utf8');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
must(app.includes("if([50,60].indexOf(mainIds.length)===-1) errors.push('Deck validation failed: main_deck must contain exactly 50 or 60 cards"),'Runtime 50/60 validator missing');
must(app.includes("normal card max 3 copies"),'Runtime normal max-3 validator missing');
must(net.includes("if([50,60].indexOf(mainCount)===-1)throw new Error('Main Deck must contain exactly 50 or 60 cards.')"),'Lobby 50/60 validator missing');
must(server.includes('if (![50, 60].includes(mainCount)) throw new Error(`Custom Main Deck must contain exactly 50 or 60 cards'),'Server 50/60 validator missing');
must(server.includes('Normal card maximum is 3 copies'),'Server normal max-3 validator missing');
must(pkg.version==='3.0.42','PvP package version mismatch');
console.log('PASS v3.21: custom deck is accepted only at 50/60 cards; normal max 3; Ultimate max 1.');
