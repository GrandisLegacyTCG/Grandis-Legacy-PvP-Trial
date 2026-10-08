# Grandis Legacy PvP v3.75.4 — Release Notes

Date: 2026-10-08

## Purpose

Replace the remaining PvP v3.73.20 gameplay synchronization model with the proven PvP v3.51 authoritative handshake. The reported failure was not card-specific: Meditation, Steal, and paid Skills could advance or remain interactive on one browser while the other browser stayed on an older/pending presentation state.

## Changes from v3.75.3

- **Removed the general client gameplay intent queue.** PvP now allows one gameplay intent in flight at a time, matching the v3.51 transaction model.
- **No local gameplay re-render immediately after `sendIntent()` in PvP mode.** The acting browser waits for the authoritative server snapshot before advancing the gameplay presentation.
- Every imported server revision now runs authoritative pending/response synchronization before continuing the visible flow. Stale local decision UI is cleared from the imported canonical state.
- Added `applyingServer` protection so a second gameplay action cannot be submitted while a new authoritative board is being imported.
- Multi-step UI conveniences now use explicit **authoritative follow-ups**: step 2 is sent only after the snapshot for step 1 has arrived and been imported. This preserves convenience without recreating the v3.73.20 queue.
- **Steal / opponent Shard choice restored to the v3.51 protocol:** the client sends the server-issued opaque `choice_handle` plus the authoritative revision, not a client-side Shard array index.
- Center payment/choice visual busy state is reset from authoritative resolution/failure, preventing local presentation locks from surviving the committed server revision.
- Active diagnostics/comments were normalized to the current PvP release identity where safe; compatibility CSS/storage identifiers remain unchanged.

## Gameplay authority

No card balance, printed Mana cost, exact-payment formula, turn rule, or card effect rule was intentionally changed. This release changes the **client/network transaction lifecycle** so both player browsers consume the same authoritative progression.

## Versioning

This build is based on v3.75.3. The previously discussed experimental `.4` build is not part of the lineage; this package is the actual v3.75.4 candidate. Future maintenance releases continue with v3.75.5, v3.75.6, and so on.

## Manual verification target

Use two real browser sessions and verify at minimum:

1. Meditation resolves and both browsers leave the same pending state.
2. Steal reaches the blind opponent-Shard choice, accepts the choice, and both browsers resolve the result.
3. A paid Skill reaches Mana payment, PAY resolves, and both browsers advance/close the payment state.
4. Rapid double-clicking while a gameplay intent is in flight does not submit a second gameplay mutation.
