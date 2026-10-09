(() => {
  'use strict';
  const REF_W = 1600;
  const REF_H = 747;
  const MAX_SCALE = 1.20;
  const root = document.documentElement;
  let raf = 0;

  function round4(v){ return Math.round(v * 10000) / 10000; }
  function updateResponsiveScale(){
    raf = 0;
    const cssW = Math.max(1, window.innerWidth || document.documentElement.clientWidth || REF_W);
    const cssH = Math.max(1, window.innerHeight || document.documentElement.clientHeight || REF_H);
    const portrait = cssH > cssW;

    // Geometry is based only on CSS viewport pixels. Never use hardware pixel density as a geometry selector.
    // Landscape keeps the donor's inverse logical canvas, but removes the old
    // 85% floor that clipped 1024px-class tablets. Portrait uses one contained
    // virtual-landscape composition rather than a second portrait geometry.
    let scale = Math.min(MAX_SCALE, cssW / REF_W, cssH / REF_H);
    scale = Math.max(0.10, round4(scale));

    let logicalW, logicalH, offsetX = 0, offsetY = 0;
    if (portrait) {
      logicalW = REF_W;
      logicalH = REF_H;
      offsetX = Math.max(0, (cssW - logicalW * scale) / 2);
      offsetY = Math.max(0, (cssH - logicalH * scale) / 2);
    } else {
      logicalW = cssW / scale;
      logicalH = cssH / scale;
    }

    root.style.setProperty('--ui-scale', String(scale));
    root.style.setProperty('--logical-w', logicalW + 'px');
    root.style.setProperty('--logical-h', logicalH + 'px');
    root.style.setProperty('--logical-sidebar-w', (logicalW * 0.15) + 'px');
    root.style.setProperty('--hero-base-w-logical', (logicalW * 0.0675) + 'px');
    root.style.setProperty('--ui-offset-x', offsetX + 'px');
    root.style.setProperty('--ui-offset-y', offsetY + 'px');
    root.dataset.uiScale = String(Math.round(scale * 100));
    root.dataset.uiOrientation = portrait ? 'portrait-virtual-landscape' : 'landscape';

    try { window.dispatchEvent(new CustomEvent('gl-pvp-responsive-scale')); } catch (_) {}
  }

  function schedule(){
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(updateResponsiveScale);
  }

  window.GL_PVP_UPDATE_RESPONSIVE_SCALE = updateResponsiveScale;
  updateResponsiveScale();
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('orientationchange', schedule, {passive:true});
})();
