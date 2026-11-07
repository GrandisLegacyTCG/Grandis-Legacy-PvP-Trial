# Grandis Legacy — VS AI Season 0 | v1.0 RC26 — Consolidated Update (2026-11-06)

**Baseline:** original RC25; **release:** RC26. OSA Season 0 DEV45 / other applications remain READ-ONLY. Package contains one enclosing app directory. This is a **RELEASE CANDIDATE, NOT FINAL**.

## Changes included in RC26

1. **Hybrid/Dual Class source authority:** all 10 hybrid Rank II/III Heroes now retain both source-backed base Lineages in the in-app card adapter, including Melody Bard/Maestro access to legal Archer Rank I `Escape Arrow`. The separate base Class's Rank II/III promotions are **not** automatically granted. This applies to PLAYER/AI, normal Skill use, and Response legality.
2. **Card selection behavior:** click a different card when selection slots are full to replace the most-recent tentative selection; clicking selected card deselects. Includes single/multi-card Legacy and other selection flows. No payment or state commit before the existing confirmation.
3. **Response PLAY focus:** eligible Hand cards and their PLAY buttons now render above the darkened focus veil, while keeping Hand absolutely positioned and preserving the 65% dimmer for unrelated controls.
4. **Class Ability card hover:** preview stays visible while mouse remains over the card despite periodic re-render, docks to the left or right outside the selection cards, adjusts size to viewport, closes on pointer exit. It does not change clicking/selection behavior.
5. **Holy Barrier and Sacred Bulwark:** allied-source Defense BLOCK is calculated using the legal Skill **user**, not the attacked recipient. AI block valuation also uses the source. `Holy Barrier` Response flow: PLAY → select eligible user (Priest/Saint) → select attacked Hero to protect → PAY. `Sacred Bulwark` and `Blessing of Divinity` are teamwide: PLAY → select eligible user → PAY; there is **no additional protected-Hero selection**. `Cover Up` uses source then protected target. CANCEL remains available pre-payment.
6. **Taunt self-hosted Attachment glow:** when the actual Taunt attachment is active on an alive Hero, only that Hero's own lane and the Taunt attachment thumbnail get a warm highlight. Glow follows attachment state and disappears on expiry, detachment, or Legacy. This visual indicator does not change Taunt's effect or the existing Casting-target glow.

## Verification, with proof boundaries

- Chromium `node --check` affected JS: PASS; browser boot page JS errors 0, missing assets 0 in focused test.
- Hybrid identities 10/10 and printed Skill legality 1,550/1,550; full engine lineage self-test 6,975/6,975; target self-test 13/13; Ultimate Tribute 30/30.
- Universal selection replacement 8/8 cases; Response PLAY visible and pointer hit-testable above the dimmer in synthetic DOM.
- Hover: 12/12 left/right placement scenarios at 1600×848, 1024×650, and 820×580; persistent >1 second, clears on pointer leaving.
- Allied Defense: 6/6 actual engine Response resolutions with correct source-based BLOCK, including mana payment and HP. Three card-specific UI routes plus one DOM-click simulation: 4/4 PASS.
- Self-hosted Taunt glow: 5/5 state/visibility tests; no script errors.

**NOT VERIFIED / explicitly waived for this RC:** full normal Human-vs-AI UI match to Win/Loss/Draw, Firefox native playtest, all natural-match defensive combinations, full natural mouse-driven UI playthrough. The previously captured Holy Barrier live screenshot's actual source-Hero legal identity cannot be reconstructed solely from that screenshot; the independent Priest/Saint→ally case was reproduced and corrected. Focused synthetic/browser tests must not be characterized as end-to-end proof.

## Release safety

- Preserved all RC25 gameplay, Mana Steal designer rule, Ultimate and AI changes, Grand Finale 60/90 temporary local override/art, assets, and starter decks **byte-for-byte** except the three approved application source modules above.
- OSA DEV45 source, Deck Builder, PvP, and Website were not edited.
- `index.html` and `README.md` are the only files in the enclosed root; release QA resides under `docs/qa/rc26/`.
