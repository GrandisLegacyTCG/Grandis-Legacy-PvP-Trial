# Candidate 3C — Defeat / Legacy Audit

## Result

**PASS**

## Canonical ownership

Defeat is decided only after final applied HP/state is known. The active runtime keeps defeat processing behind canonical checkpoints and mandatory defeat gates; the browser does not submit a "Hero defeated" result.

## Verified cases

| Case | Result | Evidence |
|---|---|---|
| Normal lethal Hero defeat | PASS | Candidate 3C lifecycle test |
| Ranked Hero defeat | PASS | Rank II Hero defeated and sanitized before Legacy transition |
| EXP cleanup | PASS | `GL_V1410_EXP_CLEAR_QA_SELF_TEST` |
| Status cleanup | PASS | Candidate 3C lifecycle + defeat cleanup QA |
| Attachment cleanup | PASS | defeat cleanup QA |
| Casting cancellation on defeat | PASS | `GL_PHASE12_CASTING_DEFEAT_CANCEL_QA_SELF_TEST` + bridge cleanup QA |
| Multiple Heroes defeated by one Area resolution | PASS | Whirlwind sequential target/Response lifecycle |
| Stoneblood use resumes Area queue | PASS | Candidate 3C targeted regression |
| Stoneblood decline -> Legacy resumes Area queue | PASS | Candidate 3C targeted regression |
| Legacy replacement | PASS | canonical mandatory choice and commit |
| Wrong-seat Legacy choice | PASS | central intent-router ownership rejection |
| Stale old-Hero component after replacement | PASS | rejected without authoritative mutation |
| Third/final Hero defeat | PASS | terminal state reached exactly once |
| Duplicate lethal delivery | PASS | intent idempotency + single terminal event |
| Post-match gameplay mutation | PASS | central match-status rejection |

## Lifecycle corrections

### Stoneblood / Area continuation

Candidate 3B used the generic defeat-gate predicate for both `legacy_defeat_choice` and `racial_stoneblood`, but stored the multi-target continuation only as `after_legacy_multi_sequence`. `resolveStonebloodChoice()` did not own that field, so the remaining targets could be dropped. Candidate 3C now carries a Stoneblood-specific multi continuation and transfers it to Legacy only when Stoneblood is declined and Legacy becomes the next mandatory gate.

The same audit found that the single-target response tail had an unreachable Stoneblood-specific continuation because the broader defeat-gate condition caught Stoneblood first. Candidate 3C separates these branches so Stoneblood resumes the canonical post-attack continuation rather than silently losing it.

### Multi-target completion after a mandatory defeat gate

Candidate 3C adds one continuation helper that either opens the next original Area target or, when all original targets are complete, finalizes the same source-card/post-attack lifecycle used by the normal response path. It does not create a second card rule engine.

## Legacy privacy

Server viewer-safe serialization remains unchanged. Opponent and spectator Legacy Deck identities are masked; private pending choice data is masked for non-owners. No terminal-state exception was added to reveal private Legacy order.

## Simultaneous end / draw

**N/A for Candidate 3C.** Current canonical terminal authority exposes single-winner defeat/deck-out handling and no separate simultaneous-draw rule. No test-only priority/draw rule was invented.
