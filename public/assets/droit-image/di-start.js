/* Fourmi'Action · démarrer un dossier d'autorisation */
(() => {
  'use strict';
  const { api, $, $$, texte, status } = window.DI;
  texte($('#di-texte'));
  const form = $('#di-form');
  const rl2 = $('#di-rl2');
  const sync = () => {
    const v = form.autorite.value;
    rl2.hidden = v !== 'deux';
    $$('input,select', rl2).forEach(i => { i.required = v === 'deux'; i.disabled = v !== 'deux'; });
    $('#di-rl1-titre').textContent = v === 'tuteur' ? 'Le tuteur ou la tutrice' : v === 'seul' ? 'Le parent qui exerce seul l’autorité parentale' : 'Représentant légal 1';
  };
  $$('input[name="autorite"]', form).forEach(r => r.addEventListener('change', sync));
  sync();
  const max = new Date(); const min = new Date();
  max.setFullYear(max.getFullYear() - 12); min.setFullYear(min.getFullYear() - 18); min.setDate(min.getDate() + 1);
  form.naissance.max = max.toISOString().slice(0, 10); form.naissance.min = min.toISOString().slice(0, 10);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const st = $('#di-status');
    if (!form.reportValidity()) return;
    const v = n => (form.elements[n]?.value || '').trim();
    const body = {
      a: 'start', site: v('site'), autorite: form.autorite.value, accepte: form.accepte.checked,
      jeune: { nom: v('j_nom'), prenom: v('j_prenom'), naissance: v('naissance'), email: v('j_email') },
      rl: [{ nom: v('r1_nom'), prenom: v('r1_prenom'), qualite: v('r1_qualite'), email: v('r1_email') }]
    };
    if (body.autorite === 'deux') body.rl.push({ nom: v('r2_nom'), prenom: v('r2_prenom'), qualite: v('r2_qualite'), email: v('r2_email') });
    const btn = $('button[type="submit"]', form); btn.disabled = true; status(st, 'Envoi en cours…');
    try {
      const r = await api(body);
      if (!r.id) { status(st, 'Merci.', 'ok'); return; }
      form.hidden = true;
      const done = $('#di-done'); done.hidden = false;
      $('#di-done-list').replaceChildren(...r.signataires.map(s => window.DI.h('li', {}, window.DI.h('b', {}, window.DI.roles[s.role] + ' · ' + s.prenom), ' — lien envoyé à ' + s.email)));
      $('#di-done-id').textContent = r.id;
      done.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) { status(st, err.message, 'error'); }
    finally { btn.disabled = false; }
  });
})();
