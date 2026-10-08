# PvP v3.21 Update Summary

## Scope
Custom-deck legality only. Gameplay/runtime behavior is preserved from v3.20 HF2.

## Validation layers
1. Browser lobby import rejects custom decks outside 50/60.
2. Server `safeCustomDeck()` rejects custom decks outside 50/60 and copy-limit violations.
3. Shared runtime `validateDeck()` enforces 50/60, normal max 3, Ultimate max 1 before match initialization.

Starter decks remain 60 cards and are unaffected.
