/* La petite fourmi de l'accueil : elle sort de derrière la photo, puis vous accompagne quand vous descendez la page.
   Vue de dessus, elle s'oriente dans le sens de sa marche ; ses pattes bougent seulement quand elle avance. */
(function () {
  "use strict";
  if (!document.body || !document.body.classList.contains("page-index")) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const photo = document.querySelector(".h2-photo");
  if (!photo) return;

  // --- le dessin : une fourmi épurée, vue de dessus (silhouette réaliste, reflets doux, pattes fines articulées) ---
  const leg = (side, i) => {
    const y = [-1, 3, 7][i], a = [-34, 4, 40][i] * side, k = [[9, -5], [10, 0], [9, 5]][i], f = [[15, -14], [19, 1], [16, 15]][i];
    return `<g class="fm-leg" data-s="${side}" data-i="${i}" transform="translate(${side * 3.6},${y}) rotate(${a})"><path d="M0,0 L${side * k[0]},${k[1]} L${side * f[0]},${f[1]}" stroke="#4A1F0C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`;
  };
  const svg = `<svg viewBox="-34 -46 68 92" aria-hidden="true">
    <defs>
      <radialGradient id="fmGas" cx="38%" cy="30%" r="78%"><stop offset="0" stop-color="#F59A5C"/><stop offset=".42" stop-color="#D9661F"/><stop offset="1" stop-color="#7C2F0E"/></radialGradient>
      <radialGradient id="fmTh" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#EE8C4E"/><stop offset=".5" stop-color="#C95619"/><stop offset="1" stop-color="#6E290C"/></radialGradient>
      <linearGradient id="fmShine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="fmSoft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6"/></filter>
    </defs>
    <ellipse class="fm-shadow" cx="2.5" cy="9" rx="13" ry="30" fill="#0E1B2A" opacity=".18" filter="url(#fmSoft)"/>
    <g class="fm-legs">${[0, 1, 2].map((i) => leg(-1, i) + leg(1, i)).join("")}</g>
    <ellipse cx="0" cy="24" rx="10.5" ry="14.5" fill="url(#fmGas)"/>
    <path d="M-8.6,19 q8.6,3.6 17.2,0 M-9.6,26 q9.6,3.6 19.2,0 M-7.4,32.6 q7.4,3 14.8,0" stroke="#5C210A" stroke-width=".7" fill="none" opacity=".45"/>
    <ellipse cx="-3.4" cy="17" rx="3.2" ry="6.4" fill="url(#fmShine)" opacity=".7"/>
    <ellipse cx="0" cy="9.6" rx="2.6" ry="2.2" fill="url(#fmTh)"/>
    <ellipse cx="0" cy="1" rx="4.6" ry="7.6" fill="url(#fmTh)"/>
    <ellipse cx="-1.4" cy="-2" rx="1.4" ry="3.6" fill="url(#fmShine)" opacity=".6"/>
    <g class="fm-head">
      <g class="fm-ant fm-antL"><path d="M-3,-17 L-8.5,-23 Q-9.5,-31 -13,-37" stroke="#4A1F0C" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
      <g class="fm-ant fm-antR"><path d="M3,-17 L8.5,-23 Q9.5,-31 13,-37" stroke="#4A1F0C" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
      <path d="M-3,-20.5 q-1.2,-3 -.2,-4.4 M3,-20.5 q1.2,-3 .2,-4.4" stroke="#4A1F0C" stroke-width="1.4" stroke-linecap="round" fill="none"/>
      <path d="M0,-21.5 C6.6,-21.5 8.4,-15 7.4,-11 C6.4,-7.6 3.4,-6.4 0,-6.4 C-3.4,-6.4 -6.4,-7.6 -7.4,-11 C-8.4,-15 -6.6,-21.5 0,-21.5 Z" fill="url(#fmTh)"/>
      <ellipse class="fm-eyes" cx="0" cy="-14.6" rx="7.3" ry="2.1" fill="none"/>
      <ellipse cx="-6.2" cy="-14.4" rx="1.5" ry="2.2" fill="#1A0D08"/><ellipse cx="6.2" cy="-14.4" rx="1.5" ry="2.2" fill="#1A0D08"/>
      <circle cx="-6.6" cy="-15.2" r=".5" fill="#fff" opacity=".8"/><circle cx="5.8" cy="-15.2" r=".5" fill="#fff" opacity=".8"/>
      <ellipse cx="-2" cy="-17.6" rx="2.2" ry="1.6" fill="url(#fmShine)" opacity=".65"/>
    </g></svg>`;
  const ant = document.createElement("div");
  ant.className = "fbal"; ant.innerHTML = svg;
  ant.setAttribute("role", "img"); ant.setAttribute("aria-label", "Une petite fourmi qui vous accompagne");
  document.body.appendChild(ant);
  const legs = [...ant.querySelectorAll(".fm-leg")].map((g) => ({ g, s: +g.dataset.s, i: +g.dataset.i, base: g.getAttribute("transform") }));
  const head = ant.querySelector(".fm-head");

  // --- où elle se trouve : près de la photo au début, puis dans la marge de droite, en flânant ---
  let x = 0, y = 0, ang = Math.PI, phase = 0, born = 0, lastScroll = scrollY, inited = false, still = 0;
  const S = () => (innerWidth < 760 ? 0.5 : 0.62);   // taille
  function anchor() {   // la sortie : en bas à gauche de la photo
    const r = photo.getBoundingClientRect();
    return { x: r.left - 26 * S(), y: r.bottom - 70 };
  }
  function hidden() { const r = photo.getBoundingClientRect(); return { x: r.left + 70, y: r.bottom - 90 }; }
  function follow(t) {   // la marge de droite, avec une petite promenade de gauche à droite
    const wide = innerWidth >= 760, base = wide ? Math.max(innerWidth - 70, (innerWidth + Math.min(1180, innerWidth - 64)) / 2 + 30) : innerWidth - 26;
    // elle traverse la page en flânant : elle passe sous les images, les cartes et les textes, puis ressort
    const half = innerWidth / 2, amp = innerWidth * (wide ? .43 : .4), sx = Math.sin(scrollY / 520) * .8 + Math.sin(scrollY / 233) * .2;
    void base; return { x: half + amp * sx, y: innerHeight * (wide ? .62 : .66) + 26 * Math.sin(scrollY / 380) };
  }
  // la photo de l'accueil s'ouvre en cercle au défilement : la fourmi sort quand elle est bien visible
  const revealed = () => { const c = getComputedStyle(photo).clipPath || "none"; const m = /circle\(([\d.]+)%/.exec(c); return c === "none" || !m || +m[1] >= 62; };
  let start = 0;
  const EMERGE = reduce ? 0 : 500;
  function frame(now) {
    const dt = Math.min(.05, (now - (frame.t || now)) / 1000); frame.t = now;
    const sy = scrollY, ds = sy - lastScroll; lastScroll = sy;
    const docH = document.documentElement.scrollHeight - innerHeight, atEnd = sy >= docH - 4;
    if (!start) { if (revealed()) start = now; else { ant.style.opacity = "0"; requestAnimationFrame(frame); return; } }
    ant.style.opacity = "";
    const pr = photo.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .8 - pr.bottom) / (innerHeight * .5)));   // de la photo vers la marge
    const A = anchor(), F = follow();
    let tx = A.x + (F.x - A.x) * p, ty = A.y + (F.y - A.y) * p;
    const t = now - start;
    if (t < EMERGE) { const H = hidden(); tx = H.x; ty = H.y; ant.classList.add("behind"); }
    else if (t < EMERGE + 1500) { const k = (t - EMERGE) / 1500, e = 1 - Math.pow(1 - k, 3), H = hidden(); tx = H.x + (A.x - H.x) * e; ty = H.y + (A.y - H.y) * e; if (x < photo.getBoundingClientRect().left - 6) ant.classList.remove("behind"); }
    else ant.classList.remove("behind");
    if (!inited) { x = tx; y = ty; inited = true; }
    // elle marche vers sa cible ; sur la page, descendre vous fait avancer avec elle
    const k = reduce ? 1 : 1 - Math.pow(.0015, dt);
    const nx = x + (tx - x) * k, ny = y + (ty - y) * k;
    const vx = (nx - x) / Math.max(dt, .001), vy = (ny - y + ds) / Math.max(dt, .001), sp = Math.hypot(vx, vy);
    x = nx; y = ny;
    if (sp > 25) { const target = Math.atan2(vy, vx) + Math.PI / 2; let d = target - ang; d = Math.atan2(Math.sin(d), Math.cos(d)); ang += d * Math.min(1, dt * 7); still = 0; }
    else { still += dt; if (still > .8) { let d = (atEnd ? 0 : (p < .5 ? 0 : Math.PI)) - ang; d = Math.atan2(Math.sin(d), Math.cos(d)); ang += d * Math.min(1, dt * 2.5); } }
    // les pattes : marche en trépied (trois pattes en même temps), au rythme de la vitesse
    phase += Math.min(sp, 900) * dt * .045;
    legs.forEach((L) => { const tri = (L.i === 1) === (L.s > 0) ? 0 : Math.PI, sw = sp > 25 ? Math.sin(phase + tri) * 13 : 0; L.g.setAttribute("transform", L.base + ` rotate(${(sw * L.s).toFixed(1)})`); });
    head.setAttribute("transform", sp > 25 ? `rotate(${(Math.sin(phase * .5) * 3).toFixed(1)})` : "");
    ant.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) rotate(${ang.toFixed(3)}rad) scale(${S()})`;
    ant.classList.toggle("idle", sp <= 25); ant.classList.toggle("end", atEnd);
    // sous les objets (images, cartes, textes) ; mais au-dessus des grandes bandes pleine largeur, pour ne pas disparaître
    if (!frame.zc || now - frame.zc > 250) { frame.zc = now; ant.classList.toggle("over", bigBand(x, y)); }
    if (atEnd && !frame.waved) { frame.waved = true; hop(); }
    if (!atEnd) frame.waved = false;
    requestAnimationFrame(frame);
  }
  function bigBand(px, py) {
    let e = document.elementFromPoint(px, py);
    while (e && e !== document.body && e !== document.documentElement) {
      const cs = getComputedStyle(e), bg = cs.backgroundColor, m = /rgba?\(([^)]+)\)/.exec(bg), a = m ? (m[1].split(",")[3] == null ? 1 : +m[1].split(",")[3]) : 0;
      if ((a > .5 || (cs.backgroundImage && cs.backgroundImage !== "none")) && e.getBoundingClientRect().width >= innerWidth * .85) return true;
      e = e.parentElement;
    }
    return false;
  }
  function hop() { ant.classList.remove("hop"); void ant.offsetWidth; ant.classList.add("hop"); }
  ant.addEventListener("click", hop);
  requestAnimationFrame(frame);
})();
