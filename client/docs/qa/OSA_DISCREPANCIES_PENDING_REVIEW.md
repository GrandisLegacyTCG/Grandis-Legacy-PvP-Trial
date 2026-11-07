# OSA DEV45 — Candidate discrepancy backlog (NOT automatically modified)

- **No confirmed OSA defect** caused the 0-HP Hero/Legacy transition bug. Official S0 Legacy artwork/card text identifies matching Base Class. RC6 expected a S1-specific `eligibility.base_class_family` field that was not part of S0's consumed schema; RC7 now adapts source-backed S0 data properly.
- **No confirmed OSA defect** caused the Bard/Maestro discard CONDITION logic. All seven current Season 0 note-return requirements are present and their shared handler returns the selected physical cards to the Main Deck and shuffles after commit.
- **Prior unresolved source representation mismatch:** current S0 Health Potion and Greater Health Potion print artwork reportedly indicates HEAL 30/50 while the DEV44 text export omitted those numbers. This was noted before RC7 and needs source-authority clarification/reconciliation, not a silent new OSA revision.
- **No OSA ZIP or canonical pointer modified.** Any future official data correction should be reviewed and approved explicitly, and should not be inferred from S1 behavior or QA fixtures.

- **RC13 UI/source discrepancy (2026-11-04):** `S0-MAG-H007` Bromir Rank I current S0 DEV45 consumer metadata reports HP **80**, while its OSA-approved image prints HP **90** and Deck Builder v1.58 displays **90**. No canonical gameplay/data change authorized. Review source provenance with designer; RC13 displays official consumed value 80 rather than silently changing OSA.
