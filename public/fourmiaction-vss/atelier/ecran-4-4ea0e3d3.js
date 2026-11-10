(function () {
  "use strict";
  var F = window.FA, X = FAX, esc = X.esc, PREVIEW = window.FA_PREVIEW;
  var KEY = "fa-vss-direct";
  var st = { i: 0, code: null, key: null, offline: false, timers: {}, ui: {}, ng: 4 };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || "null"); if (sv) st = Object.assign(st, sv); } catch (e) { }
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  var live = { v: 0, entries: {} };
  var seen = {};
  var ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3"/></svg>',
  };
  var partURL = function () { return X.base + "participer.html" + (st.code ? "?c=" + st.code : ""); };
  var E = function (act) { var x = live.entries && live.entries[act]; return Array.isArray(x) ? x : x && typeof x === "object" ? Object.keys(x).map(function (k) { return x[k]; }) : []; };
  var byGroup = function (act) { var o = {}; E(act).forEach(function (e) { o[e.g] = e; }); return o; };
  var NG = function () { return X.clampG(st.ng); };
  var joined = function () { var p = {}, g = {}; E("join").forEach(function (e) { if (!p[e.p]) { p[e.p] = 1; g[e.g] = (g[e.g] || 0) + 1; } }); return { n: Object.keys(p).length, g: g }; };
  var isNew = function (id) { if (seen[id]) return ""; seen[id] = 1; return " new"; };
  var waiting = function (t) { return st.code ? '<div class="waiting"><div>' + (t || "Les réponses apparaissent ici dès qu’elles arrivent.") + '<br><span class="dotl"><i></i><i></i><i></i></span></div></div>' : '<div class="waiting"><div><span class="offline">Séance sans participants connectés : l’échange se fait à l’oral.</span></div></div>'; };
  var tog = function (k) { return !!st.ui[k]; };
  var cbtn = function (k, label) { return '<button class="cbtn' + (tog(k) ? " on" : "") + '" data-tog="' + k + '">' + label + "</button>"; };
  var pct = function (n, t) { return t ? (100 * n / t) : 0; };
  var bar = function (counts, keys, cls) {
    var t = keys.reduce(function (a, k) { return a + (counts[k[0]] || 0); }, 0);
    return '<div class="bar ' + (cls || "") + '">' + keys.map(function (k) { var n = counts[k[0]] || 0; return '<span class="' + k[1] + '" style="flex-grow:' + (t ? n : 0) + '">' + (n ? (cls === "before" ? "" : Math.round(pct(n, t)) + " %") : "") + "</span>"; }).join("") + (t ? "" : '<span style="flex-grow:1;color:#A8B4C0">—</span>') + "</div>";
  };

  /* ---------- les écrans ---------- */
  var VOTE = function (act, before) {
    var list = E(act), prev = before ? E(before) : null;
    var count = function (l, d) { var c = {}; l.forEach(function (e) { var v = e.v && e.v[d]; if (v) c[v] = (c[v] || 0) + 1; }); return c; };
    return '<div class="votes">' + X.DQ.map(function (q) {
      return '<div class="vrow anim"><span class="c">' + q[0] + '</span><span class="s">' + esc(q[1]) + "</span><div>" + (prev ? bar(count(prev, q[0]), [["a", "a"], ["d", "d"], ["n", "n"]], "before") : "") + bar(count(list, q[0]), [["a", "a"], ["d", "d"], ["n", "n"]]) + "</div></div>";
    }).join("") + '</div><div class="legend">' + (prev ? '<span><i style="background:#C7D3DE"></i>Au départ (barre fine)</span>' : "") + '<span><i style="background:var(--blue)"></i>D’accord</span><span><i style="background:var(--orange)"></i>Pas d’accord</span><span><i style="background:#9AA9B7"></i>Je ne sais pas</span><span style="margin-left:auto"><b style="color:var(--blue)">' + list.length + "</b> réponse" + (list.length > 1 ? "s" : "") + "</span></div>";
  };
  var WALL = function (act, cols, key) {
    var list = E(act);
    return '<div class="wall">' + cols.map(function (c) {
      var items = list.filter(function (e) { return e.v && e.v[key] === c[0]; });
      return '<div class="col"><h3>' + esc(c[1]) + '</h3><div class="notes">' + items.map(function (e) { return '<div class="pn' + isNew(e.id) + '">' + esc(e.v.txt) + (st.key ? '<button class="x" title="Masquer" aria-label="Masquer cette contribution" data-hide="' + act + ":" + e.id + '">×</button>' : "") + "</div>"; }).join("") + "</div></div>";
    }).join("") + "</div>" + (list.length ? "" : waiting());
  };
  var TILES = function (act, inner) {
    var g = byGroup(act);
    return '<div class="gtiles n' + NG() + '">' + X.range(NG()).map(function (n) {
      var e = g[n];
      return '<div class="gt' + (e ? isNew(e.id + e.t) : "") + '" style="--gc:' + X.GCOL[n] + '"><h3>Groupe ' + n + (e ? '<small>reçu</small>' : "") + "</h3>" + inner(n, e) + "</div>";
    }).join("") + "</div>";
  };
  var field = function (l, v, o) { return v ? '<div class="lab">' + esc(l) + '</div><div class="val' + (o ? " o" : "") + '">' + esc(v) + "</div>" : ""; };

  var SLIDES = [
    { id: "accueil", act: "join", home: true },
    { id: "cadre", kick: "Ouverture · 0 à 5 min", min: 5, t: "Le cadre de la séance",
      cons: "",
      live: function () {
        return '<div class="rules"><div class="rule anim"><i>1</i><b>Aucun récit personnel</b>Toutes les situations sont fictives. Personne ne joue la victime.</div><div class="rule anim"><i>2</i><b>Libre de passer</b>On peut passer son tour, répondre par écrit ou sortir un moment.</div><div class="rule o anim"><i>!</i><b>La protection d’abord</b>Une confidence réelle est accueillie à part, avec les relais nécessaires.</div></div>'
          + '<div class="defi anim"><b>Le défi de fin de séance :</b> face à une révélation, savoir protéger, alerter, accueillir la parole et garder une trace.</div>';
      },
      notes: "Présenter les compétences C1 à C4 en une phrase. Annoncer que les réponses envoyées depuis les téléphones sont anonymes à l’écran." },
    { id: "d0", act: "d0", kick: "Activité 1 · 5 à 13 min", min: 3, t: "Mon point de départ",
      cons: "Sur votre téléphone : <b>d’accord, pas d’accord ou je ne sais pas</b> ? Seul, sans en parler.",
      live: function () { return VOTE("d0"); },
      notes: "Ne pas commenter les résultats maintenant : ils seront comparés en fin de séance. Écouter les mots qui reviennent : intention, répétition, âge, consentement, preuve, alerte." },
    { id: "mur", act: "mur", kick: "Activité 1 · 5 à 13 min", min: 5, t: "Le mur des certitudes",
      cons: "À deux, comparez vos réponses, puis <b>déposez une idée</b> dans l’une des trois colonnes. Sans nom.",
      live: function () { return WALL("mur", X.MUR, "col"); },
      notes: "Reformuler une idée ambiguë sans faire cours. Annoncer la cible : chacun choisit pour lui la compétence qu’il veut consolider. Survoler une contribution permet de la masquer si besoin." },
    { id: "sit", act: "sit", kick: "Activité 2 · 13 à 25 min", min: 12, t: "Atelier des situations",
      cons: "Chaque groupe lit <b>ses situations</b> sur téléphone, en choisit une et remplit le tapis d’analyse.",
      live: function () {
        return TILES("sit", function (n, e) {
          var v = (e && e.v) || {};
          return '<div class="mini">' + (X.groupsFor(NG())[n] || []).map(function (c) { return '<span class="' + (v.s === c ? "on" : "") + '">' + c + "</span>"; }).join("") + "</div>"
            + (e ? '<div class="lab">' + esc(v.s ? F.S[v.s].t : "") + "</div>" + field("Faits connus", v.faits) + field("Première réponse", v.reponse, 1) : '<div class="empty">En cours…</div>');
        });
      },
      notes: "Environ quatre minutes par carte. Rappeler : une incertitude n’empêche pas de protéger ; la qualification reste une hypothèse. Corrigés : voir le guide, partie Corrigés." },
    { id: "rep", act: "rep", kick: "Activité 2 · 25 à 37 min", min: 12, t: "Repères puis révision",
      cons: "Chaque groupe choisit <b>trois repères au plus</b> pour sa situation, puis corrige son hypothèse en une phrase.",
      ctrl: function () { return cbtn("dist", "Distinctions décisives"); },
      live: function () {
        if (tog("dist")) return '<div class="overlay"><h2>Les distinctions décisives</h2><div class="og"><div><b>Agissement sexiste et discrimination</b>' + esc(F.R.R01.t) + " · " + esc(F.R.R02.t) + '</div><div><b>Répétition et pression grave</b>' + esc(F.R.R03.x.slice(0, 210)) + '…</div><div><b>Agression et viol</b>' + esc(F.R.R04.t) + " · " + esc(F.R.R05.t) + '</div><div><b>Inquiétude et preuve</b>' + esc(F.R.R10.x.slice(0, 210)) + "…</div></div></div>";
        return TILES("rep", function (n, e) {
          var v = (e && e.v) || {}, s = (byGroup("sit")[n] || {}).v || {};
          return (s.s ? '<div class="lab">' + s.s + " · " + esc(F.S[s.s].t) + "</div>" : "") + (e ? '<div>' + (v.reps || []).map(function (r) { return '<span class="chip">' + r + "</span>"; }).join("") + "</div>" + field("Notre correction", v.corr, 1) : '<div class="empty">En cours…</div>');
        });
      },
      notes: "5 minutes de recherche, puis chaque groupe lit sa correction en une phrase (une minute chacun), puis 3 minutes : afficher les distinctions décisives. R09 et parfois R02 restent sur la table : c’est voulu." },
    { id: "tri", act: "tri", kick: "Activité 3 · 37 à 52 min", min: 3, t: "Une révélation : S13",
      cons: "Chacun classe les dix actions sur son téléphone : <b>à engager, à écarter ou dans la durée</b>.",
      ctrl: function () { return cbtn("exp", "Classement attendu"); },
      live: function () {
        var list = E("tri");
        var rows = Object.keys(F.A).map(function (a) {
          var c = {}; list.forEach(function (e) { var v = e.v && e.v[a]; if (v) c[v] = (c[v] || 0) + 1; });
          return '<div class="tr ' + (tog("exp") ? "exp-" + X.EXPECT[a] : "") + '"><div class="t"><span class="code">' + a + "</span>" + esc(F.A[a].t) + "</div>" + bar(c, [["e", "e"], ["x", "x"], ["d", "dd"]]) + "</div>";
        }).join("");
        return '<div class="trig"><div class="s13 anim"><div class="ill">' + F.S.S13.svg + '</div><p>' + esc(F.S.S13.x) + '</p></div><div><div class="trows">' + rows + '</div><div class="legend"><span><i style="background:var(--green)"></i>À engager</span><span><i style="background:#B3261E"></i>À écarter</span><span><i style="background:var(--blue)"></i>Dans la durée</span><span style="margin-left:auto"><b style="color:var(--blue)">' + list.length + "</b> réponses</span></div></div></div>";
      },
      notes: "Attendu : à engager A01 à A04 ; à écarter A05, A06, A07, A09, A10 ; dans la durée A08. <b>A09</b> : l’adulte désigné vit au domicile, prévenir la famille peut exposer l’enfant. <b>A10</b> : seules les personnes qui doivent agir reçoivent les informations." },
    { id: "conduite", act: "conduite", kick: "Activité 3 · 37 à 52 min", min: 9, t: "Notre conduite à tenir",
      cons: "Chaque groupe construit sa réponse : <b>une action, un prénom</b>. Les actions urgentes n’attendent pas la rédaction.",
      ctrl: function () { return cbtn("q", "Question de confrontation"); },
      live: function () {
        var qs = ["Et si le directeur minimise ?", "Et si le parent désigné arrive ?", "Et si la personne refuse que l’on parle ?"];
        var t = TILES("conduite", function (n, e) { var v = (e && e.v) || {}; return e ? X.CONDUITE.map(function (k, i) { return field(k[1], v[k[0]], i % 2); }).join("") : '<div class="empty">En cours…</div>'; });
        return t + (tog("q") ? '<div class="banner">' + qs[(st.ui.qi || 0) % 3] + "<small>Un autre groupe cherche l’angle mort. Cliquer à nouveau pour la question suivante.</small></div>" : "");
      },
      notes: "Points à faire apparaître : qui protège maintenant, qui appelle et qui (ici le 17 ou le 112, l’exposition est imminente), qui note les mots, comment éviter le départ. La décision ne dépend pas de l’autorisation d’une personne mise en cause." },
    { id: "transm", act: "transm", kick: "Activité 3 · 37 à 52 min", min: 3, t: "Une transmission fictive",
      cons: "Chaque groupe rédige une courte transmission. <b>Écrire « non connu »</b> plutôt qu’inventer.",
      live: function () { return TILES("transm", function (n, e) { var v = (e && e.v) || {}; return e ? X.TRANSM.map(function (k, i) { return field(k[1], v[k[0]], i === 1); }).join("") : '<div class="empty">En cours…</div>'; }); },
      notes: "Vérifier : les mots exacts entre guillemets, aucune interprétation, l’interlocuteur contacté. Les actions urgentes ont déjà eu lieu." },
    { id: "prev", act: "prev", kick: "Activité 4 · 52 à 62 min", min: 10, t: "Une prévention qui se voit",
      cons: "Chaque groupe choisit S01, S14, S15 ou S17 et propose <b>une mesure concrète</b> : quoi, qui, quand, comment on vérifie.",
      live: function () {
        return TILES("prev", function (n, e) {
          var v = (e && e.v) || {};
          return '<div class="lights">' + X.PREV.map(function (k) { return "<i class=\"" + (v[k[0]] ? "on" : "") + '"></i>'; }).join("") + "</div>" + (e ? (v.sit ? '<div class="lab">' + v.sit + " · " + esc(F.S[v.sit].t) + "</div>" : "") + X.PREV.map(function (k, i) { return field(k[1], v[k[0]], i === 3); }).join("") : '<div class="empty">En cours…</div>');
        });
      },
      notes: "Les quatre barres s’allument quand le changement, le responsable, le moment et l’indicateur sont renseignés. Faire vérifier par le groupe voisin : accessible, sans contact forcé, sans stigmatiser, applicable au prochain accueil." },
    { id: "d1", act: "d1", kick: "Activité 5 · 62 à 69 min", min: 2, t: "Ce qui a bougé",
      cons: "Les mêmes affirmations qu’au départ. <b>Répondez à nouveau</b> : la barre fine montre les réponses du début.",
      live: function () { return VOTE("d1", "d0"); },
      notes: "Commenter les écarts, surtout D1 et D3. Une bonne réponse non justifiée reste à approfondir. Reformuler deux idées du mur de façon plus précise." },
    { id: "regle", act: "regle", kick: "Activité 5 · 62 à 69 min", min: 5, t: "Une règle à emporter",
      cons: "Chacun termine <b>au moins une phrase</b>. La trace écrite complète est à lire après la séance.",
      live: function () { return WALL("regle", X.REGLE, "k"); },
      notes: "Relier chaque phrase à une trace : les violences (atelier), le consentement, agir (S13). Corriger tout de suite une promesse de secret, une attente de preuve ou une confusion entre transmission interne et signalement externe." },
    { id: "express", act: "express", kick: "Évaluation · 69 à 75 min", min: 6, t: "Défi express",
      cons: "Seul, sur votre téléphone. Quatre minutes.",
      ctrl: function () { return cbtn("corr", "Correction") + (st.key ? cbtn("resp", "Réponses (formateur)") : ""); },
      live: function () {
        var list = E("express");
        if (tog("resp")) return '<div class="overlay"><h2>Réponses reçues · ' + list.length + '</h2><div class="resp">' + (list.map(function (e) { return "<div><b>" + esc(e.n || "Sans prénom") + " · groupe " + e.g + "</b>" + esc(e.v && e.v.txt) + "</div>"; }).join("") || '<p class="count">Aucune réponse pour le moment.</p>') + "</div></div>";
        if (tog("corr")) return '<div class="overlay"><h2>Ce qui est attendu · 4 points</h2><div class="crit"><div class="k"><i>1</i>Protéger : éviter une nouvelle exposition et apprécier l’urgence.</div><div class="k"><i>2</i>Alerter un responsable sûr et les autorités adaptées, sans attendre.</div><div><i>3</i>Écouter sans question suggestive et sans promettre le secret.</div><div><i>4</i>Noter les mots et les faits, sans mener d’enquête.</div></div><p class="count" style="margin-top:16px">Les points 1 et 2 sont indispensables. Enquête, confrontation, secret absolu ou diffusion d’images empêchent d’atteindre le défi.</p></div>';
        return '<div class="trig" style="grid-template-columns:1fr 360px"><div class="e4 anim"><span class="code">E4</span>' + esc(F.E4) + '</div><div class="bigcount"><b>' + list.length + "</b><span>réponse" + (list.length > 1 ? "s" : "") + " reçue" + (list.length > 1 ? "s" : "") + "</span></div></div>";
      },
      notes: "Les réponses ne sont pas projetées : le bouton « Réponses » les affiche, à utiliser hors projection ou après la séance. Le défi complet E1 à E5 (20 minutes) se passe en différé, avec le cahier atelier." },
    { id: "fin", act: "engage", kick: "Clôture", min: 0, t: "Je repars avec…",
      cons: "Sur votre téléphone : <b>la mesure de prévention que je retiens</b> pour mon prochain accueil.",
      ctrl: function () { return '<button class="cbtn" data-act="summary">Synthèse à imprimer</button>' + (st.code ? '<button class="cbtn" data-act="end">Terminer la séance</button>' : ""); },
      live: function () {
        var list = E("engage");
        return '<div class="fin"><div class="col"><h3>Nos engagements</h3><div class="notes">' + list.map(function (e) { return '<div class="pn' + isNew(e.id) + '">' + esc(e.v && e.v.txt) + "</div>"; }).join("") + '</div></div><div class="box"><h3>Après la séance</h3><ul><li>Lire en entier les trois pages « Ma trace écrite » du cahier atelier.</li><li>Le défi complet E1 à E5, en début de séance suivante.</li><li>Garder l’affiche des numéros utiles : <b>17 · 112 · 119 · 3018 · 3919</b>.</li></ul></div></div>';
      },
      notes: "« Terminer la séance » efface toutes les réponses du serveur. Imprimer la synthèse avant si vous voulez la garder." },
  ];

  /* ---------- coquille ---------- */
  var app = document.getElementById("app");
  app.innerHTML = '<div class="viewport"><div class="stage" id="stage"></div></div>';
  var stage = document.getElementById("stage");
  function fit() { var s = Math.min(innerWidth / 1600, innerHeight / 900); stage.style.transform = "translate(-50%,-50%) scale(" + s + ")"; }
  addEventListener("resize", fit); fit();

  function render(enter) {
    var s = SLIDES[st.i];
    if (s.home) return renderHome();
    var j = joined();
    var top = '<div class="sbar"><div class="lg" role="img" aria-label="Fourmi’Action"></div><span class="kick">' + esc(s.kick) + '</span><span class="sp"></span>'
      + (st.code ? '<div class="join-chip"><span class="q">' + X.qr(partURL(), "#054F85") + "</span><span>Code <b>" + st.code + '</b><br><span class="n">' + j.n + " connecté" + (j.n > 1 ? "s" : "") + "</span></span></div>" : "")
      + (s.min ? '<div class="timer" id="timer"><span class="t" id="tt"></span><button class="ib" data-act="tplay" aria-label="Démarrer ou mettre en pause">' + ICON.play + '</button><button class="ib" data-act="treset" aria-label="Remettre à zéro">' + ICON.reset + "</button></div>" : "")
      + '<button class="ib" data-act="notes" aria-label="Notes du formateur (touche N)">' + ICON.notes + '</button><button class="ib" data-act="full" aria-label="Plein écran (touche F)">' + ICON.full + "</button></div>";
    var body = '<section class="slide' + (enter ? " in" : "") + '"><h1 class="anim">' + esc(s.t) + "</h1>" + (s.cons ? '<p class="cons anim">' + s.cons + "</p>" : "") + (s.ctrl ? '<div class="ctrl">' + s.ctrl() + "</div>" : "") + '<div class="live" id="live">' + s.live() + "</div></section>";
    var foot = '<div class="sfoot"><button class="nav prev" data-act="prev">←</button><div class="dots">' + SLIDES.map(function (x, k) { return '<button aria-label="Écran ' + (k + 1) + '" data-go="' + k + '" class="' + (k === st.i ? "cur" : k < st.i ? "done" : "") + '"></button>'; }).join("") + '</div><button class="nav" data-act="next"' + (st.i === SLIDES.length - 1 ? " hidden" : "") + ">Suivant →</button></div>";
    var notes = st.ui.notes && s.notes ? '<div class="notesp"><div class="h">Notes du formateur · touche N</div>' + s.notes + "</div>" : "";
    stage.innerHTML = top + body + foot + notes;
    updTimer();
  }
  function refreshLive() { var s = SLIDES[st.i]; if (s.home) return renderHome(); var l = document.getElementById("live"); if (l) l.innerHTML = s.live(); var j = joined(), n = stage.querySelector(".join-chip .n"); if (n) n.textContent = j.n + " connecté" + (j.n > 1 ? "s" : ""); }

  function ngPicker() {
    return '<div class="ngpick"><span>Nombre de groupes</span><button class="ngb" data-act="ng-" aria-label="Un groupe de moins"' + (NG() <= X.MING ? " disabled" : "") + '>−</button><b aria-live="polite">' + NG() + '</b><button class="ngb" data-act="ng+" aria-label="Un groupe de plus"' + (NG() >= X.MAXG ? " disabled" : "") + ">+</button></div>";
  }
  function pushGroups() { if (st.code && st.key) X.api({ a: "control", c: st.code, key: st.key, groups: NG() }); }
  function renderHome(err) {
    var j = joined();
    var right;
    if (st.code) {
      right = '<div class="qrbox">' + X.qr(partURL(), "#04355A") + '</div><div class="url">Flashez le code, ou allez sur<br>' + esc(X.base.replace(/^https?:\/\//, "")) + "participer.html<b>" + st.code + '</b></div><div class="gcount">' + X.range(NG()).map(function (g) { return "<div><b>" + (j.g[g] || 0) + "</b>Groupe " + g + "</div>"; }).join("") + '</div>' + ngPicker() + '<button class="big o" data-act="next" style="width:430px">Commencer la séance →</button>';
    } else {
      right = '<div class="startbox">' + (err ? '<div class="err">' + esc(err) + "</div>" : "") + ngPicker() + (PREVIEW ? '<p class="note">Aperçu : la séance en direct fonctionne une fois les fichiers installés sur votre site (voir le mode d’emploi).</p>' : '<button class="big o" data-act="create">Lancer une séance en direct</button><p class="note">Les participants rejoignent avec leur téléphone, sans compte ni application. Leurs réponses s’affichent ici, sans nom. 24 participants conseillés, 30 au maximum.</p>') + '<button class="big ghost" data-act="offline">Présenter sans participants connectés</button></div>';
    }
    stage.innerHTML = '<div class="home"><div class="l"><div class="lg2" role="img" aria-label="Fourmi’Action"></div><p class="k">Atelier · 1 h 15</p><h1>Prévenir les violences sexistes et sexuelles<span>et agir en accueil collectif de mineurs</span></h1><div class="ill">' + F.HERO + '</div><p class="lic">Outil gratuit · © Fourmi’Action 2026 · à citer comme un outil Fourmi’Action</p></div><div class="r">' + right + "</div></div>";
  }

  /* ---------- minuteur ---------- */
  function tst() { var s = SLIDES[st.i]; var t = st.timers[s.id]; if (!t) t = st.timers[s.id] = { left: s.min * 60, run: false, at: 0 }; return t; }
  function tleft(t) { return t.run ? t.left - (Date.now() - t.at) / 1000 : t.left; }
  function updTimer() {
    var el = document.getElementById("timer"); if (!el) return;
    var t = tst(), l = tleft(t), a = Math.abs(Math.round(l));
    document.getElementById("tt").textContent = (l < 0 ? "+" : "") + String(Math.floor(a / 60)).padStart(2, "0") + ":" + String(a % 60).padStart(2, "0");
    el.classList.toggle("run", t.run); el.classList.toggle("over", t.run && l < 0);
    el.querySelector('[data-act="tplay"]').innerHTML = t.run ? ICON.pause : ICON.play;
  }
  setInterval(updTimer, 500);

  /* ---------- synchronisation ---------- */
  function pushStep() { if (st.code && st.key) X.api({ a: "control", c: st.code, key: st.key, step: SLIDES[st.i].act || SLIDES[st.i].id }); }
  var DEPS = { rep: ["sit"], d1: ["d0"], accueil: [], cadre: [] };
  function needActs() { var s = SLIDES[st.i]; if (s.id === "fin") return ""; var a = ["join"]; if (s.act && s.act !== "join") a.push(s.act); (DEPS[s.act] || []).forEach(function (x) { a.push(x); }); return a.join(","); }
  var polling = false;
  function poll() {
    if (!st.code || polling) return; polling = true;
    X.api({ a: "state", c: st.code, key: st.key, v: live.v, acts: needActs() }, true).then(function (r) {
      polling = false;
      if (!r.ok) { if (/introuvable/.test(r.error || "")) { st.code = st.key = null; save(); render(); } return; }
      if (r.same) return;
      live = r; refreshLive();
    });
  }
  setInterval(poll, 2000);

  function go(i) { i = Math.max(0, Math.min(SLIDES.length - 1, i)); if (i === st.i) return; st.i = i; st.ui.dist = st.ui.exp = st.ui.q = st.ui.corr = st.ui.resp = false; save(); pushStep(); live.v = 0; render(true); poll(); }

  function summary() {
    var w = window.open("", "_blank"); if (!w) return;
    var sec = function (t, html) { return "<h2>" + t + "</h2>" + html; };
    var li = function (l) { return "<ul>" + l.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"; };
    var g = function (act, keys) { var b = byGroup(act); return X.range(NG()).map(function (n) { var v = (b[n] || {}).v; return v ? "<h3>Groupe " + n + "</h3>" + li(keys.map(function (k) { return k[1] + " : " + (Array.isArray(v[k[0]]) ? v[k[0]].join(", ") : (v[k[0]] || "—")); })) : ""; }).join(""); };
    var html = "<!DOCTYPE html><meta charset=utf-8><title>Synthèse de la séance</title><style>body{font:14px/1.5 system-ui,sans-serif;max-width:800px;margin:30px auto;color:#1E2A36}h1{color:#054F85}h2{color:#054F85;border-bottom:2px solid #D35A0B;padding-bottom:4px;margin-top:28px}h3{margin:14px 0 4px}</style><h1>Prévenir les VSS et agir en ACM · synthèse de la séance</h1><p>" + new Date().toLocaleDateString("fr-FR") + "</p>"
      + sec("Le mur des certitudes", X.MUR.map(function (c) { return "<h3>" + c[1] + "</h3>" + li(E("mur").filter(function (e) { return e.v.col === c[0]; }).map(function (e) { return e.v.txt; })); }).join(""))
      + sec("Atelier des situations", g("sit", [["s", "Situation"]].concat(X.TAPIS)))
      + sec("Repères et corrections", g("rep", [["reps", "Repères"], ["corr", "Correction"]]))
      + sec("Conduite à tenir · S13", g("conduite", X.CONDUITE))
      + sec("Transmission fictive", g("transm", X.TRANSM))
      + sec("Prévention", g("prev", [["sit", "Situation"]].concat(X.PREV)))
      + sec("Règles à emporter", X.REGLE.map(function (c) { return "<h3>" + c[1] + "</h3>" + li(E("regle").filter(function (e) { return e.v.k === c[0]; }).map(function (e) { return e.v.txt; })); }).join(""))
      + sec("Engagements", li(E("engage").map(function (e) { return e.v.txt; })));
    w.document.write(html); w.document.close();
  }

  /* ---------- évènements ---------- */
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-act],[data-go],[data-tog],[data-hide]"); if (!b) return;
    if (b.dataset.go != null) return go(+b.dataset.go);
    if (b.dataset.tog) { var k = b.dataset.tog; if (k === "q" && st.ui.q) { st.ui.qi = (st.ui.qi || 0) + 1; } else { st.ui[k] = !st.ui[k]; if (k === "corr" && st.ui.corr) st.ui.resp = false; if (k === "resp" && st.ui.resp) st.ui.corr = false; } save(); return render(); }
    if (b.dataset.hide) { var p = b.dataset.hide.split(":"); X.api({ a: "control", c: st.code, key: st.key, act: p[0], hide: p[1] }).then(function () { live.v = 0; poll(); }); return; }
    switch (b.dataset.act) {
      case "next": return go(st.i + 1);
      case "ng-": case "ng+": st.ng = X.clampG(NG() + (b.dataset.act === "ng+" ? 1 : -1)); save(); pushGroups(); return renderHome();
      case "prev": return go(st.i - 1);
      case "notes": st.ui.notes = !st.ui.notes; save(); return render();
      case "full": try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) { } return;
      case "tplay": { var t = tst(); if (t.run) { t.left = tleft(t); t.run = false; } else { t.at = Date.now(); t.run = true; } save(); return updTimer(); }
      case "treset": st.timers[SLIDES[st.i].id] = null; save(); return updTimer();
      case "offline": st.code = st.key = null; st.offline = true; save(); return go(1);
      case "create":
        b.disabled = true; b.textContent = "Création…";
        return X.api({ a: "create" }).then(function (r) {
          if (!r.ok) return renderHome(r.error || "Impossible de créer la séance.");
          st.code = r.code; st.key = r.key; st.offline = false; seen = {}; live = { v: 0, entries: {} }; save(); pushStep(); pushGroups(); renderHome(); poll();
        });
      case "summary": return summary();
      case "end":
        if (!b.dataset.arm) { b.dataset.arm = 1; b.textContent = "Confirmer : tout effacer"; return; }
        return X.api({ a: "end", c: st.code, key: st.key }).then(function () { st.code = st.key = null; st.i = 0; st.timers = {}; live = { v: 0, entries: {} }; save(); render(); });
    }
  });
  document.addEventListener("keydown", function (e) {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(st.i + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(st.i - 1); }
    else if (e.key === "n" || e.key === "N") { st.ui.notes = !st.ui.notes; save(); render(); }
    else if (e.key === "f" || e.key === "F") { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (er) { } }
  });

  render(true);
  if (st.code) { pushStep(); pushGroups(); poll(); }
})();
