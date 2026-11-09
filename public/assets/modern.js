(() => {
  'use strict';
  const root = document.documentElement;
  const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Small screens and touch devices show content immediately, even if a desktop
  // animation preference was previously saved. This also covers landscape rotation.
  const mobileMotion = window.matchMedia('(max-width: 1150px), (pointer: coarse)');
  const animations = new Set();
  const animatedElements = new WeakMap();
  let preference = null;
  try { preference = localStorage.getItem('fourmiaction-reduced-motion'); } catch {}
  let reduced;
  const footer = document.querySelector('.footer-grid > div:last-child');
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'motion-toggle';
  let observer;

  // Motion is bundled locally. Native Web Animations is a fallback if it fails to load.
  function enter(element, delay = 0, distance = 42, duration = .95) {
    if (!element) return;
    element.classList.remove('reveal-pending');
    if (reduced) return;
    animatedElements.get(element)?.();
    let control, finished, cleanup;
    try {
      const frames = { opacity: [0, 1], transform: [`translateY(${distance}px)`, 'translateY(0px)'] };
      if (window.Motion?.animate) {
        control = window.Motion.animate(element, frames, { duration, delay, ease: [.25, .1, .25, 1] });
        finished = Promise.resolve(control);
      } else if (element.animate) {
        control = element.animate(frames, { duration: duration * 1000, delay: delay * 1000, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'both' });
        finished = control.finished;
      } else return;
      cleanup = () => {
        try { control.cancel ? control.cancel() : control.stop(); } catch {}
        animations.delete(cleanup);
        if (animatedElements.get(element) === cleanup) {
          animatedElements.delete(element);
          element.style.removeProperty('transform');
          element.style.removeProperty('opacity');
        }
      };
      animations.add(cleanup);
      animatedElements.set(element, cleanup);
      finished.then(cleanup, cleanup);
    } catch { element.classList.remove('reveal-pending'); }
  }
  function updateMotion() {
    reduced = mobileMotion.matches || (preference === null ? systemMotion.matches : preference === 'true');
    settings.hidden = mobileMotion.matches;
    root.classList.toggle('reduce-motion', reduced);
    root.classList.toggle('motion-enabled', !reduced);
    settings.textContent = reduced ? 'Animations désactivées · activer' : 'Animations activées · désactiver';
    settings.setAttribute('aria-pressed', String(!reduced));
    settings.setAttribute('aria-label', reduced ? 'Activer les animations' : 'Désactiver les animations');
    if (reduced) {
      observer?.disconnect();
      for (const cleanup of [...animations]) cleanup();
      document.querySelectorAll('.reveal-pending').forEach(e => e.classList.remove('reveal-pending'));
      document.querySelector('.hero-visual')?.style.removeProperty('--photo-shift');
    }
  }
  settings.addEventListener('click', () => {
    if (mobileMotion.matches) return;
    preference = String(!reduced);
    try { localStorage.setItem('fourmiaction-reduced-motion', preference); } catch {}
    updateMotion();
    if (!reduced) {
      // Immediate visible feedback, without moving the visitor back to the top.
      document.querySelectorAll('main section, .footer-grid > div').forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < innerHeight) enter(element, 0, 28, .8);
      });
    }
  });
  footer?.appendChild(settings);
  systemMotion.addEventListener?.('change', event => {
    if (preference === null) updateMotion();
  });
  mobileMotion.addEventListener?.('change', updateMotion);
  updateMotion();

  document.querySelectorAll('.hero-line').forEach((element, i) => enter(element, .12 + i * .17, 46, 1.05));
  enter(document.querySelector('.hero-copy .lead'), .42, 28, 1);
  enter(document.querySelector('.hero-copy .buttons'), .56, 25, 1);
  enter(document.querySelector('.hero-visual'), .24, 40, 1.15);
  enter(document.querySelector('.page-intro'), .08, 32, .85);
  if (!reduced && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        enter(entry.target, Math.min(order++ * .13, .39));
      }
    }, { threshold: .06, rootMargin: '0px 0px -30px 0px' });
    const selector = '.section-top, .intro-grid > *, .cards > article, .spirit > div, .spirit li, .steps > article, .bafa-resource-card:not(.trainer-resource), .pillars > article, .commitments > article, .split > *, .price-accordion, .trainer-entry, .download, .bafa-banner, .news-teaser, .help';
    document.querySelectorAll(selector).forEach(element => {
      // Only offscreen elements are prepared; HTML remains readable without JS.
      if (!reduced && (window.Motion?.animate || element.animate) && element.getBoundingClientRect().top > innerHeight) element.classList.add('reveal-pending');
      observer.observe(element);
    });
    // A keyboard user must never focus an invisible control while it is waiting to appear.
    document.addEventListener('focusin', event => {
      const pending = event.target.closest('.reveal-pending');
      if (pending) { observer.unobserve(pending); pending.classList.remove('reveal-pending'); }
    });
  }
  document.querySelectorAll('details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (details.open) enter(details.querySelector('.price-content') || details.querySelector('p'), 0, 14, .45);
    });
  });

  const header = document.querySelector('header');
  const heroPhoto = document.querySelector('.hero-visual');
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  let pendingScroll = false;
  function updateScroll() {
    header?.classList.toggle('is-scrolled', window.scrollY > 12);
    const range = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, scrollY / range) : 0})`;
    if (heroPhoto && !reduced && innerWidth > 760 && scrollY < innerHeight) {
      heroPhoto.style.setProperty('--photo-shift', `${Math.min(scrollY * .065, 25)}px`);
    } else heroPhoto?.style.removeProperty('--photo-shift');
    pendingScroll = false;
  }
  function scheduleScroll() { if (!pendingScroll) { pendingScroll = true; requestAnimationFrame(updateScroll); } }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });
  updateScroll();

  const nav = document.querySelector('#navigation');
  const toggle = document.querySelector('.menu-toggle');
  function closeMenu(restoreFocus = false) {
    if (!nav?.classList.contains('open')) return;
    nav.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle?.focus();
  }
  toggle?.addEventListener('click', () => {
    if (nav?.classList.contains('open')) enter(nav, 0, -12, .3);
  });
  nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!header?.contains(event.target)) closeMenu(); });
  window.matchMedia('(min-width: 1151px)').addEventListener?.('change', () => closeMenu());
  document.addEventListener('focusin', event => { if (!header?.contains(event.target)) closeMenu(); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) document.querySelectorAll('.reveal-pending').forEach(e => e.classList.remove('reveal-pending'));
  });
})();
