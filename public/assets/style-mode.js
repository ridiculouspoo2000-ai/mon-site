/* Apparence choisie (Épuré ou Verre liquide), appliquée avant l’affichage pour éviter tout clignotement. */
(function () {
  try {
    var q = new URLSearchParams(location.search).get('style');
    if (q === 'verre' || q === 'epure') localStorage.setItem('fa-style', q);
    if (localStorage.getItem('fa-style') === 'verre') document.documentElement.classList.add('theme-verre');
  } catch (e) {}
})();
