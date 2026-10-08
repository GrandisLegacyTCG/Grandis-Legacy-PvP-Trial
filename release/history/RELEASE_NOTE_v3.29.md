# Grandis Legacy PvP v3.29 — Mobile/UI parity and authoritative presentation repair

Date: 2026-09-04

## Scope

PvP only. Source Stack v1.7.3 gameplay authority is unchanged. VS AI v6.25 is used as the UI/presentation reference; multiplayer ownership, response waiting, hidden information, and server-authoritative intent behavior remain PvP-specific.

## Fixes

### Mobile in-match navigation

- The cross-app three-line hamburger is hidden after a player enters an active battlefield.
- Lobby/navigation behavior is preserved outside the match.

### Mobile Hero Racial Trait control

- The upper-right Hero action star is now treated as a local UI opener, matching the VS AI interaction model.
- Opening the action menu does not mutate gameplay state.
- Choosing a Racial Trait, Class Ability, or Legacy Ability still routes through the authoritative PvP server intent path.

### Hero / Legacy card-size parity

- Legacy artwork now uses the same card-relative sizing anchor used by normal Hero artwork.
- Existing VS AI Hero/Legacy metadata-overlay and mobile attachment-band parity CSS is preserved.
- The goal is equal Hero and Legacy card display dimensions rather than shrinking the Legacy artwork to make room for metadata.

### Lobby player names in gameplay

- The name typed in the lobby is committed when Ready is pressed, even if the player did not separately press Change Name first.
- Server `pvpPlayerNames` is rendered on the battlefield.
- Local/opponent name mapping follows seat mirroring, including Player 2.
- Generic `PLAYER` / `OPPONENT` text is only a fallback when no valid lobby/server name exists.

### Battle VFX / audio

- P.Atk, M.Atk, P.Def, and M.Def feedback is diffed from fresh authoritative `pvpBattleFeedbackEvents` after canonical import.
- Playback is dispatched after two render frames so Hero anchors/layout are available.
- The generic state-delta presentation explicitly skips battle feedback to prevent double playback.
- Initial/reconnect snapshots do not replay the historical battle-feedback ledger.
- The existing retry-safe Hero anchor logic and VS AI battle assets/audio remain in use.

## Preserved

- Card Played presentation parity from v3.26.
- Quick Reload → Aura Infusion Bolt Draw This Turn fix from v3.24.
- PvP exact-60 Main Deck validation.
- Normal cards maximum 3 copies per card.
- Ultimate maximum 1 copy per card.
- Source Stack v1.7.3.
