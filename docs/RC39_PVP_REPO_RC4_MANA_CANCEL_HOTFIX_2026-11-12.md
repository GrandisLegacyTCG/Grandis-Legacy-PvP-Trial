# Grandis Legacy PvP Season 0 RC39 — Repo RC4 Mana / Cancel UI Hotfix

**Based on:** Repo RC3 Gameplay UI Parity (2026-11-12).  
**Build ID:** `gl-s0-pvp-rc39-beta2-repo-rc4-2026-11-12`.  
**Release status:** Trial hotfix for user-led multiplayer test; not production certified.

## Symptoms reported

- `Runtime action was not legal or no pending choice accepted: commitOpponentManaSelection` when selecting an opponent Mana Shard.
- The **CANCEL** action appears in the other player's viewport while one player is making a choice.
- Slow server requests show an intrusive `Synchronizing ...` message.

## Focused corrections

1. **Blind Opponent Mana choice — one authoritative transaction.** The local browser toggles `selected_indices` on the public, opaque choice list without a network request per click. CONFIRM sends only revision + opaque HMAC handles in one intent `commitExactOpponentManaSelection`. Server maps handles against its own revision-bound shuffled candidate list, validates exact count/uniqueness/current owner, then applies all selection toggles and final `commitOpponentManaSelection` inside one engine action / one revision. Invalid, stale, duplicate or forged handles are rejected. No card ID, physical Mana UID, or hidden deck data is sent to the client. Legacy direct raw-index network intents are rejected; Response and Mana Payment RC5 are unchanged.
2. **No animation race.** CONFIRM dispatches the authoritative commit before the visual Mana flight, which uses detached face-down clones. The UI cannot delay the transaction or reveal a blind Shard prematurely.
3. **Owner-only CANCEL.** The main phase Cancel button now requires `pendingOwner(p)==='PLAYER'`. The old unconditional fallback for `manual_reposition` is removed. Correct player still retains pre-commit cancel.
4. **No sync messages on screen.** Removes the `Synchronizing <intent> with server…` slow-request toast, and uses plain connection error text if an operation truly times out. Network resynchronization itself remains enabled in the background.
5. **Asset cache invalidation.** RC4 build ID and versioned CSS/JS URLs updated, with Brotli/Gzip assets regenerated. Favicon from RC2/RC3 retained.

## Testing performed (intentionally limited)

- JavaScript syntax for modified server/browser code: **PASS**.
- `node tests/rc39-rc4-blind-mana-and-cancel.mjs`: **PASS**, both PvP seats using the real headless RC39 engine and a Provoke-driven opponent Mana decision. Checks exactly one revision for the selection+commit, removal of the chosen physical shard, hidden choice handles, and Cancel/sync source guards.
- No full `npm run check`, no 2-device live session, no browser visual QA. User will test at PvP Trial.

## Suggested manual test

1. Test Mana Burn, Mana Steal and Provoke with Player 1 and Player 2, including several face-down candidates, **CONFIRM** and deselection.
2. During an opponent card/source/target decision, confirm the passive player's main **CANCEL** button stays hidden; the active player still gets CANCEL where the choice is optional/pre-commit.
3. Delay a network action intentionally; there should be no `Synchronizing ...` banner. Actual disconnection errors remain visible.
4. Re-test ordinary own Mana PAY and Response, which have not been redesigned.

**Deployment:** Manual GitHub and Northflank only. Neither was modified to make this ZIP.
