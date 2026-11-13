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
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const SUJETS = ['Formation BAFA', 'Intervention dans une structure', 'Projet d’accueil collectif', 'Bénévolat ou partenariat', 'Autre demande'];
  const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';

  /* ---------- La mascotte (dessin original) ---------- */
  let gid = 0;
  function ant(size) {
    // Tête ronde centrée exactement dans le cadre (50,50) ; seules les antennes en dépassent.
    const id = 'fa-ant-' + (++gid);
    const w = document.createElement('span');
    w.className = 'fa-ant';
    w.innerHTML = `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" focusable="false">
<defs>
<radialGradient id="${id}h" cx=".34" cy=".28" r=".85"><stop offset="0" stop-color="#7fa6ff"/><stop offset=".38" stop-color="#3d6ee6"/><stop offset=".78" stop-color="#2546a8"/><stop offset="1" stop-color="#1b2f6e"/></radialGradient>
<radialGradient id="${id}i" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3a4f8f"/><stop offset=".55" stop-color="#16213f"/><stop offset="1" stop-color="#0a1022"/></radialGradient>
<radialGradient id="${id}t" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffc08a"/><stop offset=".6" stop-color="#f07a32"/><stop offset="1" stop-color="#c4501b"/></radialGradient>
<linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<g class="fa-face">
<g class="fa-antl"><path d="M38 23.5C34 14 29 7.5 22 4" stroke="#1b2f6e" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="21" cy="3.6" r="5" fill="url(#${id}t)"/></g>
<g class="fa-antr"><path d="M62 23.5C66 14 71 7.5 78 4" stroke="#1b2f6e" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="79" cy="3.6" r="5" fill="url(#${id}t)"/></g>
<ellipse cx="50" cy="50" rx="33" ry="30.5" fill="url(#${id}h)"/>
<ellipse cx="50" cy="50" rx="32.2" ry="29.7" fill="none" stroke="url(#${id}r)" stroke-width="1.6"/>
<ellipse cx="38" cy="30.5" rx="11" ry="5.2" fill="#fff" opacity=".28" transform="rotate(-20 38 30.5)"/>
<ellipse cx="29.5" cy="61" rx="5.6" ry="3.4" fill="#ff8f86" opacity=".55"/><ellipse cx="70.5" cy="61" rx="5.6" ry="3.4" fill="#ff8f86" opacity=".55"/>
<g class="fa-eyes">
<ellipse cx="38.5" cy="48" rx="10.2" ry="11.6" fill="#fff"/><ellipse cx="61.5" cy="48" rx="10.2" ry="11.6" fill="#fff"/>
<g class="fa-pupils"><circle cx="39.5" cy="49.5" r="6.6" fill="url(#${id}i)"/><circle cx="62.5" cy="49.5" r="6.6" fill="url(#${id}i)"/>
<circle cx="41.8" cy="46.6" r="2.4" fill="#fff"/><circle cx="64.8" cy="46.6" r="2.4" fill="#fff"/><circle cx="37.6" cy="52.4" r="1.1" fill="#fff" opacity=".8"/><circle cx="60.6" cy="52.4" r="1.1" fill="#fff" opacity=".8"/></g></g>
<path class="fa-happy" d="M30 50q8.5-9 17 0M53 50q8.5-9 17 0" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none"/>
<path class="fa-mouth" d="M45 63.5q5 4.6 10 0" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/>
</g>
<g class="fa-loupe"><circle cx="82" cy="80" r="11" fill="#fff"/><circle cx="80.5" cy="78.5" r="5.2" fill="none" stroke="#2546a8" stroke-width="2.4"/><path d="M84.4 82.4l3.6 3.6" stroke="#2546a8" stroke-width="2.6" stroke-linecap="round"/></g>
</svg>`;
    return w;
  }

  /* ---------- Interface ---------- */
  const root = el('div', 'fa-fourmi'); root.setAttribute('data-state', 'idle');
  const launcher = el('button', 'fa-launch'); launcher.type = 'button';
  launcher.setAttribute('aria-label', 'Poser une question à la fourmi'); launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-controls', 'fa-panel');
  const big = ant(64); launcher.append(big);
  const dot = el('span', 'fa-dot'); dot.setAttribute('aria-hidden', 'true'); launcher.append(dot);
  const bubble = el('div', 'fa-bubble'); bubble.setAttribute('role', 'status');
  const bubbleTxt = el('span'); const bubbleX = el('button', 'fa-bubble-x', '×'); bubbleX.type = 'button'; bubbleX.setAttribute('aria-label', 'Fermer');
  bubble.append(bubbleTxt, bubbleX);

  const panel = el('section', 'fa-panel'); panel.id = 'fa-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'La fourmi, assistant de recherche'); panel.hidden = true;
  const head = el('header', 'fa-head');
  const headAnt = ant(40); const headTxt = el('div', 'fa-head-t'); headTxt.append(el('b', '', 'La Fourmi'), el('small', '', 'Je cherche dans les pages et les documents du site'));
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
  root.append(panel, bubble, launcher);

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
  // Au doigt : elle regarde l’endroit touché.
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || reduced()) return; look(e.clientX, e.clientY); clearTimeout(look.t); look.t = setTimeout(() => ants().forEach(a => { const p = a.querySelector('.fa-pupils'); if (p) p.style.transform = ''; }), 1600); }, { passive: true });
  function look(x, y) {
    ants().forEach(a => {
      const r = a.getBoundingClientRect(); if (!r.width) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height * .45;
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
      const p = a.querySelector('.fa-pupils'); if (p) p.style.transform = `translate(${(dx / d * 3.4 * k).toFixed(2)}px,${(dy / d * 3.6 * k).toFixed(2)}px)`;
    });
  }
  // Clignements.
  (function blink() {
    setTimeout(() => { if (!reduced()) { root.classList.add('fa-blink'); setTimeout(() => root.classList.remove('fa-blink'), 160); } blink(); }, 2600 + Math.random() * 3800);
  })();
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

  /* ---------- Bulle d’accueil, selon la page ---------- */
  const TEASE = {
    index: 'Coucou ! Une question sur l’association ou le BAFA ? Je cherche pour vous.',
    bafa: 'Dates, prix, paiement en plusieurs fois… demandez-moi !',
    'formation-bafa-orleans': 'Une question sur le BAFA à Orléans ? Je connais tous les documents.',
    'collectif-jeunes': 'Tu as entre 14 et 17 ans ? Pose-moi tes questions sur le collectif !',
    contact: 'Je peux aussi transmettre votre message à l’équipe.',
    'projet-educatif': 'Je peux retrouver un passage du projet éducatif pour vous.'
  };
  function tease() {
    const seen = store.get('teased') || {};
    if (seen[page] || !panel.hidden) return;
    bubbleTxt.textContent = TEASE[page] || 'Une question ? Je cherche dans tous les documents du site.';
    root.classList.add('fa-teasing'); setState('wave');
    seen[page] = 1; store.set('teased', seen);
    setTimeout(() => { if (root.getAttribute('data-state') === 'wave') setState('idle'); }, 2400);
    setTimeout(hideTease, 9000);
  }
  const hideTease = () => root.classList.remove('fa-teasing');
  bubbleX.addEventListener('click', e => { e.stopPropagation(); hideTease(); });
  bubbleTxt.addEventListener('click', () => { hideTease(); open(); });
  setTimeout(tease, 3800);
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
    d.append(el('p', '', 'Bonjour ! Je suis la fourmi de Fourmi’Action. Posez-moi une question : je cherche la réponse dans les pages et les documents du site, et je vous montre où c’est écrit.'));
    d.append(chips(SUGG[page] || SUGG.index));
    say('fa-f', d);
  }
  function restore() {
    const past = store.get('log') || [];
    if (!past.length) return greet();
    greet(); past.slice(-6).forEach(q => answer(q, true));
  }
  let lastQ = '', lastIntent = null;
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
    if (!db) { d.append(el('p', '', 'Oups, je n’arrive pas à ouvrir mes documents pour le moment. Vous pouvez écrire à l’équipe :')); d.append(row([link('Écrire à l’équipe', '#ecrire', 1)])); return say('fa-f', d); }
    let soft = false;
    if (DANGER.test(n)) {
      if (ME.test(n) || !VSSQ.test(n)) { say('fa-f fa-safe', safety()); return; }
      soft = true;
    }
    if (WHO.test(n)) { d.append(el('p', '', 'Je suis la petite fourmi du site ! Je ne suis pas une intelligence artificielle qui invente : je cherche dans les pages et les documents de Fourmi’Action et je vous montre ce qui y est écrit, avec le lien. Et si je ne trouve pas, je transmets votre question à l’équipe.')); return say('fa-f', d); }
    const it = intentOf(q); lastIntent = it;
    const toks0 = toks(q);
    if (!it && HELLO.test(n) && toks0.length <= 2) { if (!quiet) happy(); d.append(el('p', '', 'Bonjour ! Que puis-je chercher pour vous ?')); d.append(chips(SUGG[page] || SUGG.index)); return say('fa-f', d); }
    if (!it && THANKS.test(n) && toks0.length <= 3) { if (!quiet) happy(); d.append(el('p', '', 'Avec plaisir ! Je reste là, en bas à droite, si vous avez une autre question.')); return say('fa-f', d); }
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
      d.append(el('p', '', 'Je n’ai rien trouvé à ce sujet dans les documents du site. Essayez avec d’autres mots, ou posez directement la question à l’équipe : je peux préparer le message.'));
      d.append(row([link('Écrire à l’équipe', '#ecrire', 1)]));
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
        const ok = el('div'); ok.append(el('p', '', 'C’est envoyé ! L’équipe vous répondra à ' + mail.value.trim() + '. Pensez à regarder vos courriers indésirables.'));
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
