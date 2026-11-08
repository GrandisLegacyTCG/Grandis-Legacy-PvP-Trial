# Grandis Legacy PvP Season 0 RC34 — RC5 Mana Transport Fixes

**Date:** 9 November 2026. **Base:** RC34 GitHub RC4 Mana/Tune Up. **Target:** PvP-Trial staging. **Status:** staging candidate; hosted full-match has not been verified. No GitHub push.

## Why Season 1 felt faster

PvP Season 1 v3.80.17 keeps the Mana payment selection entirely inside its browser UI and sends only a final authoritative PAY. Season 0 RC4 still ran its local gameplay engine to toggle Shards, awaited an outgoing PAY animation before sending the action, and kept up to four implicit queued actions. Some Response discard choices also required extra server trips. These are integration/transport differences, **not evidence that the RC34 game rules are wrong**.

## RC5 implementation

| Area | Change | Rule/authority boundary |
| --- | --- | --- |
| Mana Draft | `public/battle/runtime/pvp-mana-draft.js`: physical UID draft, exact sum, revision reset | Server pending choices supply Shard values; RC34 engine validates on PAY. |
| Class Mana | Matching S0 Color Mana value 2, nonmatching value 1 | No S1 rule values copied into Season 0. |
| Magical Surge | Optional extra Shard in local draft | Server confirms physical UID, cost and effect. |
| Response extra cost | `commitExactResponsePaymentWithDiscardChoice` submits UIDs + additional discard indices together | RC34 server reselects costs then resolves original engine payment in a single authoritative action; stale/duplicate/invalid selections rejected. |
| PAY visual | Send intent first, then animate visual card clones asynchronously | State transition never depends on browser animation completion. |
| UI | Only Mana center modal/selected pool highlights are refreshed on local taps | No full battlefield rerender per Shard. |
| Network | One in-flight gameplay intent, ACK identity match; reject clicks while busy with visible message | No silent queue of stale actions. Server still owns phase, targeting and card legality. |
| Former double-action buttons | Bounded server-side composite actions for Response choice, Bard Skip, status removals, selected card then confirm | Original RC34 engine actions run in one authority roundtrip without skipping mandatory choices. |
| Telemetry | `?pvpPerf=1` and PLAY-to-Mana-paint sample | Host/browser real-world latency not established by local tests. |

## Regression & limitations

`npm run test:mana-transport` contains production adapter seat 1 and 2 simulation, duplicate/invalid cost rejection, a real RC34 engine Response with mandatory additional discard, real one-click Response choice-to-payment confirmation, a strict ACK gate, and selected composite action checks. Existing `npm run check` includes Season 0 donor engine regressions (20/20), two-seat WebSockets, Mana exact PAY, Response, deadlock, reconnect, postmatch, Tune Up and static assets.

**Not yet verified:** full game in two real browser sessions on remote hosting (including slow connections, touchscreen), end-to-end payment appearance timing, every nested Response/Reaction, mobile lobby parity and the Coin Flip/hero reveal presentation. Do **not** claim RC5 has proven to eliminate all live lag.

## Deployment

Unzip the full package into the root of the **GrandisLegacyTCG/Grandis-Legacy-PvP-Trial** staging repository (not the main Season 1 PvP repository), push manually, run GitHub Actions `npm run check`, then deploy a single-instance Node/Docker backend. Instructions: `docs/GITHUB_DEPLOY_RC34.md`. GitHub Pages alone cannot host the WebSocket server.
