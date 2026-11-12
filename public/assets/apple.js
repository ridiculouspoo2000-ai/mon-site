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
    '.help > *', '.testimonials > article', '.gallery > a', '.blue-strip span',
    '.contact-info', '.contact-grid form', '.legal-notice', '.resources article', '#faq details',
    '.bafa-infographic', '.ap-join', '.ap-widget', '.ap-widget-intro > *', '[data-ap]', '.ap-stagger > *'
  ].join(',');
  const els = [...document.querySelectorAll(groups)].filter(el => !el.closest('header, footer, .ap-no-reveal, [data-scene], [data-words], [data-steps]') && !el.matches('[data-words], .bafa-banner, .split > div:last-child'));
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

  // Héros de l'accueil : la photo se dévoile comme un rideau (sans zoom), le titre glisse plus lentement,
  // le chemin des fourmis se trace au fil du défilement.
  const hero = document.querySelector('[data-scene="hero2"]');
  if (hero) {
    const photo = hero.querySelector('.h2-photo'), copy = hero.querySelector('.h2-copy'), trail = hero.querySelector('.ant-trail>path');
    let len = 0; if (trail) { try { len = trail.getTotalLength(); trail.style.strokeDasharray = `3 7`; } catch {} }
    scenes.push(() => {
      const p = sceneProgress(hero), w = wide();
      const r = ease(seg(p, 0, .55));
      const c = w ? lerp(42, 0, r) : 0;
      photo.style.clipPath = `inset(${c.toFixed(2)}% 0 0 0 round 32px)`;
      photo.style.transform = w ? `translate3d(0,${lerp(70, 0, r).toFixed(1)}px,0)` : '';
      const out = ease(seg(p, .7, 1));
      copy.style.transform = w ? `translate3d(0,${(-60 * out + 30 * (1 - r)).toFixed(1)}px,0)` : '';
      copy.style.opacity = w ? (1 - out * .9).toFixed(3) : '';
      if (trail && len) trail.style.strokeDashoffset = `${(len * (1 - seg(p, 0, .6))).toFixed(1)}`;
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

  // Cartes qui s'empilent : chaque carte reste collée en haut, la précédente recule et s'assombrit.
  const stack = [...document.querySelectorAll('.stack-card')];
  if (stack.length) scenes.push(() => {
    stack.forEach((card, i) => {
      const next = stack[i + 1];
      let t = 0;
      if (next) { const top = parseFloat(getComputedStyle(next).top) || 0; const r = next.getBoundingClientRect(); t = clamp(1 - (r.top - top) / (innerHeight * .85)); }
      card.style.transform = `scale(${(1 - .07 * ease(t)).toFixed(4)})`;
      card.style.setProperty('--dim', (t * .55).toFixed(3));
    });
  });

  // Titres dont la partie colorée se remplit en avançant dans la page.
  document.querySelectorAll('main h2 em, main .cj-quote em, main .cj-pq em').forEach(em => {
    if (em.closest('[data-scene="hero2"], .page-intro, .nw-hero')) return;
    em.classList.add('fx-fill');
    scenes.push(() => {
      const r = em.getBoundingClientRect(); if (r.bottom < -50 || r.top > innerHeight + 50) return;
      const t = clamp((innerHeight * .92 - r.top) / (innerHeight * .45));
      em.style.setProperty('--f', `${(t * 100).toFixed(1)}%`);
    });
  });

  // Rideau : les images se dévoilent de bas en haut en entrant dans l'écran (aucun agrandissement).
  document.querySelectorAll('.split .photo, .gallery a, .bafa-infographic, .competences-image, .cj-player, .nw-media, .nw-art, .ap-widget').forEach(el => {
    el.classList.add('fx-curtain');
    scenes.push(() => {
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const t = ease(clamp((innerHeight - r.top) / (Math.min(r.height, innerHeight) * .9)));
      el.style.clipPath = t >= 1 ? '' : `inset(${((1 - t) * 100).toFixed(2)}% 0 0 0 round var(--fx-r, 24px))`;
    });
  });

  // Parallaxe douce : le texte à côté d'une photo glisse un peu moins vite qu'elle.
  document.querySelectorAll('.split > div:last-child').forEach(el => scenes.push(() => {
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const d = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
    el.style.transform = `translate3d(0,${(d * 46).toFixed(1)}px,0)`;
  }));

  // Lignes de progression qui se tracent le long des étapes.
  document.querySelectorAll('.process, .steps, .pillars, .commitments, .cj-steps, .di-steps, .testimonials').forEach(el => {
    const rail = document.createElement('span'); rail.className = 'fx-rail'; rail.setAttribute('aria-hidden', 'true'); rail.innerHTML = '<i></i>';
    el.classList.add('fx-rail-host'); el.prepend(rail);
    const bar = rail.firstChild;
    scenes.push(() => {
      const r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const t = clamp((innerHeight * .8 - r.top) / (r.height + innerHeight * .2));
      bar.style.transform = el.classList.contains('process') ? `scaleY(${t.toFixed(4)})` : `scaleX(${t.toFixed(4)})`;
    });
  });

  // Numéros qui défilent jusqu'à leur valeur.
  document.querySelectorAll('.number').forEach(n => {
    const v = n.textContent.trim(); if (!/^\d{1,3}$/.test(v)) return;
    const target = +v, pad = v.length; let shown = -1;
    scenes.push(() => {
      const r = n.getBoundingClientRect(); if (r.top > innerHeight || r.bottom < 0) return;
      const t = ease(clamp((innerHeight * .95 - r.top) / (innerHeight * .35)));
      const x = Math.round(target * t); if (x === shown) return; shown = x;
      n.textContent = String(x).padStart(pad, '0');
    });
  });

  // Valeurs : deux bandeaux qui coulissent en sens inverse au rythme du défilement.
  document.querySelectorAll('.values').forEach(v => {
    const chips = [...v.children]; if (chips.length < 6) return;
    const half = Math.ceil(chips.length / 2);
    const mk = (list) => { const row = document.createElement('div'); row.className = 'fx-row'; list.forEach(c => row.append(c)); const dup = row.cloneNode(true); dup.setAttribute('aria-hidden', 'true'); const track = document.createElement('div'); track.className = 'fx-track'; track.append(row, dup); return track; };
    const t1 = mk(chips.slice(0, half)), t2 = mk(chips.slice(half));
    v.classList.add('fx-marquee'); v.append(t1, t2);
    scenes.push(() => {
      const r = v.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const d = (innerHeight - r.top) * .35;
      t1.style.transform = `translate3d(${(-d % (t1.scrollWidth / 2)).toFixed(1)}px,0,0)`;
      t2.style.transform = `translate3d(${(-(t2.scrollWidth / 2) + (d % (t2.scrollWidth / 2))).toFixed(1)}px,0,0)`;
    });
  });

  // Grandes phrases qui prennent toute leur place en arrivant au centre.
  document.querySelectorAll('.help h2, .cj-quote, .cj-pq, .di-hero h1').forEach(el => scenes.push(() => {
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const t = ease(clamp((innerHeight - r.top) / (innerHeight * .6)));
    el.style.transform = `scale(${lerp(.9, 1, t).toFixed(4)})`; el.style.opacity = lerp(.35, 1, t).toFixed(3);
  }));

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

  // Bannière BAFA qui grandit en arrivant.
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
