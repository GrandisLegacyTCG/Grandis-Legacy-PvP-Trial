> Historical Stage 3 receipt, superseded for current starters/artwork by `STAGE4_HANDOFF.md` and `TAKEOVER_NOTE.md`.

# Grandis Legacy — VS AI Season 0 — Stage 3 Handoff

Status: **S0 DEV45 authoritative data materialized** into the original v6.91.9 app source; **NOT PLAYABLE / NOT CERTIFIED**. No existing S1 printed card data is imported.

- **Read only OSA DEV45**: original current DEV45 release pointer, current DEV44 consumer pointer, all 7 SHA256-pinned exports were checked.
- `runtime/season0-authority/*.json`: seven byte-exact current exports, plus pointers.
- `runtime/season0-generated/*.json`: 242 cards in app registry (187 Main + 45 Hero + 10 Legacy), 6 separate Mana faces, 426 printed effect branches and 36 compound handler bindings; all derived from S0.
- `engine/js/static-data.js`: replaces S1 globals with source-backed S0-only card metadata and printed recipes; **effect dispatch remains pending Stage 5**, no false claim that parsed opcodes are executable.
- `engine/shared-app/app.bundle.js`: only startup source/count/hero checks and generic S0 identifier recognition adapted, maintaining the original transaction authority. Existing special-effect ID routes and AI **not** adjusted in this stage.
- The active five starter decks and artwork are still Season 1 (Stage 4 will replace). No S1 fallback for card name/cost/printed text/rules was introduced.

**A key boundary:** Stage 3 validates SOURCE & DATA BINDING. The existing VS AI S1 engine has considerable hard-coded S1 card IDs / effect paths. It must NOT be treated as gameplay-correct until Stages 4–7 complete. Do not release, publish or start playing this working snapshot as Season 0.

**Next:** Stage 4 replace starter deck and copy SHA-verified 248 S0 fronts + 3 current backs; then Stage 5 source-grounded effect translation/handler routing; Stage 6 AI; Stage 7 browser complete-match QA; Stage 8 final ZIP.

## Verifikasi aktual

PASS: `node runtime/season0-generated/check-consumer-stage3.cjs`; PASS: `node --check engine/js/static-data.js` dan `node --check engine/shared-app/app.bundle.js`. Percobaan browser Chromium tidak dapat dijalankan di lingkungan ini (`ERR_BLOCKED_BY_ADMINISTRATOR` untuk URL lokal dan file). **Browser boot, UI, efek, AI dan complete match belum diverifikasi**.
