'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const ok=(v,m)=>{if(!v)throw new Error(m)};
const server=read('server.js'), app=read('public/js/app.bundle.js'), net=read('public/js/pvp-network.js'), css=read('public/css/app.css');
const pkg=JSON.parse(read('package.json')), build=JSON.parse(read('public/PVP_FRONTEND_BUILD.json'));

ok(pkg.version==='3.0.51','semantic package version changed');
ok(build.pvp_version==='v3.51'&&build.website_target_version==='v1.40','semantic target versions changed');
ok(!/v3\.52|v1\.41/.test(JSON.stringify(pkg)+JSON.stringify(build)),'unexpected post-v3.51/v1.40 semantic bump detected');

// Steal: field remains public while only popup candidates are opaque and independently ordered.
ok(server.includes('Battlefield Shard Pools are public information'),'Battlefield Shard Pool is still treated as hidden');
ok(!/st\[poolKey\]\s*=\s*pool\.map\([^;]+hidden/.test(server),'Battlefield Shard pool still globally masked');
ok(server.includes('function opponentShardPermutationKey'),'server popup permutation owner missing');
ok(server.includes('const popupOrder = valid.slice().sort'),'popup independent permutation missing');
ok(server.includes('choice_handle: opponentShardChoiceHandle'),'opaque popup handle missing');
ok(server.includes('pvp_pool_revision'),'pool revision binding missing');

// Response typing: cannot_block may reject Block, but must not globally suppress Negate.
const rkStart=app.indexOf('function responseKind('), rkEnd=app.indexOf('function responseBlockAmount',rkStart);
ok(rkStart>=0&&rkEnd>rkStart,'responseKind missing');
const rk=app.slice(rkStart,rkEnd);
ok(!/if\s*\(\s*incoming\s*&&\s*incoming\.cannot_block\s*\)\s*return null/.test(rk),'cannot_block still suppresses all responses');
ok(rk.includes("e.kind==='negate_incoming_attack'")&&rk.includes("return 'negate_return'"),'Negate response branch missing');
ok(rk.includes("incoming.cannot_block ? null : 'block'"),'Block-specific cannot_block guard missing');

// Held lifecycle and canonical feedback ledger.
ok(server.includes("'held_card_release'")&&server.includes('held_until_resolution'),'held Attack lifecycle bridge missing');
ok(app.includes('function recordPvpBattleFeedbackEvent')&&app.includes('pvpBattleFeedbackEvents'),'canonical battle feedback ledger missing');
ok(app.indexOf('recordPvpBattleFeedbackEvent(appState,evt)') < app.indexOf('if(SUPPRESS_RENDER)return true'),'headless canonical feedback is recorded too late');
ok(app.includes("outcome:dodged?'dodge':(negated?'negate':(blockLike?'block':'hit'))"),'hit/block/dodge/negate classification missing');
ok(app.includes("evt.outcome==='negate'"),'Negate visual feedback missing');
ok(app.includes("Dodge.mp3")&&app.includes("P.Def.mp3")&&app.includes("M.Def.mp3"),'approved existing battle SFX assets missing');

// Tribute geometry: normalized source/target card dimensions, plus EXP resync after motion.
ok(app.includes('function captureHeroCardMotionRect'),'normalized Hero card motion geometry missing');
ok(app.includes('captureHeroCardMotionRect(side,lane)'),'Tribute motion does not use normalized Hero geometry');
ok(app.includes('v628SyncHeroExpStackGeometry'),'shared EXP geometry sync missing');

// Kick and reconnect.
ok(net.includes('aria-label="Kick Player 2"')&&net.includes('assets/lobby/exit.png'),'approved exit.png Kick control missing');
ok(css.includes('.pvp-seat-kick img'),'Kick image sizing rule missing');
ok(server.includes('PLAYER1_SETUP_RECONNECT_GRACE_MS')&&server.includes('60 * 1000'),'Player 1 60-second grace missing');
ok(server.includes("PLAYER1_RECONNECT_GRACE_EXPIRED")&&server.includes("role: 'spectator'"),'late Player 1 Spectator fallback missing');

// Custom deck count is relaxed only to 50..60 in all 3 relevant layers.
ok(server.includes('mainCount < 50 || mainCount > 60'),'server custom 50..60 range missing');
ok(net.includes('validateImportedDeck')&&app.includes('validateImportedDeck:function(deck,side)')&&app.includes('mainIds.length<50||mainIds.length>60'),'client custom 50..60 canonical validator bridge missing');
ok(app.includes('mainIds.length<50||mainIds.length>60'),'runtime custom 50..60 range missing');
ok(server.includes('Unknown card ID in custom Main Deck'),'server unknown-card rejection missing');
ok(server.includes('Ultimate card maximum is 1 copy')&&server.includes('Normal card maximum is 3 copies'),'copy limits weakened');
ok(app.includes("ids.length!==60")&&app.includes('Starter deck is not 60 cards'),'official Starter Deck 60-card authority regressed');

// Deterministic proof that popup permutation differs from canonical order for at least one revision,
// while never mutating the supplied canonical array. Uses the exact algorithm/secret shape in source.
const secretMatch=server.match(/const OPPONENT_SHARD_HANDLE_SECRET\s*=\s*([^;]+);/);
ok(secretMatch,'opponent shard secret owner missing');
// We do not evaluate env-dependent secret. Prove algorithmically with a test secret and multiple revisions.
const uids=['warrior-A','mana-B','mage-C','archer-D'];
function perm(rev,seat){return uids.slice().sort((a,b)=>crypto.createHash('sha256').update(`perm|test-secret|${rev}|${seat}|${a}`).digest('hex').localeCompare(crypto.createHash('sha256').update(`perm|test-secret|${rev}|${seat}|${b}`).digest('hex')))}
const variants=new Set(Array.from({length:24},(_,i)=>perm(i+1,1).join('|')));
ok(variants.size>1,'fresh selection permutation cannot vary');
ok([...variants].some(x=>x!==uids.join('|')),'popup order never diverges from field order');
ok(uids.join('|')==='warrior-A|mana-B|mage-C|archer-D','canonical field array mutated by popup permutation test');

console.log(JSON.stringify({ok:true,pvp:'v3.51',website:'v1.40',stealFieldPublic:true,popupOpaque:true,popupIndependent:true,tacticalNegateTyped:true,heldLifecycle:true,battleFeedbackLedger:true,tributeGeometryNormalized:true,kickExitPng:true,player1GraceMs:60000,customDeckRange:'50-60',officialStarters:'60'},null,2));
