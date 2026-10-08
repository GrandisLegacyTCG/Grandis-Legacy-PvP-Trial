# Grandis Legacy PvP v3.75.6 — Architecture Donor Map

| Area | Active donor | Notes |
|---|---|---|
| Authoritative gameplay/runtime | PvP v3.51 | Canonical gameplay contract on server and browser. |
| WebSocket/gameplay transaction lifecycle | PvP v3.51 | Single in-flight intent; authoritative snapshot before next step. |
| Pending choice lifecycle | PvP v3.51 | Rehydrate/close from authoritative snapshot. |
| Mana payment rules/backend | PvP v3.51 | `selected_class_uids` + automatic Mana Shards; no v6/.73 exact-payment authority. |
| Hidden opponent Shard selection | PvP v3.51 | Opaque choice handle + revision. |
| Private/public information boundary | PvP v3.51 | Private Hand/draw state never becomes public merely because it was drawn. |
| Battlefield UI/UX | VS AI v6.90.7 | Latest presentation and interaction skin. |
| Payment/choice visual presentation | VS AI v6.90.7 | Visual only; commits v3.51 authoritative intents. |
| Lobby/start/opening presentation | pvp-fresh v3.73.20 + latest UI assets | Presentation donor only; room/ready/start authority stays on v3.51 network flow. |
| Repository naming/layout | PvP v3.51 | `public/js`, `public/css`, `public/shared-ui`, `public/assets`. |

## Explicitly excluded from v3.73.20 gameplay

The following experimental systems are not allowed to become gameplay authority in v3.75.6:

- queued gameplay intents (`intentQueue` / `pumpIntent` model),
- immediate local gameplay render after sending a network intent,
- universal exact-Shard payment as the PvP gameplay contract,
- client-index based hidden opponent Shard selection,
- any gameplay step that advances one client before an authoritative board revision is received.

## Presentation adapter boundary

The v6.90.7 UI may present the v3.51 state in newer controls, but it must not create a second gameplay engine. For example, the PAY MANA screen may visually show which Mana Shards will be auto-used, but only v3.51 Class Shard selections are interactive and the authoritative commit remains `handleChoiceConfirm` / v3.51 payment resolution.
