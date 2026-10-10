# Grandis Legacy PvP v3.78.1 — Consolidated Lobby + Coin Flip/Opening Stabilization

## Scope

v3.78.1 consolidates the two user-reported regressions into one versioned release. It does not introduce new gameplay rules or a new presentation system.

## Bug 1 — Lobby presentation donor parity

Observed regressions:
- `JOIN AS PLAYER` wrapped to two lines.
- Player 2 Kick `exit.png` rendered as an oversized raw-looking control.

Root cause:
- The isolated v3.76.6 Lobby had not carried every inherited donor presentation dependency. In particular the Lobby's donor typography context and `.pvp-seat-kick` / `.pvp-seat-kick img` rules were required in addition to the obvious Lobby markup/assets.

Fix:
- Restore complete donor Lobby typography/CSS dependencies used by the active Lobby.
- Keep `JOIN AS PLAYER` single-line at verified fixture widths.
- Keep donor Kick geometry: 28×28 control, 16×16 icon.
- Verify Lobby assets and fonts against the donor by hash and verify active local URL resolution.

## Bug 2 — Coin Flip / Start Game / Opening boundary

Observed regressions:
- Draw Card SFX could occur before Coin Flip had finished and before Start Game.
- Clicking Start Game could fail with `pvpOpeningStarted is not defined`.

Root cause:
- `pvpOpeningStarted` was referenced by the shared presentation runtime without an explicit declaration/reset lifecycle.
- The authoritative opening bridge ignored the requested hold-at-Draw behavior and advanced mandatory Draw/Regen too early.
- The PvP host could auto-acknowledge turn-start Draw before the v6 opening presentation had completed.

Fix:
- Explicitly declare/reset PvP opening state.
- Preserve Coin Flip until Start Game confirmation.
- Hold authoritative state at Draw during opening setup.
- Gate automatic `acknowledgePvpTurnStart` until `GL_PVP_OPENING_PRESENTATION_COMPLETE === true`.
- Mandatory Draw + Regen commit only after the existing v6 opening presentation completes.
- Cache the authoritative opening sequence so the second client can still consume it if its Start Game confirmation happens later.

## Architecture preserved

- Lobby presentation: PvP v3.76.6 donor.
- Game presentation/timing/interactions: approved VS AI v6.91.3 donor.
- Multiplayer authority/network/privacy/payment/state: PvP v3.51 donor.

No separate PvP Coin Flip, opening scheduler, Draw animation, phase tracker, EXP presentation, or second gameplay engine is introduced.
