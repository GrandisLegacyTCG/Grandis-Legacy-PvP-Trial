# Release Note — Grandis Legacy PvP v3.32

Date: 2026-09-04

## Scope

PvP only. VS AI v6.25 is the presentation reference. Website, Deck Builder, VS AI, Tutorial, and Source Stack v1.7.3 are unchanged.

## Runtime parity repair

### Battle sound + VFX

Reported runtime failure: Physical Attack, Magical Attack, Physical Defense, and Magical Defense had no visible/audio feedback in live PvP even though previous source-marker tests passed.

v3.32 changes the delivery policy instead of adding another one-shot marker:

1. Prefer fresh `pvpBattleFeedbackEvents` from the imported authoritative board.
2. If that ledger is absent, recover `battle_feedback` from the server `lastAnimationEvents` plans.
3. If neither exact source exists, do not suppress VS AI-style state-delta battle presentation; let the imported authoritative state delta derive the presentation.
4. Exact feedback still runs only after the authoritative board has rendered, with the existing retry-safe Hero anchor behavior.
5. Mobile `touchstart` joins pointer/keyboard audio unlock paths.

The four battle image and audio assets were compared against VS AI v6.25 and are byte-identical.

### Live lobby player names

The remote name is now bound directly from the live room snapshot after battlefield render. `OPPONENT` is only a true fallback when no remote name exists. Dedicated header nodes let the network adapter update the name/deck presentation without rebuilding the battlefield.

### Mobile hamburger

The cross-app three-line hamburger is now lobby-only. Active gameplay:

- stamps `data-pvp-gameplay-active="1"` on `body`;
- sets the button/menu hidden state directly;
- forces `display:none`, `visibility:hidden`, and `pointer-events:none` inline;
- has a final mobile CSS guard based on actual `pvp-lobby-mode` rendered state;
- refuses menu opening from `mobile-app-nav.js` while gameplay is active.

### Internet signal indicator

A four-bar signal icon is rendered beside the player name/deck for both sides.

- Local quality uses measured app-level WebSocket RTT.
- The local RTT is reported with heartbeat pings; the server returns the opponent's last reported RTT so the remote indicator can show signal quality too.
- Connecting and offline states are explicit.

## Preserved behavior

- Mobile Hero action / Racial Trait authoritative routing.
- Hero/Legacy size parity guards.
- Card Played parity.
- Quick Reload / Aura Infusion Bolt Draw This Turn fix.
- Exactly 60 Main Deck cards, normal max 3 copies, Ultimate max 1 copy for PvP validation.
