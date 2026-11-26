/* Apparence : le site est toujours en « Verre liquide » (appliqué avant l’affichage pour éviter tout clignotement). */
(function () {
  document.documentElement.classList.add('theme-verre', 'fa-js');
  // On arrive toujours en haut de la page (rechargement, retour) : les animations au défilement commencent par le début.
  // Seule exception : un lien vers une section (#…), qui va directement à sa place.
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; if (!location.hash) { window.scrollTo(0, 0); addEventListener('pageshow', function (e) { if (!e.persisted && !location.hash) window.scrollTo(0, 0); }); } } catch (e) { }
  // Les animations au défilement sont préparées dès le premier affichage (sinon l’accueil montre un instant la fin de l’animation).
  try { var pref = localStorage.getItem('fourmiaction-reduced-motion'); var red = pref === null ? matchMedia('(prefers-reduced-motion: reduce)').matches : pref === 'true'; if (!red) document.documentElement.classList.add('ap-motion', 'ap-scenes'); } catch (e) {}
  try { localStorage.removeItem('fa-style'); } catch (e) {}
})();
