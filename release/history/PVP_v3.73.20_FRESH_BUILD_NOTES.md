# Grandis Legacy PvP Fresh — v3.73 Build Notes (2026-10-06)

## Goal
Fresh PvP build combining:
1. **Network dari v3.51** — pola network/lobby yang terbukti stabil (intent lifecycle, ACK/snapshot recovery, reconnect)
2. **UI v6.90.7** — pristine, tanpa edit manual
3. **Perubahan lobby dari v3.72** — per 8 keputusan user

## Keputusan lobby (user, 2026-10-06)
1. Link "GO TO DECK BUILDER" / "GO TO VS AI": **HIDDEN** (bukan dihapus)
2. Room: **1 fixed room** (`GRANDIS_PVP`)
3. Counter PLAYERS/SPECTATORS: **HIDDEN** (untuk test)
4. Teaching View: **DIHAPUS**
5. Hero progression modal: **ADA**
6. Indikator koneksi di topbar: **ADA**
7. Maxlength nama: **25**
8. Kick: **`remove-seat`** (baru)

## Struktur
```
pvp-fresh/
├── server.js, server/, data/      # dari trial v3.72 (tidak diubah)
├── tests/                         # diupdate untuk fresh
├── public/
│   ├── index.html                 # PvP shell (title → v3.73)
│   ├── option-b-runtime.js        # v6.90.7 + restorasi UI + patch PvP minimal
│   ├── option-b-integration.css   # v6.90.7 + restorasi CSS
│   ├── config.js                  # version → v3.73
│   ├── engine/, card-art/, assets/ # dari trial
│   └── pvp/
│       ├── pvp-net.js             # network+lobby (dari pvp-v372.js, namespace pvpLobby)
│       ├── pvp-animator.js        # BARU: animation player
│       ├── pvp-lobby.css          # lobby CSS (dari pvp-v372.css, namespace pvp-lobby-)
│       └── pvp-presentation-adapter.js
```

## Perubahan kunci vs trial v3.72

### 1. option-b-runtime.js: restorasi fitur v6.90.7 yang dihapus trial
Trial menghapus 208 baris. Yang direstorasi:
- Choice popup preview system: `fixedChoicePreviewSlot`, `setFixedChoicePreview`,
  `bindFixedChoicePreview`, `placeContextualModalHoverPreview`, `bindContextualModalPreview`,
  `bindChoicePreview`, `candidateSourceZone`, `choicePreviewModeFromCandidateZone`
- `flyToHeroOrientation`, `queueOptionBSourceExpMotion`, `runTributeLikeHeroAction`
- Hero hover contextual placement (v6.89)
- `tributePanelAction` (klik panel hero untuk tribute)
- Call sites: `choiceCardTile(previewMode)`, `renderAllowedModal(choicePreviewMode)`,
  crystal ball `bindChoicePreview(im,id,'fixed')`, inspect grid
- CSS: `.ob-modal-hover-preview.is-context-hero`, `.ob-choice-fixed-preview-slot`,
  center choice UX block

Yang TETAP dihapus (sengaja, untuk PvP):
- VS AI match timer (`formatMatchTimer` dll) — PvP pakai server timestamps

Yang dipertahankan dari trial (patch PvP):
- `intent()` → `GL_PVP_NETWORK.sendIntent` routing
- Spectator guards
- Mobile click-to-preview
- `queueAuthoritativeOpeningSequenceVisible`
- `openInspectCards`, turn banner PvP, result screen PvP names

Script restorasi: `restore-v6907-ui.py` (13 operasi, semua OK, syntax valid)

### 2. pvp-animator.js (BARU)
Menggantikan jalur `GL_LOCAL_AI_BRIDGE` yang menelan animasi.
- Two-phase: `prepare(evt)` sebelum import snapshot (capture rect dari DOM),
  `play(plan)` sesudah render (fly ke anchor Option-B yang visible)
- Menangani: `card_play`, `tribute`, `hand_to_discard`, `attachment_to_discard`,
  `legacy_to_deck`, `held_card_release`
- Layer animasi sendiri (fixed, z-index 30000, pointer-events none)
- `draw`/`shard_gain`/`rank_up`/`legacy_to_field` tetap via jalur diff renderNow

### 3. Lobby (pvp-net.js + pvp-lobby.css)
- Namespace: `pvp370*` → `pvpLobby*` / `pvp-lobby-*`
- Hidden: top-actions nav, `#pvpLobbyStats`
- Tetap: connection indicator, maxlength 25, `remove-seat` kick
- Baru: hero progression modal (port dari v3.51, pakai `E().getHeroProgression`)
- Baru: card preview modal sederhana (`openLobbyCardPreview`)
- Room label: "CURRENT ROOM: GRANDIS_PVP" (statis, 1 fixed room)

## Test
- `npm test`: PASS (syntax, static, runtime, server-sim, battle-feedback)
- Browser smoke test (2026-10-06):
  - Semua 12 resource lokal return 200
  - Lobby DOM: semua ID ada, `#pvpLobbyStats` hidden, top-actions hidden,
    maxlength nama 25, room label "GRANDIS_PVP", coin modal ada
  - Animator: card_play, tribute, hand_to_discard, opponent card_play,
    held_card_release semua PASS; draw correctly skipped
  - Hero progression modal: 3 rank tampil, klik buka card preview — PASS
- Catatan: headless Chrome di environment ini tidak bisa render (limitasi env),
  smoke test dilakukan via jsdom + resource check. Disarankan test manual
  2-player di browser beneran sebelum deploy.
