# Grandis Legacy PvP v3.30 — Mobile controls functional fix

Date: 2026-09-04

## Scope

PvP only. This is a corrective follow-up to v3.29 after device testing showed two mobile controls were still unchanged in the real match. Source Stack v1.7.3 and gameplay authority are unchanged.

## Fixes

### Cross-application hamburger

- The top-right three-line cross-app menu is now forcibly hidden whenever the PvP battlefield is active.
- Hiding is applied in three layers: authoritative snapshot/render state, inline `display:none!important`, and a CSS active-match guard.
- The mobile nav script also refuses to open while the active-match class is present.
- Returning to the lobby restores normal navigation visibility.

### Mobile Hero action star / Racial Trait

- PvP now intercepts the Hero action star in the capture phase and opens the exact VS AI mobile Hero action menu through the public UI bridge.
- This avoids the prior v3.29 assumption that allowing the click to bubble through PvP interception was sufficient.
- Choosing a Racial Trait / Hero Ability / Legacy Ability remains server-authoritative through the existing PvP intent routes.

## Preserved

- v3.29 Hero/Legacy display parity and lobby-name propagation.
- v3.28 authoritative battle VFX/audio delivery.
- v3.26 Card Played parity.
- v3.24 Quick Reload → Aura Infusion Bolt counter fix.
- Exact 60-card PvP deck validation, normal max 3, Ultimate max 1.
