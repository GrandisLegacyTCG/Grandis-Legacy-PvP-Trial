# Grandis Legacy PvP Season 0 RC39 — Repo RC8: VS AI UI/Rules Parity

**Date:** 13 November 2026  
**Base:** PvP RC7 UI Cleanup FULL, 13 November 2026 (contains RC5 Mana continuation/blink correction).  
**Donor:** VS AI RC39, CardPlayed / Banners / AI UI Update, 13 November 2026.  
**Networking:** RC6 Stage 2 / S1, a single parent WebSocket, no new message types or per-card network calls.

## Adopted A01 — Attack subtype and Intercept

- Intercept checks the printed **Physical Attack / Magical Attack** subtype; an Area Attack does not qualify merely because it deals Physical/Magical damage.
- Enrage, Blessing of Might/Wisdom, Arcane Scroll, Holy Medallion, Coordination Attack, and Wings of Valor use donor subtype applicability in the server-side Attack modifier breakdown. Actual damage type is still retained where appropriate for rendering.
- No changes to manual target choice, Response ownership, atomic intents or server authority. AI-only strategy/planning from VS AI is intentionally **not** ported.

## Adopted A02 — Important effect notifications and owner-visible discard

- Server records **confirmed** opponent-caused Hand, Main Deck, Field, and **EXP** card movement to Discard by comparing canonical before/after states. EXP notes include the public Hero originally holding the EXP card.
- The affected player receives names/counts/origin and one notification on the same existing event delivery channel. The actor and spectator receive no private Discard detail. Truly ambiguous intermediate moves are labeled UNKNOWN rather than guessed.
- Mana Burn/Steal Card Played results contain count removed, type of shards disclosed to the affected owner, and number of shards actually gained by Mana Steal. No real Mana Shard UIDs or blind-choice order are exported.
- Attachment of recipient-private effect details to Card Played uses exact action ID where known. Fallback is only allowed when there is exactly **one** matching action; duplicate identical cards do not inherit unrelated discard history.
- Played Skill/Event/Legacy actions can expose selected *already-discarded* cards or counts of cards moved from Main Deck. Moves into a hidden Hand disclose counts, not identities.

## Adopted A03 — Card Played timeline and Response links

- Keep PvP blue **YOU** / red **OPPONENT** bottom badges; no RESOLVED thumbnail/diagnostic labels.
- Discarded cards that this recipient may identify appear as independent **DISCARDED** Card Played entries. Same entries remain clickable for Card Review; discarded Hero EXP names its Hero and cause.
- Card Played Detail now shows committed effect results, target Hero, actual HP damage and HP-before/after, Multi-attack per-Hero sum, Healing restored, and status counter progression.
- Related Response/Counter cards link from their parent via existing public chain IDs and `response_to_event_id`; click artworks to inspect. No extra socket, RPC, or HTTP fetch for gameplay information.
- Bounded history (260 entries), keyed DOM update signatures, event-level seen sets for sound/VFX and notices. Duplicate server snapshots never produce new action animations for an already-seen action.

## Adopted A04 — Computed Damage Banner

- Always centered above battlefield, showing **one Attack name and calculated damage** while Response is pending; remove `(before Response)`, lane words and redundant floating damage.
- Default: `Aether Slash — 60 Magical Damage`.
- Modifier: `60 Magical Damage → 80 Magical Damage` only when values differ.
- Formula-driven skills show the numeric input on the same single banner, e.g. `Arrow Barrage — 10 × 6 Mana Shards = 60 Physical Damage`. A modified result can append `→ 80 Physical Damage`.
- Formula support: Arrow Barrage, Runeforged Burst, Crimson Crescendo, Colossal Dreadbolt, Mana Void. All formula inputs are numbers taken from the server engine's accepted Attack context; the nested raw action object is not sent to spectators/opponents.
- Visual grouping does **not** combine the underlying attacks or skip per-target Responses.

## Adopted A05 — Card Review loading and smoothness

- Prewarm already-static Card Review styles on idle (save-data aware), not on critical lobby startup.
- Keep one same-origin `srcdoc` iframe per preview location; change card with `postMessage` instead of a new frame navigation. Reopening the same card uses the existing cached frame without repaint.
- Report `GL_S0_REVIEW_READY` after fonts/artwork, with a bounded fallback timeout. Until then the Card Review body shows a small loading label rather than a half-rendered card.
- No additional WebSockets, no authority changes, no global `innerHTML` refresh for every preview selection.

## Authority, privacy and performance invariants

1. RC6 Stage 2 single WebSocket and the original WebSocket intent/ACK path remain byte-identical to RC7. No second socket, external service or network protocol introduced.
2. Local Mana selection and server-side opaque selection remain untouched. Selection still requires exactly one final authoritative commit.
3. No hidden opponent Hand/Deck identities or physical Mana UIDs included in viewer/spectator-safe snapshots; only the affected player's discard notices have private card identities. Spectator projection strips recipient-private events and aliased effect fields.
4. Animation/sound play from server-committed results. Avoid redundant UI overlays and duplicate presentation on repeated snapshots.
5. Existing PvP important notices retain **+1 second compared with VS AI**; sound and motion timing remain responsive.
6. Match rules remain server-authoritative. No AI strategy or intermediate-mode behavior included.
7. **No `grandislegacy.web.id` promotion, VS AI/Deck Builder navigation buttons, GitHub push or Northflank deployment.** Those are intentionally deferred until after VS AI RC40.

## Verification performed

- `npm run check:syntax` — PASS.
- `npm run test:rc8` (17 new donor/adoption/privacy checks + RC7/RC6 focused, Mana, existing privacy, donor parity, and RC6 Stage 2 transport/Response) — PASS.
- Real headless Rank Up / Local Draft / blind Mana source tests — PASS.
- Native and fallback WebSocket transport smoke, single socket, seat and Response tests — PASS in QA environment.
- `npm run build:precompress` plus `npm run test:assets` and `npm run test:http` — PASS.
- Historical test harnesses made version-agnostic where RC3/RC7 version literals became obsolete; retained network source-hash invariants explicitly compare against RC7, and do not pretend changed viewer-safe modules remain byte-identical.
- `npm run check` — run with the final RC8 source before release and record result in the external release notes.

## Manual verification still required

- Two real browsers on Northflank or equivalent: repeated Arrow Barrage/Area Attack with separate Response choices; Intercept attempted on Area vs normal Attack; buff stacking in damage banner; forced Scouting EXP discard and Calculated Plan Hand discard (both seats and reconnect); Mana Steal/Burn choice and result; Response counter chain and Card Played navigation; card-review switch when thumbnails are loading; audio on both players under real latency; 1v1/mobile UI and hidden/spectator identity checks.
- No automated suite can claim visual timing, sound output or live Northflank performance has been verified on a user's actual devices.
