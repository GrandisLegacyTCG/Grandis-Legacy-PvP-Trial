# Grandis Legacy PvP v3.50 — Final Stability + Gameplay Correction Audit

Date: 2026-09-28

## Version / authority lock

- PvP: **v3.50**
- Website: **v1.39**
- VS AI: **unchanged**
- Tutorial: **unchanged**
- Source Authority: **unchanged**
- Player Rulebook: **unchanged**

## Final staged acceptance

- Render continuity: **PASS**
- Timer continuity / no `00:00` flash in focused Chromium stress: **PASS**
- Connection continuity / no unrelated-render signal reset: **PASS**
- Mobile Main Deck Draw at 390×844: **PASS**
- Desktop Draw regression: **PASS**
- Flashpowder Bomb counter Flashpowder Bomb: **PASS**
- Intercept nested counter chain regression: **PASS**
- Held Attack terminal cleanup: **PASS**
- Authoritative Attack VFX/SFX: **PASS**
- Authoritative Block VFX/SFX: **PASS**
- Authoritative Dodge VFX/SFX: **PASS**
- Authoritative Negate VFX/SFX: **PASS**
- Sound OFF: **PASS**
- Sound OFF → ON same-family playback: **PASS**
- Duplicate settled battle event replay: **NO / PASS**
- Custom Main Deck 50–60 inclusive: **PASS**
- 49 / 61 custom Main Deck rejection: **PASS**
- 55-card Set Deck → Ready → Match Start → runtime integration: **PASS**
- Deck name 25 visible characters: **PASS**
- Connection Bar outside identity container and aligned: **PASS**
- Reconnect handler integration: **PASS**
- Spectator hidden-information masking: **PASS**
- Surrender handler integration: **PASS**
- Canonical card coverage: **200/200 PASS**
- Active official Starter Decks: **5 PASS**, all remain 60-card Main Decks

## Integration evidence

Focused production-source tests cover canonical runtime intent resolution, server snapshot/public-animation construction, viewer-safe masking, production browser presentation bridges, responsive layout geometry, nested Response cleanup, custom-deck validation, reconnect/spectator/Surrender handlers, advanced status/attachment/casting runtime, Defeat/Revive/Legacy lifecycle, and Docker/local server import topology.

A true external two-client WebSocket server session is an **environment blocker in this sandbox** because the release intentionally excludes `node_modules` and the `ws` dependency is not installed locally. The final package therefore does not misrepresent a live external WebSocket run as passing; production handlers/runtime are verified with transport-only test harnesses, while live deployment verification remains external.

## Package policy

Final ZIPs must contain exactly one top-level repository folder and must exclude nested release archives, RAR/7z/tar, `node_modules`, `.git`, browser profiles, temporary extraction trees, and duplicate loose repository files at ZIP root.
