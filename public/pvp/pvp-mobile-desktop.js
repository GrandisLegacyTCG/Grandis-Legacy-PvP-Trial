/* PvP lobby handset presentation: preserve the canonical desktop UI geometry.
 * Like the VS AI RC36 landscape lobby, rotate the existing DOM on portrait
 * touch screens and scale it; never rebuild a second, stacked mobile UI.
 * Battlefield is a separate iframe and is deliberately not affected. */
(() => {
  'use strict';
  const WIDTH = 1180;
  const HEIGHT = 590;
  const root = document.documentElement;
  let lobby = null;
  let lobbyObserver = null;
  let frameScheduled = false;

  function handset() {
    const w = window.innerWidth || 0, h = window.innerHeight || 0;
    let touch = (navigator.maxTouchPoints || 0) > 0;
    try { touch = touch || window.matchMedia('(pointer:coarse)').matches; } catch (_) {}
    return touch && Math.min(w, h) <= 680 && Math.max(w, h) <= 1350;
  }

  function position() {
    const open = !!(lobby && lobby.classList.contains('open'));
    const enabled = handset() && open;
    root.classList.toggle('gl-pvp-mobile-desktop', enabled);
    if (!enabled) {
      root.style.removeProperty('--gl-pvp-mobile-transform');
      root.style.removeProperty('--gl-pvp-mobile-scale');
      return;
    }
    const width = Math.max(window.innerWidth || 1, 1);
    const height = Math.max(window.innerHeight || 1, 1);
    const portrait = height > width;
    const availableWidth = portrait ? height : width;
    const availableHeight = portrait ? width : height;
    const scale = Math.min(1, (availableWidth - 4) / WIDTH, (availableHeight - 4) / HEIGHT);
    const offsetX = (availableWidth - WIDTH * scale) / 2;
    const offsetY = (availableHeight - HEIGHT * scale) / 2;
    const transform = portrait
      ? `translate(${offsetY + HEIGHT * scale}px, ${offsetX}px) rotate(90deg) scale(${scale})`
      : `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    root.style.setProperty('--gl-pvp-mobile-transform', transform);
    root.style.setProperty('--gl-pvp-mobile-scale', String(scale));
  }

  function requestPosition() {
    if (frameScheduled) return;
    frameScheduled = true;
    requestAnimationFrame(() => { frameScheduled = false; position(); });
  }
  function attach() {
    const next = document.getElementById('pvpSetupOverlay');
    if (next !== lobby) {
      if (lobbyObserver) lobbyObserver.disconnect();
      lobby = next;
      if (lobby) {
        lobbyObserver = new MutationObserver(requestPosition);
        lobbyObserver.observe(lobby, {attributes: true, attributeFilter: ['class']});
      }
    }
    requestPosition();
  }
  // No fixed stage is added to the page. Watch creation of the existing lobby.
  function begin() {
    new MutationObserver(attach).observe(document.body, {childList: true});
    window.addEventListener('resize', requestPosition, {passive: true});
    window.addEventListener('orientationchange', requestPosition, {passive: true});
    if (window.visualViewport) window.visualViewport.addEventListener('resize', requestPosition, {passive: true});
    attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', begin, {once: true});
  else begin();
})();
