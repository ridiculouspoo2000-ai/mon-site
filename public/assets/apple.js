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
    '.bafa-infographic', '.ap-join', '.ap-widget', '.ap-widget-intro > *', '[data-ap]', '[data-dg]', '.dg-venn-head > *', '.dg-teaser-copy > *', '.ap-stagger > *'
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

  // Héros de l'accueil, en trois temps (grand écran) :
  // 1. le titre, grand et centré, s'écrit (les mots colorés se remplissent) ;
  // 2. il glisse à sa place pendant que la photo s'ouvre en cercle (sans aucun agrandissement de l'image) ;
  // 3. le texte et les boutons arrivent, le chemin des fourmis se trace.
  const hero = document.querySelector('[data-scene="hero2"]');
  if (hero) {
    const h1 = hero.querySelector('h1'), photo = hero.querySelector('.h2-photo'), vis = hero.querySelector('.h2-visual');
    const after = [...hero.querySelectorAll('.h2-copy .lead, .h2-copy .buttons')];
    const ems = [...h1.querySelectorAll('em')], lines = [...h1.querySelectorAll('.hero-line')];
    const trail = hero.querySelector('.ant-trail');
    ems.forEach(e => e.classList.add('fx-fill'));
    let geo = null;
    const measure = () => {
      h1.style.transform = ''; const hr = h1.getBoundingClientRect(), pin = hero.querySelector('.sc-pin').getBoundingClientRect();
      const lw = Math.max(...lines.map(l => l.getBoundingClientRect().width), 10);
      const r = { left: hr.left, top: hr.top, width: lw, height: hr.height };
      const s0 = Math.min(1.32, (innerWidth * .82) / r.width);
      geo = { s0, dx: (pin.left + pin.width / 2) - (r.left + r.width * s0 / 2), dy: (pin.top + pin.height * .46) - (r.top + r.height * s0 / 2) };
    };
    addEventListener('resize', () => { geo = null; });
    scenes.push(() => {
      if (!wide()) { h1.style.transform = ''; photo.style.clipPath = ''; after.forEach(e => { e.style.opacity = ''; e.style.transform = ''; }); ems.forEach(e => e.style.setProperty('--f', '100%')); return; }
      if (!geo) measure();
      const p = sceneProgress(hero);
      // 1. les lignes du titre s'affirment une à une, les mots colorés se remplissent
      ems.forEach((e, i) => e.style.setProperty('--f', `${(seg(p, .01 + i * .07, .16 + i * .07) * 100).toFixed(1)}%`));
      // 2. déplacement vers la colonne de gauche
      const m = ease(seg(p, .22, .58));
      h1.style.transform = `translate3d(${(geo.dx * (1 - m)).toFixed(1)}px,${(geo.dy * (1 - m)).toFixed(1)}px,0) scale(${lerp(geo.s0, 1, m).toFixed(4)})`;
      const o = ease(seg(p, .3, .66));
      photo.style.clipPath = `circle(${lerp(0, 76, o).toFixed(2)}% at 50% 55%)`;
      vis.style.transform = `translate3d(0,${lerp(90, 0, o).toFixed(1)}px,0)`;
      // 3. texte et boutons
      after.forEach((e, i) => { const t = ease(seg(p, .56 + i * .07, .74 + i * .07)); e.style.opacity = t.toFixed(3); e.style.transform = `translate3d(0,${lerp(36, 0, t).toFixed(1)}px,0)`; e.style.pointerEvents = t > .6 ? '' : 'none'; });
      if (trail) { const t = ease(seg(p, .55, .85)); trail.style.opacity = t.toFixed(3); trail.style.transform = `translate3d(${lerp(-30, 0, t).toFixed(1)}px,${lerp(30, 0, t).toFixed(1)}px,0)`; }
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

  /* ---------- Verre liquide : réfraction et grossissement (lentille) ----------
     Carte de déplacement calculée pour chaque surface : bord bombé (profil « squircle »),
     léger grossissement au centre ; appliquée en backdrop-filter via un filtre SVG.
     Navigateurs Chromium uniquement ; ailleurs, verre dépoli classique. */
  const Lens = (() => {
    const ua = navigator.userAgent;
    const ok = /Chrome\/\d+/.test(ua) && !/CriOS|FxiOS|EdgiOS|SamsungBrowser\/[0-9]\./.test(ua) && CSS.supports('backdrop-filter', 'blur(1px)') && !root.classList.contains('ap-reduced');
    if (!ok) return { on() {}, off() {} };
    const NS = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(NS, 'svg');
    defs.setAttribute('aria-hidden', 'true'); defs.setAttribute('width', '0'); defs.setAttribute('height', '0');
    defs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.appendChild(defs);
    const items = new Map(); let uid = 0;
    const squircle = t => Math.pow(1 - Math.pow(1 - t, 4), .25);
    function build(el, o) {
      const r = el.getBoundingClientRect(); const W = Math.max(2, Math.round(r.width)), H = Math.max(2, Math.round(r.height));
      const it = items.get(el); if (it.w === W && it.h === H) return; it.w = W; it.h = H;
      const rad = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, W / 2, H / 2);
      const bez = Math.min(o.bezel, W / 2, H / 2), cx = W / 2, cy = H / 2;
      const dx = new Float32Array(W * H), dy = new Float32Array(W * H); let max = 0.001;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const px = x + .5 - cx, py = y + .5 - cy;
        const qx = Math.abs(px) - (cx - rad), qy = Math.abs(py) - (cy - rad);
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0), ol = Math.hypot(ox, oy);
        const sd = ol + Math.min(Math.max(qx, qy), 0) - rad; // distance signée au bord (négative à l'intérieur)
        let nx, ny; if (qx > 0 && qy > 0) { nx = ox / ol; ny = oy / ol; } else if (qx > qy) { nx = 1; ny = 0; } else { nx = 0; ny = 1; }
        nx *= Math.sign(px) || 1; ny *= Math.sign(py) || 1;
        const d = -sd; let m = 0;
        if (d >= 0 && d < bez) m = 1 - squircle(Math.max(d / bez, .001));
        const i = y * W + x;
        dx[i] = -nx * m * o.edge - px * o.mag; dy[i] = -ny * m * o.edge - py * o.mag;
        max = Math.max(max, Math.abs(dx[i]), Math.abs(dy[i]));
      }
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d'); const img = g.createImageData(W, H);
      for (let i = 0; i < W * H; i++) { img.data[i * 4] = 128 + dx[i] / max * 127; img.data[i * 4 + 1] = 128 + dy[i] / max * 127; img.data[i * 4 + 2] = 128; img.data[i * 4 + 3] = 255; }
      g.putImageData(img, 0, 0);
      it.f.innerHTML = `<feImage href="${c.toDataURL()}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" result="map"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="map" scale="${(max * 2).toFixed(1)}" xChannelSelector="R" yChannelSelector="G"/>`;
      it.f.setAttribute('width', W); it.f.setAttribute('height', H);
      el.style.setProperty('backdrop-filter', `url(#${it.id}) ${o.after}`);
    }
    const ro = new ResizeObserver(es => es.forEach(e => { const o = items.get(e.target); if (o) { clearTimeout(o.t); o.t = setTimeout(() => build(e.target, o.opt), 120); } }));
    return {
      on(sel, opt) {
        document.querySelectorAll(sel).forEach(el => {
          if (items.has(el)) return;
          const id = 'lg-lens-' + (++uid), f = document.createElementNS(NS, 'filter');
          f.setAttribute('id', id); f.setAttribute('x', '0'); f.setAttribute('y', '0'); f.setAttribute('filterUnits', 'userSpaceOnUse');
          f.setAttribute('color-interpolation-filters', 'sRGB'); defs.appendChild(f);
          const o = { bezel: 22, edge: 26, mag: .06, after: 'blur(2px) saturate(180%) brightness(1.06)', ...opt };
          items.set(el, { id, f, w: 0, h: 0, opt: o }); el.classList.add('lg-lens'); build(el, o); ro.observe(el);
        });
      },
      off() { items.forEach((o, el) => { ro.unobserve(el); o.f.remove(); el.style.removeProperty('backdrop-filter'); el.classList.remove('lg-lens'); }); items.clear(); }
    };
  })();
  const lensOn = () => {
    Lens.on('header', { bezel: 20, edge: 22, mag: .07 });
    Lens.on('.ap-style', { bezel: 14, edge: 12, mag: .08 });
  };

  /* ---------- Galerie : visionneuse ---------- */
  const galLinks = [...document.querySelectorAll('.gallery a')];
  if (galLinks.length) {
    const ic = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
    let lb = null, idx = 0, opener = null;
    const show = i => {
      idx = (i + galLinks.length) % galLinks.length; const a = galLinks[idx], im = a.querySelector('img');
      lb.querySelector('img').src = a.href; lb.querySelector('img').alt = im.alt;
      lb.querySelector('.lb-t').textContent = im.alt; lb.querySelector('.lb-c').textContent = `${idx + 1} / ${galLinks.length}`;
    };
    const close = () => { if (!lb) return; const l = lb; lb = null; l.classList.remove('on'); setTimeout(() => l.remove(), 450); document.removeEventListener('keydown', key); opener?.focus(); };
    const key = e => { if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(idx + 1); else if (e.key === 'ArrowLeft') show(idx - 1); };
    galLinks.forEach((a, i) => a.addEventListener('click', e => {
      e.preventDefault(); opener = a;
      lb = document.createElement('div'); lb.className = 'ap-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Galerie photo');
      lb.innerHTML = `<figure><img alt=""><figcaption><span class="lb-t"></span> <span class="lb-c"></span></figcaption></figure>` +
        `<button type="button" class="lb-x" aria-label="Fermer">${ic('M6 6l12 12M18 6L6 18')}</button>` +
        `<button type="button" class="lb-p" aria-label="Photo précédente">${ic('M15 5l-7 7 7 7')}</button>` +
        `<button type="button" class="lb-n" aria-label="Photo suivante">${ic('M9 5l7 7-7 7')}</button>`;
      document.body.appendChild(lb); show(i);
      lb.addEventListener('click', ev => { if (ev.target === lb || ev.target.closest('.lb-x')) close(); else if (ev.target.closest('.lb-p')) show(idx - 1); else if (ev.target.closest('.lb-n')) show(idx + 1); });
      let sx = 0; lb.addEventListener('touchstart', ev => { sx = ev.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', ev => { const dx = ev.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); });
      document.addEventListener('keydown', key);
      requestAnimationFrame(() => lb.classList.add('on')); lb.querySelector('.lb-x').focus();
    }));
  }

  /* ---------- Verre liquide : lumières de fond mobiles ---------- */
  const orbs = document.createElement('div'); orbs.className = 'lg-orbs'; orbs.setAttribute('aria-hidden', 'true');
  orbs.innerHTML = '<i></i>';
  document.body.prepend(orbs);
  // Les lumières dérivent lentement et suivent un peu la souris ; elles s'arrêtent pendant le défilement
  // pour que celui-ci reste parfaitement fluide.
  let px = 0, py = 0, tx = 0, ty = 0, drift = 0, lastScroll = 0, lastT = 0;
  document.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; tx = (e.clientX / innerWidth - .5) * 50; ty = (e.clientY / innerHeight - .5) * 34; }, { passive: true });
  addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
  const vmax = () => Math.max(innerWidth, innerHeight) / 100;
  const orbTick = now => {
    requestAnimationFrame(orbTick);
    if (!root.classList.contains('theme-verre') || root.classList.contains('ap-reduced') || document.hidden) return;
    if (now - lastScroll < 260) { lastT = now; return; } // pas pendant le défilement
    if (now - lastT < 33) return; // 30 images/s suffisent
    drift += (now - lastT) / 1000; lastT = now;
    px += (tx - px) * .08; py += (ty - py) * .08;
    const v = vmax(), x = Math.sin(drift / 9) * 3.5 * v + Math.sin(drift / 4.3) * .8 * v + px, y = Math.cos(drift / 11) * 3 * v + Math.sin(drift / 6.1) * .8 * v + py;
    orbs.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  };
  requestAnimationFrame(t => { lastT = t; orbTick(t); });

  /* ---------- Apparence : Épuré ou Verre liquide ---------- */
  const LG = ['.cards article', '.news-teaser', '.commitments article', '.pillars article', '.steps article', '.testimonials article', '.prices article',
    '.download', '.price-accordion', '#faq details', '.ap-faq details', '.trainer-entry', '.contact-grid form', '.legal-notice', '.ap-join',
    '.ct-tile', '.ct-form', '.nw-feature', '.nw-tile', '.cj-tile.light', '.cj-card', '.cj-rules article', '.cj-amount:not(.total)', '.bafa-resource-card',
    '.dg-teaser-in', '.bafa-infographic', '.help', '.fo-tile', '.fo-promo', '.fo-chips li'].join(',');
  const lgOn = () => document.querySelectorAll(LG).forEach((el, i) => { el.classList.add('lg'); if (i % 2) el.classList.add('lg-o'); });
  const lgOff = () => document.querySelectorAll('.lg').forEach(el => el.classList.remove('lg', 'lg-o'));
  const applyStyle = v => {
    root.classList.toggle('theme-verre', v === 'verre');
    v === 'verre' ? (lgOn(), requestAnimationFrame(lensOn)) : (lgOff(), Lens.off());
    try { localStorage.setItem('fa-style', v); } catch (_) {}
    picker.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
  };
  const picker = document.createElement('div');
  picker.className = 'ap-style'; picker.setAttribute('role', 'group'); picker.setAttribute('aria-label', 'Apparence du site');
  picker.innerHTML = '<span>Apparence</span><button type="button" data-v="epure">Épuré</button><button type="button" data-v="verre">Verre liquide</button>';
  picker.addEventListener('click', e => { const b = e.target.closest('button'); if (b) applyStyle(b.dataset.v); });
  document.body.appendChild(picker);
  applyStyle(root.classList.contains('theme-verre') ? 'verre' : 'epure');
  // Reflet qui suit le pointeur sur le verre.
  let lgRaf = 0, lgEv = null;
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !root.classList.contains('theme-verre')) return;
    lgEv = e; if (lgRaf) return;
    lgRaf = requestAnimationFrame(() => {
      lgRaf = 0; const el = lgEv.target.closest && lgEv.target.closest('.lg'); if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((lgEv.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((lgEv.clientY - r.top) / r.height * 100 - 30).toFixed(1) + '%');
    });
  }, { passive: true });

  /* ---------- Schémas : avancement piloté par le défilement ---------- */
  document.querySelectorAll('[data-dg-scrub]').forEach(el => scenes.push(() => {
    const r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return;
    const p = clamp((innerHeight * .95 - r.top) / (innerHeight * .45 + r.height * .5));
    el.style.setProperty('--p', p.toFixed(3));
  }));

  /* ---------- Menus déroulants (Fourmi’Action, Nos actions) ---------- */
  const navGroups = [...document.querySelectorAll('.nav-group')];
  if (navGroups.length) {
    const desk = matchMedia('(min-width:1151px)');
    const dim = document.createElement('div'); dim.className = 'nav-dim'; document.body.appendChild(dim);
    let timer = 0, current = null;
    const set = g => {
      clearTimeout(timer);
      navGroups.forEach(x => { const on = x === g; x.classList.toggle('open', on); x.querySelector('.nav-top').setAttribute('aria-expanded', String(on)); });
      current = g; dim.classList.toggle('on', !!g && desk.matches);
    };
    const later = (g, ms) => { clearTimeout(timer); timer = setTimeout(() => set(g), ms); };
    navGroups.forEach(g => {
      const top = g.querySelector('.nav-top');
      g.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && desk.matches) later(g, current ? 0 : 140); });
      g.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && desk.matches) later(null, 260); });
      g.addEventListener('focusin', () => { if (desk.matches) set(g); });
      g.addEventListener('focusout', e => { if (desk.matches && !g.contains(e.relatedTarget)) later(null, 10); });
      top.addEventListener('click', e => { // écran tactile large : le premier appui ouvre le menu
        if (desk.matches && matchMedia('(hover:none)').matches && current !== g) { e.preventDefault(); set(g); }
      });
    });
    dim.addEventListener('pointerenter', () => later(null, 120));
    dim.addEventListener('click', () => set(null));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && current) { const t = current.querySelector('.nav-top'); set(null); t.focus(); } });
    addEventListener('scroll', () => { if (current && !current.contains(document.activeElement)) set(null); }, { passive: true });
    desk.addEventListener?.('change', () => set(null));
  }

  /* ---------- Contact : envoi direct du message (repli vers la messagerie si l’envoi est indisponible) ---------- */
  const cform = document.getElementById('contact-form');
  if (cform && document.getElementById('email')) {
    const t0 = Date.now(), cstatus = document.getElementById('contact-status'), csend = cform.querySelector('button[type=submit]');
    const val = id => (document.getElementById(id) || {}).value || '';
    const repli = () => {
      const body = val('message') + '\n\n' + val('name') + (val('phone') ? '\n' + val('phone') : '');
      location.href = 'mailto:fourmi.action@gmail.com?subject=' + encodeURIComponent(val('subject')) + '&body=' + encodeURIComponent(body);
    };
    document.addEventListener('submit', async e => {
      if (e.target !== cform) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (!cform.reportValidity()) return;
      csend.disabled = true; cform.setAttribute('aria-busy', 'true');
      cstatus.dataset.kind = 'info'; cstatus.textContent = 'Envoi en cours…';
      try {
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: val('name'), email: val('email'), phone: val('phone'), subject: val('subject'), message: val('message'), site: val('site'), t: Date.now() - t0 }) });
        let j = {}; try { j = await r.json(); } catch (_) {}
        if (r.ok && j.ok) {
          cform.classList.add('ct-sent');
          cstatus.dataset.kind = 'ok';
          cstatus.textContent = 'Merci, votre message est bien parti. L’équipe vous répondra à ' + val('email') + '.';
          ['message', 'phone'].forEach(id => { const f = document.getElementById(id); if (f) f.value = ''; });
        } else if (j.repli) {
          cstatus.dataset.kind = 'error';
          cstatus.textContent = (j.error || 'L’envoi direct est indisponible.') + ' Votre messagerie va s’ouvrir avec le message préparé.';
          setTimeout(repli, 900);
        } else {
          cstatus.dataset.kind = 'error';
          cstatus.textContent = j.error || 'Le message n’a pas pu partir. Réessayez dans un instant.';
          if (j.champ) document.getElementById(j.champ)?.focus();
        }
      } catch (_) {
        cstatus.dataset.kind = 'error';
        cstatus.textContent = 'Connexion impossible. Votre messagerie va s’ouvrir avec le message préparé.';
        setTimeout(repli, 900);
      }
      csend.disabled = false; cform.removeAttribute('aria-busy');
    }, true);
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
