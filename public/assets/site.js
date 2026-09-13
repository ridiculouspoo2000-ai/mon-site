const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav?.classList.contains('open')) {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  }
});
function copyFallback(text) {
  const previous = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;left:-9999px;top:0;';
  document.body.appendChild(field);
  let copied = false;
  try { field.select(); copied = document.execCommand('copy'); }
  catch (_) { copied = false; }
  finally { field.remove(); previous?.focus(); }
  return copied;
}
async function copyMessage(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* Try the local-file compatible fallback. */ }
  return copyFallback(text);
}
const form = document.querySelector('#contact-form');
if (form) {
  const subject = document.querySelector('#subject');
  const message = document.querySelector('#message');
  const status = document.querySelector('#contact-status');
  const name = document.querySelector('#name');
  const query = new URLSearchParams(location.search).get('sujet');
  if (query) {
    if (query.includes('Bénévolat')) subject.value = 'Bénévolat ou partenariat';
    else if (query.includes('Projet')) subject.value = 'Projet d’accueil collectif';
    message.value = 'Bonjour,\n\nJe souhaite obtenir des informations concernant : ' + query + '.\n\n';
  }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = message.value + '\n\n' + name.value;
    const mailto = 'mailto:contact@fourmiaction.fr?subject=' + encodeURIComponent(subject.value) + '&body=' + encodeURIComponent(text);
    const copied = await copyMessage(text);
    status.textContent = copied
      ? 'Message copié. Votre messagerie va s’ouvrir avec le message préparé. Si elle ne s’ouvre pas, collez le message dans un e-mail à contact@fourmiaction.fr. Aucun message n’a été envoyé par le site.'
      : 'Votre navigateur a bloqué la copie automatique. Votre messagerie va s’ouvrir avec le message préparé. Si elle ne s’ouvre pas, sélectionnez et copiez votre texte manuellement. Aucun message n’a été envoyé par le site.';
    location.href = mailto;
  });
}
