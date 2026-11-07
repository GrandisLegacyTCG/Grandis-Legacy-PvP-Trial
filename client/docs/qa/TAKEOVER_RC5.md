# Takeover — VS AI Season 0 RC5

- Baseline: VS AI S1 v6.91.9 code, OSA S0 DEV45 canonical/DEV44 consumer data, RC4 Stoneblood AI resume fix retained.
- Gameplay changes: source Hero legality for normal Events, S0 Item target/status/heal/revive adapters, Greater Potion exhausted-target correction, real Relentless Leveling Hero→EXP flow.
- UI changes: Deck Builder v1.58 review look (iframe-isolated CSS), Hero review has no progression footer; no battlefield redesign.
- AI follows same Event source and Item target legality as human.
- QA: 13/13 direct source/target stateful tests; 3 review browser render tests; 32 Item/Event route matrix checks; syntax and ZIP integrity.
- Known open: full normal browser match UNVERIFIED, some older broader QA hooks fail in RC4 and RC5; see QA report. Official OSA has not been modified. No PvP/Deck Builder updates.
- Next: browser full-match QA, triage legacy regression hooks only where actual S0 playability impacted; resolve source-heal-text discrepancy in separately versioned OSA authority if designer authorizes exact corrected fields.
