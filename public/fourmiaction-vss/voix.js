/* Aperçu des voix du jeu : écouter chaque réplique et générer toutes les voix d'un coup. */
(() => {
  const L = window.VOIX_LIGNES, list = document.getElementById('v-list'), st = document.getElementById('v-status'), diag = document.getElementById('v-diag');
  fetch('/api/voix?a=test', { cache: 'no-store' }).then(r => r.json()).then(j => { diag.textContent = j.ok ? `Connexion à ElevenLabs réussie · offre ${j.offre} · caractères utilisés ${j.caracteres}` + (j.restants != null ? ` · il reste ${j.restants} caractères (régénérer toutes les voix en demande environ 2 300)` : '') + (j.renouvellement ? ` · crédits renouvelés le ${new Date(j.renouvellement * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : '') + '.' : 'Diagnostic : ' + j.detail; diag.dataset.kind = j.ok ? 'ok' : 'error'; }).catch(() => { diag.textContent = 'Diagnostic indisponible.'; });
  const names = { nour: 'Nour', bastien: 'Bastien', ines: 'Inès', jade: 'Jade', kevin: 'Kévin', garnier: 'M. Garnier', lou: 'Lou', sacha: 'Sacha', lena: 'Léna', malo: 'Malo', zoe: 'Zoé', theo: 'Théo', enzo: 'Enzo', clara: 'Clara', maelys: 'Maëlys', narr: 'Narration', e_maman: 'Prélude · maman, voisine', e_papa: 'Prélude · papa, père', e_anim: 'Prélude · animateur, adulte', e_fille: 'Prélude · petite fille', e_animatrice: 'Prélude · animatrice', e_ado: 'Prélude · ado', e_ado_f: 'Prélude · adolescente', e_garcon: 'Prélude · petit garçon' };
  const audio = new Audio();
  L.forEach((l, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="di-btn">Écouter</button> <b></b> <span></span> <small></small>`;
    li.querySelector('b').textContent = names[l.who] || l.who;
    li.querySelector('span').textContent = l.text;
    li.querySelector('button').addEventListener('click', () => { audio.src = '/api/voix?id=' + l.id; audio.play().catch(() => {}); });
    list.append(li); l.el = li;
  });
  fetch('/api/voix?a=etat', { cache: 'no-store' }).then(r => r.json()).then(j => { st.textContent = j.active ? `Voix activées (${j.modele || ''}) · ${j.generees} réplique(s) prête(s) sur ${j.lignes} avec la distribution actuelle` + (j.besoin ? ` · il faut encore environ ${j.besoin} caractères pour les autres.` : '.') : `Clé ElevenLabs absente : ajoutez ELEVENLABS_API_KEY dans Netlify. ${j.generees} réplique(s) déjà générée(s).`; }).catch(() => { st.textContent = 'Service des voix indisponible.'; });
  document.getElementById('v-all').addEventListener('click', async (e) => {
    e.target.disabled = true; let ok = 0, firstErr = '';
    // Pas de génération partielle : sinon une partie des répliques changerait de voix et pas l’autre.
    let need = Math.round(L.reduce((n, l) => n + l.text.length, 0) * 1.4);
    try { const e2 = await fetch('/api/voix?a=etat', { cache: 'no-store' }).then(r => r.json()); if (typeof e2.besoin === 'number') need = e2.besoin; } catch (_) {}
    try { const t = await fetch('/api/voix?a=test', { cache: 'no-store' }).then(r => r.json());
      if (t.ok && typeof t.restants === 'number' && t.restants < need) {
        st.textContent = `Il reste ${t.restants} caractères ElevenLabs ; la nouvelle distribution en demande environ ${need}. Relancez après le renouvellement des crédits (ou avec une offre payante). En attendant, le jeu garde les voix actuelles.`;
        e.target.disabled = false; return; } } catch (_) {}
    for (const l of L) {
      const s = l.el.querySelector('small'); s.textContent = '…';
      try {
        const r = await fetch('/api/voix?gen=1&id=' + l.id);
        if (r.ok) { s.textContent = '✓'; ok++; }
        else { let d = ''; try { const j = await r.json(); d = j.detail || j.error || ''; } catch {} s.textContent = 'échec'; s.title = d; if (d && !firstErr) { firstErr = d; diag.textContent = 'Cause : ' + d; } }
      } catch { s.textContent = 'échec'; }
      st.textContent = `${ok} / ${L.length} répliques prêtes`;
    }
    e.target.disabled = false;
  });

  /* ---------- Distribution : choisir une voix parisienne par personnage ---------- */
  const grid = document.getElementById('c-grid'), cst = document.getElementById('c-status'), out = document.getElementById('c-out');
  const preview = new Audio(); let data = null; const enfants = [];
  // Une carte de voix (cases à cocher, écoute, ajout au compte ElevenLabs si besoin)
  function carte(who, p, v, wrap, f0) {
    const lab = document.createElement('label'); lab.className = 'c-v';
    lab.innerHTML = '<span class="row"><b></b><input type="radio"></span><small></small><span class="row"><button type="button" class="di-btn">Écouter</button><span class="c-actuelle"></span></span>';
    lab.querySelector('b').textContent = v.nom;
    const zone = f0 ? (f0 >= 250 ? 'hauteur d’une voix d’enfant' : f0 >= 200 ? 'voix de femme aiguë' : 'voix adulte') : '';
    lab.querySelector('small').textContent = [f0 ? `≈ ${f0} Hz · ${zone}` : '', v.accent && (/paris/i.test(v.accent) ? 'accent parisien' : 'français standard'), v.langue && v.langue !== 'fr' ? 'voix étrangère vérifiée en français' : '', v.description].filter(Boolean).join(' · ');
    const r = lab.querySelector('input'); r.name = 'c-' + who; r.value = v.id; r.dataset.nom = v.nom;
    if (v.id === p.actuelle) { r.checked = true; lab.querySelector('.c-actuelle').textContent = 'voix actuelle'; }
    lab.querySelector('button').addEventListener('click', e => { e.preventDefault(); preview.src = '/api/voix?a=apercu&u=' + encodeURIComponent(v.ecoute); preview.play().catch(() => {}); });
    if (v.surLeCompte === false && v.proprio) {
      const add = document.createElement('button'); add.type = 'button'; add.className = 'di-btn'; add.textContent = 'Ajouter à mon compte ElevenLabs';
      add.title = 'Nécessaire pour que le jeu puisse utiliser cette voix (une place de voix sur votre compte).';
      add.addEventListener('click', async e => { e.preventDefault(); add.disabled = true; add.textContent = 'Ajout…';
        try { const j = await fetch('/api/voix?a=ajouter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: v.id, proprio: v.proprio, nom: v.nom }) }).then(r => r.json());
          add.textContent = j.ok ? 'Ajoutée à votre compte ✓' : 'Échec : ' + (j.detail || j.error || ''); if (!j.ok) add.disabled = false; } catch (_) { add.textContent = 'Échec'; add.disabled = false; } });
      lab.lastElementChild.append(add);
    } else if (v.surLeCompte) { const ok = document.createElement('span'); ok.className = 'c-actuelle'; ok.textContent = ' · déjà sur votre compte'; lab.lastElementChild.append(ok); }
    wrap.append(lab);
  }
  // Hauteur de voix (fréquence fondamentale) mesurée dans le navigateur sur l’extrait gratuit de chaque voix
  async function f0De(url) {
    const r = await fetch('/api/voix?a=apercu&u=' + encodeURIComponent(url)); if (!r.ok) return 0;
    const ac = new OfflineAudioContext(1, 16000, 16000); let b; try { b = await ac.decodeAudioData(await r.arrayBuffer()); } catch (_) { return 0; }
    const sr = b.sampleRate, x = b.getChannelData(0), N = Math.floor(sr * .03), hop = Math.floor(sr * .04), mi = Math.floor(sr / 650), ma = Math.floor(sr / 70), F = [];
    for (let s0 = 0; s0 < Math.min(x.length - N - ma, sr * 8); s0 += hop) {
      let e = 0; for (let i = 0; i < N; i++) e += x[s0 + i] * x[s0 + i]; if (e / N < 1e-4) continue;
      let best = 0, bl = 0; for (let L = mi; L <= ma; L++) { let c = 0, e2 = 0; for (let i = 0; i < N; i++) { c += x[s0 + i] * x[s0 + i + L]; e2 += x[s0 + i + L] * x[s0 + i + L]; } const q = c / Math.sqrt(e * e2 + 1e-12); if (q > best) { best = q; bl = L; } }
      if (best > .75) F.push(sr / bl);
    }
    if (F.length < 8) return 0; F.sort((a, b) => a - b); return Math.round(F[F.length >> 1]);
  }
  async function hauteurs() {
    if (!enfants.length) return;
    const tous = new Map(); enfants.forEach(([p]) => p.voix.forEach(v => tous.set(v.id, v)));
    const H = new Map(); let i = 0; const L = [...tous.values()];
    enfants.forEach(([, wrap]) => { wrap.textContent = 'Mesure de la hauteur des voix…'; });
    await Promise.all(Array.from({ length: 4 }, async () => { while (i < L.length) { const v = L[i++]; H.set(v.id, await f0De(v.ecoute).catch(() => 0)); } }));
    for (const [p, wrap] of enfants) {
      wrap.textContent = '';
      const who = Object.keys(data.personnages).find(k => data.personnages[k] === p);
      p.voix.slice().sort((a, b) => (H.get(b.id) || 0) - (H.get(a.id) || 0)).slice(0, 8).forEach(v => carte(who, p, v, wrap, H.get(v.id)));
    }
  }
  fetch('/api/voix?a=casting').then(r => r.json()).then(j => {
    data = j;
    const P = j.personnages || {};
    let n = 0;
    Object.entries(P).forEach(([who, p]) => {
      const box = document.createElement('section'); box.className = 'c-perso';
      box.innerHTML = '<h3></h3><p></p><div class="c-voix"></div>';
      box.querySelector('h3').textContent = p.nom; box.querySelector('p').textContent = p.role;
      const wrap = box.querySelector('.c-voix');
      if (!p.voix.length) wrap.textContent = 'Aucune voix trouvée pour ce profil.';
      if (p.enfant) { enfants.push([p, wrap, box]); box.classList.add('c-enfant'); box.querySelector('p').textContent += ' · Voix classées de la plus aiguë à la plus grave (mesurées sur leurs extraits).'; grid.append(box); return; }
      p.voix.forEach((v) => { n++; carte(who, p, v, wrap, 0); });
      grid.append(box);
    });
    cst.textContent = n ? `${n} voix à l’accent parisien proposées. Les écoutes sont gratuites.` : 'Aucune voix trouvée.';
    hauteurs();
    if (j.erreurs && j.erreurs.length) { cst.textContent += ' Détail : ' + j.erreurs[0]; cst.dataset.kind = 'error'; }
  }).catch(() => { cst.textContent = 'Impossible de charger la bibliothèque de voix.'; cst.dataset.kind = 'error'; });
  document.getElementById('c-copy').addEventListener('click', async () => {
    if (!data) return;
    const lines = Object.entries(data.personnages).map(([who, p]) => {
      const r = document.querySelector(`input[name="c-${who}"]:checked`);
      return `${p.nom} : ${r ? r.dataset.nom + ' (' + r.value + ')' : 'pas encore choisi'}`;
    });
    out.value = 'Distribution des voix · Les Hautes Herbes\n' + lines.join('\n');
    out.hidden = false; out.select();
    try { await navigator.clipboard.writeText(out.value); cst.textContent = 'Distribution copiée : collez-la dans la conversation avec Claude.'; cst.dataset.kind = 'ok'; } catch (_) { cst.textContent = 'Sélectionnez le texte ci-dessous et copiez-le.'; }
  });
})();
