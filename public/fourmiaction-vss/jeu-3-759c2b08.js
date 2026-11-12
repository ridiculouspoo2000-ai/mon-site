/* Les Hautes Herbes — moteur du jeu */
(function () {
  "use strict";
  const A = window.ASSETS;
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
  const fresh = () => ({ v: 1, idx: 0, name: "", av: 0, res: {}, flags: {}, dB: {}, dA: {}, carnet: [], build: null, later: {}, trust: {}, stars: {}, nuitee: false, done: false, settings: st ? st.settings : { sound: true, calm: false, voice: true }, tut: {} });
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
      const items = list.map(([w, t, e]) => ({ u: t && this.url(w, t), e: e || null })).filter((x) => x.u); if (!items.length) return;
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
    _done() { cancelAnimationFrame(this._raf); if (this._cur && this._cur.e) this._cur.e.classList.remove("kara"); this._cur = null; },
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
  $("#btn-carnet").addEventListener("click", openCarnet);
  $("#btn-home").addEventListener("click", () => { Snd.click(); home(); });

  function hud(show) {
    $("#hud").hidden = !show;
    if (!show) return;
    const sc = SCREENS[st.idx], dots = $("#chapdots");
    dots.innerHTML = "";
    CHAPTERS.forEach((c) => {
      const cur = sc && sc.ch === c.n, done = sc && c.n < sc.ch;
      dots.appendChild(el("li", { class: "dot" + (cur ? " cur" : "") + (done ? " done" : ""), title: `Chapitre ${c.n} · ${c.title}` }, `<span class="sr-only">Chapitre ${c.n}, ${esc(c.title)}${cur ? ", en cours" : done ? ", terminé" : ""}</span>`));
    });
    $("#chaptitle").textContent = sc ? `Chapitre ${sc.ch} · ${CHAPTERS[sc.ch - 1].title}` : "";
    $("#carnetcount").textContent = st.carnet.length;
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

  function render(dir = 1) {
    const sc = SCREENS[st.idx];
    Voice.stop();
    const nx = SCREENS[st.idx + 1];
    if (nx) { const L = []; (nx.lines || []).forEach((l) => l.who && l.who !== "player" && L.push([l.who, l.t])); if (nx.nodes && nx.start && nx.nodes[nx.start]) L.push([nx.npc, nx.nodes[nx.start].t]); Voice.prefetch(L); }
    Snd.setMood(sc.type === "bilan" ? "end" : sc.ch);
    camera(sc);
    hud(true);
    const old = stage.firstElementChild;
    const node = el("section", { class: "screen t-" + sc.type + (dir < 0 ? " back" : ""), "aria-labelledby": "h-" + sc.id });
    (sc.type === "sort" && sc.cats.length <= 3 && !calm() ? R.reflex : sc.type === "order" && sc.crisis && !calm() ? R.crisis : (R[sc.type] || R.story))(sc, node);
    { const VP = VOICE_TXT.parts(sc); if (VP.length && !node.dataset.novoice) setTimeout(() => Voice.seq(VP), 350); }
    if (sc.press) { const host = node.querySelector(".panel, .solo, .page-note .pn-body, .bilan") || node; host.appendChild(pressBox(sc.press)); }
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
  const LOC = { intro: "entree", radio: "radio", k1: "equipe", brief: "equipe", ines: "equipe", rire: "parc", parent1: "cour", parent2: "cour", chat: "equipe", chatact: "equipe", theo: "cour", theo2: "cour", k2: "equipe",
    ronde: "sanitaires", consent: "jeux", silence: "jeux", kevin: "equipe", nuit1: "refectoire", nuit2: "refectoire", nuit3: "refectoire", kn: "equipe", k3: "equipe",
    depart: "entree", lou: "cour", call: "direction", acts: "direction", ordre: "cour", transm: "direction", k4: "equipe",
    bilanequipe: "equipe", build: "equipe", affiche: "panneau", familles: "entree", k5: "equipe", maelys: "local", f1: "local", garnier: "direction", f3: "direction" };
  let world = null;
  function camera(sc) {
    if (!A.dio) return;
    if (!world) { world = el("div", { id: "world", "aria-hidden": "true" }, `<div class="wcam">${A.dio.svg}</div>`); document.body.insertBefore(world, document.body.firstChild); }
    const hide = !sc || sc.type === "hotspots" || calm();
    world.className = hide ? "" : "on amb-" + timeOf(sc);
    if (hide) return;
    const key = LOC[sc.id] || (sc.type === "chapter" || sc.type === "bilan" || sc.type === "positions" ? "ensemble" : null);
    const p = A.dio.lieux[key] || A.dio.lieux.ensemble, z = key && key !== "ensemble" ? 1.9 : 1.05;
    world.firstElementChild.style.transform = `translate(${(-p.x * z * 100).toFixed(2)}%,${(-p.y * z * 100).toFixed(2)}%) scale(${z})`;
  }
  function scenePanel(key, extra = "") {
    const svg = key === "welcome" ? A.welcome : (A.scenes[key] || A.chapters[key] || "");
    const n = el("div", { class: "art amb-" + timeOf(SCREENS[st.idx]) + extra }, `<i class="sky" aria-hidden="true"></i><i class="glowl" aria-hidden="true"></i><i class="motes" aria-hidden="true"></i><div class="artin">${svg}</div>`);
    parallax(n); return n;
  }
  function parallax(n) {
    if (matchMedia("(pointer:coarse)").matches) return;
    n.addEventListener("pointermove", (e) => { const r = n.getBoundingClientRect(); n.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5).toFixed(3)); n.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5).toFixed(3)); });
    n.addEventListener("pointerleave", () => { n.style.setProperty("--px", 0); n.style.setProperty("--py", 0); });
  }
  function portrait(who, mood) {
    const n = el("div", { class: "portrait amb-" + timeOf(SCREENS[st.idx]), "data-who": who }, `<i class="sky" aria-hidden="true"></i><i class="glowl" aria-hidden="true"></i><i class="motes" aria-hidden="true"></i><div class="pchar">${A.chars[who][mood || "smile"]}</div><div class="pname">${NAMES[who]}</div>`);
    parallax(n); return n;
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
    n.innerHTML = `<div class="solo"><h2 id="h-${sc.id}">Votre rôle</h2><p class="lead">Vous êtes animateur ou animatrice et c’est votre premier jour à l’accueil de loisirs des Hautes Herbes.</p></div>`;
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
    [[false, "Accueil de loisirs", "Des journées d’accueil, sans hébergement."], [true, "Avec une nuitée", "Une nuit à l’accueil le mercredi : un parcours en plus sur les risques de la nuit."]].forEach(([v, t, d]) => {
      const b = el("button", { class: "fmtb" + (!!st.nuitee === v ? " sel" : ""), type: "button", role: "radio", "aria-checked": String(!!st.nuitee === v) }, `<b>${t}</b><small>${d}</small>`);
      b.addEventListener("click", () => { st.nuitee = v; fmt.querySelectorAll(".fmtb").forEach((x) => { const on = x === b; x.classList.toggle("sel", on); x.setAttribute("aria-checked", String(on)); }); Snd.click(); });
      fmt.appendChild(b);
    });
    box.append(lab, inp, el("p", { class: "flabel" }, "Votre personnage"), grid, el("p", { class: "flabel" }, "Format de l’accueil"), fmt, btn("Commencer", () => { st.name = (inp.value || "").trim().slice(0, 20); next(); }));
  };

  R.chapter = (sc, n) => {
    const c = CHAPTERS[sc.ch - 1];
    const stations = CHAPTERS.map((x) => `<li class="${x.n < c.n ? "done" : x.n === c.n ? "cur" : ""}"><span>${x.n}</span></li>`).join("");
    n.innerHTML = `<div class="chap"><div class="journey" aria-hidden="true"><ol>${stations}</ol><div class="walker2" style="--from:${((c.n - 2) / (CHAPTERS.length - 1)) * 100}%;--to:${((c.n - 1) / (CHAPTERS.length - 1)) * 100}%">${A.avatars[st.av]}</div></div><div class="chapart art amb-${timeOf(sc)}"><i class="sky" aria-hidden="true"></i><i class="glowl" aria-hidden="true"></i><i class="motes" aria-hidden="true"></i><div class="artin">${A.chapters[c.n]}</div></div><p class="chapnum">Chapitre ${c.n} sur ${CHAPTERS.length}</p><h2 id="h-${sc.id}">${esc(c.title)}</h2><p class="lead">${esc(c.goal)}</p></div>`;
    n.querySelector(".chap").appendChild(btn(c.n === 1 ? "C’est parti" : "Continuer", next));
    Snd.page();
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
    const map = el("div", { class: "map" + (dio ? " dio" : "") }, dio ? dio.svg : A.map);
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
    if (left) timerId = setInterval(tick, 1000);
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
        if (!over && sc.timer) { left = Math.max(1, left - 5); const f = el("span", { class: "lx-pen", "aria-hidden": "true" }, "−5 s"); b.appendChild(f); setTimeout(() => f.remove(), 1200); }
      }
      $("#cnt", wrap).textContent = found.size;
      card.hidden = false;
      card.className = "spotcard " + (s.real ? "real" : "decoy");
      card.innerHTML = `<p class="kicker">${s.real ? "Point d’attention" : "Rien d’inquiétant"}${s.ref ? " · " + s.ref : ""}</p><h3 id="spot-t">${esc(s.title)}</h3><p>${esc(s.t)}</p><p class="lesson">${esc(s.lesson)}</p>`;
      if (s.press) card.appendChild(pressBox(s.press));
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
    if (sc.npc) return portrait(sc.npc, sc.mood);
    if (sc.scene) return scenePanel(sc.scene);
    return null;
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
    sc.opts.forEach((o, k) => {
      const b = el("button", { class: "opt", type: "button", style: `--k:${k}` }, `<span class="ol">${String.fromCharCode(65 + k)}</span><span>${esc(o.t)}</span>`);
      b.addEventListener("click", () => pick(o, b, k));
      opts.appendChild(b);
    });
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
    const qs = []; let flags = {};
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
        if (id === sc.start && sc.intro) Voice.seq([["narr", sc.intro, log.querySelector(".narr")], [sc.npc, nd.t, bub]]); else Voice.say(sc.npc, nd.t, bub);
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
          if (o.note) { const v = verdict(o.q); log.appendChild(el("div", { class: "note " + v.cls }, `<b>${sc.parent ? "Le conseil de Nour :" : "Nour, à voix basse :"}</b> ${esc(o.note)}`)); v.s(); }
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
    setTimeout(show, 900);
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
    tId = setInterval(tick, 1000);
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
      const b = el("button", { class: "sit", type: "button" }, `<div class="sart">${A.scenes[s.scene]}</div><b>${esc(s.title)}</b>`);
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
    n.querySelector(".pn-body").appendChild(btn(st.idx + 1 < SCREENS.length && SCREENS[st.idx + 1].type === "chapter" ? "Chapitre suivant" : "Continuer", next));
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

  /* ---------- carnet ---------- */
  const dlg = $("#carnet");
  function openCarnet() {
    Snd.page();
    const pages = SCREENS.filter((s) => s.type === "explain" && st.carnet.includes(s.id));
    const body = $("#carnet-body");
    body.innerHTML = (pages.length ? pages.map((s) => `<section class="cpage"><h3>${esc(s.page.title)}</h3>${s.page.quote ? `<blockquote>${esc(s.page.quote)}</blockquote>` : ""}<ul>${s.page.pts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="refs">${s.page.refs.map((r) => `<span class="chip">${esc(r)}</span>`).join("")}</p></section>`).join("") : `<p class="lead">Votre carnet est encore vide : chaque fin de chapitre y ajoute une page.</p>`)
      + `<section class="cpage"><h3>Numéros utiles</h3><div class="nums">${NUMBERS.map(([a, b]) => `<div class="nb"><b>${a}</b><span>${esc(b)}</span></div>`).join("")}</div></section>`;
    dlg.hidden = false; document.body.classList.add("modal");
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
      <div class="meta"><span>Environ 25 minutes</span><span>6 chapitres</span><span>Progression enregistrée</span></div>
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
      hb.appendChild(btn(prev.done ? "Revoir mon bilan" : `Reprendre · chapitre ${sc.ch}`, () => { begin(); st = prev; st.settings = st.settings || { sound: true, calm: false }; applySettings(); if (prev.done) go(SCREENS.length - 1); else go(prev.idx); }));
      hb.appendChild(btn("Nouvelle partie", () => { begin(); restart(); }, "ghost light"));
    } else hb.appendChild(btn("Commencer", () => { begin(); go(0); }));
    stage.appendChild(n);
    setTimeout(() => n.querySelector(".hbtns button").focus({ preventScroll: true }), 50);
  }
  function begin() { Snd.init(); try { if (Snd.ctx && Snd.ctx.state === "suspended") Snd.ctx.resume(); } catch (e) { } Snd.startAmb(); Snd.good(); }

  applySettings();
  home();
  window.__game = { st: () => st, go, SCREENS };
})();
