import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/pvp/db158-card-review.js',import.meta.url),'utf8');
const host=readFileSync(new URL('../public/pvp/pvp-host.js',import.meta.url),'utf8');
const card=(id,name)=>({card_id:id,name,family:'Hero',identity:{rank:'I'},printed:{rows:[]},hp:60});
function element(tag){
 const node={tagName:tag.toUpperCase(),children:[],style:{},dataset:{},attributes:new Map(),isConnected:false,
    listeners:{},setAttribute(key,value){this.attributes.set(key,value)},
    addEventListener(key,fn){this.listeners[key]=fn},
    appendChild(child){this.children.push(child);child.isConnected=true;return child},
    querySelector(sel){if(sel==='.gl-db158-review-frame')return this.children.find(x=>x.className==='gl-db158-review-frame')||null;return null}}
 if(tag==='iframe'){node.posted=[];node.contentWindow={postMessage:(payload,origin)=>node.posted.push({payload,origin})};}
 return node;
}
const win={GL_CARD_DEFINITIONS:{cards:[card('S0-WAR-H001','Warrior Alpha'),card('S0-WAR-H002','Warrior Beta')]},
 document:{baseURI:'https://game.example/',createElement:element},location:{origin:'https://game.example'}};
vm.runInNewContext(source,{window:win,URL,console});
const body=element('div'),review=win.GL_DB158_REVIEW;
assert.equal(review.mount(body,'S0-WAR-H001',['S0-WAR-H001','S0-WAR-H002']),true);
assert.equal(body.children.length,1);
const frame=body.children[0];
assert.ok(frame.srcdoc?.includes('Warrior Alpha'));
frame.listeners.load();assert.equal(frame.posted.length,1);
assert.equal(review.mount(body,'S0-WAR-H002',['S0-WAR-H001','S0-WAR-H002']),true);
assert.equal(body.children.length,1,'Review iframe must not be recreated');
assert.equal(frame.posted.length,2,'New card update should use postMessage');
assert.equal(frame.posted[1].payload.card.name,'Warrior Beta');
assert.equal(frame.posted[1].origin,'https://game.example');
assert.equal(review.mount(body,'S0-WAR-H002',['S0-WAR-H001','S0-WAR-H002']),true);
assert.equal(frame.posted.length,2,'Same card should not be re-rendered unnecessarily');
assert.match(host,/if\(lobbyLastDeckVisualKey!==deckKey\)/,'Deck render has change guard');
assert.match(host,/if\(lobbyLastDeckPickerKey!==pickerKey\)/,'Picker rebuild has change guard');
assert.match(host,/if\(lobbyReviewOverlay\)lobbyReviewOverlay\.classList\.remove\('open'\)/,'Close keeps the review frame');
assert.match(host,/link\.href=href\+'\?v='\+encodeURIComponent\(BUILD_ID\)/,'Battlefield prefetch version matches loaded scripts');
console.log('PASS RC38 lobby batch 1: retained card-review iframe, in-place card switch, memoized deck view, prefetch parity');
