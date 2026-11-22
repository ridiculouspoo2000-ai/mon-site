/* Fourmi'Action · signature personnelle de l'autorisation */
(() => {
  'use strict';
  const { api, $, $$, h, texte, status, roles } = window.DI;
  const token = decodeURIComponent((location.hash || '').slice(1)).trim();
  let view = null, session = null;
  const choix = { A: null, B: null };

  const show = id => {
    $$('.di-step').forEach(s => { s.hidden = s.id !== id; });
    const el = $('#' + id); el.classList.remove('di-in'); void el.offsetWidth; el.classList.add('di-in');
    $$('.di-progress li').forEach(li => li.classList.toggle('on', li.dataset.s <= el.dataset.n));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function load() {
    if (token.length < 20) return fatal('Ce lien est incomplet. Ouvrez le lien reçu par e-mail en entier.');
    try { view = await api({ a: 'view', t: token }); }
    catch (e) { return fatal(e.message); }
    // Le lien ne doit pas rester dans l'historique partagé de l'appareil plus que nécessaire.
    $('#di-hello').textContent = `Bonjour ${view.moi.prenom}`;
    $('#di-who').textContent = view.role === 'jeune'
      ? `Ton accord personnel pour l’image et la voix, dans le cadre du Collectif jeunes.`
      : `Votre accord pour l’image et la voix de ${view.jeune.prenom} ${view.jeune.nom}, en tant que ${view.moi.qualite.toLowerCase()}.`;
    $('#di-signers').replaceChildren(...view.signataires.map(s => h('li', { class: s.signe ? 'ok' : '' }, h('i'), `${roles[s.role]} · ${s.prenom}`, h('small', {}, s.signe ? 'a signé' : 'en attente'))));
    $('#di-email').textContent = view.moi.email;
    $('#di-seul').hidden = !(view.role === 'rl1' && view.autorite !== 'deux');
    $('#di-seul input').required = !$('#di-seul').hidden;
    if (view.role === 'jeune') $('#di-choice-note').textContent = 'Ton refus sera toujours respecté, même si tes parents acceptent. Il ne change rien à ta participation.';
    texte($('#di-texte'));
    $('#di-main').hidden = false; $('#di-loading').hidden = true;
    if (view.moi.signe) return done();
    show(view.moi.verifie && session ? 'di-s3' : 'di-s1');
  }
  function fatal(msg) { $('#di-loading').hidden = true; const f = $('#di-fatal'); f.hidden = false; $('p', f).textContent = msg; }

  // Étape 1 : lecture
  const reader = $('#di-texte');
  const readBtn = $('#di-read');
  const unlock = () => { if (reader.scrollTop + reader.clientHeight >= reader.scrollHeight - 40) { readBtn.disabled = false; readBtn.textContent = 'J’ai lu le document'; } };
  reader.addEventListener('scroll', unlock, { passive: true });
  setTimeout(unlock, 400);
  readBtn.addEventListener('click', () => show('di-s2'));

  // Étape 2 : code
  $('#di-send').addEventListener('click', async () => {
    const st = $('#di-code-status'); const b = $('#di-send'); b.disabled = true; status(st, 'Envoi du code…');
    try { await api({ a: 'code', t: token }); status(st, `Code envoyé à ${view.moi.email}. Pensez à vérifier les courriers indésirables.`, 'ok'); $('#di-code-form').hidden = false; $('#di-code').focus(); b.textContent = 'Renvoyer un code'; }
    catch (e) { status(st, e.message, 'error'); }
    finally { setTimeout(() => { b.disabled = false; }, 45000); }
  });
  $('#di-code-form').addEventListener('submit', async e => {
    e.preventDefault();
    const st = $('#di-code-status');
    try { const r = await api({ a: 'verify', t: token, code: $('#di-code').value }); session = r.session; status(st, ''); show('di-s3'); }
    catch (err) { status(st, err.message, 'error'); }
  });

  // Étape 3 : choix explicites, sans présélection
  $$('.di-yn').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    choix[g.dataset.c] = b.dataset.v === '1';
    $$('button', g).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('#di-to-sign').disabled = choix.A === null || choix.B === null;
  }));
  $('#di-to-sign').addEventListener('click', () => {
    $('#di-recap').replaceChildren(
      h('li', {}, 'Choix A · Image et voix : ', h('b', { class: choix.A ? 'yes' : 'no' }, choix.A ? 'Oui' : 'Non')),
      h('li', {}, 'Choix B · Prénom et nom : ', h('b', { class: choix.B ? 'yes' : 'no' }, choix.B ? 'Oui' : 'Non')));
    show('di-s4'); pad.resize();
  });
  $('#di-back').addEventListener('click', () => show('di-s3'));

  // Étape 4 : signature à l'écran (doigt, stylet ou souris)
  const pad = (() => {
    const c = $('#di-pad'), ctx = c.getContext('2d');
    let strokes = [], cur = null, W = 0, H = 0;
    function resize() {
      const r = c.getBoundingClientRect(); if (!r.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      W = Math.round(r.width); H = Math.round(r.height);
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      strokes = []; draw(); changed();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H); ctx.lineWidth = 2.4; ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = '#142f46';
      for (const s of strokes) { ctx.beginPath(); ctx.moveTo(s[0], s[1]); for (let i = 2; i < s.length; i += 2) ctx.lineTo(s[i], s[i + 1]); if (s.length === 2) ctx.lineTo(s[0] + .5, s[1]); ctx.stroke(); }
    }
    const pos = e => { const r = c.getBoundingClientRect(); return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)]; };
    c.addEventListener('pointerdown', e => { e.preventDefault(); c.setPointerCapture(e.pointerId); cur = pos(e); strokes.push(cur); draw(); });
    c.addEventListener('pointermove', e => {
      if (!cur) return; e.preventDefault();
      for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) { const p = pos(ev); const n = cur.length; if (Math.hypot(p[0] - cur[n - 2], p[1] - cur[n - 1]) >= 1.5) cur.push(p[0], p[1]); }
      draw();
    });
    const end = () => { if (cur) { cur = null; changed(); } };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end); c.addEventListener('lostpointercapture', end);
    let lastW = 0; addEventListener('resize', () => { const w = c.getBoundingClientRect().width; if (Math.abs(w - lastW) > 2 && !strokes.length) { lastW = w; resize(); } });
    function changed() {
      let len = 0; for (const s of strokes) for (let i = 2; i < s.length; i += 2) len += Math.hypot(s[i] - s[i - 2], s[i + 1] - s[i - 1]);
      const ok = len > Math.min(W, H) * 0.6;
      $('#di-pad-hint').hidden = strokes.length > 0;
      sync(ok);
    }
    return { resize, clear() { strokes = []; draw(); changed(); }, data: () => ({ w: W, h: H, s: strokes.map(s => s.slice()) }), get empty() { return !strokes.length; } };
  })();
  $('#di-clear').addEventListener('click', () => pad.clear());
  const att = $('#di-att input'), seul = $('#di-seul input');
  let sigOk = false;
  const sync = ok => { if (ok !== undefined) sigOk = ok; $('#di-sign').disabled = !(sigOk && att.checked && ($('#di-seul').hidden || seul.checked)); };
  att.addEventListener('change', () => sync()); seul.addEventListener('change', () => sync());

  $('#di-sign').addEventListener('click', async () => {
    const st = $('#di-sign-status'); const b = $('#di-sign'); b.disabled = true; status(st, 'Signature en cours…');
    try {
      const r = await api({ a: 'sign', t: token, session, choix, atteste: att.checked, attesteSeul: !$('#di-seul').hidden && seul.checked, signature: pad.data(), empreinte: window.DI_TEXTE.empreinte, lu: 'lecture-complete' });
      view = await api({ a: 'view', t: token });
      done(r.finalise);
    } catch (e) { status(st, e.message, 'error'); b.disabled = false; if (/expiré/.test(e.message)) setTimeout(() => show('di-s2'), 1800); }
  });

  function done() {
    show('di-s5');
    const f = view.finalise;
    $('#di-done-title').textContent = f ? 'C’est signé par tout le monde.' : 'Merci, votre signature est enregistrée.';
    $('#di-done-text').textContent = f
      ? 'Toutes les signatures requises sont réunies. Un exemplaire signé a été envoyé par e-mail à chaque signataire.'
      : 'Le document sera finalisé quand toutes les signatures requises seront réunies. Chacun recevra alors l’exemplaire signé par e-mail.';
    $('#di-signers').replaceChildren(...view.signataires.map(s => h('li', { class: s.signe ? 'ok' : '' }, h('i'), `${roles[s.role]} · ${s.prenom}`, h('small', {}, s.signe ? 'a signé' : 'en attente'))));
    const dl = $('#di-pdf'); dl.hidden = !f;
    if (f) { dl.href = `/api/droit-image?a=pdf&t=${encodeURIComponent(token)}`; $('#di-hash').textContent = 'Empreinte SHA-256 : ' + f.pdfSha256; $('#di-result').replaceChildren(
      h('li', {}, 'Image et voix : ', h('b', { class: f.choix.A ? 'yes' : 'no' }, f.choix.A ? 'autorisé' : 'refusé')),
      h('li', {}, 'Prénom et nom : ', h('b', { class: f.choix.B ? 'yes' : 'no' }, f.choix.B ? 'autorisé' : 'refusé'))); }
  }
  $('#di-retrait-form').addEventListener('submit', async e => {
    e.preventDefault();
    const st = $('#di-retrait-status');
    if (!confirm('Confirmez-vous la demande de retrait de votre accord ?')) return;
    try { await api({ a: 'retrait', t: token, message: $('#di-retrait-msg').value }); status(st, 'Votre demande de retrait est enregistrée. Un e-mail de confirmation vous a été envoyé.', 'ok'); $('#di-retrait-form button').disabled = true; }
    catch (err) { status(st, err.message, 'error'); }
  });
  load();
})();
