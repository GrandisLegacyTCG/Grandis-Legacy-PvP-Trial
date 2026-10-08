# Root Cause Audit — PvP v3.37

## Symptom
On mobile, the Hero Action popup opens and Racial Trait/Class Ability buttons can be tapped, but the popup remains on screen, making the action look like nothing happened.

## End-to-end path
`mobile Hero star -> shared Hero Action popup -> capture-phase PvP click bridge -> authoritative intent -> server resolution`

## Root cause
The shared app bundle contains the intended behavior: close the mobile Hero Action info popup before beginning Racial/Class/Legacy activation. PvP's capture-phase `mapGameplayClick()` consumes those button clicks first and calls `prevent()` before the shared bubble-phase handler can execute. The action intent is sent, but the popup lifecycle code is skipped.

## Clean fix
One helper, `closeMobileHeroActionMenu(node)`, is called only for activated Racial Trait, Class Ability, and Legacy Ability choices inside `.mobile-hero-action-menu`, immediately before authoritative intent dispatch. No gameplay state is mutated locally.
