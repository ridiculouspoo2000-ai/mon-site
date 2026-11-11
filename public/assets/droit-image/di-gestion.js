/* Fourmi'Action · espace de gestion des autorisations */
(() => {
  'use strict';
  const { api, $, h, status, roles } = window.DI;
  let key = ''; try { key = sessionStorage.getItem('di-admin') || ''; } catch {}
  let rows = [];
  const A = (body) => api(body, { 'x-di-admin': key });
  const fmt = iso => iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  const dt = iso => iso ? new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('fr-FR') : '—';
  const save = (name, blob) => { const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };

  $('#di-login').addEventListener('submit', async e => {
    e.preventDefault(); key = $('#di-key').value.trim();
    try { sessionStorage.setItem('di-admin', key); } catch {}
    await refresh();
  });
  $('#di-logout').addEventListener('click', () => { key = ''; try { sessionStorage.removeItem('di-admin'); } catch {} $('#di-app').hidden = true; $('#di-login').hidden = false; });
  $('#di-refresh').addEventListener('click', refresh);

  async function refresh() {
    const st = $('#di-status');
    try {
      const r = await A({ a: 'admin-list' }); rows = r.rows;
      $('#di-login').hidden = true; $('#di-app').hidden = false; status(st, r.mail ? '' : 'Attention : l’envoi des e-mails n’est pas configuré.', r.mail ? 'info' : 'error');
      render();
    } catch (e) { status(st, e.message, 'error'); $('#di-login').hidden = false; $('#di-app').hidden = true; }
  }
  function render() {
    const soon = Date.now() + 45 * 864e5;
    $('#di-count').textContent = `${rows.length} dossier${rows.length > 1 ? 's' : ''} · ${rows.filter(r => r.final).length} finalisé${rows.filter(r => r.final).length > 1 ? 's' : ''}`;
    $('#di-rows').replaceChildren(...rows.map(r => {
      const etat = r.retraits.length ? ['Retrait demandé', 'warn'] : r.final ? ['Finalisé', 'ok'] : ['En attente de signatures', 'wait'];
      const maj = r.final && Date.parse(r.final.majorite) < soon;
      const card = h('article', { class: 'di-row' },
        h('div', { class: 'di-row-head' }, h('div', {}, h('h3', {}, `${r.jeune.prenom} ${r.jeune.nom}`), h('small', {}, `Dossier ${r.id} · créé le ${fmt(r.createdAt)} · né(e) le ${dt(r.jeune.naissance)}`)), h('span', { class: 'di-badge ' + etat[1] }, etat[0])),
        h('ul', { class: 'di-sg' }, r.signers.map(s => h('li', { class: s.signe ? 'ok' : '' }, h('i'), h('b', {}, roles[s.role]), ` ${s.nom} · ${s.email}`, h('small', {}, s.signe ? `signé ${fmt(s.signe)}` : s.verifie ? 'adresse confirmée' : 'en attente')))),
        r.final ? h('p', { class: 'di-res' }, `Image et voix : ${r.final.choix.A ? 'autorisé' : 'refusé'} · Prénom et nom : ${r.final.choix.B ? 'autorisé' : 'refusé'} · publication jusqu’au ${dt(r.final.finPublication)} · majorité le ${dt(r.final.majorite)}`) : null,
        r.final ? h('p', { class: 'di-hash' }, 'SHA-256 du PDF : ' + r.final.pdfSha256) : null,
        ...(r.final?.alertes || []).map(a => h('p', { class: 'di-alert' }, a)),
        ...r.retraits.map(w => h('p', { class: 'di-alert' }, `Retrait (${roles[w.role] || 'gestion'}) le ${fmt(w.at)}${w.message ? ' : ' + w.message : ''}`)),
        ...r.notes.map(n => h('p', { class: 'di-note' }, `Note du ${fmt(n.at)} : ${n.note}`)),
        h('div', { class: 'di-actions' },
          r.final ? btn('Télécharger le PDF', () => pdf(r)) : null,
          btn('Journal de preuve', () => proof(r)),
          btn('Ajouter une note', () => note(r)),
          r.final ? btn('Enregistrer un retrait', () => retrait(r)) : null,
          maj && r.jeune.email ? btn('Informer de la majorité', () => majorite(r)) : null,
          btn('Supprimer', () => del(r), 'danger')));
      return card;
    }));
  }
  const btn = (label, fn, cls = '') => { const b = h('button', { type: 'button', class: 'di-btn ' + cls }, label); b.addEventListener('click', async () => { b.disabled = true; try { await fn(); } catch (e) { alert(e.message); } finally { b.disabled = false; } }); return b; };
  async function pdf(r) { const j = await A({ a: 'admin-pdf', id: r.id }); const bin = Uint8Array.from(atob(j.pdf), c => c.charCodeAt(0)); save(`Autorisation-image-${r.id}.pdf`, new Blob([bin], { type: 'application/pdf' })); }
  async function proof(r) { const j = await A({ a: 'admin-proof', id: r.id }); save(`Journal-de-preuve-${r.id}.json`, new Blob([JSON.stringify(j.proof, null, 2)], { type: 'application/json' })); }
  async function note(r) { const n = prompt('Note (ex. « Accord du second parent confirmé par téléphone le … »)'); if (!n) return; await A({ a: 'admin-note', id: r.id, note: n }); await refresh(); }
  async function retrait(r) { const n = prompt('Préciser le retrait (qui, comment, quand) :'); if (n === null) return; await A({ a: 'admin-retrait', id: r.id, note: n }); await refresh(); }
  async function majorite(r) { if (!confirm(`Envoyer à ${r.jeune.prenom} l’information sur ses droits à sa majorité ?`)) return; await A({ a: 'admin-majorite', id: r.id }); alert('Message envoyé.'); await refresh(); }
  async function del(r) { const c = prompt(`Suppression définitive du dossier et de ses preuves. Tapez ${r.id} pour confirmer.`); if (c !== r.id) return; await A({ a: 'admin-delete', id: r.id, confirm: c }); await refresh(); }

  // Vérifier qu'un PDF n'a pas été modifié : calcul local de l'empreinte, comparée aux dossiers.
  $('#di-check').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await f.arrayBuffer()))].map(b => b.toString(16).padStart(2, '0')).join('');
    const hit = rows.find(r => r.final?.pdfSha256 === hash);
    status($('#di-check-status'), hit ? `Document authentique et non modifié : dossier ${hit.id} (${hit.jeune.prenom} ${hit.jeune.nom}).` : `Aucun dossier ne correspond à cette empreinte (${hash.slice(0, 16)}…) : le fichier a pu être modifié, ou il ne provient pas de ce service.`, hit ? 'ok' : 'error');
  });
  if (key) refresh();
})();
