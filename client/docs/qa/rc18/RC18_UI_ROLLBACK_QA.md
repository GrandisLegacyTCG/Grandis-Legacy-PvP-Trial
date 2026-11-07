# RC18 UI Regression Recovery — Targeted QA

Baseline RC17 (card/game data), overlay runtime restored from RC16. Changed UI positioning only, preserved RC17 mandatory Swap fixes.

| Check | Result | Coverage |
|---|---|---|
| Syntax `app-runtime.js`, `app.bundle.js`, `db158-card-review.js` | PASS | `node --check` |
| Coin overlay exact viewport | PASS 4/4 | Desktop 1600x768, compact 1024x650, touch 820x580, portrait 390x844 |
| Hero Card Review open/close and viewport bounds | PASS 4/4 | Same viewports |
| Outer Card Review gray strip | Removed in Chromium screenshots | Inner Deck Builder panel itself remains charcoal |
| AI Mana right origin, in-pool containment | PASS for 3 horizontal layouts; portrait containment PASS | 3 visible starting Shards |
| Swap engine self-test | PASS 40/40 (desktop and touch) | Synthetic engine scenarios, not exhaustive match |
| VFX coordinate probe | PASS desktop and touch | Screen coordinates in same fixed-body layer |
| Page JS errors | 0 | Above targeted fixtures |
| Normal Firefox match through terminal | NOT TESTED | Open |
| All card motion types end-to-end | NOT EXHAUSTIVE | Open |

Visual comparison and manual Firefox confirmation still required. Never call this FINAL.
