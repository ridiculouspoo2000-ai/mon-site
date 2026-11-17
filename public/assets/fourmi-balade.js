/* La petite fourmi de l'accueil : elle sort de derrière la photo, puis vous accompagne quand vous descendez la page.
   Vue de dessus, elle s'oriente dans le sens de sa marche ; ses pattes bougent seulement quand elle avance. */
(function () {
  "use strict";
  if (!document.body || !document.body.classList.contains("page-index")) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const photo = document.querySelector(".h2-photo");
  if (!photo) return;

  // --- le dessin : une fourmi ronde et brillante, de grands yeux, des antennes à boule ---
  const leg = (side, i) => {
    const y = [-6, 2, 10][i], a = [-38, 0, 38][i] * side, len = [17, 18, 17][i];
    return `<g class="fm-leg" data-s="${side}" data-i="${i}" transform="translate(${side * 7},${y}) rotate(${a})"><path d="M0,0 q${side * len * .55},-3 ${side * len},${i === 1 ? 0 : (i === 0 ? -6 : 6)}" stroke="url(#fmLeg)" stroke-width="3.2" stroke-linecap="round" fill="none"/><circle cx="${side * len}" cy="${i === 1 ? 0 : (i === 0 ? -6 : 6)}" r="2.1" fill="#7A2E12"/></g>`;
  };
  const svg = `<svg viewBox="-40 -52 80 104" aria-hidden="true">
    <defs>
      <radialGradient id="fmBody" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFB27A"/><stop offset=".45" stop-color="#EE7A35"/><stop offset="1" stop-color="#B8481C"/></radialGradient>
      <radialGradient id="fmHead" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#FFC08E"/><stop offset=".5" stop-color="#F08343"/><stop offset="1" stop-color="#BE4E20"/></radialGradient>
      <linearGradient id="fmLeg" x1="0" x2="1"><stop offset="0" stop-color="#A9461D"/><stop offset="1" stop-color="#7A2E12"/></linearGradient>
      <filter id="fmSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter>
    </defs>
    <ellipse class="fm-shadow" cx="3" cy="8" rx="17" ry="34" fill="#142f46" opacity=".16" filter="url(#fmSoft)"/>
    <g class="fm-legs">${[0, 1, 2].map((i) => leg(-1, i) + leg(1, i)).join("")}</g>
    <ellipse cx="0" cy="25" rx="13.5" ry="17" fill="url(#fmBody)"/>
    <path d="M-9,18 q9,5 18,0 M-10,26 q10,5 20,0 M-8,34 q8,4 16,0" stroke="#B8481C" stroke-width="1.2" fill="none" opacity=".45"/>
    <ellipse cx="-4.5" cy="18" rx="4" ry="6.5" fill="#fff" opacity=".35"/>
    <ellipse cx="0" cy="3" rx="7.5" ry="8.5" fill="url(#fmBody)"/>
    <ellipse cx="-2.5" cy="0" rx="2.2" ry="3.2" fill="#fff" opacity=".35"/>
    <g class="fm-head">
      <g class="fm-ant fm-antL"><path d="M-5,-25 q-4,-11 -12,-15" stroke="#8C3815" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="-17" cy="-40" r="3.2" fill="url(#fmHead)"/></g>
      <g class="fm-ant fm-antR"><path d="M5,-25 q4,-11 12,-15" stroke="#8C3815" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="17" cy="-40" r="3.2" fill="url(#fmHead)"/></g>
      <circle cx="0" cy="-16" r="12.5" fill="url(#fmHead)"/>
      <ellipse cx="-4" cy="-22" rx="4.5" ry="3" fill="#fff" opacity=".35"/>
      <g class="fm-eyes"><ellipse cx="-5" cy="-18" rx="3.8" ry="4.6" fill="#1D1A24"/><ellipse cx="5" cy="-18" rx="3.8" ry="4.6" fill="#1D1A24"/>
        <circle cx="-6.2" cy="-19.8" r="1.5" fill="#fff"/><circle cx="3.8" cy="-19.8" r="1.5" fill="#fff"/><circle cx="-4" cy="-16.4" r=".7" fill="#fff"/><circle cx="6" cy="-16.4" r=".7" fill="#fff"/></g>
      <ellipse cx="-8.8" cy="-11.5" rx="2.6" ry="1.5" fill="#FF6F6F" opacity=".45"/><ellipse cx="8.8" cy="-11.5" rx="2.6" ry="1.5" fill="#FF6F6F" opacity=".45"/>
      <path class="fm-mouth" d="M-2.6,-10.2 q2.6,2.4 5.2,0" stroke="#5A2010" stroke-width="1.3" stroke-linecap="round" fill="none"/>
    </g></svg>`;
  const ant = document.createElement("div");
  ant.className = "fbal"; ant.innerHTML = svg + `<span class="fm-heart" aria-hidden="true">♥</span>`;
  ant.setAttribute("role", "img"); ant.setAttribute("aria-label", "Une petite fourmi qui vous accompagne");
  document.body.appendChild(ant);
  const legs = [...ant.querySelectorAll(".fm-leg")].map((g) => ({ g, s: +g.dataset.s, i: +g.dataset.i, base: g.getAttribute("transform") }));
  const head = ant.querySelector(".fm-head");

  // --- où elle se trouve : près de la photo au début, puis dans la marge de droite, en flânant ---
  let x = 0, y = 0, ang = Math.PI, phase = 0, born = 0, lastScroll = scrollY, inited = false, still = 0;
  const S = () => (innerWidth < 760 ? 0.62 : 0.85);   // taille
  function anchor() {   // la sortie : en bas à gauche de la photo
    const r = photo.getBoundingClientRect();
    return { x: r.left - 26 * S(), y: r.bottom - 70 };
  }
  function hidden() { const r = photo.getBoundingClientRect(); return { x: r.left + 70, y: r.bottom - 90 }; }
  function follow(t) {   // la marge de droite, avec une petite promenade de gauche à droite
    const wide = innerWidth >= 760, base = wide ? Math.max(innerWidth - 70, (innerWidth + Math.min(1180, innerWidth - 64)) / 2 + 30) : innerWidth - 26;
    const amp = wide ? 22 : 8;
    return { x: Math.min(innerWidth - 24, base + amp * Math.sin(scrollY / 260)), y: innerHeight * (wide ? .64 : .7) + 10 * Math.sin(scrollY / 410) };
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
    legs.forEach((L) => { const tri = (L.i === 1) === (L.s > 0) ? 0 : Math.PI, sw = sp > 25 ? Math.sin(phase + tri) * 16 : 0; L.g.setAttribute("transform", L.base + ` rotate(${(sw * L.s).toFixed(1)})`); });
    head.setAttribute("transform", sp > 25 ? `rotate(${(Math.sin(phase * .5) * 3).toFixed(1)})` : "");
    ant.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) rotate(${ang.toFixed(3)}rad) scale(${S()})`;
    ant.classList.toggle("idle", sp <= 25); ant.classList.toggle("end", atEnd);
    if (atEnd && !frame.waved) { frame.waved = true; hop(); }
    if (!atEnd) frame.waved = false;
    requestAnimationFrame(frame);
  }
  function hop() { ant.classList.remove("hop"); void ant.offsetWidth; ant.classList.add("hop"); }
  ant.addEventListener("click", hop);
  requestAnimationFrame(frame);
})();
