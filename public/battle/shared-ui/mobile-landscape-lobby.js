/* Grandis Legacy VS AI - RC34.2 mobile landscape lobby presentation.
   Keeps the existing desktop Lobby DOM, art and controls. Never locks or
   changes the physical device orientation. Portrait gets a CSS-rotated stage.
   Changes only the open Lobby and its card-review overlay. */
(() => {
  'use strict';
  const W = 1180;
  const H = 545;
  const root = document.documentElement;
  let lobby = null;
  let lobbyObserver = null;
  let coin = null;
  let coinObserver = null;
  let scheduled = false;

  const isHandset = () => {
    const short = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    const long = Math.max(window.innerWidth || 0, window.innerHeight || 0);
    let touch = (navigator.maxTouchPoints || 0) > 0;
    try { touch = touch || matchMedia('(pointer:coarse)').matches; } catch (_) {}
    return touch && short <= 680 && long <= 1350;
  };

  function position() {
    const eligible = isHandset();
    const lobbyOpen = !!(eligible && lobby && lobby.classList.contains('open'));
    const coinOpen = !!(eligible && coin && coin.classList.contains('open') && !lobbyOpen);
    const active = lobbyOpen || coinOpen;
    root.classList.toggle('gl-mobile-landscape-lobby', lobbyOpen);
    root.classList.toggle('gl-mobile-landscape-coin', coinOpen);
    root.classList.toggle('gl-mobile-landscape-stage', active);
    if (!active) {
      root.classList.remove('gl-mobile-landscape-lobby-portrait');
      root.style.removeProperty('--gl-mobile-lobby-transform');
      root.style.removeProperty('--gl-mobile-lobby-scale');
      return;
    }
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const portrait = height > width;
    const stageWidth = portrait ? height : width;
    const stageHeight = portrait ? width : height;
    const scale = Math.min(1, (stageWidth - 4) / W, (stageHeight - 4) / H);
    const offsetX = (stageWidth - W * scale) / 2;
    const offsetY = (stageHeight - H * scale) / 2;
    root.classList.toggle('gl-mobile-landscape-lobby-portrait', portrait);
    // Rotating 90 degrees around origin moves the landscape canvas left by H*scale.
    // translate() compensates for that; the visible canvas remains centered.
    const transform = portrait
      ? `translate(${offsetY + H * scale}px, ${offsetX}px) rotate(90deg) scale(${scale})`
      : `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    root.style.setProperty('--gl-mobile-lobby-transform', transform);
    root.style.setProperty('--gl-mobile-lobby-scale', String(scale));
    root.dataset.glInternalRevision = 'RC35';
  }
  function requestPosition() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; position(); });
  }
  function attach() {
    const current = document.querySelector('.gl-lobby-overlay');
    if (current !== lobby) {
      if (lobbyObserver) lobbyObserver.disconnect();
      lobby = current;
      if (lobby) {
        lobbyObserver = new MutationObserver(requestPosition);
        lobbyObserver.observe(lobby, {attributes: true, attributeFilter: ['class']});
      }
    }
    const nextCoin = document.querySelector('.gl-coin-overlay');
    if (nextCoin !== coin) {
      if (coinObserver) coinObserver.disconnect();
      coin = nextCoin;
      if (coin) {
        coinObserver = new MutationObserver(requestPosition);
        coinObserver.observe(coin, {attributes: true, attributeFilter: ['class']});
      }
    }
    requestPosition();
  }
  const bodyObserver = new MutationObserver(attach);
  bodyObserver.observe(document.body, {childList: true});
  window.addEventListener('resize', requestPosition, {passive: true});
  window.addEventListener('orientationchange', requestPosition, {passive: true});
  if (window.visualViewport) window.visualViewport.addEventListener('resize', requestPosition, {passive: true});
  attach();
})();
