# Grandis Legacy PvP S0 RC36 Patch 4 — Integration QA (9 November 2026)

## Source provenance
- Donor game: `Grandis_Legacy_VS_AI_Season0_v1.0_RC36_Patch_4_2026-11-09.zip` (RC36.6 internal Patch 4).
- Multiplayer base: `Grandis_Legacy_PvP_S0_NETWORK_RC6_STAGE2_2026-11-09.zip`.
- Mana transaction baseline: PvP RC34 RC5 (preserved from Network RC6 Stage 2).
- Reference for networking and atomic Response: Season 1 PvP v3.80.17.
- Rank-Up thresholds: 300/700; 200/500 trial is explicitly excluded.

## Included
- Donor RC36 gameplay core, card data/art and shared battlefield CSS; still uses PvP-aware app runtime for authoritative state ownership, local Mana drafts, animations and error handling.
- Ported from RC5/RC6: atomic Mana payment and exact Response payment bridge, both-seat state-swap bookkeeping needed for Provoke and End progression.
- No active automatic AI decisions on either seat; AI planner dead-code remains in donor engine and is a subsequent size optimization only after dependency assessment.
- BGM removed, SFX retained; no floating touch dock. PvP lobby Hero Card Review now includes printed card details and responsive modal.
- One parent WebSocket, atomic Response batch, viewer-safe private state and protections from RC6 Stage 2.

## QA
- `npm run build:precompress`: PASS; prebuilt JS/CSS gzip and Brotli refreshed after changes.
- `npm run check`: PASS on local test environment. Includes parser/syntax, Stage2 transport parent-child origin gate, legal and illegal atomic Response batches both seats, physical Mana, exact payments, Team 2 Response, Provoke End Phase, Tune Up and postmatch cleanup.
- `package-lock.json`: synchronized with `package.json` and locked `ws@8.21.0`.
- Native `ws` Docker and real hosted mobile/browser paths: NOT VERIFIED in this environment; local transport fallback `lite` was exercised.
- **Not certified:** full RC36 gameplay parity across every rule branch, actual throughput/RTT on Northflank, mobile pinch-zoom, end-to-end two-device match, full RC36 donor UI parity. Engine and CSS are donor RC36; PvP renderer was retained and selectively upgraded, not replaced wholesale.

## Next QA acceptance criteria
1. Deploy to Trial Northflank and verify `/health` reports native `ws`.
2. Two-device lobby READY -> START -> Coin -> Opening -> Play (no 2nd WebSocket) and run complete match.
3. Validate Response/PASS, Defense/Reaction + nested Response, mandatory discard, Surge and Mana PAY under real mobile network.
4. Check opponent hidden Mana and Hand, mobile/tablet preview pinch-zoom, Hero Card Review, and SFX.
5. Record ACK/Response-paint timings with `?pvpPerf=1`; optimize only from measured results.

No GitHub push/upload was made.
