# RC7 release status — 2026-11-04

- **Release candidate** based on RC6; NOT a verified production-final build.
- Confirmed legacy-card eligibility mapping bug fixed; player/AI defeat transition targeted tests PASS.
- Bard/Maestro DISCARD → Main Deck → Shuffle CONDITION verified in 7 direct cases, 6 AI card commits, and 1 Player choice-to-PAY flow.
- Blessing of Accuracy duplicated Draw 2 fixed (now draws 2; not 4).
- Prior targeted lineage regression 6975 cases PASS.
- Full normal end-to-end browser match remains UNVERIFIED; older S1-specific parity tests still require triage.
- Official OSA DEV45 not changed.
- See `docs/qa/RC7_LEGACY_BARD_CONDITION_AUDIT.md` and `docs/qa/OSA_DISCREPANCIES_PENDING_REVIEW.md`.
