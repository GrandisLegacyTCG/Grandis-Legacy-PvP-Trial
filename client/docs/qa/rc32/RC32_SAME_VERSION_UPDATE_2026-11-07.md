> **Later QA correction (same RC32, 2026-11-07):** The Escape Arrow `26/27` regression failure below was traced to invalid synthetic test setup, not gameplay. Current focused result is **27/27 PASS**. See `RC32_ESCAPE_ARROW_REGRESSION_CORRECTION_2026-11-07.md`. Historical evidence below remains unchanged.

# Grandis Legacy VS AI Season 0 — RC32 same-version update (2026-11-07)

**Baseline:** previously released updated RC32 ZIP (stored separately as a backup). **Authorization:** designer explicitly requested merging all previous approved work plus Primal Strike Physical Attack animation/sound, without increasing RC number. **Status:** release candidate, NOT FINAL.

## Included approved work

1. **EXP Stack:** actual Battlefield ready-Hero physical artwork geometry, with top/bottom inset of 1 CSS px each; fixed 7 px exposure per EXP card, independent of Rank. Exhausted-Hero behavior retained.
2. **Unified Discard:** Bard-style foreground choice and explicit quantity confirmation for Legacy Ability, Escape Arrow/Response discard, hand-limit cleanup, God's Blessing and comparable Hand discard choices. Response with Mana: select discard → continue to Mana → PAY; cancel/rollback preserved.
3. **Mana Regen / Deck counters:** consistent black-background white-text Main/Legacy/Mana Deck counters; blue `+N` Regen badge with matching typography. Player Regen upper-left; opponent Regen lower-right of Mana Deck, opposite its lower-left count. Desktop +2 px fonts retained where previously approved, mobile remains compact.
4. **Poison Vial Card Review:** show Archer/Thief/Warrior (all ranks), and the designer-approved Skill Card / actual Physical damage / Poison 2 turns trigger. This fixes the Review presentation; gameplay mechanics and OSA exports remain unchanged.
5. **Grand Finale Card Review:** display shared CONDITION (Zol, Lun, Vae return), INVINCIBLE through start of next turn, Draw 3 cards, plus Bard 60 / Maestro 90 damage rows and printed Ultimate restriction. Presentation only; existing local gameplay designer override retained.
6. **Thief artwork:** exact supplied images `S0-THF-H001` through `S0-THF-H007` (color/art revision only). H008 and H009 unchanged; no card stats/abilities altered.
7. **Primal Strike feedback:** when its ability-damage Response resolves, the engine queues existing Physical Attack VFX (`P.Attack.png`) and SFX (`P.Atk.mp3`) with normal block/dodge presentation outcome routing, for both player/AI pathways. No change to Racial Token consumption, target legality, Damage, Response, or Skill-only on-damage triggers such as Poison Vial.

## Evidence and limitations

- Controlled Chromium production-selector counter/Regen fixture: **15/15 PASS** (desktop, mobile, adaptive).
- Controlled Chromium EXP geometry fixture: **5/5 PASS** (including compact, Rank, landscape and unchanged Exhausted behavior).
- Controlled Chromium Unified Discard fixture (actual scripts/engine and injected states): **26 PASS / 1 FAIL**. The FAIL is the existing `GL_V511_ESCAPE_ARROW_QA_SELF_TEST` (`Escape Arrow response unavailable`), which also failed on the untouched original RC32. This is **unresolved; full natural Escape Arrow Response NOT VERIFIED**. Do not mark as PASS.
- Controlled Chromium Card Review model/renderer: **8/8 PASS** for the two updated cards and unrelated Item/Skill smoke checks; complete hosted iframe/loading interaction NOT VERIFIED because HTTP navigation was administrator-blocked.
- Controlled Chromium actual Primal Strike engine resolver with injected match state: **PASS** for declared Response, 20 HP damage, one Physical Attack VFX event, existing Physical SFX routing, and no Skill behavior added. Full played-match audiovisual observation NOT VERIFIED.
- Local source JS `node --check`, supplied artwork integrity, ZIP CRC/source-delta checks: see QA JSON. Full naturally played Human vs AI match, native Firefox, and real browser audio output remain NOT VERIFIED.

## Authority

OSA Season 0 archive and generated authority/consumer data are unchanged. The existing post-snapshot Poison Vial/Grand Finale designer artwork/text revisions and the seven new Thief front images remain local app-side overrides pending OSA synchronization. Do not mistake altered artwork bytes for the OSA manifest's old asset fingerprints. The latest explicitly approved designer rulings override older snapshots for these specific items.
