# Grandis Legacy PvP v3.76.6

Targeted recovery build from v3.76.5 HF2.

## Scope
- Preserve the solved Lobby and low-memory/static-delivery work.
- Recover gameplay click routing for the visible v6 shell.
- Make Opening presentation gating self-healing instead of permanently blocking clicks.
- Lock the Phase Tracker to the VS AI v6.90.7 geometry by neutralizing the leftover v3.51 `min-height:58px` rule.
- Increase PvP player/deck identity readability without changing battlefield ownership.

## Authority
PvP v3.51 remains authoritative for server/network/gameplay. VS AI v6.90.7 remains the visible presentation donor.

## QA gates
- v3.76.6 interaction/geometry static checks.
- Headless Chromium CSS geometry check (no network navigation required): donor phase final geometry = 32px rail, 10px turn title, 7.4px phase labels, 24px action button.
- Candidate 3A intent router/canonical gameplay and Candidate 3C lifecycle regression.
- Runtime sync lock, root manifest, frontend manifest, duplicate audit.

## Contingency
A VS AI v6.90.7-first multiplayer rebuild remains possible if the current bridge still fails in live two-client play, but this build does not take that larger-risk path.
