# Grandis Legacy PvP v3.25 — 2026-09-03

## Scope
PvP-only presentation/runtime-transport fix. Website, VS AI, Tutorial, Deck Builder, and Source Stack are intentionally unchanged.

## 1. Battle sound and VFX parity with VS AI

### Bug
The PvP server runs the shared battlefield runtime with rendering suppressed. The normal shared-runtime `queueBattleFeedback()` path therefore did not survive as a server-to-client presentation event. PvP attempted to reconstruct battle feedback later from HP deltas plus Card Played events, which was incomplete and could miss or misclassify battle feedback.

That made the following presentation unreliable in PvP even though the assets and VS AI presentation code were already present:
- Physical Attack — `P.Atk`
- Magical Attack — `M.Atk`
- Physical Defense — `P.Def`
- Magical Defense — `M.Def`
- Dodge
- Heal
- matching battle sounds

### Fix
- The shared runtime now records an exact `pvpBattleFeedbackEvents` ledger for PvP **before** render suppression can discard the visual queue.
- The server publishes newly resolved entries as authoritative `battle_feedback` animation events.
- The network client localizes the side/lane for Player 1 / Player 2 and forwards the exact event to the existing shared VS AI battle-feedback renderer.
- PvP therefore uses the same `P.Attack.png`, `M.Attack.png`, `P.Defense.png`, `M.Defense.png` and corresponding battle audio paths already used by the shared battlefield presentation.
- The old HP-delta reconstruction remains only as a compatibility fallback when an exact authoritative feedback event is unavailable.
- Client audio is unlocked from the first gameplay pointer/keyboard interaction so later server-authoritative sound events are not silently lost to browser autoplay restrictions.
- The HTML cache-bust marker was advanced to `gl-pvp-3.25-av-card-played` so browsers load the new PvP JS/CSS instead of retaining the v3.24 client files.

## 2. Card Played parity

### Bug
Human-vs-human PvP renders `Card Played` from `pvpActionEventsBySide`. Those PvP events were created when a card was committed, but the later VS AI-style resolution audit was being appended only to the Local Player / Opponent detail events. As a result, PvP cards could appear in the panel while their Response, damage breakdown, effect row, modifier audit, and final result remained incomplete.

### Fix
- Every committed PvP card action now stores its `pvp_event_id` and links the local detail event to the same authoritative Card Played entry.
- Generic support/tactical result updates are mirrored into the linked PvP Card Played event.
- Attack resolution applies the same `applyAttackAuditToEvent()` structure to the PvP event, including:
  - Effect Row
  - Damage Modifiers
  - Primary/base damage
  - Damage after modifiers
  - Defense/prevention
  - Final HP damage
  - Target HP before/after
  - conditional follow-up / Burn / Status results where applicable
- Defense events receive the final resolution result and are explicitly linked to their parent attack event, making the Response chain stable instead of relying only on lane/timestamp inference.
- Casting release events are accepted as the attack audit parent for Casting Attacks.
- Current responsive lock is enforced globally: **Card Played preview max 4, 2 columns x 2 rows**. Full Card History remains complete.

## 3. Preserved from v3.24
- Quick Reload / Rapid Chamber replacement draw correctly increments Aura Infusion Bolt Draw Counter.
- Visible Aura Attachment counter remains synchronized.
- `Draw This Turn` still counts actual draws.
- Automatic Draw → Deploy parity remains.
- Spectral Grappling Hook response cost/lineage, immediate Defeat → Legacy, Cover Up fresh Defense Window, sword attack indicator, Hero/Legacy display parity, mobile scroll behavior, and all other current runtime fixes remain in place.
- Source Stack v1.7.3 / Runtime Data v0.14.2 / Runtime Foundation v1.89 / Core v0.57 remain unchanged.
