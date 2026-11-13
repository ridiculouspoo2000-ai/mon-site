/* Effets Fourmi’Action : fourmilière, cadran du parcours BAFA, billets de session, titre qui tourne,
   nuage des valeurs, photos vivantes. Créations originales ; tout s’arrête hors de l’écran et respecte
   « réduire les animations ». Transformations et opacité uniquement quand c’est possible (fluides à la fréquence de l’écran). */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('ap-reduced');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const coarse = matchMedia('(hover: none)').matches;
  const GRAD = [[30, 116, 232], [34, 181, 240], [139, 92, 246], [238, 77, 134], [242, 112, 30]];
  const gradAt = t => { t = clamp(t) * (GRAD.length - 1); const i = Math.min(GRAD.length - 2, Math.floor(t)), f = t - i; return GRAD[i].map((c, k) => Math.round(lerp(c, GRAD[i + 1][k], f))); };

  // Une seule boucle d’animation pour tous les effets visibles.
  const live = new Set();
  let looping = false;
  function loop(now) {
    if (!live.size || document.hidden) { looping = false; return; }
    live.forEach(f => f(now));
    requestAnimationFrame(loop);
  }
  const wake = () => { if (!looping && live.size) { looping = true; requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', wake);
  function whenVisible(el, f, margin = '120px') {
    if (!('IntersectionObserver' in window)) { live.add(f); wake(); return; }
    new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? live.add(f) : live.delete(f); wake(); }), { rootMargin: margin }).observe(el);
  }

  /* ---------------------------------------------------------------- 1. La fourmilière */
  document.querySelectorAll('canvas.fx-swarm').forEach(cv => {
    const ctx = cv.getContext('2d');
    const word = cv.dataset.word || 'ensemble';
    let W = 0, H = 0, dpr = 1, P = [], ready = false, pointer = null, fontPx = 0, grain = 1.6;
    function sample() {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height; if (!W || !H) return;
      dpr = Math.min(devicePixelRatio || 1, W < 600 ? 1.75 : 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      // Points du mot, tirés d’un rendu hors écran.
      const off = document.createElement('canvas'), ow = Math.round(W), oh = Math.round(H);
      off.width = ow; off.height = oh;
      const o = off.getContext('2d');
      let size = H * .78;
      o.font = `800 ${size}px "FA Display", "FA Inter", -apple-system, sans-serif`;
      const tw = o.measureText(word).width;
      const maxW = W < 600 ? W * .84 : Math.min(W * .78, 1100);
      if (tw > maxW) size *= maxW / tw;
      o.font = `800 ${size}px "FA Display", "FA Inter", -apple-system, sans-serif`;
      o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillText(word, ow / 2, oh * .52);
      fontPx = size;
      const data = o.getImageData(0, 0, ow, oh).data, pts = [];
      const step = Math.max(W < 600 ? 1.9 : 2.2, Math.round(size / 42));
      for (let y = 0; y < oh; y += step) for (let x = 0; x < ow; x += step) if (data[(y * ow + x) * 4 + 3] > 140) pts.push([x + (Math.random() - .5) * step * .6, y + (Math.random() - .5) * step * .6]);
      const n = Math.min(pts.length, W < 600 ? 1300 : 2300);
      for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
      const xs = pts.slice(0, n).map(p => p[0]), minX = Math.min(...xs), maxX = Math.max(...xs);
      P = pts.slice(0, n).map((t, i) => ({
        x: Math.random() * W, y: Math.random() * H, a: Math.random() * Math.PI * 2, v: .25 + Math.random() * .45,
        tx: t[0], ty: t[1], d: Math.random() * .35 + (t[0] - minX) / (maxX - minX || 1) * .25, ox: 0, oy: 0, ph: Math.random() * 6.28,
        c: gradAt((t[0] - minX) / (maxX - minX || 1)), ra: Math.random() * Math.PI
      }));
      grain = Math.max(1.5, step * (W < 600 ? .78 : .95));
      ready = true;
    }
    const progress = () => { const r = cv.getBoundingClientRect(), c = r.top + r.height / 2; return W < 600 ? clamp((innerHeight * .98 - c) / (innerHeight * .73)) : clamp((innerHeight * .92 - c) / (innerHeight * .42)); };
    const BUCKETS = 12;
    function frame(now) {
      if (!ready) return;
      const p = reduced ? 1 : progress(), t = now / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const paths = Array.from({ length: BUCKETS }, () => new Path2D());
      const alphaFree = .38;
      for (const q of P) {
        // Promenade de fourmi : petits changements de cap, rebond sur les bords.
        q.a += (Math.random() - .5) * .35; q.x += Math.cos(q.a) * q.v; q.y += Math.sin(q.a) * q.v;
        if (q.x < 4 || q.x > W - 4) { q.a = Math.PI - q.a; q.x = clamp(q.x, 4, W - 4); }
        if (q.y < 4 || q.y > H - 4) { q.a = -q.a; q.y = clamp(q.y, 4, H - 4); }
        const k = ease(clamp((p * 1.35 - q.d) / .65));
        // Au doigt ou à la souris : elles s’écartent, puis reviennent.
        if (pointer) { const dx = q.tx + q.ox - pointer.x, dy = q.ty + q.oy - pointer.y, dd = dx * dx + dy * dy; if (dd < 4200) { const f = (4200 - dd) / 4200 * 2.4, l = Math.sqrt(dd) || 1; q.ox += dx / l * f; q.oy += dy / l * f; } }
        q.ox *= .9; q.oy *= .9;
        const x = lerp(q.x, q.tx + Math.sin(t * 1.3 + q.ph) * .5, k) + q.ox * k, y = lerp(q.y, q.ty + Math.cos(t * 1.1 + q.ph) * .5, k) + q.oy * k;
        const b = Math.min(BUCKETS - 1, Math.round(k * (BUCKETS - 1)));
        // une petite fourmi (abdomen + tête), orientée dans le sens de sa marche, puis posée à sa place dans le mot
        const ang = k < .5 ? q.a : q.ra, sz = lerp(1.15, grain * .62, k), ca = Math.cos(ang), sa = Math.sin(ang);
        const path = paths[b];
        const bx = x - ca * sz * .9, by = y - sa * sz * .9, hx = x + ca * sz * 1.05, hy = y + sa * sz * 1.05;
        path.moveTo(bx + ca * sz * 1.25, by + sa * sz * 1.25); path.ellipse(bx, by, sz * 1.25, sz * .78, ang, 0, 6.2832);
        path.moveTo(hx + sz * .7, hy); path.arc(hx, hy, sz * .7, 0, 6.2832);
        q.b = b; q.k = k;
      }
      // Couleur : bleu nuit discret quand elles se promènent, dégradé de la marque une fois rassemblées.
      for (let b = 0; b < BUCKETS; b++) {
        const k = b / (BUCKETS - 1);
        ctx.globalAlpha = lerp(alphaFree, 1, k);
        if (k < .5) { ctx.fillStyle = '#142f46'; ctx.fill(paths[b]); }
        else { const g = ctx.createLinearGradient(W * .1, 0, W * .9, 0); GRAD.forEach((c, i) => g.addColorStop(i / (GRAD.length - 1), `rgb(${c})`)); ctx.fillStyle = g; ctx.fill(paths[b]); }
      }
      // Une fois les fourmis rassemblées, le mot apparaît net (dégradé de la marque).
      const crisp = 0;
      if (crisp > 0) {
        ctx.globalAlpha = ease(crisp);
        ctx.font = `800 ${fontPx}px "FA Display", "FA Inter", -apple-system, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const g = ctx.createLinearGradient(W * .1, 0, W * .9, 0); GRAD.forEach((c, i) => g.addColorStop(i / (GRAD.length - 1), `rgb(${c})`));
        ctx.fillStyle = g; ctx.fillText(word, W / 2, H * .52);
      }
      ctx.globalAlpha = 1;
      cv.style.setProperty('--fx-p', p.toFixed(3));
      cv.parentElement.classList.toggle('fx-formed', p > .92);
    }
    const setP = e => { const r = cv.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener('pointermove', setP, { passive: true });
    cv.addEventListener('pointerdown', setP, { passive: true });
    cv.addEventListener('pointerleave', () => { pointer = null; });
    cv.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') pointer = null; });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { sample(); if (reduced) frame(0); });
    let rw = 0; addEventListener('resize', () => { if (Math.abs(innerWidth - rw) > 40) { rw = innerWidth; sample(); } });
    rw = innerWidth;
    if (!reduced) whenVisible(cv, frame);
  });

  /* ---------------------------------------------------------------- 2. Le cadran du parcours BAFA */
  document.querySelectorAll('.fx-dial').forEach(dial => {
    root.classList.add('fx-has-dial');
    const segs = [...dial.querySelectorAll('.fx-seg')], steps = [...dial.querySelectorAll('.fx-step')], dots = [...dial.querySelectorAll('.fx-dots i')];
    const num = dial.querySelector('.fx-num'), days = dial.querySelector('.fx-days b'), unit = dial.querySelector('.fx-days small');
    const D = steps.map(s => +s.dataset.days);
    let cur = -1;
    function set(i) {
      if (i === cur) return; cur = i;
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      dots.forEach((d, k) => d.classList.toggle('on', k <= i));
      num.dataset.n = num.textContent = '0' + (i + 1);
      num.classList.remove('fx-tick'); void num.offsetWidth; num.classList.add('fx-tick');
      if (unit) unit.textContent = steps[i].dataset.unit || 'jours effectifs';
      countTo(D[i]);
    }
    let cv = 0, raf = 0;
    function countTo(v) {
      cancelAnimationFrame(raf); const from = cv, t0 = performance.now();
      const run = now => { const t = clamp((now - t0) / 700); cv = Math.round(lerp(from, v, easeOut(t))); days.textContent = cv; if (t < 1) raf = requestAnimationFrame(run); };
      reduced ? (cv = v, days.textContent = v) : (raf = requestAnimationFrame(run));
    }
    const scene = dial.closest('.fx-dial-scene');
    const box = dial.querySelector('.fx-steps');
    const fitH = () => { box.style.minHeight = Math.max(...steps.map(x => x.offsetHeight)) + 'px'; };
    fitH(); addEventListener('resize', fitH); if (document.fonts) document.fonts.ready.then(fitH);
    // Chaque segment : longueur proportionnelle à la durée de l’étape (cercle découpé en 100).
    function paint(s, f) { const L = +s.dataset.len, a = +s.dataset.start; s.style.strokeDasharray = `${(L * f).toFixed(3)} 200`; s.style.strokeDashoffset = (-a).toFixed(3); s.style.opacity = f > .002 ? 1 : 0; }
    dial.querySelectorAll('.fx-track').forEach(t => { t.style.strokeDasharray = `${t.dataset.len} 200`; t.style.strokeDashoffset = -t.dataset.start; });
    function frame() {
      const r = scene.getBoundingClientRect(), run = r.height - innerHeight;
      const p = run > 0 ? clamp(-r.top / run) : clamp((innerHeight * .6 - r.top) / (innerHeight * .6));
      segs.forEach((s, i) => paint(s, clamp((p * 1.08 - i / 3) * 3)));
      set(Math.min(2, Math.floor(clamp(p * 1.08) * 3)));
      dial.style.setProperty('--p', p.toFixed(4));
    }
    if (reduced) { segs.forEach(s => paint(s, 1)); set(0); steps.forEach(s => s.classList.add('on')); dial.classList.add('fx-static'); return; }
    set(0); whenVisible(scene, frame, '0px');
  });

  /* ---------------------------------------------------------------- 3. Billets de session (inclinaison et reflet) */
  const cut = () => document.querySelectorAll('.tk-card').forEach(c => { const t = c.querySelector('.tk-top'); if (t) c.style.setProperty('--cut', (t.offsetHeight + 11) + 'px'); });
  cut(); addEventListener('resize', cut); if (document.fonts) document.fonts.ready.then(cut);
  // Cartes vivantes : elles ondulent d’elles-mêmes (ordinateur et téléphone), suivent la souris ou le doigt,
  // et un reflet de lumière glisse dessus. Transformations seules (fluides à la fréquence de l’écran).
  const LIVE = [];
  // Les photos de « Nos actions » reçoivent un cadre pour l’inclinaison et le reflet.
  document.querySelectorAll('main .split img.photo').forEach(img => {
    if (!/nos-actions/.test(location.pathname)) return;
    const w = document.createElement('span'); w.className = 'fx-live-img';
    img.parentNode.insertBefore(w, img); w.append(img);
  });
  document.querySelectorAll('.tk-in, .h2-photo, .fx-live-img').forEach((el, i) => {
    const host = el.querySelector('.tk-card') || el;
    const g = document.createElement('span'); g.className = 'fx-glare'; g.setAttribute('aria-hidden', 'true'); host.append(g);
    const kind = el.classList.contains('tk-in') ? 'tk' : el.classList.contains('h2-photo') ? 'hero' : 'img';
    LIVE.push({ el, g, kind, ph: i * 1.7 + Math.random(), x: 0, y: 0, px: null, py: null, on: false });
  });
  const AMP = { tk: [16, 12], hero: [17, 13], img: [12, 9] };
  LIVE.forEach(c => {
    const set = e => { const r = c.el.getBoundingClientRect(); c.px = ((e.clientX - r.left) / r.width - .5) * 2; c.py = ((e.clientY - r.top) / r.height - .5) * 2; c.on = true; };
    c.el.addEventListener('pointermove', set, { passive: true });
    c.el.addEventListener('pointerdown', set, { passive: true });
    const off = () => { c.on = false; };
    c.el.addEventListener('pointerleave', off);
    c.el.addEventListener('pointercancel', off);
    c.el.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') setTimeout(off, 600); });
    if (reduced) return;
    whenVisible(c.el, now => {
      const t = now / 1000, r = c.el.getBoundingClientRect();
      // mouvement de repos : lent, ample sur téléphone, plus discret sur ordinateur
      if (c.kind === 'hero' && coarse && !c.el.closest('.h2-open')) return;
      const k = (coarse ? .95 : .45) * (c.kind === 'hero' ? 1.25 : 1), sp = coarse ? 2 : 1;
      let ix = (Math.sin(t * .7 * sp + c.ph) * .7 + Math.sin(t * .31 * sp + c.ph * 2) * .3) * k;
      let iy = (Math.cos(t * .55 * sp + c.ph) * .6 + ((r.top + r.height / 2) / innerHeight - .5) * .8) * k;
      if (c.on) { ix = c.px; iy = c.py; }
      const f = c.on ? .16 : (coarse ? .1 : .06);
      c.x += (ix - c.x) * f; c.y += (iy - c.y) * f;
      const [ay, ax] = AMP[c.kind];
      c.el.style.transform = `perspective(1000px) rotateY(${(c.x * ay).toFixed(2)}deg) rotateX(${(-c.y * ax).toFixed(2)}deg) translateZ(0)`;
      c.g.style.transform = `translate3d(${(c.x * 32).toFixed(2)}%,${(c.y * 32).toFixed(2)}%,0)`;
      c.g.style.opacity = c.on ? 1 : (coarse ? .85 : .55);
    });
  });

  /* ---------------------------------------------------------------- 4. Le titre qui tourne */
  document.querySelectorAll('.fx-rot').forEach(rot => {
    const words = [...rot.querySelectorAll('.fx-w')];
    if (words.length < 2) return;
    const stack = rot.querySelector('.fx-stack');
    stack.append(words[0].cloneNode(true));
    let i = 0;
    const fit = () => { rot.style.width = words[i % words.length].getBoundingClientRect().width + 'px'; };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
    if (reduced) return;
    setInterval(() => {
      if (document.hidden) return;
      i++;
      stack.style.transition = ''; stack.style.transform = `translate3d(0,${-i * 1.15}em,0)`;
      rot.style.width = (i % words.length === 0 ? words[0] : words[i]).getBoundingClientRect().width + 'px';
      if (i === words.length) setTimeout(() => { stack.style.transition = 'none'; stack.style.transform = 'translate3d(0,0,0)'; i = 0; }, 820);
    }, 2300);
  });

  /* ---------------------------------------------------------------- 5. Le nuage des valeurs */
  document.querySelectorAll('.fx-values').forEach(box => {
    const items = [...box.children]; if (items.length < 6) return;
    box.classList.add('fx-sphere'); box.setAttribute('role', 'list'); items.forEach(it => it.setAttribute('role', 'listitem'));
    const n = items.length, G = Math.PI * (3 - Math.sqrt(5));
    const pts = items.map((_, i) => { const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = G * i; return [Math.cos(th) * r, y, Math.sin(th) * r]; });
    let ax = -.25, ay = 0, vx = 0, vy = reduced ? 0 : -.03, drag = null, hover = false, R = 150, auto = !reduced;
    const BASE = -.0055;
    const ctl = document.createElement('div'); ctl.className = 'fx-cloud-ctl';
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'fx-cloud-btn';
    const hint = document.createElement('span'); hint.className = 'fx-cloud-hint';
    hint.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0v3.5a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.4 14.6a1.5 1.5 0 0 1 2.3-1.9L9 15"/></svg>' + (coarse ? 'Faites-la tourner du doigt' : 'Faites-la tourner à la souris');
    const paintBtn = () => { btn.innerHTML = auto ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>Arrêter la rotation' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg>Rotation automatique'; btn.setAttribute('aria-pressed', String(auto)); };
    btn.addEventListener('click', () => { auto = !auto; paintBtn(); ctl.classList.add('used'); });
    paintBtn(); ctl.append(btn, hint); box.after(ctl);
    const size = () => { R = Math.min(box.clientWidth * .38, 190); box.style.height = (R * 2.35) + 'px'; };
    size(); addEventListener('resize', size);
    function draw() {
      const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
      items.forEach((it, i) => {
        let [x, y, z] = pts[i];
        let x1 = x * cy + z * sy, z1 = -x * sy + z * cy;           // rotation verticale
        let y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;            // rotation horizontale
        const s = .62 + (z2 + 1) * .3;
        it.style.transform = `translate3d(${(x1 * R).toFixed(1)}px,${(y2 * R * .82).toFixed(1)}px,0) translate(-50%,-50%) scale(${s.toFixed(3)})`;
        it.style.opacity = (.32 + (z2 + 1) * .34).toFixed(3);
        it.style.zIndex = Math.round((z2 + 1) * 50);
      });
    }
    function frame() {
      if (!drag) { vx *= .95; vy += ((auto ? (hover ? BASE * .3 : BASE) : 0) - vy) * .025; }
      ax = clamp(ax + vx, -.9, .9); ay += vy;
      const r = box.getBoundingClientRect(), sp = clamp((innerHeight - r.top) / (innerHeight + r.height));
      const keep = ay; ay = keep - sp * Math.PI * 2; draw(); ay = keep;   // le défilement fait faire un tour complet, de droite à gauche
    }
    box.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; ctl.classList.add('used'); });
    addEventListener('pointermove', e => { if (!drag) return; vy = (e.clientX - drag.x) * .0045; vx = -(e.clientY - drag.y) * .002; drag = { x: e.clientX, y: e.clientY }; }, { passive: true });
    addEventListener('pointerup', () => { drag = null; });
    box.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    box.addEventListener('pointerleave', () => { hover = false; });
    draw();
    if (!reduced) whenVisible(box, frame);
  });


  /* ---------------------------------------------------------------- 7. Page BAFA : le site se divise en deux */
  const fork = document.querySelector('.bf-fork');
  if (fork) {
    const main = document.querySelector('main');
    const br = { a: document.getElementById('decouvrir'), b: document.getElementById('prochaines-sessions') };
    const branchOf = el => { const b = el && el.closest && el.closest('.bf-branch'); return b ? b.dataset.branch : null; };
    const lines = [...fork.querySelectorAll('.bf-l, .bf-stem')];
    function choose(k, target, smooth) {
      const first = !main.dataset.branch;
      main.dataset.branch = k;
      Object.entries(br).forEach(([n, el]) => el && el.classList.toggle('on', n === k));
      document.querySelectorAll('[data-branch-link]').forEach(a => { const on = a.dataset.branchLink === k; a.classList.toggle('on', on); a.classList.toggle('off', !on); a.setAttribute('aria-current', on ? 'true' : 'false'); });
      dispatchEvent(new Event('resize'));
      const go = target || (first ? fork : br[k]);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const y = go.getBoundingClientRect().top + scrollY - (go === fork ? 70 : 140);
        scrollTo({ top: Math.max(0, y), behavior: smooth && !reduced ? 'smooth' : 'auto' });
      }));
    }
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href*="#"]'); if (!a) return;
      const u = new URL(a.href, location.href); if (u.pathname !== location.pathname || !u.hash) return;
      const id = decodeURIComponent(u.hash.slice(1));
      let k = a.dataset.branchLink, t = null;
      if (!k) { t = document.getElementById(id); k = branchOf(t); if (!k) return; }
      e.preventDefault(); e.stopPropagation();
      history.pushState(null, '', '#' + id);
      choose(k, t, true);
    }, true);
    const fromHash = smooth => {
      const id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
      if (id === 'decouvrir' || id === 'prochaines-sessions') return choose(id === 'decouvrir' ? 'a' : 'b', null, smooth);
      const t = document.getElementById(id), k = branchOf(t); if (k) choose(k, t, smooth);
    };
    addEventListener('popstate', () => fromHash(false));
    fromHash(false);
    // Le tracé de la bifurcation se dessine en arrivant dessus.
    if (!reduced) whenVisible(fork, () => {
      const r = fork.getBoundingClientRect(), p = clamp((innerHeight * .8 - r.top) / (innerHeight * .32));
      lines.forEach((l, i) => l.style.strokeDashoffset = (100 - clamp(p * 1.6 - (i ? .4 : 0)) * 100).toFixed(2));
    });
    else lines.forEach(l => l.style.strokeDashoffset = 0);
  }

  /* ---------------------------------------------------------------- 8. Accueil : raccourci vers les prochaines sessions (billets en éventail) */
  document.querySelectorAll('.bf-deck').forEach(deck => {
    if (reduced) { deck.style.setProperty('--fan', 1); return; }
    whenVisible(deck, () => {
      const r = deck.getBoundingClientRect();
      deck.style.setProperty('--fan', ease(clamp((innerHeight * .8 - r.top) / (innerHeight * .32))).toFixed(4));
    });
  });


  /* ---------------------------------------------------------------- 9. Schéma « Nos actions » sur téléphone : envois depuis le centre */
  document.querySelectorAll('.dg-hub .dg-stage').forEach(stage => {
    const core = stage.querySelector('.dg-core'), cards = [...stage.querySelectorAll('.dg-card')];
    if (!core || !cards.length) return;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'fx-hub-m'); svg.setAttribute('aria-hidden', 'true');
    stage.prepend(svg);
    const draw = () => {
      svg.innerHTML = '';
      if (innerWidth > 760 || reduced) return;
      const S = stage.getBoundingClientRect(), C = core.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${S.width} ${S.height}`);
      svg.innerHTML = '<defs><linearGradient id="fxh-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e74e8"/><stop offset=".55" stop-color="#8b5cf6"/><stop offset="1" stop-color="#f2701e"/></linearGradient></defs>';
      const cx = C.left - S.left + C.width / 2, cy = C.top - S.top + C.height / 2, rad = C.width / 2;
      cards.forEach((card, i) => {
        const R = card.getBoundingClientRect(), left = R.left - S.left + R.width / 2 < cx, up = R.top + R.height / 2 - S.top < cy;
        const sx = cx + (left ? -1 : 1) * rad * .7, sy = cy + (up ? -1 : 1) * rad * .7;   // départ : le bord du cercle, en diagonale
        const tx = R.left - S.left + R.width / 2, ty = up ? R.bottom - S.top - 4 : R.top - S.top + 4;
        const d = `M${sx},${sy} C${sx},${(sy + ty) / 2} ${tx},${(sy + ty) / 2} ${tx},${ty}`;
        const path = document.createElementNS(NS, 'path'); path.setAttribute('d', d); path.setAttribute('class', 'fx-hub-wire'); svg.append(path);
        const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', '4.5'); dot.setAttribute('class', 'fx-hub-dot');
        const mo = document.createElementNS(NS, 'animateMotion'); mo.setAttribute('dur', (2.4 + i * .35).toFixed(2) + 's'); mo.setAttribute('repeatCount', 'indefinite'); mo.setAttribute('path', d); mo.setAttribute('begin', (i * .45).toFixed(2) + 's');
        dot.append(mo); svg.append(dot);
      });
    };
    draw(); let w0 = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - w0) > 30) { w0 = innerWidth; draw(); } });
    if (document.fonts) document.fonts.ready.then(draw);
  });


  /* ---------------------------------------------------------------- 10. Ancres (#adherer…) : on arrive pile au bon endroit */
  (() => {
    let user = false, until = 0, target = null;
    ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => { user = true; }, { passive: true }));
    const go = () => {
      if (!target || user || performance.now() > until) return;
      if (target.closest('.bf-branch:not(.on)')) return;
      const y = target.getBoundingClientRect().top + scrollY - 84;
      if (Math.abs(y - scrollY) > 4) scrollTo({ top: y, behavior: 'auto' });
    };
    const arm = () => {
      const id = decodeURIComponent(location.hash.slice(1)); target = id ? document.getElementById(id) : null;
      if (!target) return; user = false; until = performance.now() + 2600; go();
    };
    if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(go)).observe(document.body);
    addEventListener('hashchange', () => setTimeout(arm, 30));
    addEventListener('load', () => { if (location.hash) { arm(); setTimeout(go, 400); } });
    document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href*="#"]'); if (a && new URL(a.href, location.href).pathname === location.pathname) setTimeout(arm, 60); });
    if (location.hash) arm();
  })();

  /* ---------------------------------------------------------------- 6. Photos vivantes */
  if (!reduced) {
    const imgs = [...document.querySelectorAll('main .cards article img, main .split img:not(.competences-image), main .cj-photo img')].filter(img => {
      const p = img.parentElement; if (!p) return false;
      const cs = getComputedStyle(p);
      return cs.overflow === 'hidden' || cs.overflowY === 'hidden' || cs.clipPath !== 'none';
    });
    imgs.forEach(img => {
      img.classList.add('fx-par');
      whenVisible(img, () => {
        const r = img.getBoundingClientRect();
        const t = clamp((r.top + r.height / 2) / innerHeight, -.2, 1.2) - .5;
        img.style.setProperty('--py', (t * -6).toFixed(2) + '%');
      }, '60px');
    });
  }
})();
