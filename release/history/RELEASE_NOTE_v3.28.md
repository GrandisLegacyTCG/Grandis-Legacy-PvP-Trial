# Grandis Legacy PvP v3.28 — Battle VFX live-path repair

Date: 2026-09-04

## Scope

PvP only. Source Stack v1.7.3 gameplay authority is unchanged.

## Fix

P.Atk, M.Atk, P.Def, and M.Def VFX/audio now replay from the **post-render authoritative state ledger** after the canonical server board has been imported.

The previous v3.27 route also transported a one-shot `battle_feedback` animation event. In a real browser that event could be consumed before the target Hero anchor was layout/paint-ready. Because the animation id was already marked seen, the VFX could disappear permanently even though the server had recorded the correct resolution.

v3.28 changes the client presentation path so that:

- canonical `pvpBattleFeedbackEvents` is the playback source after board render;
- the pre-import one-shot `battle_feedback` event no longer consumes VFX playback;
- Hero-anchor lookup is retry-safe for a bounded window when layout is not immediately ready;
- the exact VS AI battle assets remain in use:
  - `P.Attack.png`
  - `M.Attack.png`
  - `P.Defense.png`
  - `M.Defense.png`
  - corresponding P.Atk / M.Atk / P.Def / M.Def audio.

## Preserved

- Card Played UI parity from v3.26.
- Quick Reload → Aura Infusion Bolt Draw This Turn fix from v3.24.
- Exact-60 / normal max-3 / Ultimate max-1 PvP deck validation from v3.27.
- Source Stack v1.7.3.
