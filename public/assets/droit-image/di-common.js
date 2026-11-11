/* Fourmi'Action · autorisation de droit à l'image · outils communs */
window.DI = (() => {
  'use strict';
  const API = '/api/droit-image';
  async function api(body, headers = {}) {
    let r;
    try {
      r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), cache: 'no-store' });
    } catch { throw new Error('Connexion impossible. Vérifiez votre accès à internet puis réessayez.'); }
    let j = null; try { j = await r.json(); } catch {}
    if (!r.ok || !j || j.ok === false) throw new Error((j && j.error) || 'Le service ne répond pas. Réessayez dans un instant.');
    return j;
  }
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v === false || v == null) continue; if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v === true ? '' : v); }
    for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(String(k)));
    return e;
  };
  function texte(el) {
    const T = window.DI_TEXTE;
    el.replaceChildren(
      h('p', { class: 'di-intro' }, T.intro),
      ...T.sections.map(s => h('section', { class: 'di-sec' }, h('h3', {}, s.h), ...s.p.map(p => h('p', {}, p)))),
      h('p', { class: 'di-ref' }, `Réf. ${T.ref} · empreinte du texte ${T.empreinte.slice(0, 16)}…`)
    );
  }
  function status(el, msg, kind = 'info') { if (!el) return; el.textContent = msg || ''; el.dataset.kind = kind; el.hidden = !msg; }
  const roles = { jeune: 'Le jeune', rl1: 'Représentant légal 1', rl2: 'Représentant légal 2' };
  return { api, $, $$, h, texte, status, roles };
})();
