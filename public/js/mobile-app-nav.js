(() => {
  const button = () => document.getElementById('glMobileAppMenuButton');
  const menu = () => document.getElementById('glMobileAppMenu');
  const place = () => {
    const b = button(), m = menu();
    if (!b || !m) return;
    const rect = b.getBoundingClientRect();
    m.style.top = `${Math.round(rect.bottom + 8)}px`;
    m.style.right = `${Math.max(10, Math.round(window.innerWidth - rect.right))}px`;
  };
  const close = () => {
    const b = button(), m = menu();
    if (b) b.setAttribute('aria-expanded', 'false');
    if (m) m.hidden = true;
  };
  const open = () => {
    const b = button(), m = menu();
    if (!b || !m) return;
    if (document.body.classList.contains('pvp-match-active') || !document.body.classList.contains('pvp-lobby-mode') || document.body.getAttribute('data-pvp-gameplay-active') === '1') { close(); return; }
    place();
    b.setAttribute('aria-expanded', 'true');
    m.hidden = false;
  };
  document.addEventListener('click', (event) => {
    const b = button(), m = menu();
    const target = event.target;
    if (b && (target === b || b.contains(target))) {
      event.preventDefault();
      event.stopPropagation();
      if (b.getAttribute('aria-expanded') === 'true') close(); else open();
      return;
    }
    if (m && target && target.closest && target.closest('#glMobileAppMenu a')) { close(); return; }
    if (m && !m.hidden && target && !m.contains(target) && (!b || !b.contains(target))) close();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  window.addEventListener('resize', () => {
    const m = menu();
    if (window.matchMedia('(min-width: 761px)').matches) close();
    else if (m && !m.hidden) place();
  });
  window.addEventListener('scroll', () => { const m = menu(); if (m && !m.hidden) place(); }, { passive: true });
})();
