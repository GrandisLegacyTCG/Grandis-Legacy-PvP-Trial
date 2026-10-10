const fs=require('fs');const crypto=require('crypto');const assert=require('assert');
const read=p=>fs.readFileSync(p,'utf8'); const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const net=read('public/js/pvp-network.js'), rt=read('public/option-b-runtime.js'), idx=read('public/index.html'), pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'3.77.1');
// Locked v6.90.9 visible geometry / core renderer files remain exact donors.
assert.equal(sha('public/option-b-integration.css'),'2d47b0f27887575aa12f6a579ababb260d9708e827f10d9b9357ea7db764e03b');
assert.equal(sha('public/engine/shared-app/app.bundle.js'),'39efd597aa5140d1aa0f4efa15c3864639ad31033d4132ad8efcbdfd0c1b139b');
assert.equal(sha('public/engine/shared-ui/battlefield-ui.js'),'110394df12e3052bbcc961de24dad29b5734af65d0a7c0afdd2c8ffdaf8a81cb');
assert(!/href=["'][^"']*app\.css/.test(idx),'v3.51 gameplay CSS must not be loaded');
// Exact v3.76.6 lobby style and markup donor fingerprints.
const lobbyStyleStart=net.indexOf('  function installStyles(){'), lobbyStyleEnd=net.indexOf('  function installProgressionModal(',lobbyStyleStart);
assert(lobbyStyleStart>=0&&lobbyStyleEnd>lobbyStyleStart); const lobbyStyle=net.slice(lobbyStyleStart,lobbyStyleEnd);
assert.equal(crypto.createHash('sha256').update(lobbyStyle).digest('hex'),'86b36ee5d8edc110e5cd6ffe163e6682c6ef11063753249ba41b5e628e84d26b');
const htmlMatch=net.match(/function installLobbyModal\(\)\{var wrap=document\.createElement\('div'\);wrap\.id='pvpSetupOverlay';wrap\.className='pvp-v260-lobby';wrap\.innerHTML=(.*?);document\.body\.appendChild\(wrap\)/s);
assert(htmlMatch); assert.equal(crypto.createHash('sha256').update(htmlMatch[1]).digest('hex'),'0967b2bf41710c8257f99828bbee2582d88fa3bc13076f12f658895f696dbc64');
// v6 manifest compatibility fixes lobby Hero art without changing donor lobby geometry.
assert(net.includes('m.thumb_url||m.local_thumb_path||m.full_url||m.local_full_path'));
// Legacy network panel must not create a second Coin Flip presentation.
const panelStart=net.indexOf('  function installPanel(){'), panelEnd=net.indexOf('  function toggleReady(',panelStart);
assert(panelStart>=0&&panelEnd>panelStart); assert(!net.slice(panelStart,panelEnd).includes('pvpCoinFlipPanel'));
// Critical stage boundary: Coin Flip never imports the gameplay board.
const hs=net.slice(net.indexOf('  function handleSnapshot(msg){'),net.indexOf('  var lastActivitySentAt=0;'));
assert(hs.includes("var started=incomingStatus==='started'||incomingStatus==='finished'"));
assert(!hs.includes("['coin-flip','coin-result','started','finished']"));
assert(hs.includes('ui.prepareOpening(opening)')); assert(hs.indexOf('ui.prepareOpening(opening)')<hs.indexOf('importServerBoard(false)'));
assert(hs.indexOf('importServerBoard(false)')<hs.indexOf('ui.startOpening(opening)'));
// Locked v6.90.9 Coin Flip/opening timings are reused, not re-invented.
for(const marker of ['const totalSteps=8,halfDuration=72','Math.sin(progress*Math.PI)*22','setTimeout(()=>renderPvpCoinResultFinal(payload),1000)','runPairMotions(parts,220','setTimeout(next,20)','setTimeout(()=>runPvpPostOpeningSequence','flyBetween(\'assets/ui/back-main.webp\',from?.querySelector(\'.zoneCard\')||from,to,360','setTimeout(()=>runDraw(index+1),28)','flyBetween(\'assets/ui/back-shard.webp\',from?.querySelector(\'.zoneCard\')||from,to,390','setTimeout(()=>runShard(index+1),28)']) assert(rt.includes(marker),marker);
assert(rt.includes('isOpeningActive:()=>!!openingPresentationActive'));
assert(rt.includes('resolvePvpOpeningShardEntries'));
console.log(JSON.stringify({ok:true,build:'PvP v3.77.1',lobby:'PvP v3.76.6 exact donor markup/style',presentation:'VS AI v6.90.9 donor timing/geometry',authority:'PvP v3.51',checks:20},null,2));
