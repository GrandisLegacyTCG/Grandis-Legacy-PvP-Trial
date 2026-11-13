# Grandis Legacy PvP — S0 RC39 Repo RC9 Stage 3 Patch 1 (13 November 2026)

**Build:** `gl-s0-pvp-rc39-beta2-repo-rc9-s3-p1-2026-11-13`  
**Base:** PvP RC9 Stage 2 FULL, 13 November 2026.  
**VS AI donor:** RC39 **Part 5 Batch 2** (not RC40).

**RC9 Stages 1 & 2 preserved:** gameplay/Response parity, private Mana/Discard notifications, Card Played and linked Response chain, dynamic damage banner and duplicate-result suppression.

**Stage 3:** viewer-safe Card Played grouped per Hero; one-click local Legacy draft + single server-authoritative final commit; resolution-adaptive 5:7 Active Card; lobby-name Turn Banner (blue self / red opponent); cached Card Review; 1v1 swap lock from latest VS AI donor, with Auto Center / Revive rules preserved.

**Important rule note:** VS AI Part 5 Batch2 introduces a 1v1 swap prohibition absent from Player Rulebook v3.2; update/approve rulebook before public launch. This package does not modify the PDF.

**Network:** RC6 Stage 2 single WebSocket, local Mana PAY, immutable client-hidden information model and no extra request for animations/Card Played/choices. GitHub and Northflank remain untouched; manual deployment/testing by project owner.

Run `npm run check:syntax`, `npm run test:rc9-s3`, `npm run test:rc9-s2`, `npm run test:rc9-s1`, and `npm run build:precompress`. Use `npm run check` for full historical regression when available. Live two-browser/mobile/Firefox stress acceptance remains pending.

Technical notes: `docs/RC39_PVP_REPO_RC9_S1_RESPONSE_2026-11-13.md`, `docs/RC39_PVP_REPO_RC9_S2_INFORMATION_2026-11-13.md`, and `docs/RC39_PVP_REPO_RC9_S3_FINAL_2026-11-13.md`.

Future `grandislegacy.web.id` promotion and navigation buttons to VS AI/Deck Builder are intentionally deferred until after VS AI RC40.

## RC9 Stage 3 Patch 1 — Card Played / Mana notification hotfix

- Compact VS AI-style Card Played Detail: action/source, authoritative per-Hero damage and linked Response details, exact recipient-visible Mana loss, related cards.
- No fake DISCARDED entry for ordinary played Attack card cleanup. Discard caused by Scouting/Calculated Plan is shown only with source action and known origin.
- Mana Burn/Steal receipt only on losing seat, after server-confirmed selected Mana face(s) have animated; identity remains hidden from attacker and spectators.
- YOU / OPPONENT badge background retained without bright border.
- Architecture: one RC6 Stage2 socket; no new per-click or Card Played network request.

Focused QA: `npm run test:rc9-s3-p1`. Live two-browser visual tests remain pending.

See `docs/RC39_PVP_REPO_RC9_S3_P1_CARDPLAYED_MANA_2026-11-13.md`.
