/* Apparence : le site est toujours en « Verre liquide » (appliqué avant l’affichage pour éviter tout clignotement). */
(function () {
  document.documentElement.classList.add('theme-verre');
  try { localStorage.removeItem('fa-style'); } catch (e) {}
})();
