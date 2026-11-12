# Grandis Legacy PvP Season 0 RC38 — Beta 2 / Batch 3

**Prepared:** 12 November 2026  
**Baseline:** `Grandis_Legacy_PvP_S0_RC38_Beta2_Batch2_Startup_2026-11-11.zip` (includes Batch 1 + Batch 2)  
**Scope:** choice-only local drafts and one authoritative commit; **do not sync post-Beta-1 RC38 changes here** (reserved for Batch 4).

## Changes

The following existing RC38 UI choices now select/unselect/reorder without waiting for WebSocket, and send exactly **one `runtime-intent`** when confirmed:

| Player choice | Existing local UI intents | One authoritative intent | Guardrails |
| --- | --- | --- | --- |
| Rank Up return EXP | `trialSelectRankUpReturn` | `commitExactLocalChoiceDraft` | Post-commit only, exact quota 2/3, legal candidate index, no duplicate |
| Scouting EXP | `selectScoutingExpChoice` | same | Post-commit only, one current legal opponent EXP candidate |
| Hand Limit | `toggleDiscardIndex` | same | Exactly required Hand discards, no duplicate/out-of-range index |
| Bard / Maestro Draw | `activateS0BardDrawChoice`, `toggleS0BardDrawIndex`, `cancelS0BardDrawChoice` | same for DISCARD & DRAW | Current legal Hand, bounded max count, actual Bard class ability validated by RC38 engine; skip stays atomic existing path |
| Crystal Ball order | `moveCrystalBallOrder` | same | Permutation of original **positions**, not IDs. Supports duplicate card IDs; reorders only server-owned original top cards |
| Legacy multi-card choice | `selectLegacyCardChoice` | same | Exact candidate count; uses existing RC38 Legacy resolver |

The preexisting local Mana / Response payment / Tune Up paths are retained. All runtime combat state (HP, Status, Hand changes, Deck changes, RNG, card effects, turns, Mana, EXP rewards) is committed **only by the server**. The browser may temporarily mutate its *own choice-selection UI*; it never publishes these drafts to the opponent or server before CONFIRM.

Server validates the active decision owner in the acting player's local perspective, the exact choice type and count, and every index against the server-owned candidates. It then invokes only the original RC38 engine intents and commits their result in one existing `Season0HeadlessAuthority.applyIntent` revision/rollback boundary. `baseRevision` is still checked before execution. A rejected/stale transaction is resynced from the server, discarding draft state. The single-WebSocket RC6 Stage 2 lobby protocol and client ID logic remain untouched.

## Verification completed (local)

- Full `npm run check`: **PASS**, including RC38 gameplay, privacy, both seats Response, RC5 Mana, lobby initialization, Batch 1 and 2 regression, and all existing S0 checks.
- New mocked-client production-control tests: **PASS**, verifying local selection never sends network actions, exact single commit packet, stale draft rejection, invalid/foreign owner rejection, duplicate indices rejection, and duplicate Crystal Ball card identity permutations.
- New actual **RC38 engine** transactions via official `app.bundle.js`: **PASS** for Rank Up 2 EXP return, Scouting opponent EXP discard, Crystal Ball reorder, End Hand Limit (2 cards), Maestro discard 2 / draw 2.
- `npm run build:precompress`: **PASS**. Updated `pvp-network.js.br`/`.gz` sidecars regenerated.
- Engine donor files, RC38 official card data, updated R3.6 art, server viewer masking, opponent Mana face-up, Coin Flip first/second-turn selection, lobby networking, full-body mobile UI and animations were **not changed**.
- The baseline's **Beta 1 BUILD_ID is deliberately retained** for staging and cumulative Batch 4 integration. **Do not deploy on its own under the same BUILD_ID**: live browsers may cache the old `pvp-network.js` despite changed source. Refresh build ID / script URLs together in the final integration release.

## Not verified

- Real two-device browser gameplay with high RTT, reconnect during uncommitted Rank Up / Hand Limit / Bard choice, and live hosted Northflank latency. No hosted FPS/RTT benchmark or hardware performance guarantee.
- A code-only regression test verifies atomic replay and owner checks. While actual RC38 gameplay paths were exercised, this does **not** equal a full visual end-to-end browser test.

## Next work

**Batch 4:** compare the *newer RC38 update* separately to the frozen RC38 Beta 1 gameplay source used by Batches 1–3; selectively sync changed UI and/or gameplay only after conflict checks. After integrating, assign the release BUILD_ID, rebuild compression and perform final regression + two-device QA. **Do not touch PvP main repo.** No GitHub push or Northflank deploy was made for Batch 3.
