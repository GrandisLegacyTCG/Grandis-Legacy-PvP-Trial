# Grandis Legacy PvP v3.80.11 — 2026-10-12

- Keeps the confirmed v3.80.10/v6.91.6 Mana PAY handshake unchanged.
- Unifies mobile/tablet PvP lobby geometry with the desktop composition through scale-to-fit; touch hover/review behavior is preserved.
- Restores mirrored battlefield identity placement: opponent top-left, local player bottom-right, with connection bars on the agreed sides and 25-character display rules.
- Response focus now applies while either seat owns the Response Window; when waiting, the local client shows `WAITING FOR OPPONENT RESPONSE...`.
- Legal Hero Response buttons remain above the dim layer without lighting the whole Hero box.
- Battle VFX are decoded early, battle audio is primed early, and authoritative battle feedback is flushed before the full battlefield re-render to reduce tablet latency.
- Lobby player seats idle for 60 seconds are automatically moved to Spectator.
- Started-match players idle for 180 seconds automatically surrender from server authority.
