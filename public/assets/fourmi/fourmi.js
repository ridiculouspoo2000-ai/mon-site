/* La Fourmi · assistant de recherche de fourmiaction.fr
   Tout se passe dans le navigateur : les réponses viennent des pages et des documents du site (index construit à chaque mise à jour).
   Aucune question n’est envoyée à un service extérieur. L’envoi d’un message à l’équipe passe par /api/contact, uniquement sur clic. */
(() => {
  'use strict';
  if (window.__fourmi) return; window.__fourmi = 1;
  const SCRIPT = document.currentScript;
  const ROOT = new URL('../../', SCRIPT ? SCRIPT.src : location.href);
  const T0 = Date.now();
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('ap-reduced');
  const store = {
    get(k) { try { return JSON.parse(sessionStorage.getItem('fa-fourmi-' + k)); } catch (_) { return null; } },
    set(k, v) { try { sessionStorage.setItem('fa-fourmi-' + k, JSON.stringify(v)); } catch (_) {} }
  };
  let AI = !!store.get('ai');
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const SUJETS = ['Formation BAFA', 'Intervention dans une structure', 'Projet d’accueil collectif', 'Bénévolat ou partenariat', 'Autre demande'];
  const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';

  /* ---------- La mascotte (dessin original) ---------- */
  let gid = 0;
  function ant(size) {
    // Mica : fourmi originale, debout, en buste, aux couleurs de Fourmi’Action (badge d’animatrice), qui fait coucou.
    const id = 'fa-ant-' + (++gid);
    const w = document.createElement('span');
    w.className = 'fa-ant';
    w.innerHTML = `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e67a35"/><stop offset="1" stop-color="#c85d1f"/></linearGradient>
<clipPath id="${id}c"><circle cx="50" cy="50" r="48.5"/></clipPath>
</defs>
<g clip-path="url(#${id}c)">
<rect x="46.6" y="62" width="6.8" height="16" rx="3" fill="#c85d1f"/>
<path d="M26 101C26 85 36.5 76.5 50 76.5S74 85 74 101Z" fill="#1d3550"/>
<path d="M32.5 86C28.5 90.5 27.5 95.5 28 101" stroke="#1d3550" stroke-width="7" stroke-linecap="round" fill="none"/>
<path d="M43.5 77.2 50 83.6 56.5 77.2" stroke="#33506f" stroke-width="2" stroke-linejoin="round" fill="none"/>
<path d="M44.2 78.5 48.6 91M55.8 78.5 51.4 91" stroke="#D35A0B" stroke-width="1.7" stroke-linecap="round"/>
<rect x="45" y="90.2" width="10" height="11" rx="1.8" fill="#fff"/><rect x="45" y="90.2" width="10" height="3" rx="1.2" fill="#D35A0B"/>
</g>
<g class="m-arm"><path d="M67 85.5C71 83.5 73.4 80.6 74.8 77" stroke="#1d3550" stroke-width="7.4" stroke-linecap="round" fill="none"/><path d="M74.8 77C77.6 72.4 79 67.6 79.4 63" stroke="#d26a28" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="79.6" cy="60.2" r="4.4" fill="#d26a28"/></g>
<g class="m-antl" transform="translate(0 3)"><path d="M42.6 26.4C40.4 17.6 35.8 12.4 30 10.6" stroke="#142f46" stroke-width="1.9" stroke-linecap="round" fill="none"/><circle cx="29.4" cy="10.4" r="2.6" fill="#142f46"/></g>
<g class="m-antr" transform="translate(0 3)"><path d="M57.4 26.4C59.6 17.6 64.2 12.4 70 10.6" stroke="#142f46" stroke-width="1.9" stroke-linecap="round" fill="none"/><circle cx="70.6" cy="10.4" r="2.6" fill="#142f46"/></g>
<g class="m-face" transform="translate(0 3)">
<ellipse cx="50" cy="44" rx="22.5" ry="20.5" fill="url(#${id}h)"/>
<g class="m-eyes"><g class="m-pupils"><ellipse cx="42" cy="44.5" rx="3" ry="4" fill="#142f46"/><ellipse cx="58" cy="44.5" rx="3" ry="4" fill="#142f46"/><circle cx="43" cy="43" r=".95" fill="#fff"/><circle cx="59" cy="43" r=".95" fill="#fff"/></g></g>
<path class="m-happy" d="M38.8 45.4q3.2-3.4 6.4 0M54.8 45.4q3.2-3.4 6.4 0" stroke="#142f46" stroke-width="2" stroke-linecap="round" fill="none"/>
<path class="m-mouth" d="M45.6 52.6q4.4 3.4 8.8 0" stroke="#142f46" stroke-width="1.9" stroke-linecap="round" fill="none"/>
</g>
</svg>`;
    return w;
  }

  /* ---------- Interface ---------- */
  const root = el('div', 'fa-fourmi'); root.setAttribute('data-state', 'idle');
  const launcher = el('button', 'fa-launch'); launcher.type = 'button';
  launcher.setAttribute('aria-label', 'Ouvrir Mica, l’assistante virtuelle de Fourmi’Action'); launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-controls', 'fa-panel');
  const big = ant(70); launcher.append(big);
  const dot = el('span', 'fa-dot'); dot.setAttribute('aria-hidden', 'true'); launcher.append(dot);
  const bubble = el('div', 'fa-bubble'); bubble.setAttribute('role', 'status');
  const bubbleTxt = el('span'); const bubbleX = el('button', 'fa-bubble-x', '×'); bubbleX.type = 'button'; bubbleX.setAttribute('aria-label', 'Fermer');
  bubble.append(bubbleTxt, bubbleX);

  const panel = el('section', 'fa-panel'); panel.id = 'fa-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Mica, l’assistante virtuelle de Fourmi’Action'); panel.hidden = true;
  const head = el('header', 'fa-head');
  const headAnt = ant(40); const headTxt = el('div', 'fa-head-t'); const nm = el('b'); nm.append('Mica', el('span', 'fa-badge', AI ? 'Assistante IA' : 'Assistante virtuelle')); headTxt.append(nm, el('small', '', 'Je cherche dans les pages et les documents du site'));
  const close = el('button', 'fa-close'); close.type = 'button'; close.setAttribute('aria-label', 'Fermer');
  close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const reset = el('button', 'fa-reset'); reset.type = 'button'; reset.setAttribute('aria-label', 'Nouvelle conversation'); reset.title = 'Nouvelle conversation';
  reset.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5"/></svg>';
  head.append(headAnt, headTxt, reset, close);
  const log = el('div', 'fa-log'); log.setAttribute('aria-live', 'polite');
  const form = el('form', 'fa-ask'); form.setAttribute('role', 'search');
  const input = el('input'); input.type = 'text'; input.name = 'q'; input.autocomplete = 'off'; input.maxLength = 300;
  input.placeholder = 'Posez votre question…'; input.setAttribute('aria-label', 'Votre question');
  const send = el('button'); send.type = 'submit'; send.setAttribute('aria-label', 'Chercher');
  send.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
  form.append(input, send);
  const foot = el('p', 'fa-foot', 'Réponses tirées des documents du site. Vos questions restent sur votre appareil.');
  panel.append(head, log, form, foot);
  const siri = el('div', 'fa-siri'); siri.setAttribute('aria-hidden', 'true'); siri.append(el('i'));
  root.append(siri, panel, bubble, launcher);

  const mount = () => document.body.append(root);
  document.body ? mount() : addEventListener('DOMContentLoaded', mount);

  /* ---------- Vie de la mascotte ---------- */
  const setState = s => root.setAttribute('data-state', s);
  const ants = () => root.querySelectorAll('.fa-ant');
  // Les yeux suivent le pointeur (sur ordinateur).
  let raf = 0, px = 0, py = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || reduced()) return; px = e.clientX; py = e.clientY;
    if (raf) return; raf = requestAnimationFrame(() => { raf = 0; look(px, py); });
  }, { passive: true });
  // Les yeux suivent le pointeur (souris) ou l’endroit touché.
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || reduced()) return; look(e.clientX, e.clientY); clearTimeout(look.t); look.t = setTimeout(() => ants().forEach(a => { const p = a.querySelector('.m-pupils'); if (p) p.style.transform = ''; }), 1600); }, { passive: true });
  function look(x, y) {
    ants().forEach(a => {
      const r = a.getBoundingClientRect(); if (!r.width) return;
      const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * .45), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
      const p = a.querySelector('.m-pupils'); if (p) p.style.transform = `translate(${(dx / d * 1.8 * k).toFixed(2)}px,${(dy / d * 1.6 * k).toFixed(2)}px)`;
    });
  }
  // Grand coucou à l’arrivée sur le site, puis un petit de temps en temps.
  const wave = (big) => { if (reduced() || !panel.hidden) return; root.classList.toggle('fa-bigwave', !!big); setState('wave'); setTimeout(() => { if (root.getAttribute('data-state') === 'wave') setState('idle'); root.classList.remove('fa-bigwave'); }, big ? 3200 : 1700); };
  setTimeout(() => wave(!store.get('waved')), 900); store.set('waved', 1);
  setInterval(() => { if (!document.hidden) wave(false); }, 38000);
  // Elle suit la page : petit saut quand on fait défiler, regard vers le haut ou le bas.
  let lastY = scrollY, hopT = 0, lookT = 0;
  addEventListener('scroll', () => {
    if (reduced()) return;
    const dy = scrollY - lastY; lastY = scrollY;
    if (Math.abs(dy) < 2) return;
    root.style.setProperty('--fa-look', dy > 0 ? '1' : '-1');
    root.classList.add('fa-looking'); clearTimeout(lookT); lookT = setTimeout(() => root.classList.remove('fa-looking'), 420);
    if (!hopT) { root.classList.add('fa-hop'); hopT = setTimeout(() => { root.classList.remove('fa-hop'); hopT = 0; }, 520); }
  }, { passive: true });

  // Sur le formulaire d’adhésion HelloAsso, Mica s’efface pour ne rien cacher.
  const ha = document.getElementById('haWidget');
  if (ha && 'IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => root.classList.toggle('fa-quiet', e.isIntersecting && panel.hidden)), { rootMargin: '-10% 0px -10% 0px' }).observe(ha);

  /* ---------- Bulle d’accueil, selon la page ---------- */
  const TEASE = {
    index: 'Une question sur l’association ou le BAFA ? Je cherche la réponse dans nos documents.',
    bafa: 'Dates, tarifs, paiement en plusieurs fois : posez votre question.',
    'formation-bafa-orleans': 'Une question sur le BAFA à Orléans ? Je connais tous les documents.',
    'collectif-jeunes': 'Une question sur le Collectif jeunes (14-17 ans) ? Je cherche pour vous.',
    contact: 'Je peux aussi transmettre votre message à l’équipe.',
    'projet-educatif': 'Je peux retrouver un passage du projet éducatif pour vous.'
  };
  const meet = el('span', 'fa-meet'); meet.append(ant(44));
  function tease() {
    const seen = store.get('teased') || {};
    if (!panel.hidden) return;
    const first = !store.get('met');
    if (!first && seen[page]) return;
    bubble.classList.toggle('fa-intro', first);
    bubbleTxt.textContent = '';
    if (first) {
      const t = el('span', 'fa-meet-t'); const nm = el('b'); nm.append('Bonjour, je suis Mica', el('span', 'fa-badge', AI ? 'Assistante IA' : 'Assistante virtuelle'));
      t.append(nm, el('span', '', 'Une question sur le BAFA, l’association ou nos actions ? Je cherche la réponse pour vous dans nos documents.'));
      bubbleTxt.append(meet, t); store.set('met', 1);
    } else bubbleTxt.textContent = TEASE[page] || 'Une question ? Je cherche dans tous les documents du site.';
    root.classList.add('fa-teasing'); setState('wave');
    seen[page] = 1; store.set('teased', seen);
    setTimeout(() => { if (root.getAttribute('data-state') === 'wave') setState('idle'); }, 2400);
    setTimeout(hideTease, first ? 12000 : 9000);
  }
  const hideTease = () => root.classList.remove('fa-teasing');
  bubbleX.addEventListener('click', e => { e.stopPropagation(); hideTease(); });
  bubbleTxt.addEventListener('click', () => { hideTease(); open(); });
  setTimeout(tease, store.get('met') ? 3800 : 2200);
  if ((store.get('log') || []).length) dot.classList.add('on');

  /* ---------- Ouverture / fermeture ---------- */
  function open() {
    hideTease(); panel.hidden = false; root.classList.add('fa-open'); launcher.setAttribute('aria-expanded', 'true'); dot.classList.remove('on');
    load().then(() => { if (!log.childElementCount) restore(); });
    setTimeout(() => input.focus({ preventScroll: true }), 60);
  }
  function shut() {
    root.classList.remove('fa-open'); launcher.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!root.classList.contains('fa-open')) panel.hidden = true; }, reduced() ? 0 : 320);
    launcher.focus({ preventScroll: true });
  }
  launcher.addEventListener('click', () => panel.hidden ? open() : shut());
  launcher.addEventListener('pointerenter', () => load(), { once: true });
  close.addEventListener('click', shut);
  reset.addEventListener('click', () => { store.set('log', []); log.textContent = ''; greet(); input.focus(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) shut(); });

  /* ---------- Mode IA (activé quand la clé Mistral est configurée côté serveur) ---------- */
  const paintMode = () => {
    root.querySelectorAll('.fa-badge').forEach(x => { x.textContent = AI ? 'Assistante IA' : 'Assistante virtuelle'; });
    foot.textContent = AI ? 'Réponses rédigées par une IA (Mistral AI) à partir de nos documents : elles peuvent contenir des erreurs. Ne partagez pas d’informations personnelles.'
                          : 'Réponses tirées des documents du site. Vos questions restent sur votre appareil.';
  };
  fetch(new URL('api/mica', ROOT), { cache: 'no-store' }).then(r => r.ok ? r.json() : { actif: false }).then(d => { AI = !!(d && d.actif); store.set('ai', AI); paintMode(); }).catch(() => {});
  const conv = [];
  paintMode();

  /* ---------- Données ---------- */
  let DB = null, loading = null;
  function load() {
    if (DB) return Promise.resolve(DB);
    if (!loading) loading = fetch(new URL('assets/fourmi/index.json', ROOT)).then(r => r.json()).then(d => (DB = build(d))).catch(() => (loading = null, null));
    return loading;
  }

  /* ---------- Recherche (dans le navigateur) ---------- */
  const STOP = new Set(('a au aux avec ce ces cette c d de des du dans elle en et est etre il ils je j la le les leur l lui ma me mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses si son sur ta te tes toi ton tu un une vos votre vous y ça ca '
    + 'est-ce estce quoi quel quelle quels quelles comment combien pourquoi bonjour svp merci peut peux puis faut fait faire avoir ai as avez sont suis etes cela ceci tout tous toute toutes plus tres bien aussi alors donc mais ou deja chez entre ici la-bas leurs').split(' '));
  const norm = s => (' ' + s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .replace(/€/g, ' € ').replace(/[^a-z0-9€]+/g, ' ') + ' ').replace(/\s+/g, ' ');
  const ENDS = ['issements', 'issement', 'atrices', 'atrice', 'ateurs', 'ateur', 'ations', 'ation', 'ements', 'ement', 'ments', 'ment', 'ances', 'ance', 'ences', 'ence', 'ites', 'ite', 'ives', 'ive', 'euses', 'euse', 'eux', 'iques', 'ique', 'ismes', 'isme', 'istes', 'iste', 'ables', 'able', 'aux', 'er', 'ez', 'es', 'e', 's', 'x'];
  function stem(w) {
    if (w.length <= 3 || /^\d/.test(w)) return w;
    for (const e of ENDS) if (w.endsWith(e) && w.length - e.length >= 3) return w.slice(0, -e.length);
    return w;
  }
  const toks = s => norm(s).trim().split(' ').filter(w => w && !STOP.has(w));
  let SYN = {};
  function qterms(q) {
    const base = toks(q), out = new Map();
    base.forEach(w => out.set(stem(w), 1));
    base.forEach(w => (SYN[w] || []).forEach(s => toks(s).forEach(t => { const k = stem(t); if (!out.has(k)) out.set(k, .5); })));
    return out;
  }
  function build(d) {
    SYN = d.syn || {};
    const chunks = d.c.map(([di, s, u, x]) => {
      const tf = new Map(); let len = 0;
      const add = (txt, w) => toks(txt).forEach(t => { const k = stem(t); tf.set(k, (tf.get(k) || 0) + w); len += w; });
      add(x, 1); add(s, 2.2); add(d.d[di].t, 1.2);
      const u0 = u.split('#')[0];
      return { di, s, u, x, tf, len, pdf: d.d[di].k === 'pdf', vss: u0.startsWith('fourmiaction-vss/'), legal: /^(mentions-legales|confidentialite|accessibilite)\.html$/.test(u0) };
    });
    const df = new Map(); chunks.forEach(c => c.tf.forEach((_, k) => df.set(k, (df.get(k) || 0) + 1)));
    const avg = chunks.reduce((a, c) => a + c.len, 0) / chunks.length;
    const intents = d.i.map(it => ({ ...it, kk: Object.entries(it.k).map(([k, w]) => [norm(k).trim(), w]) }));
    return { docs: d.d, chunks, df, avg, N: chunks.length, intents };
  }
  function intentOf(q) {
    const n = norm(q), words = n.trim().split(' ');
    const syn = words.flatMap(w => SYN[w] || []).map(s => norm(s).trim());
    const hay = n + syn.join(' ') + ' ';
    let best = null, bs = 0;
    DB.intents.forEach(it => {
      let s = 0;
      it.kk.forEach(([k, w]) => {
        if (k.length <= 3 && !k.includes(' ')) { if (hay.includes(' ' + k + ' ')) s += w; }
        else if (hay.includes(' ' + k)) s += w;
      });
      if (s > bs) { bs = s; best = it; }
    });
    return bs >= 3 ? best : null;
  }
  function search(q, n, it) {
    const must = it ? new Set(it.kk.filter(([k, w]) => w >= 3).flatMap(([k]) => k.split(' ').filter(w => w && !STOP.has(w)).map(stem))) : null;
    const qt = qterms(q); if (!qt.size) return [];
    const nq = norm(q), vss = VSSQ.test(nq), legal = LEGALQ.test(nq);
    const k1 = 1.3, b = .72, res = [];
    DB.chunks.forEach(c => {
      let s = 0, hit = 0, need = 0;
      qt.forEach((w, t) => {
        if (w === 1) need++;
        const f = c.tf.get(t); if (!f) return;
        if (w === 1) hit++;
        const idf = Math.log(1 + (DB.N - DB.df.get(t) + .5) / (DB.df.get(t) + .5));
        s += w * idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * c.len / DB.avg));
      });
      if (!s) return;
      if (must && must.size && ![...must].some(m => c.tf.has(m))) return;
      const ratio = need ? hit / need : .5;
      if (need >= 2 ? ratio < .5 : !hit && need) return;
      s *= Math.pow(ratio || .5, 1.4);
      if (c.pdf) s *= .88;
      if (c.vss && !vss) s *= .3;
      if (c.legal && !legal) s *= .45;
      res.push([s, c]);
    });
    res.sort((a, b) => b[0] - a[0]);
    const out = [], seen = new Set();
    for (const [s, c] of res) {
      const key = c.u.split('#')[0] + '|' + c.s;
      if (seen.has(key)) continue; seen.add(key); out.push(c);
      if (out.length >= n) break;
    }
    return out.length && res[0][0] > 1.2 ? out : [];
  }
  function snippet(c, q) {
    const qs = new Set(qterms(q).keys());
    const words = c.x.split(/(\s+)/), hits = [];
    words.forEach((w, i) => { const t = norm(w).trim().split(' ')[0]; if (t && !STOP.has(t) && qs.has(stem(t))) hits.push(i); });
    let a = 0;
    if (hits.length) { let bestI = hits[0], bestN = 0; hits.forEach(h => { const nn = hits.filter(x => x >= h && x < h + 50).length; if (nn > bestN) { bestN = nn; bestI = h; } }); a = Math.max(0, bestI - 14); }
    const part = words.slice(a, a + 62), frag = document.createDocumentFragment();
    if (a > 0) frag.append('… ');
    part.forEach((w, i) => { if (hits.includes(a + i)) frag.append(el('mark', '', w)); else frag.append(w); });
    if (a + 62 < words.length) frag.append(' …');
    return frag;
  }

  /* ---------- Conversation ---------- */
  function scroll() { requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; }); }
  function say(cls, node) { const m = el('div', 'fa-msg ' + cls); m.append(node); log.append(m); scroll(); return m; }
  function link(label, u, primary) {
    const a = el('a', 'fa-btn' + (primary ? ' fa-btn-p' : ''), label);
    if (u === '#ecrire') { a.href = '#'; a.addEventListener('click', e => { e.preventDefault(); writeForm(); }); return a; }
    const url = /^https?:/.test(u) ? u : new URL(u, ROOT).href;
    a.href = url;
    if (/^https?:/.test(u)) { a.target = '_blank'; a.rel = 'noopener'; }
    else a.addEventListener('click', () => store.set('hl', url));
    return a;
  }
  function chips(list) {
    const w = el('div', 'fa-chips');
    list.forEach(t => { const b = el('button', 'fa-chip', t); b.type = 'button'; b.addEventListener('click', () => ask(t)); w.append(b); });
    return w;
  }
  const SUGG = {
    index: ['Où passer son BAFA à Orléans ?', 'Combien coûte le BAFA ?', 'C’est quoi le Collectif jeunes ?', 'Écrire à l’équipe'],
    bafa: ['Quelles sont les dates 2027 ?', 'Peut-on payer en plusieurs fois ?', 'Comment trouver un stage pratique ?', 'Écrire à l’équipe'],
    'formation-bafa-orleans': ['Quelles aides pour financer ?', 'Peut-on payer en plusieurs fois ?', 'Les inscriptions sont-elles ouvertes ?', 'Écrire à l’équipe'],
    'collectif-jeunes': ['Combien ça coûte ?', 'Comment s’inscrire au collectif ?', 'Droit à l’image', 'Écrire à l’équipe']
  };
  function greet() {
    const d = el('div');
    d.append(el('p', '', 'Bonjour, je suis Mica, l’assistante virtuelle de Fourmi’Action. Posez votre question : je cherche dans nos pages et nos documents, et je vous indique où se trouve la réponse.'));
    d.append(chips(SUGG[page] || SUGG.index));
    say('fa-f', d);
  }
  function restore() {
    const past = store.get('log') || [];
    if (!past.length) return greet();
    greet(); past.slice(-6).forEach(q => answer(q, true));
  }
  let lastQ = '', lastIntent = null;
  // La vision de Fourmi’Action (reprise de ses pages), pour répondre aux questions d’avis.
  const VIEWS = {
    animation: ['Pour Fourmi’Action, encadrer des enfants et des jeunes n’est ni une garderie ni un simple travail d’appoint : c’est une mission d’intérêt général, essentielle pour construire les citoyens de demain. D’où une animation exigeante, concrète et sécurisante.', 'Notre histoire', 'fourmi-action.html#histoire'],
    bafa: ['Pour Fourmi’Action, le BAFA s’apprend en faisant : expérimenter, observer, échanger, puis essayer à nouveau, dans un cadre bienveillant et avec un vrai accompagnement jusqu’au stage pratique.', 'Découvrir le BAFA', 'bafa.html#decouvrir'],
    education: ['L’éducation populaire, pour Fourmi’Action, c’est permettre à chacun de développer sa capacité à comprendre, à choisir et à agir, à tout âge, en reliant la réflexion à l’action.', 'Le projet éducatif', 'fourmi-action.html#projet'],
    jeune: ['Fourmi’Action croit au pouvoir d’agir des jeunes : dans le Collectif jeunes, ce sont eux qui choisissent et organisent leur projet, avec un adulte référent à leurs côtés.', 'Le Collectif jeunes', 'collectif-jeunes.html'],
    cooperation: ['Comme dans une fourmilière, Fourmi’Action pense qu’un groupe solidaire, diversifié et bienveillant produit des réponses plus riches qu’une personne seule.', 'Nos valeurs', 'fourmi-action.html#projet'],
    benevol: ['Chaque coup de main compte : Fourmi’Action défend une vie associative participative, avec une vraie place pour chacun dans les décisions.', 'Écrire à l’équipe', '#ecrire']
  };
  VIEWS['education populaire'] = VIEWS.education; VIEWS.jeunes = VIEWS.jeune; VIEWS.ados = VIEWS.jeune; VIEWS.animateur = VIEWS.animation; VIEWS.colo = VIEWS.animation;
  // ——— Petite conversation (mode local) : réponses simples, chaleureuses, hors documents ———
  const pick = a => { if (a.length < 2) return a[0]; let x; do x = a[Math.floor(Math.random() * a.length)]; while (x === pick.last); return (pick.last = x); };
  let awaitMood = false;
  const GREET = /\b(bonjour|bonsoir|salut|coucou|hello|hi|hey|yo|wesh|slt|cc|bjr|kikou|hola)\b/;
  const HOW = /\b(ca va|ca va bien|comment vas tu|comment tu vas|comment allez vous|comment vous allez|tu vas bien|vous allez bien|la forme|en forme|ca roule|bien ou quoi|tu vas comment|vous allez comment)\b/;
  const AVIS = /\b(qu est ce que tu penses|que penses tu|tu en penses|t en penses|tu penses quoi|tu penses (de|du|des)|ton avis|ton opinion|votre avis|vous en pensez|vous pensez quoi|que pensez vous|tu aimes|t aimes|tu kiffes|tu adores|tu trouves (ca|cela))\b/;
  const GOOD = /\b(je vais (tres )?bien|ca va (tres )?bien|bien merci|tres bien|super bien|ca roule|nickel|impec\w*|tranquille|pas mal|au top|la forme|en forme|ca va et (toi|vous))\b/;
  const BAD = /\b(pas (tres |trop )?bien|bof|pas terrible|pas top|fatigue\w*|creve\w*|triste|stresse\w*|deprime\w*|je vais mal|ca va mal|ca va pas)\b/;
  const VIEWKEYS = [
    ['animation', /\b(animation|animer|anim|animateur|animatrice|animateurs|colo|colos|colonie|centre de loisirs|accueil collectif)\b/],
    ['bafa', /\b(bafa|formation|formations|stage|stages)\b/],
    ['education', /\b(education|educ pop|pedagogie|pedagogique)\b/],
    ['jeune', /\b(jeune|jeunes|ado|ados|adolescents?|collectif|jeunesse)\b/],
    ['cooperation', /\b(cooperation|entraide|equipe|solidarite|fourmis?|fourmiliere)\b/],
    ['benevol', /\b(benevol\w*|association|asso|adherer|adhesion)\b/],
    ['site', /\b(site|page|pages|design|couleurs?)\b/],
    ['self', /\b(toi|mica)\b/]
  ];
  const AVIS_INTRO = {
    animation: ['L’animation ? Si je devais donner mon avis de petite fourmi : j’adore ! Faire grandir des enfants en jouant, en inventant, en vivant des aventures ensemble, je trouve ça précieux.', 'Franchement, c’est mon sujet préféré. Animer, c’est un mélange de créativité, d’écoute et d’énergie : un très beau rôle.'],
    bafa: ['Le BAFA ? Je trouve que c’est une super aventure : on y apprend autant sur les enfants que sur soi-même.', 'Mon avis de fourmi : le BAFA, c’est un excellent premier pas pour qui aime transmettre et travailler en équipe.'],
    education: ['L’éducation populaire, c’est un peu notre ADN, et j’avoue que ça me plaît beaucoup : apprendre ensemble, à tout âge, et en agissant.'],
    jeune: ['Les jeunes ? Je les trouve formidables quand on leur fait confiance : ils ont plein d’idées !'],
    cooperation: ['Forcément, je suis une fourmi : pour moi, rien ne vaut le travail d’équipe !'],
    benevol: ['La vie associative, je trouve ça chaleureux : chacun apporte sa pierre (ou sa miette) à l’édifice.'],
    site: ['Je trouve le site très chouette… mais je ne suis pas très objective : j’y habite !'],
    self: ['Moi ? Je fais de mon mieux ! Je suis une petite assistante, mais toujours de bonne humeur.']
  };
  const CHAT = [
    [/\b(quel age|ton age|tu as quel age|t as quel age)\b/, ['Je suis toute jeune : je suis née avec cette version du site ! Mais j’ai déjà lu tous nos documents.']],
    [/\b(qui t a (cree|creee|fait|faite|programme|programmee|invente|inventee)|qui t a con\w+|ton createur)\b/, ['J’ai été créée pour Fourmi’Action, pour aider les visiteurs du site à trouver leurs réponses plus vite.']],
    [/\b(es tu|t es|tu es) (une? )?(humaine?|vraie?|reelle?|une personne|quelqu un)\b/, ['__HUMAN__']],
    [/\b(ou (habites|vis) tu|tu (habites|vis) ou|t habites ou|d ou viens tu|tu viens d ou)\b/, ['J’habite en bas à droite de votre écran : c’est petit, mais très bien situé !']],
    [/\b(couleur preferee|ta couleur)\b/, ['L’orange, comme le « Action » de notre logo ! Et un peu de bleu marine pour faire sérieux.']],
    [/\b(tu manges|ton plat|plat prefere|tu as faim|t as faim|j ai faim)\b/, ['Comme toutes les fourmis, j’ai un faible pour le sucre… Mais je me contente de dévorer des documents !']],
    [/\b(tu aimes quoi|t aimes quoi|qu est ce que tu aimes|ce que tu aimes|ton truc prefere|tu preferes quoi|ta passion)\b/, ['Ce que je préfère ? Quand quelqu’un trouve enfin la réponse qu’il cherchait. Et les grands jeux en plein air, évidemment.']],
    [/\b(tu dors|tu es fatiguee|t es fatiguee|tu te reposes|tu fais quoi|que fais tu|tu fais quoi de beau)\b/, ['Je ne dors jamais : je reste en bas à droite, prête à chercher pour vous, de jour comme de nuit.', 'Là ? Je relis nos documents en attendant vos questions !']],
    [/\b(meteo|il fait beau|il pleut|le temps qu il fait|quel temps)\b/, ['Je ne vois pas la fenêtre d’ici, mais une chose est sûre : il fait toujours beau dans une bonne équipe d’animation !']],
    [/\b(je m ennuie|j m ennuie|ennui|je m embete|on s ennuie)\b/, ['Un animateur dirait : « On invente un jeu ! » En attendant, je peux vous faire découvrir le BAFA ou le Collectif jeunes.']],
    [/\b(blague|drole|rigole|humour|fais moi rire)\b/, ['Quel est le comble pour un animateur ? Perdre le fil… de son jeu de piste !', 'Une fourmi peut soulever bien plus que son propre poids. Une équipe d’animation soudée, elle, soulève des montagnes.', 'Que fait une fourmi en colo le soir ? Une veillée fourmidable, bien sûr !']],
    [/\b(je t aime|tu es (mignonne|belle|jolie|trop chou|adorable)|t es (mignonne|belle|jolie|trop chou|adorable)|trop mignonne)\b/, ['Oh, merci ! Vous allez me faire rougir… déjà que je suis orange !']],
    [/\b(bravo|genial|trop bien|merci beaucoup|tu es (top|geniale|forte|intelligente)|t es (top|geniale|forte|intelligente)|bien joue|excellent)\b/, ['Merci, ça me fait très plaisir ! N’hésitez pas si vous avez une autre question.']],
    [/\b(tu es (nulle?|bete|idiote)|t es (nulle?|bete|idiote)|inutile|tu sers a rien|nulle)\b/, ['Je fais de mon mieux avec ce qui est écrit dans nos documents ! Reformulez votre question, ou écrivez directement à l’équipe : elle vous répondra.']],
    [/\b(tu sers a quoi|que sais tu faire|tu sais faire quoi|tu peux faire quoi|que peux tu faire|aide moi|tu peux m aider|help)\b/, ['__CAN__']],
    [/\b(test|tu marches|tu fonctionnes|tu es la|t es la|il y a quelqu un|y a quelqu un|allo)\b/, ['Oui, je suis bien là, je vous écoute !']],
    [/\b(lol|mdr|ptdr|haha\w*|hihi\w*|xd)\b/, ['Ravie de vous faire sourire !']],
    [/\b(au revoir|bonne (journee|soiree|nuit)|a bientot|a plus|a\+|bye|ciao|tchao|salut a toi)\b/, ['Au revoir, et à bientôt ! Je reste ici, en bas à droite, si une question vous revient.', 'Bonne journée ! Revenez quand vous voulez.']],
    [/\b(merci|thanks|super|top|parfait|cool|d accord|dac|ok|okay|ca marche|oui|ouais|non|nan|ah|oh|bon)\b/, ['__ACK__']],
    [/\b(quoi de neuf|du nouveau|les nouveautes|quoi de nouveau)\b/, ['__NEWS__']],
    [/\b(et toi|et vous)\b/, ['Moi ? Toujours en forme, et prête à chercher pour vous !']]
  ];
  const FILLER = new Set('raconte racontes raconter dis dit dire donne donner encore autre une un moi petit petite et toi vous mica alors ben bah euh hum heu hm oui non ok okay dac nan ouais ah oh bon re cool genial super top parfait thanks beaucoup merci petite fourmi madame stp svp s il plait vraiment trop tres'.split(' '));
  function chat(n, it) {
    const parts = []; let link1 = null, chipsOn = false;
    const g = GREET.test(n), h = HOW.test(n);
    // Opinion : toujours une réponse « en personnage », sujet repéré dans la phrase.
    if (AVIS.test(n) && !/\b(tu aimes quoi|t aimes quoi)\b/.test(n)) {
      const k = (VIEWKEYS.find(([, rx]) => rx.test(n)) || [])[0];
      if (g) parts.push('Bonjour !');
      if (k && AVIS_INTRO[k]) {
        parts.push(pick(AVIS_INTRO[k]));
        if (VIEWS[k]) { parts.push('Et c’est aussi la conviction de l’association. ' + VIEWS[k][0]); link1 = [VIEWS[k][1], VIEWS[k][2]]; }
      } else if (!k && n.replace(AVIS, ' ').trim().split(' ').filter(w => w && !STOP.has(w) && !FILLER.has(w)).length === 0) {
        parts.push(pick(AVIS_INTRO.animation)); parts.push(VIEWS.animation[0]); link1 = [VIEWS.animation[1], VIEWS.animation[2]];
      } else {
        parts.push('Je n’ai pas d’avis très tranché là-dessus : je suis surtout incollable sur l’animation, le BAFA, la jeunesse et la vie de l’association. Posez-moi une question sur ces sujets, j’ai plein de choses à raconter !'); chipsOn = true;
      }
      return { parts, link1, chipsOn };
    }
    // Ce qui reste une fois les formules de politesse retirées : s’il n’y a plus rien, c’est de la conversation.
    let rest = n.replace(GREET, ' ').replace(HOW, ' ').replace(GOOD, ' ').replace(BAD, ' ');
    const hits = CHAT.filter(([rx]) => rx.test(n));
    hits.forEach(([rx]) => { rest = rest.replace(new RegExp(rx.source, 'g'), ' '); });
    const content = rest.trim().split(' ').filter(w => w && !STOP.has(w) && !FILLER.has(w));
    const mood = GOOD.test(n) ? 'good' : BAD.test(n) && (awaitMood || /\b(je suis|je me sens|moi)\b/.test(n)) ? 'bad' : (awaitMood && !h && /\b(bien|super|top|ok|oui|cool|nickel)\b/.test(n)) ? 'good' : '';
    if (content.length) { awaitMood = false; return g ? { greetOnly: true } : null; }
    awaitMood = false;
    if (g) parts.push(pick(h ? ['Bonjour !', 'Coucou !', 'Hello !'] : ['Bonjour ! Ravie de vous voir passer.', 'Coucou ! Bienvenue chez Fourmi’Action.', 'Hello ! Contente de vous voir.']));
    if (mood === 'good') parts.push(pick(['Tant mieux, ça fait plaisir à entendre !', 'Super ! Une bonne humeur, ça se partage.']));
    if (mood === 'bad' && /\b(fatigue\w*|creve\w*)\b/.test(n) && !/\b(triste|deprime\w*|mal)\b/.test(n)) parts.push('Oh, courage ! Une petite pause et un grand verre d’eau, ça aide souvent. Je reste là si vous avez besoin de moi.');
    else if (mood === 'bad') parts.push('Oh, je suis désolée de l’entendre. Prenez soin de vous. Si quelque chose vous pèse vraiment, en parler à une personne de confiance aide beaucoup. Et je reste là si je peux vous être utile.');
    if (h) { parts.push(pick(['Je vais très bien, merci de demander ! J’ai la pêche d’une fourmi un matin de colo.', 'Ça va super, merci ! Toujours en pleine forme pour chercher des réponses.', 'Très bien, merci ! Mes antennes frétillent.'])); parts.push('Et vous, comment allez-vous ?'); awaitMood = true; }
    hits.forEach(([, rep]) => {
      if (h && rep[0] === 'Moi ? Toujours en forme, et prête à chercher pour vous !') return;
      if (rep[0] === '__ACK__') { if (!parts.length && !mood) parts.push(/\bmerci\b/.test(n) ? pick(['Avec plaisir ! Je reste disponible en bas à droite pour toute autre question.', 'De rien, c’est un plaisir !']) : pick(['Ça marche !', 'Très bien !', 'D’accord !']) + ' Je reste là si vous avez une question.'); return; }
      if (rep[0] === '__HUMAN__') { parts.push(AI ? 'Non, je suis une intelligence artificielle. Pour parler à un humain, l’équipe vous répond volontiers par mail.' : 'Ni humaine ni intelligence artificielle : je suis un petit programme qui cherche dans les pages et documents du site. Pour parler à un humain, l’équipe vous répond volontiers par mail.'); link1 = ['Écrire à l’équipe', '#ecrire']; return; }
      if (rep[0] === '__NEWS__') { parts.push('Du nouveau, oui ! Le Collectif jeunes des 14–17 ans vient d’être lancé à Saint-Jean-le-Blanc, et les dates prévues des sessions BAFA 2027 à Orléans sont en ligne.'); link1 = ['Voir les actualités', 'actualites.html']; return; }
      if (rep[0] === '__CAN__') { parts.push('Je peux vous expliquer le BAFA, vous montrer les prochaines sessions et leurs tarifs, présenter l’association et le Collectif jeunes, ou transmettre un message à l’équipe. Essayez par exemple :'); chipsOn = true; return; }
      parts.push(pick(rep));
    });
    if (!parts.length) return null;
    if (g && !h && parts.length === 1) { parts.push('Que puis-je faire pour vous ?'); chipsOn = true; }
    return { parts, link1, chipsOn };
  }
  form.addEventListener('submit', e => { e.preventDefault(); const q = input.value.trim(); if (!q) return; input.value = ''; ask(q); });
  function ask(q) {
    if (/^[ée]crire à l.?équipe$/i.test(q)) { say('fa-u', el('p', '', q)); return writeForm(); }
    const past = store.get('log') || []; past.push(q); store.set('log', past.slice(-12));
    answer(q, false);
  }
  const DANGER = /\b(viol(e|ee|ees|er|ent|ence)?s?|agress\w*|attouch\w*|abus\w*|inceste|harcel\w*|frapp\w*|battu\w*|maltrait\w*|suicid\w*|me tuer|en finir|me faire du mal|scarifi\w*|danger|menace\w*|(m a|m ont|me|nous a|l a) (touche|tripote|caresse|embrasse|force|deshabille|photographie|filme)\w*)\b/;
  const ME = /\b(m a|m ont|me|j ai ete|je suis|mon|ma|moi|on m)\b/;
  const VSSQ = /\b(vss|violen\w*|sexu\w*|sexis\w*|consent\w*|preven\w*|jeu|hautes herbes|atelier|signal\w*|agress\w*|harcel\w*|abus\w*|temoign\w*|parole)\b/;
  const LEGALQ = /\b(donnee\w*|cookie\w*|rgpd|confidentialit\w*|mention\w*|legal\w*|accessibilit\w*|netlify|traceur\w*)\b/;
  const HELLO = /^\s*(bonjour|salut|coucou|hello|bonsoir|hey|yo)\b/;
  const THANKS = /\b(merci|super|genial|top|parfait)\b/;
  const WHO = /\b(qui es tu|t es qui|tu es qui|es tu une? (ia|intelligence|robot)|c est quoi toi|comment tu t appelles)\b/;
  async function answer(q, quiet) {
    say('fa-u', el('p', '', q)); lastQ = q;
    if (!quiet) setState('think');
    const wait = quiet || reduced() ? 0 : 520;
    const [db] = await Promise.all([load(), new Promise(r => setTimeout(r, wait))]);
    setState('idle');
    const n = norm(q), d = el('div');
    if (!db) { d.append(el('p', '', 'Je n’arrive pas à ouvrir les documents pour le moment. Vous pouvez écrire à l’équipe :')); d.append(row([link('Écrire à l’équipe', '#ecrire', 1)])); return say('fa-f', d); }
    let soft = false;
    if (DANGER.test(n)) {
      if (ME.test(n) || !VSSQ.test(n)) { say('fa-f fa-safe', safety()); return; }
      soft = true;
    }
    if (WHO.test(n) && !AI) { d.append(el('p', '', 'Je suis Mica, l’assistante virtuelle de Fourmi’Action : un programme qui cherche dans nos pages et nos documents, directement dans votre navigateur. Je vous montre ce qui y est écrit, avec le lien, et si je ne trouve pas, je transmets votre question à l’équipe.')); return say('fa-f', d); }
    const prevIntent = lastIntent;
    const it = intentOf(q); if (it) lastIntent = it;
    const toks0 = toks(q);
    conv.push({ r: 'u', c: q });
    // Avec l’IA : réponse rédigée à partir des meilleurs extraits (sauf au rechargement de la conversation).
    if (AI && !quiet) {
      const typing = say('fa-f fa-typing', Object.assign(el('span', 'fa-dots'), { innerHTML: '<i></i><i></i><i></i>' }));
      setState('think');
      const pass = search(q, 4).map(c => ({ t: db.docs[c.di].t, s: c.s, x: c.x }));
      if (it) pass.unshift({ t: 'Réponse préparée par l’équipe', s: it.id, x: it.a });
      let r = null;
      try { r = await fetch(new URL('api/mica', ROOT), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q, h: conv.slice(-7, -1), p: pass.slice(0, 5) }) }).then(x => x.json()); } catch (_) {}
      typing.remove(); setState('idle');
      if (r && r.ok && r.a) {
        conv.push({ r: 'a', c: r.a });
        r.a.split(/\n{2,}/).forEach(par => d.append(el('p', '', par.replace(/\*\*/g, '').trim())));
        if (it) d.append(row(it.l.map((l, i) => link(l[0], l[1], i === 0))));
        const more = el('p', 'fa-more'); more.append('Une précision ? '); more.append(link('Demander à l’équipe', '#ecrire')); d.append(more);
        happy(); return say('fa-f', d);
      }
      if (r && r.limite && r.error) { d.append(el('p', '', r.error)); d.append(row([link('Écrire à l’équipe', '#ecrire', 1)])); return say('fa-f', d); }
    }
    // Sans IA : un minimum de conversation.
    const CONFUS = /\b(je (ne )?comprends? (pas|rien)|pas compris|c est pas clair|pas clair|reformule\w*|explique\w* (mieux|autrement)|plus simplement|hein)\b/;
    if (CONFUS.test(n) && toks0.length <= 6) {
      if (prevIntent) {
        d.append(el('p', '', 'Pas de souci, je reformule plus simplement :'));
        d.append(el('p', '', prevIntent.a.split(/(?<=[.!?])\s/)[0]));
        d.append(row(prevIntent.l.map((l, i) => link(l[0], l[1], i === 0))));
        d.append(el('p', 'fa-more', 'Vous pouvez aussi me poser la question avec vos mots, ou choisir un sujet :'));
      } else d.append(el('p', '', 'Pas de souci ! Dites-moi simplement ce que vous cherchez, avec vos mots. Par exemple :'));
      d.append(chips(SUGG[page] || SUGG.index)); return say('fa-f', d);
    }
    const ch = chat(n, it);
    if (ch && ch.parts) {
      if (!quiet) happy();
      ch.parts.forEach(t => d.append(el('p', '', t)));
      if (ch.link1) d.append(row([link(ch.link1[0], ch.link1[1], 1)]));
      if (ch.chipsOn) d.append(chips(SUGG[page] || SUGG.index));
      conv.push({ r: 'a', c: ch.parts.join(' ') }); return say('fa-f', d);
    }
    if (ch && ch.greetOnly) d.append(el('p', '', 'Bonjour !'));
    const found = search(q, it ? 2 : 3, it);
    if (it) {
      d.append(el('p', '', it.a));
      d.append(row(it.l.map((l, i) => link(l[0], l[1], i === 0))));
    }
    if (found.length) {
      if (it) d.append(el('p', 'fa-k', 'Dans les documents'));
      else d.append(el('p', '', found.length > 1 ? 'Voici ce que j’ai trouvé dans les documents du site :' : 'Voici ce que j’ai trouvé :'));
      const list = el('div', 'fa-res');
      found.forEach(c => {
        const a = link('', c.u); a.className = 'fa-card';
        const t = el('span', 'fa-card-t'); t.append(el('b', '', db.docs[c.di].t), el('small', '', c.s && c.s !== db.docs[c.di].t ? c.s : (c.pdf ? 'Document PDF' : 'Page du site')));
        const p = el('span', 'fa-card-x'); p.append(snippet(c, q));
        a.append(t, p); list.append(a);
      });
      d.append(list);
    }
    if (!it && !found.length) {
      d.append(el('p', '', toks0.length <= 3 ? pick(['Hmm, je ne suis pas sûre de bien vous suivre… mais je papote volontiers ! Je suis surtout incollable sur le BAFA, l’animation et l’association.', 'Je n’ai rien trouvé là-dessus, désolée ! Je suis plutôt calée sur le BAFA, l’animation et la vie de l’association.']) : 'Je ne trouve pas ça dans nos documents. Pouvez-vous me le dire autrement ? Sinon, je transmets volontiers votre question à l’équipe.'));
      d.append(row([link('Écrire à l’équipe', '#ecrire', 1)])); d.append(chips((SUGG[page] || SUGG.index).filter(x => !/^Écrire/.test(x))));
    } else {
      const more = el('p', 'fa-more'); more.append('Pas tout à fait la réponse ? '); more.append(link('Demander à l’équipe', '#ecrire')); d.append(more);
    }
    if (soft) { const h = el('p', 'fa-help'); h.append('Besoin d’aide ou de parler à quelqu’un ? '); [['119', '119'], ['3919', '3919'], ['17', '17 ou 112']].forEach(([t, l], i) => { const x = el('a', '', l); x.href = 'tel:' + t; h.append(i ? ' · ' : '', x); }); d.append(h); }
    if (!quiet && (it || found.length) && !soft) happy();
    say('fa-f', d);
  }
  function row(nodes) { const r = el('div', 'fa-row'); nodes.forEach(n => r.append(n)); return r; }
  function happy() { if (reduced()) return; setState('happy'); setTimeout(() => setState('idle'), 1300); }
  function safety() {
    const d = el('div');
    d.append(el('b', '', 'Si vous, ou un enfant, êtes en danger ou avez besoin de parler'));
    const ul = el('ul');
    [['119', 'Enfance en danger : gratuit, 24 h/24, 7 j/7'], ['3919', 'Violences faites aux femmes : gratuit, 24 h/24'], ['3114', 'Prévention du suicide : gratuit, 24 h/24'],
     ['3018', 'Cyberharcèlement : gratuit, tous les jours'], ['17 ou 112', 'Urgence immédiate (114 par SMS)']].forEach(([n, t]) => {
      const li = el('li'); const a = el('a', '', n); a.href = 'tel:' + n.split(' ')[0]; li.append(a, ' ' + t); ul.append(li);
    });
    d.append(ul, el('p', '', 'Vous pouvez aussi écrire à l’équipe de Fourmi’Action. Vous n’avez pas à tout raconter pour être aidé·e.'));
    return d;
  }

  /* ---------- Écrire à l’équipe (même chemin que le formulaire de contact) ---------- */
  function writeForm() {
    const f = el('form', 'fa-mail'); f.noValidate = true;
    const intro = el('p', '', 'Je prépare votre message. Vérifiez-le, puis envoyez-le : l’équipe vous répondra par e-mail.');
    const mk = (lab, inp) => { const l = el('label'); l.append(el('span', '', lab), inp); return l; };
    const nom = el('input'); nom.name = 'name'; nom.autocomplete = 'name'; nom.maxLength = 100;
    const mail = el('input'); mail.name = 'email'; mail.type = 'email'; mail.autocomplete = 'email'; mail.required = true; mail.maxLength = 160;
    const suj = el('select'); suj.name = 'subject'; SUJETS.forEach(s => { const o = el('option', '', s); o.value = s; suj.append(o); });
    suj.value = (lastIntent && lastIntent.sujet) || (page.includes('bafa') ? 'Formation BAFA' : 'Autre demande');
    const msg = el('textarea'); msg.name = 'message'; msg.rows = 4; msg.required = true; msg.maxLength = 5000;
    msg.value = lastQ ? `Bonjour,\n\n${lastQ}\n\nMerci !` : 'Bonjour,\n\n';
    const trap = el('input'); trap.name = 'site'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.className = 'fa-trap'; trap.setAttribute('aria-hidden', 'true');
    const status = el('p', 'fa-status'); status.setAttribute('role', 'status');
    const go = el('button', 'fa-btn fa-btn-p', 'Envoyer à l’équipe'); go.type = 'submit';
    f.append(intro, mk('Votre nom ou prénom (facultatif)', nom), mk('Votre e-mail (obligatoire)', mail), mk('Sujet', suj), mk('Votre message', msg), trap,
      el('p', 'fa-legal', 'Votre message est transmis par e-mail à l’équipe Fourmi’Action, qui l’utilise uniquement pour vous répondre. Évitez les données médicales et les informations personnelles sur des enfants.'), go, status);
    f.addEventListener('submit', async e => {
      e.preventDefault(); status.textContent = '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) { status.textContent = 'Indiquez une adresse e-mail valide pour que l’équipe puisse vous répondre.'; return mail.focus(); }
      if (msg.value.trim().length < 10) { status.textContent = 'Votre message est un peu court.'; return msg.focus(); }
      go.disabled = true; go.textContent = 'Envoi…'; setState('think');
      const body = { name: nom.value, email: mail.value, phone: '', subject: suj.value, message: msg.value, site: trap.value, t: Date.now() - T0 };
      let r = null;
      try { r = await fetch(new URL('api/contact', ROOT), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(x => x.json()); } catch (_) {}
      setState('idle');
      if (r && r.ok) {
        f.replaceWith(el('p', 'fa-k', 'Message envoyé ✓'));
        const ok = el('div'); ok.append(el('p', '', 'Message envoyé. L’équipe vous répondra à ' + mail.value.trim() + '. Pensez à regarder vos courriers indésirables.'));
        say('fa-f', ok); happy(); return;
      }
      go.disabled = false; go.textContent = 'Envoyer à l’équipe';
      if (r && r.error && !r.repli) { status.textContent = r.error; return; }
      status.textContent = 'L’envoi direct n’est pas disponible pour le moment. Vous pouvez envoyer le même message avec votre messagerie :';
      const a = el('a', 'fa-btn', 'Ouvrir ma messagerie');
      a.href = 'mailto:fourmi.action@gmail.com?subject=' + encodeURIComponent(suj.value) + '&body=' + encodeURIComponent(msg.value + (nom.value ? '\n\n' + nom.value : ''));
      status.append(' ', a);
    });
    say('fa-f fa-wide', f);
    setTimeout(() => mail.focus({ preventScroll: true }), 50);
  }

  /* ---------- En arrivant sur une page depuis la fourmi : le passage visé s’illumine ---------- */
  const hl = store.get('hl');
  if (hl) {
    store.set('hl', null);
    try {
      const u = new URL(hl);
      if (u.pathname === location.pathname && u.hash.length > 1) {
        const go = () => { const t = document.getElementById(decodeURIComponent(u.hash.slice(1))); if (!t) return; if (t.tagName === 'DETAILS') t.open = true; t.classList.add('fa-hl'); setTimeout(() => t.classList.remove('fa-hl'), 2600); };
        document.readyState === 'loading' ? addEventListener('DOMContentLoaded', () => setTimeout(go, 500)) : setTimeout(go, 500);
      }
    } catch (_) {}
  }
})();
