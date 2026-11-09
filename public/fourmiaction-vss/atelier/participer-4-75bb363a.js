(function () {
  "use strict";
  var F = window.FA, X = FAX, esc = X.esc;
  var KEY = "fa-vss-participant";
  var qs = new URLSearchParams(location.search);
  var me = { p: null, g: 0, code: null, name: "" };
  try { me = Object.assign(me, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { }
  if (!me.p) me.p = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
  var urlCode = (qs.get("c") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (urlCode && urlCode !== me.code) { me.code = urlCode; me.g = 0; me.joined = false; }
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(me)); } catch (e) { } };
  save();
  var state = { v: 0, step: null, mine: {} }, draft = {}, sentFor = {}, err = "";
  var app = document.getElementById("app");

  /* ce que chaque étape demande au participant */
  var ACTS = {
    join: { mode: "person", t: "Bienvenue", kick: "Accueil" },
    cadre: { none: true, t: "Le cadre de la séance", kick: "Ouverture", msg: "Aucun récit personnel. On peut passer son tour. Les réponses sont affichées sans nom." },
    d0: { mode: "person", kick: "Mon point de départ", t: "D’accord ou pas d’accord ?" },
    d1: { mode: "person", kick: "Ce qui a bougé", t: "Et maintenant ?" },
    mur: { mode: "append", kick: "Le mur des certitudes", t: "Une idée, sans nom", again: true },
    sit: { mode: "group", kick: "Atelier des situations", t: "Notre tapis d’analyse" },
    rep: { mode: "group", kick: "Repères puis révision", t: "Nos repères" },
    tri: { mode: "person", kick: "Une révélation : S13", t: "Classer les dix actions" },
    conduite: { mode: "group", kick: "Situation S13", t: "Notre conduite à tenir" },
    transm: { mode: "group", kick: "Situation S13", t: "Notre transmission fictive" },
    prev: { mode: "group", kick: "Transformer le quotidien", t: "Une prévention qui se voit" },
    regle: { mode: "append", kick: "Une règle à emporter", t: "Je termine une phrase", again: true },
    express: { mode: "person", kick: "Défi express", t: "Ma réponse" },
    engage: { mode: "append", kick: "Clôture", t: "Je repars avec…", again: true },
  };
  var mineOf = function (act) { var l = (state.mine && state.mine[act]) || []; return l[l.length - 1]; };
  var groupEntry = function (act) { var l = (state.mine && state.mine[act]) || []; return l.filter(function (e) { return e.g === me.g; }).pop(); };

  /* ---------- écrans ---------- */
  function shell(inner, sendLabel, sendable) {
    var gtag = me.g ? '<span class="gtag" style="--gc:' + X.GCOL[me.g] + '">Groupe ' + me.g + "</span>" : "";
    app.innerHTML = '<div class="top"><div class="lg" role="img" aria-label="Fourmi’Action"></div><div class="who"><b>Atelier VSS</b>' + (me.code ? "Séance " + me.code + " " : "") + gtag + "</div></div>"
      + '<main class="wrap">' + (err ? '<div class="err" role="alert">' + esc(err) + "</div>" : "") + inner + "</main>"
      + (sendLabel ? '<div class="send"><div class="in"><button class="btn' + (sendable === "ok" ? " ok" : "") + '" data-act="send"' + (sendable === false ? " disabled" : "") + ">" + sendLabel + "</button></div></div>" : "");
  }
  function screenCode() {
    shell('<div class="card"><p class="kick">Rejoindre</p><h1>Entrez le code affiché à l’écran</h1><input type="text" class="code-in" id="code" maxlength="8" autocomplete="off" autocapitalize="characters" value="' + esc(me.code || "") + '" aria-label="Code de la séance"></div>', "Rejoindre");
  }
  function screenGroup() {
    shell('<div class="card"><p class="kick">Séance ' + esc(me.code) + '</p><h1>Votre groupe</h1><p class="muted">Le formateur vous indique votre numéro.</p><div class="groups">' + [1, 2, 3, 4].map(function (g) { return '<button class="gbtn" style="--gc:' + X.GCOL[g] + '" data-g="' + g + '" aria-pressed="' + (me.g === g) + '">Groupe ' + g + "</button>"; }).join("") + '</div><label class="f" for="name">Prénom ou initiales <span class="muted">(facultatif)</span></label><input type="text" id="name" maxlength="30" value="' + esc(me.name) + '"><p class="muted" style="margin-top:8px">Il n’est jamais affiché à l’écran. Seul le formateur le voit pour le défi express.</p></div>', "C’est parti", me.g ? true : false);
  }
  function waitScreen(msg) {
    shell('<div class="card wait"><div class="ant">' + F.HERO.replace("<svg", '<svg style="width:100%;filter:invert(.15) hue-rotate(180deg) saturate(.6)"') + "</div><h2>" + esc(msg || "Regardez l’écran") + '</h2><p class="muted">La prochaine question apparaîtra ici automatiquement.</p></div>');
  }

  function opt(k, val, label, on, cls) { return '<button class="opt ' + (cls || "") + '" data-set="' + k + '" data-val="' + esc(val) + '" aria-pressed="' + !!on + '">' + label + "</button>"; }
  function ta(k, label, rows, o) { return '<label class="f' + (o ? " o" : "") + '" for="f-' + k + '">' + esc(label) + '</label><textarea id="f-' + k + '" data-k="' + k + '" rows="' + (rows || 3) + '">' + esc(draft[k] || "") + "</textarea>"; }
  function sitCard(c) { return '<div class="sit"><div class="ill" aria-hidden="true">' + F.S[c].svg + '</div><div class="b"><div class="t"><span class="code">' + c + "</span>" + esc(F.S[c].t) + "</div><p>" + esc(F.S[c].x) + "</p></div></div>"; }

  function screenAct() {
    var step = state.step || "join", A = ACTS[step];
    if (!A) return waitScreen();
    if (A.none) return shell('<div class="card"><p class="kick">' + esc(A.kick) + "</p><h1>" + esc(A.t) + "</h1><p>" + esc(A.msg) + "</p></div>");
    if (step === "join") return waitScreen("Vous êtes connecté. La séance va commencer.");
    var prev = A.mode === "group" ? groupEntry(step) : mineOf(step);
    if (draft.__step !== step) { draft = Object.assign({ __step: step }, A.mode === "append" ? {} : ((prev && prev.v) || {})); }
    var sent = sentFor[step] || (A.mode !== "append" && prev);
    var h = '<div class="card"><p class="kick">' + esc(A.kick) + "</p><h1>" + esc(A.t) + "</h1>";
    if (step === "d0" || step === "d1") {
      h += X.DQ.map(function (q) { return '<div class="q"><p><b class="c">' + q[0] + "</b>" + esc(q[1]) + '</p><div class="seg3">' + X.DOPT.map(function (o) { return opt(q[0], o[0], o[1], draft[q[0]] === o[0]); }).join("") + "</div></div>"; }).join("");
    } else if (step === "mur") {
      h += '<div class="opts">' + X.MUR.map(function (c) { return opt("col", c[0], c[1], draft.col === c[0]); }).join("") + "</div>" + ta("txt", "Notre idée", 3);
    } else if (step === "sit") {
      var cs = X.GROUPS[me.g] || [];
      h += '<p class="muted">Lisez les trois situations, puis choisissez celle qui fait débat.</p>' + cs.map(sitCard).join("") + '<label class="f">La situation que nous analysons</label><div class="opts">' + cs.map(function (c) { return opt("s", c, '<span class="code">' + c + "</span>" + esc(F.S[c].t), draft.s === c); }).join("") + "</div>" + X.TAPIS.map(function (k, i) { return ta(k[0], k[1], 2, i > 1); }).join("");
    } else if (step === "rep") {
      var chosen = draft.reps || [];
      h += '<p class="muted">Trois repères au plus. Touchez un repère pour le lire.</p><div class="chips">' + Object.keys(F.R).map(function (r) { return opt("reps", r, '<span class="code">' + r + "</span>" + esc(F.R[r].t), chosen.indexOf(r) >= 0, "o"); }).join("") + "</div>"
        + (draft.__read ? '<div class="sit" style="margin-top:12px"><div class="b"><div class="t"><span class="code">' + draft.__read + "</span>" + esc(F.R[draft.__read].t) + "</div><p>" + esc(F.R[draft.__read].x) + "</p></div></div>" : "") + ta("corr", "Notre correction en une phrase", 3, true);
    } else if (step === "tri") {
      h += '<div class="sit"><div class="b"><div class="t"><span class="code">S13</span>' + esc(F.S.S13.t) + "</div><p>" + esc(F.S.S13.x) + "</p></div></div>"
        + Object.keys(F.A).map(function (a) { return '<div class="q"><p><b class="c">' + a + "</b>" + esc(F.A[a].t) + '</p><div class="seg3">' + X.ZONES.map(function (z) { return opt(a, z[0], z[1], draft[a] === z[0], z[0]); }).join("") + "</div></div>"; }).join("");
    } else if (step === "conduite") {
      h += X.CONDUITE.map(function (k, i) { return ta(k[0], k[1], 3, i % 2 === 0); }).join("");
    } else if (step === "transm") {
      h += X.TRANSM.map(function (k) { return ta(k[0], k[1], 2) + '<button class="nc" data-nc="' + k[0] + '">Écrire « non connu »</button>'; }).join("");
    } else if (step === "prev") {
      h += '<label class="f">Notre situation</label><div class="opts">' + ["S01", "S14", "S15", "S17"].map(function (c) { return opt("sit", c, '<span class="code">' + c + "</span>" + esc(F.S[c].t), draft.sit === c); }).join("") + "</div>" + X.PREV.map(function (k, i) { return ta(k[0], k[1], 2, i % 2); }).join("");
    } else if (step === "regle") {
      h += '<div class="opts">' + X.REGLE.map(function (c) { return opt("k", c[0], c[1], draft.k === c[0]); }).join("") + "</div>" + ta("txt", "Ma fin de phrase", 3);
    } else if (step === "express") {
      h += '<p style="font-size:17px">' + esc(F.E4) + "</p>" + ta("txt", "Ma réponse", 7) + '<p class="muted">Pensez à : protéger, alerter, écouter, noter.</p>';
    } else if (step === "engage") {
      h += ta("txt", "La mesure de prévention que je retiens", 3);
    }
    h += "</div>";
    if (sent) h = '<div class="sent"><i>✓</i>' + (A.mode === "append" ? "Envoyé. Vous pouvez en envoyer une autre." : A.mode === "group" ? "Envoyé pour le groupe. Chacun peut encore modifier." : "Envoyé. Vous pouvez modifier.") + "</div><div style=\"height:12px\"></div>" + h;
    shell(h, A.mode === "append" ? "Envoyer" : sent ? "Mettre à jour" : "Envoyer", sent && A.mode !== "append" ? "ok" : true);
  }

  function render() {
    if (!me.code) return screenCode();
    if (!me.g || !me.joined) return screenGroup();
    screenAct();
  }

  /* ---------- échanges ---------- */
  function poll(force) {
    if (!me.code || !me.g || !me.joined) return;
    X.api({ a: "state", c: me.code, p: me.p, g: me.g, v: force ? 0 : state.v }, true).then(function (r) {
      if (!r.ok) { if (/introuvable/.test(r.error || "")) { err = "Cette séance est terminée ou le code est incorrect."; me.code = null; me.joined = false; save(); render(); } return; }
      if (r.same) return;
      var changed = r.step !== state.step;
      state = r; if (changed) { err = ""; draft = {}; }
      var active = document.activeElement && /TEXTAREA|INPUT/.test(document.activeElement.tagName);
      if (changed || !active) render();
    });
  }
  setInterval(poll, 2500);

  function send() {
    var step = state.step, A = ACTS[step]; if (!A || A.none) return;
    var val = {}; Object.keys(draft).forEach(function (k) { if (k.indexOf("__") !== 0) val[k] = draft[k]; });
    if (A.mode === "append" && !(val.txt || "").trim()) { err = "Écrivez quelque chose avant d’envoyer."; return render(); }
    if ((step === "mur" && !val.col) || (step === "regle" && !val.k)) { err = "Choisissez d’abord une colonne."; return render(); }
    if (step === "express") val.txt = (val.txt || "").trim();
    var b = document.querySelector('[data-act="send"]'); if (b) { b.disabled = true; b.textContent = "Envoi…"; }
    X.api({ a: "submit", c: me.code, p: me.p, g: me.g, act: step, mode: A.mode, val: val, name: step === "express" ? me.name : "" }).then(function (r) {
      if (!r.ok) { err = r.error || "L’envoi n’a pas abouti. Réessayez."; return render(); }
      err = ""; sentFor[step] = true; if (A.mode === "append") { draft = { __step: step, col: draft.col, k: draft.k }; }
      if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) { }
      state.v = 0; poll(true); render();
    });
  }

  document.addEventListener("input", function (e) { var k = e.target.dataset && e.target.dataset.k; if (k) draft[k] = e.target.value; });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.g) { var nm = document.getElementById("name"); if (nm) me.name = nm.value; me.g = +b.dataset.g; save(); return render(); }
    if (b.dataset.nc) { draft[b.dataset.nc] = "Non connu"; return render(); }
    if (b.dataset.set) {
      var k = b.dataset.set, v = b.dataset.val;
      if (k === "reps") { var l = (draft.reps || []).slice(), i = l.indexOf(v); draft.__read = v; if (i >= 0) l.splice(i, 1); else if (l.length < 3) l.push(v); else { err = "Trois repères au plus."; } draft.reps = l; }
      else draft[k] = v;
      var y = scrollY; render(); scrollTo(0, y); err = ""; return;
    }
    if (b.dataset.act === "send") {
      if (!me.code) { var c = (document.getElementById("code").value || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); if (c.length < 4) { err = "Le code comporte cinq caractères."; return render(); } me.code = c; err = ""; save(); return X.api({ a: "state", c: c }, true).then(function (r) { if (!r.ok) { err = "Code inconnu. Vérifiez l’écran."; me.code = null; } save(); render(); }); }
      if (!me.joined) {
        if (!me.g) { err = "Choisissez votre groupe."; return render(); }
        me.name = (document.getElementById("name").value || "").trim(); me.joined = true; err = ""; save();
        return X.api({ a: "submit", c: me.code, p: me.p, g: me.g, act: "join", mode: "person", val: { ok: 1 } }).then(function (r) { if (!r.ok) { err = r.error; return render(); } state.step = "join"; poll(true); render(); });
      }
      return send();
    }
  });
  render();
  if (me.code && me.g && me.joined) { X.api({ a: "submit", c: me.code, p: me.p, g: me.g, act: "join", mode: "person", val: { ok: 1 } }); poll(true); }
})();
