/* Fourmi’Action — mouvements fluides (transform, opacity, filter uniquement)
   et petites interactions. Le contenu reste lisible sans JavaScript. */
(() => {
  'use strict';
  const root = document.documentElement;
  const systemReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const KEY = 'fourmiaction-reduced-motion';
  let preference = null;
  try { preference = localStorage.getItem(KEY); } catch {}
  let reduced = false;

  /* ---------- Halos d’arrière-plan ---------- */
  const glow = document.createElement('div');
  glow.className = 'ap-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.prepend(glow);

  /* ---------- Préférence d’animation (bouton en pied de page) ---------- */
  const footerCol = document.querySelector('.footer-grid > div:last-child');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'motion-toggle';
  footerCol?.appendChild(toggle);

  function applyPreference() {
    reduced = preference === null ? systemReduce.matches : preference === 'true';
    root.classList.toggle('ap-motion', !reduced);
    root.classList.toggle('ap-reduced', reduced);
    root.classList.toggle('motion-enabled', !reduced);
    root.classList.toggle('reduce-motion', reduced);
    toggle.textContent = reduced ? 'Animations désactivées · activer' : 'Animations activées · désactiver';
    toggle.setAttribute('aria-pressed', String(!reduced));
    if (reduced) document.querySelectorAll('.ap-r').forEach(show);
  }
  toggle.addEventListener('click', () => {
    preference = String(!reduced);
    try { localStorage.setItem(KEY, preference); } catch {}
    applyPreference();
  });
  systemReduce.addEventListener?.('change', () => { if (preference === null) applyPreference(); });
  applyPreference();

  /* ---------- Apparitions au défilement ---------- */
  function show(el) {
    if (el.classList.contains('ap-in')) return;
    el.classList.add('ap-in');
    const done = () => { el.classList.add('ap-done'); el.removeEventListener('transitionend', done); };
    el.addEventListener('transitionend', done);
    setTimeout(done, 2400);
    el.dispatchEvent(new CustomEvent('ap:in'));
  }
  const groups = [
    '.page-intro > *', '.cj-hero > *', '.nw-hero-inner > *', '.hero-copy .lead', '.hero-copy .buttons', '.hero-visual',
    '.section-top', '.intro-grid > *', '.cards > article', '.spirit > div', '.spirit li',
    '.steps > article', '.bafa-resource-card', '.pillars > article', '.commitments > article',
    '.split > *', '.price-accordion', '.trainer-entry', '.download', '.bafa-banner', '.news-teaser',
    '.help > *', '.values span', '.testimonials > article', '.gallery > a', '.blue-strip span',
    '.contact-info', '.contact-grid form', '.legal-notice', '.resources article', '#faq details',
    '.bafa-infographic', '.ap-join', '.ap-widget', '.ap-widget-intro > *', '[data-ap]', '.ap-stagger > *'
  ].join(',');
  const els = [...document.querySelectorAll(groups)].filter(el => !el.closest('header, footer, .ap-no-reveal'));
  document.querySelectorAll('.hero h1 .hero-line').forEach(el => els.push(el));
  const pending = new Set();

  if (!reduced && 'IntersectionObserver' in window) {
    const vh = innerHeight;
    // Délai d’entrée pour les éléments visibles au chargement : effet d’ouverture.
    let introIndex = 0;
    els.forEach(el => {
      el.classList.add('ap-r');
      if (el.matches('.page-intro h1, .ap-hero-title')) el.classList.add('ap-blur-lg');
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        el.style.setProperty('--ap-d', (0.06 + introIndex++ * 0.09).toFixed(2) + 's');
        requestAnimationFrame(() => requestAnimationFrame(() => show(el)));
      } else pending.add(el);
    });
    const io = new IntersectionObserver(entries => {
      // Décalage léger entre éléments qui entrent ensemble, de gauche à droite.
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) =>
        (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left));
      visible.forEach((e, i) => {
        io.unobserve(e.target);
        pending.delete(e.target);
        if (!e.target.style.getPropertyValue('--ap-d')) e.target.style.setProperty('--ap-d', Math.min(i * 0.08, 0.4).toFixed(2) + 's');
        show(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    pending.forEach(el => io.observe(el));
    // Filet de sécurité : ce qui est déjà au-dessus de l’écran (ancre, rotation) apparaît.
    const sweep = () => pending.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) { io.unobserve(el); pending.delete(el); show(el); } });
    addEventListener('resize', sweep, { passive: true });
    addEventListener('hashchange', () => setTimeout(sweep, 60));
    addEventListener('pageshow', e => { if (e.persisted) els.forEach(show); });
    document.addEventListener('focusin', e => { const p = e.target.closest('.ap-r'); if (p) show(p); });
    setTimeout(sweep, 400);
  } else els.forEach(el => el.classList.add('ap-in'));

  /* ---------- Compteurs (chiffres clés) ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const run = () => {
      if (reduced) { el.textContent = el.dataset.count; return; }
      const t0 = performance.now(), dur = 1100;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const host = el.closest('.ap-r');
    if (host && !host.classList.contains('ap-in')) host.addEventListener('ap:in', run, { once: true });
    else run();
  });

  /* ---------- Défilement : en-tête, halos, titre principal ---------- */
  const header = document.querySelector('header');
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  const heroTitle = document.querySelector('[data-ap-scrollfade]');
  let ticking = false;
  function onScroll() {
    const y = scrollY;
    header?.classList.toggle('is-scrolled', y > 8);
    const range = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, y / range) : 0})`;
    if (!reduced) {
      glow.style.transform = `translate3d(0,${(-y * 0.04).toFixed(1)}px,0)`;
      if (heroTitle && y < innerHeight * 1.2) {
        const p = Math.min(1, y / (innerHeight * 0.9));
        heroTitle.style.transform = `translate3d(0,${(p * 60).toFixed(1)}px,0) scale(${(1 - p * 0.08).toFixed(4)})`;
        heroTitle.style.opacity = (1 - p * 0.9).toFixed(3);
      }
    } else { glow.style.transform = ''; if (heroTitle) { heroTitle.style.transform = ''; heroTitle.style.opacity = ''; } }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Menu mobile (complète site.js) ---------- */
  const nav = document.querySelector('#navigation');
  const menuBtn = document.querySelector('.menu-toggle');
  const closeMenu = () => { if (nav?.classList.contains('open')) { nav.classList.remove('open'); menuBtn?.setAttribute('aria-expanded', 'false'); } };
  nav?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('click', e => { if (header && !header.contains(e.target)) closeMenu(); });
  document.addEventListener('focusin', e => { if (header && !header.contains(e.target)) closeMenu(); });
  window.matchMedia('(min-width: 1151px)').addEventListener?.('change', closeMenu);

  /* ---------- Vidéo : partage ---------- */
  document.querySelectorAll('[data-share]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = new URL(btn.dataset.share, location.href).href;
      const status = btn.parentElement.querySelector('[role="status"]');
      try {
        if (navigator.share) { await navigator.share({ title: document.title, url }); return; }
        await navigator.clipboard.writeText(url);
        if (status) status.textContent = 'Lien copié : ' + url;
      } catch (err) {
        if (err?.name !== 'AbortError' && status) status.textContent = 'Copiez ce lien : ' + url;
      }
    });
  });

  /* ---------- HelloAsso : hauteur du formulaire intégré ---------- */
  const haWidget = document.getElementById('haWidget');
  if (haWidget) {
    addEventListener('message', e => {
      let host = '';
      try { host = new URL(e.origin).hostname; } catch { return; }
      if (!/(^|\.)helloasso\.com$/.test(host)) return;
      const h = Number(e.data && e.data.height);
      if (h > (parseFloat(haWidget.style.height) || 0)) { haWidget.height = h + 'px'; haWidget.style.height = h + 'px'; }
    });
  }
})();
