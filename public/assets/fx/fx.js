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
  const GRAD = [[43, 91, 215], [93, 83, 211], [155, 86, 166], [217, 102, 47]];
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
  // Position des éléments dans la page, gardée en mémoire (sans leurs transformations) : aucune mesure de mise en page
  // à chaque image, et un élément animé ne se mesure jamais déplacé par sa propre animation (sinon il tremble).
  // Hauteur d’écran stable sur téléphone (la barre d’adresse ne fait plus sauter les effets).
  let VH = document.documentElement.clientHeight || innerHeight, VW0 = innerWidth, gen = 0;
  const geoC = new WeakMap();
  const box = el => {
    let g = geoC.get(el);
    if (!g || g.gen !== gen) { let y = 0, x = 0, n = el; while (n) { y += n.offsetTop || 0; x += n.offsetLeft || 0; n = n.offsetParent; } g = { gen, y, x, h: el.offsetHeight || 0, w: el.offsetWidth || 0 }; geoC.set(el, g); }
    const top = g.y - scrollY; return { top, bottom: top + g.h, height: g.h, left: g.x - scrollX, width: g.w };
  };
  const regeo = () => { gen++; };
  addEventListener('resize', () => { const w = innerWidth, h = document.documentElement.clientHeight || innerHeight; if (!coarse || Math.abs(w - VW0) > 30 || Math.abs(h - VH) > 160) { VW0 = w; VH = h; } regeo(); }, { passive: true });
  addEventListener('load', regeo); if (document.fonts) document.fonts.ready.then(regeo);
  if ('ResizeObserver' in window) { let bh = 0; new ResizeObserver(() => { const h = document.body.offsetHeight; if (Math.abs(h - bh) > 1) { bh = h; regeo(); } }).observe(document.body); }

  /* ---------------------------------------------------------------- 1. La fourmilière */
  // Les fourmis se promènent, éparpillées sur toute la largeur, dans la zone qui va du long texte d’introduction
  // jusqu’au mot (calque transparent derrière le contenu) ; en arrivant sur le mot, elles convergent pour l’écrire.
  document.querySelectorAll('canvas.fx-swarm').forEach(cv => {
    const word = cv.dataset.word || 'ensemble';
    const fly = reduced ? cv : document.body.appendChild(Object.assign(document.createElement('canvas'), { className: 'fx-swarm-fly' }));
    fly.setAttribute('aria-hidden', 'true');
    const ctx = fly.getContext('2d');
    let W = 0, H = 0, VW = 0, VH = 0, dpr = 1, P = [], ready = false, pointer = null, grain = 1.6, cleared = false, RH = 0;
    // Zone de promenade : du début du texte d’introduction (section précédente) jusqu’au bas de la section du mot.
    const sec = cv.closest('section') || cv.parentElement, prev = sec.previousElementSibling;
    // Les fourmis apparaissent vers la fin du texte d’introduction (dernier paragraphe), pas dès son début.
    const lastP = prev && prev.matches('.intro-grid, .section') ? [...prev.querySelectorAll('p')].pop() : null;
    const zoneTop = lastP || sec;
    // zone de promenade : du dernier paragraphe d’introduction jusqu’au bas du premier écran de la section du mot
    function zoneH() { const s = sec.getBoundingClientRect(); return Math.min(s.bottom, s.top + innerHeight) - zoneTop.getBoundingClientRect().top; }
    function sizeFly() {
      VW = reduced ? W : document.documentElement.clientWidth; VH = reduced ? H : innerHeight;
      dpr = Math.min(devicePixelRatio || 1, VW < 600 ? 1.75 : 2);
      fly.width = Math.round(VW * dpr); fly.height = Math.round(VH * dpr); sprites();
      if (!reduced) { fly.style.width = VW + 'px'; fly.style.height = VH + 'px'; }
    }
    function sample() {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height; if (!W || !H) return;
      sizeFly();
      // Points du mot, tirés d’un rendu hors écran (coordonnées dans la section).
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
      const data = o.getImageData(0, 0, ow, oh).data, pts = [];
      mask = { data, ow, oh };
      const step = Math.max(W < 600 ? 1.9 : 2.2, Math.round(size / 42));
      for (let y = 0; y < oh; y += step) for (let x = 0; x < ow; x += step) if (data[(y * ow + x) * 4 + 3] > 140) pts.push([x + (Math.random() - .5) * step * .6, y + (Math.random() - .5) * step * .6]);
      let n = Math.min(pts.length, W < 600 ? 950 : 1600);
      // places réparties sur une grille régulière (et non tirées au hasard) : le mot est rempli uniformément
      if (pts.length > n) {
        const st2 = step * Math.sqrt(pts.length / n); pts.length = 0;
        for (let y = st2 / 2; y < oh; y += st2) for (let x = ((y / st2) | 0) % 2 ? st2 / 2 : 0; x < ow; x += st2) { const X = x | 0, Y = y | 0; if (data[(Y * ow + X) * 4 + 3] > 140) pts.push([x + (Math.random() - .5) * st2 * .35, y + (Math.random() - .5) * st2 * .35]); }
        n = pts.length;
      }
      for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
      const xs = pts.slice(0, n).map(p => p[0]), minX = Math.min(...xs), maxX = Math.max(...xs);
      RH = zoneH();
      P = pts.slice(0, n).map(t => ({
        x: Math.random() * VW, y: Math.random() * RH, a: Math.random() * Math.PI * 2, v: .3 + Math.random() * .5,
        hid: Math.random() < .62,   // la plupart restent invisibles pendant la promenade et n’apparaissent qu’en rejoignant le mot
        tx: t[0], ty: t[1], d: Math.random() * .35 + (t[0] - minX) / (maxX - minX || 1) * .25, ox: 0, oy: 0, ph: Math.random() * 6.28,
        ra: Math.random() * Math.PI * 2, wv: .25 + Math.random() * .3
      }));
      grain = Math.max(1.5, step * (W < 600 ? .78 : .95));
      maxD = Math.max(...P.map(q => q.d)); formed = null; liveGrad = null;
      ready = true;
    }
    // Planche de fourmis pré-dessinées (24 orientations) : pendant la promenade, on copie de petites images
    // au lieu de tracer des milliers de formes à chaque image (bien plus fluide, même sur téléphone).
    // Chaque fourmi : abdomen, thorax, tête, deux antennes et six pattes, dessinées en deux temps de marche
    // (les pattes avancent en alternance : trois d’un côté, trois de l’autre).
    const ANG = 24, SPR = [], SB = 1.2, SS = 11;
    function antShape(g, sz, f) {
      g.beginPath();
      g.ellipse(-sz * 1.05, 0, sz * 1.2, sz * .74, 0, 0, 6.2832);       // abdomen
      g.moveTo(sz * .5, 0); g.arc(0, 0, sz * .5, 0, 6.2832);             // thorax
      g.moveTo(sz * 1.45, 0); g.arc(sz * .95, 0, sz * .52, 0, 6.2832);   // tête
      g.fill();
      g.beginPath(); g.lineWidth = sz * .13; g.lineCap = 'round';
      const sw = f ? 1 : -1;
      [-.55, 0, .55].forEach((lx, i) => {            // trois paires de pattes
        const k = (i % 2 ? -1 : 1) * sw * .45;
        g.moveTo(lx * sz * .6, 0); g.lineTo((lx + k) * sz * 1.2, -sz * 1.35);
        g.moveTo(lx * sz * .6, 0); g.lineTo((lx - k) * sz * 1.2, sz * 1.35);
      });
      g.moveTo(sz * 1.3, -sz * .2); g.lineTo(sz * 2.05, -sz * .85);    // antennes
      g.moveTo(sz * 1.3, sz * .2); g.lineTo(sz * 2.05, sz * .85);
      g.stroke();
    }
    function sprites() {
      SPR.length = 0;
      for (let i = 0; i < ANG; i++) {
        const pair = [];
        for (let f = 0; f < 2; f++) {
          const c = document.createElement('canvas'); c.width = c.height = Math.ceil(SS * dpr * 2);
          const g = c.getContext('2d'); g.setTransform(dpr * 2, 0, 0, dpr * 2, 0, 0); g.translate(SS / 2, SS / 2);
          g.rotate(i / ANG * Math.PI * 2); g.fillStyle = g.strokeStyle = '#142f46';
          antShape(g, SB, f); pair.push(c);
        }
        SPR.push(pair);
      }
    }
    let formed = null, maxD = 1, lastMove = 0, shownInPage = false, mask = null;
    // le mot formé, posé dans le canevas de la page (il défile avec le texte)
    function inPage(on) {
      if (on === shownInPage) return; shownInPage = on;
      const c2 = cv.getContext('2d');
      if (on) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.classList.add('fx-inpage'); }
      else { c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, cv.width, cv.height); cv.classList.remove('fx-inpage'); }
    }
    const pointerIdle = () => performance.now() - lastMove > 900 && P.every(q => Math.abs(q.ox) + Math.abs(q.oy) < .3);
    function bake() {   // le mot formé, dessiné une seule fois (mêmes fourmis, mêmes couleurs)
      const c = document.createElement('canvas'); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const path = new Path2D(), sz = grain * .62;
      for (const q of P) {
        const ca = Math.cos(q.ra), sa = Math.sin(q.ra), bx = q.tx - ca * sz * .9, by = q.ty - sa * sz * .9, hx = q.tx + ca * sz * 1.05, hy = q.ty + sa * sz * 1.05;
        path.moveTo(bx + ca * sz * 1.25, by + sa * sz * 1.25); path.ellipse(bx, by, sz * 1.25, sz * .78, q.ra, 0, 6.2832);
        path.moveTo(hx + sz * .7, hy); path.arc(hx, hy, sz * .7, 0, 6.2832);
      }
      const gr = g.createLinearGradient(W * .1, 0, W * .9, 0); GRAD.forEach((col, i) => gr.addColorStop(i / (GRAD.length - 1), `rgb(${col})`));
      g.fillStyle = gr; g.fill(path); return c;
    }
    // Section épinglée : les fourmis se rassemblent tout au long du défilement de la section (sur plus d’une hauteur d’écran),
    // le mot est complet un peu avant la fin, puis reste affiché le temps de lire la phrase.
    const pin = cv.closest('.fx-swarm-pin');
    const pinned = () => pin && getComputedStyle(pin).position === 'sticky';
    const progress = r => {
      if (pinned()) { const s = box(sec), vh = VH || innerHeight, run = Math.max(1, s.height - vh); return clamp((vh * .35 - s.top) / (run * .78 + vh * .35)); }
      const c = r.top + r.height / 2; return W < 600 ? clamp((innerHeight * .98 - c) / (innerHeight * .73)) : clamp((innerHeight * .92 - c) / (innerHeight * .42));
    };
    // Mot formé : les fourmis continuent de marcher, chacune dans sa lettre. Si son prochain pas sort de la lettre,
    // elle fait demi-tour ; le mot reste donc lisible. Dessin dans le canevas de la page (il défile avec le texte),
    // puis le dégradé de la marque est appliqué d’un coup sur toutes les fourmis.
    const inside = (x, y) => { if (!mask) return true; const X = x | 0, Y = y | 0; if (X < 0 || Y < 0 || X >= mask.ow || Y >= mask.oh) return false; return mask.data[(Y * mask.ow + X) * 4 + 3] > 120; };
    let liveGrad = null; const layer = document.createElement('canvas');
    // Marche d’une fourmi dans sa lettre : cap qui varie doucement ; au bord, elle cherche le cap le plus proche
    // qui reste dans la lettre et longe le bord (pas de demi-tours sur place). L’orientation affichée suit le cap en douceur.
    const TRY = [.35, -.35, .7, -.7, 1.1, -1.1, 1.6, -1.6, 2.2, -2.2, 2.8, -2.8];
    function walk(q) {
      if (q.hx === undefined) { q.hx = q.tx; q.hy = q.ty; }
      // chacune garde sa place attitrée (répartition uniforme du mot) et se promène autour, sans trop s’en éloigner
      const lim = grain * 4, dx = q.hx - q.tx, dy = q.hy - q.ty, dd = dx * dx + dy * dy;
      if (dd > lim * lim) { const to = Math.atan2(dy, dx); let d = to - q.ra; d = Math.atan2(Math.sin(d), Math.cos(d)); q.ra += d * .25; }
      q.ra += (Math.random() - .5) * .16;
      let nx = q.tx + Math.cos(q.ra) * q.wv, ny = q.ty + Math.sin(q.ra) * q.wv;
      if (!inside(nx, ny)) {
        let ok = false;
        for (const da of TRY) { const a = q.ra + da, x = q.tx + Math.cos(a) * q.wv * 2.5, y = q.ty + Math.sin(a) * q.wv * 2.5; if (inside(x, y)) { q.ra = a; ok = true; break; } }
        if (!ok) { q.ra = Math.atan2(q.hy - q.ty, q.hx - q.tx); nx = q.tx + Math.cos(q.ra) * q.wv; ny = q.ty + Math.sin(q.ra) * q.wv; q.tx = nx; q.ty = ny; return; }
        nx = q.tx + Math.cos(q.ra) * q.wv; ny = q.ty + Math.sin(q.ra) * q.wv;
        if (!inside(nx, ny)) return;
      }
      q.tx = nx; q.ty = ny;
    }
    const face = q => { if (q.fa === undefined) q.fa = q.ra; let d = q.ra - q.fa; d = Math.atan2(Math.sin(d), Math.cos(d)); q.fa += d * .2; return Math.round(((q.fa % 6.2832) + 6.2832) % 6.2832 / 6.2832 * ANG) % ANG; };
    function liveWord(t) {
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      const sz = grain * .5, d = SS * sz / SB;
      for (const q of P) {
        walk(q);
        // loupe : à la souris ou au doigt, les fourmis s’écartent puis reviennent, sans cesser de marcher
        if (pointer) { const dx = q.tx + q.ox - pointer.x, dy = q.ty + q.oy - pointer.y, dd = dx * dx + dy * dy; if (dd < 4200) { const f = (4200 - dd) / 4200 * 2.4, l = Math.sqrt(dd) || 1; q.ox += dx / l * f; q.oy += dy / l * f; } }
        q.ox *= .9; q.oy *= .9;
        const ai = face(q);
        g.drawImage(SPR[ai][((t * 7 + q.ph) | 0) & 1], q.tx + q.ox - d / 2, q.ty + q.oy - d / 2, d, d);
      }
      if (!liveGrad) { liveGrad = g.createLinearGradient(W * .1, 0, W * .9, 0); GRAD.forEach((c, i) => liveGrad.addColorStop(i / (GRAD.length - 1), `rgb(${c})`)); }
      g.globalCompositeOperation = 'source-in'; g.fillStyle = liveGrad; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
    }
    const BUCKETS = 12;
    function frame(now) {
      if (!ready) return;
      const R = reduced ? null : cv.getBoundingClientRect();   // position réelle à l’écran (le canevas est épinglé)
      const clearFly = () => { if (!cleared) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, fly.width, fly.height); cleared = true; } };
      // Section dépassée (mot sorti par le haut) : plus rien à dessiner.
      if (!reduced && R.bottom < -40) { clearFly(); return; }
      const isPinned = !reduced && pinned();
      const p = reduced ? 1 : progress(R), t = now / 1000;
      const X0 = reduced ? 0 : R.left, Y0 = reduced ? 0 : R.top;
      const ZT = reduced ? 0 : box(zoneTop).top;   // haut de la zone de promenade, à l’écran
      if (!reduced && (ZT > VH + 10 || (ZT + RH < -10 && !(isPinned && R.bottom > 0)))) { clearFly(); return; }
      // Mot entièrement formé et personne ne le touche : l’image du mot est posée dans la page elle-même
      // (elle défile avec le texte, sans aucun décalage), et le calque des fourmis en promenade est vidé.
      const still = p * 1.35 - maxD >= .66;
      if (still) {
        if (!formed) formed = bake();
        if (reduced) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, VW, VH); ctx.globalAlpha = 1; ctx.drawImage(formed, X0, Y0, W, H); }
        else { clearFly(); inPage(true); liveWord(t); }
        cv.parentElement.classList.toggle('fx-formed', true);
        return;
      }
      if (!reduced) inPage(false);
      cleared = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, VW, VH);
      // calque des fourmis déjà arrivées (même taille que le calque des promeneuses)
      if (layer.width !== fly.width || layer.height !== fly.height) { layer.width = fly.width; layer.height = fly.height; }
      const lg = layer.getContext('2d'); lg.setTransform(dpr, 0, 0, dpr, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, VW, VH);
      for (const q of P) {
        // Promenade de fourmi sur tout l’écran : petits changements de cap, rebond sur les bords.
        q.a += (Math.random() - .5) * .35; q.x += Math.cos(q.a) * q.v; q.y += Math.sin(q.a) * q.v;
        if (q.x < 4 || q.x > VW - 4) { q.a = Math.PI - q.a; q.x = clamp(q.x, 4, VW - 4); }
        if (q.y < 4 || q.y > RH - 4) { q.a = -q.a; q.y = clamp(q.y, 4, RH - 4); }
        const k = ease(clamp((p * 1.35 - q.d) / .65));
        // une fois arrivées (ou presque), elles fourmillent déjà dans leur lettre, comme quand le mot est fini
        if (k > .5) walk(q);
        // Au doigt ou à la souris : elles s’écartent, puis reviennent.
        if (pointer) { const dx = q.tx + q.ox - pointer.x, dy = q.ty + q.oy - pointer.y, dd = dx * dx + dy * dy; if (dd < 4200) { const f = (4200 - dd) / 4200 * 2.4, l = Math.sqrt(dd) || 1; q.ox += dx / l * f; q.oy += dy / l * f; } }
        q.ox *= .9; q.oy *= .9;
        const x = lerp(q.x, X0 + q.tx, k) + q.ox * k, y = lerp(ZT + q.y, Y0 + q.ty, k) + q.oy * k;
        if (x < -6 || x > VW + 6 || y < -6 || y > VH + 6) continue;
        const b = Math.min(BUCKETS - 1, Math.round(k * (BUCKETS - 1)));
        const sz = lerp(1.2, grain * .62, k);
        if (b < BUCKETS / 2) {   // en promenade : petite image pré-dessinée, orientée dans le sens de la marche
          let ai = Math.round(((q.a % 6.2832) + 6.2832) % 6.2832 / 6.2832 * ANG) % ANG;
          const d = SS * sz / SB;
          const vis = (q.hid ? clamp((k - .08) / .25) : 1) * lerp(clamp(q.y / 160), 1, k); if (vis <= .01) continue;   // invisibles au départ ; fondu sur le bord haut de la zone
          ctx.globalAlpha = lerp(.34, 1, b / (BUCKETS - 1)) * vis;
          ctx.drawImage(SPR[ai][((t * 9 + q.ph) | 0) & 1], x - d / 2, y - d / 2, d, d);
          continue;
        }
        // en arrivant dans le mot : la même fourmi (pattes, antennes), sur le calque qui recevra le dégradé
        const ai2 = face(q), d2 = SS * Math.min(sz, grain * .5) / SB;
        lg.globalAlpha = lerp(.34, 1, b / (BUCKETS - 1));
        lg.drawImage(SPR[ai2][((t * 7 + q.ph) | 0) & 1], x - d2 / 2, y - d2 / 2, d2, d2);
      }
      // Couleur : bleu nuit discret quand elles se promènent, dégradé de la marque une fois rassemblées.
      lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-in';
      const g = lg.createLinearGradient(X0 + W * .1, 0, X0 + W * .9, 0); GRAD.forEach((c, i) => g.addColorStop(i / (GRAD.length - 1), `rgb(${c})`));
      lg.fillStyle = g; lg.fillRect(0, 0, VW, VH); lg.globalCompositeOperation = 'source-over';
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(layer, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cv.parentElement.classList.toggle('fx-formed', p > .92);
    }
    const setP = e => { const r = cv.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; lastMove = performance.now(); };
    cv.addEventListener('pointermove', setP, { passive: true });
    cv.addEventListener('pointerdown', setP, { passive: true });
    cv.addEventListener('pointerleave', () => { pointer = null; });
    cv.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') pointer = null; });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { sample(); if (reduced) frame(0); });
    let rw = innerWidth, rh = innerHeight;
    addEventListener('resize', () => {
      if (Math.abs(innerWidth - rw) > 40) { rw = innerWidth; rh = innerHeight; shownInPage = null; sample(); }
      // barre d’adresse du téléphone : le calque ne fait que grandir (le redimensionner pendant le défilement le ferait clignoter)
      else if (!reduced && innerHeight > rh + 1) { rh = innerHeight; sizeFly(); }
    });
    // hauteur de la zone remesurée quand tout est chargé (images, polices)
    const zone = () => { if (ready) RH = zoneH(); };
    addEventListener('load', zone); setTimeout(zone, 2500);
    if (!reduced) { live.add(frame); wake(); }
  });

  /* ---------------------------------------------------------------- 1 bis. Vidéo qui s'ouvre jusqu'aux bords de l'écran */
  // La section reste à l'écran : la vidéo part de la largeur du texte, coins arrondis, et s'agrandit jusqu'à remplir
  // toute la largeur. Une seule transformation (échelle) ; l'arrondi est compensé pour rester constant à l'œil.
  document.querySelectorAll('.fx-zoom').forEach(sec => {
    const el = sec.querySelector('.fx-zoom-el'), pin = sec.querySelector('.fx-zoom-pin'), vid = el && el.querySelector('video'); if (!el || !pin || reduced) return;
    const R = 28; let s0 = .7, g0 = -1, last = '', on = false;
    const reset = () => { el.style.transform = ''; el.style.backgroundColor = ''; el.style.borderRadius = ''; if (vid) vid.style.borderRadius = ''; last = ''; };
    const frame = () => {
      if (g0 !== gen) { g0 = gen; on = getComputedStyle(pin).position === 'sticky';
        const cw = sec.clientWidth - parseFloat(getComputedStyle(sec).paddingLeft) - parseFloat(getComputedStyle(sec).paddingRight);
        const vw = Math.min(innerWidth, VH * 16 / 9);   // largeur de la vidéo entière en plein écran
        s0 = Math.min(.7, Math.max(.4, cw * .85 / vw)); }
      if (!on) { if (last) reset(); return; }
      const r = box(sec), run = Math.max(1, r.height - VH), p = clamp(-r.top / run);
      // 0 → 40 % : la vidéo grandit jusqu'à tout l'écran ; 40 → 62 % : plein écran ; 62 → 95 % : elle revient à sa place
      const e = ease(clamp(p / .4)) * (1 - ease(clamp((p - .62) / .33)));
      const s = lerp(s0, 1, e), k = s.toFixed(4) + e.toFixed(3); if (k === last) return; last = k;
      el.style.transform = `scale(${s.toFixed(4)})`;
      const rad = `${(R * (1 - e) / s).toFixed(2)}px`; el.style.borderRadius = rad; if (vid) vid.style.borderRadius = rad;
    };
    whenVisible(sec, frame, '0px');
  });

  /* ---------------------------------------------------------------- 1 ter. Les trois types de compétences */
  // Au défilement : le savoir-être apparaît, le savoir-faire vient se placer à côté et leur intersection (exécutant)
  // se dévoile ; puis le savoir arrive, avec le connaissant et le performant, et enfin le compétent au centre.
  document.querySelectorAll('.fx-venn').forEach(sec => {
    const svg = sec.querySelector('.venn-svg'), pin = sec.querySelector('.fx-venn-pin'); if (!svg || !pin || reduced) return;
    root.classList.add('fx-venn-on');
    const groups = [...svg.querySelectorAll('.vs')].map(el => ({ el, s: +el.dataset.s, tmp: el.classList.contains('vtmp'), last: '' }));
    // origine et mouvement de chaque étape (unités du dessin)
    const M = { 1: { o: '1004px 473px', sc: .8 }, 2: { o: '742px 899px', dy: 230, sc: .94 }, 3: { o: '960px 720px', sc: .86 },
      4: { o: '477px 471px', dx: -250, sc: .94 }, 5: { o: '742px 640px', sc: .93 }, 6: { o: '742px 640px', sc: .86 } };
    groups.forEach(g => { g.el.style.transformOrigin = M[g.s].o; });
    const fig = sec.querySelector('.venn') || svg;
    const nows = [...sec.querySelectorAll('.venn-now')], items = [...sec.querySelectorAll('.venn-list li[data-s]')];
    const CAP = ['', 'Le savoir-être', '+ les savoir-faire', 'Savoir-être + savoir-faire : exécutant', '+ les savoirs',
      'Avec les savoirs : connaissant et performant', 'Les trois réunis : compétent'];
    let g0 = -1, on = false, cur = -1, figOn = false, figTop = 0;
    const frame = () => {
      if (g0 !== gen) { g0 = gen; on = getComputedStyle(pin).position === 'sticky'; const cs = getComputedStyle(fig); figOn = !on && cs.position === 'sticky'; figTop = parseFloat(cs.top) || 0; }
      let p;
      if (figOn) { const r = box(fig.parentElement); p = clamp((figTop - r.top) / Math.max(1, r.height - fig.offsetHeight)) * 1.1 - .03; }
      else if (on) { const r = box(sec); p = clamp(-r.top / Math.max(1, r.height - VH)) * 1.12 - .04; }
      else { const r = box(fig); p = (VH * .75 - r.top) / (VH * .4 + r.height); }
      const T = k => ease(clamp((p - (k - 1) * .145) / .18));
      const t6 = T(6);
      // légende : l’étape en cours, et les savoirs déjà présents mis en avant dans la liste
      let k = 0; for (let i = 1; i <= 6; i++) if (T(i) > .5) k = i;
      if (k !== cur) { cur = k;
        nows.forEach(n => { n.classList.toggle('off', !k); if (k) n.textContent = CAP[k]; });
        items.forEach(li => { const s = +li.dataset.s; li.classList.toggle('on', k >= s); li.classList.toggle('now', k === s); });
      }
      groups.forEach(g => {
        const t = T(g.s), m = M[g.s], u = 1 - t;
        const op = g.tmp ? t * (1 - t6) : t;
        const sc = lerp(m.sc, 1, t);
        const tf = `translate(${((m.dx || 0) * u).toFixed(1)}px,${((m.dy || 0) * u).toFixed(1)}px) scale(${sc.toFixed(4)})`;
        const k = op.toFixed(3) + tf; if (k === g.last) return; g.last = k;
        g.el.style.opacity = op.toFixed(3); g.el.style.transform = tf;
      });
    };
    frame();
    whenVisible(sec, frame, '200px');
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
    const stepsBox = dial.querySelector('.fx-steps');
    const fitH = () => { stepsBox.style.minHeight = Math.max(...steps.map(x => x.offsetHeight)) + 'px'; };
    fitH(); addEventListener('resize', fitH); if (document.fonts) document.fonts.ready.then(fitH);
    // Chaque segment : longueur proportionnelle à la durée de l’étape (cercle découpé en 100).
    // un segment n’est redessiné que si sa longueur change vraiment (au demi-millième près)
    function paint(s, f) { const k = f.toFixed(3); if (s._k === k) return; s._k = k; const L = +s.dataset.len, a = +s.dataset.start; s.style.strokeDasharray = `${(L * f).toFixed(3)} 200`; s.style.strokeDashoffset = (-a).toFixed(3); s.style.opacity = f > .002 ? 1 : 0; }
    dial.querySelectorAll('.fx-track').forEach(t => { t.style.strokeDasharray = `${t.dataset.len} 200`; t.style.strokeDashoffset = -t.dataset.start; });
    function frame() {
      const r = box(scene), run = r.height - VH;
      const p = run > 0 ? clamp(-r.top / run) : clamp((VH * .6 - r.top) / (VH * .6));
      segs.forEach((s, i) => paint(s, clamp((p * 1.08 - i / 3) * 3)));
      set(Math.min(2, Math.floor(clamp(p * 1.08) * 3)));
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
  // Nos actions (ordinateur) : façon pages produits d’Apple — un grand cadre reste fixe à gauche pendant que les
  // quatre actions défilent à droite ; quand une action arrive au centre de l’écran, sa photo s’installe dans le cadre
  // (fondu et léger recul), avec son domaine. Sur téléphone, la page garde une photo par action.
  (() => {
    if (!/nos-actions/.test(location.pathname)) return;
    const secs = [...document.querySelectorAll('main section.split[id^="action-"]')]; if (secs.length < 2) return;
    const feat = document.createElement('div'); feat.className = 'na-feature';
    const stage = document.createElement('div'); stage.className = 'na-stage'; stage.setAttribute('aria-hidden', 'true');
    const col = document.createElement('div'); col.className = 'na-steps';
    secs[0].before(feat); feat.append(stage, col);
    const frames = secs.map(sec => {
      const img = sec.querySelector('img.photo'), f = document.createElement('figure'); f.className = 'na-frame';
      const im = new Image(); im.alt = ''; im.decoding = 'async';
      const src = img ? (img.getAttribute('src') || '') : '';
      im.src = src; if (/collectif-affiche/.test(src)) f.classList.add('na-contain');   // l’affiche est montrée entière
      f.append(im);
      stage.append(f); col.append(sec); return f;
    });
    const dots = document.createElement('div'); dots.className = 'na-dots'; secs.forEach(() => dots.append(document.createElement('i'))); stage.append(dots);
    let cur = -1;
    const set = i => { if (i === cur) return; cur = i;
      frames.forEach((f, k) => { f.classList.toggle('on', k === i); f.classList.toggle('past', k < i); });
      secs.forEach((s, k) => s.classList.toggle('is-active', k === i)); [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i)); };
    set(0);
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) set(secs.indexOf(en.target)); }), { rootMargin: '-48% 0px -48% 0px' }); secs.forEach(s => io.observe(s)); }
  })();

  // Autres visuels qui vivent aussi : cartes « à la une » de l’accueil, outils VSS des Ressources.
  document.querySelectorAll('.stack-card .win img, #vss img').forEach(img => {
    if (img.closest('.fx-live-img')) return;
    const cs = getComputedStyle(img), w = document.createElement('span'); w.className = 'fx-live-img fx-live-plain';
    const rad = parseFloat(cs.borderTopLeftRadius); if (rad) w.style.borderRadius = cs.borderTopLeftRadius;
    if (parseFloat(cs.marginBottom)) { w.style.marginBottom = cs.marginBottom; img.style.marginBottom = '0'; }
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
      const t = now / 1000, r = box(c.el.parentElement || c.el);
      // mouvement de repos : lent, ample sur téléphone, plus discret sur ordinateur
      if (c.kind === 'hero' && coarse && !c.el.closest('.h2-open')) return;
      // au repos, les visuels bougent franchement (ordinateur comme téléphone) : le site est vivant, pas figé
      const k = (coarse ? 1 : .95) * (c.kind === 'hero' ? 1.2 : 1), sp = coarse ? 2 : 1.5;
      let ix = (Math.sin(t * .7 * sp + c.ph) * .7 + Math.sin(t * .31 * sp + c.ph * 2) * .3) * k;
      let iy = (Math.cos(t * .55 * sp + c.ph) * .6 + ((r.top + r.height / 2) / VH - .5) * .8) * k;
      if (c.on) { ix = c.px; iy = c.py; }
      const f = c.on ? .16 : .08;
      c.x += (ix - c.x) * f; c.y += (iy - c.y) * f;
      const [ay, ax] = AMP[c.kind];
      c.el.style.transform = `perspective(1000px) rotateY(${(c.x * ay).toFixed(2)}deg) rotateX(${(-c.y * ax).toFixed(2)}deg) translateZ(0)`;
      c.g.style.transform = `translate3d(${(c.x * 32).toFixed(2)}%,${(c.y * 32).toFixed(2)}%,0)`;
      c.g.style.opacity = c.on ? 1 : .85;
    });
  });

  /* ---------------------------------------------------------------- 3 bis. Les billets des sessions BAFA se distribuent */
  // Au défilement, chaque billet arrive de biais et se pose à sa place (un léger décalage de l’un à l’autre),
  // puis la ligne du trajet se trace du premier au dernier jour.
  document.querySelectorAll('.fo-sessions').forEach(wrap => {
    const ts = [...wrap.querySelectorAll('.fo-ticket')]; if (!ts.length || reduced) return;
    wrap.classList.add('fx-deal'); const last = [];
    whenVisible(wrap, () => {
      const tops = ts.map(t => box(t).top), row = Math.abs(tops[0] - tops[tops.length - 1]) < 30;
      ts.forEach((t, i) => {
        const p = clamp((VH * .96 - tops[i]) / (VH * .5) - (row ? i * .2 : 0));
        const d = ease(clamp(p * 1.15)), dr = ease(clamp(p * 1.7 - .7)), k = d.toFixed(3) + dr.toFixed(3);
        if (last[i] === k) return; last[i] = k;
        t.style.setProperty('--d', d.toFixed(3)); t.style.setProperty('--dr', dr.toFixed(3));
      });
    }, '0px');
  });

  /* ---------------------------------------------------------------- 3 ter. L’Esprit Fourmi : la liste qui s’allume, épinglée */
  // Ordinateur : la section reste à l’écran, chaque phrase s’allume à son tour et la phrase en cours est mise en avant.
  // Téléphone : même allumage, au fil du défilement normal.
  document.querySelectorAll('.fx-pinlist').forEach(sec => {
    const pin = sec.querySelector('.fx-spirit-pin'), ul = sec.querySelector('ul'), items = [...sec.querySelectorAll('li')];
    if (!pin || !items.length || reduced) return;
    let lit = -2, g0 = -1, pinned = false;
    whenVisible(sec, () => {
      if (g0 !== gen) { g0 = gen; pinned = getComputedStyle(pin).position === 'sticky'; }
      let p;
      if (pinned) { const r = box(sec), run = Math.max(1, r.height - VH); p = clamp((-r.top + VH * .12) / (run * .82)); }
      else { const r = box(ul); p = clamp((VH * .72 - r.top) / (r.height + VH * .25)); }
      const n = Math.round(p * items.length); if (n === lit) return; lit = n;
      items.forEach((it, i) => { it.classList.toggle('on', i < n); it.classList.toggle('cur', pinned && i === n - 1); });
    }, '0px');
  });

  /* ---------------------------------------------------------------- 3 quater. Les grands titres qui se posent */
  // Le titre arrive très grand et transparent, puis se pose à sa taille au fil du défilement.
  document.querySelectorAll('.fx-settle').forEach(el => {
    if (reduced) return; let last = '';
    whenVisible(el, () => {
      const r = box(el), t = ease(clamp((VH * .98 - r.top) / (VH * .55))), k = t.toFixed(3); if (k === last) return; last = k;
      el.style.transform = `scale(${lerp(coarse ? 1.3 : 1.42, 1, t).toFixed(4)})`; el.style.opacity = lerp(.12, 1, t).toFixed(3);
    }, '0px');
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
    // Rendu léger : seules transform et opacité changent (calculées sur la carte graphique) ; l’ordre d’empilement
    // n’est modifié que lorsqu’il change vraiment, et la position de la page est gardée en mémoire (aucune relecture de mise en page).
    const zs = items.map(() => -1), ops = items.map(() => '');
    function draw() {
      const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
      for (let i = 0; i < n; i++) {
        const it = items[i], [x, y, z] = pts[i];
        const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;           // rotation verticale
        const y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;            // rotation horizontale
        const s = .62 + (z2 + 1) * .3;
        it.style.transform = `translate3d(${(x1 * R).toFixed(1)}px,${(y2 * R * .82).toFixed(1)}px,0) translate(-50%,-50%) scale(${s.toFixed(3)})`;
        const o = (.32 + (z2 + 1) * .34).toFixed(2); if (o !== ops[i]) { ops[i] = o; it.style.opacity = o; }
        const zi = Math.round((z2 + 1) * 7); if (zi !== zs[i]) { zs[i] = zi; it.style.zIndex = zi; }
      }
    }
    let top0 = 0, h0 = 0;
    const where = () => { const r = box.getBoundingClientRect(); top0 = r.top + scrollY; h0 = r.height; };
    where(); addEventListener('resize', where); addEventListener('load', where); setTimeout(where, 1500);
    let last = 0;
    function frame(now) {
      const k = last ? Math.min(3, (now - last) / 16.67) : 1; last = now;   // même vitesse quel que soit l’écran (60 ou 120 images/s)
      if (!drag) { vx *= Math.pow(.95, k); vy += ((auto ? (hover ? BASE * .3 : BASE) : 0) - vy) * .025 * k; }
      ax = clamp(ax + vx * k, -.9, .9); ay += vy * k;
      const sp = clamp((innerHeight - (top0 - scrollY)) / (innerHeight + h0));
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
      const r = box(fork), p = clamp((VH * .8 - r.top) / (VH * .32));
      lines.forEach((l, i) => { const v = (100 - clamp(p * 1.6 - (i ? .4 : 0)) * 100).toFixed(2); if (l._v !== v) { l._v = v; l.style.strokeDashoffset = v; } });
    });
    else lines.forEach(l => l.style.strokeDashoffset = 0);
  }

  /* ---------------------------------------------------------------- 8. Accueil : raccourci vers les prochaines sessions (billets en éventail) */
  document.querySelectorAll('.bf-deck').forEach(deck => {
    if (reduced) { deck.style.setProperty('--fan', 1); return; }
    whenVisible(deck, () => {
      const r = box(deck), f = ease(clamp((VH * .8 - r.top) / (VH * .32))).toFixed(4);
      if (deck._f !== f) { deck._f = f; deck.style.setProperty('--fan', f); }
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
      svg.innerHTML = '<defs><linearGradient id="fxh-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b5bd7"/><stop offset=".55" stop-color="#8a4fd0"/><stop offset="1" stop-color="#e2702a"/></linearGradient></defs>';
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
      const p = img.parentElement; if (!p || img.closest('[data-scene="hscroll"]')) return false;   // cartes qui défilent : pas de second mouvement
      const cs = getComputedStyle(p);
      return cs.overflow === 'hidden' || cs.overflowY === 'hidden' || cs.clipPath !== 'none';
    });
    imgs.forEach(img => {
      img.classList.add('fx-par');
      whenVisible(img, () => {
        const r = box(img.parentElement);   // le cadre, jamais l’image déplacée elle-même
        const t = clamp((r.top + r.height / 2) / VH, -.2, 1.2) - .5, v = (t * -6).toFixed(2) + '%';
        if (img._py !== v) { img._py = v; img.style.setProperty('--py', v); }
      }, '60px');
    });
  }
})();
