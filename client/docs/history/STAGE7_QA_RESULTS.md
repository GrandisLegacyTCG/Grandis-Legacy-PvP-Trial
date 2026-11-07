# VS AI S0 Stage 7 — QA results (2026-11-04)

| Test | Result |
|---|---|
| JS syntax (5 changed/wiring files) | PASS |
| Pinned OSA DEV44 consumers, 248 IDs, 242 card engine records, 426 branches, 36 bindings | PASS |
| 5 S0 starter packages 50 Main / 12 Mana / 12 Legacy | PASS |
| 251 current S0 artworks hash matched | PASS |
| App deck validator legal/rejection cases | PASS |
| Stage5 first 18 + completion 24 targeted assertions | PASS |
| Stage6 Bard & AI 20 targeted assertions | PASS |
| Node VM app-engine terminal matches with AI against passive human | PASS 5/5 (11,14,17,13,20 rounds) |
| Browser desktop lobby, S0 images and coin-flip UI | PASS |
| Browser match kickoff & normal phase flow | PASS in partial playthrough |
| Browser AI actions + Response PASS + hand-limit discard + round after hand-limit | PASS in partial playthrough |
| Mobile portrait lobby visual smoke | PASS |
| Full real-timing browser human-vs-AI terminal match | **NOT COMPLETED** |
| Complete S0 special-card, combo and AI tactics coverage | **NOT ASSERTED** |
| Standard HTTP hosting / GitHub Pages playability | **NOT VERIFIED** |

**Identified and corrected bug:** `commitHandLimitDiscard()` directly launched AI instead of invoking `finishPlayerEndToAI()`, bypassing round advancement when the opening coin flip made AI first. This emerged only in real browser UI flow with 9+ cards in Hand; Stage6 pure function checks and VM's manual discards had not covered it. The correction preserves existing card choice UI and End Phase cleanup.

**Known former-version hook mismatch:** Some embedded historical `GL_*_QA_SELF_TEST` tests still assert Season1 registry count 200 or specific Season1 IDs/cards. They are not Season0 acceptance tests; do not silently re-label them as passing.

**Important:** Five engine terminal matches are NOT five fully clicked-through browser matches. UI browser sessions advanced through multiple turns but were intentionally bounded; no actual complete browser match result was captured. Status remains **candidate / Stage 7 pending final browser terminal**, not verified playable.
