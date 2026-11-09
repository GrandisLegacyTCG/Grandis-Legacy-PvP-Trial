# Grandis Legacy PvP S0 - Network RC6 Stage 2 QA

Date: 2026-11-09. **Candidate for GitHub Trial staging; not production certified.**

## Version authority

- Runtime gameplay and UI: PvP S0 RC34 RC5, engine and card data unchanged.
- Mana: RC5 local draft + atomic UID payment, unchanged.
- Networking reference: PvP S1 v3.80.17, using native `ws` (pinned 8.21.0).
- Next rules donor: VS AI Season 0 RC36 internal RC36.3, **not** used in this stage.

## Implementation

| Scope | Stage 1 | Stage 2 |
| --- | --- | --- |
| START MATCH | top-level navigation to `/battle/`, destroys lobby socket and connects again | one real lobby-owned WS with embedded same-origin battlefield and packet relay; direct `/battle/` still supports standalone fallback |
| WebSocket owner | lobby or battlefield in succession | lobby parent throughout ordinary match lifecycle |
| Response select+confirm | existing single compound intent | one allowlisted two-step batch with server-side ownership check and atomic canonical revision |
| Illegal/stale batch | rejected by Season 0 authority | still rejected, and no state revision or hidden board change committed |
| Mana Payment | RC5 atomic draft | unchanged |
| RTT, backpressure, cache | RC6 Stage 1 | retained |
| AI/BGM / RC36 visuals | not modified | not modified |

### How the iframe bridge works

1. Player connects via `/` and gets one viewer-safe handshake snapshot.
2. During Coin Flip/Started/Finished, the parent mounts `/battle/?embedded=1` without navigating away or disconnecting the parent socket.
3. The child posts a `ready` message; the parent replies with current connection status and the newest viewer-safe snapshot.
4. All further client commands go to the parent via a same-origin, source-checked `postMessage`; parent forwards only known message types over its existing socket. Server still validates seat and revision.
5. `intent-result` containing the sender's authoritative snapshot goes back to the child; opponent receives a distinct safe snapshot.
6. After server cleanup/Return to Lobby, parent unmounts the child without reloading itself, preserving room selection and WS. If the child never becomes ready in 25 seconds, a visible OPEN DIRECTLY fallback uses the older standalone battle route.

This has more moving parts than the standalone `/battle/` fallback and requires actual hosted browser QA. It does NOT make RC34 engine loading free; even with script prefetch the iframe must initialize the battlefield runtime.

### Tests executed in this container

- `npm run check`: PASS. This includes 20/20 engine rules regression, two-seat socket, privacy, assets, Mana, Turn/End deadlock, Response PASS, Tune Up, postmatch, and new Stage 2 tests.
- `test:net-stage2-socket`: PASS. VM executes the production lobby host and battle adapter; verifies one socket over phase transitions, parent-child message origin and source filtering, initial snapshot handshake, intent/result relay, return-to-lobby and client disconnect handling. NOT a real browser networking benchmark.
- `test:net-stage2-response`: PASS. Real S0 RC34 engine simulates attacker seat 1 -> defender seat 2 and attacker seat 2 -> defender seat 1. Valid Response selection + confirmation advances the canonical state exactly once. Illegal batch and illegal option preserve state.
- `test:ws-gate`: PASS. Live local RFC6455 test rejects an unapproved `runtime-intent-batch` without advancing revision, then accepts the next normal action.
- `npm run build:precompress`: PASS. Modified source `.br` and `.gz` byte-decompress to original JS.

### Not yet established

- Measured Northflank Free latency, jitter, memory peak and steady-state CPU.
- Real Android/iOS iframe viewport, keyboard, pinch zoom, background tab behavior, or browser audio policies.
- Full online response chains, nested counter, protection, REACTION outside Battle, Casting interactions, and full match end-to-end through hosted browsers.
- Native `ws` transport or Docker image execution locally (dependencies unavailable to this environment). CI is configured to install it and to verify `transport: ws`.

### Staging checklist

Run GitHub Actions, open two real client browser contexts, READY, Coin Flip, START GAME, Attack/Response including Defense card + Mana, test reconnect/refresh and Postmatch. For timings use `/?pvpPerf=1`, and record RTT, time from click to ACK, and Response-visible paint. Revert to Stage 1 or RC5 if iframe route fails on devices. Keep the same Northflank single container instance. Never claim a performance improvement without hosted before/after observations.
