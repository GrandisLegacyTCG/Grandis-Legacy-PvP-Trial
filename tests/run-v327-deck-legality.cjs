const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');function must(x,m){if(!x)throw new Error(m)}
const app=fs.readFileSync(path.join(root,'public/js/app.bundle.js'),'utf8');
const net=fs.readFileSync(path.join(root,'public/js/pvp-network.js'),'utf8');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const pkg=require(path.join(root,'package.json'));
must(app.includes("if(mainIds.length!==60) errors.push('Deck validation failed: main_deck must contain exactly 60 cards"),'PvP runtime exact-60 validator missing');
must(app.includes('normal card max 3 copies'),'PvP runtime max-3 missing');
must(app.includes('Ultimate card max 1 per name'),'PvP runtime Ultimate max-1 missing');
must(net.includes("if(mainCount!==60)throw new Error('Main Deck must contain exactly 60 cards.')"),'PvP lobby exact-60 validator missing');
must(net.includes('window.GRANDIS_LEGACY_RUNTIME_DATA')&&net.includes("var isUltimate=!!(c&&c.is_ultimate===true)")&&net.includes("var limit=isUltimate?1:3"),'PvP lobby copy-limit validator missing or not tied to canonical runtime data');
must(server.includes('if (mainCount !== 60) throw new Error(`Custom Main Deck must contain exactly 60 cards'),'PvP server exact-60 validator missing');
must(server.includes('Normal card maximum is 3 copies')&&server.includes('Ultimate card maximum is 1 copy'),'PvP server copy-limit validation missing');
must(pkg.version==='3.0.42','PvP package version mismatch');
console.log('PASS v3.29: PvP custom deck requires exactly 60 cards, normal max 3, Ultimate max 1 across lobby/runtime/server.');
