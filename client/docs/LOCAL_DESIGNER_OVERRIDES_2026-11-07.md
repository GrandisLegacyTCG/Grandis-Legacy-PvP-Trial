# Approved local card override (pending OSA synchronization)

- `S0-ITM-011` Poison Vial artwork and printed text reflect designer approval on 2026-11-07.
- Live card runtime materialization reads this revised text. All other OSA imported snapshots remain unchanged to preserve auditability.
- OSA-generated asset manifest still fingerprints the **older** OSA DEV45 artwork; it is not proof of the newly supplied art. Treat source parity for this card as a documented exception until OSA is updated.
- Gameplay: eligible source is a Hero's **Skill Card** dealing actual Physical HP damage; a Racial Trait such as Primal Strike does not qualify. Attachment persists for the current turn and expires at the End Phase.
- This local artwork replacement is explicitly authorized by designer's card revision; do not silently rewrite OSA-authority exports.
