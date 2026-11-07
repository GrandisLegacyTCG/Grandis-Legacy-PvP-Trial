# RC17 — Full S0 Swap audit + viewport/animation coordinate regression

**Source baseline:** RC16, official OSA S0 DEV45 (read-only), Rulebook v2.9. **Changes:** VS AI application only.

## Authority-first Swap audit

Scanned all 242 S0 card records for printed Swap/reposition instructions, then reviewed app-specific and response handlers. This is not a generic text-to-effects inference.

| Card | Official wording/condition | Decision | Implementation |
|---|---|---|---|
| S0-ARC-016 Soul Blast Shot | When this attack hits, swap affected target with an adjacent Hero | Mandatory selection (unless none legal) | Existing selection retained; removed incorrect Skip and prevented decline via close |
| S0-THF-002 Jump Slash | You may swap | Optional | Retained |
| S0-THF-020 Dash Slash | You may swap | Optional | Retained |
| S0-THF-023 Shadow Switch | DODGE; if successful swap | Conditional mandatory | Existing response handler retained |
| S0-THF-024 Flash Slash | You may swap | Optional | Retained |
| S0-THF-026 Blink Strike | You may swap | Optional | Retained |
| S0-WAR-015 Charge Attack | Swap acting Hero with ally in front of attacked Hero | Mandatory | Now auto-swap after legal connected resolution |
| S0-WAR-025 Heroic Charge | Same mandatory Swap | Mandatory | Now auto-swap after legal connected resolution |
| S0-WAR-030 Shield Charge | Same mandatory Swap | Mandatory | Connected to post-Attack source-front model; now auto-swaps |
| S0-WAR-004 Cover Up | Defense/redirect position swap | Conditional mandatory | Existing handler retained |
| S0-ITM-019 Warp Scroll | Swap two allied positions | Mandatory once chosen | Existing item handler and Freeze/Stun validation retained |

Mandatory position swap does not create a Do Not Swap choice when legal; optional Thief cards still do. Freeze/Stun on involved Heroes blocks the swap; Hero/Legacy movement and source/target lane rules retained. Dodged/canceled Attack route remains non-swapping for charge attacks, preserving preexisting response sequencing. Targeted tests do not resolve every complex nested Response/Defeat sequence.

## Issue #2: fullscreen modal seam + miscentered Battle VFX

Compared RC15 and RC16 `index.html`, app runtime and stylesheet. **The adaptive transform of the 1600×747 logical body was already in RC15**; RC16 did not introduce it. However, RC16 added a second full-screen center-choice backdrop under transformed `body` and imposed `max-height:100dvh` on modals; these made the mismatched viewport/logical coordinates more obvious and could worsen clipping. VFX and attack arrow layers also consumed `getBoundingClientRect()` viewport coordinates but rendered `position:fixed` under the transformed body, applying a second transform.

**Fix:** Keep scaled battlefield inside `body`, but render viewport-space overlay layers, coin/choice/review/progression/result, battle VFX, attack-direction SVG and card motion layer at `document.documentElement` root outside transformed body. Their measured Hero viewport coordinates now use the same coordinate system as the destination layer. Preserve original attack/defense sprites, keyframes and audio. No arbitrary pixel offsets.

## Evidence and limitations

- In direct inline-loaded Chromium QA, `GL_RC17_ALL_SWAP_QA_SELF_TEST()` **40/40**, including real Shield Charge Play→Mana payment→Response→mandatory Swap, and PLAYER/AI mandatory/optional/Freeze/Dodge source paths. Some historical version-specific tests expecting optional Warrior Swap are intentionally stale, not silently counted as PASS.
- Ultimate Tribute 30/30, Target Selection 13/13, and S0 Class/Lineage test PASS.
- No JavaScript page errors in the inline-loaded cases.
- Viewport probe 1600×768 desktop, 1024×650 and 820×580 touch-adaptive: coin overlay covers full viewport and is anchored under HTML; VFX synthetic viewport alignment errors 0 px in X, Y, W, H.
- Direct RC15 vs RC16 vs fixed geometry at 820×580 touch: RC15 coin bottom 481.42 px; RC16 bottom 395.83 px; fixed bottom 580 px, viewport bottom 580 px. This establishes an RC16 worsening of a pre-existing adaptive coordinate problem; does NOT prove the user's Firefox session used adaptive mode.
- Full native Firefox, all real combat VFX frames during Ready and Exhausted, and complete Human-vs-AI Win/Loss/Draw remain unverified. Do not call FINAL.

QA JSON and screenshot evidence remain in the authoring workspace; only the concise report is packaged.
