/* Fourmi'Action · Atelier VSS en direct · éléments communs */
var FAX = (function () {
  "use strict";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var base = location.href.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  /* serveur : fonction Netlify (/api/atelier-vss) ou, à défaut, api.php à côté des pages */
  var ENDPOINT = null;
  function endpoint() {
    if (ENDPOINT) return Promise.resolve(ENDPOINT);
    var tryUrl = function (u) { return fetch(u + "?a=ping", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return j && j.ok ? u : null; }).catch(function () { return null; }); };
    return tryUrl(location.origin + "/api/atelier-vss").then(function (u) { return u || tryUrl(base + "api.php"); }).then(function (u) { ENDPOINT = u; return u; });
  }
  function api(body, get) {
    return endpoint().then(function (url) {
      if (!url) return { ok: false, error: "La séance en direct n’est pas encore activée sur ce site. Vous pouvez présenter la séance sans participants connectés." };
      var opt = get ? { method: "GET", cache: "no-store" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" };
      if (get) url += "?" + Object.keys(body).map(function (k) { return k + "=" + encodeURIComponent(body[k]); }).join("&");
      return fetch(url, opt).then(function (r) { return r.json().catch(function () { return { ok: false, error: "Le serveur ne répond pas comme prévu." }; }); })
        .catch(function () { return { ok: false, error: "Connexion impossible. Vérifiez le réseau." }; });
    });
  }
  function qr(text, dark, light) {
    try {
      var q = new QRLIB.QRCode(-1, QRLIB.L.M); q.addData(text); q.make();
      var n = q.getModuleCount(), d = "";
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += "M" + c + "," + r + "h1v1h-1z";
      return '<svg viewBox="-2 -2 ' + (n + 4) + " " + (n + 4) + '" shape-rendering="crispEdges" role="img" aria-label="QR code pour rejoindre la séance"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="' + (light || "#fff") + '"/><path d="' + d + '" fill="' + (dark || "#000") + '"/></svg>';
    } catch (e) { return ""; }
  }
  var GROUPS = { 1: ["S01", "S05", "S09"], 2: ["S02", "S06", "S10"], 3: ["S03", "S07", "S11"], 4: ["S04", "S08", "S12"] };
  var GCOL = { 1: "#054F85", 2: "#D35A0B", 3: "#2F7D5B", 4: "#7A4FA0" };
  var DQ = [["D1", "Une plaisanterie devient acceptable dès que son auteur dit ne pas vouloir blesser."], ["D2", "Plusieurs personnes peuvent contribuer à un harcèlement même si chacune n’intervient qu’une fois."], ["D3", "Le silence suffit pour conclure qu’une personne accepte un geste sexuel."], ["D4", "On peut protéger et demander de l’aide sans savoir nommer exactement l’infraction."]];
  var DOPT = [["a", "D’accord"], ["d", "Pas d’accord"], ["n", "Je ne sais pas"]];
  var EXPECT = { A01: "e", A02: "e", A03: "e", A04: "e", A05: "x", A06: "x", A07: "x", A09: "x", A10: "x", A08: "d" };
  var ZONES = [["e", "À engager"], ["x", "À écarter"], ["d", "Dans la durée"]];
  var MUR = [["pense", "Ce que nous pensons"], ["hesite", "Ce qui nous fait hésiter"], ["savoir", "Ce que nous voulons savoir faire"]];
  var REGLE = [["1", "Quand un fait me préoccupe…"], ["2", "Si un enfant me confie une violence…"], ["3", "Pour prévenir dans le quotidien…"]];
  var CONDUITE = [["protect", "Ce qui impose une protection immédiate"], ["fait", "Ce que nous faisons et qui s’en charge"], ["alert", "Qui nous alertons et pour quelle fonction"], ["note", "Ce que nous notons sans interpréter"]];
  var TRANSM = [["date", "Date et contexte"], ["mots", "Mots de l’enfant"], ["obs", "Observations"], ["risque", "Risque immédiat"], ["mesures", "Mesures prises"], ["inter", "Interlocuteur contacté"]];
  var PREV = [["change", "Le changement"], ["resp", "Qui s’en charge"], ["moment", "À quel moment"], ["indic", "Ce que l’on observera"]];
  var TAPIS = [["faits", "Les faits connus"], ["manque", "Ce qui manque"], ["reperes", "Les repères utiles"], ["reponse", "La première réponse"]];
  return { esc: esc, api: api, qr: qr, base: base, GROUPS: GROUPS, GCOL: GCOL, DQ: DQ, DOPT: DOPT, EXPECT: EXPECT, ZONES: ZONES, MUR: MUR, REGLE: REGLE, CONDUITE: CONDUITE, TRANSM: TRANSM, PREV: PREV, TAPIS: TAPIS };
})();
