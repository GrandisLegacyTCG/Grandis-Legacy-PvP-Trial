# VS AI S0 RC10 — Return Ghost Animation QA

Baseline: **RC9**, OSA Season 0 DEV45 (read-only). Only VS AI application presentation code changed.

## Implemented

- When Bard/Maestro's official discard CONDITION physically returns note card(s) to the Main Deck and the payment is committed, queue one *translucent card-back silhouette* per returned physical card, using the existing flight animation layer. No face art, extra visual effect, or new animation engine.
- Cover **PLAYER and AI** through the same rendering hook, including a normal played Attack and a paid Response.
- Also cover the existing **Replenish** Discard-to-Deck choice (PLAYER and AI) and **Legacy Ability** Discard-to-Deck resolution; do **not** play this animation for Deck-to-Hand, Discard-to-Hand, canceled choices, or zero physically returned cards.
- Animation moves from the visible Discard Pile zone to the Main Deck zone. Existing engine shuffle stays unchanged; if a Draw happens afterward, visual motions are queued after Return, not before.
- Animation queue enforces the existing gameplay input lock; rollback on a synchronous card-play failure removes any newly queued ghost Return motions.

## Targeted verification

- **Chromium synthetic-match test:** AI plays Crimson Crescendo; `2` Zol physically leave Discard; Main Deck count increases by `2`; `2` ghost-card flight items are queued with the local `back-main.webp` art, and no full card face; an animation node appears then clears after completion. **PASS.**
- **Existing automated targeted self-tests (in the Chromium inline DOM harness):** S0 Class/Rank/Lineage check `6,975` combinations **PASS**; S0 target-selection scenarios `13/13` **PASS**; page errors `0`. JS syntax **PASS**.
- Browser access to `localhost` and `file:` was blocked, so the browser harness injected the same application source and styles inline. That verifies the animation DOM and queue behavior, **not** every pixel/asset in a normal hosted match. The source asset `assets/ui/back-main.webp` exists and is valid WebP.

## Open / not claimed

- Complete browser Human vs AI match to normal Game Over remains **UNVERIFIED**.
- Real-match visual check for each Bard/Maestro Return and Response variant, Replenish and Legacy remains outstanding. The user's earlier observation of missing Bard Return in a live match is **not** presumed solved by UI animation alone.
- Do not modify OSA DEV45, gameplay rules, card effects, or AI tactics merely to satisfy this visual change.

Evidence: `RC10_QA.json` (reproducible synthetic scenario). This release remains an **RC**, not a verified final.
