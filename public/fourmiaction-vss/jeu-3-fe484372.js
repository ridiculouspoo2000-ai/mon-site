/* Les Hautes Herbes — moteur du jeu */
(function () {
  "use strict";
  const A = window.ASSETS;
  if (A.claydefs) document.body.insertAdjacentHTML("afterbegin", A.claydefs);   // matières des personnages (une fois pour toute la page)
  const KEY = "fa-hautes-herbes-v1";
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, html) => {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const NAMES = { nour: "Nour", bastien: "Bastien", ines: "Inès", jade: "Jade", kevin: "Kévin", garnier: "M. Garnier", lou: "Lou", malo: "Malo", maelys: "Maëlys", roussel: "M. Roussel", benali: "Mme Benali" };

  /* ---------- état et sauvegarde ---------- */
  const fresh = () => ({ rev: {}, v: 1, idx: 0, name: "", av: 0, res: {}, flags: {}, dB: {}, dA: {}, carnet: [], build: null, later: {}, trust: {}, stars: {}, nuitee: false, done: false, settings: st ? st.settings : { sound: true, calm: false, voice: true }, tut: {} });
  let st = null;
  st = fresh();
  st.settings = { sound: true, voice: true, calm: window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && s.v === 1) return s; } catch (e) { } return null; }
  const saved = load();
  if (saved) st.settings = saved.settings || st.settings;
  if (st.settings.voice === undefined) st.settings.voice = true;

  /* ---------- son : musique générative par chapitre + ambiances (désactivable) ---------- */
  const MOODS = {
    home:  { bpm: 68, chords: [[53, 57, 60, 64], [50, 53, 57, 62], [46, 50, 53, 57], [48, 52, 55, 60]], arp: 0.34, oct: 12, wave: "triangle", cut: 1500, nature: "birds" },
    1:     { bpm: 72, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]], arp: 0.42, oct: 12, wave: "triangle", cut: 1800, nature: "birds" },
    2:     { bpm: 62, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], arp: 0.2, oct: 12, wave: "sine", cut: 1100, nature: "room" },
    3:     { bpm: 76, chords: [[55, 59, 62, 66], [52, 55, 59, 62], [48, 52, 55, 59], [50, 54, 57, 60]], arp: 0.46, oct: 12, wave: "triangle", cut: 1900, nature: "birds" },
    4:     { bpm: 56, chords: [[50, 53, 57], [46, 50, 53], [48, 51, 55], [45, 48, 52]], arp: 0.08, oct: 0, wave: "sine", cut: 800, nature: "wind", pulse: true },
    5:     { bpm: 70, chords: [[53, 57, 60, 64], [48, 52, 55, 59], [50, 53, 57, 60], [46, 50, 53, 57]], arp: 0.36, oct: 12, wave: "triangle", cut: 1600, nature: "room" },
    6:     { bpm: 60, chords: [[52, 55, 59, 62], [48, 52, 55, 59], [45, 48, 52, 55], [47, 50, 54, 57]], arp: 0.22, oct: 12, wave: "sine", cut: 1200, nature: "crickets" },
    end:   { bpm: 66, chords: [[53, 57, 60, 65], [48, 52, 55, 60], [50, 53, 57, 62], [46, 50, 53, 58]], arp: 0.5, oct: 12, wave: "triangle", cut: 2000, nature: "birds" },
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const Snd = {
    ctx: null, on: false, mood: "home", bar: 0, timer: null, nat: null, natKind: null,
    duck(on) {
      if (!this.ctx || !this.music) return;
      const t = this.ctx.currentTime, g = this.music.gain, n = this.natBus.gain;
      g.cancelScheduledValues(t); n.cancelScheduledValues(t);
      if (on) { this._g = this._g ?? g.value; this._n = this._n ?? n.value; g.setTargetAtTime(Math.max(0.0001, (this._g || 0.01) * 0.3), t, 0.15); n.setTargetAtTime(Math.max(0.0001, (this._n || 0.01) * 0.3), t, 0.15); }
      else if (this._g != null) { g.setTargetAtTime(this._g, t, 0.4); n.setTargetAtTime(this._n, t, 0.4); this._g = this._n = null; }
    },
    init() {
      if (this.ctx) return;
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; return; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.9;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
      this.master.connect(comp).connect(c.destination);
      // réverbération douce (réponse impulsionnelle générée)
      const len = c.sampleRate * 2.6, ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      this.verb = c.createConvolver(); this.verb.buffer = ir;
      this.wet = c.createGain(); this.wet.gain.value = 0.55; this.verb.connect(this.wet).connect(this.master);
      this.music = c.createGain(); this.music.gain.value = 0.0001; this.music.connect(this.master); this.music.connect(this.verb);
      this.sfx = c.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master);
      this.natBus = c.createGain(); this.natBus.gain.value = 0.0001; this.natBus.connect(this.master);
    },
    voice(freq, t, dur, { wave = "sine", gain = 0.02, attack = 0.02, release = 0.4, cut = 2000, dest, detune = 0 } = {}) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = wave; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
      f.type = "lowpass"; f.frequency.value = cut;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack);
      g.gain.setValueAtTime(gain, t + Math.max(attack, dur - release)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f).connect(g).connect(dest || this.music); o.start(t); o.stop(t + dur + 0.05);
    },
    tone(f, d = 0.12, type = "sine", g = 0.05, f2) {
      if (!st.settings.sound || !this.ctx) return;
      const c = this.ctx, o = c.createOscillator(), v = c.createGain(), t = c.currentTime;
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g, t + 0.012); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(v).connect(this.sfx); o.start(t); o.stop(t + d + 0.02);
    },
    // effets d'interface accordés sur la tonalité de l'ambiance
    root() { return (MOODS[this.mood] || MOODS.home).chords[this.bar % 4][0]; },
    click() { this.tone(mtof(this.root() + 24), 0.05, "sine", 0.018); },
    good() { const r = this.root() + 24; this.tone(mtof(r), 0.18, "sine", 0.04); setTimeout(() => this.tone(mtof(r + 7), 0.22, "sine", 0.035), 90); setTimeout(() => this.tone(mtof(r + 12), 0.3, "sine", 0.03), 180); },
    mid() { const r = this.root() + 24; this.tone(mtof(r), 0.2, "triangle", 0.03); setTimeout(() => this.tone(mtof(r + 5), 0.25, "triangle", 0.025), 110); },
    low() { const r = this.root() + 12; this.tone(mtof(r + 3), 0.25, "triangle", 0.03); setTimeout(() => this.tone(mtof(r), 0.3, "triangle", 0.028), 130); },
    page() { const r = this.root() + 24; [0, 4, 7, 12].forEach((k, i) => setTimeout(() => this.tone(mtof(r + k), 0.18, "sine", 0.022), i * 70)); },
    // ordonnanceur musical
    scheduleBar() {
      if (!this.on || !this.ctx) return;
      const m = MOODS[this.mood] || MOODS.home, c = this.ctx, beat = 60 / m.bpm, barDur = beat * 4, t0 = c.currentTime + 0.08;
      const ch = m.chords[this.bar % m.chords.length];
      ch.forEach((n, i) => { this.voice(mtof(n), t0, barDur + 1.2, { wave: m.wave, gain: 0.011, attack: 1.1, release: 1.4, cut: m.cut, detune: -6 }); this.voice(mtof(n), t0, barDur + 1.2, { wave: "sine", gain: 0.008, attack: 1.3, release: 1.4, cut: m.cut, detune: 7 }); });
      this.voice(mtof(ch[0] - 12), t0, barDur * 0.9, { wave: "sine", gain: 0.022, attack: 0.08, release: 0.8, cut: 400 });
      if (m.pulse) for (let k = 0; k < 4; k += 2) { this.voice(mtof(ch[0] - 24), t0 + k * beat, 0.35, { wave: "sine", gain: 0.03, attack: 0.01, release: 0.3, cut: 200 }); }
      const scale = ch.map((n) => n + m.oct).concat(ch.map((n) => n + m.oct + 12));
      for (let k = 0; k < 8; k++) if (Math.random() < m.arp) {
        const n = scale[Math.floor(Math.random() * scale.length)];
        this.voice(mtof(n), t0 + k * beat / 2 + Math.random() * 0.03, 1.1, { wave: "sine", gain: 0.012 + Math.random() * 0.008, attack: 0.005, release: 1.0, cut: 3200 });
      }
      this.bar++;
      this.timer = setTimeout(() => this.scheduleBar(), barDur * 1000 - 40);
    },
    // couche d'ambiance naturelle
    noise(color = "brown") {
      const c = this.ctx, len = c.sampleRate * 3, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (color === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.4; } else d[i] = w * 0.4; }
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true; return s;
    },
    setNature(kind) {
      if (!this.ctx || kind === this.natKind) return;
      const c = this.ctx, old = this.nat;
      if (old) { try { old.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.8); clearTimeout(old.t); setTimeout(() => { try { old.src && old.src.stop(); } catch (e) { } }, 3500); } catch (e) { } }
      this.natKind = kind;
      const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.natBus);
      const n = { g, t: null, src: null };
      if (kind === "wind" || kind === "room") {
        const s = this.noise("brown"), f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = kind === "wind" ? 600 : 220;
        if (kind === "wind") { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 0.07; lg.gain.value = 260; l.connect(lg).connect(f.frequency); l.start(); }
        s.connect(f).connect(g); s.start(); n.src = s;
        g.gain.setTargetAtTime(kind === "wind" ? 0.07 : 0.05, c.currentTime, 1.2);
      } else {
        g.gain.setTargetAtTime(1, c.currentTime, 0.5);
        const chirp = () => {
          if (this.natKind !== kind || !this.on) return;
          const t = c.currentTime;
          if (kind === "birds") { const f0 = 2300 + Math.random() * 1400, k = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < k; i++) this.voice(f0 * (1 + i * 0.06), t + i * 0.11, 0.09, { gain: 0.006, attack: 0.01, release: 0.07, cut: 8000, dest: g }); n.t = setTimeout(chirp, 2500 + Math.random() * 6000); }
          else { for (let i = 0; i < 6; i++) this.voice(4300 + Math.random() * 200, t + i * 0.05, 0.03, { gain: 0.0035, attack: 0.004, release: 0.02, cut: 9000, dest: g }); n.t = setTimeout(chirp, 600 + Math.random() * 900); }
        };
        n.t = setTimeout(chirp, 800);
      }
      this.nat = n;
    },
    setMood(key) {
      if (key === this.mood && this.on) return;
      this.mood = key;
      if (this.on && this.ctx) this.setNature((MOODS[key] || MOODS.home).nature);
    },
    startAmb() {
      if (!this.ctx || this.on || !st.settings.sound) return;
      try { if (this.ctx.state === "suspended") this.ctx.resume(); } catch (e) { }
      this.on = true;
      const t = this.ctx.currentTime;
      this.music.gain.cancelScheduledValues(t); this.music.gain.setTargetAtTime(1, t, 1.5);
      this.natBus.gain.cancelScheduledValues(t); this.natBus.gain.setTargetAtTime(1, t, 1.5);
      this.natKind = null; this.setNature((MOODS[this.mood] || MOODS.home).nature);
      this.scheduleBar();
    },
    stopAmb() {
      if (!this.ctx || !this.on) return;
      this.on = false; clearTimeout(this.timer);
      const t = this.ctx.currentTime;
      this.music.gain.setTargetAtTime(0.0001, t, 0.4); this.natBus.gain.setTargetAtTime(0.0001, t, 0.4);
      if (this.nat) clearTimeout(this.nat.t);
    },
  };


  /* ---------- voix des personnages : enregistrements naturels (ElevenLabs), désactivables ---------- */
  const VOIX = window.VOIX || {};
  const Voice = {
    ok: typeof Audio !== "undefined" && Object.keys(VOIX).length > 0, el: null, ready: null,
    check() {
      if (!this.ok || this.ready !== null) return;
      this.ready = false;
      fetch("/api/voix?a=etat", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((j) => {
        this.ready = !!(j && (j.active || j.generees > 0)); applySettings(); if (this._onReady) this._onReady();
      }).catch(() => { this.ready = false; applySettings(); });
    },
    url(who, text) { const id = VOIX[who + "|" + text]; return id ? "/api/voix?id=" + id + "&v=" + (window.VOIX_V || "1") : null; },
    say(who, text, target) { this.seq([[who, text, target instanceof Element ? target : null]]); },
    seq(list) {
      if (!this.ok || !this.ready || !st.settings.voice || !list || !list.length) return;
      const items = list.map(([w, t, e]) => ({ u: t && this.url(w, t), e: e || null, w })).filter((x) => x.u); if (!items.length) return;
      if (!this.el) {
        this.el = new Audio(); this.el.preload = "auto";
        this.el.addEventListener("ended", () => { this._done(); const n = this._q && this._q.shift(); if (n) this._play(n); else Snd.duck(false); });
        this.el.addEventListener("pause", () => { if (!this.el.ended) Snd.duck(false); }); this.el.addEventListener("play", () => { Snd.duck(true); this._tick(); });
      }
      try { this.el.pause(); } catch (e) { }
      this._done();
      this._q = items.slice(1); this._play(items[0]);
    },
    _play(it) {
      World.talk(it.w);
      this._cur = it; if (it.e) { it.e.classList.add("kara"); it.e.querySelectorAll(".wd.sp").forEach((w) => w.classList.remove("sp")); }
      this.el.src = it.u; const p = this.el.play(); if (p && p.catch) p.catch(() => { Snd.duck(false); this._done(); });
    },
    _tick() {
      cancelAnimationFrame(this._raf);
      const f = () => {
        const it = this._cur; if (!it || !it.e || !this.el || this.el.paused) return;
        const d = this.el.duration; if (d && isFinite(d)) {
          const ws = it.e.querySelectorAll(".wd"), k = Math.min(ws.length, Math.ceil((this.el.currentTime / d) * ws.length * 1.04));
          for (let i = 0; i < k; i++) if (!ws[i].classList.contains("sp")) ws[i].classList.add("sp");
        }
        this._raf = requestAnimationFrame(f);
      };
      this._raf = requestAnimationFrame(f);
    },
    _done() { World.talk(null); cancelAnimationFrame(this._raf); if (this._cur && this._cur.e) this._cur.e.classList.remove("kara"); this._cur = null; if (!this._q.length) setTimeout(() => { if (!this._cur && !this._q.length) document.dispatchEvent(new Event("voice-idle")); }, 60); },
    busy() { return !!this._cur || (this._q && this._q.length > 0); },
    prefetch(list) { if (!this.ready || !st.settings.voice) return; list.forEach(([w, t]) => { const u = this.url(w, t); if (u) fetch(u).catch(() => { }); }); },
    quotes(who, text) { const q = [...String(text || "").matchAll(/«\s*([^»]+?)\s*»/g)].map((m) => m[1]); if (q.length) this.say(who, q.join(" … ")); },
    stop() { this._q = []; this._done(); if (this.el) { try { this.el.pause(); } catch (e) { } } Snd.duck(false); },
  };
  Voice.check();

  /* ---------- structure ---------- */
  const app = $("#app"), stage = $("#stage"), live = $("#live");
  const say = (t) => { live.textContent = ""; setTimeout(() => (live.textContent = t), 30); };
  function applySettings() {
    document.body.classList.toggle("calm", !!st.settings.calm);
    const bs = $("#btn-sound"), bm = $("#btn-motion");
    bs.setAttribute("aria-pressed", st.settings.sound ? "true" : "false");
    bs.querySelector(".lbl").textContent = st.settings.sound ? "Son activé" : "Son coupé";
    bm.setAttribute("aria-pressed", st.settings.calm ? "true" : "false");
    bm.querySelector(".lbl").textContent = st.settings.calm ? "Animations réduites" : "Animations";
    const bv = $("#btn-voice");
    if (bv) { bv.hidden = !(Voice.ok && Voice.ready); bv.setAttribute("aria-pressed", st.settings.voice ? "true" : "false"); bv.querySelector(".lbl").textContent = st.settings.voice ? "Voix activées" : "Voix coupées"; }
  }
  $("#btn-voice")?.addEventListener("click", () => { st.settings.voice = !st.settings.voice; if (!st.settings.voice) Voice.stop(); applySettings(); save(); });
  $("#btn-sound").addEventListener("click", () => { st.settings.sound = !st.settings.sound; Snd.init(); if (st.settings.sound) { Snd.startAmb(); Snd.click(); } else Snd.stopAmb(); applySettings(); save(); });
  $("#btn-motion").addEventListener("click", () => { st.settings.calm = !st.settings.calm; applySettings(); save(); });
  $("#btn-carnet").addEventListener("click", () => openCarnet());
  $("#btn-phone").addEventListener("click", () => Phone.list());
  $("#btn-level").addEventListener("click", () => {
    st.level = ((st.level || 2) % 3) + 1; save(); Snd.click();
    $("#btn-level .lbl").textContent = LV().name;
    toastMsg(`Niveau ${LV().name} : ${["", "plus de temps et des indices.", "le rythme du terrain.", "tout est chronométré, peu d’indices."][st.level]} Il s’applique dès le prochain écran.`);
  });
  $("#btn-home").addEventListener("click", () => { Snd.click(); home(); });

  function hud(show) {
    $("#hud").hidden = !show;
    if (!show) return;
    const sc = SCREENS[st.idx], dots = $("#chapdots");
    dots.innerHTML = "";
    CHAPTERS.forEach((c) => {
      const cur = sc && sc.ch === c.n, done = sc && c.n < sc.ch;
      dots.appendChild(el("li", { class: "dot" + (cur ? " cur" : "") + (done ? " done" : ""), title: `${c.day} · ${c.title}` }, `<span class="sr-only">${c.day}, ${esc(c.title)}${cur ? ", en cours" : done ? ", terminé" : ""}</span>`));
    });
    $("#chaptitle").textContent = sc ? `${CHAPTERS[sc.ch - 1].day} · ${CHAPTERS[sc.ch - 1].title}` : "";
    // le téléphone n'apparaît qu'une fois présenté
    $("#btn-phone").hidden = !(st.rev && st.rev.phone);
    $("#carnetcount").textContent = st.carnet.length;
    $("#btn-level .lbl").textContent = LV().name;
    $("#hudav").innerHTML = A.avatars[st.av];
    rings(false);
  }
  const RING = { C1: "#2B6FD6", C2: "#8A4FD0", C3: "#E2702A", C4: "#1F9D63" };
  function compProgress() {
    const tot = {}, got = {};
    SCREENS.forEach((s) => { if (!s.comp) return; tot[s.comp] = (tot[s.comp] || 0) + 1; const r = st.res[s.id]; if (r != null) got[s.comp] = (got[s.comp] || 0) + r; });
    return Object.keys(RING).map((c) => [c, tot[c] ? (got[c] || 0) / tot[c] : 0]);
  }
  function rings(pulse) {
    let b = $("#rings");
    if (!b) {
      b = el("div", { id: "rings", class: "rings", role: "img" });
      b.innerHTML = `<svg viewBox="0 0 44 44" aria-hidden="true">${Object.keys(RING).map((c, i) => { const r = 19 - i * 4.6; return `<circle class="rt" cx="22" cy="22" r="${r}" stroke="${RING[c]}"/><circle class="rf" data-c="${c}" cx="22" cy="22" r="${r}" stroke="${RING[c]}" pathLength="100"/>`; }).join("")}</svg>`;
      $(".chapbox").after(b);
    }
    const P = compProgress();
    P.forEach(([c, p]) => { const f = b.querySelector(`.rf[data-c="${c}"]`); f.style.strokeDashoffset = (100 - Math.max(p * 100, p > 0 ? 3 : 0)).toFixed(1); });
    b.setAttribute("aria-label", "Compétences : " + P.map(([c, p]) => `${c} ${Math.round(p * 100)} %`).join(", "));
    b.title = P.map(([c, p]) => `${c} · ${COMPS[c]} : ${Math.round(p * 100)} %`).join("\n");
    if (pulse) { b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse"); }
  }
  function toast(c, q) {
    const t = el("div", { class: "gain", "aria-hidden": "true" }, `<i style="background:${RING[c]}"></i><span><b>${q >= 1 ? "Réflexe acquis" : "Compétence en progrès"}</b>${esc(COMPS[c])}</span>`);
    document.body.appendChild(t); requestAnimationFrame(() => t.classList.add("on"));
    setTimeout(() => { t.classList.remove("on"); setTimeout(() => t.remove(), 600); }, 2600);
  }

  /* ---------- navigation ---------- */
  function go(i, dir = 1) {
    i = Math.max(0, Math.min(SCREENS.length - 1, i));
    while (SCREENS[i] && SCREENS[i].nuitee && !st.nuitee && i > 0 && i < SCREENS.length - 1) i += dir < 0 ? -1 : 1;
    st.idx = i;
    save();
    render(dir);
  }
  const next = () => { Snd.click(); go(st.idx + 1, 1); };

  // Niveau de difficulté : Découverte (1), Standard (2), Expert (3). Il se change à tout moment depuis la barre du haut.
  const LEVELS = [null, { name: "Découverte", t: 1.6, hints: 4, pen: 0, speed: 1.5, crisis: 1.35, help: true },
    { name: "Standard", t: 1, hints: 2, pen: 5, speed: 1, crisis: 1 }, { name: "Expert", t: .7, hints: 1, pen: 8, speed: .7, crisis: .8, timeAll: 25 }];
  const LV = () => LEVELS[st.level || 2];
  function tune(sc) {
    const L = LV(), x = { ...sc };
    if (sc.timer) x.timer = Math.max(8, Math.round(sc.timer * L.t));
    else if (L.timeAll && sc.type === "choice" && !sc.later) x.timer = L.timeAll;
    if (sc.type === "hotspots") x.hints = L.hints;
    if (sc.speed || sc.type === "sort") x.speed = Math.max(4, Math.round((sc.speed || 9) * L.speed));
    if (sc.crisis) x.crisis = { ...sc.crisis, secs: Math.round(sc.crisis.secs * L.crisis) };
    return x;
  }
  // Les épreuves chronométrées attendent que la consigne ait été dite : bouton « Commencer », mis en avant à la fin de la voix.
  function readyGate(host, start, label = "Commencer") {
    const g = el("div", { class: "rgate" }, `<p>Écoutez la consigne, puis lancez le chrono quand vous êtes prêt.</p>`);
    const b = btn(label, () => { document.removeEventListener("voice-idle", glow); g.remove(); start(); });
    const glow = () => b.classList.add("ready");
    g.appendChild(b); host.appendChild(g);
    if (!st.settings.voice || calm()) glow(); else { document.addEventListener("voice-idle", glow, { once: true }); setTimeout(glow, 20000); }
    return g;
  }
  function toastMsg(t) {
    const g = el("div", { class: "gain msg", role: "status" }, `<span>${esc(t)}</span>`);
    document.body.appendChild(g); setTimeout(() => g.classList.add("out"), 3200); setTimeout(() => g.remove(), 3900);
  }
  // La semaine qui passe : jour, heure, avancée dans la semaine, fatigue de l'équipe
  const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"], CHDAY = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }, TIRED = [12, 30, 55, 68, 82];
  const DC = { d: -1, t: "8 h 30", el: null };
  function dayclock(sc) {
    if (!DC.el) { DC.el = el("div", { id: "dayclock", "aria-live": "polite" }); document.body.appendChild(DC.el); }
    const show = !["home", "avatar"].includes(sc.type) && !!(st.rev && st.rev.clock);
    DC.el.hidden = !show; if (!show) { DC.d = null; return; }
    let d = CHDAY[sc.ch] != null ? CHDAY[sc.ch] : 0;
    const k = sc.kicker || "", m = k.match(/(lundi|mardi|mercredi|jeudi|vendredi)/i);
    if (m) d = DAYS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase());
    const h = k.match(/(\d{1,2}) ?h ?(\d{2})?/), t0 = DC.t;
    if (sc.type === "chapter") DC.t = "7 h 45";
    else if (h) DC.t = `${h[1]} h ${h[2] || "00"}`;
    else if (d !== DC.d) DC.t = "8 h 30";
    const night = sc.nuitee || /nuit/i.test(sc.id), f = Math.min(95, TIRED[d] + (night ? 12 : 0));
    const changed = d !== DC.d, DCprev = DC.d; DC.d = d;
    DC.el.innerHTML = `<div class="dc-top"><b>${DAYS[d]}</b><span>${DC.t}</span></div>
      <div class="dc-week">${DAYS.map((x, i) => `<i class="${i < d ? "past" : i === d ? "now" : ""}" title="${x}">${x[0]}</i>`).join("")}</div>
      <div class="dc-f"><small>Fatigue de l’équipe</small><span><i style="width:${f}%"></i></span></div>`;
    DC.el.classList.toggle("tired", f >= 55);
    // l'heure défile jusqu'à la nouvelle heure
    const toMin = (x) => { const m = /(\d+) h (\d+)/.exec(x || ""); return m ? +m[1] * 60 + +m[2] : null; };
    const a0 = toMin(t0), a1 = toMin(DC.t), sp = DC.el.querySelector(".dc-top span");
    if (sp && a0 != null && a1 != null && a1 > a0 && d === DCprev && !calm()) {
      const T0 = performance.now(), dur = Math.min(2200, 300 + (a1 - a0) * 6);
      const tick = (now) => { const k2 = Math.min(1, (now - T0) / dur), m = Math.round(a0 + (a1 - a0) * k2); sp.textContent = `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; if (k2 < 1 && sp.isConnected) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    if (changed) { DC.el.classList.remove("newday"); void DC.el.offsetWidth; DC.el.classList.add("newday"); }
  }
  function render(dir = 1) {
    const sc = tune(SCREENS[st.idx]);
    // partie reprise après la présentation : l'horloge et le téléphone sont déjà connus
    if (!st.rev) st.rev = {};
    if (st.idx > SCREENS.findIndex((x) => x.id === "intro")) { st.rev.clock = 1; st.rev.phone = 1; }
    Voice.stop();
    const nx = SCREENS[st.idx + 1];
    if (nx) { const L = []; (nx.lines || []).forEach((l) => l.who && l.who !== "player" && L.push([l.who, l.t])); if (nx.nodes && nx.start && nx.nodes[nx.start]) L.push([nx.npc, nx.nodes[nx.start].t]); Voice.prefetch(L); }
    Snd.setMood(sc.type === "bilan" ? "end" : sc.ch);
    camera(sc);
    document.querySelectorAll(".cr-pop").forEach((x) => x.remove());
    unlockDocs(sc); Phone.check(sc); dayclock(sc);
    hud(true);
    const old = stage.firstElementChild;
    const node = el("section", { class: "screen t-" + sc.type + (dir < 0 ? " back" : ""), "aria-labelledby": "h-" + sc.id });
    (sc.type === "sort" && sc.cats.length <= 3 && !calm() ? R.reflex : sc.type === "order" && sc.crisis && !calm() ? R.crisis : (R[sc.type] || R.story))(sc, node);
    { const VP = VOICE_TXT.parts(sc); if (World.entered) { VP.unshift(["narr", ROOM_SAY[World.entered]]); World.entered = null; }
      if (VP.length && !node.dataset.novoice) setTimeout(() => Voice.seq(VP), 350); }
    if (sc.fact) { const host = node.querySelector(".panel, .solo, .page-note .pn-body") || node; host.insertBefore(el("p", { class: "fact" }, `<b>Inspiré de faits réels</b> ${esc(sc.fact)}`), host.firstChild); }
    if (old) { old.classList.add("leaving"); setTimeout(() => old.remove(), st.settings.calm ? 0 : 320); }
    stage.appendChild(node);
    requestAnimationFrame(() => node.classList.add("in"));
    const h = node.querySelector("h2");
    if (h) { h.setAttribute("tabindex", "-1"); setTimeout(() => h.focus({ preventScroll: true }), 60); }
    window.scrollTo(0, 0);
  }

  /* ---------- éléments communs ---------- */
  const kicker = (t) => (t ? `<p class="kicker">${esc(t)}</p>` : "");
  // Heure de la scène, lue dans l'indication de temps (« Lundi, 8 h 30 », « Jeudi soir »…).
  function timeOf(sc) {
    const k = String((sc && (sc.kicker || "")) || "").toLowerCase();
    if (/nuit/.test(k)) return "night";
    if (/soir/.test(k)) return "evening";
    if (/matin/.test(k)) return "morning";
    const h = k.match(/(\d{1,2})\s*h/); if (h) { const n = +h[1]; return n < 11 ? "morning" : n < 16 ? "day" : n < 19 ? "golden" : "evening"; }
    return { 1: "morning", 2: "morning", 3: "day", 4: "golden", 5: "morning", 6: "evening" }[sc && sc.ch] || "day";
  }
  // Le monde : le diorama de l'accueil, derrière les écrans. La caméra voyage vers le lieu de chaque scène.
  // Le plan + ses calques animés (voiture, parents, balançoires, drapeau, promeneurs) posés au-dessus.
  function dioHTML() {
    if (!A.dio) return "";
    if (A.dio.css && !document.getElementById("dio-css")) document.head.appendChild(el("style", { id: "dio-css" }, A.dio.css));
    // le plan est affiché comme une image (rastérisée une fois par le navigateur) : bien plus léger qu'un SVG vivant
    if (!dioHTML.url) { try { dioHTML.url = URL.createObjectURL(new Blob([A.dio.img || A.dio.svg], { type: "image/svg+xml" })); } catch (e) { dioHTML.url = ""; } }
    const base = dioHTML.url ? `<img class="dio-img" src="${dioHTML.url}" alt="" draggable="false" decoding="async">` : A.dio.svg;
    // matières du plan (pour les calques en SVG vivant), une seule fois dans la page
    const defs = A.dio.defs && !document.getElementById("dio-defs") ? `<svg id="dio-defs" width="0" height="0" style="position:absolute" aria-hidden="true">${A.dio.defs}</svg>` : "";
    // ce qui est devant (préau, portail, clôture, lampadaires…) est recopié au-dessus, rangé par profondeur avec les personnages
    const occ = (A.dio.occ || []).map((x) => `<div class="dio-occ" style="left:${x.l}%;top:${x.t}%;width:${x.w}%;aspect-ratio:${x.r};z-index:${x.z}">${x.svg}</div>`).join("");
    return base + defs + `<div class="wlids"></div><div class="wanim">${(A.dio.anims || []).map((x) => `<div class="dio-ov ${x.cls}" style="left:${x.l}%;top:${x.t}%;width:${x.w}%;aspect-ratio:${x.r};z-index:${x.z || 1}">${x.svg}</div>`).join("")}${occ}</div>`;
  }
  const LOC = { intro: "entree", radio: "radio", k1: "equipe", brief: "equipe", ines: "equipe", rire: "parc", parent1: "cour", parent2: "cour", chat: "equipe", chatact: "equipe", theo: "cour", theo2: "cour", k2: "equipe",
    ronde: "sanitaires", consent: "jeux", silence: "jeux", kevin: "equipe", nuit1: "refectoire", nuit2: "refectoire", nuit3: "refectoire", kn: "equipe", k3: "equipe",
    depart: "entree", lou: "cour", call: "direction", acts: "direction", ordre: "cour", transm: "direction", k4: "equipe",
    bilanequipe: "equipe", build: "equipe", affiche: "panneau", familles: "entree", k5: "equipe", maelys: "local", f1: "local", garnier: "direction", f3: "direction" };
  // ---------------------------------------------------------------------------------------------
  // Le monde vivant : le plan de l'accueil derrière les questions. La caméra va vers le lieu de la
  // scène ; si la scène se passe dans une salle, on y entre (décor intérieur), puis on en ressort.
  // Les personnages présents sont posés sur place ; celui qui parle s'anime.
  // Toits qu'on lève : une version du plan sans le toit du bâtiment (recadrée sur lui) se pose sur le
  // plan, et le toit seul, par-dessus, s'envole. Rien d'autre n'apparaît : on regarde dans le bâtiment.
  const Lids = {
    url: {},
    of(at) { const L = A.dio.lids || {}; for (const G in L) if (L[G].rooms.includes(at)) return G; return null; },
    src(G, mode, hl) {
      const k = G + "|" + mode + "|" + (hl || ""); if (this.url[k]) return this.url[k];
      const L = A.dio.lids[G], all = [G, ...(L.also || [])], q = (a) => all.map((g) => `[${a}="${g}"]`).join(",");
      const nx = hl && A.dio.inner && A.dio.inner[hl] ? A.dio.inner[hl].next : null;
      const st = mode === "open" ? `${q("data-open")}{display:inline}${q("data-lid")},${q("data-shut")}{display:none}${nx ? `[data-wl="${nx}"],[data-wld="${nx}"]{display:none}[data-wlo="${nx}"]{display:inline}` : ""}`
        : `*{visibility:hidden}${all.map((g) => `[data-lid="${g}"],[data-lid="${g}"] *`).join(",")}{visibility:visible}`;
      const svg = (A.dio.img || A.dio.svg).replace(/viewBox="[^"]*"/, `viewBox="${L.vb}"`).replace("</style>", st + "</style>");
      try { this.url[k] = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); } catch (e) { this.url[k] = ""; }
      return this.url[k];
    },
  };
  // Les affiches des murs : un clic pour les lire en grand
  const Aff = {
    open(k) {
      const a = (A.dio.aff || {})[k]; if (!a) return;
      document.querySelector(".affview")?.remove();
      const v = el("div", { class: "affview", role: "dialog", "aria-modal": "true", "aria-label": a.t },
        `<div class="affbox"><img alt="${a.t}" src="${a.L}"><div class="afftxt"><h3>${a.t}</h3><p>${a.x}</p><button class="btn affclose">Fermer</button></div></div>`);
      const close = () => { v.classList.remove("in"); setTimeout(() => v.remove(), 250); removeEventListener("keydown", esc); };
      const esc = (e) => { if (e.key === "Escape") close(); };
      v.addEventListener("click", (e) => { if (e.target === v || e.target.closest(".affclose")) close(); });
      addEventListener("keydown", esc);
      document.body.appendChild(v); requestAnimationFrame(() => v.classList.add("in"));
      v.querySelector(".affclose").focus();
      try { Snd.click(); } catch (e) {}
    },
  };
  // Le plan est sous l'interface : on retrouve l'affiche sous le pointeur quand on clique dans le vide
  {
    const affAt = (x, y) => { const e = document.elementsFromPoint(x, y).find((n) => n.closest && n.closest(".inroom-w .aff")); return e ? e.closest(".aff") : null; };
    const free = (t) => !t.closest("button,a,input,textarea,select,label,.panel,.side,.solo,.affview,#hud,#dayclock,.phone,.carnet,[role=dialog]");
    document.addEventListener("click", (e) => { if (!free(e.target)) return; const a = affAt(e.clientX, e.clientY); if (a) Aff.open(a.dataset.aff); });
    let raf = 0;
    document.addEventListener("pointermove", (e) => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; document.body.classList.toggle("over-aff", free(e.target) && !!affAt(e.clientX, e.clientY)); }); }, { passive: true });
  }
  const World = {
    el: null, ext: null, cam: null, wint: null, room: null, cur: null,
    init() {
      if (this.el || !A.dio) return;
      this.el = el("div", { id: "world", "aria-hidden": "true" },
        `<div class="wext"><div class="wcam">${dioHTML()}<div class="wacts"></div></div></div><div class="wint"><div class="wroom"></div><p class="wname"></p></div><i class="wvig"></i>`);
      document.body.insertBefore(this.el, document.body.firstChild);
      this.cam = this.el.querySelector(".wcam"); this.wint = this.el.querySelector(".wint");
    },
    actor(who, pose, pct, size, flip, from) {
      const key = who === "you" ? "av" + st.av : who;
      const m = A.minis && A.minis[key]; if (!m) return null;
      const a = el("div", { class: "actor" + (flip ? " flip" : ""), "data-who": who === "you" ? "you" : who, style: `left:${pct[0]}%;top:${pct[1]}%;width:${size}%;--br:${(Math.random() * 3).toFixed(2)}s` },
        `<span class="abub"><i></i><i></i><i></i></span><svg viewBox="-22 -60 44 64">${m[pose || "stand"] || m.stand}</svg>`);
      // entrée : la personne arrive en marchant depuis la porte ou le bord de la scène, puis prend son attitude
      if (from && !reduce()) {
        a.style.setProperty("--fx", from[0] + "%"); a.style.setProperty("--fy", from[1] + "%");
        a.classList.add("arriving"); a.querySelector("svg").innerHTML = m.walk;
        a.addEventListener("animationend", (e) => { if (e.animationName !== "walkin") return; a.style.animation = "none"; a.classList.remove("arriving"); a.querySelector("svg").innerHTML = m[pose || "stand"] || m.stand; }, { once: false });
      }
      return a;
    },
    // chacun se tourne vers le groupe (les gestes vont vers l'interlocuteur)
    faceGroup(list) {
      if (list.length < 2) return;
      const cx = list.reduce((t, [, p]) => t + p[0], 0) / list.length;
      list.forEach(([a, p]) => a.classList.toggle("flip", p[0] > cx + .5));
    },
    stage(sc) {
      this.init(); if (!this.el) return;
      const hide = !sc || ["hotspots", "avatar", "home", "find"].includes(sc.type);
      document.body.classList.toggle("live", !hide && !calm());
      this.el.classList.toggle("on", !hide);
      if (hide) return;
      let S = STAGE[sc.id];
      if (S === "keep" || (!S && ["explain", "multi"].includes(sc.type) && this.cur)) S = this.cur;
      if (!S) S = { at: LOC[sc.id] || "ensemble", cast: sc.npc ? [[sc.npc, "a", "talk"], ["you", "b"]] : [] };
      this.show(S, sc);
    },
    show(S, sc) {
      this.init(); if (!this.el) return;
      this.el.classList.add("on"); document.body.classList.toggle("live", !calm());
      const same = this.cur === S; this.cur = S;
      const amb = S.night ? "night" : timeOf(sc);
      this.el.className = "on amb-" + amb + (S.room ? " inside" : "") + (["cour", "entree"].includes(S.at) && (S.cast || []).length ? " busy-gate" : "");
      if (same) return;
      // caméra extérieure
      let p = A.dio.lieux[S.at] || A.dio.lieux.ensemble, z = S.at && S.at !== "ensemble" ? 2.1 : 1.08;
      const IN = S.room && A.dio.inner && A.dio.inner[S.room];
      if (IN) {   // on cadre la salle elle-même, assez près pour voir les visages
        const hp = IN.w * A.dio.ratio / IN.r, camW = this.cam.offsetWidth || 1500;
        const want = innerWidth < 760 ? innerWidth * .98 : Math.min(innerWidth * .52, 940);
        z = Math.max(1.6, Math.min(5, want / (IN.w / 100 * camW)));
        p = { x: (IN.l + IN.w / 2) / 100, y: (IN.t + hp * .52) / 100 };
      }
      this.cam.style.transform = `translate(${(-p.x * z * 100).toFixed(2)}%,${(-p.y * z * 100).toFixed(2)}%) scale(${z})`;
      // acteurs dehors
      const acts = this.cam.querySelector(".wacts"); acts.innerHTML = "";
      const stand = A.dio.stand[S.at] || A.dio.stand.ensemble, sz = (44 / A.dio.vbw) * 100 * .84;
      if (!S.room) {
        const L = [];
        (S.cast || []).forEach(([w, slot, pose], k) => {
          const p = stand[slot] || stand.a, from = [k % 2 ? 260 : -260, 110];
          const a = this.actor(w, pose, p, sz, false, k < 3 ? from : null);
          if (a) { a.style.animationDelay = (0.5 + k * 0.18) + "s"; a.style.zIndex = ((A.dio.standZ || {})[S.at] || (A.dio.standZ || {}).ensemble || {})[slot] || Math.round(p[1] * 10); acts.appendChild(a); L.push([a, p]); }
        });
        this.faceGroup(L);
      }
      // intérieur : on lève le toit du bâtiment, la salle est là, dans le plan, avec ses occupants
      if (S.room && S.room !== this.lastRoom && typeof ROOM_SAY !== "undefined") this.entered = S.room;
      this.lastRoom = S.room || null;
      clearTimeout(this._t); clearTimeout(this._t2);
      const gen = this._gen = (this._gen || 0) + 1;
      if (IN) {
        const sameB = this.lid && this.lid.G === IN.G;
        this._t2 = setTimeout(() => { if (gen === this._gen) this.roof(S.room, S); }, reduce() ? 0 : (sameB ? 0 : 700));
      } else this.roof(null);
    },
    // la salle « room » vue dans le plan, avec les personnages rangés entre les meubles
    people(room, S) {
      const IN = A.dio.inner[room], host = this.cam.querySelector(".wlids");
      const old = host.querySelector(".inroom-w"); if (old) old.remove();
      const w = el("div", { class: "inroom-w", style: `left:${IN.l}%;top:${IN.t}%;width:${IN.w}%;aspect-ratio:${IN.r};z-index:${IN.z}` }, IN.svg);
      const svg = w.querySelector("svg"), NS = "http://www.w3.org/2000/svg", L = [];
      (S.cast || []).forEach(([who, slot, pose], k) => {
        const P = IN.sp[slot] || IN.sp.a; if (!P) return;
        const key = who === "you" ? "av" + st.av : who, m = A.minis[key]; if (!m) return;
        const ps = P.sit ? "sit" : (pose || "stand");
        const g = document.createElementNS(NS, "g");
        g.setAttribute("class", "ractor"); g.dataset.who = who; g.setAttribute("transform", `translate(${P.x},${P.y})`);
        g.innerHTML = `<g class="rmove" style="animation-delay:${(0.2 + k * 0.22).toFixed(2)}s"><g class="rbody"><g transform="scale(.84)">${m[ps] || m.stand}</g></g>${who === "you" ? `<text class="rlab" y="8" text-anchor="middle">Vous</text>` : ""}</g>`;
        const after = [...svg.querySelectorAll(":scope > g[data-d]")].find((x) => +x.dataset.d > P.d);
        svg.insertBefore(g, after || null);
        L.push([g, [P.x, 0], P]);
      });
      if (L.length > 1) { const cx = L.reduce((t, [, p]) => t + p[0], 0) / L.length; L.forEach(([g, p, P]) => g.querySelector(".rbody").classList.toggle("flip", P && P.sit ? !!P.fx : p[0] > cx + 2)); }
      else L.forEach(([g, , P]) => P && P.sit && g.querySelector(".rbody").classList.toggle("flip", !!P.fx));
      w.addEventListener("click", (e) => { const g = e.target.closest && e.target.closest(".aff"); if (g) Aff.open(g.dataset.aff); });
      host.appendChild(w);
      requestAnimationFrame(() => w.classList.add("in"));
    },
    // lève le toit du bâtiment de la salle « room » ; room = null : on referme
    roof(room, S) {
      const IN = room && A.dio.inner && A.dio.inner[room], G = IN ? IN.G : null, host = this.cam.querySelector(".wlids"), cur = this.lid;
      if (!host) return;
      const holeSrc = G ? Lids.src(G, "open", room) : "";
      if (cur && cur.G === G) {   // même bâtiment : on change de salle (la cloison abaissée change aussi)
        if (cur.room !== room) {
          cur.room = room; const im = new Image(); im.className = "wlid hole"; im.alt = ""; im.src = holeSrc;
          Object.assign(im.style, { left: cur.h.style.left, top: cur.h.style.top, width: cur.h.style.width, aspectRatio: cur.h.style.aspectRatio });
          (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { if (this.lid !== cur) return; host.insertBefore(im, cur.h); cur.h.remove(); cur.h = im; im.classList.add("ready"); this.people(room, S); });
        } else this.people(room, S);
        return;
      }
      if (cur) {   // on referme : la salle se vide, le toit redescend
        const r = host.querySelector(".inroom-w"); if (r) { r.classList.remove("in"); setTimeout(() => r.remove(), 300); }
        cur.t.classList.remove("open"); setTimeout(() => { cur.h.remove(); cur.t.remove(); }, reduce() ? 0 : 1300);
        this.lid = null;
      }
      if (!G) return;
      const L = A.dio.lids[G], pos = `left:${L.l}%;top:${L.t}%;width:${L.w}%;aspect-ratio:${L.r}`;
      const h = el("img", { class: "wlid hole", alt: "", src: holeSrc, style: pos }), t = el("img", { class: "wlid top", alt: "", src: Lids.src(G, "lid"), style: pos });
      host.appendChild(h); host.appendChild(t); const me = this.lid = { G, room, h, t };
      Promise.all([h, t].map((i) => (i.decode ? i.decode() : Promise.resolve()).catch(() => {}))).then(() => {
        if (this.lid !== me) return;
        t.classList.add("ready");
        // le toit reste posé un instant (on voit le bâtiment fermé), puis il se soulève ; dessous, les murs de façade s'abaissent
        setTimeout(() => { if (this.lid !== me) return; t.classList.add("open"); h.classList.add("ready"); setTimeout(() => this.lid === me && this.people(room, S), reduce() ? 0 : 450); }, reduce() ? 0 : 350);
      });
    },
    // rectangle à l'écran de la salle « at » sur le plan (pour faire sortir la vue de près du bâtiment ouvert)
    zoneRect(at) {
      const z = A.dio.zones[at], c = this.cam.getBoundingClientRect();
      if (!z) return null;
      return { x: c.left + (z.x + z.w / 2) / 100 * c.width, y: c.top + (z.y + z.h / 2) / 100 * c.height, w: z.w / 100 * c.width };
    },
    upset(who) {
      if (!this.el) return;
      this.el.querySelectorAll(`.actor[data-who="${who}"], .ractor[data-who="${who}"]`).forEach((a) => { a.classList.remove("upset"); void a.getBoundingClientRect(); a.classList.add("upset"); setTimeout(() => a.classList.remove("upset"), 2600); });
      document.querySelectorAll(`.portrait.chip[data-who="${who}"]`).forEach((a) => { a.classList.add("upset"); setTimeout(() => a.classList.remove("upset"), 2600); });
    },
    talk(who) {
      if (!this.el) return;
      const GC = ["g1", "g2", "g3", "g4", "g5", "g6"], MC = ["m1", "m2", "m3"];
      clearInterval(this._gi);
      this.el.querySelectorAll(".talking").forEach((a) => a.classList.remove("talking", ...GC, ...MC));
      document.querySelectorAll(".portrait.chip.talking").forEach((a) => a.classList.remove("talking"));
      if (!who || who === "narr") return;
      // des gestes et des bouches qui changent au fil de la phrase (jamais deux fois de suite le même geste)
      const els = [...this.el.querySelectorAll(`.actor[data-who="${who}"], .ractor[data-who="${who}"]`)];
      let last = "";
      const pick = () => {
        let g; do { g = GC[Math.floor(Math.random() * GC.length)]; } while (g === last); last = g;
        const m = MC[Math.floor(Math.random() * MC.length)];
        els.forEach((a) => { a.classList.remove(...GC, ...MC); a.classList.add("talking", g, m); });
      };
      pick(); this._gi = setInterval(() => { if (!els.some((a) => a.classList.contains("talking"))) return clearInterval(this._gi); pick(); }, 1900 + Math.random() * 900);
      document.querySelectorAll(`.portrait.chip[data-who="${who}"]`).forEach((a) => a.classList.add("talking"));
    },
  };
  function reduce() { return matchMedia("(prefers-reduced-motion: reduce)").matches || calm(); }
  function camera(sc) { World.stage(sc); }

  // Plus d'illustrations : la scène se joue en direct sur le plan, derrière la question.
  function scenePanel() { return document.createComment("scène sur le plan"); }
  function parallax(n) {
    if (matchMedia("(pointer:coarse)").matches) return;
    n.addEventListener("pointermove", (e) => { const r = n.getBoundingClientRect(); n.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5).toFixed(3)); n.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5).toFixed(3)); });
    n.addEventListener("pointerleave", () => { n.style.setProperty("--px", 0); n.style.setProperty("--py", 0); });
  }
  function portrait(who, mood) {
    // Pastille de la personne qui vous parle : buste en pâte à modeler, l'expression change selon vos réponses.
    return el("div", { class: "portrait chip", "data-who": who }, `<div class="pchar">${A.chars[who][mood || "smile"]}</div><div class="pname">${NAMES[who]}</div>`);
  }
  function setMood(container, who, mood) {
    const pc = container.querySelector(`.portrait[data-who="${who}"] .pchar`);
    if (!pc) return;
    pc.classList.remove("react"); void pc.offsetWidth;
    pc.innerHTML = A.chars[who][mood]; pc.classList.add("react");
  }
  function btn(label, onclick, cls = "cta") { return el("button", { class: cls, type: "button", onclick }, label); }
  function record(sc, q, extra) {
    if (st.res[sc.id] == null) { st.res[sc.id] = q; if (sc.comp && q > 0) { rings(true); toast(sc.comp, q); } }
    if (extra && extra.flag) st.flags[extra.flag] = true;
    save();
  }
  function verdict(q) {
    if (q >= 1) return { cls: "good", t: "Bonne approche", s: () => Snd.good() };
    if (q >= 0.5) return { cls: "mid", t: "En partie", s: () => Snd.mid() };
    return { cls: "low", t: "À revoir", s: () => Snd.low() };
  }
  function coach(text, host) {
    if (st.tut[text.slice(0, 20)]) return;
    st.tut[text.slice(0, 20)] = 1;
    const c = el("div", { class: "coach", role: "note" }, `<div class="cav">${A.chars.nour.smile}</div><p>${esc(text)}</p>`);
    const x = btn("Compris", () => { c.remove(); }, "ghost small");
    c.appendChild(x);
    host.prepend(c);
  }

  /* ---------- effets animés ---------- */
  const calm = () => !!st.settings.calm;
  function words(t) {
    let i = 0;
    return esc(t).split(/(\s+)/).map((w) => (/^\s+$/.test(w) ? w : `<span class="wd" style="--i:${Math.min(i++, 70)}">${w}</span>`)).join("");
  }
  function burst(target, kind = "good") {
    if (calm() || !target) return;
    const r = target.getBoundingClientRect(), fx = $("#fx");
    const s = el("i", { class: "ripple", style: `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px` });
    fx.appendChild(s); setTimeout(() => s.remove(), 900);
  }
  function flyToCarnet(from) {
    const to = $("#btn-carnet");
    if (calm() || !from || !to) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const f = el("div", { class: "flybook", "aria-hidden": "true" }, '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" fill="#FDF2DE" stroke="#D35A0B" stroke-width="2"/><path d="M8 7h6M8 11h6" stroke="#D35A0B" stroke-width="2" stroke-linecap="round"/></svg>');
    $("#fx").appendChild(f);
    const x0 = a.left + a.width / 2 - 22, y0 = a.top + 10, x1 = b.left + b.width / 2 - 22, y1 = b.top + b.height / 2 - 22;
    if (!f.animate) { f.remove(); return; }
    f.animate([{ transform: `translate(${x0}px,${y0}px) scale(.4) rotate(-20deg)`, opacity: 0 }, { transform: `translate(${x0}px,${y0 - 60}px) scale(1.4) rotate(8deg)`, opacity: 1, offset: 0.35 }, { transform: `translate(${x1}px,${y1}px) scale(.6) rotate(0)`, opacity: 0.9 }], { duration: 1300, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => { f.remove(); to.classList.remove("bump"); void to.offsetWidth; to.classList.add("bump"); };
  }
  function cheer(container, who, q) {
    const pc = container.querySelector(`.portrait[data-who="${who}"] .pchar`);
    if (!pc || calm()) return;
    pc.classList.remove("joy", "think"); void pc.offsetWidth;
    pc.classList.add(q >= 1 ? "joy" : "think");
  }

  /* ---------- rendus ---------- */
  const R = {};

  R.avatar = (sc, n) => {
    n.innerHTML = `<div class="solo"><h2 id="h-${sc.id}">Votre rôle</h2><p class="lead">Vous êtes animateur ou animatrice, recruté·e pour une semaine de vacances à l’accueil de loisirs des Hautes Herbes. Ce jeu porte sur la prévention des violences sexistes et sexuelles : les repérer, protéger les enfants et alerter.</p></div>`;
    const box = n.querySelector(".solo");
    const lab = el("label", { for: "pname", class: "flabel" }, "Votre prénom (facultatif)");
    const inp = el("input", { id: "pname", type: "text", maxlength: "20", autocomplete: "off", placeholder: "Sam", value: st.name || "" });
    const grid = el("div", { class: "avs", role: "radiogroup", "aria-label": "Choisissez votre personnage" });
    A.avatars.forEach((svg, i) => {
      const b = el("button", { class: "av" + (i === st.av ? " sel" : ""), type: "button", role: "radio", "aria-checked": i === st.av ? "true" : "false", "aria-label": "Personnage " + (i + 1) }, svg);
      b.addEventListener("click", () => { st.av = i; grid.querySelectorAll(".av").forEach((x, j) => { x.classList.toggle("sel", j === i); x.setAttribute("aria-checked", j === i); }); Snd.click(); });
      grid.appendChild(b);
    });
    const fmt = el("div", { class: "fmt", role: "radiogroup", "aria-label": "Format de l’accueil" });
    [[false, "Sans hébergement (ALSH)", "Accueil de loisirs : les enfants repartent chaque soir avec leur famille."], [true, "Avec hébergement (ALAH)", "Une nuit sur place le mercredi : un parcours en plus sur les risques de la nuit."]].forEach(([v, t, d]) => {
      const b = el("button", { class: "fmtb" + (!!st.nuitee === v ? " sel" : ""), type: "button", role: "radio", "aria-checked": String(!!st.nuitee === v) }, `<b>${t}</b><small>${d}</small>`);
      b.addEventListener("click", () => { st.nuitee = v; fmt.querySelectorAll(".fmtb").forEach((x) => { const on = x === b; x.classList.toggle("sel", on); x.setAttribute("aria-checked", String(on)); }); Snd.click(); });
      fmt.appendChild(b);
    });
    const lvl = el("div", { class: "fmt lvl3", role: "radiogroup", "aria-label": "Niveau de difficulté" });
    [[1, "Découverte", "Plus de temps, des indices, des situations plus lisibles."], [2, "Standard", "Le rythme du terrain."], [3, "Expert", "Chaque décision est chronométrée, peu d’indices."]].forEach(([v, t, d]) => {
      const b = el("button", { class: "fmtb" + ((st.level || 2) === v ? " sel" : ""), type: "button", role: "radio", "aria-checked": String((st.level || 2) === v) }, `<b>${t}</b><small>${d}</small>`);
      b.addEventListener("click", () => { st.level = v; lvl.querySelectorAll(".fmtb").forEach((x) => { const on = x === b; x.classList.toggle("sel", on); x.setAttribute("aria-checked", String(on)); }); Snd.click(); });
      lvl.appendChild(b);
    });
    box.append(lab, inp, el("p", { class: "flabel" }, "Votre personnage"), grid, el("p", { class: "flabel" }, "Format de l’accueil"), fmt, el("p", { class: "flabel" }, "Niveau (modifiable à tout moment)"), lvl, btn("Commencer", () => { st.name = (inp.value || "").trim().slice(0, 20); next(); }));
  };

  // Chaque journée commence au portail : la nuit tombe sur la veille, le jour se lève, les familles arrivent.
  R.chapter = (sc, n) => {
    const c = CHAPTERS[sc.ch - 1], prev = CHAPTERS[sc.ch - 2];
    const stations = CHAPTERS.map((x) => `<li class="${x.n < c.n ? "done" : x.n === c.n ? "cur" : ""}"><span>${x.day.slice(0, 2)}</span></li>`).join("");
    let hier = "";
    if (prev) {
      const L = SCREENS.filter((x) => x.ch === prev.n && x.comp && st.res[x.id] != null);
      const ok = L.filter((x) => st.res[x.id] >= 1).length, mid = L.length - ok;
      const titres = L.slice(0, 4).map((x) => `<li class="${st.res[x.id] >= 1 ? "good" : "mid"}">${esc((x.kicker || x.title || "").replace(/^[^,·]*, ?/, ""))}</li>`).join("");
      hier = `<div class="dayrecap"><p class="kicker">Hier, ${prev.day.toLowerCase()}</p><p>${L.length ? `${ok} situation${ok > 1 ? "s" : ""} bien gérée${ok > 1 ? "s" : ""}${mid ? `, ${mid} à reprendre` : ""}.` : "Une première journée pour prendre ses repères."}</p>${titres ? `<ul>${titres}</ul>` : ""}</div>`;
    }
    const plan = (c.plan || []).filter((p) => st.nuitee || !/nuitée/i.test(p[1])).map((p) => `<li><b>${p[0]}</b><span>${esc(p[1])}</span></li>`).join("");
    n.innerHTML = `<div class="chap day"><div class="journey" aria-hidden="true"><ol>${stations}</ol><div class="walker2" style="--from:${((c.n - 2) / (CHAPTERS.length - 1)) * 100}%;--to:${((c.n - 1) / (CHAPTERS.length - 1)) * 100}%">${A.avatars[st.av]}</div></div>
      <p class="chapnum">Jour ${c.n} sur ${CHAPTERS.length}</p><h2 id="h-${sc.id}">${esc(c.day)}</h2><p class="daytitle">${esc(c.title)}</p>
      ${hier}<div class="dayplan"><p class="kicker">Aujourd’hui</p><ul>${plan}</ul></div><p class="lead"><b>Objectif du jour.</b> ${esc(c.goal)}</p></div>`;
    n.querySelector(".chap").appendChild(btn(c.n === 1 ? "C’est parti" : "Commencer la journée", next));
    Snd.page();
    // la nuit tombe sur la veille, puis le jour se lève
    if (prev && !calm() && !n.dataset.nf) {
      n.dataset.nf = "1";
      const nf = el("div", { class: "nightfall", "aria-hidden": "true" }, `<div class="nf-moon"></div><p>La nuit tombe sur les Hautes Herbes…</p>`);
      document.body.appendChild(nf);
      requestAnimationFrame(() => nf.classList.add("in"));
      setTimeout(() => { nf.querySelector("p").textContent = `${c.day}, 7 h 45. Le jour se lève.`; nf.classList.add("dawn"); }, 1700);
      setTimeout(() => { nf.classList.remove("in"); setTimeout(() => nf.remove(), 900); }, 3000);
    }
  };

  R.story = (sc, n) => {
    const wrap = el("div", { class: "duo" });
    wrap.appendChild(scenePanel(sc.scene));
    const panel = el("div", { class: "panel" });
    panel.innerHTML = `${kicker(sc.kicker)}<h2 id="h-${sc.id}" class="sr-only">${esc(sc.kicker || "Récit")}</h2>`;
    const lines = el("div", { class: "lines" });
    panel.appendChild(lines);
    let i = 0;
    const nb = btn("Continuer", () => step());
    const add = (L) => {
      const nm = L.who ? (L.who === "player" ? (st.name || "Vous") : NAMES[L.who]) : null;
      const row = el("div", { class: "line " + (L.who ? "said" : "narr") });
      if (L.who) row.innerHTML = `<div class="mini">${A.chars[L.who][L.mood || "smile"]}</div><div class="bub"><b>${esc(nm)}</b><p>${words(L.t)}</p></div>`;
      else row.innerHTML = `<p>${words(L.t)}</p>`;
      lines.appendChild(row);
      if (L.reveal) { st.rev = st.rev || {}; st.rev[L.reveal] = 1; save(); hud(true); dayclock(sc); const t = L.reveal === "clock" ? DC.el : $("#btn-phone"); if (t) { t.classList.remove("revealed"); void t.offsetWidth; t.classList.add("revealed"); } }
      say((nm ? nm + " : " : "") + L.t);
      if (L.who && L.who !== "player") Voice.say(L.who, L.t, row);
      else if (!L.who) Voice.say("narr", L.t, row);
    };
    function step() {
      Snd.click();
      if (i < sc.lines.length) { add(sc.lines[i++]); if (i === sc.lines.length) nb.textContent = "Suivant"; }
      else next();
    }
    add(sc.lines[i++]);
    if (i === sc.lines.length) nb.textContent = "Suivant";
    panel.appendChild(nb);
    wrap.appendChild(panel);
    n.appendChild(wrap);
  };

  R.positions = (sc, n) => {
    const after = sc.mode === "after";
    const store = after ? st.dA : st.dB;
    n.innerHTML = `<div class="solo wide"><h2 id="h-${sc.id}">${esc(sc.title)}</h2><p class="lead">${esc(sc.intro)}</p></div>`;
    const box = n.querySelector(".solo");
    if (!after) coach("Pour répondre, sélectionnez une option à la souris ou avec Tab puis Entrée. Vous pouvez changer d’avis tant que vous n’avez pas continué.", box);
    const list = el("div", { class: "dqs" });
    const ok = btn(after ? "Comparer" : "Continuer", () => { if (after) showCompare(); else next(); });
    ok.disabled = true;
    const check = () => { ok.disabled = DQ.some((d) => !store[d.id]); };
    DQ.forEach((d) => {
      const row = el("fieldset", { class: "dq" });
      row.innerHTML = `<legend><b>${d.id}.</b> ${esc(d.t)}</legend>`;
      const g = el("div", { class: "seg" });
      ["D’accord", "Pas d’accord", "Je ne sais pas"].forEach((o) => {
        const b = el("button", { type: "button", class: "segb" + (store[d.id] === o ? " sel" : ""), "aria-pressed": store[d.id] === o ? "true" : "false" }, o);
        b.addEventListener("click", () => { store[d.id] = o; g.querySelectorAll(".segb").forEach((x) => { x.classList.toggle("sel", x === b); x.setAttribute("aria-pressed", x === b); }); Snd.click(); check(); save(); });
        g.appendChild(b);
      });
      row.appendChild(g); list.appendChild(row);
    });
    box.append(list, ok);
    check();
    function showCompare() {
      Snd.page();
      list.innerHTML = "";
      DQ.forEach((d) => {
        const right = (d.truth === "Vrai" && store[d.id] === "D’accord") || (d.truth === "Faux" && store[d.id] === "Pas d’accord");
        const before = st.dB[d.id] || "—";
        const moved = before !== store[d.id];
        list.appendChild(el("div", { class: "cmp " + (right ? "good" : "mid") }, `<p class="q"><b>${d.id}.</b> ${esc(d.t)}</p>
          <p class="chips"><span class="chip">Lundi : ${esc(before)}</span><span class="chip">Vendredi : ${esc(store[d.id])}</span><span class="chip strong">${d.truth}</span>${moved ? '<span class="chip new">Évolution</span>' : ""}</p><p>${esc(d.why)}</p>`));
      });
      ok.remove();
      box.appendChild(btn("Voir mon bilan", next));
    }
  };

  R.hotspots = (sc, n) => {
    // « Œil de lynx » : trouver les points à risque dans le diorama, avec un chrono et des indices limités.
    const dio = A.dio && sc.spots.every((s) => s.key && A.dio.zones[s.key]) ? A.dio : null;
    const found = new Set(), seenDecoy = new Set();
    let hints = 0, left = sc.timer || 0, over = false, timerId = 0, decoys = 0;
    const need = sc.spots.filter((s) => s.real).length, maxHints = sc.hints == null ? 99 : sc.hints;
    const wrap = el("div", { class: "mapwrap lynx" });
    wrap.innerHTML = `<div class="maphead"><div><p class="kicker">Œil de lynx</p><h2 id="h-${sc.id}">${esc(sc.title)}</h2><p class="lead">${esc(sc.intro)}</p></div>
      <div class="lx-hud"><div class="counter" aria-live="polite"><span id="cnt">0</span> / ${need} trouvés</div>${left ? `<div class="lx-clock" role="timer" aria-label="Temps restant"><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="t0" cx="22" cy="22" r="19"/><circle class="t1" cx="22" cy="22" r="19" pathLength="100"/></svg><b id="lx-t">${left}</b></div>` : ""}</div></div>`;
    const map = el("div", { class: "map" + (dio ? " dio" : "") }, dio ? dioHTML() : A.map);
    if (dio) map.style.aspectRatio = String(dio.ratio);
    const card = el("div", { class: "spotcard", hidden: true, role: "dialog", "aria-modal": "false", "aria-labelledby": "spot-t" });
    sc.spots.forEach((s, i) => {
      const z = dio ? dio.zones[s.key] : s;
      const shape = dio && z.poly ? `;clip-path:polygon(${z.poly});z-index:${Math.round(z.d * 10)}` : "";
      const b = el("button", { class: "spot" + (dio ? " hidden-spot" : ""), type: "button", style: `left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%${shape}`, "aria-label": "Examiner : " + s.label },
        dio && z.pts ? `<svg class="zone-o" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="${z.pts}"/></svg><span class="tag">${esc(s.label)}</span>` : `<span class="ring"></span><span class="tag">${esc(s.label)}</span>`);
      b.addEventListener("click", () => open(s, i, b));
      map.appendChild(b);
    });
    const mapbox = el("div", { class: "mapbox" });
    mapbox.append(map, card);
    const bar = el("div", { class: "row" });
    const hb = btn(`Un indice (${maxHints})`, () => {
      if (hints >= maxHints) return;
      hints++; Snd.click(); hb.textContent = `Un indice (${maxHints - hints})`; if (hints >= maxHints) hb.disabled = true;
      const idx = sc.spots.findIndex((s, i) => s.real && !found.has(i));
      if (idx >= 0) { const b = map.querySelectorAll(".spot")[idx]; b.classList.add("hinted"); b.focus(); say("Regardez du côté de : " + sc.spots[idx].label); }
    }, "ghost");
    const nb = btn("Continuer", () => { stop(); next(); });
    nb.disabled = true;
    bar.append(hb, nb);
    wrap.append(mapbox, el("p", { class: "lx-swipe", "aria-hidden": "true" }, "Faites glisser le plan pour voir tout l’accueil."), bar);
    n.appendChild(wrap);
    requestAnimationFrame(() => { if (mapbox.scrollWidth > mapbox.clientWidth) mapbox.scrollLeft = (mapbox.scrollWidth - mapbox.clientWidth) / 2; });
    coach(dio ? "Les points à risque ne sont pas signalés : touchez les bâtiments et les lieux de l’accueil pour les examiner. Chaque lieu sans problème vous coûte 5 secondes." : "Sélectionnez un lieu du plan (ou Tab puis Entrée).", wrap);
    const clock = wrap.querySelector(".lx-clock");
    const tick = () => {
      if (over) return; left = Math.max(0, left - 1);
      const t = wrap.querySelector("#lx-t"); if (t) t.textContent = left;
      if (clock) { clock.querySelector(".t1").style.strokeDashoffset = (100 - (left / sc.timer) * 100).toFixed(1); clock.classList.toggle("hurry", left <= 20); }
      if (left <= 0) finish(true);
    };
    if (left) { const go = () => (timerId = setInterval(tick, 1000)); if (st.tut && st.tut.map) setTimeout(() => readyGate(wrap.querySelector(".maphead") || wrap, go, "Lancer le chrono"), 0); else go(); }
    function stop() { clearInterval(timerId); over = true; }
    function finish(timeout) {
      if (over && !timeout) return;
      stop();
      const nf = found.size;
      const stars = nf < need ? (nf >= need - 1 ? 1 : 0) : (hints === 0 && decoys <= 2 && left >= 30 ? 3 : hints <= 1 && decoys <= 4 ? 2 : 1);
      const q = Math.max(0, Math.min(1, nf / need - hints * 0.1 - Math.max(0, decoys - 3) * 0.05));
      record(sc, Math.round(q * 100) / 100);
      // révèle ce qui a été manqué
      sc.spots.forEach((s, i) => { if (s.real && !found.has(i)) map.querySelectorAll(".spot")[i].classList.add("missed"); });
      const res = el("div", { class: "lx-res", role: "status" }, `<div class="lx-stars" aria-label="${stars} étoile${stars > 1 ? "s" : ""} sur 3">${[1, 2, 3].map((k) => `<i class="${k <= stars ? "on" : ""}" style="--k:${k}"></i>`).join("")}</div>
        <div><b>${timeout && nf < need ? "Temps écoulé" : stars === 3 ? "Œil de lynx !" : "Tous les points sont repérés"}</b><p>${nf} point${nf > 1 ? "s" : ""} sur ${need} · ${hints} indice${hints > 1 ? "s" : ""} · ${decoys} lieu${decoys > 1 ? "x" : ""} sans problème ouvert${decoys > 1 ? "s" : ""}${sc.timer ? ` · ${sc.timer - left} s` : ""}${nf < need ? ". Les points manqués sont entourés en orange : ouvrez-les avant de continuer." : ""}</p></div>`);
      wrap.querySelector(".maphead").after(res);
      if (stars === 3) burst(res, "good");
      nb.disabled = false; hb.disabled = true;
      Voice.say("narr", stars === 3 ? "Œil de lynx ! Tous les points repérés, sans perdre de temps." : nf < need ? "Le temps est écoulé. Regardez les points que vous avez manqués." : "Tous les points sont repérés.");
      say(res.textContent);
    }
    function open(s, i, b) {
      Snd.click(); Voice.say(...VOICE_TXT.spot(s));
      b.classList.add("seen"); b.classList.remove("hinted", "missed");
      if (s.real) found.add(i);
      else if (!seenDecoy.has(i)) {
        seenDecoy.add(i); decoys++;
        if (!over && sc.timer && LV().pen) { left = Math.max(1, left - LV().pen); const f = el("span", { class: "lx-pen", "aria-hidden": "true" }, `−${LV().pen} s`); b.appendChild(f); setTimeout(() => f.remove(), 1200); }
      }
      $("#cnt", wrap).textContent = found.size;
      card.hidden = false;
      card.className = "spotcard " + (s.real ? "real" : "decoy");
      card.innerHTML = `<p class="kicker">${s.real ? "Point d’attention" : "Rien d’inquiétant"}${s.ref ? " · " + s.ref : ""}</p><h3 id="spot-t">${esc(s.title)}</h3><p>${esc(s.t)}</p><p class="lesson">${esc(s.lesson)}</p>`;
      const c = btn("Fermer", () => { card.hidden = true; b.focus(); }, "ghost small");
      card.appendChild(c); c.focus();
      if (s.real) { Snd.good(); burst(b, "good"); const c2 = $(".counter", wrap); c2.classList.remove("bump"); void c2.offsetWidth; c2.classList.add("bump"); } else Snd.mid();
      if (found.size >= need && !over) finish(false);
    }
  };

  function contextBlock(sc) {
    let h = kicker(sc.kicker);
    if (sc.context) h += `<p class="ctx">${esc(sc.context)}</p>`;
    if (sc.chat) {
      h += `<div class="phone" role="log" aria-label="Conversation de l’équipe"><div class="phead">Équipe Hautes Herbes · 6 membres</div>` +
        sc.chat.map((m, i) => `<div class="msg ${m.her ? "her" : ""}" style="animation-delay:${i * 0.25}s"><b>${esc(m.who)}</b><span>${esc(m.t)}</span></div>`).join("") + `</div>`;
    }
    return h;
  }
  function sideArt(sc) {
    return sc.npc ? portrait(sc.npc, sc.mood) : null;
  }

  R.choice = (sc, n) => {
    st.later = st.later || {};
    const wrap = el("div", { class: "duo" });
    const side = sideArt(sc);
    if (side) wrap.appendChild(el("div", { class: "side" })).appendChild(side);
    const panel = el("div", { class: "panel" });
    panel.innerHTML = contextBlock(sc) + `<h2 id="h-${sc.id}" class="prompt">${esc(sc.prompt)}</h2>`;
    const opts = el("div", { class: "opts" });
    const fbz = el("div", { class: "fbzone", "aria-live": "polite" });
    let done = false, tId = 0;
    // ordre des réponses mélangé (toujours le même pour un écran donné) : la bonne n'est pas toujours au même endroit
    const seed = [...sc.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7);
    const ord = sc.opts.map((o, k) => k).sort((x, y) => ((x * 37 + seed) % 11) - ((y * 37 + seed) % 11));
    ord.forEach((k, j) => {
      const o = sc.opts[k];
      const b = el("button", { class: "opt", type: "button", style: `--k:${j}`, "data-k": k }, `<span class="ol">${String.fromCharCode(65 + j)}</span><span>${esc(o.t)}</span>`);
      b.addEventListener("click", () => pick(o, b, k));
      opts.appendChild(b);
    });
    if (LV().help && st.res[sc.id] == null && sc.opts.length > 2) {
      const hb = btn("Indice : écarter une mauvaise réponse", () => {
        const bad = [...opts.querySelectorAll(".opt:not(:disabled)")].filter((x) => sc.opts[+x.dataset.k].q === 0);
        if (bad.length) { const x = bad[0]; x.disabled = true; x.classList.add("struck"); }
        hb.remove(); Snd.click();
      }, "ghost hint50");
      setTimeout(() => panel.insertBefore(hb, fbz), 0);
    }
    // Décision chronométrée : sur le terrain, l'hésitation a un coût.
    let bar = null;
    if (sc.timer && st.res[sc.id] == null && !calm()) {
      bar = el("div", { class: "qtimer", role: "timer", "aria-label": `${sc.timer} secondes pour décider` }, `<i style="animation-duration:${sc.timer}s"></i><span>${sc.timer} s pour décider</span>`);
      panel.appendChild(bar);
      let left = sc.timer;
      tId = setInterval(() => { left--; bar.querySelector("span").textContent = left > 0 ? `${left} s pour décider` : "Temps écoulé"; bar.classList.toggle("hurry", left <= 5); if (left <= 0) { clearInterval(tId); timeout(); } }, 1000);
    }
    panel.append(opts, fbz);
    wrap.appendChild(panel);
    if (!side) wrap.classList.add("one");
    n.appendChild(wrap);
    function timeout() {
      if (done) return; done = true;
      opts.querySelectorAll(".opt").forEach((x) => (x.disabled = true));
      record(sc, 0); Snd.low();
      fbz.innerHTML = `<div class="fb low"><p class="vt">Temps écoulé</p><p>Vous avez hésité trop longtemps. Sur le terrain, l’hésitation laisse l’enfant seul face au danger.</p>${sc.better ? `<p class="better"><b>Ce qu’il fallait faire.</b> ${esc(sc.better)}</p>` : ""}</div>`;
      const row = el("div", { class: "row" }); row.appendChild(btn("Continuer", next)); fbz.appendChild(row);
      Voice.say("narr", "Temps écoulé. Vous avez hésité trop longtemps : sur le terrain, l’hésitation laisse l’enfant seul face au danger.");
    }
    function pick(o, b, k) {
      if (done && !b) return;
      clearInterval(tId); if (bar) bar.classList.add("stop");
      opts.querySelectorAll(".opt").forEach((x) => (x.disabled = true));
      b.classList.add("chosen");
      if (sc.why && !b.dataset.tried) return justify(o, b, k);
      finish(o, b, k, null);
    }
    // Réponses nuancées : il faut aussi choisir la bonne justification.
    function justify(o, b, k) {
      fbz.innerHTML = "";
      const box = el("div", { class: "why" }, `<p class="kicker">${esc(sc.why.q || "Et pourquoi ?")}</p>`);
      const wo = el("div", { class: "opts why-opts" });
      const order = sc.why.opts.map((w, i) => i).sort((x, y) => ((x * 7 + sc.id.length) % 3) - ((y * 7 + sc.id.length) % 3));
      order.forEach((i, j) => { const w = sc.why.opts[i]; const wb = el("button", { class: "opt", type: "button", style: `--k:${j}` }, `<span class="ol">${j + 1}</span><span>${esc(w.t)}</span>`); wb.addEventListener("click", () => { wo.querySelectorAll(".opt").forEach((x) => (x.disabled = true)); wb.classList.add("chosen"); finish(o, b, k, w); }); wo.appendChild(wb); });
      box.appendChild(wo); fbz.appendChild(box);
      Voice.say("narr", sc.why.q || "Et pourquoi ?");
      wo.querySelector(".opt").focus({ preventScroll: true });
    }
    function finish(o, b, k, w) {
      done = true;
      const q = Math.round(o.q * (w && !w.ok ? 0.6 : 1) * 100) / 100;
      const first = st.res[sc.id] == null;
      record(sc, q, o);
      if (first) { st.later[sc.id] = { k, w: w ? sc.why.opts.indexOf(w) : -1 }; save(); }
      // réaction immédiate de la personne en face quand la réponse est mauvaise
      if (!sc.later && q < 0.5 && sc.npc) { World.upset(sc.npc); setMood(n, sc.npc, "angry"); }
      // Conséquences cachées : le verdict n'apparaît qu'au débrief de fin de chapitre.
      if (sc.later && first) {
        b.classList.add("picked", "neutral");
        fbz.innerHTML = `<div class="fb later"><p class="vt">Choix enregistré</p><p>Vous découvrirez plus tard, au débrief de Nour, ce que ce choix a produit.</p></div>`;
        const row = el("div", { class: "row" }); row.appendChild(btn("Continuer", next)); fbz.appendChild(row);
        Snd.click(); Voice.say("narr", "Choix enregistré. Vous découvrirez plus tard ce qu’il a produit.");
        fbz.querySelector(".fb").setAttribute("tabindex", "-1"); fbz.querySelector(".fb").focus({ preventScroll: false });
        return;
      }
      b.classList.add("picked", verdict(o.q).cls);
      if (o.mood && sc.npc) setMood(wrap, sc.npc, o.mood);
      const v = verdict(q); v.s();
      if (q >= 1) burst(b, "good");
      if (sc.npc) cheer(wrap, sc.npc, q);
      const wl = w ? `<p class="whyfb ${w.ok ? "ok" : "no"}"><b>${w.ok ? "Bonne justification." : "Justification fragile."}</b> ${esc(w.ok ? "Vous avez identifié la vraie raison." : w.no || "")}</p>` : "";
      fbz.innerHTML = `<div class="fb ${v.cls}"><p class="vt">${v.t}</p>${o.cons ? `<p class="cons"><b>Conséquence.</b> ${esc(o.cons)}</p>` : ""}<p><b>Ce que ça révèle.</b> ${esc(o.fb)}</p>${wl}${o.q < 1 && sc.better ? `<p class="better"><b>Pour faire mieux.</b> ${esc(sc.better)}</p>` : ""}</div>`;
      const row = el("div", { class: "row" });
      if (o.q < 1) row.appendChild(btn("Essayer une autre approche", () => {
        Snd.click(); fbz.innerHTML = ""; done = false; if (sc.npc) setMood(wrap, sc.npc, sc.mood || "smile");
        opts.querySelectorAll(".opt").forEach((x) => { x.disabled = x.classList.contains("picked"); if (x.classList.contains("picked")) { x.classList.add("tried"); x.dataset.tried = "1"; } x.classList.remove("picked", "chosen", "good", "mid", "low"); });
        opts.querySelector(".opt:not([disabled])").focus();
      }, "ghost"));
      row.appendChild(btn("Continuer", next));
      fbz.appendChild(row);
      say(v.t + ". " + (o.cons || "") + " " + o.fb);
      Voice.say(...VOICE_TXT.fb(sc, o));
      fbz.querySelector(".fb").setAttribute("tabindex", "-1"); fbz.querySelector(".fb").focus({ preventScroll: false });
    }
  };

  // Débrief de fin de chapitre : les conséquences des choix « cachés » se révèlent.
  function pressBox(list) {
    return el("div", { class: "press" }, `<p class="press-k">Inspiré de faits réels</p>` + list.map((p) => `<a class="press-a" href="${esc(p.u)}" target="_blank" rel="noopener noreferrer"><span>${esc(p.t)}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12"/></svg></a>`).join(""));
  }
  function debrief(ch) {
    const list = SCREENS.filter((x) => x.ch === ch && x.type === "choice" && x.later && st.later && st.later[x.id] != null);
    if (!list.length) return null;
    const box = el("section", { class: "debrief", "aria-label": "Ce que vos choix ont produit" }, `<p class="kicker">Le débrief de Nour</p><h3>Ce que vos choix ont produit</h3>`);
    const V = [];
    list.forEach((x) => {
      const r = st.later[x.id], o = x.opts[r.k], w = r.w >= 0 ? x.why.opts[r.w] : null, v = verdict(o.q);
      box.appendChild(el("div", { class: "db " + v.cls }, `<p class="db-k">${esc(x.kicker || "")}</p><p class="db-c">« ${esc(o.t)} »</p><p class="vt">${v.t}${w ? (w.ok ? " · bonne justification" : " · justification fragile") : ""}</p>${o.cons ? `<p><b>Ce qui s’est passé.</b> ${esc(o.cons)}</p>` : ""}<p>${esc(o.fb)}</p>${o.q < 1 && x.better ? `<p class="better"><b>Pour faire mieux.</b> ${esc(x.better)}</p>` : ""}`));
      V.push(VOICE_TXT.fb(x, o));
    });
    return { box, V };
  }

  R.dialogue = (sc, n) => {
    const wrap = el("div", { class: "duo dlg" });
    const side = el("div", { class: "side" });
    if (sc.scene) side.appendChild(scenePanel(sc.scene, " small"));
    side.appendChild(portrait(sc.npc, sc.nodes[sc.start].mood));
    // Jauge de confiance : chaque réponse rapproche ou éloigne le personnage.
    let trust = 55;
    const tg = el("div", { class: "trust", role: "meter", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "55", "aria-label": "Confiance de " + NAMES[sc.npc] }, `<span>Confiance de ${esc(NAMES[sc.npc])}</span><div class="tg"><i style="width:55%"></i></div><b class="td"></b>`);
    side.appendChild(tg);
    const setTrust = (d) => {
      trust = Math.max(4, Math.min(100, trust + d));
      tg.querySelector("i").style.width = trust + "%"; tg.setAttribute("aria-valuenow", String(Math.round(trust)));
      tg.classList.toggle("low", trust < 35); tg.classList.toggle("high", trust >= 75);
      const t = tg.querySelector(".td"); t.textContent = d > 0 ? "+" : d < 0 ? "−" : ""; t.className = "td " + (d > 0 ? "up" : d < 0 ? "down" : ""); void t.offsetWidth; t.classList.add("pop");
    };
    wrap.appendChild(side);
    const panel = el("div", { class: "panel" });
    panel.innerHTML = `<h2 id="h-${sc.id}" class="dtitle">${esc(sc.title)}</h2>`;
    const log = el("div", { class: "log", role: "log", "aria-live": "polite" });
    const opts = el("div", { class: "opts" });
    panel.append(log, opts);
    wrap.appendChild(panel);
    n.appendChild(wrap);
    const qs = []; let flags = {}, pend = null;
    let cur = sc.start;
    if (sc.intro) { log.appendChild(el("p", { class: "narr" }, words(sc.intro))); n.dataset.novoice = "1"; }
    show(sc.start);
    function show(id) {
      cur = id;
      const nd = sc.nodes[id];
      setMood(wrap, sc.npc, nd.mood || "smile");
      if (nd.narr) log.appendChild(el("p", { class: "narr" }, words(nd.narr)));
      opts.innerHTML = "";
      const write = () => {
        const bub = log.appendChild(el("div", { class: "say npc" }, `<b>${NAMES[sc.npc]}</b><p>${words(nd.t)}</p>`));
        if (pend) {   // conséquence immédiate : la réaction, puis l'explication du narrateur
          const v = verdict(pend.q), nn = el("div", { class: "note " + v.cls }, `<b>${sc.parent ? "Ce qui s’est passé :" : "Nour, à voix basse :"}</b> <span>${esc(pend.note)}</span>`);
          log.appendChild(nn); v.s();
          Voice.seq([[sc.npc, nd.t, bub], ["narr", pend.note, nn.querySelector("span")]]); pend = null;
        } else if (id === sc.start && sc.intro) Voice.seq([["narr", sc.intro, log.querySelector(".narr")], [sc.npc, nd.t, bub]]); else Voice.say(sc.npc, nd.t, bub);
        log.scrollTop = log.scrollHeight;
        if (nd.end) return finish(nd);
        drawOpts();
      };
      if (calm() || id === sc.start) return write();
      const typing = el("div", { class: "say npc typingb", "aria-hidden": "true" }, "<span></span><span></span><span></span>");
      log.appendChild(typing); log.scrollTop = log.scrollHeight;
      setTimeout(() => { typing.remove(); write(); }, 700);
    }
    function drawOpts() {
      const nd = sc.nodes[cur];
      nd.opts.forEach((o, k) => {
        const b = el("button", { class: "opt say-opt", type: "button", style: `--k:${k}` }, `<span>${esc(o.t)}</span>`);
        b.addEventListener("click", () => {
          opts.querySelectorAll("button").forEach((x) => (x.disabled = true));
          Snd.click(); qs.push(o.q); if (o.flag) flags[o.flag] = true; setTrust(Math.round((o.q - 0.5) * 44));
          log.appendChild(el("div", { class: "say me" }, `<b>${esc(st.name || "Vous")}</b><p>${esc(o.t)}</p>`));
          if (o.note) { pend = o; if (o.q < 0.5) World.upset(sc.npc); }
          else if (o.q >= 1) burst(b, "good");
          cheer(wrap, sc.npc, o.q);
          opts.innerHTML = "";
          setTimeout(() => show(o.to), st.settings.calm ? 0 : 380);
        });
        opts.appendChild(b);
      });
      const f = opts.querySelector("button"); if (f && cur !== sc.start) f.focus({ preventScroll: true });
    }
    function finish(nd) {
      const q = qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : 1;
      const firstTry = st.res[sc.id] == null;
      record(sc, Math.round(q * 100) / 100);
      if (firstTry) Object.keys(flags).forEach((k) => (st.flags[k] = true));
      if (firstTry) { st.trust = st.trust || {}; st.trust[sc.npc] = Math.round(trust); }
      save();
      const v = verdict(q >= 0.9 ? 1 : q >= 0.5 ? 0.5 : 0); v.s();
      if (q >= 0.9) setTimeout(() => burst(log.lastElementChild, "good"), 100);
      const box = el("div", { class: "fb " + v.cls }, `<p class="vt">${q >= 0.9 ? "Échange réussi" : q >= 0.5 ? "Échange rattrapé" : "Échange à retravailler"}</p><p><b>À retenir.</b> ${esc(nd.lesson)}</p>`);
      const row = el("div", { class: "row" });
      row.append(btn("Rejouer cet échange", () => { Snd.click(); render(1); }, "ghost"), btn("Continuer", next));
      box.appendChild(row);
      opts.appendChild(box);
      box.setAttribute("tabindex", "-1"); box.focus();
      say("À retenir. " + nd.lesson);
    }
  };

  // « Réflexes » : tri rapide par glissement (2 ou 3 catégories), série et chrono par carte.
  R.reflex = (sc, n) => {
    const per = sc.speed || 9, items = sc.items.map((it, i) => ({ ...it, i })), res = [];
    let k = 0, streak = 0, best = 0, tId = 0, t0 = 0, busy = false;
    const dirs = sc.cats.length === 2 ? ["left", "right"] : ["left", "up", "right"];
    const keys = sc.cats.length === 2 ? ["ArrowLeft", "ArrowRight"] : ["ArrowLeft", "ArrowUp", "ArrowRight"];
    const wrap = el("div", { class: "solo wide reflex" });
    wrap.innerHTML = contextBlock(sc) + `<div class="rx-head"><div><p class="kicker">Réflexes</p><h2 id="h-${sc.id}" class="prompt">${esc(sc.prompt)}</h2></div><div class="rx-stat"><span class="rx-prog">1 / ${items.length}</span><span class="rx-streak" aria-live="polite"></span></div></div>
      <div class="rx-stage"><div class="rx-card" tabindex="-1"><div class="rx-time"><i></i></div><p class="rx-t"></p><p class="rx-why" hidden></p></div></div>
      <div class="rx-cats">${sc.cats.map((c, j) => `<button type="button" class="rx-cat c${j}" data-j="${j}"><span class="rx-k">${["←", sc.cats.length === 2 ? "→" : "↑", "→"][j]}</span>${esc(c.label)}</button>`).join("")}</div>
      <p class="small rx-help">Glissez la carte, touchez une catégorie ou utilisez les flèches du clavier.</p>`;
    n.appendChild(wrap);
    const card = wrap.querySelector(".rx-card"), tbar = wrap.querySelector(".rx-time i");
    const show = () => {
      const it = items[k]; busy = false;
      card.className = "rx-card in"; card.style.transform = "";
      card.querySelector(".rx-t").textContent = it.t; card.querySelector(".rx-why").hidden = true;
      wrap.querySelector(".rx-prog").textContent = `${k + 1} / ${items.length}`;
      tbar.style.animation = "none"; void tbar.offsetWidth; tbar.style.animation = `rxtime ${per}s linear forwards`;
      t0 = performance.now(); clearTimeout(tId); tId = setTimeout(() => answer(-1), per * 1000);
      say(it.t);
    };
    function answer(j) {
      if (busy) return; busy = true; clearTimeout(tId);
      const it = items[k], ok = j >= 0 && sc.cats[j].id === it.cat, ms = performance.now() - t0;
      res.push({ it, j, ok, ms });
      const right = sc.cats.findIndex((c) => c.id === it.cat);
      if (ok) {
        streak++; best = Math.max(best, streak); Snd.good();
        card.className = "rx-card out-" + dirs[j];
        const sk = wrap.querySelector(".rx-streak"); sk.textContent = streak >= 2 ? `Série ×${streak}` : ""; sk.classList.remove("pop"); void sk.offsetWidth; if (streak >= 2) sk.classList.add("pop");
        setTimeout(nextCard, 420);
      } else {
        streak = 0; Snd.low(); wrap.querySelector(".rx-streak").textContent = "";
        card.className = "rx-card shake";
        const w = card.querySelector(".rx-why"); w.hidden = false;
        w.innerHTML = `<b>${j < 0 ? "Trop tard" : "Non"} : ${esc(sc.cats[right].label)}.</b> ${esc(it.why)}`;
        wrap.querySelectorAll(".rx-cat")[right].classList.add("hint");
        setTimeout(() => { wrap.querySelectorAll(".rx-cat").forEach((x) => x.classList.remove("hint")); nextCard(); }, 2600);
      }
    }
    function nextCard() { k++; if (k < items.length) show(); else end(); }
    function end() {
      clearTimeout(tId); document.removeEventListener("keydown", onKey);
      const good = res.filter((r) => r.ok).length, q = good / items.length, avg = res.reduce((a, r) => a + r.ms, 0) / res.length / 1000;
      const stars = q === 1 && avg < per * 0.5 ? 3 : q >= 0.85 ? 2 : q >= 0.6 ? 1 : 0;
      record(sc, Math.round(q * 100) / 100); st.stars = st.stars || {}; st.stars[sc.id] = Math.max(st.stars[sc.id] || 0, stars); save();
      wrap.querySelector(".rx-stage").remove(); wrap.querySelector(".rx-cats").remove(); wrap.querySelector(".rx-help").remove();
      const sum = el("div", { class: "rx-end" }, `<div class="lx-res"><div class="lx-stars" aria-label="${stars} étoile${stars > 1 ? "s" : ""} sur 3">${[1, 2, 3].map((x) => `<i class="${x <= stars ? "on" : ""}" style="--k:${x}"></i>`).join("")}</div><div><b>${good} sur ${items.length}</b><p>Meilleure série : ${best} · temps moyen : ${avg.toFixed(1)} s par carte</p></div></div>
        <ul class="rx-list">${res.map((r) => `<li class="${r.ok ? "ok" : "ko"}"><span>${esc(r.it.t)}</span><b>${esc(sc.cats.find((c) => c.id === r.it.cat).label)}</b><small>${esc(r.it.why)}</small></li>`).join("")}</ul>`);
      wrap.appendChild(sum);
      const row = el("div", { class: "row" }); row.appendChild(btn("Continuer", next)); wrap.appendChild(row);
      if (stars === 3) burst(sum, "good");
      Voice.say("narr", stars === 3 ? "Réflexes impeccables : tout juste, et sans hésiter." : good === items.length ? "Tout juste. Relisez les explications." : "Relisez les explications des cartes manquées.");
      row.querySelector(".cta").focus({ preventScroll: true });
    }
    wrap.querySelectorAll(".rx-cat").forEach((b) => b.addEventListener("click", () => answer(+b.dataset.j)));
    const onKey = (e) => { const j = keys.indexOf(e.key); if (j >= 0 && document.body.contains(wrap)) { e.preventDefault(); answer(j); } };
    document.addEventListener("keydown", onKey);
    // glisser la carte
    let sx = 0, sy = 0, drag = false;
    card.addEventListener("pointerdown", (e) => { if (busy) return; drag = true; sx = e.clientX; sy = e.clientY; card.setPointerCapture(e.pointerId); card.classList.add("drag"); });
    card.addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - sx, dy = e.clientY - sy; card.style.transform = `translate(${dx}px,${Math.min(0, dy)}px) rotate(${dx / 18}deg)`; });
    card.addEventListener("pointerup", (e) => {
      if (!drag) return; drag = false; card.classList.remove("drag");
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 90) answer(dx < 0 ? 0 : sc.cats.length - 1);
      else if (sc.cats.length === 3 && dy < -90) answer(1);
      else card.style.transform = "";
    });
    readyGate(wrap.querySelector(".rx-stage") || wrap, () => setTimeout(show, 250), "Commencer le tri");
  };

  R.sort = (sc, n) => {
    const wrap = el("div", { class: "solo wide" });
    wrap.innerHTML = contextBlock(sc) + `<h2 id="h-${sc.id}" class="prompt">${esc(sc.prompt)}</h2>`;
    const ans = {};
    let checked = false, firstScore = null;
    const list = el("div", { class: "sorts" });
    sc.items.forEach((it, i) => {
      const row = el("fieldset", { class: "sortrow" });
      row.innerHTML = `<legend>${esc(it.t)}</legend>`;
      const g = el("div", { class: "seg" });
      sc.cats.forEach((c) => {
        const b = el("button", { type: "button", class: "segb", "aria-pressed": "false" }, esc(c.label));
        b.addEventListener("click", () => {
          if (row.classList.contains("ok")) return;
          ans[i] = c.id; Snd.click();
          g.querySelectorAll(".segb").forEach((x) => { x.classList.toggle("sel", x === b); x.setAttribute("aria-pressed", x === b); });
          row.classList.remove("ko"); const w = row.querySelector(".why"); if (w) w.remove();
          vb.disabled = Object.keys(ans).length < sc.items.length;
        });
        g.appendChild(b);
      });
      row.appendChild(g); list.appendChild(row);
    });
    const fbz = el("div", { class: "fbzone", "aria-live": "polite" });
    const row = el("div", { class: "row" });
    const hb = btn("Un indice ?", () => { Snd.click(); fbz.innerHTML = `<div class="fb info"><p><b>Indice.</b> ${esc(sc.hint)}</p></div>`; }, "ghost");
    const vb = btn("Vérifier", check); vb.disabled = true;
    row.append(hb, vb);
    wrap.append(list, fbz, row);
    n.appendChild(wrap);
    function check() {
      let good = 0;
      list.querySelectorAll(".sortrow").forEach((r, i) => {
        const it = sc.items[i], ok = ans[i] === it.cat;
        if (ok) good++;
        r.classList.toggle("ok", ok); r.classList.toggle("ko", !ok);
        const old = r.querySelector(".why"); if (old) old.remove();
        if (ok) r.appendChild(el("p", { class: "why" }, "✓ " + esc(it.why)));
        else r.appendChild(el("p", { class: "why" }, "Pas tout à fait. Essayez une autre réponse."));
        if (ok) r.querySelectorAll(".segb").forEach((x) => (x.disabled = !x.classList.contains("sel")));
      });
      const q = good / sc.items.length;
      if (firstScore == null) { firstScore = q; record(sc, Math.round(q * 100) / 100); }
      const v = verdict(q === 1 ? 1 : q >= 0.6 ? 0.5 : 0); v.s();
      fbz.innerHTML = `<div class="fb ${v.cls}"><p class="vt">${good} sur ${sc.items.length}</p><p>${q === 1 ? "Tout est juste. Relisez les explications sous chaque ligne." : "Corrigez les lignes signalées : l’explication s’affiche quand la réponse est juste."}</p></div>`;
      say(`${good} réponses justes sur ${sc.items.length}.`);
      if (q === 1) { burst(fbz.querySelector(".fb"), "good"); vb.remove(); hb.remove(); row.appendChild(btn("Continuer", next)); row.querySelector(".cta").focus(); }
      else { vb.textContent = "Vérifier à nouveau"; const k = list.querySelector(".ko .segb"); if (k) k.focus(); }
    }
  };

  // « Crise en temps réel » : agir dans le bon ordre pendant que d'autres demandes arrivent.
  R.crisis = (sc, n) => {
    const C = sc.crisis, done = [], evRes = {};
    let left = C.secs, tId = 0, over = false, elapsed = 0, pending = null;
    const wrap = el("div", { class: "solo wide crisis" });
    wrap.innerHTML = `<div class="cr-head"><div><p class="kicker">Crise en temps réel · ${esc(sc.kicker || "")}</p><h2 id="h-${sc.id}" class="prompt">Protéger Lou, maintenant</h2><p class="lead">${esc(C.intro)}</p></div>
      <div class="cr-clock" role="timer"><b class="cr-time">${C.start}</b><span class="cr-left">${left} s</span><div class="cr-bar"><i></i></div></div></div>
      <div class="cr-grid"><div class="cr-acts" role="group" aria-label="Actions possibles"></div><ol class="cr-log" aria-label="Ce que vous avez fait"></ol></div><div class="cr-ev" aria-live="assertive"></div>`;
    n.appendChild(wrap);
    const acts = wrap.querySelector(".cr-acts"), log = wrap.querySelector(".cr-log"), evz = wrap.querySelector(".cr-ev");
    const shuffled = [3, 1, 4, 0, 2].filter((i) => i < sc.items.length);
    shuffled.forEach((i) => {
      const it = sc.items[i];
      const b = el("button", { class: "cr-act", type: "button" }, `<span>${esc(it.t)}</span>`);
      b.addEventListener("click", () => { if (over || pending) return; b.disabled = true; b.classList.add("done"); done.push(i); Snd.click(); log.appendChild(el("li", {}, `<b>${clockAt(elapsed)}</b> ${esc(it.t)}`)); if (done.length === sc.items.length) finish(); });
      acts.appendChild(b);
    });
    function clockAt(sec) { const [h, m] = C.start.replace(" h ", ":").split(":").map(Number); const t = h * 60 + m + Math.floor(sec / 6); return `${Math.floor(t / 60)} h ${String(t % 60).padStart(2, "0")}`; }
    const tick = () => {
      if (over) return;
      if (!pending) { left--; elapsed++; }
      wrap.querySelector(".cr-left").textContent = `${left} s`; wrap.querySelector(".cr-time").textContent = clockAt(elapsed);
      wrap.querySelector(".cr-bar i").style.transform = `scaleX(${(left / C.secs).toFixed(3)})`;
      wrap.querySelector(".cr-clock").classList.toggle("hurry", left <= 15);
      const ev = C.events.find((e, j) => e.at === elapsed && evRes[j] == null && !pending);
      if (ev) raise(ev, C.events.indexOf(ev));
      if (left <= 0) finish();
    };
    function raise(ev, j) {
      pending = j; Snd.mid(); Voice.say("narr", ev.t);
      const card = el("div", { class: "cr-pop", role: "alertdialog", "aria-label": "Nouvelle demande" }, `<p class="kicker">Interruption</p><p class="cr-q">${esc(ev.t)}</p>`);
      const row = el("div", { class: "cr-opts" });
      ev.opts.forEach((o) => { const b = el("button", { class: "opt", type: "button" }, `<span>${esc(o.t)}</span>`); b.addEventListener("click", () => { evRes[j] = o; pending = null; card.classList.add(o.ok ? "ok" : "ko"); card.querySelector(".cr-opts").remove(); card.appendChild(el("p", { class: "cr-r" }, o.ok ? "Bien vu : vous restez avec Lou." : esc(o.no || ""))); if (!o.ok) { left = Math.max(1, left - 8); Snd.low(); } else Snd.good(); setTimeout(() => card.remove(), o.ok ? 1400 : 2800); }); row.appendChild(b); });
      card.appendChild(row); evz.appendChild(card); row.querySelector(".opt").focus({ preventScroll: true });
    }
    readyGate(wrap, () => { tId = setInterval(tick, 1000); });
    function finish() {
      if (over) return; over = true; clearInterval(tId); evz.innerHTML = "";
      // ordre : pénalité pour chaque action prioritaire faite après une action moins prioritaire
      let inv = 0, pairs = 0;
      for (let a = 0; a < done.length; a++) for (let b = a + 1; b < done.length; b++) { const ga = sc.items[done[a]].g, gb = sc.items[done[b]].g; if (ga !== gb) { pairs++; if (ga > gb) inv++; } }
      const orderScore = (done.length / sc.items.length) * (pairs ? 1 - inv / pairs : 1);
      const evOk = C.events.filter((e, j) => evRes[j] && evRes[j].ok).length, evScore = evOk / C.events.length;
      const q = Math.round((orderScore * 0.65 + evScore * 0.35) * 100) / 100;
      const stars = q >= 0.95 && left >= 20 ? 3 : q >= 0.8 ? 2 : q >= 0.5 ? 1 : 0;
      record(sc, q); st.stars = st.stars || {}; st.stars[sc.id] = Math.max(st.stars[sc.id] || 0, stars); save();
      acts.querySelectorAll("button").forEach((b) => (b.disabled = true));
      const ideal = sc.items.map((it, i) => i).sort((a, b) => sc.items[a].g - sc.items[b].g);
      const res = el("div", { class: "cr-end" }, `<div class="lx-res"><div class="lx-stars" aria-label="${stars} étoile${stars > 1 ? "s" : ""} sur 3">${[1, 2, 3].map((x) => `<i class="${x <= stars ? "on" : ""}" style="--k:${x}"></i>`).join("")}</div><div><b>${stars === 3 ? "Crise maîtrisée" : "Fin de la séquence"}</b><p>${done.length} action${done.length > 1 ? "s" : ""} sur ${sc.items.length} · ${evOk} interruption${evOk > 1 ? "s" : ""} bien gérée${evOk > 1 ? "s" : ""} sur ${C.events.length} · terminé à ${clockAt(elapsed)}</p></div></div>
        <h3>L’ordre qui protège</h3><ol class="sol">${ideal.map((i) => `<li><b>${esc(sc.items[i].t)}</b> · ${esc(sc.items[i].why)}</li>`).join("")}</ol>
        ${C.events.map((e, j) => { const r = evRes[j]; const good = e.opts.find((o) => o.ok); return `<p class="cr-sum ${r && r.ok ? "ok" : "ko"}"><b>${esc(e.t)}</b> ${r ? (r.ok ? "Bien géré." : esc(r.no || "")) : "Pas de réponse."} ${!r || !r.ok ? "La bonne réponse : " + esc(good.t) + "." : ""}</p>`; }).join("")}`);
      wrap.appendChild(res);
      const row = el("div", { class: "row" }); row.appendChild(btn("Continuer", next)); wrap.appendChild(row);
      if (stars === 3) burst(res, "good");
      Voice.say("narr", stars === 3 ? "Crise maîtrisée : Lou est protégé, et vous êtes resté concentré." : q >= 0.5 ? "Lou est protégé. Relisez ce qui aurait pu être plus rapide ou plus sûr." : "Relisez le déroulé : dans l’urgence, l’ordre des actions protège.");
      row.querySelector(".cta").focus({ preventScroll: true });
    }
  };

  R.order = (sc, n) => {
    const wrap = el("div", { class: "solo wide" });
    wrap.innerHTML = kicker(sc.kicker) + `<h2 id="h-${sc.id}" class="prompt">${esc(sc.prompt)}</h2>`;
    let order = sc.items.map((_, i) => i);
    // mélange déterministe mais non trivial
    order = [3, 1, 4, 0, 2].filter((i) => i < sc.items.length);
    const ol = el("ol", { class: "order" });
    const fbz = el("div", { class: "fbzone", "aria-live": "polite" });
    let firstScore = null;
    function draw(focusIdx, dir) {
      ol.innerHTML = "";
      order.forEach((ii, pos) => {
        const it = sc.items[ii];
        const li = el("li", { class: "ord" }, `<span class="pos">${pos + 1}</span><span class="ot">${esc(it.t)}</span>`);
        const up = el("button", { type: "button", class: "arr", "aria-label": `Monter : ${it.t}`, disabled: pos === 0 }, "↑");
        const dn = el("button", { type: "button", class: "arr", "aria-label": `Descendre : ${it.t}`, disabled: pos === order.length - 1 }, "↓");
        up.addEventListener("click", () => move(pos, -1));
        dn.addEventListener("click", () => move(pos, 1));
        li.append(up, dn);
        ol.appendChild(li);
      });
      if (focusIdx != null) { const li = ol.children[focusIdx]; const b = li && li.querySelectorAll(".arr")[dir < 0 ? 0 : 1]; if (b && !b.disabled) b.focus(); else if (li) li.querySelector(".arr:not([disabled])").focus(); }
    }
    function move(pos, d) {
      const np = pos + d; if (np < 0 || np >= order.length) return;
      [order[pos], order[np]] = [order[np], order[pos]]; Snd.click(); draw(np, d);
      say(`${sc.items[order[np]].t} : position ${np + 1}`);
    }
    draw();
    const row = el("div", { class: "row" });
    const vb = btn("Vérifier l’ordre", () => {
      let pairs = 0, okp = 0;
      for (let a = 0; a < order.length; a++) for (let b = a + 1; b < order.length; b++) { const ga = sc.items[order[a]].g, gb = sc.items[order[b]].g; if (ga !== gb) { pairs++; if (ga < gb) okp++; } }
      const q = pairs ? okp / pairs : 1;
      if (firstScore == null) { firstScore = q; record(sc, Math.round(q * 100) / 100); }
      const v = verdict(q === 1 ? 1 : q >= 0.7 ? 0.5 : 0); v.s();
      const sorted = sc.items.map((it, i) => i).sort((a, b) => sc.items[a].g - sc.items[b].g);
      fbz.innerHTML = `<div class="fb ${v.cls}"><p class="vt">${q === 1 ? "Ordre pertinent" : "Ordre à ajuster"}</p><p>Un ordre possible :</p><ol class="sol">${sorted.map((i) => `<li><b>${esc(sc.items[i].t)}</b> · ${esc(sc.items[i].why)}</li>`).join("")}</ol><p>Les actions urgentes n’attendent pas l’écrit. Appeler le 17 et prévenir la direction peuvent se faire en même temps.</p></div>`;
      say(v.t);
      if (q === 1) { burst(fbz.querySelector(".fb"), "good"); ol.querySelectorAll(".ord").forEach((li, i) => { li.style.setProperty("--k", i); li.classList.add("okwave"); }); }
      row.innerHTML = "";
      if (q < 1) row.appendChild(btn("Réessayer", () => { Snd.click(); fbz.innerHTML = ""; row.innerHTML = ""; row.appendChild(vb); }, "ghost"));
      row.appendChild(btn("Continuer", next));
      fbz.querySelector(".fb").setAttribute("tabindex", "-1"); fbz.querySelector(".fb").focus();
    });
    row.appendChild(vb);
    wrap.append(ol, fbz, row);
    n.appendChild(wrap);
  };

  R.multi = (sc, n) => {
    const wrap = el("div", { class: "duo" });
    const side = sideArt(sc);
    if (side) wrap.appendChild(el("div", { class: "side" })).appendChild(side); else wrap.classList.add("one");
    const panel = el("div", { class: "panel" });
    panel.innerHTML = contextBlock(sc) + `<h2 id="h-${sc.id}" class="prompt">${esc(sc.prompt)}</h2>`;
    const sel = new Set();
    const opts = el("div", { class: "opts multi", role: "group", "aria-label": sc.prompt });
    sc.opts.forEach((o, i) => {
      const b = el("button", { class: "opt chk", type: "button", "aria-pressed": "false" }, `<span class="box" aria-hidden="true"></span><span>${esc(o.t)}</span>`);
      b.addEventListener("click", () => { if (sel.has(i)) sel.delete(i); else sel.add(i); b.classList.toggle("sel"); b.setAttribute("aria-pressed", sel.has(i)); Snd.click(); vb.disabled = sel.size === 0; });
      opts.appendChild(b);
    });
    const fbz = el("div", { class: "fbzone", "aria-live": "polite" });
    const row = el("div", { class: "row" });
    const vb = btn("Valider", () => {
      const nOk = sc.opts.filter((o) => o.ok).length;
      let tp = 0, fp = 0;
      opts.querySelectorAll(".opt").forEach((b, i) => {
        const o = sc.opts[i], s = sel.has(i);
        if (s && o.ok) tp++; if (s && !o.ok) fp++;
        b.disabled = true;
        b.classList.add(o.ok ? "isok" : "isno");
        if (s !== o.ok) b.classList.add("miss");
        b.appendChild(el("span", { class: "why" }, (o.ok ? "✓ À retenir : " : "✕ À écarter : ") + esc(o.why)));
      });
      const q = Math.max(0, (tp - fp) / nOk);
      record(sc, Math.round(q * 100) / 100);
      const v = verdict(q >= 1 ? 1 : q >= 0.5 ? 0.5 : 0); v.s();
      if (q >= 1) setTimeout(() => burst(fbz.querySelector(".fb"), "good"), 50);
      if (sc.npc) cheer(wrap, sc.npc, q);
      fbz.innerHTML = `<div class="fb ${v.cls}"><p class="vt">${v.t}</p><p>${tp} bonne${tp > 1 ? "s" : ""} réponse${tp > 1 ? "s" : ""} sur ${nOk}${fp ? `, ${fp} à écarter cochée${fp > 1 ? "s" : ""}` : ""}. Les explications sont sous chaque proposition.</p>${sc.after ? `<p class="better"><b>Et ensuite.</b> ${esc(sc.after)}</p>` : ""}</div>`;
      row.innerHTML = "";
      row.appendChild(btn("Continuer", next));
      say(v.t);
      fbz.querySelector(".fb").setAttribute("tabindex", "-1"); fbz.querySelector(".fb").focus();
    });
    vb.disabled = true;
    row.appendChild(vb);
    panel.append(opts, fbz, row);
    wrap.appendChild(panel);
    n.appendChild(wrap);
  };

  R.build = (sc, n) => {
    const wrap = el("div", { class: "solo wide" });
    wrap.innerHTML = `<h2 id="h-${sc.id}" class="prompt">${esc(sc.title)}</h2><p class="lead">Étape 1 : choisissez le point repéré lundi que vous voulez améliorer.</p>`;
    const g = el("div", { class: "sits" });
    BUILD.sits.forEach((s) => {
      const b = el("button", { class: "sit", type: "button" }, `<div class="sart">${(A.rooms[{ S01: "radio", S17: "equipe", S14: "soins", S15: "direction" }[s.scene]] || A.rooms.equipe).svg}</div><b>${esc(s.title)}</b>`);
      b.addEventListener("click", () => { Snd.click(); step2(s); });
      g.appendChild(b);
    });
    wrap.appendChild(g);
    n.appendChild(wrap);
    function step2(s) {
      wrap.innerHTML = `<p class="kicker">${esc(s.title)}</p><h2 id="h-${sc.id}" class="prompt" tabindex="-1">Construisez votre mesure</h2><p class="lead">Une mesure qui se voit : un changement, une personne responsable, un moment, un indicateur observable.</p>`;
      const slots = [["change", "Quel changement concret ?", s.change], ["resp", BUILD.common.resp.label, BUILD.common.resp.opts], ["when", BUILD.common.when.label, BUILD.common.when.opts], ["ind", "Quel indicateur observerez-vous ?", s.ind]];
      const pick = {};
      const canvas = el("div", { class: "canvas" });
      slots.forEach(([k, label, opts], si) => {
        const f = el("fieldset", { class: "slot" });
        f.innerHTML = `<legend><span class="sn">${si + 1}</span>${esc(label)}</legend>`;
        opts.forEach((o, i) => {
          const b = el("button", { type: "button", class: "opt radio", "aria-pressed": "false" }, `<span class="dotr" aria-hidden="true"></span><span>${esc(o.t)}</span>`);
          b.addEventListener("click", () => { pick[k] = i; f.querySelectorAll(".opt").forEach((x) => { x.classList.toggle("sel", x === b); x.setAttribute("aria-pressed", x === b); }); Snd.click(); vb.disabled = Object.keys(pick).length < 4; });
          f.appendChild(b);
        });
        canvas.appendChild(f);
      });
      const fbz = el("div", { class: "fbzone", "aria-live": "polite" });
      const row = el("div", { class: "row" });
      const vb = btn("Tester ma mesure", () => {
        let sum = 0; const out = [];
        slots.forEach(([k, label, opts]) => { const o = opts[pick[k]]; sum += o.q; out.push(`<li class="${verdict(o.q).cls}"><b>${esc(label)}</b> ${esc(o.fb)}</li>`); });
        const q = sum / 4; record(sc, Math.round(q * 100) / 100);
        st.build = { sit: s.title, change: s.change[pick.change].t, ind: s.ind[pick.ind].t, q }; save();
        const v = verdict(q >= 0.9 ? 1 : q >= 0.5 ? 0.5 : 0); v.s();
        canvas.querySelectorAll(".opt").forEach((x) => (x.disabled = true));
        if (q >= 0.9) setTimeout(() => burst(fbz.querySelector(".fb"), "good"), 50);
        fbz.innerHTML = `<div class="fb ${v.cls}"><p class="vt">${q >= 0.9 ? "Mesure applicable et vérifiable" : "Mesure à renforcer"}</p><ul class="slotfb">${out.join("")}</ul></div>`;
        row.innerHTML = "";
        if (q < 0.9) row.appendChild(btn("Améliorer ma mesure", () => { Snd.click(); step2(s); }, "ghost"));
        row.appendChild(btn("Continuer", next));
        fbz.querySelector(".fb").setAttribute("tabindex", "-1"); fbz.querySelector(".fb").focus();
        say(v.t);
      });
      vb.disabled = true;
      row.appendChild(vb);
      wrap.append(canvas, fbz, row);
      wrap.querySelector("h2").focus();
    }
  };

  R.explain = (sc, n) => {
    const p = sc.page;
    const isNew = !st.carnet.includes(sc.id);
    if (isNew) { st.carnet.push(sc.id); save(); }
    hud(true);
    n.innerHTML = `<div class="page-note"><div class="pn-ant">${A.chars.nour.big}</div><div class="pn-body"><p class="kicker">${isNew ? "Nouvelle page dans votre carnet" : "Page du carnet"}</p><h2 id="h-${sc.id}">${esc(p.title)}</h2>${p.quote ? `<blockquote>${esc(p.quote)}</blockquote>` : ""}<ul>${p.pts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="refs">${p.refs.map((r) => `<span class="chip">${esc(r)}</span>`).join("")}</p></div></div>`;
    n.querySelector(".pn-body").appendChild(btn(st.idx + 1 < SCREENS.length && SCREENS[st.idx + 1].type === "chapter" ? "Finir la journée" : "Continuer", next));
    if (!sc.nuitee) { const d = debrief(sc.ch); if (d) { n.prepend(d.box); n.dataset.novoice = "1"; setTimeout(() => Voice.seq(d.V.concat(VOICE_TXT.parts(sc))), 400); } }
    if (isNew) { Snd.page(); setTimeout(() => flyToCarnet(n.querySelector(".pn-ant")), 500); }
  };

  // Fins multiples : ce que la semaine a changé, selon les décisions et la confiance gagnée.
  let epiV = [];
  function epilogue() {
    const r = (id) => st.res[id], T = st.trust || {}, E = [], X = EPILOGUE;
    const pick = (k, lvl) => [lvl, X[k].who, X[k][lvl]];
    const call = r("call"), f1 = r("f1"), g = r("garnier");
    if (call != null) E.push(pick("lou", call >= 1 ? "good" : call >= 0.5 ? "mid" : "low"));
    if (f1 != null) E.push(pick("maelys", f1 >= 1 && (g == null || g >= 0.75) ? "good" : f1 >= 1 ? "mid" : "low"));
    if (T.ines != null) E.push(pick("ines", T.ines >= 70 ? "good" : T.ines >= 40 ? "mid" : "low"));
    const tp = [T.roussel, T.benali].filter((x) => x != null), tpm = tp.length ? tp.reduce((a, b) => a + b, 0) / tp.length : null;
    if (tpm != null) E.push(pick("parents", tpm >= 70 ? "good" : tpm >= 40 ? "mid" : "low"));
    const pv = r("familles"), af = r("affiche");
    if (pv != null || af != null) E.push(pick("familles", (pv || 0) >= 1 ? "good" : "mid"));
    epiV = E.map(([, , t]) => ["narr", t]);
    if (!E.length) return "";
    return `<section class="epi" aria-label="Épilogue"><p class="kicker">Épilogue</p><h3>Ce que votre semaine a changé</h3><div class="epi-g">${E.map(([c, who, t]) => `<div class="epi-c ${c}"><b>${who}</b><p>${t}</p></div>`).join("")}</div></section>`;
  }

  R.bilan = (sc, n) => {
    st.done = true; save();
    const by = { C1: [], C2: [], C3: [], C4: [] };
    SCREENS.forEach((s) => { if (s.comp && st.res[s.id] != null) by[s.comp].push(st.res[s.id]); });
    const lvl = (v) => (v == null ? ["", "Non joué"] : v >= 0.8 ? ["good", "Acquis"] : v >= 0.5 ? ["mid", "En cours"] : ["low", "À retravailler"]);
    const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const rf = REFLEXES.map((r) => ({ ...r, ok: r.from.every(([id, min]) => st.res[id] != null && st.res[id] >= min) }));
    const defi = rf.find((r) => r.id === "protect").ok && rf.find((r) => r.id === "alert").ok && !st.flags.secret;
    const name = st.name || "Vous";
    n.innerHTML = `<div class="bilan">
      <div class="bhead"><div class="bav">${A.avatarsBig[st.av]}</div><div><p class="kicker">Fin de la semaine</p><h2 id="h-${sc.id}">Votre semaine aux Hautes Herbes${st.name ? ", " + esc(st.name) : ""}</h2>
      <p class="lead">${defi ? "Défi relevé : vous avez protégé d’abord et alerté les bons relais, sans promettre le secret." : "Vous avez beaucoup avancé. Un ou deux réflexes de protection restent à consolider : rejouez les chapitres indiqués."}</p></div></div>
      ${epilogue()}<h3>Vos compétences</h3><div class="comps">${Object.keys(COMPS).map((k) => { const v = avg(by[k]); const [c, t] = lvl(v); return `<div class="comp ${c}"><div class="ct"><b>${k}</b> ${esc(COMPS[k])}</div><div class="bar" aria-hidden="true"><span style="width:${v == null ? 0 : Math.round(v * 100)}%"></span></div><span class="lv">${t}</span></div>`; }).join("")}</div>
      <h3>Vos réflexes professionnels</h3><ul class="rfx">${rf.map((r, i) => `<li class="${r.ok ? "good" : "mid"}" style="--k:${i}"><span class="ic" aria-hidden="true">${r.ok ? "✓" : "↻"}</span><span>${esc(r.label)}</span><em>${r.ok ? "Acquis" : "À consolider"}</em>${r.ok ? "" : `<button class="ghost small" type="button" data-ch="${r.ch}">Rejouer le chapitre ${r.ch}</button>`}</li>`).join("")}</ul>
      ${st.build ? `<h3>Votre mesure de prévention</h3><div class="mymeasure"><p><b>${esc(st.build.sit)}</b> : ${esc(st.build.change)}</p><p><b>Indicateur :</b> ${esc(st.build.ind)}</p><p class="small">À proposer à ta direction lors de ton prochain accueil.</p></div>` : ""}
      <h3>Les numéros à garder</h3><div class="nums">${NUMBERS.map(([a, b]) => `<div class="nb"><b>${a}</b><span>${esc(b)}</span></div>`).join("")}</div>
      <p class="small">Ce bilan est un repère personnel. Ce n’est pas une évaluation BAFA ou BAFD.</p></div>`;
    if (epiV.length) { n.dataset.novoice = "1"; setTimeout(() => Voice.seq([["narr", "Épilogue. Ce que votre semaine a changé."]].concat(epiV)), 700); }
    const b = n.querySelector(".bilan");
    if (typeof SOURCES !== "undefined" && SOURCES.length) n.querySelector(".bilan").appendChild(el("section", { class: "sources" }, `<h3>Pour aller plus loin : les faits réels dont s’inspire le jeu</h3>` + pressBox(SOURCES).outerHTML));
    const row = el("div", { class: "row" });
    row.append(btn("Ouvrir le carnet", openCarnet, "ghost"), btn("Rejouer depuis le début", () => restart(), "ghost"), btn("Revenir à l’accueil", home));
    b.appendChild(row);
    b.querySelectorAll("[data-ch]").forEach((x) => x.addEventListener("click", () => replay(+x.dataset.ch)));
    Snd.good();
  };

  function confetti(host) {
    if (st.settings.calm) return;
    const c = el("div", { class: "confetti", "aria-hidden": "true" });
    for (let i = 0; i < 26; i++) c.appendChild(el("i", { style: `left:${Math.random() * 100}%;animation-delay:${Math.random() * 0.8}s;background:${["#054F85", "#D35A0B", "#F4B63F", "#5AA77F", "#9CC9EA"][i % 5]}` }));
    host.appendChild(c); setTimeout(() => c.remove(), 3500);
  }

  function replay(ch) {
    Snd.click();
    SCREENS.forEach((s) => { if (s.ch === ch) delete st.res[s.id]; });
    if (ch === 4) delete st.flags.secret;
    if (ch === 1) delete st.flags.mapfound;
    const i = SCREENS.findIndex((s) => s.ch === ch && s.type === "chapter");
    go(i);
  }
  function restart() { const keep = st.settings; st = fresh(); st.settings = keep; save(); Snd.click(); go(0); }

  /* =============================================================================================
     Nouvelles mécaniques : téléphone, planning, appel d'urgence, portail des familles,
     recueil de la parole d'un témoin, souvenirs rejoués, documents du carnet.
     (inséré dans engine.js à la construction)
     ============================================================================================= */
  Object.assign(NAMES, { sacha: "Sacha", rey: "M. Rey", karim: "Karim", petit: "Mme Petit", zoe: "Zoé", theo: "Théo", clara: "Clara", enzo: "Enzo", lena: "Léna", intervenant: "L’intervenant", parent: "Un parent", you: "Vous" });
  const face = (w, m) => (w === "you" ? A.avatars[st.av] : (A.chars[w] || A.chars.parent)[m || "smile"]);
  const pop = (cls, html) => { const p = el("div", { class: "cr-pop " + cls, role: "dialog", "aria-live": "assertive" }, html); document.body.appendChild(p); return p; };
  const endRow = (host, label = "Continuer") => { const row = el("div", { class: "row" }); row.appendChild(btn(label, next)); host.appendChild(row); row.querySelector("button").focus({ preventScroll: true }); };
  function result(host, q, text) {
    const v = verdict(q); v.s();
    host.innerHTML = `<div class="fb ${v.cls}"><p class="vt">${v.t}</p><p>${text}</p></div>`;
    endRow(host);
  }

  /* ---------- documents du carnet ---------- */
  function unlockDocs(sc) {
    Object.entries(DOCS).forEach(([k, d]) => {
      if (d.at !== sc.id || (st.docs || []).includes(k)) return;
      st.docs = (st.docs || []).concat(k); save();
      setTimeout(() => { toastMsg(`Nouveau document dans votre carnet : ${d.title}.`); const b = $("#btn-carnet"); b.classList.remove("ping"); void b.offsetWidth; b.classList.add("ping"); }, 1600);
    });
  }
  function docHTML(k) {
    const d = DOCS[k];
    if (d.kind === "numeros") return `<div class="doc d-num"><h4>${d.title}</h4>${d.rows.map(([a, b]) => `<div class="dn"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div>`;
    if (d.kind === "panneau") return `<div class="doc d-cork"><h4>${d.title} <small>photo du panneau de la salle d’équipe</small></h4><div class="cork">${d.notes.map((t, i) => `<p class="pin" style="--r:${[-2.4, 1.8, -1.2, 2.6, -2, 1.2][i % 6]}deg;--c:${["#FFF4B8", "#FFFFFF", "#D9EEFB", "#FFE1CC", "#E4F5DC", "#FFFFFF"][i % 6]}">${esc(t)}</p>`).join("")}</div></div>`;
    if (d.kind === "fiches") return `<div class="doc d-fiche"><h4>${d.title}</h4><div class="fiches">${d.kids.map(([n, age, ok, w]) => `<div class="fi"><div class="fi-ph">${face(w)}</div><div><b>${esc(n)}</b> <small>${esc(age)}</small><p class="fi-k">Adultes autorisés à le chercher</p><ul>${ok.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>`).join("")}</div><p class="fi-note">${esc(d.note)}</p></div>`;
    return "";
  }

  /* ---------- le téléphone ---------- */
  const Phone = {
    waiting: [],
    check(sc) {
      if (!(st.rev && st.rev.phone)) return;
      PHONE.filter((p) => p.at === sc.id && st.res["tel-" + p.id] == null && !this.waiting.includes(p)).forEach((p) => {
        const fire = () => { if (SCREENS[st.idx].id !== p.at && !p.urgent) return; if (Voice.busy() && !p.urgent) return document.addEventListener("voice-idle", () => setTimeout(fire, 1200), { once: true }); this.notify(p); };
        setTimeout(fire, p.urgent ? 6500 : 2800);
      });
    },
    badge() { const c = $("#phonecount"); if (c) { c.textContent = this.waiting.length; $("#btn-phone").classList.toggle("has", this.waiting.length > 0); } },
    notify(p) {
      if (st.res["tel-" + p.id] != null) return;
      if (!this.waiting.includes(p)) this.waiting.push(p);
      this.badge(); Snd.notif ? Snd.notif() : Snd.click();
      if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch (e) { }
      const b = el("button", { class: "ph-ban" + (p.urgent ? " urgent" : ""), type: "button", "aria-label": `Notification ${p.app} de ${p.from} : ${p.t}. Ouvrir.` },
        `<span class="ph-ic">${face(p.av)}</span><span class="ph-tx"><small>${esc(p.app)} · maintenant</small><b>${esc(p.from)}</b><span>${esc(p.t)}</span></span>`);
      b.addEventListener("click", () => { b.remove(); this.show(p); });
      document.body.appendChild(b);
      setTimeout(() => b.classList.add("out"), 9000); setTimeout(() => b.remove(), 9600);
    },
    list() {
      if (!this.waiting.length) { toastMsg("Aucun nouveau message."); return; }
      this.show(this.waiting[0]);
    },
    show(p) {
      document.querySelectorAll(".ph-modal").forEach((x) => x.remove());
      const m = el("div", { class: "ph-modal", role: "dialog", "aria-modal": "true", "aria-label": "Téléphone" },
        `<div class="ph"><div class="ph-top"><span class="ph-ic">${face(p.av)}</span><div><b>${esc(p.from)}</b><small>${esc(p.app)}</small></div><button type="button" class="ph-x" aria-label="Fermer le téléphone">✕</button></div>
         <div class="ph-chat"><div class="ph-msg in">${esc(p.t)}</div></div><div class="ph-opts"></div></div>`);
      const opts = m.querySelector(".ph-opts"), chat = m.querySelector(".ph-chat");
      p.opts.forEach((o) => {
        const b = el("button", { class: "ph-o", type: "button" }, esc(o.t));
        b.addEventListener("click", () => {
          opts.innerHTML = "";
          chat.appendChild(el("div", { class: "ph-msg out" }, esc(o.t)));
          record({ id: "tel-" + p.id, comp: p.comp }, o.q);
          const v = verdict(o.q); v.s();
          chat.appendChild(el("div", { class: "ph-fb " + v.cls }, `<b>${v.t}.</b> ${esc(o.fb)}`));
          this.waiting = this.waiting.filter((x) => x !== p); this.badge(); save();
          opts.appendChild(btn(this.waiting.length ? "Message suivant" : "Ranger le téléphone", () => { m.remove(); if (this.waiting.length) this.show(this.waiting[0]); }));
          Voice.say("narr", o.fb);
        });
        opts.appendChild(b);
      });
      m.querySelector(".ph-x").addEventListener("click", () => m.remove());
      document.body.appendChild(m);
      m.querySelector(".ph-o").focus({ preventScroll: true });
    },
  };

  /* ---------- planning (puzzle) ---------- */
  R.planning = (sc, n) => {
    const panel = el("div", { class: "panel plan" });
    panel.innerHTML = `${kicker(sc.kicker)}<h2 id="h-${sc.id}">${esc(sc.title)}</h2><p class="lead">${esc(sc.intro)}</p>`;
    const asg = {}; sc.posts.forEach((p) => (asg[p.id] = []));
    let sel = null, tries = 0;
    const pool = el("div", { class: "pl-pool", role: "group", "aria-label": "Équipe" });
    sc.staff.forEach(([w, nm, role]) => {
      const b = el("button", { class: "pl-chip", type: "button", "data-w": w }, `<span class="pl-av">${face(w)}</span><span><b>${esc(nm)}</b><small>${esc(role)}</small></span>`);
      b.addEventListener("click", () => { sel = sel === w ? null : w; Snd.click(); refresh(); });
      pool.appendChild(b);
    });
    const grid = el("div", { class: "pl-grid" });
    sc.posts.forEach((p) => {
      const c = el("button", { class: "pl-post", type: "button", "data-p": p.id }, `<b>${esc(p.t)}</b><small>${esc(p.d)}</small><span class="pl-slots"></span>`);
      c.addEventListener("click", () => { if (!sel) return; place(sel, p.id); });
      grid.appendChild(c);
    });
    function place(w, pid) {
      Object.values(asg).forEach((L) => { const i = L.indexOf(w); if (i >= 0) L.splice(i, 1); });
      const p = sc.posts.find((x) => x.id === pid);
      if (asg[pid].length >= p.n) asg[pid].shift();
      asg[pid].push(w); sel = null; Snd.click(); refresh();
    }
    function refresh() {
      pool.querySelectorAll(".pl-chip").forEach((b) => { const w = b.dataset.w; b.classList.toggle("sel", sel === w); b.classList.toggle("placed", Object.values(asg).some((L) => L.includes(w))); });
      grid.classList.toggle("target", !!sel);
      grid.querySelectorAll(".pl-post").forEach((c) => {
        const p = sc.posts.find((x) => x.id === c.dataset.p);
        c.querySelector(".pl-slots").innerHTML = (p.id === "atelier" ? `<span class="pl-slot fixed">L’intervenant</span>` : "")
          + Array.from({ length: p.n }, (_, i) => { const w = asg[p.id][i]; return w ? `<span class="pl-slot full"><i>${face(w)}</i>${w === "you" ? "Vous" : NAMES[w]}</span>` : `<span class="pl-slot">À pourvoir</span>`; }).join("");
      });
    }
    const fbz = el("div", { class: "fbzone", "aria-live": "polite" });
    function violations() {
      const v = [];
      if (asg.calme[0] !== "jade") v.push(sc.rules[0].t);
      if (asg.sanit.length < 2) v.push(sc.rules[1].t);
      if (["atelier", "parc", "calme"].some((p) => asg[p].includes("bastien"))) v.push(sc.rules[2].t);
      if (asg.atelier.length < 1) v.push(sc.rules[3].t);
      if (asg.parc.length < 1) v.push("Le groupe du parc n’a pas d’animateur.");
      return v;
    }
    const cb = btn("Vérifier le planning", () => {
      tries++; const v = violations();
      if (v.length) {
        Snd.low(); grid.classList.remove("shake"); void grid.offsetWidth; grid.classList.add("shake");
        fbz.innerHTML = `<div class="fb low"><p class="vt">Le planning ne tient pas</p><ul>${v.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`;
        return;
      }
      cb.disabled = true; fbz.innerHTML = `<div class="fb good"><p class="vt">Planning validé</p><p>Chaque groupe est encadré selon les règles de l’équipe.</p></div>`; Snd.good();
      setTimeout(twist, 1400);
    });
    function twist() {
      const T = sc.twist;
      const p = pop("pl-twist", `<p class="kicker">Message de ${esc(NAMES[T.who])}</p><p class="cr-q">${esc(T.t)}</p>`);
      const o = el("div", { class: "cr-opts" });
      T.opts.forEach((x) => { const b = el("button", { class: "opt", type: "button" }, esc(x.t)); b.addEventListener("click", () => { p.remove(); end(x); }); o.appendChild(b); });
      p.appendChild(o); Snd.click(); Voice.say("narr", T.t); o.querySelector(".opt").focus({ preventScroll: true });
    }
    function end(x) {
      const base = tries === 1 ? 1 : tries === 2 ? 0.8 : 0.6, q = Math.round(base * (0.4 + 0.6 * x.q) * 100) / 100;
      record(sc, q);
      result(fbz, q, `${tries === 1 ? "Planning juste du premier coup." : `Planning juste après ${tries} essais.`} ${x.q >= 1 ? "Et vous avez refusé l’exception : la règle tient, même quand on vous la demande gentiment." : esc(x.fb)}`);
    }
    const tools = el("div", { class: "row" }); tools.append(btn("Voir les règles de l’équipe (carnet)", () => openCarnet("regles"), "ghost"), cb);
    panel.append(el("p", { class: "flabel" }, "Touchez un membre de l’équipe, puis son poste"), pool, grid, tools, fbz);
    refresh(); n.appendChild(panel);
  };

  /* ---------- appel d'urgence (clavier) ---------- */
  R.dial = (sc, n) => {
    const panel = el("div", { class: "panel dial" });
    panel.innerHTML = `${kicker(sc.kicker)}<h2 id="h-${sc.id}">${esc(sc.title)}</h2><p class="lead">${esc(sc.intro)}</p>`;
    const ph = el("div", { class: "dphone" }, `<div class="dscr"><span class="dnum" aria-live="polite"></span><small class="dstate">Composez le numéro</small></div>
      <div class="dkeys">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => `<button type="button" class="dk" data-k="${k}">${k}</button>`).join("")}</div>
      <div class="drow"><button type="button" class="ddel" aria-label="Effacer">⌫</button><button type="button" class="dcall">Appeler</button></div>`);
    let num = "", tries = 0, left = sc.timer || 30, over = false;
    const show = () => (ph.querySelector(".dnum").textContent = num);
    ph.querySelectorAll(".dk").forEach((b) => b.addEventListener("click", () => { if (over || num.length >= 6) return; num += b.dataset.k; show(); Snd.click(); }));
    ph.querySelector(".ddel").addEventListener("click", () => { num = num.slice(0, -1); show(); });
    ph.querySelector(".dcall").addEventListener("click", call);
    const onKey = (e) => { if (!n.isConnected) return document.removeEventListener("keydown", onKey); if (/^[0-9]$/.test(e.key) && !over && num.length < 6) { num += e.key; show(); } else if (e.key === "Backspace") { num = num.slice(0, -1); show(); } else if (e.key === "Enter") call(); };
    document.addEventListener("keydown", onKey);
    const bar = el("div", { class: "qtimer", role: "timer" }, `<i style="animation-duration:${left}s"></i><span>${left} s</span>`);
    let tId = 0; const startDial = () => (tId = setInterval(() => {
      if (!n.isConnected) return clearInterval(tId);
      left--; bar.querySelector("span").textContent = left > 0 ? `${left} s` : "Temps écoulé"; bar.classList.toggle("hurry", left <= 8);
      if (left <= 0) { clearInterval(tId); end(0, "Temps écoulé. Pendant que vous hésitiez, l’adulte désigné approchait du portail."); }
    }, 1000));
    setTimeout(() => readyGate(panel, startDial, "Prendre le téléphone"), 0);
    if (sc.interrupt && !calm()) document.addEventListener("click", function arm(e) {
      if (!e.target.closest || !e.target.closest(".rgate button")) return; document.removeEventListener("click", arm, true);
      setTimeout(() => { if (over || !n.isConnected) return;
      const p = pop("dint", `<p class="kicker">Interruption</p><p class="cr-q">${esc(sc.interrupt.t)}</p>`);
      const o = el("div", { class: "cr-opts" });
      [["« Pas maintenant. Va voir Inès, elle va arbitrer. »", 1], ["Y aller deux minutes, puis revenir appeler.", 0]].forEach(([t, ok]) => {
        const b = el("button", { class: "opt", type: "button" }, t);
        b.addEventListener("click", () => { p.remove(); if (!ok) { left = Math.max(3, left - 12); toastMsg("Deux minutes perdues… et Lou est resté seul."); } else Snd.click(); });
        o.appendChild(b);
      });
      p.appendChild(o);
      }, 7000);
    }, true);
    function call() {
      if (over || !num) return; tries++;
      if (sc.ok.includes(num)) {
        over = true; clearInterval(tId); ph.classList.add("calling"); ph.querySelector(".dstate").textContent = "Appel en cours…"; Snd.click();
        setTimeout(() => { over = false; end(tries === 1 ? 1 : tries === 2 ? 0.7 : 0.5, `${tries === 1 ? "Le bon numéro du premier coup." : "Le bon numéro, après une erreur."} « ${esc(sc.done)} »`); Voice.say("narr", sc.done); }, 1600);
      } else {
        ph.classList.remove("wrong"); void ph.offsetWidth; ph.classList.add("wrong"); Snd.low();
        fbz.innerHTML = `<div class="fb mid"><p>${esc(sc.near[num] || "Ce numéro ne correspond à aucun service d’urgence. Les numéros utiles sont dans votre carnet.")}</p></div>`;
        num = ""; show();
      }
    }
    function end(q, txt) {
      if (over) return; over = true; clearInterval(tId); document.querySelectorAll(".cr-pop.dint").forEach((x) => x.remove());
      record(sc, q); result(fbz, q, txt);
    }
    const tools = el("div", { class: "row" }); tools.append(btn("Ouvrir les numéros utiles (carnet)", () => openCarnet("numeros"), "ghost"));
    const fbz = el("div", { class: "fbzone", "aria-live": "polite" });
    panel.append(bar, ph, tools, fbz); n.appendChild(panel);
  };

  /* ---------- portail des familles (vérifier les fiches) ---------- */
  R.match = (sc, n) => {
    const panel = el("div", { class: "panel match" });
    panel.innerHTML = `${kicker(sc.kicker)}<h2 id="h-${sc.id}">${esc(sc.title)}</h2><p class="lead">${esc(sc.intro)}</p>`;
    const tools = el("div", { class: "row" }); tools.append(btn("Ouvrir les fiches d’inscription (carnet)", () => openCarnet("fiches"), "ghost"));
    const box = el("div", { class: "mt-stage", "aria-live": "polite" });
    const prog = el("div", { class: "mt-prog" }, sc.cards.map(() => "<i></i>").join(""));
    let i = 0, score = 0;
    const PART = { keep: { refuse: 0.5 }, id: { refuse: 0.4, give: 0.2 }, give: { id: 0.8 }, refuse: { keep: 0.5, id: 0.2 } };
    function card() {
      const c = sc.cards[i];
      box.innerHTML = "";
      const k = el("div", { class: "mt-card" }, `<div class="mt-who">${face(c.who)}</div><div><p class="mt-t">${esc(c.t)}</p><p class="mt-kid">Enfant demandé : <b>${esc(c.kid)}</b></p></div>`);
      const acts = el("div", { class: "opts mt-acts" });
      sc.actions.forEach(([a, t], j) => { const b = el("button", { class: "opt", type: "button", style: `--k:${j}` }, `<span class="ol">${String.fromCharCode(65 + j)}</span><span>${esc(t)}</span>`); b.addEventListener("click", () => pick(c, a, acts, b)); acts.appendChild(b); });
      box.append(k, acts); World.talk(c.who); setTimeout(() => World.talk(null), 2500);
      Voice.say("narr", c.t);
    }
    function pick(c, a, acts, b) {
      acts.querySelectorAll(".opt").forEach((x) => (x.disabled = true));
      const part = a === c.ok ? 1 : ((PART[c.ok] || {})[a] || 0); score += part;
      b.classList.add("picked", part >= 1 ? "good" : part > 0 ? "mid" : "low");
      prog.children[i].className = part >= 1 ? "ok" : part > 0 ? "mid" : "ko";
      const v = verdict(part); v.s();
      const f = el("div", { class: "fb " + v.cls }, `<p>${esc(c.fb[a])}</p>`);
      box.appendChild(f);
      f.appendChild(btn(i < sc.cards.length - 1 ? "Famille suivante" : "Terminer", () => { i++; if (i < sc.cards.length) card(); else end(); }));
      Voice.say("narr", c.fb[a]);
    }
    function end() {
      const q = Math.round((score / sc.cards.length) * 100) / 100; record(sc, q);
      box.innerHTML = ""; result(box, q, `${Math.round(score * 10) / 10} départ${score > 1 ? "s" : ""} sur ${sc.cards.length} gérés avec justesse. Au portail, la fiche d’inscription fait la règle : ni la sympathie, ni l’urgence ne la remplacent.`);
    }
    panel.append(prog, tools, box); n.appendChild(panel); card();
  };

  /* ---------- recueillir la parole d'un témoin ---------- */
  R.interview = (sc, n) => {
    const wrap = el("div", { class: "duo dlg" });
    const side = el("div", { class: "side" });
    side.appendChild(portrait(sc.npc, "calm"));
    let trust = 60, closed = false; const got = new Set(), errs = [];
    const tg = el("div", { class: "trust", role: "meter", "aria-label": "Confiance de " + NAMES[sc.npc] }, `<span>Confiance de ${esc(NAMES[sc.npc])}</span><div class="tg"><i style="width:60%"></i></div><b class="td"></b>`);
    side.appendChild(tg); wrap.appendChild(side);
    const panel = el("div", { class: "panel iv" });
    panel.innerHTML = `${kicker(sc.kicker)}<h2 id="h-${sc.id}">${esc(sc.title)}</h2><p class="lead">${esc(sc.intro)}</p>`;
    const log = el("div", { class: "dlog", role: "log" });
    const notes = el("div", { class: "iv-notes" }, `<p class="kicker">Vos notes · ses mots exacts</p><ul></ul><div class="iv-facts">${sc.facts.map((f) => `<span data-f="${f}">${f}</span>`).join("")}</div>`);
    const qbox = el("div", { class: "opts iv-qs" });
    const fbz = el("div", { class: "fbzone", "aria-live": "polite" });
    const setTrust = (d) => {
      trust = Math.max(0, Math.min(100, trust + d));
      tg.querySelector("i").style.width = trust + "%"; tg.classList.toggle("low", trust < 35); tg.classList.toggle("high", trust >= 75);
      const t = tg.querySelector(".td"); t.textContent = d > 0 ? "+" : d < 0 ? "−" : ""; t.className = "td " + (d > 0 ? "up" : d < 0 ? "down" : ""); void t.offsetWidth; t.classList.add("pop");
      setMood(wrap, sc.npc, trust < 35 ? "concern" : trust >= 70 ? "smile" : "calm");
    };
    function say(who, t, cls = "") { const b = el("div", { class: "say " + (who === "you" ? "me" : "npc") + cls }, `<b>${who === "you" ? "Vous" : NAMES[who]}</b><p>${words(t)}</p>`); log.appendChild(b); b.scrollIntoView({ block: "nearest", behavior: "smooth" }); return b; }
    sc.qs.forEach((q, j) => {
      const b = el("button", { class: "opt", type: "button", style: `--k:${j}` }, `<span>${esc(q.t)}</span>`);
      b.addEventListener("click", () => ask(q, b)); qbox.appendChild(b);
    });
    const cb = el("button", { class: "opt iv-close", type: "button" }, `<span>${esc(sc.close.t)}</span>`);
    cb.addEventListener("click", () => finish(true)); qbox.appendChild(cb);
    function ask(q, b) {
      if (closed) return;
      b.disabled = true; b.classList.add("asked");
      say("you", q.t);
      setTimeout(() => {
        const a = say(sc.npc, q.a, q.taint ? " tainted" : "");
        Voice.say(sc.npc, q.a, a.querySelector("p"));
        setTrust(q.trust);
        if (q.fact) q.fact.forEach((f) => { got.add(f); notes.querySelector(`[data-f="${f}"]`).classList.add("on"); });
        if (q.fact || q.taint) notes.querySelector("ul").appendChild(el("li", { class: q.taint ? "tainted" : "" }, `« ${esc(q.a)} »${q.taint ? " <em>réponse influencée par la question</em>" : ""}`));
        if (q.fb) { errs.push(q.kind); fbz.innerHTML = `<div class="fb mid"><p><b>Attention, question ${esc(q.kind)}.</b> ${esc(q.fb)}</p></div>`; Snd.low(); } else { fbz.innerHTML = ""; Snd.click(); }
        if (trust < 25) { say(sc.npc, "Je veux plus en parler. Laisse tomber."); finish(false); }
      }, 650);
    }
    function finish(ok) {
      if (closed) return; closed = true;
      qbox.querySelectorAll(".opt").forEach((x) => (x.disabled = true));
      if (ok) { say("you", sc.close.t); setTimeout(() => say(sc.npc, sc.close.a), 500); }
      const pen = errs.length * 0.22 + (ok ? 0 : 0.3), q = Math.max(0, Math.min(1, Math.round((got.size / sc.facts.length - pen) * 100) / 100));
      record(sc, q);
      setTimeout(() => result(fbz, q, `Vous avez recueilli ${got.size} élément${got.size > 1 ? "s" : ""} sur ${sc.facts.length}, avec ses mots${errs.length ? `, mais ${errs.length > 1 ? `${errs.length} questions ont pu` : "une question a pu"} l’influencer ou le fermer` : ", sans l’influencer"}. ${ok ? "Vous l’avez remercié sans rien promettre : c’est maintenant à Nour et aux autorités de prendre le relais." : "Sacha s’est fermé : sa parole sera plus difficile à recueillir par les professionnels."} Pour un enfant témoin comme pour une victime : des questions ouvertes, peu nombreuses, ses mots notés tels quels, et on transmet.`), 900);
    }
    panel.append(log, el("p", { class: "flabel" }, "Que lui dites-vous ?"), qbox, notes, fbz);
    wrap.appendChild(panel); n.appendChild(wrap);
    setTimeout(() => say(sc.npc, "J’ai vu un truc à la régie… mais je sais pas si je dois le dire."), 600);
  };

  /* ---------- souvenirs : les conséquences rejouées ---------- */
  R.replay = (sc, n) => {
    const ids = Object.keys(REPLAY).filter((k) => st.res[k] != null);
    const panel = el("div", { class: "panel replay" });
    panel.innerHTML = `${kicker(sc.kicker)}<h2 id="h-${sc.id}">${esc(sc.title)}</h2><p class="lead">Pendant la semaine, certains choix ont été enregistrés sans verdict. Voici ce qu’ils ont produit.</p>`;
    const body = el("div", { class: "rp-body", "aria-live": "polite" });
    const row = el("div", { class: "row" });
    n.dataset.novoice = "1";
    if (!ids.length) { body.innerHTML = `<p>Aucun choix à retardement cette fois-ci.</p>`; endRow(row, "Voir le bilan"); panel.append(body, row); n.appendChild(panel); return; }
    let i = 0;
    const tierOf = (id) => (st.res[id] >= 0.95 ? "excellent" : st.res[id] >= 0.45 ? "moyen" : "catastrophe");
    const LBL = { excellent: ["Ce que votre choix a permis", "good"], moyen: ["Ce que votre choix a laissé passer", "mid"], catastrophe: ["Ce que votre choix a provoqué", "low"] };
    const nb = btn("Souvenir suivant", () => { i++; if (i < ids.length) play(); else next(); });
    function play() {
      const id = ids[i], R0 = REPLAY[id], t = tierOf(id), T = R0.tiers[t], S0 = SCREENS.find((s) => s.id === id), L = (st.later || {})[id];
      World.show({ at: R0.at, room: R0.room, cast: T.cast }, { id: "souvenir-" + id, type: "story", ch: 6 });
      body.innerHTML = `<p class="kicker">${i + 1} sur ${ids.length} · ${esc(R0.label)}</p>${L ? `<p class="rp-choice">Vous aviez répondu : « ${esc(S0.opts[L.k].t)} »</p>` : ""}<p class="rp-tier ${LBL[t][1]}">${LBL[t][0]}</p><div class="rp-lines"></div>`;
      const box = body.querySelector(".rp-lines"), seq = [];
      T.lines.forEach(([w, tx], j) => {
        const r = el("div", { class: "say " + (w === "narr" ? "narr" : "npc"), style: `animation-delay:${0.6 + j * 0.5}s` }, w === "narr" ? `<p>${words(tx)}</p>` : `<b>${NAMES[w]}</b><p>${words(tx)}</p>`);
        box.appendChild(r); seq.push([w, tx, r.querySelector("p")]);
      });
      setTimeout(() => Voice.seq(seq), 1300);
      nb.textContent = i < ids.length - 1 ? "Souvenir suivant" : "Voir le bilan";
      Snd[t === "excellent" ? "good" : t === "moyen" ? "mid" : "low"]();
    }
    row.appendChild(nb); panel.append(body, row); n.appendChild(panel); play();
  };

  /* ---------- retrouver quelqu'un sur le plan ---------- */
  const isoPct = (x, y) => { const [OX, OY, C, S, v0, v1, vw, vh] = A.dio.proj; return [((OX + (x - y) * C - v0) / vw) * 100, ((OY + (x + y) * S - v1) / vh) * 100]; };
  R.find = (sc, n) => {
    const wrap = el("div", { class: "mapwrap lynx findg" });
    wrap.innerHTML = `<div class="maphead"><div>${kicker(sc.kicker)}<h2 id="h-${sc.id}">${esc(sc.title)}</h2><p class="lead">${esc(sc.intro)}</p></div>
      <div class="lx-hud"><div class="lx-clock" role="timer"><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="t0" cx="22" cy="22" r="19"/><circle class="t1" cx="22" cy="22" r="19" pathLength="100"/></svg><b>${sc.timer}</b></div></div></div>`;
    const box = el("div", { class: "mapbox" }), map = el("div", { class: "map dio" }, dioHTML());
    box.appendChild(map);
    const people = [[sc.who, sc.at[0], sc.at[1], true]].concat(sc.decoys.map(([w, x, y]) => [w, x, y, false]));
    let left = sc.timer, misses = 0, done = false, tId = 0;
    const size = (44 / A.dio.vbw) * 100 * .84;
    people.forEach(([w, x, y, ok]) => {
      const p = isoPct(x, y);
      const b = el("button", { class: "fperson", type: "button", style: `left:${p[0]}%;top:${p[1]}%;width:${size}%;z-index:${Math.round(p[1] * 10)}`, "aria-label": ok ? "Une jeune fille près du parc" : "Un enfant" },
        `<svg viewBox="-22 -60 44 64">${A.minis[w][ok ? "stand" : (["walk", "wave", "talk"][Math.floor(Math.random() * 3)])]}</svg>`);
      b.addEventListener("click", () => {
        if (done || !tId) return;
        if (!ok) { misses++; b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope"); Snd.low(); toastMsg(`Ce n’est pas Léna, c’est ${NAMES[w]}.`); left = Math.max(1, left - 5); return; }
        found(b);
      });
      map.appendChild(b);
    });
    const clock = wrap.querySelector(".lx-clock"), fbz = el("div", { class: "fbzone", "aria-live": "polite" });
    const tick = () => {
      left--; clock.querySelector("b").textContent = Math.max(0, left);
      clock.querySelector(".t1").style.strokeDashoffset = (100 - (left / sc.timer) * 100).toFixed(1); clock.classList.toggle("hurry", left <= 15);
      if (left <= 0) { clearInterval(tId); const b = map.querySelector(".fperson"); b.classList.add("hint"); found(b, true); }
    };
    function found(b, late) {
      if (done) return; done = true; clearInterval(tId);
      b.classList.add("found"); Snd.good();
      const speed = late ? 0.4 : Math.max(0.5, Math.min(1, left / sc.timer + 0.35)) - misses * 0.08;
      const q0 = Math.max(0.3, Math.round(speed * 100) / 100);
      fbz.innerHTML = `<div class="say npc"><b>Léna</b><p>${words(sc.found)}</p></div>`;
      Voice.say("narr", sc.found, fbz.querySelector("p"));
      const o = el("div", { class: "opts" });
      sc.opts.forEach((x, j) => {
        const bb = el("button", { class: "opt", type: "button", style: `--k:${j}` }, `<span class="ol">${String.fromCharCode(65 + j)}</span><span>${esc(x.t)}</span>`);
        bb.addEventListener("click", () => { const q = x.q >= 1 ? (q0 >= 0.7 ? 1 : 0.8) : Math.round(x.q * 0.8 * 100) / 100; record(sc, q); const r = el("div"); fbz.appendChild(r); result(r, q, `${late ? "Vous l’avez trouvée tard : chaque minute compte quand un jeune vient vous parler." : `Trouvée en ${sc.timer - left} s.`} ${esc(x.fb)}`); o.remove(); Voice.say("narr", x.fb); });
        o.appendChild(bb);
      });
      fbz.appendChild(o);
      setTimeout(() => fbz.scrollIntoView({ behavior: "smooth", block: "nearest" }), 200);
    }
    wrap.append(box, fbz); n.appendChild(wrap);
    readyGate(wrap.querySelector(".maphead"), () => { tId = setInterval(tick, 1000); }, "Partir à sa recherche");
    requestAnimationFrame(() => { if (box.scrollWidth > box.clientWidth) box.scrollLeft = (box.scrollWidth - box.clientWidth) / 2; });
  };

  /* ---------- carnet ---------- */
  const dlg = $("#carnet");
  function openCarnet(focus) {
    Snd.page(); $("#btn-carnet").classList.remove("ping");
    const pages = SCREENS.filter((s) => s.type === "explain" && st.carnet.includes(s.id));
    const body = $("#carnet-body");
    body.innerHTML = (pages.length ? pages.map((s) => `<section class="cpage"><h3>${esc(s.page.title)}</h3>${s.page.quote ? `<blockquote>${esc(s.page.quote)}</blockquote>` : ""}<ul>${s.page.pts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="refs">${s.page.refs.map((r) => `<span class="chip">${esc(r)}</span>`).join("")}</p></section>`).join("") : `<p class="lead">Votre carnet est encore vide : chaque fin de chapitre y ajoute une page.</p>`)
;
    const docs = (st.docs || []).filter((k) => DOCS[k]);
    if (docs.length) body.insertAdjacentHTML("afterbegin", `<section class="cdocs"><h3>Documents</h3>${docs.map((k) => `<div id="doc-${k}">${docHTML(k)}</div>`).join("")}</section>`);
    dlg.hidden = false; document.body.classList.add("modal");
    if (typeof focus === "string") setTimeout(() => { const d = body.querySelector("#doc-" + focus); if (d) { d.scrollIntoView({ block: "start", behavior: "smooth" }); d.classList.add("flash"); } }, 120);
    lastFocus = document.activeElement;
    $("#carnet-close").focus();
  }
  let lastFocus = null;
  function closeCarnet() { dlg.hidden = true; document.body.classList.remove("modal"); if (lastFocus) lastFocus.focus(); }
  $("#carnet-close").addEventListener("click", closeCarnet);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeCarnet(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dlg.hidden) closeCarnet();
    if (e.key === "Tab" && !dlg.hidden) { const f = dlg.querySelectorAll("button"); if (f.length && !dlg.contains(document.activeElement)) { e.preventDefault(); f[0].focus(); } }
  });

  /* ---------- accueil ---------- */
  function home() {
    if (DC.el) DC.el.hidden = true;
    if (World.el) { World.el.classList.remove("on"); document.body.classList.remove("live"); World.cur = null; }
    hud(false);
    Snd.setMood("home");
    stage.innerHTML = "";
    const prev = load();
    const canResume = prev && (prev.idx > 0 || prev.done);
    const n = el("section", { class: "screen home in", "aria-labelledby": "h-home" });
    n.innerHTML = `<div class="hbg" aria-hidden="true"><i class="glow g1"></i><i class="glow g2"></i><svg class="rings" viewBox="0 0 800 800"><circle cx="400" cy="400" r="160"/><circle cx="400" cy="400" r="260"/><circle cx="400" cy="400" r="360"/></svg></div>
      <div class="hero"><div class="logo" role="img" aria-label="Fourmi’Action"></div>
      <p class="hk">Formation BAFA · BAFD · mise en situation</p>
      <h1 id="h-home"><span class="w w1">Les</span> <span class="w w2">Hautes</span> <span class="w w3">Herbes</span></h1>
      <p class="tag">Une semaine dans un accueil de loisirs, une suite de décisions professionnelles. Repérer, protéger, alerter et prévenir les violences sexistes et sexuelles en accueil collectif de mineurs.</p>
      <div class="meta"><span>Environ 25 minutes</span><span>5 journées</span><span>Progression enregistrée</span></div>
      <div class="hbtns"></div>
      <div class="hopts" role="group" aria-label="Réglages"><button type="button" class="hopt" data-k="sound"></button><button type="button" class="hopt" data-k="voice"></button></div>
      <p class="small warn">Situations fictives destinées à des adultes en formation, sans aucune représentation de violence. Vous pouvez faire une pause à tout moment. Si ce sujet vous touche personnellement, le 119 (moins de 18 ans), le 3919 ou France Victimes (116 006) peuvent vous écouter.</p>
      <p class="small lic">Jeu gratuit offert par Fourmi’Action · © Fourmi’Action 2026, tous droits réservés · à citer : « Les Hautes Herbes, un jeu Fourmi’Action ». Voix des personnages : ElevenLabs.</p></div>
      <div class="hcast" aria-hidden="true"><div class="hc-glass"></div>${["garnier", "nour", "bastien", "ines"].map((k, i) => `<div class="hc hc${i}">${A.chars[k][i === 1 ? "big" : "smile"]}</div>`).join("")}</div>`;
    const hb = n.querySelector(".hbtns");
    const opts = n.querySelectorAll(".hopt");
    const drawOpts = () => opts.forEach((b) => {
      const k = b.dataset.k, on = !!st.settings[k];
      if (k === "voice") b.hidden = !(Voice.ok && Voice.ready);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = k === "sound" ? (on ? "Musique et sons : activés" : "Musique et sons : coupés") : (on ? "Voix des personnages : activées" : "Voix des personnages : coupées");
    });
    opts.forEach((b) => b.addEventListener("click", () => { const k = b.dataset.k; st.settings[k] = !st.settings[k]; if (k === "voice" && !st.settings.voice) Voice.stop(); if (k === "sound") { Snd.init(); if (st.settings.sound) Snd.startAmb(); else Snd.stopAmb(); } save(); applySettings(); drawOpts(); }));
    drawOpts(); Voice._onReady = drawOpts;
    if (canResume) {
      const sc = SCREENS[prev.idx];
      hb.appendChild(btn(prev.done ? "Revoir mon bilan" : `Reprendre · ${CHAPTERS[sc.ch - 1].day.toLowerCase()}`, () => { begin(); st = prev; st.settings = st.settings || { sound: true, calm: false }; applySettings(); if (prev.done) go(SCREENS.length - 1); else go(prev.idx); }));
      hb.appendChild(btn("Nouvelle partie", () => { begin(); restart(); }, "ghost light"));
    } else hb.appendChild(btn("Commencer", () => { begin(); go(0); }));
    stage.appendChild(n);
    setTimeout(() => n.querySelector(".hbtns button").focus({ preventScroll: true }), 50);
  }
  // Le son et la musique démarrent d'eux-mêmes au premier geste (les navigateurs interdisent le son avant)
  const firstGesture = () => {
    document.removeEventListener("pointerdown", firstGesture, true); document.removeEventListener("keydown", firstGesture, true);
    if (st.settings.sound === undefined) st.settings.sound = true;
    if (st.settings.sound) begin();
  };
  document.addEventListener("pointerdown", firstGesture, true); document.addEventListener("keydown", firstGesture, true);
  function begin() { Snd.init(); try { if (Snd.ctx && Snd.ctx.state === "suspended") Snd.ctx.resume(); } catch (e) { } Snd.startAmb(); Snd.good(); }

  applySettings();
  home();
  window.__game = { st: () => st, go, SCREENS };
})();
