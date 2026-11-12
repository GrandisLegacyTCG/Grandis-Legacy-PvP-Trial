# Grandis Legacy PvP Season 0 — RC38 Beta 1 (11 November 2026)

**STATUS: PvP TRIAL / staging build. NOT a certified two-device live release.**

## Authority and scope

- **Gameplay donor:** the supplied VS AI Season 0 RC38 (11 Nov 2026). `engine/js/static-data.js` and `engine/shared-app/active-starters.js` are byte-identical to the donor. The `app.bundle.js` uses the RC38 donor with narrowly documented PvP bridge/atomic Mana and mirrored-identity patches.
- **Rulebook:** v3.2 (10 Nov 2026). Five official designer R3.6 starter compositions from Deck Builder v1.64, dated 11 Nov 2026; all five supplied external JSON draft exports also opened and started in local headless tests.
- **Network retained:** PvP RC6 Stage 2 lobby-owned single WebSocket / same-origin embedded battlefield, reconnect, player role/ready/start, batch Response, viewer-safe board. RC5 local physical-Mana draft and atomic Mana Payment retained. No change to lobby architecture.
- **Visuals retained:** PvP Hotfix2 mobile landscape stage and `WAITING FOR OPPONENT RESPONSE...`; Hotfix3 full legal Hero lane click for Single Target and simultaneous post-Response Area Attack damage/Status presentation. Synced additional RC38 stylesheet rules; new Rank Up/Scouting choice controls use the PvP authoritative modal adapter, not a direct duplicate of VS AI's client-authoritative animations. No AI, no BGM; SFX retained.

## Coin Flip UI from screenshot

- On winner result, remove `Opening Coin Flip` header while retaining the visible WINNER label, YOU WON THE COIN FLIP, and coin artwork.
- **Winner** chooses `GO FIRST` or `GO SECOND`; loser waits. The server authorizes only the winner and derives the actual first seat; no duplicate button to start the game.
- Finish the coin animation on both screens before opening the battlefield. Local server tests cover both seats choosing FIRST and SECOND, and reject the losing player's unauthorized choice.

## Opponent Mana Pool — RC38

- The **opponent's Pool shows face-up Mana Shards** (Regular/Color class), while the opponent's Hand, unrevealed Legacy, and **Mana Deck remain private**.
- Effects involving the opponent's Mana choice use the existing **opaque face-down selection** even though the normal Pool view shows Mana faces. Physical UID and deck order are not sent to the opponent. Both player and spectator projections remain masked appropriately.

## RC38 interactions integrated

- RC38 gameplay engine/data, card definitions, 248 card artworks, R3.6 formation/compositions, attack and Response calculations, INVINCIBLE, Rank Up, Dual Arrow, and new Scouting/EXP selection intents.
- RC38 `trial_rankup_return_exp` and `scouting_exp_selection` are supported in the generic PvP choice modal; no local AI decisions are used.
- Restored essential seat-2 perspective swaps for physical Mana zones, composite Provoke/End keys and per-Hero flags, preventing duplicate Provoke or missed server End phase. Cleared RC38 stale auto-End flags after Provoke turn advance.

## QA (offline/local, not Northflank)

- `npm run check`: complete regression (engine, RC5 Mana, RC6 WebSocket, privacy, lobby, both seats, opening, Provoke, targeting, graphics smoke test).
- `npm run build:precompress`: regenerates Brotli/Gzip assets for all modified JS/CSS; Docker precompression runs during image build, not from stale sidecar files.
- Custom Deck smoke run: all 5 supplied Nov 11 JSONs successfully start the RC38 authority with correct Heroes/Hand/Mana.
- `GET /health` includes `S0-RC38-PVP-NET-RC6-STAGE2-BETA1` and reports selected transport (`ws` in production, `lite` in offline tests).
- Card art completeness vs RC38 donor: 248/248 files; static-data and active-starters hashes identical to donor.

## Still requires live QA

- Browser visual validation is not available in this environment: headless Chromium local website navigation is explicitly blocked by browser policy. Test the new winner/loser Coin Flip screens on desktop and portrait mobile.
- Test two real devices through the entire match, particularly P1/P2 Room, all attack/Response animations and Rank Up/Scouting flows, public Mana Pool / blind opponent Mana picker, reconnect under disconnection, and end of match.
- Cold `START MATCH` latency under Northflank's shared CPU allocation was not benchmarked. The expensive RC38 runtime still loads on initial battlefield entry; keep speed expectations conservative.

**Deployment:** Manual upload to **PvP Trial** only (do not replace PvP main), then `npm ci && npm run check && npm start` or the included Dockerfile. This ZIP was not uploaded to GitHub or deployed to Northflank.
