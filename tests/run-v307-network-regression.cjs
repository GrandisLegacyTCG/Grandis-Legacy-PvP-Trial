'use strict';

const { spawn } = require('child_process');
const path = require('path');

const WebSocket = globalThis.WebSocket;
if (typeof WebSocket !== 'function') throw new Error('Node WebSocket client unavailable');

const root = path.resolve(__dirname, '..');
const port = 36000 + Math.floor(Math.random() * 1000);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makeClient(url) {
  const ws = new WebSocket(url);
  const state = { ws, snapshot: null, snapshots: [], notices: [] };
  ws.addEventListener('message', (event) => {
    let msg;
    try { msg = JSON.parse(String(event.data)); } catch { return; }
    if (msg.type === 'snapshot') {
      state.snapshot = msg;
      state.snapshots.push(msg);
    } else state.notices.push(msg);
  });
  state.send = (type, payload = {}) => ws.send(JSON.stringify({ type, ...payload }));
  state.waitForSnapshot = async (predicate, label) => {
    for (let i = 0; i < 160; i++) {
      if (state.snapshot && predicate(state.snapshot)) return state.snapshot;
      await sleep(75);
    }
    throw new Error(`Timed out waiting for ${label}; notices=${JSON.stringify(state.notices.slice(-5))}`);
  };
  state.waitForSnapshotCount = async (count, label) => {
    for (let i = 0; i < 160; i++) {
      if (state.snapshots.length >= count) return state.snapshots[state.snapshots.length - 1];
      await sleep(75);
    }
    throw new Error(`Timed out waiting for ${label}; snapshots=${state.snapshots.length}; notices=${JSON.stringify(state.notices.slice(-6))}`);
  };
  state.waitForNotice = async (predicate, label) => {
    for (let i = 0; i < 160; i++) {
      const found = state.notices.find(predicate);
      if (found) return found;
      await sleep(75);
    }
    throw new Error(`Timed out waiting for ${label}; notices=${JSON.stringify(state.notices.slice(-5))}`);
  };
  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve(state), { once: true });
    ws.addEventListener('error', () => reject(new Error('WebSocket client error')), { once: true });
  });
}

function assertRecipientFiltered(snapshot, seat) {
  const state = snapshot.match.serverBoard.appState;
  const own = Number(seat) === 2 ? state.aiHand : state.playerHand;
  const opponent = Number(seat) === 2 ? state.playerHand : state.aiHand;
  if (!Array.isArray(own) || !own.some((id) => id !== '__HIDDEN_CARD_BACK__')) throw new Error('Owner hand was not visible after stale resync.');
  if (!Array.isArray(opponent) || !opponent.every((id) => id === '__HIDDEN_CARD_BACK__')) throw new Error('Opponent hand leaked during stale resync.');
}

(async () => {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const clients = [];
  try {
    await sleep(900);
    const base = `ws://127.0.0.1:${port}/ws?room=V306NET`;
    const c1 = await makeClient(`${base}&client=v307a&name=Alice&role=player&deck=starter_01_elemental_lord_conqueror_renegade`);
    const c2 = await makeClient(`${base}&client=v307b&name=Bob&role=player&deck=starter_02_saint_crusader_grand_ranger`);
    clients.push(c1, c2);
    await c1.waitForSnapshot((s) => s.players?.length === 2, 'two players');
    c1.send('ready', { ready: true });
    c2.send('ready', { ready: true });
    await c1.waitForSnapshot((s) => s.players?.every((p) => p.ready), 'both ready');
    c1.send('start-match', { seed: 'v307-network' });
    await c2.waitForSnapshot((s) => s.match?.status === 'coin-flip', 'coin flip');
    c2.send('choose-coin-flip', { choice: 'HEADS' });
    await c1.waitForSnapshot((s) => s.match?.status === 'coin-result', 'coin result');
    c1.send('confirm-coin-flip');
    const started = await c1.waitForSnapshot((s) => s.match?.status === 'started' && s.match.serverBoardRevision > 0, 'started match');
    await c2.waitForSnapshot((s) => s.match?.status === 'started' && s.match.serverBoardRevision === started.match.serverBoardRevision, 'second player start');

    const turn = started.match.serverBoard.appState.turn;
    const actor = turn === 'AI' ? c2 : c1;
    const actorSeat = actor.snapshot.local.seat;
    const authoritativeRevision = Number(actor.snapshot.match.serverBoardRevision);
    const beforeResyncCount = actor.snapshots.length;
    actor.send('runtime-intent', { intent: 'advancePhase', args: [], baseRevision: authoritativeRevision - 1 });
    const stale = await actor.waitForNotice((msg) => msg.type === 'notice' && msg.code === 'STALE_REVISION', 'STALE_REVISION notice');
    if (stale.serverRevision !== authoritativeRevision || stale.resync !== 'authoritative-snapshot-follows') throw new Error(`Malformed stale notice: ${JSON.stringify(stale)}`);
    const refreshed = await actor.waitForSnapshotCount(beforeResyncCount + 1, 'authoritative stale-resync snapshot');
    if (Number(refreshed.match.serverBoardRevision) !== authoritativeRevision) throw new Error('Stale resync did not restore current revision.');
    assertRecipientFiltered(refreshed, actorSeat);

    const beforeContinueCount = actor.snapshots.length;
    actor.send('runtime-intent', { intent: 'advancePhase', args: [], baseRevision: authoritativeRevision });
    const continued = await actor.waitForSnapshotCount(beforeContinueCount + 1, 'continued valid intent');
    if (Number(continued.match.serverBoardRevision) <= authoritativeRevision) throw new Error('Client could not continue after stale resync.');

    console.log(JSON.stringify({
      ok: true,
      staleRejected: true,
      snapshotRefreshed: true,
      hiddenInformationFiltered: true,
      continuedAtRevision: continued.match.serverBoardRevision,
      doubleCastingRouteCoveredBy: 'run-v307-authority-pending.cjs bridge + client-route assertion'
    }, null, 2));
  } catch (error) {
    throw new Error(`${error.stack || error}\nserver stderr:\n${stderr}`);
  } finally {
    for (const client of clients) try { client.ws.close(); } catch {}
    child.kill('SIGTERM');
    await sleep(150);
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
