# Grandis Legacy PvP S0 RC39 - Repo Candidate RC1

**Date:** 12 November 2026  
**Source:** latest uploaded `Grandis_Legacy_VS_AI_Season0_RC39_2026-11-12.zip`  
**Donor revision:** `RC39 Intermediate Aura Combo Guard Hotfix (after target+Mana banner update)`  
**PvP baseline:** RC39 Beta 2 Batch 5 Full, including earlier RC38 Batches 1-4.  
**Build ID:** `gl-s0-pvp-rc39-beta2-repo-rc1-2026-11-12`  
**Status:** Repo-ready for PvP Trial; still requires hosted two-device acceptance before PvP main.

## What changed in the newest RC39 donor

The donor's updated `RC39_BUILD_INFO.json`, Intermediate target hotfix notes, and Aura combo notes confirm these are **Intermediate AI policy-only changes**: target scoring among already-legal attacks, Aura Infusion Bolt 1-/2-turn planning, and conserving playable Main Deck Draw cards. They do **not** change the legal target set, card text, player choices, Mana calculations, Rank Up, or original Response rules. **Do not merge or enable the AI director in a human-vs-human PvP game.**

A non-AI visual change **does** matter to PvP: resolved Mana losses/spends now use the same **English, centered COUNTERED/RACIAL banner queue** as the donor instead of a separate localized DOM toast. The donor's own `MANA_LOSS_RESOLVED` is PLAYER-only single-player state; the PvP server must keep its established, perspective-aware `MANA_LOSS_COMMITTED` transport.

The donor PvP adapter remains **byte-identical** to previous RC39 and remains inactive; Batch 3's production local-draft channel is retained. The 187 Main Deck R3.7 artwork entries, canonical `static-data.js`, and donor adapter passed unchanged parity checks.

## Implemented PvP-specific integration

- Engine emits immutable **post-resolution** `MANA_LOSS_COMMITTED` with count, loss kind and **sanitized** Regular/Color Shard identities. No physical UID, pending blind choice or private deck order enters the event.
- Viewer-safe projection transmits the notice **only to the affected player**; spectators cannot receive these per-player notifications. Both player's perspectives are projected by the authoritative server as before.
- Browser displays `You used ... / Spent ...` or `Opponent used ... / Removed ...` through the **existing 2-second centered notice queue**. It retains one event ID = one banner and does not create new popup controls. Ordinary PAY MANA and the pending face-down opponent Mana selection do not show a result early.
- Updated server version, `/health` build ID, lobby/battle JS/CSS cache keys, `package.json`, `package-lock.json` and regression tests. Regenerated compressed `.br`/`.gz` assets from final source.
- Preserved **one lobby-owned RC6 Stage 2 WebSocket**, S1 room/ready/start/reconnect, RC5 atomic Mana and hidden Mana Deck, opponent Pool **face-up**, and blind selection using opaque server handles. Batches 1-3 optimization and RC39 Rank Up/Return EXP animations remain intact.

## Final QA and limitations

| Validation | Result |
| --- | --- |
| Full `npm run check` | **PASS, exit code 0**, including all prior RC34-RC39 regressions and new donor-banner tests |
| Rank Up, Return EXP, both player perspectives | PASS (real RC39 headless authority and presentation VM tests) |
| Single-Target hitboxes / Area Attack after Responses | PASS (automated logic tests) |
| Mana Payment RC5, Response, Batch 3 local drafts | PASS (real headless engine/atomic action tests) |
| One RC6 socket, two WebSocket clients, viewer privacy | PASS (automated local integration tests, `lite` fallback) |
| Opponent Mana face-up / face-down blind handles | PASS (viewer projection tests) |
| English centered Mana loss, only affected viewer, no UID | PASS (production function VM tests) |
| Main Deck art parity with RC39 R3.7 | **187/187 PASS** |
| Asset precompression and source/sidecar match | **82 assets, 18.39 MiB -> 1.10 MiB Brotli; PASS** |
| Local HTTP `/health` and Battlefield static route | PASS, local fallback transport is `lite` |
| Browser Playwright navigation to localhost | **BLOCKED** by admin URL policy (`net::ERR_BLOCKED_BY_ADMINISTRATOR`), not a PASS |
| Local native `ws` install / Docker build | **NOT RUN:** npm registry inaccessible from this environment (`EAI_AGAIN`). CI/Dockerfile require native `ws` in production. |
| Northflank two real devices, animations, cold/warm latency | **NOT VERIFIED** |

**Deployment policy:** This is a fully structured Node/Docker repository, suitable for uploading **manually to PvP Trial**. Do **not** overwrite the PvP main repository. Deploy only after GitHub Actions and Northflank builds pass, verify `/health` `buildId` above and `transport: "ws"`, then perform a real 2-device match before considering PvP main.

**Previous QA:** `docs/RC39_BETA2_BATCH5_RELEASE_QA_2026-11-12.md` and `docs/donor-rc39/`.
