/* Actualités temporaires : tout élément portant data-until="AAAA-MM-JJ" disparaît le lendemain de cette date.
   Une annonce reste ainsi un mois dans le fil d'actualité ; ce qu'elle présente reste en place dans les Ressources. */
(function () {
  var today = new Date(); today.setHours(0, 0, 0, 0);
  document.querySelectorAll('[data-until]').forEach(function (el) {
    var d = new Date(el.getAttribute('data-until') + 'T23:59:59');
    if (!isNaN(d) && d < today) el.remove();
  });
  document.querySelectorAll('[data-until-alt]').forEach(function (el) {   // ce qui remplace une annonce une fois passée
    var d = new Date(el.getAttribute('data-until-alt') + 'T23:59:59');
    if (isNaN(d) || d >= today) el.remove(); else { el.hidden = false; el.style.display = ''; }
  });
})();
