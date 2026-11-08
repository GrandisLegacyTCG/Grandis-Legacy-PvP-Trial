# Grandis Legacy PvP Season 0 RC34 — GitHub RC3

**Date:** 2026-11-08 (Asia/Jakarta). **Source baseline:** RC34 GitHub RC2. **Purpose:** unblock defender Response in browser, reduce UI action friction, add visible errors, recover post-match rooms. **Status:** GitHub staging candidate, not full-match certified.

## Changes

| Reference | Issue | Change | Validation |
| --- | --- | --- | --- |
| BUG-05/P0 | Defender PASS/Defense blocked by masked pending `UNKNOWN` | `pvp-network.js` allows locally owned public `responseWindow` during masked `response_window` pending, without revealing private pending; server retains final authority | Genuine RC34 snapshot -> production browser adapter -> authoritative PASS -> ACK for BOTH attacker seats (PASS) |
| BUG-06/P1 | Play Card feels delayed | PvP only: PAY flight 520ms -> 340ms; add per-action ACK metrics, optional `?pvpPerf=1` overlay; visible timeout/resync and queued-action status | Static/VM timing instrumentation tests. Hosting latency NOT measured; rule-required decisions still round-trip |
| BUG-07/P1 | Buttons only ~8–13px on 390px mobile due rotated 1600×747 canvas | Independent mobile action dock outside scale transform, at least 46px tall; forwards to existing Play/Pass/Pay/Cancel callbacks; source/target still selected on battlefield | Chromium 390×844 DOM fixture PASS, actual hosted touch session NOT verified |
| BUG-08/P1 | Local action refusal looks like dead click | Timed visible status toast + `gl-pvp-intent-error` event on rejection; resets stuck center-choice visual as appropriate | Node VM error-path test PASS |
| UI-04 | Floating RETURN TO LOBBY duplicate in top right | Removed `showFinishButton` | Source check |
| SYS-01–03 | Room remains FINISHED; popup BACK TO LOBBY reloads just one browser | Server cleanup after 60s even without client activity; popup BACK TO LOBBY sends `return-to-lobby`; match reset clears action ledger/READY but retains deck and formation | 2-seat WebSocket cleanup PASS (shortened QA interval) |
| UI-06 | Missing post-match countdown | Game Result displays server supplied cleanup deadline | Handler/source check; full hosted screenshot outstanding |
| UI-05 | VS AI/LOCAL AI labels seen during PvP | Player and opponent names/decks from public match roster; sidebar shows opponent labels | Source checks |

## Privacy and rule preservation

The server continues to redact hidden pending decisions and Hand. The Response exception relies only on `responseWindow.response_owner==='PLAYER'` and the pending type being `response_window`, with a masked/unknown owner. This does **not** mark other pending decisions as local. The server rejects illegal actions. Mana costs, status, card effects, targeting, deck, artwork, sound, and engine rules are unchanged.

## Test procedure

```bash
npm run build:precompress
python3 -m pip install websocket-client==1.8.0
npm run check
```

The check suite now includes regression tests `test:browser-response`, `test:postmatch`, and `test:touch-static`. The two-seat adapter test uses a real RC34 authority in a Node VM rather than a Chromium browser session; the separate mobile fixture uses Chromium with synthetic DOM. Chromium HTTP navigation to a local live host was blocked by environment policy, so live end-to-end browser gameplay remains NOT VERIFIED.

## Still open / do not promote FINAL

- Lobby mobile layout is not yet designer-approved (previous BUG-01).
- Coin Flip/opening Back-of-Card/Hero reveal presentation (BUG-02/03) has not been verified/fixed by this patch.
- Full Play Card/Defense/Reaction plus game-over cycle in two actual browsers and mobile devices after hosting.
- Northflank production latency, slow connection, multiple matches, resource profiling, Docker run on host.

Deployment target: **GrandisLegacyTCG/Grandis-Legacy-PvP-Trial** as a staging branch. Do not overwrite Season 1 production repository. GitHub push is manual.
