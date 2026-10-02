/* Grandis Legacy PvP v3.43 Candidate 3A
 * Headless shared-runtime metadata compatibility.
 *
 * Browser Candidate 15 receives these legacy compatibility aliases from the
 * presentation adapter before app.bundle.js starts a match. The Node authority
 * intentionally does not load presentation code, so it normalizes only the
 * metadata aliases required by the exact same shared runtime guards.
 */
export function normalizeHeadlessRuntimeMetadata(win) {
  if (!win || typeof win !== 'object') throw new Error('Headless runtime window is required.');
  if (win.GL_SOURCE_STACK && !win.GL_SOURCE_STACK.shared_runtime && win.GL_SOURCE_STACK.runtime_foundation) {
    win.GL_SOURCE_STACK.shared_runtime = win.GL_SOURCE_STACK.runtime_foundation;
  }
  if (win.GRANDIS_LEGACY_RUNTIME_DATA && !win.GL_CARD_DEFINITIONS) {
    win.GL_CARD_DEFINITIONS = win.GRANDIS_LEGACY_RUNTIME_DATA;
  }
  if (win.GL_CARD_DEFINITIONS && !win.GL_CARD_DEFINITIONS.families && Array.isArray(win.GL_CARD_DEFINITIONS.cards)) {
    win.GL_CARD_DEFINITIONS.families = { ALL: { cards: win.GL_CARD_DEFINITIONS.cards } };
  }
  if (win.GL_CARD_DEFINITIONS && !win.GL_CARD_DEFINITIONS.version) {
    win.GL_CARD_DEFINITIONS.version = `v${String(win.GL_CARD_DEFINITIONS.schema_version || '0.16.2').replace(/^v/, '')}`;
  }
  if (win.GL_EFFECT_RECIPES && !win.GL_EFFECT_RECIPES.version) {
    win.GL_EFFECT_RECIPES.version = `v${String(win.GL_EFFECT_RECIPES.schema_version || '0.15.2').replace(/^v/, '')}`;
  }
  if (!win.GL_ACTIVE_STARTER_DECKS && win.GL_PVP_STARTER_DECK_OPTIONS) {
    win.GL_ACTIVE_STARTER_DECKS = win.GL_PVP_STARTER_DECK_OPTIONS;
  }
  return {
    sharedRuntime: win.GL_SOURCE_STACK?.shared_runtime || null,
    cardVersion: win.GL_CARD_DEFINITIONS?.version || null,
    effectVersion: win.GL_EFFECT_RECIPES?.version || null
  };
}
