/* Aperçu des voix du jeu : écouter chaque réplique et générer toutes les voix d'un coup. */
(() => {
  const L = window.VOIX_LIGNES, list = document.getElementById('v-list'), st = document.getElementById('v-status'), diag = document.getElementById('v-diag');
  fetch('/api/voix?a=test', { cache: 'no-store' }).then(r => r.json()).then(j => { diag.textContent = j.ok ? `Connexion à ElevenLabs réussie · offre ${j.offre} · caractères utilisés ${j.caracteres}.` : 'Diagnostic : ' + j.detail; diag.dataset.kind = j.ok ? 'ok' : 'error'; }).catch(() => { diag.textContent = 'Diagnostic indisponible.'; });
  const names = { nour: 'Nour', bastien: 'Bastien', ines: 'Inès', jade: 'Jade', kevin: 'Kévin', garnier: 'M. Garnier', lou: 'Lou', malo: 'Malo', maelys: 'Maëlys' };
  const audio = new Audio();
  L.forEach((l, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="di-btn">Écouter</button> <b></b> <span></span> <small></small>`;
    li.querySelector('b').textContent = names[l.who] || l.who;
    li.querySelector('span').textContent = l.text;
    li.querySelector('button').addEventListener('click', () => { audio.src = '/api/voix?id=' + l.id; audio.play().catch(() => {}); });
    list.append(li); l.el = li;
  });
  fetch('/api/voix?a=etat', { cache: 'no-store' }).then(r => r.json()).then(j => { st.textContent = j.active ? `Voix activées · ${j.generees} réplique(s) déjà générée(s) sur ${j.lignes}.` : `Clé ElevenLabs absente : ajoutez ELEVENLABS_API_KEY dans Netlify. ${j.generees} réplique(s) déjà générée(s).`; }).catch(() => { st.textContent = 'Service des voix indisponible.'; });
  document.getElementById('v-all').addEventListener('click', async (e) => {
    e.target.disabled = true; let ok = 0, firstErr = '';
    for (const l of L) {
      const s = l.el.querySelector('small'); s.textContent = '…';
      try {
        const r = await fetch('/api/voix?id=' + l.id);
        if (r.ok) { s.textContent = '✓'; ok++; }
        else { let d = ''; try { const j = await r.json(); d = j.detail || j.error || ''; } catch {} s.textContent = 'échec'; s.title = d; if (d && !firstErr) { firstErr = d; diag.textContent = 'Cause : ' + d; } }
      } catch { s.textContent = 'échec'; }
      st.textContent = `${ok} / ${L.length} répliques prêtes`;
    }
    e.target.disabled = false;
  });
})();
