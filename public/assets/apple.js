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
  const els = [...document.querySelectorAll(groups)].filter(el => !el.closest('header, footer, .ap-no-reveal, [data-scene], [data-words], [data-steps]') && !el.matches('[data-words], .bafa-banner'));
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


  /* ---------- Scènes pilotées par le défilement : l'animation avance et recule avec la page,
     et s'arrête dès que le défilement s'arrête. Uniquement transform / opacity. ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const scenes = [];
  if (!reduced) root.classList.add('ap-scenes');
  const wide = () => innerWidth > 900;
  function sceneProgress(el) { const r = el.getBoundingClientRect(); const run = r.height - innerHeight; return run > 0 ? clamp(-r.top / run) : (r.top < 0 ? 1 : 0); }

  // Héros de l'accueil : le titre s'efface, la photo s'agrandit jusqu'au plein écran, le texte apparaît.
  const hero = document.querySelector('[data-scene="hero"]');
  if (hero) {
    const title = hero.querySelector('.sc-hero-title'), frame = hero.querySelector('.sc-hero-frame'), img = hero.querySelector('.sc-hero-img');
    const shade = hero.querySelector('.sc-hero-shade'), copy = hero.querySelector('.sc-hero-copy'), hint = hero.querySelector('.sc-hint');
    scenes.push(() => {
      const p = sceneProgress(hero), m = innerWidth < 760;
      const t1 = ease(seg(p, .02, .34)), t2 = ease(seg(p, 0, .56)), t3 = ease(seg(p, .58, .82));
      const s0 = m ? .7 : .46, y0 = innerHeight * (m ? .26 : .36);
      title.style.opacity = (1 - t1).toFixed(3);
      title.style.transform = `translate3d(0,${(-90 * t1).toFixed(1)}px,0) scale(${(1 - .08 * t1).toFixed(4)})`;
      const sc = lerp(s0, 1, t2);
      frame.style.transform = `translate3d(0,${lerp(y0, 0, t2).toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
      frame.style.borderRadius = `${(lerp(34, 0, t2) / sc).toFixed(1)}px`;
      img.style.transform = `scale(${lerp(1.22, 1, t2).toFixed(4)})`;
      shade.style.opacity = (seg(p, .45, .75)).toFixed(3);
      copy.style.opacity = t3.toFixed(3);
      copy.style.transform = `translate3d(0,${lerp(50, 0, t3).toFixed(1)}px,0)`;
      copy.style.pointerEvents = t3 > .5 ? '' : 'none';
      if (hint) hint.style.opacity = (1 - seg(p, 0, .07)).toFixed(3);
    });
  }

  // Défilement horizontal des cartes « Nos actions » (grands écrans).
  const hs = document.querySelector('[data-scene="hscroll"]');
  if (hs) {
    const track = hs.querySelector('.sc-track'), bar = hs.querySelector('.sc-progress i');
    let span = 0;
    const size = () => {
      if (!wide()) { hs.style.height = ''; track.style.transform = ''; span = 0; return; }
      span = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
      hs.style.height = `${innerHeight + span * 1.1}px`;
    };
    size(); addEventListener('resize', size);
    hs.classList.toggle('sc-h', true);
    scenes.push(() => {
      if (!span) return;
      const p = ease(sceneProgress(hs));
      track.style.transform = `translate3d(${(-span * p).toFixed(1)}px,0,0)`;
      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    });
  }

  // Vitrine : trois récits et leurs écrans, enchaînés au défilement.
  const showcase = document.querySelector('[data-scene="show"]');
  if (showcase) {
    const arts = [...showcase.querySelectorAll('.sc-steps article')], dots = [...showcase.querySelectorAll('.sc-dots i')];
    const mac = showcase.querySelector('.dev-mac'), p1 = showcase.querySelector('.p1'), p2 = showcase.querySelector('.p2'), p3 = showcase.querySelector('.p3');
    const put = (el, o, x, y, s, r = 0) => { el.style.opacity = o.toFixed(3); el.style.transform = `translate3d(${x.toFixed(1)}%,${y.toFixed(1)}%,0) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`; };
    scenes.push(() => {
      const p = sceneProgress(showcase), n = arts.length, f = p * n;
      arts.forEach((a, i) => {
        const d = f - i - .5; // 0 au centre de son étape
        const o = clamp(1 - Math.max(0, Math.abs(d) - .22) * 3.2);
        a.style.opacity = o.toFixed(3);
        a.style.transform = `translate3d(0,${(-d * 46).toFixed(1)}px,0)`;
        a.style.pointerEvents = o > .6 ? '' : 'none';
        a.setAttribute('aria-hidden', o > .6 ? 'false' : 'true');
      });
      dots.forEach((d, i) => d.classList.toggle('on', Math.min(n - 1, Math.floor(f)) === i));
      const a = ease(seg(p, .22, .42)), b = ease(seg(p, .56, .76));
      // Étape 1 : le jeu sur téléphone ; étape 2 : l'atelier projeté et le téléphone d'un participant ; étape 3 : le Collectif jeunes.
      put(p1, 1 - a, lerp(0, -40, a), lerp(0, 8, a), lerp(1.08, .85, a), lerp(-3, -10, a));
      put(mac, a * (1 - b), lerp(30, 0, a) + lerp(0, -30, b), lerp(10, 0, a), lerp(.86, 1, a) * lerp(1, .9, b));
      put(p2, a * (1 - b), lerp(-20, 0, a) + lerp(0, -40, b), lerp(20, 0, a) + lerp(0, 10, b), lerp(.9, 1, a), lerp(-8, -4, a));
      put(p3, b, lerp(40, -60, b), lerp(10, 2, b), lerp(.9, 1.12, b), lerp(8, 3, b));
    });
  }

  // Mots ou éléments de liste qui s'allument au rythme du défilement.
  function splitWords(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (w.nextNode()) if (w.currentNode.nodeValue.trim()) nodes.push(w.currentNode);
    nodes.forEach(t => {
      const frag = document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.append(part); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s); }
      });
      t.replaceWith(frag);
    });
    return [...root.querySelectorAll('.w')];
  }
  document.querySelectorAll('[data-words], [data-steps]').forEach(el => {
    const items = el.hasAttribute('data-steps') ? [...el.children] : splitWords(el);
    let lit = -1;
    scenes.push(() => {
      const r = el.getBoundingClientRect();
      const p = clamp((innerHeight * .82 - r.top) / (r.height + innerHeight * .25));
      const n = Math.round(p * items.length);
      if (n === lit) return;
      items.forEach((it, i) => it.classList.toggle('on', i < n));
      lit = n;
    });
  });

  // Titres d'en-tête qui s'effacent en remontant quand on descend, et reviennent quand on remonte.
  document.querySelectorAll('.page-intro, .cj-hero, .nw-hero-inner, .di-hero').forEach(el => {
    scenes.push(() => {
      const t = clamp(scrollY / (innerHeight * .85));
      if (t >= 1 && el._done) return; el._done = t >= 1;
      el.style.opacity = (1 - t * .95).toFixed(3);
      el.style.transform = t ? `translate3d(0,${(-t * 70).toFixed(1)}px,0) scale(${(1 - t * .05).toFixed(4)})` : '';
    });
  });

  // Photos qui se resserrent doucement en entrant dans l'écran ; bannière qui grandit.
  document.querySelectorAll('.split .photo, .cards:not(.sc-track) .photo').forEach(img => {
    const box = img.parentElement; if (box) box.style.overflow = 'hidden';
    scenes.push(() => {
      const r = img.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const t = clamp((innerHeight - r.top) / (innerHeight + r.height));
      img.style.transform = `scale(${lerp(1.14, 1, ease(t)).toFixed(4)})`;
    });
  });
  document.querySelectorAll('.bafa-banner').forEach(b => scenes.push(() => {
    const r = b.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const t = ease(clamp((innerHeight - r.top) / (innerHeight * .7)));
    b.style.transform = `scale(${lerp(.86, 1, t).toFixed(4)})`;
    b.style.opacity = lerp(.4, 1, t).toFixed(3);
  }));

  let sceneTick = false;
  const runScenes = () => { sceneTick = false; for (const f of scenes) f(); };
  if (!reduced && scenes.length) {
    root.classList.add('ap-scenes');
    addEventListener('scroll', () => { if (!sceneTick) { sceneTick = true; requestAnimationFrame(runScenes); } }, { passive: true });
    addEventListener('resize', () => requestAnimationFrame(runScenes), { passive: true });
    runScenes();
  }

  /* ---------- Contact : choix du sujet en pastilles (synchronisées avec la liste) ---------- */
  const subj = document.getElementById('subject'), seg_ = document.querySelector('.ct-seg');
  if (subj && seg_) {
    const sync = () => seg_.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === subj.value)));
    seg_.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; subj.value = b.dataset.v; subj.dispatchEvent(new Event('change')); sync(); });
    subj.addEventListener('change', sync); setTimeout(sync, 0);
  }

  /* ---------- Défilement : en-tête, halos, titre principal ---------- */
  const header = document.querySelector('header');
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  let ticking = false;
  function onScroll() {
    const y = scrollY;
    header?.classList.toggle('is-scrolled', y > 8);
    const range = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, y / range) : 0})`;
    if (!reduced) {
      glow.style.transform = `translate3d(0,${(-y * 0.04).toFixed(1)}px,0)`;
    } else { glow.style.transform = ''; }
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
