(() => {
  'use strict';
  const form = document.querySelector('#trainer-login');
  if (!form) return;
  const input = document.querySelector('#trainer-password');
  const status = document.querySelector('#trainer-status');
  const documentStatus = document.querySelector('#trainer-document-status');
  const gate = document.querySelector('#trainer-gate');
  const content = document.querySelector('#trainer-content');
  const view = document.querySelector('#trainer-view');
  const download = document.querySelector('#trainer-download');
  const lock = document.querySelector('#trainer-lock');
  const button = form.querySelector('button[type="submit"]');
  const encryptedUrl = 'assets/formateurs/guide-formatrice-formateur.enc';
  const decode = (value) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  let key = null;
  let salt = null;
  let objectUrl = null;
  let controller = null;
  let busy = false;
  let generation = 0;
  let preview = null;

  async function checkedFetch(url, signal) {
    try {
      const response = await fetch(url, { cache: 'no-store', signal });
      if (!response.ok) throw new Error('RESOURCE_UNAVAILABLE');
      return response;
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new Error('RESOURCE_UNAVAILABLE');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled || !input.value) return;
    const current = ++generation;
    button.disabled = true;
    status.textContent = 'Vérification du mot de passe…';
    const password = input.value;
    controller = new AbortController();
    try {
      if (!window.crypto?.subtle) throw new Error('WEBCRYPTO_UNAVAILABLE');
      const response = await checkedFetch('assets/formateurs/acces.json', controller.signal);
      let access;
      try { access = await response.json(); } catch { throw new Error('INVALID_RESOURCE'); }
      if (access.version !== 2 || access.iterations !== 310000 || !Array.isArray(access.entries) || access.entries.length < 1 || access.entries.length > 20) throw new Error('INVALID_RESOURCE');
      const nextSalt = decode(access.salt);
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
      const wrappingKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: nextSalt, iterations: access.iterations, hash: 'SHA-256' },
        material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
      );
      let documentKey = null;
      for (const entry of access.entries) {
        try {
          const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(entry.iv), additionalData: decode(access.documentSalt) }, wrappingKey, decode(entry.wrappedKey));
          if (clear.byteLength === 32) { documentKey = clear; break; }
        } catch { /* Une autre entrée peut correspondre au mot de passe saisi. */ }
      }
      if (!documentKey) throw new Error('WRONG_PASSWORD');
      const nextKey = await crypto.subtle.importKey('raw', documentKey, { name: 'AES-GCM' }, false, ['decrypt']);
      new Uint8Array(documentKey).fill(0);
      if (current !== generation) return;
      key = nextKey;
      salt = decode(access.documentSalt);
      gate.hidden = true;
      content.hidden = false;
      input.value = '';
      status.textContent = '';
      documentStatus.textContent = '';
      document.querySelector('#trainer-content h2')?.focus();
    } catch (error) {
      if (current !== generation || error.name === 'AbortError') return;
      status.textContent = error.message === 'WRONG_PASSWORD' ? 'Mot de passe incorrect.'
        : error.message === 'WEBCRYPTO_UNAVAILABLE' ? 'Ce navigateur ne permet pas l’ouverture sécurisée de cette ressource. Utilisez le site en HTTPS.'
        : 'Impossible de vérifier l’accès. Vérifiez votre connexion puis réessayez.';
      input.select();
    } finally {
      if (current === generation) { button.disabled = false; controller = null; }
    }
  });

  async function loadGuide(signal, current, activeKey, activeSalt) {
    const response = await checkedFetch(encryptedUrl, signal);
    const total = Number(response.headers.get('Content-Length'));
    let bytes;
    if (response.body?.getReader) {
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (current !== generation) { await reader.cancel(); throw new DOMException('Aborted', 'AbortError'); }
        chunks.push(value);
        received += value.length;
        documentStatus.textContent = total > 0
          ? `Chargement du guide : ${Math.min(100, Math.round(received / total * 100))} %`
          : `Chargement du guide : ${(received / 1000000).toFixed(1)} Mo reçus`;
      }
      bytes = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    } else { bytes = new Uint8Array(await response.arrayBuffer()); }
    if (current !== generation) throw new DOMException('Aborted', 'AbortError');
    if (bytes.length < 53 || new TextDecoder().decode(bytes.subarray(0, 8)) !== 'FMAENC01') throw new Error('INVALID_RESOURCE');
    if (!activeSalt.every((v, i) => bytes[8 + i] === v)) throw new Error('ACCESS_CHANGED');
    documentStatus.textContent = 'Ouverture du guide…';
    const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(24, 36) }, activeKey, bytes.subarray(36));
    if (current !== generation) throw new DOMException('Aborted', 'AbortError');
    return URL.createObjectURL(new Blob([clear], { type: 'application/pdf' }));
  }

  function setBusy(value) {
    busy = value;
    for (const link of [view, download]) link.setAttribute('aria-disabled', String(value));
    content.setAttribute('aria-busy', String(value));
  }

  async function openGuide(event, mode) {
    event.preventDefault();
    if (!key || busy) return;
    const current = generation;
    // Ouvrir l’onglet pendant le clic pour éviter le blocage des fenêtres.
    if (mode === 'view') {
      preview = window.open('about:blank', '_blank');
      if (!preview) { documentStatus.textContent = 'Autorisez l’ouverture du nouvel onglet, puis cliquez de nouveau sur Consulter.'; return; }
      preview.opener = null;
      preview.document.title = 'Chargement du guide Fourmi’Action';
      preview.document.body.textContent = 'Chargement du guide… La progression est affichée dans l’espace formateurs.';
    }
    setBusy(true);
    controller = new AbortController();
    documentStatus.textContent = 'Chargement du guide…';
    try {
      if (!objectUrl) objectUrl = await loadGuide(controller.signal, current, key, salt);
      if (current !== generation) return;
      if (mode === 'view') {
        if (preview && !preview.closed) preview.location.href = objectUrl;
        preview = null;
      } else {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = download.download;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      documentStatus.textContent = 'Guide prêt. Vous pouvez le consulter ou le télécharger à nouveau sans le recharger pendant cette ouverture de l’espace.';
    } catch (error) {
      if (current !== generation) return;
      preview?.close();
      preview = null;
      documentStatus.textContent = error.message === 'ACCESS_CHANGED'
        ? 'L’accès a été mis à jour. Verrouillez l’espace puis reconnectez-vous avec le mot de passe actuel.'
        : 'Le guide n’a pas pu être chargé. Vérifiez votre connexion puis réessayez.';
    } finally {
      if (current === generation) { setBusy(false); controller = null; }
    }
  }
  view.addEventListener('click', event => openGuide(event, 'view'));
  download.addEventListener('click', event => openGuide(event, 'download'));

  function reset() {
    generation += 1;
    controller?.abort();
    controller = null;
    preview?.close();
    preview = null;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    key = null;
    salt = null;
    setBusy(false);
    button.disabled = false;
    content.hidden = true;
    gate.hidden = false;
    input.value = '';
    status.textContent = '';
    documentStatus.textContent = '';
  }
  lock.addEventListener('click', () => { reset(); input.focus(); });
  window.addEventListener('pagehide', reset);
})();
