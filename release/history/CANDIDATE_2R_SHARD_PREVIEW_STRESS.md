# Candidate 2R Shard Preview Stress

| Family | Viewport | Transition count | Candidate 15 fail | PvP fail | Candidate 15 unexpected Detail | PvP unexpected Detail | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| Tablet Landscape | 1180×820 | 20 | 0 | 0 | 0 | 0 | PASS |
| Tablet Portrait | 768×1024 | 6 | 0 | 0 | 0 | 0 | PASS |
| Phone | 390×844 | 12 | 0 | 0 | 0 | 0 | PASS |

Tablet Landscape used native touch emulation for the 20-transition stress sequence. Tablet Portrait used native touch emulation. Phone used the stable touch-first A/B parity route; a separate forced-scroll native-touch diagnostic was excluded because it changed the exact-reference side's event route while the PvP side remained correct, making that diagnostic unsuitable as parity evidence.

No timers, debounce, suppression counters, or new global click handlers were added to production source.
