# RC13 — Deck Builder v1.58 review-only QA

Scope: presentation parity and closing UI. OSA DEV45 card authority unchanged.

- 2 focused desktop screenshots/DOM tests (Bromir, Shield Blast): correct headers/stats/effect rows, card art and one visible modal. Close `×` works.
- 18 responsive smoke cases: 9 card IDs × desktop/mobile (390×844) render without JS errors.
- Real `<iframe srcdoc>` script/stylesheet loading using intercepted resource routes: both review scripts and original Deck Builder CSS loaded; 2/2 close clicks and images succeeded. Parent-game audio was not part of this test; the QA stub did not URL-decode audio paths.
- OSA mismatch: Bromir Rank I metadata HP80 vs image/Deck Builder HP90; explicitly pending designer/source review, no value changed.
- No normal full-match Game Over QA. RC13 remains release candidate.
