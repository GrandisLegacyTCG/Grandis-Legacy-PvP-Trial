# Grandis Legacy PvP v2.6.16 — Release Note

**Date:** 14 August 2026  
**Scope:** Server-authoritative gameplay sync with OSA v1.4.2 and VS AI v5.59

## Fixes

1. First player Attack restriction is enforced in the shared PvP runtime path.
2. Tornado vs Spectral Grappling Hook resolves to exact 40 residual damage for Elementalist / Elemental Lord Tornado.
3. Double Casting + Brilliant Radiance preserves activation 2 and delays return-to-hand until the duplicated attack fully resolves.

## Regression test

Run:

```bash
node tests/run-v2616-gameplay-foundation.cjs
```

Expected result:

- `firstPlayerAttackRestricted: true`
- `tornadoSpectralResidual40: true`
- `doubleCastingBrilliantContinues: true`
