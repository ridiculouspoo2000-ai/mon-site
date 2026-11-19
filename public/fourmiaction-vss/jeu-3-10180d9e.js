/* Personnages articulés des Hautes Herbes (prototype).
   Un personnage = un squelette simple (bassin, cuisses, tibias, épaules, bras, avant-bras, cou, tête),
   habillé en vectoriel. Chaque articulation tourne autour de son vrai point de pivot :
   hanche, genou, épaule, coude. Les attitudes (marcher, parler, saluer, montrer, écouter, s'inquiéter)
   sont des animations CSS de ces rotations : les personnages bougent comme des humains. */
(function (G) {
  const tone = (hex, k) => {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k))));
    return "#" + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("");
  };
  const SKIN = { porcelaine: "#F3D2BD", claire: "#EDC3A4", rosee: "#EFC2A4", doree: "#D9A27A", olive: "#C98E63", mate: "#C68B62", cuivre: "#B5784E", brune: "#8E5A3B", ebene: "#6B4129" };
  const HAIR = { noir: "#2B211C", brun: "#4E3426", chatain: "#7A5234", blond: "#D9B064", roux: "#B5542A", gris: "#A9A7A3", poivre: "#6E6A66", blanc: "#E6E1DA", platine: "#EDE3C8", rose: "#D98AA6", bleu: "#4F79C2", violet: "#8A6BC4" };
  let UID = 0;

  // Gabarit selon l'âge : la tête est plus grande chez l'enfant, les jambes plus courtes.
  function body(age) {
    const kid = age < 12, teen = age >= 12 && age < 18;
    const H = kid ? 92 + age * 4.2 : teen ? 150 + (age - 12) * 3 : 172;
    const headR = kid ? H / 7.8 : teen ? H / 9.8 : H / 10.6;   // rayon de la tête (un peu plus grande que nature : visages lisibles)
    return {
      H, headR,
      hipY: -H * (kid ? .47 : .5), kneeY: -H * (kid ? .245 : .265), shY: -H * (kid ? .74 : .805),
      neck: kid ? 3 : 5, shW: H * (kid ? .118 : .13), hipW: H * (kid ? .078 : .074),
      thigh: H * (kid ? .085 : .078), shin: H * (kid ? .068 : .06), upArm: H * (kid ? .06 : .056), foreArm: H * (kid ? .052 : .048),
      upLen: H * (kid ? .17 : .185), foreLen: H * (kid ? .155 : .165),
    };
  }
  // un segment de membre : capsule qui s'affine, du pivot (0,0) vers le bas
  const limb = (w0, w1, len, fill, extra = "") => {
    const a = w0 / 2, b = w1 / 2;
    return `<path d="M${-a},0 C${-a},${-a * .9} ${a},${-a * .9} ${a},0 L${b},${len} C${b},${len + b * 1.1} ${-b},${len + b * 1.1} ${-b},${len} Z" fill="${fill}" stroke="rgba(20,16,12,.28)" stroke-width=".7" ${extra}/>`;
  };

  /* spec : { age, sex: "f"|"m", skin, hair, hairStyle, top, bottom, shoes, sleeves: "long"|"short", skirt, glasses, beard, badge } */
  function figure(spec) {
    const u = "r" + (++UID), B = body(spec.age || 30), sk = SKIN[spec.skin] || spec.skin || SKIN.doree;
    const hc = HAIR[spec.hair] || spec.hair || HAIR.brun, top = spec.top || "#3F7CC0", bot = spec.bottom || "#2E3A4E", shoe = spec.shoes || "#2A2522";
    const skD = tone(sk, -.16), topD = tone(top, -.2), botD = tone(bot, -.22), hcD = tone(hc, -.25);
    const { H, headR: R } = B;
    const hipY = B.hipY, kneeY = B.kneeY, shY = B.shY, neckY = shY - B.neck, headY = neckY - R * .92;
    const thighLen = kneeY - hipY, shinLen = -kneeY - 4;
    const sleeveLong = spec.sleeves !== "short";
    const defs = `<defs>
      <linearGradient id="${u}t" x1="0" x2="1"><stop offset="0" stop-color="${tone(top, .12)}"/><stop offset=".55" stop-color="${top}"/><stop offset="1" stop-color="${topD}"/></linearGradient>
      <linearGradient id="${u}b" x1="0" x2="1"><stop offset="0" stop-color="${tone(bot, .1)}"/><stop offset="1" stop-color="${botD}"/></linearGradient>
      <radialGradient id="${u}f" cx=".42" cy=".38" r=".75"><stop offset="0" stop-color="${tone(sk, .1)}"/><stop offset=".7" stop-color="${sk}"/><stop offset="1" stop-color="${skD}"/></radialGradient>
      <linearGradient id="${u}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tone(hc, .18)}"/><stop offset="1" stop-color="${hc}"/></linearGradient>
    </defs>`;
    // jambe : cuisse (pivot hanche) > tibia (pivot genou) > chaussure
    const leg = (side, back) => {
      const x = side * B.hipW * .55, c = back ? botD : `url(#${u}b)`, s = back ? tone(shoe, -.15) : shoe;
      const skirt = spec.skirt;
      const thighFill = skirt ? (back ? skD : sk) : c;
      return `<g class="leg ${side < 0 ? "lL" : "lR"}${back ? " back" : ""}" style="transform-origin:${x.toFixed(1)}px ${hipY.toFixed(1)}px">
        <g transform="translate(${x.toFixed(1)},${hipY.toFixed(1)})">${limb(B.thigh, B.thigh * .82, thighLen, thighFill)}
          <g class="shin" style="transform-origin:0px ${thighLen.toFixed(1)}px"><g transform="translate(0,${thighLen.toFixed(1)})">
            ${limb(B.thigh * .82, B.shin, shinLen, skirt ? (back ? skD : sk) : c)}
            ${spec.socks ? `<rect x="${(-B.shin / 2).toFixed(1)}" y="${(shinLen - 7).toFixed(1)}" width="${B.shin.toFixed(1)}" height="6" fill="${spec.socks}"/>` : ""}
            <path d="M${(-B.shin * .6).toFixed(1)},${(shinLen - 3).toFixed(1)} h${(B.shin * 1.1).toFixed(1)} c${(B.shin * .9).toFixed(1)},0 ${(B.shin * 1.3).toFixed(1)},3 ${(B.shin * 1.3).toFixed(1)},6 v1.8 h-${(B.shin * 2.4).toFixed(1)} z" fill="${s}"/>
          </g></g></g></g>`;
    };
    // bras : épaule > avant-bras (pivot coude) > main
    const arm = (side, back) => {
      const x = side * (B.shW - B.upArm * .35), sl = back ? topD : `url(#${u}t)`, skin = back ? skD : sk;
      return `<g class="arm ${side < 0 ? "aL" : "aR"}${back ? " back" : ""}" style="transform-origin:${x.toFixed(1)}px ${(shY + 2).toFixed(1)}px">
        <g transform="translate(${x.toFixed(1)},${(shY + 2).toFixed(1)})">${limb(B.upArm, B.upArm * .9, B.upLen, sl)}
          <g class="fore" style="transform-origin:0px ${B.upLen.toFixed(1)}px"><g transform="translate(0,${B.upLen.toFixed(1)})">
            ${limb(B.upArm * .9, B.foreArm, B.foreLen, sleeveLong ? sl : skin)}
            ${sleeveLong ? `<rect x="${(-B.foreArm / 2).toFixed(1)}" y="${(B.foreLen - 2.2).toFixed(1)}" width="${B.foreArm.toFixed(1)}" height="2.4" rx="1" fill="${back ? tone(top, -.3) : topD}"/>` : ""}
            <g class="hand"><ellipse cx="0" cy="${(B.foreLen + B.foreArm * .55).toFixed(1)}" rx="${(B.foreArm * .62).toFixed(1)}" ry="${(B.foreArm * .72).toFixed(1)}" fill="${skin}"/>
            <ellipse cx="${(side * B.foreArm * .5).toFixed(1)}" cy="${(B.foreLen + B.foreArm * .2).toFixed(1)}" rx="${(B.foreArm * .22).toFixed(1)}" ry="${(B.foreArm * .4).toFixed(1)}" fill="${skin}"/></g>
          </g></g></g></g>`;
    };
    // buste : vêtement qui suit l'épaule et la taille
    const sw = B.shW, hw = B.hipW * 1.15, waist = hipY + 4;
    const torso = `<path d="M${-sw},${shY + 3} C${-sw},${shY - 3} ${-sw * .5},${shY - 4} 0,${shY - 4} C${sw * .5},${shY - 4} ${sw},${shY - 3} ${sw},${shY + 3}
        L${hw},${waist} C${hw},${waist + 5} ${-hw},${waist + 5} ${-hw},${waist} Z" fill="url(#${u}t)"/>
      <path d="M${-hw},${waist - 2} C${-hw},${waist + 5} ${hw},${waist + 5} ${hw},${waist - 2} L${hw * 1.02},${hipY + 9} C${hw},${hipY + 13} ${-hw},${hipY + 13} ${-hw * 1.02},${hipY + 9} Z" fill="${spec.skirt ? spec.skirt : `url(#${u}b)`}"/>
      ${spec.skirt ? `<path d="M${-hw * 1.02},${hipY + 6} L${-hw * 1.55},${hipY + B.H * .14} Q0,${hipY + B.H * .16} ${hw * 1.55},${hipY + B.H * .14} L${hw * 1.02},${hipY + 6} Z" fill="${spec.skirt}"/>` : ""}
      <path d="M${-sw * .38},${shY - 3.5} Q0,${shY + 4} ${sw * .38},${shY - 3.5}" fill="none" stroke="${topD}" stroke-width="1.6" opacity=".6"/>
      ${!spec.back && spec.cut === "sweat" ? `<path d="M${-sw * .78},${shY + 1} C${-sw * .9},${shY - B.H * .07} ${-sw * .4},${shY - B.H * .1} 0,${shY - B.H * .1} C${sw * .4},${shY - B.H * .1} ${sw * .9},${shY - B.H * .07} ${sw * .78},${shY + 1} C${sw * .5},${shY + 4} ${sw * .3},${shY + 1.5} 0,${shY + 2.5} C${-sw * .3},${shY + 1.5} ${-sw * .5},${shY + 4} ${-sw * .78},${shY + 1} Z" fill="${topD}"/><path d="M${-sw * .58},${shY - 1} C${-sw * .45},${shY + 5} ${sw * .45},${shY + 5} ${sw * .58},${shY - 1}" fill="none" stroke="${tone(top, -.32)}" stroke-width="1.4" opacity=".7"/><path d="M-2.4,${shY + 3.5} q-.6,${B.H * .045} .2,${B.H * .075} M2.4,${shY + 3.5} q.6,${B.H * .04} -.2,${B.H * .07}" stroke="${tone(top, .5)}" stroke-width="1" fill="none" stroke-linecap="round"/><circle cx="-2.2" cy="${(shY + 3.5 + B.H * .075).toFixed(1)}" r=".9" fill="${tone(top, .5)}"/><circle cx="2.2" cy="${(shY + 3.5 + B.H * .07).toFixed(1)}" r=".9" fill="${tone(top, .5)}"/><path d="M${-sw * .45},${waist - B.H * .06} L${sw * .45},${waist - B.H * .06} L${sw * .36},${waist - 1} L${-sw * .36},${waist - 1} Z" fill="${tone(top, -.08)}" stroke="${topD}" stroke-width=".8"/>` : ""}
      ${!spec.back && spec.cut === "chemise" ? `<path d="M${-sw * .36},${shY - 3.6} L0,${shY + 4} L${sw * .36},${shY - 3.6} L${sw * .14},${shY + 2.5} L0,${shY + 4} L${-sw * .14},${shY + 2.5} Z" fill="${tone(top, .5)}"/>${[0, 1, 2, 3].map((i) => `<circle cx="0" cy="${(shY + 7 + i * (B.H * .05)).toFixed(1)}" r=".75" fill="${tone(top, .55)}"/>`).join("")}` : ""}
      ${!spec.back && spec.cut === "cardigan" ? `<path d="M${-sw * .3},${shY - 3.6} L${-2.2},${waist + 2} L${2.2},${waist + 2} L${sw * .3},${shY - 3.6} Q0,${shY + 2} ${-sw * .3},${shY - 3.6} Z" fill="#F1EDE6"/><path d="M${-sw * .3},${shY - 3.6} L-2.2,${waist + 2} M${sw * .3},${shY - 3.6} L2.2,${waist + 2}" stroke="${topD}" stroke-width="1"/>` : ""}
      ${spec.back && spec.cut === "sweat" ? `<path d="M${-sw * .6},${shY - 3} C${-sw * .7},${shY + B.H * .1} ${-sw * .25},${shY + B.H * .14} 0,${shY + B.H * .14} C${sw * .25},${shY + B.H * .14} ${sw * .7},${shY + B.H * .1} ${sw * .6},${shY - 3} Z" fill="${topD}"/><path d="M${-sw * .38},${shY} C${-sw * .4},${shY + B.H * .08} ${sw * .4},${shY + B.H * .08} ${sw * .38},${shY}" stroke="${tone(top, -.35)}" stroke-width="1.2" fill="none" opacity=".6"/>` : ""}
      ${false && spec.badge && !spec.back ? `<g transform="translate(${(sw * .45).toFixed(1)},${(shY + B.H * .07).toFixed(1)}) rotate(-6) scale(.7)"><rect x="-4" y="0" width="8" height="10" rx="1.4" fill="#fff" stroke="#C9D3DD" stroke-width=".6"/><rect x="-2.6" y="2" width="5.2" height="1.6" fill="#E07E12"/><rect x="-1.4" y="-1.2" width="2.8" height="1.6" rx=".5" fill="#9AA6B2"/></g>` : ""}
      <path d="M${sw * .55},${shY + 2} C${sw * .9},${(shY + waist) / 2} ${hw * .9},${waist - 6} ${hw * .8},${waist}" stroke="${topD}" stroke-width="2" fill="none" opacity=".35"/>`;
    // tête : cou, oreilles, visage, cheveux, traits
    const ex = R * .36, ey = headY + R * .05, look = R * .08;
    // --- coiffures détaillées : tresses (natte en épi), couettes hautes avec élastique, ondulations ---
    const f2 = (v) => v.toFixed(1);
    const plait = (x0, y0, x1, y1, w, n, tie) => {   // une natte : des mèches en épi qui se chevauchent, un élastique, une petite touffe
      let o = "";
      for (let i = 0; i < n; i++) {
        const t = (i + .5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, ww = w * (1 - t * .35), side = i % 2 ? 1 : -1;
        o += `<ellipse cx="${f2(x + side * ww * .18)}" cy="${f2(y)}" rx="${f2(ww * .62)}" ry="${f2((y1 - y0) / n * .78)}" transform="rotate(${side * 28} ${f2(x)} ${f2(y)})" fill="${i % 2 ? hc : hcD}"/>`;
      }
      return o + `<rect x="${f2(x1 - w * .34)}" y="${f2(y1 - w * .08)}" width="${f2(w * .68)}" height="${f2(w * .3)}" rx="${f2(w * .12)}" fill="${tie}"/>`
        + `<path d="M${f2(x1 - w * .3)},${f2(y1 + w * .2)} q${f2(w * .3)},${f2(w * .7)} ${f2(w * .6)},0" fill="${hc}"/>`;
    };
    const tieC = spec.bow || "#E2702A";
    const tail = (sg) => {   // une couette : attachée haut sur le côté, elle retombe en goutte, avec son élastique
      const ax = sg * R * .98, ay = headY - R * .62, tx = sg * R * 1.55, ty = headY + R * .55;
      return `<path d="M${f2(ax)},${f2(ay - R * .14)} C${f2(sg * R * 1.75)},${f2(ay - R * .1)} ${f2(sg * R * 1.85)},${f2(ty - R * .5)} ${f2(tx)},${f2(ty)} C${f2(sg * R * 1.3)},${f2(ty - R * .25)} ${f2(sg * R * 1.15)},${f2(ay + R * .45)} ${f2(ax)},${f2(ay + R * .14)} Z" fill="url(#${u}h)"/>`
        + `<path d="M${f2(sg * R * 1.22)},${f2(ay + R * .1)} C${f2(sg * R * 1.55)},${f2(ay + R * .35)} ${f2(sg * R * 1.58)},${f2(ty - R * .4)} ${f2(sg * R * 1.48)},${f2(ty - R * .12)}" stroke="${hcD}" stroke-width="${f2(R * .05)}" fill="none" opacity=".6"/>`
        + `<ellipse cx="${f2(ax + sg * R * .08)}" cy="${f2(ay)}" rx="${f2(R * .14)}" ry="${f2(R * .19)}" fill="${tieC}"/>`;
    };
    const wavyBack = (sg) => {   // cheveux ondulés mi-longs : des vagues régulières jusqu'aux épaules
      const pts = [[1.0, -.75], [1.18, -.1], [1.02, .45], [1.2, 1.0], [1.0, 1.5], [1.12, 1.82]];
      let d = `M${f2(sg * R * .1)},${f2(headY - R * 1.04)} C${f2(sg * R * .8)},${f2(headY - R * 1.05)} ${f2(sg * R * 1.05)},${f2(headY - R * .95)} ${f2(sg * R * pts[0][0])},${f2(headY + R * pts[0][1])}`;
      for (let i = 1; i < pts.length; i++) { const [a, b] = pts[i], [pa, pb] = pts[i - 1]; d += ` Q${f2(sg * R * (a + (i % 2 ? .14 : -.14)))},${f2(headY + R * (pb + b) / 2)} ${f2(sg * R * a)},${f2(headY + R * b)}`; }
      d += ` Q${f2(sg * R * .86)},${f2(headY + R * 2.0)} ${f2(sg * R * .62)},${f2(headY + R * 1.8)} C${f2(sg * R * .76)},${f2(headY + R * 1.2)} ${f2(sg * R * .74)},${f2(headY + R * .5)} ${f2(sg * R * .7)},${f2(headY)} Z`;
      return `<path d="${d}" fill="url(#${u}h)"/><path d="M${f2(sg * R * 1.02)},${f2(headY + R * .2)} q${f2(sg * R * .14)},${f2(R * .28)} 0,${f2(R * .55)} q${f2(-sg * R * .14)},${f2(R * .28)} 0,${f2(R * .55)}" stroke="${hcD}" stroke-width="${f2(R * .05)}" fill="none" opacity=".55"/>`;
    };
    const hairBack = {
      long: `<path d="M${-R * .2},${headY - R * 1.02} C${-R * 1.2},${headY - R * .95} ${-R * 1.3},${headY + R * .9} ${-R * 1.05},${headY + R * 2.05} C${-R * .85},${headY + R * 2.2} ${-R * .55},${headY + R * 2.1} ${-R * .5},${headY + R * 1.7} C${-R * .7},${headY + R * 1.1} ${-R * .78},${headY + R * .6} ${-R * .7},${headY} Z M${R * .2},${headY - R * 1.02} C${R * 1.2},${headY - R * .95} ${R * 1.3},${headY + R * .9} ${R * 1.05},${headY + R * 2.05} C${R * .85},${headY + R * 2.2} ${R * .55},${headY + R * 2.1} ${R * .5},${headY + R * 1.7} C${R * .7},${headY + R * 1.1} ${R * .78},${headY + R * .6} ${R * .7},${headY} Z" fill="${hcD}"/>`,
      bun: `<circle cx="${-R * .15}" cy="${headY - R * 1.12}" r="${R * .48}" fill="url(#${u}h)"/>`,
      ponytail: `<path d="M${R * .55},${headY - R * .55} C${R * 1.5},${headY - R * .2} ${R * 1.3},${headY + R * 1.4} ${R * .95},${headY + R * 1.8} C${R * 1.05},${headY + R * .9} ${R * .9},${headY + R * .1} ${R * .4},${headY - R * .2} Z" fill="${hc}"/>`,
      braids: `${plait(-R * 1.0, headY + R * .15, -R * .92, headY + R * 2.15, R * .42, 7, tieC)}${plait(R * 1.0, headY + R * .15, R * .92, headY + R * 2.15, R * .42, 7, tieC)}`,
      pigtails: `${tail(-1)}${tail(1)}`,
      wavy: `${wavyBack(-1)}${wavyBack(1)}`,
      afro: `<circle cx="0" cy="${headY - R * .15}" r="${R * 1.28}" fill="url(#${u}h)"/>`,
    }[spec.hairStyle] || "";
    const hairFront = {
      short: `<path d="M${-R * 1.02},${headY - R * .05} C${-R * 1.1},${headY - R * 1.25} ${R * 1.1},${headY - R * 1.3} ${R * 1.02},${headY - R * .1} C${R * .7},${headY - R * .62} ${-R * .2},${headY - R * .78} ${-R * 1.02},${headY - R * .05} Z" fill="url(#${u}h)"/>`,
      buzz: `<path d="M${-R * .98},${headY - R * .15} C${-R},${headY - R * 1.12} ${R},${headY - R * 1.15} ${R * .98},${headY - R * .2} C${R * .6},${headY - R * .7} ${-R * .6},${headY - R * .72} ${-R * .98},${headY - R * .15} Z" fill="${hc}" opacity=".9"/>`,
      long: `<path d="M${-R * 1.03},${headY - R * .1} C${-R * 1.1},${headY - R * 1.32} ${R * 1.1},${headY - R * 1.32} ${R * 1.03},${headY - R * .1} C${R * .7},${headY - R * .6} ${-R * .7},${headY - R * .6} ${-R * 1.03},${headY - R * .1} Z" fill="url(#${u}h)"/><path d="M${-R * 1.06},${headY + R * .5} C${-R * 1.25},${headY - R * 1.35} ${R * 1.25},${headY - R * 1.35} ${R * 1.06},${headY + R * .5} C${R * .95},${headY - R * .3} ${R * .3},${headY - R * .72} ${-R * .1},${headY - R * .62} C${-R * .5},${headY - R * .4} ${-R * .95},${headY - R * .2} ${-R * 1.06},${headY + R * .5} Z" fill="url(#${u}h)"/>`,
      bun: `<path d="M${-R * 1.02},${headY - R * .05} C${-R * 1.1},${headY - R * 1.25} ${R * 1.1},${headY - R * 1.3} ${R * 1.02},${headY - R * .05} C${R * .6},${headY - R * .72} ${-R * .6},${headY - R * .72} ${-R * 1.02},${headY - R * .05} Z" fill="url(#${u}h)"/>`,
      ponytail: `<path d="M${-R * 1.02},${headY - R * .05} C${-R * 1.1},${headY - R * 1.25} ${R * 1.1},${headY - R * 1.3} ${R * 1.02},${headY - R * .05} C${R * .6},${headY - R * .72} ${-R * .6},${headY - R * .72} ${-R * 1.02},${headY - R * .05} Z" fill="url(#${u}h)"/>`,
      braids: `<path d="M${-R * 1.04},${headY + R * .2} C${-R * 1.12},${headY - R * 1.25} ${R * 1.12},${headY - R * 1.3} ${R * 1.04},${headY + R * .2} C${R * .9},${headY - R * .4} ${R * .4},${headY - R * .82} 0,${headY - R * .86} C${-R * .4},${headY - R * .82} ${-R * .9},${headY - R * .4} ${-R * 1.04},${headY + R * .2} Z" fill="url(#${u}h)"/><path d="M0,${headY - R * 1.03} L0,${headY - R * .86}" stroke="${tone(sk, -.2)}" stroke-width="${(R * .05).toFixed(2)}"/>`,
      afro: "",
      bob: `<path d="M${-R * 1.03},${headY - R * .1} C${-R * 1.1},${headY - R * 1.32} ${R * 1.1},${headY - R * 1.32} ${R * 1.03},${headY - R * .1} C${R * .7},${headY - R * .6} ${-R * .7},${headY - R * .6} ${-R * 1.03},${headY - R * .1} Z" fill="url(#${u}h)"/><path d="M${-R * 1.1},${headY + R * .72} C${-R * 1.28},${headY - R * 1.3} ${R * 1.28},${headY - R * 1.3} ${R * 1.1},${headY + R * .72} Q${R * 1.02},${headY + R * .86} ${R * .84},${headY + R * .74} C${R * .9},${headY + R * .1} ${R * .86},${headY - R * .36} ${R * .62},${headY - R * .5} L${-R * .62},${headY - R * .5} C${-R * .86},${headY - R * .36} ${-R * .9},${headY + R * .1} ${-R * .84},${headY + R * .74} Q${-R * 1.02},${headY + R * .86} ${-R * 1.1},${headY + R * .72} Z" fill="url(#${u}h)"/><path d="M${-R * .62},${headY - R * .5} L${R * .62},${headY - R * .5}" stroke="${hcD}" stroke-width="${(R * .05).toFixed(2)}" opacity=".5"/><path d="M${-R * .2},${headY - R * 1.0} q${-R * .45},${R * .2} ${-R * .6},${R * .5}" stroke="#fff" stroke-opacity=".18" stroke-width="${(R * .08).toFixed(2)}" fill="none" stroke-linecap="round"/>`,
      pigtails: `<path d="M${-R * 1.02},${headY - R * .05} C${-R * 1.1},${headY - R * 1.25} ${R * 1.1},${headY - R * 1.3} ${R * 1.02},${headY - R * .05} C${R * .55},${headY - R * .78} ${R * .1},${headY - R * .85} 0,${headY - R * .86} C${-R * .1},${headY - R * .85} ${-R * .55},${headY - R * .78} ${-R * 1.02},${headY - R * .05} Z" fill="url(#${u}h)"/><path d="M0,${headY - R * 1.02} v${R * .2}" stroke="${hcD}" stroke-width="${(R * .04).toFixed(2)}" opacity=".6"/>`,
      bald: `<path d="M${-R * .99},${headY + R * .1} C${-R * 1.04},${headY - R * .25} ${-R * .9},${headY - R * .45} ${-R * .82},${headY - R * .4} L${-R * .86},${headY + R * .25} Z M${R * .99},${headY + R * .1} C${R * 1.04},${headY - R * .25} ${R * .9},${headY - R * .45} ${R * .82},${headY - R * .4} L${R * .86},${headY + R * .25} Z" fill="${hc}"/>`,
      spiky: `<path d="M${-R * 1.02},${headY - R * .05} L${-R * .9},${headY - R * 1.15} L${-R * .55},${headY - R * .9} L${-R * .3},${headY - R * 1.3} L${0},${headY - R * .95} L${R * .3},${headY - R * 1.3} L${R * .55},${headY - R * .9} L${R * .9},${headY - R * 1.15} L${R * 1.02},${headY - R * .05} C${R * .6},${headY - R * .6} ${-R * .6},${headY - R * .6} ${-R * 1.02},${headY - R * .05} Z" fill="url(#${u}h)"/>`,
      curly: `<g fill="url(#${u}h)">${[-.85, -.45, 0, .45, .85].map((k, i) => `<circle cx="${R * k}" cy="${headY - R * (.7 + (i % 2) * .15)}" r="${R * .42}"/>`).join("")}</g>`,
      wavy: `<path d="M${-R * 1.03},${headY - R * .1} C${-R * 1.1},${headY - R * 1.32} ${R * 1.1},${headY - R * 1.32} ${R * 1.03},${headY - R * .1} C${R * .7},${headY - R * .6} ${-R * .7},${headY - R * .6} ${-R * 1.03},${headY - R * .1} Z" fill="url(#${u}h)"/><path d="M${-R * 1.06},${headY + R * .45} C${-R * 1.25},${headY - R * 1.35} ${R * 1.25},${headY - R * 1.35} ${R * 1.06},${headY + R * .45} C${R * 1.0},${headY - R * .2} ${R * .55},${headY - R * .8} ${R * .05},${headY - R * .7} Q${-R * .35},${headY - R * .82} ${-R * .55},${headY - R * .5} Q${-R * .85},${headY - R * .28} ${-R * 1.06},${headY + R * .45} Z" fill="url(#${u}h)"/><path d="M${-R * .45},${headY - R * .95} q${R * .25},${R * .1} ${R * .3},${R * .35} q${R * .05},${R * .2} ${R * .3},${R * .25}" stroke="${hcD}" stroke-width="${(R * .05).toFixed(2)}" fill="none" opacity=".55"/>`,
    }[spec.hairStyle || "short"] || "";
    // l'expression : sourcils et bouche (sourire, grand sourire, calme, inquiet, surpris, fâché, triste)
    const mood = spec.mood || "smile", bl = (dy1, dy2, dy3) => `M${-ex - R * .2},${ey - R * .32 + R * dy1} q${R * .2},${-R * .12 + R * dy2} ${R * .38},${-R * .02 + R * dy3} M${ex + R * .2},${ey - R * .32 + R * dy1} q${-R * .2},${-R * .12 + R * dy2} ${-R * .38},${-R * .02 + R * dy3}`;
    const BROW = { smile: bl(0, 0, 0), big: bl(-.06, -.02, 0), calm: bl(.02, .06, .02), concern: bl(.06, .04, -.16), sad: bl(.06, .04, -.16), o: bl(-.12, -.04, -.04), angry: bl(-.06, .1, .2) };
    const mx = look, my = ey + R * .6, MOUTH = { smile: `M${-R * .2 + mx},${my} q${R * .22},${R * .14} ${R * .44},0`, big: `M${-R * .26 + mx},${my - R * .02} q${R * .28},${R * .26} ${R * .52},0`,
      calm: `M${-R * .17 + mx},${my + R * .02} q${R * .17},${R * .05} ${R * .34},0`, concern: `M${-R * .17 + mx},${my + R * .06} q${R * .17},${-R * .09} ${R * .34},0`, sad: `M${-R * .19 + mx},${my + R * .08} q${R * .19},${-R * .14} ${R * .38},0`,
      o: `M${mx - R * .07},${my + R * .04} a${R * .08},${R * .1} 0 1 0 ${R * .14},0 a${R * .08},${R * .1} 0 1 0 ${-R * .14},0`, angry: `M${-R * .18 + mx},${my + R * .06} q${R * .18},${-R * .06} ${R * .36},0` };
    const grey = spec.age >= 55 || spec.hair === "gris" || spec.hair === "poivre";
    // accessoires : bandeau, nœud, boucles d'oreilles
    const acc = (spec.headband ? `<path d="M${-R * .99},${headY - R * .2} C${-R * .9},${headY - R * 1.2} ${R * .9},${headY - R * 1.2} ${R * .99},${headY - R * .2}" fill="none" stroke="${tone(spec.headband, -.35)}" stroke-width="${(R * .27).toFixed(2)}" stroke-linecap="round"/><path d="M${-R * .99},${headY - R * .2} C${-R * .9},${headY - R * 1.2} ${R * .9},${headY - R * 1.2} ${R * .99},${headY - R * .2}" fill="none" stroke="${spec.headband}" stroke-width="${(R * .2).toFixed(2)}" stroke-linecap="round"/><path d="M${-R * .99},${headY - R * .2} C${-R * .9},${headY - R * 1.2} ${R * .9},${headY - R * 1.2} ${R * .99},${headY - R * .2}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="${(R * .05).toFixed(2)}" transform="translate(0,${(-R * .05).toFixed(2)})"/>` : "")
      + (spec.bow ? `<g transform="translate(${(spec.back ? -R * .5 : R * .55).toFixed(1)},${(headY - R * .86).toFixed(1)}) rotate(${spec.back ? -18 : 18}) scale(1.45)"><path d="M0,0 L${-R * .42},${-R * .26} L${-R * .42},${R * .26} Z M0,0 L${R * .42},${-R * .26} L${R * .42},${R * .26} Z" fill="${spec.bow}" stroke="${tone(spec.bow, -.35)}" stroke-width="${(R * .05).toFixed(2)}" stroke-linejoin="round"/><circle r="${(R * .13).toFixed(2)}" fill="${tone(spec.bow, -.25)}"/></g>` : "")
      + (spec.earring ? `<circle cx="${-R * .98}" cy="${headY + R * .4}" r="${(R * .08).toFixed(2)}" fill="#E5B94E"/><circle cx="${R * .98}" cy="${headY + R * .4}" r="${(R * .08).toFixed(2)}" fill="#E5B94E"/>` : "");
    const cap = (y2) => `<path d="M${-R * 1.01},${headY + R * y2} C${-R * 1.12},${headY - R * 1.3} ${R * 1.12},${headY - R * 1.3} ${R * 1.01},${headY + R * y2} C${R * .6},${headY + R * (y2 + .18)} ${-R * .6},${headY + R * (y2 + .18)} ${-R * 1.01},${headY + R * y2} Z" fill="url(#${u}h)"/>`;
    const backHair = {
      short: cap(.42), buzz: cap(.3).replace("/>", ' opacity=".92"/>'), spiky: cap(.38), curly: cap(.4) + `<g fill="url(#${u}h)">${[-.8, -.4, 0, .4, .8].map((k, i) => `<circle cx="${R * k}" cy="${headY - R * (.6 + (i % 2) * .15)}" r="${R * .42}"/>`).join("")}</g>`,
      bald: `<path d="M${-R * 1.0},${headY + R * .05} C${-R * .9},${headY + R * .55} ${R * .9},${headY + R * .55} ${R * 1.0},${headY + R * .05} C${R * .6},${headY + R * .35} ${-R * .6},${headY + R * .35} ${-R * 1.0},${headY + R * .05} Z" fill="${hc}"/>`,
      long: cap(.5) + `<path d="M${-R * 1.02},${headY + R * .2} C${-R * 1.15},${headY + R * 1.6} ${-R * .8},${headY + R * 2.4} 0,${headY + R * 2.5} C${R * .8},${headY + R * 2.4} ${R * 1.15},${headY + R * 1.6} ${R * 1.02},${headY + R * .2} Z" fill="url(#${u}h)"/>`,
      bob: cap(.5) + `<path d="M${-R * 1.08},${headY} C${-R * 1.12},${headY + R * .9} ${R * 1.12},${headY + R * .9} ${R * 1.08},${headY} Z" fill="url(#${u}h)"/>`,
      bun: cap(.42) + `<circle cx="0" cy="${headY - R * .95}" r="${R * .46}" fill="url(#${u}h)"/>`,
      ponytail: cap(.42) + `<path d="M${-R * .2},${headY - R * .1} C${-R * .35},${headY + R * 1.2} ${-R * .1},${headY + R * 1.9} 0,${headY + R * 2.1} C${R * .1},${headY + R * 1.9} ${R * .35},${headY + R * 1.2} ${R * .2},${headY - R * .1} Z" fill="${hcD}"/>`,
      braids: cap(.42) + `${plait(-R * .45, headY + R * .35, -R * .5, headY + R * 2.2, R * .4, 7, tieC)}${plait(R * .45, headY + R * .35, R * .5, headY + R * 2.2, R * .4, 7, tieC)}`,
      pigtails: cap(.42) + `${tail(-1)}${tail(1)}`,
      afro: `<circle cx="0" cy="${headY - R * .15}" r="${R * 1.28}" fill="url(#${u}h)"/>`,
      wavy: cap(.5) + `${wavyBack(-1)}${wavyBack(1)}<path d="M${-R * .75},${headY + R * .4} q${R * .2},${R * .6} 0,${R * 1.2} M${R * .75},${headY + R * .4} q${-R * .2},${R * .6} 0,${R * 1.2}" stroke="${hcD}" stroke-width="${(R * .05).toFixed(2)}" fill="none" opacity=".5"/>`,
    }[spec.hairStyle || "short"] || cap(.42);
    const headBack = `<g class="head" style="transform-origin:0px ${neckY.toFixed(1)}px">
      <rect x="${-R * .3}" y="${neckY - 3}" width="${R * .6}" height="${B.neck + 6}" rx="2" fill="${skD}"/>
      <ellipse cx="${-R * .98}" cy="${headY + R * .12}" rx="${R * .16}" ry="${R * .24}" fill="${skD}"/><ellipse cx="${R * .98}" cy="${headY + R * .12}" rx="${R * .16}" ry="${R * .24}" fill="${skD}"/>
      <ellipse cx="0" cy="${headY}" rx="${R}" ry="${R * 1.03}" fill="${sk}"/>
      ${backHair}${acc}</g>`;
    const head = spec.back ? headBack : `<g class="head" style="transform-origin:0px ${neckY.toFixed(1)}px">
      ${hairBack}
      <rect x="${-R * .28}" y="${neckY - 3}" width="${R * .56}" height="${B.neck + 6}" rx="2" fill="${skD}"/>
      <ellipse cx="${-R * .98}" cy="${headY + R * .12}" rx="${R * .16}" ry="${R * .24}" fill="${skD}"/><ellipse cx="${R * .98}" cy="${headY + R * .12}" rx="${R * .16}" ry="${R * .24}" fill="${sk}"/>
      <path d="M0,${headY - R} C${R * .62},${headY - R} ${R},${headY - R * .6} ${R},${headY} C${R},${headY + R * .62} ${R * .55},${headY + R * 1.02} 0,${headY + R * 1.04} C${-R * .55},${headY + R * 1.02} ${-R},${headY + R * .62} ${-R},${headY} C${-R},${headY - R * .6} ${-R * .62},${headY - R} 0,${headY - R} Z" fill="url(#${u}f)"/>
      ${hairFront}${acc}
      <g class="face">
        <path d="${BROW[mood] || BROW.smile}" stroke="${grey ? "#8E8780" : hcD}" stroke-width="${(R * .085).toFixed(2)}" stroke-linecap="round" fill="none"/>
        <g class="eyes"><ellipse cx="${-ex + look}" cy="${ey}" rx="${R * .17}" ry="${R * .2}" fill="#fff"/><ellipse cx="${ex + look}" cy="${ey}" rx="${R * .17}" ry="${R * .2}" fill="#fff"/>
          <g class="pupils"><circle cx="${-ex + look * 2}" cy="${ey + R * .02}" r="${R * .12}" fill="${spec.eyes || "#5A3A22"}"/><circle cx="${ex + look * 2}" cy="${ey + R * .02}" r="${R * .12}" fill="${spec.eyes || "#5A3A22"}"/><circle cx="${-ex + look * 2}" cy="${ey + R * .03}" r="${R * .065}" fill="#140D09"/><circle cx="${ex + look * 2}" cy="${ey + R * .03}" r="${R * .065}" fill="#140D09"/>
          <circle cx="${-ex + look * 2 - R * .035}" cy="${ey - R * .03}" r="${R * .035}" fill="#fff"/><circle cx="${ex + look * 2 - R * .035}" cy="${ey - R * .03}" r="${R * .035}" fill="#fff"/></g>
          <path class="lid" d="M${-ex + look - R * .16},${ey - R * .02} q${R * .16},${-R * .2} ${R * .32},0 M${ex + look - R * .16},${ey - R * .02} q${R * .16},${-R * .2} ${R * .32},0" stroke="${tone(sk, -.4)}" stroke-width="${(R * .05).toFixed(2)}" fill="none" stroke-linecap="round"/></g>
        <path d="M${R * .06},${ey + R * .12} q${R * .1 * (spec.nose || 1)},${R * .28 * (spec.nose || 1)} ${-R * .06 * (spec.nose || 1)},${R * .34 * (spec.nose || 1)}" stroke="${tone(sk, -.3)}" stroke-width="${(R * .05).toFixed(2)}" fill="none" stroke-linecap="round"/>
        <ellipse cx="${-ex - R * .05}" cy="${ey + R * .42}" rx="${R * .17}" ry="${R * .09}" fill="#E8826F" opacity=".28"/><ellipse cx="${ex + R * .15}" cy="${ey + R * .42}" rx="${R * .17}" ry="${R * .09}" fill="#E8826F" opacity=".28"/>
        <g class="mouth"><path class="m-closed" d="${MOUTH[mood] || MOUTH.smile}" stroke="${tone(sk, -.45)}" stroke-width="${(R * .065).toFixed(2)}" fill="none" stroke-linecap="round"/>
          <ellipse class="m-open" cx="${look + R * .02}" cy="${ey + R * .63}" rx="${R * .15}" ry="${R * .1}" fill="#7A3B33"/></g>
        ${mood === "angry" ? `<ellipse class="flush" cx="${look - R * .48}" cy="${ey + R * .36}" rx="${R * .2}" ry="${R * .13}" fill="#E0442B" opacity=".42"/><ellipse class="flush" cx="${look + R * .48}" cy="${ey + R * .36}" rx="${R * .2}" ry="${R * .13}" fill="#E0442B" opacity=".42"/><path d="M${-ex - R * .28},${ey - R * .5} l${R * .16},${R * .1} M${ex + R * .28},${ey - R * .5} l${-R * .16},${R * .1}" stroke="${tone(sk, -.4)}" stroke-width="${(R * .04).toFixed(2)}"/>` : ""}
        ${mood === "sad" ? `<path class="tear" d="M${-ex + look},${ey + R * .2} q${-R * .08},${R * .2} 0,${R * .26} q${R * .08},${-R * .06} 0,${-R * .26} Z" fill="#7EC8F2" opacity=".9"/>` : ""}
        ${mood === "o" ? `<ellipse cx="${-ex + look}" cy="${ey}" rx="${R * .2}" ry="${R * .24}" fill="none" stroke="#fff" stroke-width="${(R * .03).toFixed(2)}" opacity=".6"/>` : ""}
        ${spec.glasses ? `<g fill="none" stroke="${spec.glasses}" stroke-width="${(R * .065).toFixed(2)}">${spec.glassShape === "square"
          ? `<rect x="${-ex + look - R * .29}" y="${ey - R * .22}" width="${R * .58}" height="${R * .44}" rx="${(R * .06).toFixed(2)}"/><rect x="${ex + look - R * .29}" y="${ey - R * .22}" width="${R * .58}" height="${R * .44}" rx="${(R * .06).toFixed(2)}"/><path d="M${-ex + look + R * .29},${ey - R * .04} h${ex * 2 - R * .58}"/>`
          : `<circle cx="${-ex + look}" cy="${ey}" r="${R * .25}"/><circle cx="${ex + look}" cy="${ey}" r="${R * .25}"/><path d="M${-ex + look + R * .25},${ey} h${ex * 2 - R * .5}"/>`}</g>` : ""}
        ${spec.moustache ? `<path d="M${look - R * .32},${ey + R * .5} q${R * .32},${-R * .18} ${R * .64},0 q${-R * .32},${R * .1} ${-R * .64},0 Z" fill="${grey ? "#B9B3AC" : hcD}"/>` : ""}
        ${spec.beard ? (() => { const bc = grey ? "#B9B3AC" : hc, bd = grey ? "#9A948D" : hcD, jy = headY + R * .15;
          return `<path d="M${-R * .97},${jy - R * .25} C${-R * 1.0},${headY + R * .75} ${-R * .62},${headY + R * 1.22} 0,${headY + R * 1.26} C${R * .62},${headY + R * 1.22} ${R * 1.0},${headY + R * .75} ${R * .97},${jy - R * .25}
            L${R * .8},${jy - R * .2} C${R * .74},${headY + R * .5} ${R * .42},${headY + R * .58} ${R * .2},${headY + R * .52} Q0,${headY + R * .46} ${-R * .2},${headY + R * .52} C${-R * .42},${headY + R * .58} ${-R * .74},${headY + R * .5} ${-R * .8},${jy - R * .2} Z" fill="${bc}"/>
            <path d="M${look - R * .3},${ey + R * .5} q${R * .3},${-R * .16} ${R * .6},0 q${-R * .3},${R * .12} ${-R * .6},0 Z" fill="${bd}"/>
            <path d="M${look - R * .16},${ey + R * .66} q${R * .16},${R * .1} ${R * .32},0" stroke="${tone(sk, -.45)}" stroke-width="${(R * .06).toFixed(2)}" fill="none" stroke-linecap="round"/>
            <path d="M${-R * .55},${headY + R * .85} q${R * .1},${R * .12} ${R * .22},${R * .16} M${R * .55},${headY + R * .85} q${-R * .1},${R * .12} ${-R * .22},${R * .16} M${-R * .1},${headY + R * 1.05} v${R * .12} M${R * .12},${headY + R * 1.04} v${R * .12}" stroke="${bd}" stroke-width="${(R * .05).toFixed(2)}" stroke-linecap="round" opacity=".7"/>`; })() : ""}
      </g></g>`;
    const shadow = `<ellipse cx="0" cy="1" rx="${(B.H * .14).toFixed(1)}" ry="${(B.H * .035).toFixed(1)}" fill="#1B2A22" opacity=".18"/>`;
    const ex0 = (spec.hairStyle === "bun" || spec.hairStyle === "afro" ? R * .6 : 0), vb = `${-H * .32} ${-H * 1.02 - ex0} ${H * .64} ${H * 1.06 + ex0}`;
    return `<svg class="rig" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" overflow="visible">${defs}${shadow}
      <g class="fig${spec.back ? " back" : ""}"><g class="bob">${spec.back ? `${leg(1, false)}${leg(-1, false)}${torso}${arm(1, false)}${arm(-1, false)}${head}` : `${arm(1, true)}${leg(1, true)}${leg(-1, false)}${torso}${head}${arm(-1, false)}`}</g></g></svg>`;
  }
  // La distribution du jeu : âge, sexe, coiffure, vêtements (couleurs reprises des anciens personnages)
  const HS = { chignon: "bun", court: "short", ondule: "wavy", carre: "bob", rase: "buzz", chauve: "bald", boucles: "curly", herisse: "spiky", couettes: "pigtails", tresses: "braids", long: "long", queue: "ponytail", afro: "afro" };
  const AGE = { nour: 34, bastien: 20, ines: 26, jade: 29, kevin: 24, garnier: 58, lou: 10, malo: 7, maelys: 14, roussel: 42, benali: 40, zoe: 8, theo: 8, sacha: 11, clara: 17, enzo: 14, lena: 13, parent: 46, rey: 40, karim: 35, petit: 68, intervenant: 50 };
  const FEM = new Set(["nour", "ines", "jade", "maelys", "benali", "zoe", "clara", "lena", "petit"]);
  const BOT = { nour: "#38465C", bastien: "#3A4A64", ines: "#2E3A4E", jade: "#4A5A78", kevin: "#3B3F48", garnier: "#4B4136", lou: "#40506A", malo: "#3D5A80", maelys: "#33405C", roussel: "#2F3540", benali: "#3A2F3E", zoe: "#6B4E9A", theo: "#3D5A80", sacha: "#2F4058", clara: "#2E3A4E", enzo: "#45506A", lena: "#4E6A8E", parent: "#3A3F48", rey: "#2F3540", karim: "#4B4136", petit: "#5A5060", intervenant: "#3B342E" };
  function specOf(who, c) {
    if (!c) return null;
    const age = AGE[who] || (c.child ? 10 : 35);
    return { age, sex: FEM.has(who) ? "f" : "m", skin: SKIN[c.skin] || c.skin || "doree", hair: c.hc || "brun", hairStyle: HS[c.hair] || "short", top: c.top || "#3F7CC0",
      bottom: BOT[who] || "#33405C", sleeves: c.child && age < 12 ? "short" : "long", glasses: c.glasses ? "#3B3B3B" : null, beard: false, moustache: false,   // plus de barbe ni de moustache sur les personnages du jeu
      badge: !!c.staff, skirt: who === "zoe" ? "#6B4E9A" : null, socks: who === "zoe" ? "#fff" : null };
  }
  // Votre personnage (personnalisation) traduit en personnage articulé
  function specOfLook(L) {
    if (!L) return null;
    return { age: 27, sex: ["tresses", "long", "ondule", "chignon", "couettes", "carre"].includes(L.hair) ? "f" : "m", skin: SKIN[L.skin] || "#D9A27A", hair: L.hc || "brun", hairStyle: HS[L.hair] || "short", top: L.top || "#3F7CC0", bottom: "#33405C",
      glasses: L.glasses ? ({ rouge: "#C2412A", doree: "#C9A24A" }[L.glasses] || "#3B3B3B") : null, glassShape: L.glasses === "carree" ? "square" : "round", beard: !!L.barbe, moustache: !!L.moustache, badge: true,
      eyes: { marron: "#5A3A22", noisette: "#8A5A2A", vert: "#4F7A3A", bleu: "#3F6FA8", gris: "#6E7780" }[L.eyes] || null,
      mood: L.mood || "smile", nose: Number(L.nose || 1), cut: L.cut || "pull", headband: L.headband || null, bow: L.bow || null, earring: !!L.earring };
  }
  const POSE = { stand: "p-idle", talk: "p-talk", wave: "p-wave", walk: "p-walk", run: "p-run", point: "p-point", sit: "p-sit", listen: "p-listen", sad: "p-sad", angry: "p-angry" };
  // Pour placer un personnage dans l'ancien repère des figurines (viewBox -22 -60 44 64, pieds en 0,0)
  function inMini(spec, pose, opts = {}) {
    let svg = figure(spec);
    if (opts.chair) svg = svg.replace('<g class="fig', chair(spec.age, opts.chair === true ? undefined : opts.chair) + '<g class="fig');
    const H = body(spec.age || 30).H, k = 50 / 172;   // échelle du plan : un adulte mesure environ 1,90 m à l'échelle des portes et des bâtiments
    const m = /viewBox="([^"]+)"/.exec(svg)[1].split(" ").map(Number);
    const w = m[2] * k, h = m[3] * k, x = m[0] * k, y = m[1] * k;
    return svg.replace('<svg class="rig"', `<svg class="rig ${POSE[pose] || "p-idle"}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}"`);
  }
  // Portrait (buste) : le même personnage, cadré sur le haut du corps
  function bust(spec, cls = "") {
    const svg = figure(spec), B = body(spec.age || 30), top = B.shY - B.neck - B.headR * (spec.hairStyle === "bun" || spec.hairStyle === "afro" ? 2.95 : 2.4), hgt = -top + B.shY * -0.0 + B.H * .2;
    return svg.replace(/viewBox="[^"]+"/, `viewBox="${(-B.H * .2).toFixed(1)} ${top.toFixed(1)} ${(B.H * .4).toFixed(1)} ${(B.H * .4 + (spec.hairStyle === "bun" || spec.hairStyle === "afro" ? B.headR * .55 : 0)).toFixed(1)}"`).replace('<svg class="rig"', `<svg class="rig rig-bust p-idle ${cls}"`);
  }
  // une chaise (vue de trois quarts) pour qui est assis : plus personne n'est « assis sur rien »
  function chair(age, col = "#A8774B") {
    const B = body(age || 30), seatY = B.hipY + 2, sw = B.hipW * 2.6, d = col, dk = tone(col, -.28), lt = tone(col, .15);
    return `<g class="chair"><path d="M${-sw * .9},${seatY - B.H * .26} h${sw * .3} v${B.H * .3} h${-sw * .3} Z" fill="${dk}"/>
      <path d="M${-sw * .95},${seatY} L${sw * .7},${seatY} L${sw * .85},${seatY + 4} L${-sw * .8},${seatY + 4} Z" fill="${lt}"/>
      <rect x="${-sw * .8}" y="${seatY + 4}" width="2.4" height="${-seatY - 4}" fill="${dk}"/><rect x="${sw * .7}" y="${seatY + 4}" width="2.4" height="${-seatY - 4}" fill="${d}"/>
      <rect x="${-sw * .45}" y="${seatY + 4}" width="2" height="${-seatY - 6}" fill="${dk}" opacity=".7"/></g>`;
  }
  G.RIG = { figure, inMini, bust, specOf, specOfLook, POSE, SKIN, HAIR, chair, body };
})(typeof window !== "undefined" ? window : globalThis);

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
  // Durée d’un enregistrement : la vraie si le navigateur la connaît ; sinon (iPhone, réponse sans taille) une estimation
  // d’après le texte, un peu courte pour que les mots s’affichent avec la voix, jamais après.
  const audDur = (a, text) => { const d = a && a.duration; if (d && isFinite(d) && d > 0.3) return d; return Math.max(1.2, String(text || "").replace(/\s+/g, " ").length / 15.5); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const NAMES = { yanis: "Yanis", lea: "Léa", nour: "Nour", bastien: "Bastien", ines: "Inès", jade: "Jade", kevin: "Kévin", garnier: "Théo", lou: "Lou", malo: "Malo", maelys: "Maëlys", roussel: "M. Roussel", benali: "Mme Benali", lena: "Léna", sacha: "Sacha", theo: "Noé", zoe: "Zoé", clara: "Clara", enzo: "Enzo" };
  // Refonte : mise en scène corrigée. Devant la régie (« local »), les places extérieures tombent sur le toit
  // de la restauration : Maëlys et vous attendez donc dans la régie elle-même (là où se tient l'atelier bois).
  // (la scène de Maëlys se joue désormais dans la cour : voir STAGE.maelys dans content.js)
  // Moments graves : le décor se fait discret (désaturé, assourdi) pour laisser toute la place à la parole de l'enfant.
  // moments de tension (chrono, urgence) : la musique accélère
  const TENSE = new Set(["numero", "ordre", "acts", "f1", "chercher", "portail"]);
  const GRAVE = new Set(["theo", "theo2", "lou", "numero", "acts", "ordre", "maelys", "f1", "temoin", "f3"]);
  // Première parole de l'enfant, montrée seule à l'écran, un instant, avant l'échange.
  const MOMENT = { depart: "lou", maelys: "maelys" };
  // Décisions « sur le terrain » : pas de verdict pendant la semaine. Elles sont enregistrées, et le retour sur la semaine
  // (vendredi soir) montre ce qu'elles ont produit, puis explique le cadre. Les exercices de repères (tri, ordre, numéro…) gardent leur correction.
  const DEFER = new Set(["choice", "multi", "dialogue", "find"]);
  const deferred = (sc) => DEFER.has(sc.type) && !(st && st.revealed);   // la révélation de Lou se fait au départ des familles (écran « depart »)

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
    // tension : tempo rapide, accords mineurs graves, pulsation cardiaque et ostinato (moments d'urgence, scènes difficiles)
    stress: { bpm: 104, chords: [[45, 48, 52], [45, 48, 53], [44, 47, 52], [43, 46, 50]], arp: 0.05, oct: 0, wave: "sawtooth", cut: 700, nature: "wind", pulse: true, heart: true, ost: true },
    // gravité : lent, sombre, très peu de notes (une parole d'enfant, une révélation)
    grave: { bpm: 52, chords: [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 43, 47]], arp: 0.04, oct: 0, wave: "sine", cut: 650, nature: "wind", pulse: true },
    // fin de semaine : nostalgique, lent, quelques notes qui reviennent
    nostalgie: { bpm: 58, chords: [[53, 57, 60, 64], [52, 55, 59, 64], [50, 53, 57, 60], [48, 52, 55, 59]], arp: 0.3, oct: 12, wave: "sine", cut: 1400, nature: "birds" },
    end:   { bpm: 66, chords: [[53, 57, 60, 65], [48, 52, 55, 60], [50, 53, 57, 62], [46, 50, 53, 58]], arp: 0.5, oct: 12, wave: "triangle", cut: 2000, nature: "birds" },
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const Snd = {
    ctx: null, on: false, mood: "home", bar: 0, timer: null, nat: null, natKind: null,
    // Pendant une voix, la musique baisse (sans s'éteindre), puis remonte. Niveau de référence fixe : la musique qui vient
    // de démarrer (encore à zéro) n'est plus « mémorisée » à zéro, ce qui la rendait muette pendant tout le prélude.
    duck(on) {
      if (!this.ctx || !this.music || !this.on) return;
      const t = this.ctx.currentTime, g = this.music.gain, n = this.natBus.gain;
      g.cancelScheduledValues(t); n.cancelScheduledValues(t);
      g.setTargetAtTime(on ? 0.42 : 1, t, on ? 0.2 : 0.6); n.setTargetAtTime(on ? 0.35 : 1, t, on ? 0.2 : 0.6);
    },
    unlock() { if (!this.ctx || this._unl) return; try { const b0 = this.ctx.createBuffer(1, 1, 22050), s0 = this.ctx.createBufferSource(); s0.buffer = b0; s0.connect(this.ctx.destination); s0.start(0); if (this.ctx.state !== "running") this.ctx.resume(); if (this.ctx.state === "running") this._unl = true; } catch (e) { } },
    init() {
      if (this.ctx) return;
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { } try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; return; } try { const b0 = this.ctx.createBuffer(1, 1, 22050), s0 = this.ctx.createBufferSource(); s0.buffer = b0; s0.connect(this.ctx.destination); s0.start(0); } catch (e) { }
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
    // la nuit : grillons et chouette ; le matin : un coq, puis les oiseaux
    night() {
      if (!st.settings.sound || !this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      for (let k = 0; k < 9; k++) for (let i = 0; i < 5; i++) this.voice(4200 + Math.random() * 300, t + k * 0.32 + i * 0.045, 0.03, { gain: 0.006, attack: 0.004, release: 0.02, cut: 9000, dest: this.sfx });
      const hoot = (t0, f) => { const o = c.createOscillator(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(f, t0); o.frequency.linearRampToValueAtTime(f * .92, t0 + .5);
        v.frequency.value = 6; vg.gain.value = 4; v.connect(vg).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + .06); g.gain.exponentialRampToValueAtTime(0.0001, t0 + .55);
        o.connect(g).connect(this.sfx); o.start(t0); v.start(t0); o.stop(t0 + .6); v.stop(t0 + .6); };
      hoot(t + .7, 390); hoot(t + 1.35, 370); hoot(t + 1.62, 370);
    },
    rooster() {
      if (!st.settings.sound || !this.ctx) return;
      const c = this.ctx, t = c.currentTime + .05;
      // un coq au loin, au lever du jour : « co-co-ri-cooo », plus doux, avec la distance et l'écho de la campagne
      const syl = [[.0, .12, 560, 600], [.16, .12, 660, 700], [.32, .16, 760, 880], [.54, 1.05, 930, 560]];
      const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), lp = c.createBiquadFilter(), out = c.createGain();
      f1.type = "bandpass"; f1.frequency.value = 1100; f1.Q.value = 2.4; f2.type = "bandpass"; f2.frequency.value = 2300; f2.Q.value = 3.5;
      lp.type = "lowpass"; lp.frequency.value = 2800;
      out.gain.value = 0.55; f1.connect(lp); f2.connect(lp); lp.connect(out); out.connect(this.sfx); out.connect(this.verb);
      syl.forEach(([d, dur, fa, fb]) => {
        const o = c.createOscillator(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(fa, t + d); o.frequency.linearRampToValueAtTime(fb * (dur > .5 ? 1.12 : 1), t + d + dur * .4); o.frequency.linearRampToValueAtTime(fb, t + d + dur);
        v.frequency.value = 22; vg.gain.value = dur > .5 ? 18 : 6; v.connect(vg).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.06, t + d + .03); g.gain.setValueAtTime(0.06, t + d + dur * .75); g.gain.exponentialRampToValueAtTime(0.0001, t + d + dur);
        o.connect(g); g.connect(f1); g.connect(f2); o.start(t + d); v.start(t + d); o.stop(t + d + dur + .05); v.stop(t + d + dur + .05);
      });
      setTimeout(() => { const t2 = c.currentTime; for (let k = 0; k < 3; k++) { const f0 = 2400 + Math.random() * 1200; for (let i = 0; i < 3; i++) this.voice(f0 * (1 + i * .07), t2 + k * .5 + i * .1, .09, { gain: 0.008, attack: .01, release: .07, cut: 8000, dest: this.sfx }); } }, 1700);
    },
    // ordonnanceur musical
    scheduleBar() {
      if (!this.on || !this.ctx) return;
      const m = MOODS[this.mood] || MOODS.home, c = this.ctx, beat = 60 / m.bpm, barDur = beat * 4, t0 = c.currentTime + 0.08;
      const ch = m.chords[this.bar % m.chords.length];
      const at = this._fast ? 0.12 : 1.1; this._fast = false;
      ch.forEach((n, i) => { this.voice(mtof(n), t0, barDur + 1.2, { wave: m.wave, gain: 0.011, attack: at, release: 1.4, cut: m.cut, detune: -6 }); this.voice(mtof(n), t0, barDur + 1.2, { wave: "sine", gain: 0.008, attack: at + .2, release: 1.4, cut: m.cut, detune: 7 }); });
      this.voice(mtof(ch[0] - 12), t0, barDur * 0.9, { wave: "sine", gain: 0.022, attack: 0.08, release: 0.8, cut: 400 });
      if (m.pulse) for (let k = 0; k < 4; k += 2) { this.voice(mtof(ch[0] - 24), t0 + k * beat, 0.35, { wave: "sine", gain: 0.03, attack: 0.01, release: 0.3, cut: 200 }); }
      // battement de cœur (deux coups rapprochés) et ostinato de croches : l'adrénaline monte
      if (m.heart) for (let k = 0; k < 4; k++) { this.voice(52, t0 + k * beat, 0.18, { wave: "sine", gain: 0.05, attack: 0.005, release: 0.16, cut: 160 }); this.voice(48, t0 + k * beat + 0.16, 0.16, { wave: "sine", gain: 0.035, attack: 0.005, release: 0.14, cut: 150 }); }
      if (m.ost) for (let k = 0; k < 8; k++) this.voice(mtof(ch[(k % 2) ? 2 : 0] + 12), t0 + k * beat / 2, 0.16, { wave: "triangle", gain: 0.009 + (k % 4 === 0 ? 0.004 : 0), attack: 0.004, release: 0.12, cut: 1800 });
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
      if (!this.ctx || !st.settings.sound) return; try { if (this.ctx.state !== "running") this.ctx.resume(); } catch (e) { } if (this.on) return;
      try { if (this.ctx.state === "suspended") this.ctx.resume(); } catch (e) { }
      this.on = true;
      const t = this.ctx.currentTime;
      // la musique démarre tout de suite (dès « Commencer ») : montée courte, premier accord franc
      this.music.gain.cancelScheduledValues(t); this.music.gain.setValueAtTime(Math.max(this.music.gain.value, .35), t); this.music.gain.setTargetAtTime(1, t, 0.25);
      this.natBus.gain.cancelScheduledValues(t); this.natBus.gain.setTargetAtTime(1, t, 0.6);
      this.natKind = null; this.setNature((MOODS[this.mood] || MOODS.home).nature);
      this._fast = true; this.scheduleBar();
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
      const items = list.map(([w, t, e]) => ({ u: t && this.url(w, t), e: e || null, w, t })).filter((x) => x.u); if (!items.length) return;
      if (!this.el) {
        this.el = new Audio(); this.el.preload = "auto";
        this.el.addEventListener("ended", () => { this._done(); const n = this._q && this._q.shift(); if (n) this._play(n); else Snd.duck(false); });
        this.el.addEventListener("pause", () => { if (!this.el.ended) Snd.duck(false); }); this.el.addEventListener("play", () => { Snd.duck(true); this._tick(); });
        // une réplique introuvable ou en échec ne bloque plus les suivantes : on passe à la personne suivante
        this.el.addEventListener("error", () => { if (!this._cur) return; this._skip(); });
        this.el.addEventListener("playing", () => { clearTimeout(this._wd); if (this._cur && this._cur.e) this._cur.e.classList.remove("vpend"); });
      }
      try { this.el.pause(); } catch (e) { }
      this._done();
      // texte et voix ensemble : une réplique pas encore dite reste cachée, puis apparaît au moment où on l'entend
      items.forEach((x, i) => { if (x.e && i > 0) x.e.classList.add("vpend"); });
      this._q = items.slice(1); this._play(items[0]);
    },
    _play(it) {
      World.talk(it.w, it.t);
      clearTimeout(this._show); if (it.e) this._show = setTimeout(() => it.e && it.e.classList.remove("vpend"), 1500);   // si la voix tarde, le texte paraît quand même
      this._cur = it; if (it.e) { it.e.classList.add("kara"); it.e.querySelectorAll(".wd.sp").forEach((w) => w.classList.remove("sp")); }
      this.el.src = it.u; const p = this.el.play();
      if (p && p.catch) p.catch((e) => { if (e && e.name === "NotAllowedError") { Snd.duck(false); this._q = []; this._done(); } else this._skip(); });
      // garde-fou : une voix générée à la volée peut tarder ; au-delà de 14 s, on passe à la suivante
      clearTimeout(this._wd); this._wd = setTimeout(() => { if (this._cur === it && this.el.paused) this._skip(); }, 14000);
    },
    _skip() { clearTimeout(this._wd); if (this._cur && this._cur.e) this._cur.e.classList.remove("vpend"); this._done(); const n = this._q && this._q.shift(); if (n) this._play(n); else Snd.duck(false); },
    _tick() {
      cancelAnimationFrame(this._raf);
      const f = () => {
        const it = this._cur; if (!it || !it.e || !this.el || this.el.paused) return;
        const d = audDur(this.el, it.e.textContent); if (d) {
          const ws = it.e.querySelectorAll(".wd"), k = Math.min(ws.length, Math.ceil((this.el.currentTime / d) * ws.length * 1.04));
          for (let i = 0; i < k; i++) if (!ws[i].classList.contains("sp")) ws[i].classList.add("sp");
        }
        this._raf = requestAnimationFrame(f);
      };
      this._raf = requestAnimationFrame(f);
    },
    _done() { World.talk(null); cancelAnimationFrame(this._raf); if (this._cur && this._cur.e) this._cur.e.classList.remove("kara"); this._cur = null; if (!this._q || !this._q.length) setTimeout(() => { if (!this._cur && !(this._q && this._q.length)) document.dispatchEvent(new Event("voice-idle")); }, 60); },
    busy() { return !!this._cur || (this._q && this._q.length > 0); },
    prefetch(list) { if (!this.ready || !st.settings.voice) return; list.forEach(([w, t]) => { const u = this.url(w, t); if (u) fetch(u).catch(() => { }); }); },
    quotes(who, text) { const q = [...String(text || "").matchAll(/«\s*([^»]+?)\s*»/g)].map((m) => m[1]); if (q.length) this.say(who, q.join(" … ")); },
    stop() { (this._q || []).forEach((x) => x.e && x.e.classList.remove("vpend")); this._q = []; this._done(); if (this.el) { try { this.el.pause(); } catch (e) { } } Snd.duck(false); },
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
    toastMsg(`Niveau ${LV().name} : ${["", "des mots simples, sans chrono (dès 9 ans).", "niveau standard, des choix nuancés.", "des situations fines, tout est chronométré."][st.level]} Il s’applique dès le prochain écran.`);
  });
  $("#btn-home").addEventListener("click", () => { Snd.click(); home(); });
  // Refonte : les réglages (niveau, son, voix, animations) quittent la barre et se rangent dans un menu « Réglages ».
  // Les boutons d'origine sont déplacés tels quels (mêmes identifiants, mêmes actions, mêmes libellés d'état).
  {
    const H = $("#hud"), more = el("button", { class: "hbtn", id: "btn-more", type: "button", "aria-haspopup": "true", "aria-expanded": "false", "aria-controls": "hudmenu", "aria-label": "Réglages : niveau, son, voix, animations" },
      `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="17" r="2.2" fill="none" stroke="currentColor" stroke-width="2"/></svg><span class="lbl">Réglages</span>`);
    const menu = el("div", { id: "hudmenu", role: "group", "aria-label": "Réglages", hidden: true }, `<p class="hm-k">Réglages</p>`);
    ["#btn-level", "#btn-sound", "#btn-voice", "#btn-motion"].forEach((s) => { const b = $(s); if (b) menu.appendChild(b); });
    H.appendChild(more); H.appendChild(menu);
    // pastilles séparées (maquette) : marque + avatar + journée à gauche, puis l'horloge et le lieu, puis les outils
    const left = el("div", { class: "hpill hp-left" }); H.insertBefore(left, H.firstChild);
    ["#btn-home", "#hudav", ".chapbox"].forEach((q) => { const n = H.querySelector(q); if (n) left.appendChild(n); });
    const place = el("div", { id: "wplace", class: "hpill", "aria-live": "polite", hidden: true }, `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span></span>`);
    left.after(place);
    const spacer = el("i", { class: "hspace", "aria-hidden": "true" }); place.after(spacer);
    const close = (focus) => { if (menu.hidden) return; menu.hidden = true; more.setAttribute("aria-expanded", "false"); if (focus) more.focus(); };
    more.addEventListener("click", (e) => { e.stopPropagation(); const open = menu.hidden; menu.hidden = !open; more.setAttribute("aria-expanded", String(open)); if (open) { const f = menu.querySelector("button:not([hidden])"); if (f) f.focus(); } });
    document.addEventListener("click", (e) => { if (!menu.contains(e.target) && e.target !== more) close(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { e.stopPropagation(); close(true); } });
  }

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
    $("#hudav").innerHTML = youBust();
    rings(false);
  }
  const RING = { C1: "#2B6FD6", C2: "#8A4FD0", C3: "#E2702A", C4: "#1F9D63" };
  function compProgress() {
    const tot = {}, got = {};
    SCREENS.forEach((s) => { if (!s.comp) return; tot[s.comp] = (tot[s.comp] || 0) + 1; const r = st.res[s.id]; if (r != null && !deferred(s)) got[s.comp] = (got[s.comp] || 0) + r; });
    return Object.keys(RING).map((c) => [c, tot[c] ? (got[c] || 0) / tot[c] : 0]);
  }
  function rings(pulse) {
    let b = $("#rings");
    if (!b) {
      b = el("button", { id: "rings", class: "rings", type: "button" });
      b.addEventListener("click", () => ringInfo());
      b.innerHTML = `<svg viewBox="0 0 44 44" aria-hidden="true">${Object.keys(RING).map((c, i) => { const r = 19 - i * 4.6; return `<circle class="rt" cx="22" cy="22" r="${r}" stroke="${RING[c]}"/><circle class="rf" data-c="${c}" cx="22" cy="22" r="${r}" stroke="${RING[c]}" pathLength="100"/>`; }).join("")}</svg>`;
      { const ph = $("#btn-phone"); if (ph) ph.before(b); else $(".chapbox").after(b); }   // refonte : la cible rejoint les outils, à droite
    }
    const P = compProgress();
    P.forEach(([c, p]) => { const f = b.querySelector(`.rf[data-c="${c}"]`); f.style.strokeDashoffset = (100 - Math.max(p * 100, p > 0 ? 3 : 0)).toFixed(1); });
    b.setAttribute("aria-label", "Votre cible de compétences : " + P.map(([c, p]) => `${c} ${Math.round(p * 100)} %`).join(", ") + ". Toucher pour en savoir plus.");
    b.title = P.map(([c, p]) => `${c} · ${COMPS[c]} : ${Math.round(p * 100)} %`).join("\n");
    if (pulse) { b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse"); }
  }
  const TIPS = {
    C1: "Avant de conclure, demandez-vous qui a vu ou entendu directement. Notez les faits et les mots exacts, pas les hypothèses.",
    C2: "Reprenez les repères du carnet : un consentement libre, éclairé, spécifique, préalable et révocable ; un harcèlement peut venir d’un groupe.",
    C3: "Danger immédiat : le 17 ou le 112. Sinon la référente, la direction, la CRIP ou le 119. Et ne jamais promettre le secret.",
    C4: "Une prévention se vérifie : un changement concret, une personne responsable, un moment, un indicateur.",
  };
  function ringsSVG(size) {
    const P = compProgress();
    return `<svg class="ringsbig" viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true">${P.map(([c, p], i) => { const r = 19 - i * 4.6; return `<circle cx="22" cy="22" r="${r}" fill="none" stroke="${RING[c]}" stroke-opacity=".18" stroke-width="3.4"/><circle cx="22" cy="22" r="${r}" fill="none" stroke="${RING[c]}" stroke-width="3.4" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${(100 - Math.max(p * 100, p > 0 ? 3 : 0)).toFixed(1)}" transform="rotate(-90 22 22)"/>`; }).join("")}</svg>`;
  }
  function ringList() {
    return `<ul class="ringlist">${compProgress().map(([c, p]) => `<li><i style="background:${RING[c]}"></i><span><b>${Math.round(p * 100)} %</b> ${esc(COMPS[c])}</span></li>`).join("")}</ul>`;
  }
  // la cible en haut de l'écran : à quoi elle sert
  function ringInfo() {
    document.querySelector(".ringpop")?.remove();
    const p = el("div", { class: "ringpop", role: "dialog", "aria-label": "Votre cible de compétences" },
      `<div class="rp-h">${ringsSVG(84)}<div><p class="kicker">Votre cible</p><p>Chaque anneau est une compétence. Il se remplit à chaque décision juste. À la fin de la semaine, vous verrez où progresser.</p></div></div>${ringList()}`);
    p.appendChild(btn("Fermer", () => p.remove(), "ghost"));
    document.body.appendChild(p); Snd.click();
    setTimeout(() => document.addEventListener("click", function off(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener("click", off); } }), 0);
  }
  function toast(c, q) {
    if (!st.tut.rings) { st.tut.rings = 1; save(); setTimeout(() => { const t = el("div", { class: "gain msg", role: "status" }, `<span>La cible en haut de l’écran se remplit : chaque anneau est une compétence. Touchez-la pour la détailler.</span>`); document.body.appendChild(t); setTimeout(() => t.classList.add("out"), 5200); setTimeout(() => t.remove(), 5900); }, 2800); }
    const t = el("div", { class: "gain", "aria-hidden": "true" }, `<i style="background:${RING[c]}"></i><span><b>${q >= 1 ? "Réflexe acquis" : "Compétence en progrès"}</b>${esc(COMPS[c])}</span>`);
    document.body.appendChild(t); requestAnimationFrame(() => t.classList.add("on"));
    setTimeout(() => { t.classList.remove("on"); setTimeout(() => t.remove(), 600); }, 2600);
  }

  /* ---------- navigation ---------- */
  function go(i, dir = 1) {
    i = Math.max(0, Math.min(SCREENS.length - 1, i));
    const kidSkip = (x) => st.level === 1 && typeof KID_SKIP !== "undefined" && KID_SKIP.has(x.id);   // niveau enfants : les situations réservées aux adultes ne sont pas jouées
    while (SCREENS[i] && ((SCREENS[i].nuitee && !st.nuitee) || SCREENS[i].inRoam || kidSkip(SCREENS[i])) && i > 0 && i < SCREENS.length - 1) i += dir < 0 ? -1 : 1;   // les scènes d’une promenade se vivent dans la promenade
    st.idx = i;
    save();
    render(dir);
  }
  const next = () => { Snd.click(); go(st.idx + 1, 1); };

  // Niveau de difficulté : Découverte (1), Standard (2), Expert (3). Il se change à tout moment depuis la barre du haut.
  const LEVELS = [null, { name: "Enfants", t: 1.6, hints: 4, pen: 0, speed: 1.5, crisis: 1.35, help: true },
    { name: "Adulte", t: 1, hints: 2, pen: 5, speed: 1, crisis: 1 }, { name: "Expert", t: .7, hints: 1, pen: 8, speed: .7, crisis: .8, timeAll: 25 }];
  const LV = () => LEVELS[st.level || 2];
  function tune(sc) {
    const L = LV(), x = { ...sc };
    if (sc.timer) x.timer = Math.max(8, Math.round(sc.timer * L.t));
    else if (L.timeAll && sc.type === "choice" && !sc.later) x.timer = L.timeAll;
    if (sc.type === "hotspots") x.hints = L.hints;
    if (sc.speed || sc.type === "sort") x.speed = Math.max(4, Math.round((sc.speed || 9) * L.speed));
    if (sc.crisis) x.crisis = { ...sc.crisis, secs: Math.round(sc.crisis.secs * L.crisis) };
    const lv = st.level || 2;
    // Moyen : réponses plus proches les unes des autres ; Expert : encore plus fines (sinon celles du Moyen)
    const alt = lv === 3 && typeof EXPERT !== "undefined" && EXPERT[sc.id] ? EXPERT[sc.id] : lv >= 2 && typeof HARD !== "undefined" ? HARD[sc.id] : null;
    if (sc.opts && alt) x.opts = sc.opts.map((o, k) => (alt[k] ? { ...o, t: alt[k] } : o));
    // Enfants : des mots simples, pas de chrono, pas de justification à choisir
    if (lv === 1) {
      delete x.timer; delete x.why;
      const K = typeof KID !== "undefined" && KID[sc.id];
      if (K) { if (K.prompt) x.prompt = K.prompt; if (K.opts && sc.opts) x.opts = sc.opts.map((o, k) => (K.opts[k] ? { ...o, t: K.opts[k][0], fb: K.opts[k][1], cons: "" } : o)); }
    }
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
  function autoGate(host, start) {
    const g = el("div", { class: "rgate auto" }, `<p>Écoutez la consigne : le chrono démarre juste après.</p>`);
    host.appendChild(g);
    let go = false; const fire = () => { if (go || !g.isConnected) return; go = true; g.querySelector("p").textContent = "C’est parti !"; setTimeout(() => g.remove(), 900); start(); };
    if (!st.settings.voice || calm()) setTimeout(fire, 1800); else { document.addEventListener("voice-idle", fire, { once: true }); setTimeout(fire, 20000); }
    return g;
  }
  // une carte qu'on peut faire glisser un peu (quand l'interface en cache un morceau)
  function pannable(box, map) {
    // la carte est agrandie ; on la promène du doigt ou à la souris pour explorer tout l'accueil
    const Z = () => (innerWidth < 760 ? 2.3 : 1.55), ratio = (A.dio && A.dio.ratio) || 1.45;
    let dx = 0, dy = 0, x0 = 0, y0 = 0, sx = 0, sy = 0, drag = false, moved = false;
    box.classList.add("pannable");
    const lim = () => { const W = box.clientWidth, H = box.clientHeight, mw = map.offsetWidth, mh = map.offsetHeight; dx = Math.min(0, Math.max(W - mw, dx)); dy = Math.min(0, Math.max(H - mh, dy)); map.style.transform = `translate(${dx}px,${dy}px)`; };
    const fit = (center) => {
      const W = box.clientWidth || 600; box.style.height = Math.round(W / ratio * (innerWidth < 760 ? 1.25 : 1)) + "px";
      map.style.width = (Z() * 100) + "%"; map.style.position = "absolute"; map.style.left = "0"; map.style.top = "0";
      if (center) { dx = (W - map.offsetWidth) / 2; dy = (box.clientHeight - map.offsetHeight) / 2; }
      lim();
    };
    requestAnimationFrame(() => fit(true)); addEventListener("resize", () => box.isConnected && fit(false));
    box.addEventListener("pointerdown", (e) => { if (e.button) return; drag = true; moved = false; x0 = e.clientX; y0 = e.clientY; sx = dx; sy = dy; });
    addEventListener("pointermove", (e) => {
      if (!drag) return; const mx = e.clientX - x0, my = e.clientY - y0;
      if (!moved && Math.hypot(mx, my) < 7) return; moved = true; box.classList.add("dragging");
      dx = sx + mx; dy = sy + my; lim();
    });
    addEventListener("pointerup", () => { drag = false; setTimeout(() => box.classList.remove("dragging"), 0); });
    box.addEventListener("click", (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    // au clavier : la carte suit l'élément qui a le focus
    map.addEventListener("focusin", (e) => { const r = e.target.getBoundingClientRect(), B = box.getBoundingClientRect();
      if (r.left < B.left + 20) dx += B.left + 20 - r.left; if (r.right > B.right - 20) dx -= r.right - B.right + 20;
      if (r.top < B.top + 20) dy += B.top + 20 - r.top; if (r.bottom > B.bottom - 20) dy -= r.bottom - B.bottom + 20; lim(); });
  }
  function toastMsg(t) {
    const g = el("div", { class: "gain msg", role: "status" }, `<span>${esc(t)}</span>`);
    document.body.appendChild(g); setTimeout(() => g.classList.add("out"), 3200); setTimeout(() => g.remove(), 3900);
  }
  // La semaine qui passe : jour, heure, avancée dans la semaine, fatigue de l'équipe
  const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"], CHDAY = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }, TIRED = [12, 30, 55, 68, 82];
  const DC = { d: -1, t: "8 h 30", el: null };
  function dayclock(sc) {
    if (!DC.el) {
      DC.el = el("div", { id: "dayclock", "aria-live": "polite" }); document.body.appendChild(DC.el);
      // refonte : sur ordinateur, l'horloge devient une pastille de la barre du haut, à côté de la journée
      const placeClock = () => { const L = $(".hp-left"); if (innerWidth > 860 && L) { if (DC.el.parentNode !== L.parentNode) L.after(DC.el); } else if (DC.el.parentNode !== document.body) document.body.appendChild(DC.el); };
      placeClock(); addEventListener("resize", placeClock);
    }
    const show = !["home", "avatar", "find", "hotspots"].includes(sc.type) && !!(st.rev && st.rev.clock);
    DC.el.hidden = !show; if (!show) { DC.d = null; return; }
    let d = CHDAY[sc.ch] != null ? CHDAY[sc.ch] : 0;
    const lead = ((sc.intro || "").match(/^\s*(?:(?:lundi|mardi|mercredi|jeudi|vendredi)[^.]{0,4})?\d{1,2} ?h ?\d{0,2}/i) || [""])[0];
    const k = (sc.kicker || "") + " " + lead + " " + (sc.bridge && /^\s*(lundi|mardi|mercredi|jeudi|vendredi|\d)/i.test(sc.bridge) ? sc.bridge.slice(0, 30) : ""), m = k.match(/(lundi|mardi|mercredi|jeudi|vendredi)/i);
    if (m) d = DAYS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase());
    const h = k.match(/(\d{1,2}) ?h ?(\d{2})?/), t0 = DC.t;
    if (sc.type === "chapter") DC.t = "7 h 45";
    else if (h) DC.t = `${h[1]} h ${h[2] || "00"}`;
    else if (d !== DC.d) DC.t = "8 h 30";
    const night = sc.nuitee || /nuit/i.test(sc.id), f = Math.min(95, TIRED[d] + (night ? 12 : 0));
    const changed = d !== DC.d, DCprev = DC.d; DC.d = d;
    const tm = /(\d+) h (\d+)/.exec(DC.t) || [0, 8, 30], hh = +tm[1], mm = +tm[2];
    DC.el.innerHTML = `<svg class="dc-face" viewBox="-20 -20 40 40" aria-hidden="true"><circle r="18.5" class="f"/>${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-15.5" x2="0" y2="${i % 3 ? -13.8 : -12.6}" transform="rotate(${i * 30})"/>`).join("")}<line class="hh" x1="0" y1="2" x2="0" y2="-8.5" transform="rotate(${(hh % 12) * 30 + mm / 2})"/>${[["12", 0, -10.4], ["3", 11.2, 1.4], ["6", 0, 13.2], ["9", -11.2, 1.4]].map(([t, x, y]) => `<text x="${x}" y="${y}" class="n">${t}</text>`).join("")}<text class="dg" x="0" y="7.6">${hh}:${String(mm).padStart(2, "0")}</text><line class="mh" x1="0" y1="2.5" x2="0" y2="-13" transform="rotate(${mm * 6})"/><circle r="1.3" class="c"/></svg>
      <div class="dc-top"><b>${DAYS[d]}</b><span>${DC.t}</span></div>
      <div class="dc-week">${DAYS.map((x, i) => `<i class="${i < d ? "past" : i === d ? "now" : ""}" title="${x}">${x[0]}</i>`).join("")}</div>
      <div class="dc-f"><svg class="dc-ring" viewBox="-12 -12 24 24" aria-hidden="true"><circle r="9" class="t"/><circle r="9" class="v" pathLength="100" stroke-dasharray="${f} 100" transform="rotate(-90)"/></svg><small>Fatigue de l’équipe</small><b class="dc-fp">${f} %</b><span><i style="width:${f}%"></i></span></div>`;
    DC.el.classList.toggle("tired", f >= 55);
    // l'heure défile jusqu'à la nouvelle heure
    const toMin = (x) => { const m = /(\d+) h (\d+)/.exec(x || ""); return m ? +m[1] * 60 + +m[2] : null; };
    const a0 = toMin(t0), a1 = toMin(DC.t), sp = DC.el.querySelector(".dc-top span");
    if (a0 != null && a1 != null && a1 - a0 >= 40 && d === DCprev && sc.type !== "roam") bigClock(a0, a1, DAYS[d]);   // le temps passe : la grande horloge
    if (sp && a0 != null && a1 != null && a1 > a0 && d === DCprev && !calm()) {
      const T0 = performance.now(), dur = Math.min(2200, 300 + (a1 - a0) * 6);
      const H = DC.el.querySelector(".hh"), M = DC.el.querySelector(".mh");
      const tick = (now) => { const k2 = Math.min(1, (now - T0) / dur), m = Math.round(a0 + (a1 - a0) * k2); sp.textContent = `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
        if (H) H.setAttribute("transform", `rotate(${((m / 60) % 12) * 30})`); if (M) M.setAttribute("transform", `rotate(${(m % 60) * 6})`);
        const dg = DC.el.querySelector(".dg"); if (dg) dg.textContent = `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
        if (k2 < 1 && sp.isConnected) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    if (changed) { DC.el.classList.remove("newday"); void DC.el.offsetWidth; DC.el.classList.add("newday"); }
  }
  function render(dir = 1) {
    document.body.classList.remove("athome", "roaming");
    if (typeof Life !== "undefined") Life.clear();   // la promenade s'arrête quand on change d'écran
    const sc = tune(SCREENS[st.idx]);
    // partie reprise après la présentation : l'horloge et le téléphone sont déjà connus
    if (!st.rev) st.rev = {};
    if (st.idx > SCREENS.findIndex((x) => x.id === "intro")) { st.rev.clock = 1; st.rev.phone = 1; }
    Voice.stop();
    const nx = SCREENS[st.idx + 1];
    if (nx) { const L = []; (nx.lines || []).forEach((l) => l.who && l.who !== "player" && L.push([l.who, l.t])); if (nx.nodes && nx.start && nx.nodes[nx.start]) L.push([nx.npc, nx.nodes[nx.start].t]); try { VOICE_TXT.parts(nx).slice(0, 3).forEach((x) => L.unshift(x)); } catch (e) { } Voice.prefetch(L); }
    Snd.setMood(sc.type === "replay" || sc.id === "aurevoir" || sc.id === "dafter" ? "nostalgie" : sc.type === "bilan" ? "end" : TENSE.has(sc.id) || ["crisis"].includes(sc.type) || sc.crisis ? "stress" : GRAVE.has(sc.id) ? "grave" : sc.ch);
    document.body.classList.toggle("grave", GRAVE.has(sc.id));
    document.body.classList.toggle("scene", sc.type === "story");   // refonte : récit en carte posée sur le plan
    camera(sc);
    document.querySelectorAll(".cr-pop, .intr").forEach((x) => x.remove());   // une interruption (appel, personne venue vous chercher) ne reste jamais d'un écran à l'autre
    unlockDocs(sc); Phone.check(sc); dayclock(sc);
    hud(true);
    const old = stage.firstElementChild;
    const node = el("section", { class: "screen t-" + sc.type + (dir < 0 ? " back" : ""), "aria-labelledby": "h-" + sc.id });
    if (sc.bridge) node.dataset.bridge = "1";
    (sc.type === "sort" && sc.cats.length <= 3 && !calm() ? R.reflex : sc.type === "order" && sc.crisis && !calm() ? R.crisis : (R[sc.type] || R.story))(sc, node);
    { const VP = VOICE_TXT.parts(sc); if (World.entered) { VP.unshift(["narr", ROOM_SAY[World.entered]]); World.entered = null; }
      if (VP.length && !node.dataset.novoice) setTimeout(() => Voice.seq(VP), 350); }
    if (sc.bridge) { const host = node.querySelector(".rm-card, .panel, .solo, .maphead > div, .page-note .pn-body") || node; host.insertBefore(el("p", { class: "bridge" }, words(sc.bridge)), host.firstChild); }
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
    const h = k.match(/(\d{1,2})\s*h/); if (h) { const n = +h[1]; return n < 11 ? "morning" : n < 16 ? "day" : n < 18 ? "golden" : "evening"; }   // après la réunion du soir (18 h), la nuit tombe
    return { 1: "morning", 2: "morning", 3: "day", 4: "golden", 5: "morning", 6: "evening" }[sc && sc.ch] || "day";
  }
  // Le monde : le diorama de l'accueil, derrière les écrans. La caméra voyage vers le lieu de chaque scène.
  // Le plan + ses calques animés (voiture, parents, balançoires, drapeau, promeneurs) posés au-dessus.
  function dioHTML() {
    if (!A.dio) return "";
    if (A.dio.css && !document.getElementById("dio-css")) document.head.appendChild(el("style", { id: "dio-css" }, A.dio.css));
    // le plan est affiché comme une image (rastérisée une fois par le navigateur) : bien plus léger qu'un SVG vivant
    if (!dioHTML.url) dioHTML.url = litURL(0);
    const base = dioHTML.url ? `<img class="dio-img" src="${dioHTML.url}" alt="" draggable="false" decoding="async">` : A.dio.svg;
    // matières du plan (pour les calques en SVG vivant), une seule fois dans la page
    const defs = A.dio.defs && !document.getElementById("dio-defs") ? `<svg id="dio-defs" width="0" height="0" style="position:absolute" aria-hidden="true">${A.dio.defs}</svg>` : "";
    // ce qui est devant (préau, portail, clôture, lampadaires…) est recopié au-dessus, rangé par profondeur avec les personnages
    const occ = (A.dio.occ || []).map((x) => `<div class="dio-occ ${x.c || ""}" style="left:${x.l}%;top:${x.t}%;width:${x.w}%;aspect-ratio:${x.r};z-index:${x.z}">${x.svg}</div>`).join("");
    return base + defs + `<div class="wlids"></div><div class="wanim">${(A.dio.anims || []).map((x) => `<div class="dio-ov ${x.cls}" style="left:${x.l}%;top:${x.t}%;width:${x.w}%;aspect-ratio:${x.r};z-index:${x.z || 1}">${x.svg}</div>`).join("")}${occ}</div>`;
  }
  // Refonte : fenêtres éclairées en fin de journée. Le plan est une image : on en fait trois versions (éteinte, en train de
  // s'allumer, allumée) en ajoutant une règle de style au dessin, une seule fois chacune.
  const LIT_CSS = ["", ".dio-win{fill:#F3D7A2}", ".dio-win{fill:#FFD98A}"];
  function litStyle(svg, lvl) { return lvl ? svg.replace("</style>", LIT_CSS[lvl] + "</style>") : svg; }
  function litURL(lvl) {
    litURL.c = litURL.c || {};
    if (litURL.c[lvl] == null) { try { litURL.c[lvl] = URL.createObjectURL(new Blob([litStyle(A.dio.img || A.dio.svg, lvl)], { type: "image/svg+xml" })); } catch (e) { litURL.c[lvl] = ""; } }
    return litURL.c[lvl];
  }
  const LIT = { golden: 1, evening: 2, night: 2 };
  // Nom du lieu affiché dans la barre : celui de la salle (dessins du jeu) ou, dehors, l'étiquette validée de la visite « Œil de lynx »
  function placeName(S) {
    if (!S || !S.at || S.at === "ensemble") return "";
    if (S.room && A.rooms && A.rooms[S.room]) return A.rooms[S.room].name;
    if (S.at === "cour") return "La cour";   // la cour (ronde, départs) n’est pas le portail
    const at = S.at === "entree" ? "cour" : S.at;
    for (const sc of SCREENS) for (const sp of (sc.spots || [])) if (sp.key === at) return sp.label;
    return "";
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
      const lvl = World.lit || 0;
      const k = G + "|" + mode + "|" + (hl || "") + "|" + lvl; if (this.url[k]) return this.url[k];
      const L = A.dio.lids[G], all = [G, ...(L.also || [])], q = (a) => all.map((g) => `[${a}="${g}"]`).join(",");
      const nx = hl && A.dio.inner && A.dio.inner[hl] ? A.dio.inner[hl].next : null;
      const st = mode === "nob" ? `[data-shut="${G}"],[data-lid="${G}"]{display:none!important}` : mode === "ghost" ? `*{visibility:hidden}[data-shut="${G}"],[data-shut="${G}"] *,[data-lid="${G}"],[data-lid="${G}"] *{visibility:visible}` : mode === "open" ? `${q("data-open")}{display:inline}${q("data-lid")},${q("data-shut")}{display:none}${nx ? `[data-wl="${nx}"],[data-wld="${nx}"]{display:none}[data-wlo="${nx}"]{display:inline}` : ""}`
        : `*{visibility:hidden}${all.map((g) => `[data-lid="${g}"],[data-lid="${g}"] *`).join(",")}{visibility:visible}`;
      const svg = litStyle(A.dio.img || A.dio.svg, lvl).replace(/viewBox="[^"]*"/, `viewBox="${L.vb}"`).replace("</style>", st + "</style>");
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
    const affAt = (x, y) => { const e = document.elementsFromPoint(x, y).find((n) => n.closest && n.closest(".inroom-w .aff, #world .aff")); return e ? e.closest(".aff") : null; };
    const free = (t) => !t.closest("button,a,input,textarea,select,label,.panel,.side,.solo,.affview,#hud,#dayclock,.phone,.carnet,[role=dialog]");
    document.addEventListener("click", (e) => { if (!free(e.target)) return; const a = affAt(e.clientX, e.clientY); if (a) Aff.open(a.dataset.aff); });
    let raf = 0;
    document.addEventListener("pointermove", (e) => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; document.body.classList.toggle("over-aff", free(e.target) && !!affAt(e.clientX, e.clientY)); }); }, { passive: true });
  }
  // Refonte : les hautes herbes du titre entrent dans le jeu. Un rideau d'herbes au premier plan, flou de profondeur
  // compris, qui ondule doucement ; ses couleurs suivent l'heure de la journée (voir refonte.css).
  function fieldGrass() {
    // Trois nappes d'herbes (fond, milieu, devant), chacune un dessin fixe que la carte graphique fait onduler en bloc :
    // aucun redessin pendant l'animation (les brins animés un à un coûtaient trop cher sur les petites machines).
    let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    if (innerWidth < 760) return "";
    const grad = (id) => `<linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="s0"/><stop offset=".55" class="s1"/><stop offset="1" class="s2"/></linearGradient>`;
    const layer = (k, n, hMin, hVar, wMin, wVar, lean) => {
      let paths = "";
      for (let i = 0; i < n; i++) {
        const x = rnd() * 1440, h = hMin + rnd() * hVar, l = (rnd() - .5) * lean, w = wMin + rnd() * wVar, y0 = 204;
        const c = rnd() < .16 ? "fgw" : rnd() < .5 ? "fga" : "fgb";
        paths += `<path d="M${x.toFixed(0)} ${y0} Q${(x + l * .3).toFixed(0)} ${(y0 - h * .6).toFixed(0)} ${(x + l).toFixed(0)} ${(y0 - h).toFixed(0)}" stroke="url(#${c})" stroke-width="${w.toFixed(1)}" stroke-linecap="round" fill="none"/>`;
      }
      return `<div class="gl gl${k}"><svg viewBox="0 0 1440 200" preserveAspectRatio="xMidYMax slice">${k === 0 ? `<defs>${grad("fga")}${grad("fgb")}${grad("fgw")}</defs>` : ""}${paths}</svg></div>`;
    };
    return `<div class="wgrass" aria-hidden="true">${layer(0, 22, 40, 60, 2.2, 2.6, 40)}${layer(1, 18, 60, 80, 3, 3, 56)}${layer(2, 14, 80, 110, 4, 5, 70)}</div>`;
  }
  // Personnages articulés (rig.js) : la distribution et votre personnage
  const RSPEC = {};
  function rigSpec(who) {
    if (typeof RIG === "undefined") return null;
    if (who === "you") return RIG.specOfLook(st.look) || RIG.specOf("bastien", (A.cast || {}).bastien);
    if (!(who in RSPEC)) RSPEC[who] = RIG.specOf(who, (A.cast || {})[who]);
    return RSPEC[who];
  }
  // visage (buste) d'une personne, avec son expression ; « you » = votre personnage
  function faceOf(who, mood) {
    const sp = rigSpec(who);
    if (sp) return RIG.bust({ ...sp, mood: mood || "smile" });
    return who === "you" ? youBust() : (A.chars[who] || A.chars.parent)[mood || "smile"];
  }
  // opts : { back: vu de dos, chair: assis sur une chaise }
  const rigMini = (who, pose, opts = {}) => { const sp = rigSpec(who); return sp ? RIG.inMini({ ...sp, ...(opts.back ? { back: true } : {}), ...(opts.mood ? { mood: opts.mood } : {}) }, pose, opts) : null; };
  // Émotions visibles : le visage change (sourcils, bouche, rougeur, larme), un signe apparaît au-dessus de la tête,
  // le corps suit (geste, tremblement). emo : angry, sad, o (surpris), big (joie), concern (inquiet), null (retour au calme)
  const EMO_SIGN = { angry: `<svg viewBox="-10 -10 20 20"><path d="M-6,-2 q3,1 4,-4 M2,-6 q1,3 4,4 M6,2 q-3,-1 -4,4 M-2,6 q-1,-3 -4,-4" stroke="#E0442B" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>`,
    sad: `<svg viewBox="-10 -10 20 20"><path d="M-7,-4 q2,-5 4,0 M3,-4 q2,-5 4,0" stroke="#5B8FD6" stroke-width="1.8" fill="none"/><path d="M0,1 q-3,5 0,7 q3,-2 0,-7 Z" fill="#7EC8F2"/></svg>`,
    o: `<svg viewBox="-10 -10 20 20"><path d="M-6,-6 l2,5 M0,-8 v6 M6,-6 l-2,5" stroke="#F2B33D" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    big: `<svg viewBox="-10 -10 20 20"><path d="M-6,-4 l1.2,2.4 2.4,1.2 -2.4,1.2 -1.2,2.4 -1.2,-2.4 -2.4,-1.2 2.4,-1.2 Z M5,-7 l.9,1.8 1.8,.9 -1.8,.9 -.9,1.8 -.9,-1.8 -1.8,-.9 1.8,-.9 Z" fill="#F2B33D"/></svg>`,
    concern: `<svg viewBox="-10 -10 20 20"><path d="M2,-7 q4,4 0,7 q-3,-3 0,-7 Z" fill="#9CD3F0"/></svg>`,
    // nouveaux dessins d'expression
    q: `<svg viewBox="-10 -10 20 20"><path d="M-3,-5 q0,-4 4,-4 q4,0 4,3.4 q0,2.4 -3,3.4 q-1,.4 -1,2.6" stroke="#6B7A90" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="1" cy="5.6" r="1.4" fill="#6B7A90"/></svg>`,
    shy: `<svg viewBox="-10 -10 20 20"><path d="M-7,-2 l3,-3 M-3,-2 l3,-3 M1,-2 l3,-3" stroke="#F08AA0" stroke-width="2" stroke-linecap="round"/></svg>`,
    heart: `<svg viewBox="-10 -10 20 20"><path d="M0,6 C-8,0 -6,-7 0,-3 C6,-7 8,0 0,6 Z" fill="#F07A8E"/></svg>`,
    idea: `<svg viewBox="-10 -10 20 20"><path d="M0,-9 v3 M-7,-6 l2,2 M7,-6 l-2,2" stroke="#F2B33D" stroke-width="2" stroke-linecap="round"/><circle cy="1" r="4.4" fill="#FFD66B"/><rect x="-2" y="5" width="4" height="2.6" rx="1" fill="#C9A24A"/></svg>`,
    tired: `<svg viewBox="-10 -10 20 20"><path d="M-6,-6 h5 l-5,5 h5 M2,-2 h4 l-4,4 h4" stroke="#8C9BB0" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>` };
  function emote(who, emo) {
    if (!World.el) return;
    World.el.querySelectorAll(`.actor[data-who="${who}"], .ractor[data-who="${who}"]`).forEach((a) => {
      const r = a.querySelector(".rig"); if (!r) return;
      const pose = (r.getAttribute("class").match(/p-\w+/) || ["p-idle"])[0], key = Object.keys(RIG.POSE).find((k) => RIG.POSE[k] === pose) || "stand";
      const gs = [...r.classList].filter((c) => c.startsWith("g-")), back = !!a.classList.contains("isback");
      const html = rigMini(who, key, { back, mood: emo || undefined, chair: !!r.querySelector(".chair") });
      if (!html) return;
      const tmp = document.createElementNS("http://www.w3.org/2000/svg", "g"); tmp.innerHTML = html;
      const nr = tmp.querySelector(".rig"); if (!nr) return; gs.forEach((g) => nr.classList.add(g)); r.replaceWith(nr);
      a.classList.toggle("emo-angry", emo === "angry"); a.classList.toggle("emo-sad", emo === "sad");
      // le signe au-dessus de la tête (dehors : un élément HTML ; dans une salle : dans le dessin)
      a.querySelectorAll(".emo-sign").forEach((x) => x.remove());
      signOnHead(nr, who, emo);
    });
  }
  // Le signe d'émotion est dessiné dans la tête du personnage (il suit la tête, toujours bien placé, quel que soit le cadrage).
  // Jamais pendant l'exploration libre (le joueur découvre seul), ni pour les plus jeunes enfants (Malo).
  function signOnHead(rig, who, emo) {
    if (!rig || !emo || !EMO_SIGN[emo] || who === "malo" || document.body.classList.contains("roaming")) return;
    const h = rig.querySelector(".head"); if (!h) return;
    let bb; try { bb = h.getBBox(); } catch (e) { return; } if (!bb || !bb.width) return;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g"), k = bb.width * .42 / 20;
    g.setAttribute("class", "emo-sign emo-" + emo);
    g.setAttribute("transform", `translate(${(bb.x + bb.width * 1.02).toFixed(1)},${(bb.y + bb.height * .08).toFixed(1)}) scale(${k.toFixed(3)})`);
    g.innerHTML = EMO_SIGN[emo].replace(/^<svg[^>]*>|<\/svg>$/g, ""); h.appendChild(g);
  }
  // l'émotion d'une réplique, d'après ce qui est dit
  function emoOf(who, t) {
    const low = (t || "").toLowerCase();
    // la colère (signe rouge, joues rouges) seulement pour une vraie colère : insulte ou cri, avec un point d'exclamation
    if (/!/.test(t) && /(dégage|tais-toi|t’es nul|t’es trop nul|ça suffit|lâche-moi|c’est pas juste|ils trichent|n’importe quoi)/.test(low)) return "angry";
    if (/(peur|veux pas|pleur|personne veut|j’ose pas|n’ose|tout le monde l’a vue|laisse tomber)/.test(low) || (KIDS.has(who) && /…/.test(t) && /(euh|je sais pas|j’sais pas|d’accord…)/.test(low))) return "sad";
    if (/\?!|quoi \?|sérieux \?|comment ça/.test(low)) return "o";
    if (/(je sais pas|j’sais pas|je comprends pas|c’est-à-dire|tu crois \?|tu en penses quoi)/.test(low)) return "q";
    if (/(merci|t’es gentille|c’est gentil|je t’aime bien|ma préférée)/.test(low)) return "heart";
    if (/(trop bien|super|génial|youpi|bravo|t’es trop forte|c’est vrai \?)/.test(low)) return "big";
    if (/(j’ai une idée|on pourrait|et si on|je propose)/.test(low)) return "idea";
    if (/(gêné|gênée|désolé|désolée|pardon|c’était pour rire|franchement)/.test(low)) return "shy";
    if (/(fatigué|fatiguée|épuisé|crevé|j’en peux plus)/.test(low)) return "tired";
    if (/(arrête|inquiet|inquiète|bizarre|pas normal|démissionné)/.test(low)) return "concern";
    return null;
  }
  // Projection du plan : coordonnées au sol (mètres) <-> position en % du plan, et profondeur (qui passe devant qui)
  const PJ = (A.dio && A.dio.proj) || [640, 80, 19.05, 11, 28.4, -43, 1375.6, 944.6];
  const w2f = (x, y) => [((PJ[0] + (x - y) * PJ[2]) - PJ[4]) / PJ[6] * 100, ((PJ[1] + (x + y) * PJ[3]) - PJ[5]) / PJ[7] * 100];
  const f2w = (fx, fy) => { const X = fx / 100 * PJ[6] + PJ[4], Y = fy / 100 * PJ[7] + PJ[5], a = (X - PJ[0]) / PJ[2], b = (Y - PJ[1]) / PJ[3]; return [(a + b) / 2, (b - a) / 2]; };
  const zOf = (x, y) => Math.round((x + y) * 10) + 10;
  const World = {
    el: null, ext: null, cam: null, wint: null, room: null, cur: null,
    init() {
      if (this.el || !A.dio) return;
      this.el = el("div", { id: "world", "aria-hidden": "true" },
        `<div class="wext"><div class="wcam">${dioHTML()}<div class="wacts"></div></div></div><div class="wint"><div class="wroom"></div><p class="wname"></p></div><i class="wvig"></i><i class="wgrade"></i><i class="wsky"><b class="wsun"></b><b class="wmoon"></b></i><i class="wdof"></i>${fieldGrass()}`);
      document.body.insertBefore(this.el, document.body.firstChild);
      this.cam = this.el.querySelector(".wcam"); this.wint = this.el.querySelector(".wint");
    },
    actor(who, pose, pct, size, flip, from, opts = {}) {
      const key = who === "you" ? youKey() : who;
      const m = A.minis && A.minis[key], R0 = rigMini(who, pose || "stand", opts); if (!m && !R0) return null;
      const a = el("div", { class: "actor" + (flip ? " flip" : "") + (R0 ? " rigged" : ""), "data-who": who === "you" ? "you" : who, style: `left:${pct[0]}%;top:${pct[1]}%;width:${size}%;--br:${(Math.random() * 3).toFixed(2)}s` },
        `<span class="abub"><i></i><i></i><i></i></span><svg viewBox="-22 -60 44 64" overflow="visible">${R0 || m[pose || "stand"] || m.stand}</svg>`);
      const setPose = (ps) => { const r = a.querySelector(".rig"); if (r) r.setAttribute("class", "rig " + (RIG.POSE[ps] || "p-idle")); else a.querySelector("svg").innerHTML = m[ps] || m.stand; };
      a._pose = setPose;
      // entrée : la personne arrive en marchant depuis la porte ou le bord de la scène, puis prend son attitude
      if (from && !reduce()) {
        a.style.setProperty("--fx", from[0] + "%"); a.style.setProperty("--fy", from[1] + "%");
        a.classList.add("arriving"); setPose("walk");
        a.addEventListener("animationend", (e) => { if (e.animationName !== "walkin") return; a.style.animation = "none"; a.classList.remove("arriving"); setPose(a._final || (pose === "walk" || pose === "run" || pose === "wave" ? "stand" : pose) || "stand"); }, { once: false });
      }
      return a;
    },
    // chacun se tourne vers le groupe (les gestes vont vers l'interlocuteur)
    faceGroup(list) {
      if (list.length < 2) return;
      const cx = list.reduce((t, [, p]) => t + p[0], 0) / list.length;
      list.forEach(([a, p]) => { if (!a.dataset.faced) a.classList.toggle("flip", p[0] > cx + .5); });
    },
    stage(sc) {
      this.init(); if (!this.el) return;
      const hide = !sc || ["hotspots", "avatar", "home", "find"].includes(sc.type);
      document.body.classList.toggle("live", !hide);   // refonte : même mise en page en mode « Animations réduites » (seul le mouvement est retiré)
      this.el.classList.toggle("on", !hide);
      if (hide) { const wp = $("#wplace"); if (wp) wp.hidden = true; this.cur = null; return; }   // refonte : pas de lieu affiché sur les cartes des mini-jeux
      let S = STAGE[sc.id];
      if (S === "keep" || (!S && ["explain", "multi"].includes(sc.type) && this.cur)) S = this.cur;
      if (!S) S = { at: LOC[sc.id] || "ensemble", cast: sc.npc ? [[sc.npc, "a", "talk"], ["you", "b"]] : [] };
      this.show(S, sc);
    },
    show(S, sc) {
      this.init(); if (!this.el) return;
      this.el.classList.add("on"); document.body.classList.add("live");
      const same = this.cur === S; this.cur = S;
      const amb = S.night ? "night" : timeOf(sc);
      const gateOpen = sc && (sc.type === "chapter" || sc.type === "dayend" || sc.type === "bilan" || sc.type === "replay" || ["intro", "parent1", "parent2", "portail", "aurevoir", "dafter"].includes(sc.id));   // le portail est ouvert à l’arrivée, aux départs et aux bilans
      this.lights(LIT[amb] || 0); this.glows();
      this.el.className = "on amb-" + amb + (S.room ? " inside" : "") + (["cour", "entree"].includes(S.at) && (S.cast || []).length ? " busy-gate" : "") + (gateOpen ? " gate-open" : "");
      { const wp = $("#wplace"); if (wp) { const nm = placeName(S); wp.hidden = !nm; if (nm) wp.querySelector("span").textContent = nm; } }
      if (same) return;
      // caméra extérieure
      let p = A.dio.lieux[S.at] || A.dio.lieux.ensemble, z = (innerWidth >= 760 && S.z) || (S.at && S.at !== "ensemble" ? 2.1 : 1.08);   // S.z : cadrage plus serré pour une scène précise (arrivée : face à Nour)
      const IN = S.room && A.dio.inner && A.dio.inner[S.room];
      if (IN) {   // on cadre la salle elle-même, assez près pour voir les visages
        const hp = IN.w * A.dio.ratio / IN.r, camW = this.cam.offsetWidth || 1500;
        const want = innerWidth < 760 ? innerWidth * .98 : Math.min(innerWidth * .52, 940);
        z = Math.max(1.6, Math.min(3.6, want / (IN.w / 100 * camW)));   // refonte : plafond 3,6 (au-delà, la petite régie était cadrée deux fois plus près que les autres salles)
        p = { x: (IN.l + IN.w / 2) / 100, y: (IN.t + hp * .52) / 100 };
      }
      this.camTo(p, z);
      // acteurs dehors
      const acts = this.cam.querySelector(".wacts"); acts.innerHTML = "";
      const stand = A.dio.stand[S.at] || A.dio.stand.ensemble, sz = (44 / A.dio.vbw) * 100 * .77;   // un peu plus petits : à l’échelle des portes et du mobilier
      if (!S.room) {
        const L = [];
        const cast = S.cast || [], others = cast.filter(([w]) => w !== "you"), duo = !cast.some(([w]) => w === "you") && others.length === 2;
        const anchor = others[0] && (stand[others[0][1]] || stand.a);
        cast.forEach(([w, slot, pose], k) => {
          let p = stand[slot] || stand.a; const from = [k % 2 ? 260 : -260, 110];
          // Vous êtes à côté de la personne qui vous parle, de dos, tournée vers elle.
          // Deux personnes qui discutent entre elles : côte à côte, tournées l'une vers l'autre.
          const back = !!(w === "you" && others.length);
          let face = 0;
          if (anchor && !S.keepSlots) {
            const [ax, ay] = f2w(anchor[0], anchor[1]);
            if (w === "you" && others.length) { p = w2f(ax + .95, ay + .55); face = -1; }
            else if (duo && w === others[1][0]) { p = w2f(ax + 1.0, ay + .15); face = -1; }
            else if (others[0] && w === others[0][0]) face = 1;
          }
          const a = this.actor(w, pose, p, sz, false, k < 3 ? from : null, { back });
          if (a && face) { a.classList.toggle("flip", face < 0); a.dataset.faced = "1"; }
          // personne ne marche sur place : une fois arrivé, on se tient debout
          if (a && (pose === "walk" || pose === "run") && a._pose && !a.classList.contains("walker")) a._pose("stand");
          if (a && pose === "wave" && a._pose) { a._pose("stand"); setTimeout(() => a.isConnected && gesture(a, "wave"), 800 + k * 250); }   // un salut bref, pas une main levée qui dure
          if (a) { a.style.animationDelay = (0.5 + k * 0.18) + "s"; { const [wx, wy] = f2w(p[0], p[1]); a.style.zIndex = zOf(wx, wy) + 1; } if (back) a.classList.add("isback"); acts.appendChild(a); L.push([a, p]); }
        });
        this.faceGroup(L);
        { const first = (S.cast || []).find(([w]) => w !== "you"); if (first) setTimeout(() => this.gaze(first[0]), 60); }
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
    // le soir : la lumière des fenêtres et des lampadaires se projette au sol, vers l'extérieur
    glows() {
      if (this._glows || !this.cam) return; this._glows = true;
      const host = this.cam.querySelector(".wanim"); if (!host) return;
      const add = (x, y, w, h, cls) => { const f = w2f(x, y); host.appendChild(el("i", { class: "wglow " + cls, style: `left:${f[0]}%;top:${f[1]}%;width:${w}%;height:${h}%;z-index:${zOf(x, y) - 30}` })); };
      [[3.6, 21.7], [11.6, 21.7], [19.6, 21.7], [29.4, 19.0], [31.0, 25.2]].forEach(([x, y]) => add(x + .3, y - .3, 4.6, 3.2, "lamp"));
      [4.35, 6.75, 9.35, 11.75, 13.8, 18.6, 22.5, 25.3].forEach((x) => add(x + .35, 19.7, 3.4, 2.1, "win"));
      [20.95, 24.75].forEach((x) => add(x + .3, 9.1, 3, 1.8, "win"));
      [0, 1, 2, 3].forEach((i) => add(32.05 + i * 1.45 + .3, 16.0, 2.8, 1.8, "win"));
    },
    // fenêtres éclairées : on passe par le niveau intermédiaire (les lumières s'allument une à une)
    lights(lv) {
      if (lv === this.lit) return;
      const im = this.el.querySelector(".wcam>.dio-img"), from = this.lit || 0; this.lit = lv; if (!im) return;
      clearTimeout(this._lt);
      const fade = (src) => {
        if (reduce()) { im.src = src; return; }
        const ov = im.cloneNode(); ov.classList.add("lit-ov"); ov.src = src; ov.style.opacity = "0";
        im.after(ov); requestAnimationFrame(() => requestAnimationFrame(() => (ov.style.opacity = "1")));
        setTimeout(() => { im.src = src; setTimeout(() => ov.remove(), 120); }, 1700);
      };
      if (lv === 2 && from === 0 && !reduce()) { fade(litURL(1)); this._lt = setTimeout(() => { if (this.lit === 2) fade(litURL(2)); }, 1900); }
      else fade(litURL(lv));
    },
    // Caméra : on interpole la largeur de vue de façon géométrique et le centre au même rythme : on « plonge » vers le
    // point visé (zoom) au lieu de faire glisser le plan. ms = 0 : tout de suite.
    camTo(p, z, ms) {
      const set = (x, y, k) => { this.cv = { x, y, z: k }; this.cam.style.transform = `translate(${(-x * k * 100).toFixed(3)}%,${(-y * k * 100).toFixed(3)}%) scale(${k.toFixed(4)})`; };
      cancelAnimationFrame(this._cf); this.cam.style.transitionProperty = "left, top";
      const c0 = this.cv, D = ms != null ? ms : 1500;
      if (!c0 || reduce() || D <= 0 || !this.el.classList.contains("on")) { set(p.x, p.y, z); return; }
      const t0 = performance.now(), dz = Math.abs(1 / c0.z - 1 / z) > 1e-4;
      const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const f = (now) => {
        const t = Math.min(1, (now - t0) / D), e = ease(t), k = c0.z * Math.pow(z / c0.z, e);
        const r = dz ? (1 / c0.z - 1 / k) / (1 / c0.z - 1 / z) : e;
        set(c0.x + (p.x - c0.x) * r, c0.y + (p.y - c0.y) * r, k);
        if (t < 1) this._cf = requestAnimationFrame(f);
      };
      this._cf = requestAnimationFrame(f);
    },
    // la salle « room » vue dans le plan, avec les personnages rangés entre les meubles
    people(room, S) {
      const SIT_OFF = [0, 5];   // assis : les hanches sur l’assise de la chaise du décor
      const IN = A.dio.inner[room], host = this.cam.querySelector(".wlids");
      const old = host.querySelector(".inroom-w"); if (old) old.remove();
      const w = el("div", { class: "inroom-w", style: `left:${IN.l}%;top:${IN.t}%;width:${IN.w}%;aspect-ratio:${IN.r};z-index:${IN.z}` }, IN.svg);
      const svg = w.querySelector("svg"), NS = "http://www.w3.org/2000/svg", L = [];
      let youLab = null;
      (S.cast || []).forEach(([who, slot, pose], k) => {
        const P = IN.sp[slot] || IN.sp.a; if (!P) return;
        const key = who === "you" ? youKey() : who, m = A.minis[key], ps = P.sit ? "sit" : (pose === "walk" || pose === "run" || pose === "wave" ? "stand" : pose || "stand");
        // assis : on s'assoit sur la chaise du décor (pas de seconde chaise dessinée par-dessus), le corps posé à sa hauteur
        const R0 = rigMini(who, ps, { back: who === "you" && (S.cast || []).length > 1 && !P.sit, chair: false }); if (!m && !R0) return;
        const g = document.createElementNS(NS, "g"), off = P.sit ? (window.__sitOff != null ? window.__sitOff : SIT_OFF) : [0, 0];
        g.setAttribute("class", "ractor"); g.dataset.who = who; g.setAttribute("transform", `translate(${P.x + off[0]},${P.y + off[1]})`);
        g.innerHTML = `<g class="rmove" style="animation-delay:${(0.2 + k * 0.22).toFixed(2)}s"><g class="rbody"><g transform="scale(${R0 ? .96 : .84})">${R0 || m[ps] || m.stand}</g></g></g>`;
        if (who === "you") youLab = [P.x, P.y];
        const after = [...svg.querySelectorAll(":scope > g[data-d]")].find((x) => +x.dataset.d > P.d);
        svg.insertBefore(g, after || null);
        L.push([g, [P.x, 0], P]);
      });
      // l'étiquette « Vous » est posée au-dessus de tout le décor de la salle : un meuble devant les pieds ne la coupe plus
      if (youLab) { const t = document.createElementNS(NS, "text"); t.setAttribute("class", "rlab rlab-top"); t.setAttribute("x", youLab[0]); t.setAttribute("y", youLab[1] + 8); t.setAttribute("text-anchor", "middle"); t.textContent = "Vous"; svg.appendChild(t); }
      if (L.length > 1) { const cx = L.reduce((t, [, p]) => t + p[0], 0) / L.length; L.forEach(([g, p, P]) => g.querySelector(".rbody").classList.toggle("flip", P && P.sit ? !!P.fx : p[0] > cx + 2)); }
      else L.forEach(([g, , P]) => P && P.sit && g.querySelector(".rbody").classList.toggle("flip", !!P.fx));
      w.addEventListener("click", (e) => { const g = e.target.closest && e.target.closest(".aff"); if (g) Aff.open(g.dataset.aff); });
      // dans une salle, on ne voit qu'elle : le reste du plan s'efface dans le noir
      let veil = host.querySelector(".room-veil"); if (!veil) { veil = el("div", { class: "room-veil" }); host.appendChild(veil); }
      requestAnimationFrame(() => veil.classList.add("in"));
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
        const v = host.querySelector(".room-veil"); if (v) { v.classList.remove("in"); setTimeout(() => v.remove(), 400); }
        // le toit redescend pendant que les murs remontent : la façade se fond progressivement, rien n'apparaît d'un coup
        cur.t.classList.remove("open"); cur.h.classList.add("closing"); cur.h.classList.remove("ready");
        setTimeout(() => { cur.h.remove(); cur.t.remove(); }, reduce() ? 0 : 1700);
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
    // Regard : chacun tourne les yeux et la tête vers la personne qui parle ; celle qui parle regarde le joueur.
    gaze(who) {
      if (!this.el || !who || who === "narr") return;
      const all = [...this.el.querySelectorAll(".actor, .ractor")].filter((a) => a.offsetParent !== null || a.getBoundingClientRect().width);
      const sp = all.filter((a) => a.dataset.who === who); if (!sp.length) return;
      const cx = (a) => { const r = a.getBoundingClientRect(); return r.left + r.width / 2; };
      const sx = cx(sp[0]), you = all.find((a) => a.dataset.who === "you");
      const others = all.filter((a) => a.dataset.who !== who);
      const tx = you ? cx(you) : (others.length ? others.reduce((t, a) => t + cx(a), 0) / others.length : sx);
      all.forEach((a) => {
        const d = a.dataset.who === who ? Math.sign(tx - sx) : Math.sign(sx - cx(a));
        const flipped = a.classList.contains("flip") || !!a.querySelector(".rbody.flip");
        a.style.setProperty("--lk", String(flipped ? -d : d)); a.classList.add("gaze");
      });
    },
    // La personne qui parle enchaîne des gestes courts (2 à 3 s) choisis selon ce qu'elle dit ; les autres écoutent
    // (hochent la tête, croisent les bras, regardent ailleurs…). Jamais deux fois de suite le même geste.
    talk(who, text) {
      if (!this.el) return;
      if (who && who !== "narr") this.gaze(who);
      clearTimeout(this._gi); clearTimeout(this._li);
      // fin de réplique : la bouche s'arrête net et le geste en cours se termine tout de suite (plus de gestes inutiles)
      this.el.querySelectorAll(".talking").forEach((a) => a.classList.remove("talking"));
      // plus personne ne parle : tous les gestes de la scène (orateur et auditeurs) s'arrêtent tout de suite
      this.el.querySelectorAll(".rig").forEach((r) => { if ([...r.classList].some((c) => c.startsWith("g-"))) { clearTimeout(r._gt); GESTS.forEach((x) => r.classList.remove("g-" + x)); } });
      document.querySelectorAll(".portrait.chip.talking").forEach((a) => a.classList.remove("talking"));
      if (!who || who === "narr") return;
      const els = [...this.el.querySelectorAll(`.actor[data-who="${who}"], .ractor[data-who="${who}"]`)];
      els.forEach((a) => a.classList.add("talking"));
      const emo = emoOf(who, text || ""); emote(who, emo);
      if (emo === "angry") els.forEach((a) => gesture(a, Math.random() < .5 ? "fist" : "stomp"));
      if (emo && emo !== "concern") { clearTimeout(this._emoT); this._emoT = setTimeout(() => emote(who, null), 6500); }
      const pool = emo === "angry" ? ["fist", "point", "stomp", "hips", "fist"] : emo === "sad" ? ["downcast", "cover", "hug", "fidget", "lookaway"] : emo === "big" ? ["raise", "laugh", "thumb", "open"] : emo === "o" ? ["stepback", "raise", "open"] : gestPool(who, text || ""), others = [...this.el.querySelectorAll(".actor[data-who], .ractor[data-who]")].filter((a) => a.dataset.who !== who);
      let last = "", n = 0;
      const step = () => {
        if (!els.some((a) => a.classList.contains("talking"))) return;
        // jamais deux fois de suite le même geste pour une même personne, même d'une réplique à l'autre
        const H = (World._gh = World._gh || {}), hist = (H[who] = H[who] || []);
        const P2 = pool.concat(KIDS.has(who) ? ["scratch", "fidget", "tilt", "lookaway"] : ["tilt", "note", "open", "calm", "weight", "chin", "neck"]);
        let g, k = 0; do { g = P2[Math.floor(Math.random() * P2.length)]; } while ((g === last || hist.includes(g)) && ++k < 12); last = g;
        hist.push(g); if (hist.length > 5) hist.shift();
        els.forEach((a) => gesture(a, g));
        // un ou deux gestes courts par réplique, espacés : jamais d'enchaînement mécanique
        if (++n < 3) this._gi = setTimeout(step, 2600 + Math.random() * 1400);   // un geste (2 s) puis une pause : plusieurs gestes différents sur une longue réplique
      };
      this._gi = setTimeout(step, 250);
      const listen = () => {
        if (!els.some((a) => a.classList.contains("talking"))) return;
        const a = others[Math.floor(Math.random() * others.length)];
        if (a) gesture(a, LISTEN[Math.floor(Math.random() * LISTEN.length)]);
        this._li = setTimeout(listen, 2600 + Math.random() * 2600);
      };
      this._li = setTimeout(listen, 1400);
      document.querySelectorAll(`.portrait.chip[data-who="${who}"]`).forEach((a) => a.classList.add("talking"));
    },
  };
  const GESTS = ["explain", "explain2", "open", "count", "shrug", "nod", "shake", "point", "pointself", "heart", "facepalm", "chin", "scratch", "wave", "cross", "hips", "raise", "calm", "stop", "beckon", "lean", "stepback", "weight", "lookaway", "downcast", "fidget", "sigh", "laugh", "cover", "stomp", "fist", "thumb", "present", "phone", "hug", "tilt", "neck", "welcome", "watch", "note", "crouch"];
  const LISTEN = ["nod", "tilt", "weight", "chin", "lookaway", "cross", "sigh", "lean", "note"];
  const KIDS = new Set(["lou", "malo", "zoe", "theo", "sacha", "lena", "maelys", "clara", "enzo"]);
  // les gestes qui vont avec ce qui est dit
  function gestPool(who, t) {
    const low = t.toLowerCase(), P = [];
    if (/\?/.test(t)) P.push("explain2", "open", "shrug", "open");
    if (/!/.test(t)) P.push("raise", "explain", "point");
    if (/\b(non|pas|jamais|arrête|stop)\b/.test(low)) P.push("shake", "stop");
    if (/\b(moi|je |j’|me |mon |ma )/.test(low)) P.push("pointself");
    if (/merci|confiance|bienvenue|super|bravo|trop bien/.test(low)) P.push("heart", "thumb", "open");
    if (/euh|…|je sais pas|j’sais pas|n’ose|peur/.test(low)) P.push("fidget", "downcast", "lookaway", "hug", "scratch");
    if (/t’es|tu peux pas|dégage|c’est nul|rigole/.test(low)) P.push("point", "fist", "hips", "stomp", "laugh");
    if (/premièrement|d’abord|trois|deux|ensuite|règle/.test(low)) P.push("count", "count");
    if (/téléphone|appel|sms|message/.test(low)) P.push("phone");
    if (/viens|venez|par ici|regarde/.test(low)) P.push("beckon", "present");
    if (/bienvenue|bonjour|salut|au revoir|bonne soirée/.test(low)) P.push("welcome", "wave");
    if (/pressé|vite|j’ai pas le temps|il est où|en retard|dépêche/.test(low)) P.push("watch", "hips", "watch");
    if (/désolé|pardon|gêné|j’aurais pas dû|c’était pour rire|franchement/.test(low)) P.push("neck", "neck", "shrug");
    if (/je note|j’écris|noter|carnet|fiche/.test(low)) P.push("note", "note");
    // un adulte qui parle à un petit se met à sa hauteur
    if (!KIDS.has(who) && /(ma puce|mon grand|ma grande|petit|n’aie pas peur|t’inquiète)/.test(low)) P.push("crouch");
    P.push(...(KIDS.has(who) ? ["fidget", "lookaway", "explain", "weight", "scratch", "open"] : ["explain", "explain2", "calm", "present", "lean", "weight", "chin", "nod", "open"]));
    return P;
  }
  function gesture(a, g) {
    const r = a.querySelector(".rig"); if (!r || reduce()) return;
    GESTS.forEach((x) => r.classList.remove("g-" + x)); void r.getBoundingClientRect();
    r.classList.add("g-" + g);
    clearTimeout(r._gt); r._gt = setTimeout(() => r.classList.remove("g-" + g), 2050);   // un geste dure 2 secondes au plus
  }
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
    return el("div", { class: "portrait chip", "data-who": who }, `<div class="pchar">${faceOf(who, mood)}</div><div class="pname">${NAMES[who]}</div>`);
  }
  function setMood(container, who, mood) {
    const pc = container.querySelector(`.portrait[data-who="${who}"] .pchar`);
    if (!pc) return;
    pc.classList.remove("react"); void pc.offsetWidth;
    pc.innerHTML = faceOf(who, mood); pc.classList.add("react");
  }
  function btn(label, onclick, cls = "cta") { return el("button", { class: cls, type: "button", onclick }, label); }
  function record(sc, q, extra) {
    if (st.res[sc.id] == null) { st.res[sc.id] = q; if (sc.comp && q > 0 && !deferred(sc)) { rings(true); toast(sc.comp, q); } }
    if (extra && extra.flag) st.flags[extra.flag] = true;
    save();
  }
  function verdict(q) {
    // analyse neutre : on décrit la démarche, sans « bon » ni « mauvais » geste
    if (q >= 1) return { cls: "good", t: "Démarche principale", s: () => Snd.good() };
    if (q >= 0.5) return { cls: "mid", t: "Démarche incomplète", s: () => Snd.mid() };
    return { cls: "low", t: "Une autre démarche était attendue", s: () => Snd.low() };
  }
  function coach(text, host) {
    if (st.tut[text.slice(0, 20)]) return;
    st.tut[text.slice(0, 20)] = 1;
    const c = el("div", { class: "coach", role: "note" }, `<div class="cav">${faceOf("nour")}</div><p>${esc(text)}</p>`);
    const x = btn("Compris", () => { c.remove(); }, "ghost small");
    c.appendChild(x);
    host.prepend(c);
  }

  // Un moment grave : la première phrase de l'enfant, seule, sur fond sombre, puis l'écran revient.
  // Ne bloque rien (un clic ou une touche le referme), jamais en mode « Animations réduites », une seule fois par partie.
  function moment(sc, who, text) {
    if (calm() || reduce() || !text) return;
    st.tut = st.tut || {}; const key = "moment-" + sc.id; if (st.tut[key]) return; st.tut[key] = 1; save();
    const first = (String(text).match(/^[^?!.]*[?!.]/) || [text])[0];
    const m = el("div", { class: "moment", "aria-hidden": "true" }, `<figure><blockquote>${esc(first)}</blockquote><figcaption>${esc(NAMES[who] || "")}</figcaption></figure>`);
    document.body.appendChild(m);
    requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add("in")));
    const off = () => { m.classList.remove("in"); m.classList.add("out"); setTimeout(() => m.remove(), 900); removeEventListener("keydown", off, true); m.removeEventListener("click", off); };
    m.addEventListener("click", off); addEventListener("keydown", off, true);
    setTimeout(off, 3400);
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

  // Écran du rôle, en deux étapes sur la même nuit que l’accueil :
  // 1. « Votre personnage » : on le crée sur mesure (visage, cheveux, tenue, accessoires) ;
  // 2. « Le but du jeu » : l’objectif expliqué simplement, le format de l’accueil et le niveau.
  R.avatar = (sc, n) => {
    $("#hud").hidden = true;   // préparation : pas encore de barre d’outils
    if (!st.look) st.look = { ...LOOK.PRESETS[st.av || 0] };
    n.classList.add("setup2");
    n.innerHTML = `<div class="hbg" aria-hidden="true"><i class="glow g1"></i><i class="glow g2"></i>${nightGrass(innerWidth < 700 ? 16 : 30)}</div><div class="su"></div>`;
    const su = n.querySelector(".su");
    const opt = (label, v, cur, extra = "") => `<button type="button" class="ch${cur ? " sel" : ""}" data-v="${esc(String(v))}" aria-pressed="${cur}"${extra}>${label}</button>`;
    const sw = (col, v, cur, name) => `<button type="button" class="sw${cur ? " sel" : ""}" data-v="${esc(String(v))}" aria-pressed="${cur}" aria-label="${esc(name)}" style="--c:${col}"></button>`;
    const TOPS = [["#2F8F8A", "Turquoise"], ["#3C6FB8", "Bleu"], ["#0B4F84", "Bleu nuit"], ["#5E8A4E", "Vert"], ["#E0A63A", "Moutarde"], ["#E2702A", "Orange"], ["#C2453D", "Rouge"], ["#B04F8C", "Framboise"], ["#7E5BB8", "Violet"], ["#E9E4DA", "Écru"], ["#6B7480", "Gris"], ["#2F2F35", "Noir"]];
    const ACC = [["#E2702A", "orange"], ["#C2453D", "rouge"], ["#3C6FB8", "bleu"], ["#2F8F8A", "turquoise"], ["#E8C35A", "jaune"], ["#F2EEE8", "blanc"]];
    const HAIRS = [["court", "Court"], ["rase", "Rasé"], ["chauve", "Chauve"], ["herisse", "En pointes"], ["boucles", "Bouclé"], ["ondule", "Ondulé"], ["long", "Long"], ["carre", "Carré"], ["chignon", "Chignon"], ["tresses", "Tresses"], ["couettes", "Couettes"]];
    const HCN = { noir: "Noir", brun: "Brun", chatain: "Châtain", roux: "Roux", blond: "Blond", platine: "Platine", gris: "Gris", poivre: "Poivre et sel", rose: "Rose", bleu: "Bleu", violet: "Violet" };
    const SKN = { porcelaine: "Très claire", claire: "Claire", doree: "Dorée", olive: "Mate", cuivre: "Cuivrée", brune: "Brune", ebene: "Ébène" };
    const EYN = { marron: "Marron", noisette: "Noisette", vert: "Verts", bleu: "Bleus", gris: "Gris" };
    const TABS = {
      visage: () => {
        const L = st.look;
        return `<p class="flabel">Peau</p><div class="sws">${Object.entries(LOOK.SKIN).map(([k, c]) => sw(c, k, L.skin === k, SKN[k])).join("")}</div>`
          + `<p class="flabel">Yeux</p><div class="sws" data-k="eyes">${Object.entries(LOOK.EYES).map(([k, c]) => sw(c, k, (L.eyes || "marron") === k, EYN[k])).join("")}</div>`
          + `<p class="flabel">Nez</p><div class="chs" data-k="nose">${[[.86, "Petit"], [1, "Moyen"], [1.14, "Grand"]].map(([v, t]) => opt(t, v, Number(L.nose || 1) === v)).join("")}</div>`
          + `<p class="flabel">Expression</p><div class="chs" data-k="mood">${[["smile", "Sourire"], ["big", "Grand sourire"], ["calm", "Serein"]].map(([v, t]) => opt(t, v, (L.mood || "smile") === v)).join("")}</div>`;
      },
      cheveux: () => {
        const L = st.look;
        return `<p class="flabel">Coiffure</p><div class="chs" data-k="hair">${HAIRS.map(([v, t]) => opt(t, v, L.hair === v)).join("")}</div>`
          + `<p class="flabel">Couleur</p><div class="sws" data-k="hc">${Object.entries(LOOK.HAIR).map(([k, c]) => sw(c, k, L.hc === k, HCN[k])).join("")}</div>`
          + `<p class="flabel">Barbe et moustache</p><div class="chs" data-k="facial">${[["", "Aucune"], ["moustache", "Moustache"], ["barbe", "Barbe"]].map(([v, t]) => opt(t, v, (L.barbe ? "barbe" : L.moustache ? "moustache" : "") === v)).join("")}</div>`;
      },
      tenue: () => {
        const L = st.look;
        return `<p class="flabel">Haut</p><div class="chs" data-k="cut">${[["pull", "Pull"], ["sweat", "Sweat à capuche"], ["chemise", "Chemise"], ["cardigan", "Gilet"]].map(([v, t]) => opt(t, v, (L.cut || "pull") === v)).join("")}</div>`
          + `<p class="flabel">Couleur</p><div class="sws" data-k="top">${TOPS.map(([c, t]) => sw(c, c, L.top === c, t)).join("")}</div>`;
      },
      accessoires: () => {
        const L = st.look;
        return `<p class="flabel">Lunettes</p><div class="chs" data-k="glasses">${[["", "Aucune"], ["rondes", "Rondes"], ["carree", "Carrées"], ["rouge", "Rouges"], ["doree", "Dorées"]].map(([v, t]) => opt(t, v, (L.glasses || "") === v)).join("")}</div>`
          + `<p class="flabel">Boucles d’oreilles</p><div class="chs" data-k="earring">${[["", "Non"], ["1", "Oui"]].map(([v, t]) => opt(t, v, (L.earring ? "1" : "") === v)).join("")}</div>`
          + `<p class="flabel">Bandeau</p><div class="sws" data-k="headband">${sw("transparent", "", !L.headband, "Aucun")}${ACC.map(([c, t]) => sw(c, c, L.headband === c, "Bandeau " + t)).join("")}</div>`
          + `<p class="flabel">Nœud</p><div class="sws" data-k="bow">${sw("transparent", "", !L.bow, "Aucun")}${ACC.map(([c, t]) => sw(c, c, L.bow === c, "Nœud " + t)).join("")}</div>`;
      },
    };
    let tab = "visage";
    function stepLook() {
      su.innerHTML = `<div class="su-head"><p class="hk">Étape 1 sur 2</p><h2 id="h-${sc.id}">Votre personnage</h2>
        <p class="lead">${esc(ROLE.voice)} Créez le personnage qui vous ressemble : il vous suivra toute la semaine.</p></div>
        <div class="su-grid"><div class="su-pick"><div class="su-stage" aria-hidden="true"><i class="su-spot"></i><div class="su-big"></div></div>
          <p class="su-mlab">Partir d’un modèle</p><div class="avs" role="group" aria-label="Modèles de départ"></div></div>
        <div class="su-form"><label for="pname" class="flabel">Votre prénom <span>(facultatif)</span></label>
          <input id="pname" type="text" maxlength="20" autocomplete="off" placeholder="Sam" value="${esc(st.name || "")}">
          <div class="tabs" role="tablist" aria-label="Personnaliser">${[["visage", "Visage"], ["cheveux", "Cheveux"], ["tenue", "Tenue"], ["accessoires", "Accessoires"]].map(([k, t]) => `<button type="button" role="tab" class="tab${k === tab ? " sel" : ""}" data-t="${k}" aria-selected="${k === tab}">${t}</button>`).join("")}</div>
          <div class="tabp" role="tabpanel"></div></div></div>`;
      const big = su.querySelector(".su-big"), panel = su.querySelector(".tabp"), models = su.querySelector(".avs"), inp = su.querySelector("#pname");
      const draw = (pop) => { big.innerHTML = youBust(); if (pop) { big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop"); } };
      const fillTab = () => { panel.innerHTML = TABS[tab](); };
      LOOK.PRESETS.forEach((p, i) => {
        const b = el("button", { class: "av", type: "button", "aria-label": "Modèle " + (i + 1) }, LOOK.bust(p));
        b.addEventListener("click", () => { st.look = { ...p }; st.av = i; fillTab(); draw(true); Snd.click(); });
        models.appendChild(b);
      });
      su.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
        tab = t.dataset.t; su.querySelectorAll(".tab").forEach((x) => { x.classList.toggle("sel", x === t); x.setAttribute("aria-selected", x === t); }); fillTab(); Snd.click();
      }));
      panel.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-v]"); if (!b) return;
        const grp = b.parentElement, k = grp.dataset.k || "skin", v = b.dataset.v, L = st.look;
        if (k === "facial") { L.barbe = v === "barbe"; L.moustache = v === "moustache"; }
        else if (k === "nose") L.nose = Number(v);
        else if (k === "earring") L.earring = !!v;
        else if (v === "") delete L[k]; else L[k] = v;
        grp.querySelectorAll("button").forEach((x) => { const on = x === b; x.classList.toggle("sel", on); x.setAttribute("aria-pressed", on); });
        draw(k === "hair" || k === "mood"); Snd.click(); save();
      });
      fillTab(); draw(true);
      su.querySelector(".su-form").appendChild(btn("Continuer", () => { st.name = (inp.value || "").trim().slice(0, 20); save(); stepGoal(); }));
      if (!n.dataset.spoken) { n.dataset.spoken = "1"; if (n.isConnected) Voice.say("narr", ROLE.voice); }
      Voice.prefetch([["narr", ROLE.goalVoice]]);   // la voix des règles est prête avant même qu’on clique
    }
    function stepGoal() {
      Voice.stop();
      const seg = (label, opts, cur, onPick, cls) => {
        const g = el("div", { class: "seg " + (cls || ""), role: "radiogroup", "aria-label": label });
        opts.forEach(([v, t, d]) => {
          const b = el("button", { class: "segb" + (cur() === v ? " sel" : ""), type: "button", role: "radio", "aria-checked": String(cur() === v) }, `<b>${t}</b><small>${d}</small>`);
          b.addEventListener("click", () => { onPick(v); g.querySelectorAll(".segb").forEach((x) => { const on = x === b; x.classList.toggle("sel", on); x.setAttribute("aria-checked", String(on)); }); Snd.click(); });
          g.appendChild(b);
        });
        return g;
      };
      su.innerHTML = `<div class="su-head"><p class="hk">Étape 2 sur 2</p><h2 tabindex="-1">${esc(ROLE.goalTitle)}</h2></div>
        <div class="su-grid goal"><ol class="goals">${ROLE.goal.map(([t, d], i) => `<li style="--i:${i}"><span>${i + 1}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join("")}</ol><div class="su-form"></div></div>`;
      const form = su.querySelector(".su-form");
      const fmt = seg("Format de l’accueil", [[false, "Sans hébergement", "ALSH · les enfants repartent chaque soir avec leur famille."], [true, "Avec hébergement", "ALAH · une nuit sur place le mercredi, un parcours en plus sur les risques de la nuit."]], () => !!st.nuitee, (v) => { st.nuitee = v; }, "two");
      const lvl = seg("Niveau de difficulté", [[1, "Enfants", "Repérer les situations et réagir en sécurité, avec les documents de référence."], [2, "Adulte", "Niveau standard : des choix nuancés, on hésite vraiment."], [3, "Expert", "Pour affiner : des situations très précises et nuancées."]], () => st.level || 2, (v) => { st.level = v; }, "three");
      form.append(el("p", { class: "flabel" }, "Format de l’accueil"), fmt, el("p", { class: "flabel" }, "Niveau <span>(modifiable à tout moment)</span>"), lvl,
        btn("Commencer la semaine", () => { save(); next(); }), btn("Revenir à mon personnage", () => { Voice.stop(); stepLook(); }, "linkb"));
      su.querySelector("h2").focus({ preventScroll: true }); n.scrollIntoView({ block: "start" });
      if (n.isConnected) Voice.say("narr", ROLE.goalVoice);
    }
    stepLook();
  };

  // Chaque journée commence au portail : la nuit tombe sur la veille, le jour se lève, les familles arrivent.
  R.chapter = (sc, n) => {
    const c = CHAPTERS[sc.ch - 1], prev = CHAPTERS[sc.ch - 2];
    const stations = CHAPTERS.map((x) => `<li class="${x.n < c.n ? "done" : x.n === c.n ? "cur" : ""}"><span>${x.day.slice(0, 2)}</span></li>`).join("");
    let hier = "";
    if (prev) {
      const L = SCREENS.filter((x) => x.ch === prev.n && x.comp && st.res[x.id] != null);
      const ok = L.filter((x) => st.res[x.id] >= 1 && !deferred(x)).length, mid = L.filter((x) => !deferred(x)).length - ok, nD = L.filter(deferred).length;
      const titres = L.slice(0, 4).map((x) => `<li class="${deferred(x) ? "" : st.res[x.id] >= 1 ? "good" : "mid"}">${esc((x.kicker || x.title || "").replace(/^[^,·]*, ?/, ""))}</li>`).join("");
      hier = `<div class="dayrecap"><p class="kicker">Hier, ${prev.day.toLowerCase()}</p><p>${L.length ? `${L.length} situation${L.length > 1 ? "s" : ""} vécue${L.length > 1 ? "s" : ""}. Vos décisions sont enregistrées : vous verrez ce qu’elles ont produit vendredi soir.` : (prev.n === 1 ? "Une première journée pour prendre ses repères." : "Aucune situation évaluée hier.")}</p>${titres ? `<ul>${titres}</ul>` : ""}</div>`;
    }
    const plan = (c.plan || []).filter((p) => st.nuitee || !/nuitée/i.test(p[1])).map((p) => `<li><b>${p[0]}</b><span>${esc(p[1])}</span></li>`).join("");
    n.innerHTML = `<div class="chap day"><div class="journey" aria-hidden="true"><ol>${stations}</ol><div class="walker2" style="--from:${((c.n - 2) / (CHAPTERS.length - 1)) * 100}%;--to:${((c.n - 1) / (CHAPTERS.length - 1)) * 100}%">${youBust()}</div></div>
      <p class="chapnum">Jour ${c.n} sur ${CHAPTERS.length}</p><h2 id="h-${sc.id}">${esc(c.day)}</h2><p class="daytitle">${esc(c.title)}</p>
      </div>`;
    n.querySelector(".chap").appendChild(btn(c.n === 1 ? "C’est parti" : "Commencer la journée", next));
    Snd.page();
    if (prev && !calm()) { n.dataset.novoice = "1"; setTimeout(() => { if (n.isConnected) Voice.seq(VOICE_TXT.parts(sc)); }, 4200); }
    // la nuit tombe sur la veille (sur le plan : soleil couchant, fenêtres qui s'allument, lune), puis le jour se lève :
    // les familles arrivent au portail
    const morning = () => { if (!n.isConnected) return; World.show({ at: "cour", cast: [], z: 2.1 }, { type: "chapter", kicker: "8 h 20" }); families("morning"); n.querySelector(".chap").classList.remove("wait"); };
    if (prev && !calm() && !n.dataset.nf) { n.dataset.nf = "1"; n.querySelector(".chap").classList.add("wait"); setTimeout(() => duskToDawn(c.day, morning), 300); }
    else setTimeout(morning, 200);
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
      if (L.who) row.innerHTML = `<div class="mini">${faceOf(L.who, L.mood)}</div><div class="bub"><b>${esc(nm)}</b><p>${words(L.t)}</p></div>`;
      else row.innerHTML = `<p>${words(L.t)}</p>`;
      lines.appendChild(row);
      if (MOMENT[sc.id] && L.who === MOMENT[sc.id]) moment(sc, L.who, L.t);
      if (L.reveal) { st.rev = st.rev || {}; st.rev[L.reveal] = 1; save(); hud(true); dayclock(sc); const t = L.reveal === "clock" ? DC.el : $("#btn-phone"); if (t) { t.classList.remove("revealed"); void t.offsetWidth; t.classList.add("revealed"); } }
      say((nm ? nm + " : " : "") + L.t);
      // une scène à regarder en direct sur le plan : le récit se fait discret pendant que la vie se déroule
      document.body.classList.toggle("watch", !!L.live);
      if (L.live === "portail" && typeof families === "function") families("morning");
      // un échange vif : la réplique suivante s'enchaîne d'elle-même, sans attendre un clic
      if (L.chain) { const my = i; const go2 = () => { if (i === my && n.isConnected) step(true); };
        if (Voice.ok && Voice.ready && st.settings.voice) document.addEventListener("voice-idle", () => setTimeout(go2, 150), { once: true });
        setTimeout(go2, Math.max(1600, 500 + L.t.length * 55) + (Voice.ok && Voice.ready && st.settings.voice ? 6000 : 0)); }
      if (L.who && L.who !== "player") Voice.say(L.who, L.t, row);
      else if (!L.who) { const S = VOICE_TXT.split(L.t); Voice.seq(S.map(([w, x]) => [w, x, S.length === 1 ? row : null])); }   // les citations sont dites par le personnage
    };
    function step(auto) {
      if (!auto) Snd.click();
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
    pannable(mapbox, map);
    // refonte : la fiche d'un lieu se referme d'un clic sur le plan (hors lieux) ou avec Échap, pour dégager les lieux qu'elle recouvre
    mapbox.addEventListener("click", (e) => { if (!card.hidden && !e.target.closest(".spot, .spotcard")) card.hidden = true; });
    const escCard = (e) => { if (!wrap.isConnected) return document.removeEventListener("keydown", escCard); if (e.key === "Escape" && !card.hidden) { card.hidden = true; } };
    document.addEventListener("keydown", escCard);
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
    coach(dio ? "Vous faites la visite avec Nour : touchez un bâtiment ou un lieu, elle vous explique à quoi il sert et ce qui s’y passe. Les points à risque ne sont pas signalés, et chaque lieu sans problème vous coûte 5 secondes." : "Sélectionnez un lieu du plan (ou Tab puis Entrée) : Nour vous l’explique.", wrap);
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
      // l’annonce finale attend la fin de la description du dernier lieu (elle ne la coupe plus)
      const endLine = stars === 3 ? "Œil de lynx ! Tous les points repérés, sans perdre de temps." : nf < need ? "Le temps est écoulé. Regardez les points que vous avez manqués." : "Tous les points sont repérés.";
      const sayEnd = () => { if (wrap.isConnected) Voice.say("narr", endLine); };
      if (!timeout && Voice.busy()) { document.addEventListener("voice-idle", sayEnd, { once: true }); } else sayEnd();
      say(res.textContent);
    }
    function open(s, i, b) {
      Snd.click(); if (!over) Voice.say(...VOICE_TXT.spot(s));
      b.classList.add("seen"); b.classList.remove("hinted", "missed");
      if (s.real) found.add(i);
      else if (!seenDecoy.has(i)) {
        seenDecoy.add(i); decoys++;
        if (!over && sc.timer && LV().pen) { left = Math.max(1, left - LV().pen); const f = el("span", { class: "lx-pen", "aria-hidden": "true" }, `−${LV().pen} s`); b.appendChild(f); setTimeout(() => f.remove(), 1200); }
      }
      $("#cnt", wrap).textContent = found.size;
      card.hidden = false;
      card.className = "spotcard " + (s.real ? "real" : "decoy");
      // pendant la visite, Nour décrit les lieux, sans commentaire ; l'analyse n'apparaît qu'une fois la visite finie
      card.innerHTML = over ? `<p class="kicker">${s.real ? "Point d’attention" : "Rien d’inquiétant"}${s.ref ? " · " + s.ref : ""}</p><h3 id="spot-t">${esc(s.title)}</h3><p>${esc(s.t)}</p><p class="lesson">${esc(s.lesson)}</p>`
        : `<p class="kicker">Nour vous fait visiter</p><h3 id="spot-t">${esc(s.title)}</h3><p>${esc(s.t)}</p>`;
      const c = btn("Fermer", () => { card.hidden = true; b.focus(); }, "ghost small");
      card.appendChild(c); c.focus({ preventScroll: true }); card.scrollTop = 0;   // refonte : la fiche s'ouvre par son titre
      if (s.real) { Snd.good(); burst(b, "good"); const c2 = $(".counter", wrap); c2.classList.remove("bump"); void c2.offsetWidth; c2.classList.add("bump"); } else Snd.mid();
      if (found.size >= need && !over) finish(false);
    }
  };

  function contextBlock(sc) {
    let h = kicker(sc.kicker);
    if (sc.context) h += `<p class="ctx">${esc(sc.context)}</p>`;
    if (sc.chat) h += waPhone({ title: "Équipe Hautes Herbes", sub: "Bastien, Hugo, Inès, Kévin, Yanis, vous", group: true,
      msgs: sc.chat.map((m, i) => ({ who: m.who, t: m.t, me: false, time: `16:${String(12 + i * 7).padStart(2, "0")}` })) });
    return h;
  }
  // Le téléphone de la joueuse (celui qui sert aussi à appeler les secours), avec une messagerie façon WhatsApp.
  function waPhone(o) {
    const col = ["#1F7A5A", "#B5446E", "#2B6FD6", "#A86A1F", "#6B4FA0", "#C2412A"], cOf = (w) => col[[...(w || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % col.length];
    return `<div class="wa" role="log" aria-label="Messages : ${esc(o.title)}"><div class="wa-dev"><div class="wa-notch"></div>
      <div class="wa-top"><span class="wa-back" aria-hidden="true">‹</span><span class="wa-av" aria-hidden="true">${o.face || esc((o.title || "?")[0])}</span><span class="wa-id"><b>${esc(o.title)}</b><small>${esc(o.sub || "en ligne")}</small></span></div>
      <div class="wa-body">${o.msgs.map((m, i) => `<div class="wa-m ${m.me ? "me" : ""}" style="animation-delay:${(i * .35).toFixed(2)}s">${o.group && !m.me ? `<b style="color:${cOf(m.who)}">${esc(m.who)}</b>` : ""}<span>${esc(m.t)}</span><i>${m.time || ""}${m.me ? " ✓✓" : ""}</i></div>`).join("")}</div>
      <div class="wa-in" aria-hidden="true"><span>Message</span><i></i></div></div></div>`;
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
    // niveau enfants : on s'appuie sur les documents de référence (« Mes repères ») pour choisir
    if (st.level === 1 && typeof DOCS !== "undefined" && DOCS.reperes) {
      const N = DOCS.reperes.notes, k = [...sc.id].reduce((h, c) => h + c.charCodeAt(0), 0);
      panel.insertAdjacentHTML("beforeend", `<aside class="kid-rep" aria-label="Mes repères"><p class="kicker">Mes repères</p><ul><li>${esc(N[k % N.length])}</li><li>${esc(N[(k + 3) % N.length])}</li></ul></aside>`);
    }
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
      let left = sc.timer, started = false, t0 = performance.now();
      // le chrono attend que tout le monde ait fini de parler (narrateur compris), et se met en pause si quelqu'un reprend la parole
      const speaking = () => Voice.busy() && st.settings.voice;
      bar.classList.add("wait"); bar.querySelector("span").textContent = "Écoutez…";
      tId = setInterval(() => {
        if (speaking() && performance.now() - t0 < 45000) { bar.classList.add("wait"); if (!started) bar.querySelector("span").textContent = "Écoutez…"; return; }
        if (!started) { started = true; const i = bar.querySelector("i"); i.style.animation = "none"; void i.offsetWidth; i.style.animation = ""; i.style.animationDuration = sc.timer + "s"; }
        bar.classList.remove("wait");
        left--; bar.querySelector("span").textContent = left > 0 ? `${left} s pour décider` : "Temps écoulé"; bar.classList.toggle("hurry", left <= 5); if (left <= 0) { clearInterval(tId); timeout(); } }, 1000);
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
      if (!sc.later && !deferred(sc) && q < 0.5 && sc.npc) { World.upset(sc.npc); setMood(n, sc.npc, "angry"); }
      // Conséquences cachées : le verdict n'apparaît qu'au débrief de fin de chapitre.
      if ((sc.later || deferred(sc)) && first) {
        // pas de « choix enregistré » : on passe directement à la suite
        b.classList.add("picked", "neutral"); Snd.click(); Voice.stop();
        setTimeout(next, 450);
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
    if (DEFER.size) return null;   // les conséquences sont montrées au retour sur la semaine
    const list = SCREENS.filter((x) => x.ch === ch && x.type === "choice" && x.later && st.later && st.later[x.id] != null);
    if (!list.length) return null;
    const box = el("section", { class: "debrief", "aria-label": "Ce que vos choix ont produit" }, `<p class="kicker">Le débrief de Nour</p><h3>Ce que vos choix ont produit</h3>`);
    const V = [];
    list.forEach((x) => {
      const r = st.later[x.id], o = tune(x).opts[r.k], w = r.w >= 0 ? x.why.opts[r.w] : null, v = verdict(o.q);
      box.appendChild(el("div", { class: "db " + v.cls }, `<p class="db-k">${esc(x.kicker || "")}</p><p class="db-c">« ${esc(o.t)} »</p><p class="vt">${v.t}${w ? (w.ok ? " · justification conforme au cadre" : " · justification à approfondir") : ""}</p>${o.cons ? `<p><b>Ce qui s’est passé.</b> ${esc(o.cons)}</p>` : ""}<p>${esc(o.fb)}</p>${o.q < 1 && x.better ? `<p class="better"><b>Pour faire mieux.</b> ${esc(x.better)}</p>` : ""}`));
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
    if (!deferred(sc)) side.appendChild(tg);   // pas de jauge pendant la semaine : on découvre l’effet de l’échange au retour
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
    if (MOMENT[sc.id] === sc.npc) moment(sc, sc.npc, sc.nodes[sc.start].t);
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
          if (deferred(sc)) { st.later = st.later || {}; st.later[sc.id] = st.later[sc.id] || { says: [] }; if (st.later[sc.id].says && st.res[sc.id] == null) st.later[sc.id].says.push(o.t); }
          else if (o.note) { pend = o; if (o.q < 0.5) World.upset(sc.npc); }
          else if (o.q >= 1) burst(b, "good");
          if (!deferred(sc)) cheer(wrap, sc.npc, o.q);
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
      if (deferred(sc)) {
        if (firstTry) { st.later = st.later || {}; st.later[sc.id] = { ...(st.later[sc.id] || {}), end: cur }; save(); }
        const row = el("div", { class: "row" }); row.append(btn("Continuer", next)); opts.appendChild(row);   // pas de message « enregistré » : on continue
        row.querySelector("button").focus({ preventScroll: true }); Snd.click(); return;
      }
      const v = verdict(q >= 0.9 ? 1 : q >= 0.5 ? 0.5 : 0); v.s();
      if (q >= 0.9) setTimeout(() => burst(log.lastElementChild, "good"), 100);
      const box = el("div", { class: "fb " + v.cls }, `<p class="vt">${q >= 0.9 ? "Échange mené jusqu’au bout" : q >= 0.5 ? "Échange rattrapé" : "Échange à reprendre"}</p><p><b>À retenir.</b> ${esc(nd.lesson)}</p>`);
      const row = el("div", { class: "row" });
      row.append(btn("Rejouer cet échange", () => { Snd.click(); render(1); }, "ghost"), btn("Continuer", next));
      box.appendChild(row);
      opts.appendChild(box);
      box.setAttribute("tabindex", "-1"); box.focus();
      say("À retenir. " + nd.lesson); Voice.say("narr", "À retenir. " + nd.lesson, box.querySelector("p:nth-child(2)"));
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
      pending = j; Snd.mid(); const LI = liveInterrupt(ev.who, ev.t); if (!ev.who) Voice.say("narr", ev.t);
      const card = el("div", { class: "cr-pop", role: "alertdialog", "aria-label": "Nouvelle demande" }, `<p class="kicker">Interruption</p><p class="cr-q">${esc(ev.t)}</p>`);
      const row = el("div", { class: "cr-opts" });
      ev.opts.forEach((o) => { const b = el("button", { class: "opt", type: "button" }, `<span>${esc(o.t)}</span>`); b.addEventListener("click", () => { LI.leave(); evRes[j] = o; pending = null; card.classList.add(o.ok ? "ok" : "ko"); card.querySelector(".cr-opts").remove(); card.appendChild(el("p", { class: "cr-r" }, o.ok ? "Vous restez avec Lou." : esc(o.no || ""))); if (!o.ok) { left = Math.max(1, left - 8); Snd.low(); } else Snd.good(); setTimeout(() => card.remove(), o.ok ? 1400 : 2800); }); row.appendChild(b); });
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
      if (deferred(sc)) {   // pas de correction maintenant : on garde ce qui a été coché
        st.later = st.later || {}; if (st.later[sc.id] == null) { st.later[sc.id] = { sel: [...sel] }; save(); }
        opts.querySelectorAll(".opt").forEach((b) => { b.classList.remove("isok", "isno", "miss"); b.querySelector(".why")?.remove(); });
        Snd.click(); setTimeout(next, 450); return;   // on passe directement à la suite
      }
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
    n.innerHTML = `<div class="page-note"><div class="pn-ant">${faceOf("nour", "big")}</div><div class="pn-body"><p class="kicker">${isNew ? "Nouvelle page dans votre carnet" : "Page du carnet"}</p><h2 id="h-${sc.id}">${esc(p.title)}</h2>${p.quote ? `<blockquote>${esc(p.quote)}</blockquote>` : ""}<ul>${p.pts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="refs">${p.refs.map((r) => `<span class="chip">${esc(r)}</span>`).join("")}</p></div></div>`;
    n.querySelector(".pn-body").appendChild(btn(st.idx + 1 < SCREENS.length && SCREENS[st.idx + 1].type === "chapter" ? "Finir la journée" : "Continuer", next));
    if (!sc.nuitee) { const d = debrief(sc.ch); if (d) { n.prepend(d.box); n.dataset.novoice = "1"; setTimeout(() => Voice.seq(d.V.concat(VOICE_TXT.parts(sc))), 400); } }
    if (isNew) { Snd.page(); setTimeout(() => flyToCarnet(n.querySelector(".pn-ant")), 500); }
    // Chaque idée de la page est illustrée en direct, sur le plan, par une scène de la journée rejouée par les personnages.
    const ILL = { k1: ["radio", "foot", "radio"], k2: ["brief", "chat", "rire"], k3: ["verite", "consent", "nuit3"], k4: ["lou", "numero", "portail"], k5: ["affiche", "familles", "bilanequipe"] }[sc.id];
    if (ILL) {
      const lis = [...n.querySelectorAll(".pn-body li")]; let k = -1, tm = 0;
      n.classList.add("pn-ill");
      const show = () => {
        if (!n.isConnected) return;
        k = (k + 1) % Math.max(lis.length, 1);
        lis.forEach((li, j) => li.classList.toggle("on", j === k));
        const id = ILL[k % ILL.length], S0 = SCREENS.find((x) => x.id === id);
        if (S0) { try { World.stage({ ...S0, type: "story" }); } catch (e) { }
          const C = (STAGE[id] && STAGE[id].cast) || [], w = (C.find((c) => c[0] !== "you") || [])[0];
          if (w) setTimeout(() => { if (n.isConnected) { World.talk(w); setTimeout(() => World.talk(null), 2600); } }, 900); }
        tm = setTimeout(show, Math.max(6500, ((lis[k] && lis[k].textContent.length) || 80) * 60));
      };
      setTimeout(show, 600);
    }
  };

  // Fins multiples : ce que la semaine a changé, selon les décisions et la confiance gagnée.
  let epiV = [];
  function epilogue() {
    const r = (id) => st.res[id], T = st.trust || {}, E = [], X = EPILOGUE;
    const pick = (k, lvl) => [lvl, X[k].who, X[k][lvl]];
    const call = r("numero"), f1 = r("f1"), g = r("garnier");
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

  /* ---------- Classement des joueurs ---------- */
  // Score sur 1 000 : moyenne des réussites de toutes les situations évaluées, pondérée par le niveau ; + 50 si le défi est relevé.
  function finalScore(defi) {
    const v = SCREENS.filter((x) => x.comp && st.res[x.id] != null).map((x) => st.res[x.id]);
    const m = v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    return Math.min(1700, Math.round(m * 1500 * ({ 1: .7, 2: 1, 3: 1.1 }[st.level || 2]) + (defi ? 50 : 0)));
  }
  const LVN = { 1: "Enfants", 2: "Adulte", 3: "Expert" };
  const GRP = (n) => (Number(n) === 1 ? "enfants" : "adultes");
  const GRPN = { enfants: "Niveau enfants", adultes: "Niveau adultes" };
  // la mention du mode : « expert » s'il a été activé, sinon « standard » (podium adultes)
  const expTag = (e) => (Number(e.niveau) === 3 ? ' <small class="rk-exp" title="Mode expert activé">expert</small>' : Number(e.niveau) === 2 ? ' <small class="rk-std" title="Mode expert non activé">standard</small>' : "");
  const FICTIF = `<p class="rk-fict">Les premiers scores sont des profils fictifs, pour lancer le classement : à vous de les battre !</p>`;
  const hasFict = (j) => [...(j.adultes || []), ...(j.enfants || [])].some((e) => e.fictif);
  // Un podium : les 10 premiers joueurs qui ont inscrit leur score (aucune partie fictive).
  function boardList(top, me) {
    top = (top || []).slice(0, 10);
    if (!top.length) return `<p class="rk-empty">Personne n’est encore classé à ce niveau : soyez le premier ou la première !</p>`;
    return `<ol class="rk-list">${top.map((e) => `<li class="${me && e.rang === me ? "me" : ""}${e.rang <= 3 ? " podium p" + e.rang : ""}"><span class="rk-r">${e.rang}</span><span class="rk-p">${esc(e.pseudo)}${expTag(e)}${e.defi ? ' <i title="Défi relevé" aria-label="défi relevé">★</i>' : ""}</span><b class="rk-s">${e.score}</b></li>`).join("")}</ol>`;
  }
  // Les deux podiums côte à côte (onglets) : niveau adultes et niveau enfants.
  function boards(j, me, mine) {
    const g0 = mine || (st.level === 1 ? "enfants" : "adultes");
    const id = "rkb" + Math.random().toString(36).slice(2, 7);
    const tab = (g) => `<button type="button" role="tab" class="rk-tab${g === g0 ? " on" : ""}" aria-selected="${g === g0}" aria-controls="${id}-${g}" data-g="${g}">${GRPN[g]}</button>`;
    const pane = (g) => `<div class="rk-pane" role="tabpanel" id="${id}-${g}"${g === g0 ? "" : " hidden"}>${boardList(j[g], g === mine ? me : null)}</div>`;
    return `<div class="rk-tabs" role="tablist" aria-label="Podiums">${tab("adultes")}${tab("enfants")}</div>${pane("adultes")}${pane("enfants")}`;
  }
  function wireTabs(root) {
    root.addEventListener("click", (e) => { const t = e.target.closest(".rk-tab"); if (!t) return; const box = t.closest(".rk-tabs").parentElement;
      box.querySelectorAll(".rk-tab").forEach((b) => { const on = b === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
      box.querySelectorAll(".rk-pane").forEach((p) => { p.hidden = p.id !== t.getAttribute("aria-controls"); }); });
  }
  const norm2 = (j) => (j && j.ok ? { ...j, adultes: j.adultes || j.top || [], enfants: j.enfants || [] } : null);
  function rankBox(defi) {
    const score = finalScore(defi);
    const box = el("section", { class: "rank", "aria-labelledby": "rk-h" });
    box.innerHTML = `<div class="rk-head"><div><p class="kicker">Le classement</p><h3 id="rk-h">Votre score : <span class="rk-big">${score}</span> <small>points</small></h3>
      <p class="small">Moyenne de vos décisions, niveau ${LVN[st.level || 2].toLowerCase()}${defi ? ", défi relevé (+ 50)" : ""}. Inscrivez-vous sur le podium ${st.level === 1 ? "des enfants" : "des adultes"} avec un pseudo : pas votre nom complet.</p></div></div>
      <form class="rk-form"><label class="sr-only" for="rk-pseudo">Votre pseudo</label><input id="rk-pseudo" maxlength="16" autocomplete="nickname" placeholder="Votre pseudo" value="${esc((st.name || "").slice(0, 16))}"><button class="cta" type="submit">M’inscrire sur le podium</button></form>
      <p class="rk-msg" role="status"></p><div class="rk-board"></div>`;
    const form = box.querySelector("form"), msg = box.querySelector(".rk-msg"), board = box.querySelector(".rk-board");
    if (st.ranked) { form.hidden = true; msg.textContent = `Vous êtes classé·e sous le pseudo « ${st.ranked.pseudo} ».`; }
    wireTabs(board);
    fetch("/api/classement", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((j) => { j = norm2(j); if (j) board.innerHTML = boards(j, st.ranked && st.ranked.rang, GRP(st.level || 2)) + (hasFict(j) ? FICTIF : "") + `<p class="small">${j.total} partie${j.total > 1 ? "s" : ""} classée${j.total > 1 ? "s" : ""} au total.</p>`; else board.innerHTML = `<p class="rk-empty">Le classement n’est pas disponible pour le moment.</p>`; }).catch(() => { board.innerHTML = `<p class="rk-empty">Le classement n’est pas disponible pour le moment.</p>`; });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const pseudo = box.querySelector("#rk-pseudo").value.trim(); const sb = form.querySelector("button");
      sb.disabled = true; msg.textContent = "Envoi…";
      fetch("/api/classement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pseudo, score, niveau: st.level || 2, defi: !!defi, nuitee: !!st.nuitee }) })
        .then((r) => r.json().catch(() => ({}))).then((j) => {
          sb.disabled = false;
          if (!j || !j.ok) { msg.textContent = (j && j.error) || "Le classement n’est pas disponible pour le moment."; return; }
          st.ranked = { pseudo, rang: j.rang }; save(); form.hidden = true;
          msg.textContent = j.ameliore === false ? `Votre meilleur score (${j.meilleur}) reste au classement : vous êtes ${j.rang}${j.rang === 1 ? "er" : "e"}.` : `Bravo ! Vous êtes ${j.rang}${j.rang === 1 ? "er" : "e"} sur le podium ${st.level === 1 ? "des enfants" : "des adultes"}.`;
          board.innerHTML = boards(norm2(j), j.rang, GRP(st.level || 2)); Snd.good(); if (j.rang <= 3) confetti(box);
        }).catch(() => { sb.disabled = false; msg.textContent = "Le classement n’est pas disponible pour le moment."; });
    });
    return box;
  }
  function openBoard() {
    const d = el("div", { class: "rk-pop", role: "dialog", "aria-modal": "true", "aria-labelledby": "rkp-h" });
    d.innerHTML = `<div class="rk-card"><button type="button" class="rk-x" aria-label="Fermer">×</button><p class="kicker">Les Hautes Herbes</p><h2 id="rkp-h">Le classement des joueurs</h2><div class="rk-board"><p class="rk-empty">Chargement…</p></div><p class="small">Les 10 premiers de chaque niveau. Le score, calculé à la fin de la semaine, dépend de vos décisions et du niveau choisi.</p></div>`;
    const close = () => { d.remove(); document.removeEventListener("keydown", esc2); };
    const esc2 = (e) => { if (e.key === "Escape") close(); };
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest(".rk-x")) close(); });
    document.addEventListener("keydown", esc2); document.body.appendChild(d); wireTabs(d); d.querySelector(".rk-x").focus();
    fetch("/api/classement", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((j) => { j = norm2(j); d.querySelector(".rk-board").innerHTML = j ? boards(j) + (hasFict(j) ? FICTIF : "") + `<p class="small">${j.total} partie${j.total > 1 ? "s" : ""} classée${j.total > 1 ? "s" : ""} au total.</p>` : `<p class="rk-empty">Le classement n’est pas disponible pour le moment.</p>`; })
      .catch(() => { d.querySelector(".rk-board").innerHTML = `<p class="rk-empty">Le classement n’est pas disponible pour le moment.</p>`; });
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
      <div class="bhead"><div class="bav">${youBust(true)}</div><div><p class="kicker">Fin de la semaine</p><h2 id="h-${sc.id}">Votre semaine aux Hautes Herbes${st.name ? ", " + esc(st.name) : ""}</h2>
      <p class="lead">${defi ? "Défi relevé : vous avez protégé d’abord et alerté les bons relais, sans promettre le secret." : "Vous avez beaucoup avancé. Un ou deux réflexes de protection restent à consolider : rejouez les journées indiquées."}</p></div></div>
      ${epilogue()}<h3>Votre cible</h3><div class="bring">${ringsSVG(150)}<div><p>Pendant la semaine, cette cible en haut de l’écran s’est remplie à chacune de vos décisions justes. Chaque anneau est une compétence.</p>${ringList()}
        ${(() => { const P = compProgress().sort((a, b) => a[1] - b[1]); const w = P.filter(([, v]) => v < 0.8).slice(0, 2); return w.length ? `<div class="toimprove"><p class="kicker">Pour progresser</p>${w.map(([c]) => `<p><i style="background:${RING[c]}"></i><b>${esc(COMPS[c])}.</b> ${esc(TIPS[c])}</p>`).join("")}</div>` : `<p class="toimprove good">Toutes vos compétences sont au vert. Bravo.</p>`; })()}</div></div>
      <h3>Vos compétences</h3><div class="comps">${Object.keys(COMPS).map((k) => { const v = avg(by[k]); const [c, t] = lvl(v); return `<div class="comp ${c}"><div class="ct"><b>${k}</b> ${esc(COMPS[k])}</div><div class="bar" aria-hidden="true"><span style="width:${v == null ? 0 : Math.round(v * 100)}%"></span></div><span class="lv">${t}</span></div>`; }).join("")}</div>
      <h3>Vos réflexes professionnels</h3><ul class="rfx">${rf.map((r, i) => `<li class="${r.ok ? "good" : "mid"}" style="--k:${i}"><span class="ic" aria-hidden="true">${r.ok ? "✓" : "↻"}</span><span>${esc(r.label)}</span><em>${r.ok ? "Acquis" : "À consolider"}</em>${r.ok ? "" : `<button class="ghost small" type="button" data-ch="${r.ch}">Rejouer ${(CHAPTERS[r.ch - 1] || {}).day ? "la journée du " + CHAPTERS[r.ch - 1].day.toLowerCase() : "cette journée"}</button>`}</li>`).join("")}</ul>
      ${st.build ? `<h3>Votre mesure de prévention</h3><div class="mymeasure"><p><b>${esc(st.build.sit)}</b> : ${esc(st.build.change)}</p><p><b>Indicateur :</b> ${esc(st.build.ind)}</p><p class="small">À proposer à ta direction lors de ton prochain accueil.</p></div>` : ""}
      <h3>Les numéros à garder</h3><div class="nums">${NUMBERS.map(([a, b]) => `<div class="nb"><b>${a}</b><span>${esc(b)}</span></div>`).join("")}</div>
      <p class="small">Ce bilan est un repère personnel. Ce n’est pas une évaluation BAFA ou BAFD.</p></div>`;
    { const NU = st.level === 1 ? NUANCE_KID : NUANCE; const box = n.querySelector(".bilan .bhead"); if (box) box.insertAdjacentHTML("afterend", `<div class="nuance"><p class="kicker">Le mot de Bafaël</p><p>${esc(NU)}</p></div>`);
      n.dataset.novoice = "1"; setTimeout(() => Voice.seq([["narr", NU]].concat(epiV.length ? [["narr", "Épilogue. Ce que votre semaine a changé."]].concat(epiV) : [])), 700); }
    const b = n.querySelector(".bilan");
    if (typeof SOURCES !== "undefined" && SOURCES.length) n.querySelector(".bilan").appendChild(el("section", { class: "sources" }, `<h3>Pour aller plus loin : les faits réels dont s’inspire le jeu</h3>` + pressBox(SOURCES).outerHTML));
    b.appendChild(rankBox(defi));
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
    if (st.roam) SCREENS.forEach((s) => { if (s.ch === ch) { delete st.roam[s.id]; if (st.later) delete st.later[s.id]; } });
    if (ch === 4) delete st.flags.secret;
    if (ch === 1) delete st.flags.mapfound;
    const i = SCREENS.findIndex((s) => s.ch === ch && s.type === "chapter");
    go(i);
  }
  function restart() { const keep = st.settings, look = st.look; st = fresh(); st.settings = keep; if (look) st.look = look; save(); Snd.click(); prelude(() => go(0)); }

  // Prélude d’une nouvelle partie : des phrases entendues tous les jours, dites par des voix différentes,
  // qui s’accumulent puis s’estompent comme des échos. Une seule source audio, lancée pendant le clic
  // (iPhone et Android n’autorisent le son qu’ainsi), puis réutilisée phrase après phrase.
  function prelude(done) {
    if (DC.el) DC.el.hidden = true;
    hud(false); Voice.stop();
    if (World.el) { World.el.classList.remove("on"); World.cur = null; }
    document.body.classList.remove("athome", "live", "grave", "scene");
    stage.innerHTML = "";
    const n = el("section", { class: "screen echoes in", "aria-labelledby": "h-echoes" });
    n.innerHTML = `<div class="hbg" aria-hidden="true"><i class="glow g1"></i><i class="glow g2"></i></div>
      <h2 id="h-echoes" class="sr-only">Prélude : des phrases entendues tous les jours</h2>
      <div class="ec-field"></div><div class="ec-end" hidden><p class="ec-out"></p></div>`;
    const field = n.querySelector(".ec-field"), end = n.querySelector(".ec-end"), outP = n.querySelector(".ec-out");
    let alive = true, timer = null, idx = 0, token = 0;
    const L = ECHOES.lines, voiceOn = !!(Voice.ok && Voice.ready && st.settings.voice);
    const audio = voiceOn ? new Audio() : null;
    if (audio) audio.preload = "auto";
    const finish = () => {
      if (!alive) return; alive = false; clearTimeout(timer); cancelAnimationFrame(raf);
      if (audio) { try { audio.pause(); } catch (e) { } audio.removeAttribute("src"); }
      Voice.stop(); Snd.duck(false); Snd.click(); done();
    };
    stage.appendChild(n);
    // positions éparpillées (en % de la zone), en alternance gauche / droite
    // ordinateur : trois colonnes décalées (aucun chevauchement) ; téléphone : emplacements alternés, seules les 3 dernières restent visibles
    const POS = innerWidth < 700
      ? [[50, 18], [50, 45], [50, 72]]
      : [[18, 14], [82, 14], [50, 27], [18, 40], [82, 40], [50, 53], [18, 66], [82, 66], [50, 79], [18, 91], [82, 91]];
    function show(line, k) {
      field.querySelectorAll(".ec.on").forEach((e, j, all) => { e.classList.add("past"); if (j < all.length - 2) e.classList.add("old"); });
      const p = POS[k % POS.length];
      const f = el("figure", { class: "ec", style: `--x:${p[0]}%;--y:${p[1]}%` }, `<blockquote><span class="q">«</span> ${words(line.t)} <span class="q">»</span></blockquote><figcaption>${esc(line.label)}</figcaption>`);
      field.appendChild(f); requestAnimationFrame(() => requestAnimationFrame(() => f.classList.add("on")));
      say(line.label + " : " + line.t);
      return f;
    }
    // Les mots apparaissent au moment où on les entend (ou au rythme de lecture, sans voix).
    let raf = 0;
    // La phrase apparaît en entier, doucement (du flou au net), dès que la voix commence : plus de décalage mot à mot.
    function reveal(f) { cancelAnimationFrame(raf); f.classList.add("lit"); }
    function outro() {
      if (!alive) return;
      field.classList.add("done"); end.hidden = false; outP.innerHTML = words(ECHOES.outro);
      requestAnimationFrame(() => end.classList.add("on"));
      say(ECHOES.outro);
      end.appendChild(btn("Entrer aux Hautes Herbes", finish));
      Voice.prefetch([["narr", ROLE.voice], ["narr", ROLE.goalVoice]]);
      if (voiceOn) { Snd.duck(false); setTimeout(() => { if (alive) Voice.say("narr", ECHOES.outro, outP); }, 500); }
    }
    function step() {
      if (!alive) return;
      clearTimeout(timer);
      if (idx >= L.length) { timer = setTimeout(outro, 700); return; }
      const line = L[idx], k = idx++, my = ++token;
      const f = show(line, k);
      const read = Math.max(1500, 700 + line.t.length * 46);   // rythme de lecture, sans voix
      const nextOnce = (delay) => { if (my !== token || !alive) return; clearTimeout(timer); timer = setTimeout(step, delay); };
      const byTime = () => { const t0 = performance.now(), d = read * .72; reveal(f, () => (performance.now() - t0) / d); };
      const u = audio && Voice.url(line.who, line.t);
      if (!u) { byTime(); nextOnce(read); return; }
      audio.onended = () => { f.querySelectorAll(".wd").forEach((w) => w.classList.add("sp")); nextOnce(calm() ? 300 : 60); };
      audio.onerror = () => { byTime(); nextOnce(read); };
      audio.onplaying = () => reveal(f, () => audio.currentTime / audDur(audio, line.t));
      setTimeout(() => { if (my === token && alive) reveal(f); }, 2200);   // si la voix tarde, la phrase apparaît quand même
      audio.src = u;
      const pr = audio.play(); if (pr && pr.catch) pr.catch(() => { byTime(); nextOnce(read); });
      timer = setTimeout(() => nextOnce(0), Math.max(read, 9000));   // garde-fou si l’audio ne répond pas
    }
    // Bafaël se présente et annonce la semaine, puis les citations commencent.
    function intro() {
      const box = el("div", { class: "ec-intro" }, `<p><small>Bafaël, votre narrateur</small>${esc(ECHOES.intro)}</p>`);
      n.appendChild(box); requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("on")));
      say(ECHOES.intro);
      let gone = false;
      const next = () => { if (gone || !alive) return; gone = true; clearTimeout(timer); box.classList.add("out"); timer = setTimeout(() => { box.remove(); step(); }, 650); };
      const read = Math.max(4000, 900 + ECHOES.intro.length * 52);
      const u = audio && Voice.url("narr", ECHOES.intro);
      if (!u) { timer = setTimeout(next, read); return; }
      audio.onended = () => setTimeout(next, 250); audio.onerror = () => { timer = setTimeout(next, read); };
      audio.src = u; const pr = audio.play(); if (pr && pr.catch) pr.catch(() => { timer = setTimeout(next, read); });
      timer = setTimeout(next, Math.max(read + 4000, 16000));   // garde-fou si l’audio ne répond pas
    }
    intro();   // lancé pendant le clic : le son est autorisé sur téléphone
  }

  /* =============================================================================================
     Nouvelles mécaniques : téléphone, planning, appel d'urgence, portail des familles,
     recueil de la parole d'un témoin, souvenirs rejoués, documents du carnet.
     (inséré dans engine.js à la construction)
     ============================================================================================= */
  Object.assign(NAMES, { sacha: "Sacha", rey: "M. Rey", karim: "Karim", petit: "Mme Petit", zoe: "Zoé", theo: "Noé", clara: "Clara", enzo: "Enzo", lena: "Léna", intervenant: "L’intervenant", parent: "Un parent", you: "Vous" });
  const face = (w, m) => faceOf(w, m);
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
      if (d.at !== sc.id || (st.docs || []).includes(k) || (d.kidsOnly && st.level !== 1)) return;
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
        `<div class="wa ph-wa"><div class="wa-dev"><div class="wa-notch"></div>
           <div class="wa-top"><span class="wa-back" aria-hidden="true">‹</span><span class="wa-av">${face(p.av)}</span><span class="wa-id"><b>${esc(p.from)}</b><small>${esc(p.app === "SMS" ? "SMS" : "en ligne")}</small></span><button type="button" class="ph-x" aria-label="Fermer le téléphone">✕</button></div>
           <div class="wa-body ph-chat"><div class="wa-m">${esc(p.t)}<i>maintenant</i></div></div>
           <div class="ph-opts wa-opts"></div></div></div>`);
      const opts = m.querySelector(".ph-opts"), chat = m.querySelector(".ph-chat");
      p.opts.forEach((o) => {
        const b = el("button", { class: "ph-o", type: "button" }, esc(o.t));
        b.addEventListener("click", () => {
          opts.innerHTML = "";
          chat.appendChild(el("div", { class: "wa-m me" }, `${esc(o.t)}<i>maintenant ✓✓</i>`));
          record({ id: "tel-" + p.id, comp: p.comp }, o.q);
          const v = verdict(o.q); v.s();
          chat.appendChild(el("div", { class: "ph-fb wa-fb " + v.cls }, esc(o.fb))); chat.scrollTop = chat.scrollHeight;
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
        fbz.innerHTML = `<div class="fb low"><p class="vt">Le planning ne tient pas</p><ul>${v.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><p class="small"><b>Pour corriger :</b> touchez le prénom de la personne mal placée, puis le poste où elle doit aller. Elle quitte automatiquement son ancien poste.</p></div>`;
        return;
      }
      cb.disabled = true; fbz.innerHTML = `<div class="fb good"><p class="vt">Planning validé</p><p>Chaque groupe est encadré selon les règles de l’équipe.</p></div>`; Snd.good();
      setTimeout(twist, 1400);
    });
    function twist() {
      const T = sc.twist;
      // le message arrive sur votre téléphone : vous le lisez vous-même (personne ne le raconte)
      const m = /«\s*([^»]+?)\s*»/.exec(T.t), body = m ? m[1] : T.t, where = (/depuis ([^:«]+)/.exec(T.t) || [])[1];
      const hh = "14:37";
      const p = pop("pl-twist sms", waPhone({ title: NAMES[T.who], sub: where ? where.trim() : "en ligne", face: face(T.who), msgs: [{ who: NAMES[T.who], t: body, time: hh }] }) + `<p class="kicker">Que lui répondez-vous ?</p>`);
      const o = el("div", { class: "cr-opts" });
      T.opts.forEach((x) => { const b = el("button", { class: "opt", type: "button" }, esc(x.t)); b.addEventListener("click", () => { p.remove(); end(x); }); o.appendChild(b); });
      p.appendChild(o); Snd.mid && Snd.mid(); if (navigator.vibrate) try { navigator.vibrate([160, 90, 160]); } catch (e) { }
      o.querySelector(".opt").focus({ preventScroll: true });
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

  /* ---------- appel d'urgence : un vrai téléphone, puis la conversation ---------- */
  R.dial = (sc, n) => {
    const panel = el("div", { class: "panel dial" });
    panel.innerHTML = `${kicker(sc.kicker)}<h2 id="h-${sc.id}">${esc(sc.title)}</h2><p class="lead">${esc(sc.intro)}</p>`;
    const L = { 2: "ABC", 3: "DEF", 4: "GHI", 5: "JKL", 6: "MNO", 7: "PQRS", 8: "TUV", 9: "WXYZ", 0: "+" };
    const hm = ((sc.kicker || "").match(/(\d{1,2}) ?h ?(\d{2})/) || [0, 16, "05"]);
    const ph = el("div", { class: "iphone" }, `<div class="ip-bar"><b>${hm[1]}:${hm[2]}</b><span class="ip-ic"><i></i><i></i><i></i><i></i></span></div>
      <div class="ip-dial"><div class="ip-num" aria-live="polite"></div><div class="ip-sub">&nbsp;</div>
      <div class="ip-keys">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => `<button type="button" class="ip-k" data-k="${k}"><b>${k}</b><small>${L[k] || "&nbsp;"}</small></button>`).join("")}</div>
      <div class="ip-row"><span></span><button type="button" class="ip-call" aria-label="Appeler"><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="#fff"/></svg></button><button type="button" class="ip-del" aria-label="Effacer" hidden>⌫</button></div></div>
      <div class="ip-incall" hidden><p class="ip-who">${esc(sc.caller || "Appel")}</p><p class="ip-t">appel…</p>
      <div class="ip-tools">${["silence", "clavier", "haut-parleur", "ajouter", "FaceTime", "contacts"].map((t) => `<span><i></i>${t}</span>`).join("")}</div><button type="button" class="ip-end" aria-label="Raccrocher" disabled></button></div>`);
    let num = "", tries = 0, left = sc.timer || 30, over = false, started = false, tId = 0;
    const numEl = ph.querySelector(".ip-num"), del = ph.querySelector(".ip-del");
    const show = () => { numEl.textContent = num; del.hidden = !num; ph.querySelector(".ip-sub").innerHTML = num === "17" ? "Police secours" : num === "112" ? "Urgences" : "&nbsp;"; };
    const press = (k) => { if (over || !started || num.length >= 6) return; num += k; show(); Snd.click(); };
    ph.querySelectorAll(".ip-k").forEach((b) => b.addEventListener("click", () => press(b.dataset.k)));
    del.addEventListener("click", () => { num = num.slice(0, -1); show(); });
    ph.querySelector(".ip-call").addEventListener("click", call);
    const onKey = (e) => { if (!n.isConnected) return document.removeEventListener("keydown", onKey); if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === "Backspace") { num = num.slice(0, -1); show(); } else if (e.key === "Enter") call(); };
    document.addEventListener("keydown", onKey);
    const bar = el("div", { class: "qtimer", role: "timer" }, `<i style="animation-duration:${left}s;animation-play-state:paused"></i><span>${left} s</span>`);
    const fbz = el("div", { class: "fbzone", "aria-live": "polite" });
    const start = () => {
      started = true; bar.querySelector("i").style.animationPlayState = "running";
      tId = setInterval(() => {
        if (!n.isConnected) return clearInterval(tId);
        left--; bar.querySelector("span").textContent = left > 0 ? `${left} s` : "Temps écoulé"; bar.classList.toggle("hurry", left <= 8);
        if (left <= 0) { clearInterval(tId); finish(0, "Temps écoulé. Pendant que vous hésitiez, l’adulte désigné approchait du portail."); }
      }, 1000);
      if (sc.interrupt && !calm()) setTimeout(() => {
        if (over || !n.isConnected) return;
        const p = pop("dint", `<p class="kicker">Interruption</p><p class="cr-q">${esc(sc.interrupt.t)}</p>`), LI = liveInterrupt(sc.interrupt.who, sc.interrupt.t);
        const o = el("div", { class: "cr-opts" });
        [["« Pas maintenant. Va voir Inès, elle va arbitrer. »", 1], ["Y aller deux minutes, puis revenir appeler.", 0]].forEach(([t, ok]) => {
          const b = el("button", { class: "opt", type: "button" }, t);
          b.addEventListener("click", () => { p.remove(); LI.leave(); if (!ok) { left = Math.max(3, left - 12); toastMsg("Deux minutes perdues… et Lou est resté seul."); } else Snd.click(); });
          o.appendChild(b);
        });
        p.appendChild(o);
      }, 7000);
    };
    setTimeout(() => autoGate(panel, start), 0);
    function call() {
      if (over || !num || !started) return; tries++;
      if (sc.ok.includes(num)) {
        over = true; clearInterval(tId); bar.remove(); fbz.innerHTML = ""; Snd.click(); document.querySelectorAll(".cr-pop.dint").forEach((x) => x.remove());
        ph.querySelector(".ip-dial").hidden = true; const ic = ph.querySelector(".ip-incall"); ic.hidden = false;
        const rl = (sc.relay || {})[num];
        ic.querySelector(".ip-who").textContent = num === "112" ? "Urgences · 112" : (sc.caller || "Appel") + " · " + num;
        if (rl) setTimeout(() => {   // le 112 répond, puis passe la gendarmerie
          if (!log.isConnected) panel.insertBefore(log, fbz);
          const row = el("div", { class: "say npc" }, `<b>Urgences 112</b><p>${words(rl)}</p>`); log.appendChild(row);
          Voice.say("operateur", rl, row.querySelector("p"));
          setTimeout(() => { ic.querySelector(".ip-who").textContent = (sc.caller || "Appel") + " · transfert du 112"; talk(0); }, 3600);
        }, 1400);
        else setTimeout(() => talk(0), 1500);
      } else {
        ph.classList.remove("wrong"); void ph.offsetWidth; ph.classList.add("wrong"); Snd.low();
        const t = (sc.near[num] || "Ce numéro ne correspond à aucun service d’urgence.") + (tries >= 2 && sc.help ? " " + sc.help : "");
        fbz.innerHTML = `<div class="fb mid"><p>${esc(t)}</p></div>`; Voice.say("narr", t, fbz.querySelector("p"));
        num = ""; show();
      }
    }
    // la conversation avec les gendarmes
    const dq = tries === 0 ? 1 : 0, qs = [], log = el("div", { class: "ip-log" });
    let t0 = 0, clk = 0;
    function talk(i) {
      const ic = ph.querySelector(".ip-incall");
      if (!t0) { t0 = Date.now(); clk = setInterval(() => { if (!n.isConnected) return clearInterval(clk); const s2 = Math.floor((Date.now() - t0) / 1000); ic.querySelector(".ip-t").textContent = `${String(Math.floor(s2 / 60)).padStart(2, "0")}:${String(s2 % 60).padStart(2, "0")}`; }, 500); }
      if (!log.isConnected) panel.insertBefore(log, fbz);
      const C = (sc.convo || [])[i];
      if (!C) return end();
      const row = el("div", { class: "say npc" }, `<b>${esc(sc.caller || "Gendarmerie")}</b><p>${words(C.t)}</p>`); log.appendChild(row);
      Voice.say("gendarme", C.t, row.querySelector("p"));
      const o = el("div", { class: "opts" });
      C.opts.forEach((x, j) => {
        const b = el("button", { class: "opt", type: "button", style: `--k:${j}` }, `<span class="ol">${String.fromCharCode(65 + j)}</span><span>${esc(x.t)}</span>`);
        b.addEventListener("click", () => {
          o.remove(); qs.push(x.q); Snd[x.q >= 1 ? "good" : "low"]();
          log.appendChild(el("div", { class: "say me" }, `<b>${esc(st.name || "Vous")}</b><p>${esc(x.t)}</p>`));
          const f = el("p", { class: "ip-fb " + (x.q >= 1 ? "good" : x.q >= .4 ? "mid" : "low") }, esc(x.fb)); log.appendChild(f);
          Voice.say("narr", x.fb, f);
          setTimeout(() => talk(i + 1), 900);
        });
        o.appendChild(b);
      });
      log.appendChild(o);
      setTimeout(() => o.scrollIntoView({ behavior: "smooth", block: "nearest" }), 150);
    }
    function end() {
      const row = el("div", { class: "say npc" }, `<b>${esc(sc.caller || "Gendarmerie")}</b><p>${words(sc.done)}</p>`); log.appendChild(row);
      Voice.say("gendarme", sc.done, row.querySelector("p"));
      clearInterval(clk); const e = ph.querySelector(".ip-end"); e.disabled = false; e.classList.add("ready");
      const hb = btn("Raccrocher", () => e.click()); hb.classList.add("hangup"); log.appendChild(hb); setTimeout(() => hb.scrollIntoView({ behavior: "smooth", block: "nearest" }), 200);
      e.addEventListener("click", () => { e.disabled = true; ph.classList.add("ended"); hb.remove();
        const cq = qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : 1, dq2 = tries === 1 ? 1 : tries === 2 ? 0.7 : 0.5;
        finish(Math.round((0.4 * dq2 + 0.6 * cq) * 100) / 100, `${tries === 1 ? "Le bon numéro du premier coup." : "Le bon numéro, après une erreur."} ${cq >= 0.9 ? "Et un appel clair : qui vous êtes, ce que l’enfant a dit, où il se trouve." : "Relisez ce qui rend un appel d’urgence utile : qui, quoi, où, et les mots exacts de l’enfant."}`);
      }, { once: true });
    }
    function finish(q, txt) {
      if (fbz.dataset.done) return; fbz.dataset.done = "1"; over = true; clearInterval(tId); document.querySelectorAll(".cr-pop.dint").forEach((x) => x.remove());
      record(sc, q); result(fbz, q, txt);
    }
    const tools = el("div", { class: "row" }); tools.append(btn("Ouvrir les numéros utiles (carnet)", () => openCarnet("numeros"), "ghost"));
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
      // M. Rey, pressé : une grosse barre de temps sous pression oblige à choisir vite
      if (c.press && !calm()) {
        const secs = Math.max(8, Math.round(c.press * (LV().t || 1))), bar = el("div", { class: "mt-press", role: "timer", "aria-label": `${secs} secondes pour décider` }, `<i></i><span>${c.pressT || "M. Rey s’impatiente"} · ${secs} s</span>`);
        k.after(bar); Snd.setMood("stress");
        let left = secs, started = false;
        c._tm = setInterval(() => {
          if (Voice.busy() && st.settings.voice && !started) return;   // la barre part quand la phrase est dite
          if (!started) { started = true; bar.querySelector("i").style.animationDuration = secs + "s"; bar.classList.add("go"); }
          left--; bar.querySelector("span").textContent = `${c.pressT || "M. Rey s’impatiente"} · ${Math.max(0, left)} s`; bar.classList.toggle("hurry", left <= 4);
          if (left <= 0) { clearInterval(c._tm); const give = [...acts.querySelectorAll(".opt")][sc.actions.findIndex(([a]) => a === "give")]; if (give && !give.disabled) { toastMsg("Trop tard : sous la pression, Lou est parti avec M. Rey."); pick(c, "give", acts, give); } }
        }, 1000);
      }
    }
    function pick(c, a, acts, b) {
      clearInterval(c._tm); const pb = box.querySelector(".mt-press"); if (pb) pb.classList.add("stop");
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
        if (trust < 25) { const t = sc.quit || "Euh… je veux plus en parler. Laisse tomber."; const b = say(sc.npc, t); Voice.say(sc.npc, t, b.querySelector("p")); finish(false); }
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
    setTimeout(() => {
      const t = sc.open || "Euh… j’ai vu un truc, à la régie… mais je sais pas si je dois le dire."; const b = say(sc.npc, t);
      // Sacha parle après la narration de l’écran (sans la couper)
      const go = () => { if (b.isConnected) Voice.say(sc.npc, t, b.querySelector("p")); };
      if (Voice.busy && Voice.busy()) document.addEventListener("voice-idle", go, { once: true }); else go();
    }, 600);
  };

  /* ---------- retour sur la semaine : chaque décision, ce qu'elle a produit, puis le cadre ---------- */
  R.replay = (sc, n) => {
    st.revealed = true; save(); rings(true);
    // la scène d'un écran (« keep » = la même que l'écran d'avant)
    const stageOf = (id) => { let i = SCREENS.findIndex((x) => x.id === id), S = STAGE[id]; while (S === "keep" && i > 0) S = STAGE[SCREENS[--i].id]; const s0 = SCREENS.find((x) => x.id === id); return S && S !== "keep" ? S : { at: LOC[id] || "ensemble", cast: s0 && s0.npc ? [[s0.npc, "a", "talk"], ["you", "b"]] : [] }; };
    const ids = SCREENS.filter((x) => DEFER.has(x.type) && st.res[x.id] != null && (!x.nuitee || st.nuitee)).map((x) => x.id);
    const panel = el("div", { class: "panel replay" });
    panel.innerHTML = `${kicker(sc.kicker)}<h2 id="h-${sc.id}">Retour sur votre semaine</h2><p class="lead">Pendant la semaine, vos décisions ont été enregistrées sans verdict. Revenez sur chacune : ce qu’elle a produit, puis ce que dit le cadre.</p>`;
    const body = el("div", { class: "rp-body", "aria-live": "polite" });
    const row = el("div", { class: "row" });
    n.dataset.novoice = "1";
    if (!ids.length) { body.innerHTML = `<p>Aucune décision à revoir.</p>`; endRow(row, "Voir le bilan"); panel.append(body, row); n.appendChild(panel); return; }
    let i = 0;
    const tierOf = (id) => (st.res[id] >= 0.95 ? "excellent" : st.res[id] >= 0.45 ? "moyen" : "catastrophe");
    const LBL = { excellent: ["Ce que votre décision a permis", "good"], moyen: ["Ce que votre décision a laissé passer", "mid"], catastrophe: ["Ce que votre décision a provoqué", "low"] };
    const nb = btn("Décision suivante", () => { i++; if (i < ids.length) play(); else next(); });
    const li = (t, cls = "") => `<li class="${cls}">${esc(t)}</li>`;
    function play() {
      const id = ids[i], S0 = tune(SCREENS.find((s) => s.id === id)), L = (st.later || {})[id] || {}, t = tierOf(id), R0 = REPLAY[id], v = verdict(st.res[id]);
      if (R0) World.show({ at: R0.at, room: R0.room, cast: R0.tiers[t].cast }, { id: "retour-" + id, type: "story", ch: 6 });
      else World.show(stageOf(id), { id: "retour-" + id, type: "story", ch: 6 });
      let choix = "", effet = [], cadre = "", V = [];
      if (S0.type === "choice") {
        const o = S0.opts[L.k != null ? L.k : 0];
        choix = `<p class="rp-choice">Vous aviez répondu : « ${esc(o.t)} »</p>`;
        if (R0) R0.tiers[t].lines.forEach(([w, tx]) => effet.push([w, tx]));
        else if (o.cons) effet.push(["narr", o.cons]);
        cadre = `<p>${esc(o.fb)}</p>${o.q < 1 && S0.better ? `<p class="better"><b>Pour faire mieux.</b> ${esc(S0.better)}</p>` : ""}`;
        if (!R0) V.push(VOICE_TXT.fb(S0, o)); else V.push(["narr", o.fb]);
      } else if (S0.type === "multi") {
        const sel = new Set(L.sel || []);
        choix = `<p class="rp-choice">Vous aviez retenu :</p><ul class="rp-sel">${S0.opts.map((o, j) => sel.has(j) ? li(o.t) : "").join("") || li("aucune action")}</ul>`;
        cadre = `<ul class="rp-why">${S0.opts.map((o, j) => li((o.ok ? "✓ " : "✕ ") + o.t + " : " + o.why, (o.ok ? "ok" : "no") + (sel.has(j) !== !!o.ok ? " miss" : ""))).join("")}</ul>${S0.after ? `<p class="better"><b>Et ensuite.</b> ${esc(S0.after)}</p>` : ""}`;
      } else if (S0.type === "dialogue") {
        const nd = S0.nodes[L.end] || Object.values(S0.nodes).find((x) => x.end) || {};
        choix = (L.says || []).length ? `<p class="rp-choice">Ce que vous aviez dit :</p><ul class="rp-sel">${L.says.map((x) => li("« " + x + " »")).join("")}</ul>` : "";
        if (nd.t) effet.push([S0.npc, nd.t]);
        cadre = nd.lesson ? `<p><b>À retenir.</b> ${esc(nd.lesson)}</p>` : "";
        if (nd.lesson) V.push(["narr", "À retenir. " + nd.lesson]);
      } else if (S0.type === "find") {
        const o = S0.opts[L.k != null ? L.k : 0];
        choix = `<p class="rp-choice">Vous aviez répondu à Léna : ${esc(o.t)}</p>`;
        cadre = `<p>${esc(o.fb)}</p>`; V.push(["narr", o.fb]);
      }
      body.innerHTML = `<p class="kicker">${i + 1} sur ${ids.length} · ${esc(S0.kicker || S0.title || "")}</p>${choix}<p class="rp-tier ${LBL[t][1]}">${LBL[t][0]} · ${v.t}</p><div class="rp-lines"></div><div class="rp-cadre"><p class="kicker">Le cadre</p>${cadre}</div>`;
      const box = body.querySelector(".rp-lines"), seq = [];
      effet.forEach(([w, tx], j) => {
        const r = el("div", { class: "say " + (w === "narr" ? "narr" : "npc"), style: `animation-delay:${0.6 + j * 0.5}s` }, w === "narr" ? `<p>${words(tx)}</p>` : `<b>${NAMES[w] || ""}</b><p>${words(tx)}</p>`);
        box.appendChild(r); seq.push([w, tx, r.querySelector("p")]);
      });
      setTimeout(() => Voice.seq(seq.concat(V)), 500);
      nb.textContent = i < ids.length - 1 ? "Décision suivante" : "Voir le bilan";
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
      const b = el("button", { class: "fperson", type: "button", style: `left:${p[0]}%;top:${p[1]}%;width:${size}%;z-index:${Math.round((x + y) * 10) + 10}`, "aria-label": ok ? "Une jeune fille près du parc" : "Un enfant" },
        `<svg viewBox="-22 -60 44 64" overflow="visible">${(() => { const ps = ok ? "stand" : (["walk", "wave", "talk"][Math.floor(Math.random() * 3)]); return rigMini(w, ps) || A.minis[w][ps]; })()}</svg>`);
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
      { const S = VOICE_TXT.split(sc.found); Voice.seq(S.map(([w, x]) => [w, x, S.length === 1 ? fbz.querySelector("p") : null])); }   // Léna parle avec sa propre voix
      const o = el("div", { class: "opts" });
      sc.opts.forEach((x, j) => {
        const bb = el("button", { class: "opt", type: "button", style: `--k:${j}` }, `<span class="ol">${String.fromCharCode(65 + j)}</span><span>${esc(x.t)}</span>`);
        bb.addEventListener("click", () => { const q = x.q >= 1 ? (q0 >= 0.7 ? 1 : 0.8) : Math.round(x.q * 0.8 * 100) / 100; const first = st.res[sc.id] == null; record(sc, q); if (deferred(sc)) { if (first) { st.later = st.later || {}; st.later[sc.id] = { k: j, late: !!late }; save(); } o.querySelectorAll("button").forEach((z) => (z.disabled = true)); bb.classList.add("picked", "neutral"); Snd.click(); setTimeout(next, 450); return; } const r = el("div"); fbz.appendChild(r); result(r, q, `${late ? "Vous l’avez trouvée tard : chaque minute compte quand un jeune vient vous parler." : `Trouvée en ${sc.timer - left} s.`} ${esc(x.fb)}`); o.remove(); Voice.say("narr", x.fb); });
        o.appendChild(bb);
      });
      fbz.appendChild(o);
      setTimeout(() => fbz.scrollIntoView({ behavior: "smooth", block: "nearest" }), 200);
    }
    wrap.append(box, fbz); n.appendChild(wrap);
    autoGate(wrap.querySelector(".maphead"), () => { tId = setInterval(tick, 1000); });
    pannable(box, map);
    requestAnimationFrame(() => { if (box.scrollWidth > box.clientWidth) box.scrollLeft = (box.scrollWidth - box.clientWidth) / 2; });
  };

  /* ---------- « Les minutes comptent » (Lou) : avant 17 h, choisir ce qu'on fait vraiment ----------
     Une horloge de 16 h 06 à 17 h ; au bout de la route, la voiture de l'adulte désigné approche.
     Chaque action prend du temps. Celles qui protègent s'engagent ; celles qui exposent Lou ont un effet immédiat. */
  R.minutes = (sc, n) => {
    const T0 = 6, T1 = 60;   // minutes après 16 h
    let t = T0, done = new Set(), bad = new Set(), over = false;
    const fmt = (m) => `16 h ${String(m).padStart(2, "0")}`;
    const panel = el("div", { class: "panel mn" });
    panel.innerHTML = `${kicker(sc.kicker)}<h2 id="h-${sc.id}">${esc(sc.title || "Les minutes comptent")}</h2><p class="lead">${esc(sc.prompt)}</p>
      <div class="mn-road" aria-hidden="true"><i class="mn-lou">${face("lou")}</i><b class="mn-gate">Portail</b><span class="mn-track"><i class="mn-car"></i></span></div>
      <div class="mn-clock" role="timer" aria-live="polite"><b>${fmt(t)}</b><small>l’adulte désigné arrive à 17 h</small></div>
      <div class="mn-cards"></div><p class="mn-log" aria-live="polite"></p>`;
    const cards = panel.querySelector(".mn-cards"), log = panel.querySelector(".mn-log"), clock = panel.querySelector(".mn-clock b"), car = panel.querySelector(".mn-car");
    const fbz = el("div", { class: "fbzone", "aria-live": "polite" });
    const seed = [...sc.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7);
    const now = sc.items.filter((x) => x.cat !== "dur");
    now.map((x, k) => k).sort((a, b) => ((a * 29 + seed) % 13) - ((b * 29 + seed) % 13)).forEach((k) => {
      const it = now[k], b = el("button", { class: "mn-card", type: "button" }, `<b>${esc(it.t.replace(/^A\d+ · /, ""))}</b><small>${it.min} min</small>`);
      b.addEventListener("click", () => act(it, b)); cards.appendChild(b);
    });
    function tick() {
      clock.textContent = fmt(Math.min(t, T1));
      car.style.setProperty("--p", Math.min(1, (t - T0) / (T1 - T0)).toFixed(3));
      panel.classList.toggle("hurry", t >= 45);
    }
    function act(it, b) {
      if (over || b.disabled) return;
      b.disabled = true; t += it.min; Snd.click();
      if (it.cat === "eng") { done.add(it); b.classList.add("ok"); log.textContent = `${fmt(Math.min(t, T1))} · ${it.now || it.why}`; }
      else { bad.add(it); b.classList.add("ko"); t += it.cost || 0; log.textContent = `${fmt(Math.min(t, T1))} · ${it.effect || it.why}`; Snd.low(); }
      tick();
      const left = now.filter((x) => x.cat === "eng" && !done.has(x));
      if (t >= T1 || !left.length) finish();
    }
    function finish() {
      if (over) return; over = true;
      cards.querySelectorAll("button").forEach((x) => (x.disabled = true));
      const eng = now.filter((x) => x.cat === "eng"), got = eng.filter((x) => done.has(x)).length;
      const late = t > T1;
      // et après ? ce qui se fait dans la durée
      const dur = sc.items.find((x) => x.cat === "dur");
      const q0 = Math.max(0, (got - bad.size * .6) / eng.length) * (late ? .8 : 1);
      const ask = el("div", { class: "mn-after" }, `<p class="kicker">${late ? "17 h : la voiture est là." : `${fmt(t)} : Lou est protégé.`} Les gendarmes arrivent. Et ensuite ?</p>`);
      const o = el("div", { class: "opts" });
      [[dur.t.replace(/^A\d+ · /, ""), 1], ["Plus rien : l’alerte est donnée, la suite ne nous regarde plus.", 0]].forEach(([tx, v], i) => {
        const b = el("button", { class: "opt", type: "button", style: `--k:${i}` }, `<span class="ol">${"AB"[i]}</span><span>${esc(tx)}</span>`);
        b.addEventListener("click", () => {
          o.querySelectorAll("button").forEach((x) => (x.disabled = true)); b.classList.add("picked", "neutral");
          const q = Math.round(Math.min(1, q0 * .85 + v * .15) * 100) / 100;
          record(sc, q);
          const missed = eng.filter((x) => !done.has(x)).map((x) => x.t.replace(/^A\d+ · /, ""));
          result(fbz, q, `${got} action${got > 1 ? "s" : ""} protectrice${got > 1 ? "s" : ""} sur ${eng.length} avant 17 h${bad.size ? `, ${bad.size} qui exposai${bad.size > 1 ? "ent" : "t"} Lou` : ""}.`
            + (missed.length ? ` Il manquait : ${esc(missed.join(", "))}.` : "") + ` ${esc(dur.why)}`);
        });
        o.appendChild(b);
      });
      ask.appendChild(o); panel.insertBefore(ask, fbz);
    }
    panel.appendChild(fbz); n.appendChild(panel); tick();
  };

  /* ======================= Promenade libre, dans le plan vivant =======================
     On avance pas à pas sur les chemins (on touche le sol près de son personnage), on entre par les portes,
     on tombe sur des scènes en direct, on réagit, on repart. Autour, l'accueil vit : des enfants courent,
     des animateurs encadrent, des parents passent. */
  const toMin = (t) => { const m = /(\d+) ?h ?(\d+)?/.exec(t || ""); return m ? +m[1] * 60 + +(m[2] || 0) : 0; };
  const fmtMin = (m) => `${Math.floor(m / 60)} h ${String(Math.round(m) % 60).padStart(2, "0")}`;
  const PLACE = { jeux: "L’aire de jeux", radio: "L’atelier radio", sanitaires: "Les sanitaires", potager: "Le potager", parc: "Le parc", refectoire: "La restauration", equipe: "La salle des animateurs", cour: "La cour", direction: "Le bureau de la direction", soins: "L’infirmerie", local: "La régie", libre: "La salle d’activités", petits: "La salle des petits", grands: "La salle des grands", panneau: "Le panneau d’affichage", cuisine: "La cuisine pédagogique", preau: "Le préau", main: "Le bâtiment principal" };

  /* ---- les chemins praticables (au sol, en mètres) ---- */
  const NODES = {
    f3: [3.2, 21], f6: [6, 21], f9: [9.2, 21], f13: [13.4, 21], f15: [15, 21.6], f17: [17, 21], f19: [19.5, 21], f21: [21.5, 21], f24: [23.8, 21], f26: [26.2, 21.2], f28: [28.4, 21.2],
    dMain: [15.3, 19.2], dm0: [15.3, 20.4], dCuis: [23.8, 19.1],   // on entre bien en face de la porte vitrée, entre les deux jardinières
    j1: [9.2, 23.0], j2: [9.4, 25.0], j3: [6.6, 22.6], m1: [15.1, 22.8], pot: [15.2, 27.6],
    p1: [18.4, 24.5], q1: [22.3, 23.2], q2: [25.6, 24.1], pan: [24.0, 26.7], gate: [29.0, 23.4],   // le portail : on ne sort pas du centre (le parking est réservé aux familles)
    e1: [28.4, 15.5], dSoins: [27.2, 15.5], e2: [28.4, 9.8],
    b1: [26.4, 9.8], b2: [22.6, 9.8], b3: [18.2, 9.8], b4: [14.2, 9.8], b5: [10, 9.8], b6: [5.8, 9.8],
    dLib: [26.4, 8.5], dRad: [22.6, 8.5], dSan: [5.8, 8.8], parc: [14.2, 7.4],
    l1: [30.2, 7.5], dLoc: [33.3, 7.0], e3: [28.4, 16.5], r1: [31.0, 16.5], r2: [34.95, 16.5], dRef: [34.95, 15.6],
  };
  const EDGES = [["f3", "f6"], ["f6", "f9"], ["f9", "f13"], ["f13", "f15"], ["f15", "f17"], ["f17", "f19"], ["f19", "f21"], ["f21", "f24"], ["f24", "f26"], ["f26", "f28"],
    ["f13", "dm0"], ["f15", "dm0"], ["dm0", "dMain"], ["f24", "dCuis"], ["f9", "j1"], ["j1", "j2"], ["j1", "j3"], ["f6", "j3"], ["f15", "m1"], ["m1", "j1"], ["m1", "pot"], ["m1", "p1"], ["p1", "f19"], ["p1", "q1"],
    ["f21", "q1"], ["q1", "q2"], ["f26", "q2"], ["q2", "pan"], ["q2", "gate"], ["f28", "gate"], ["p1", "pan"],
    ["f28", "e3"], ["e3", "e1"], ["e1", "dSoins"], ["e1", "e2"], ["e2", "b1"], ["b1", "b2"], ["b2", "b3"], ["b3", "b4"], ["b4", "b5"], ["b5", "b6"],
    ["b1", "dLib"], ["b2", "dRad"], ["b6", "dSan"], ["b4", "parc"], ["b3", "parc"], ["e2", "l1"], ["l1", "dLoc"], ["e3", "r1"], ["r1", "r2"], ["r2", "dRef"]];
  // portes : on entre dans le bâtiment (la salle s'ouvre) ; lieux de plein air : on y passe
  const DOORS = { dMain: "main", dCuis: "cuisine", dSoins: "soins", dLib: "libre", dRad: "radio", dSan: "sanitaires", dLoc: "local", dRef: "refectoire" };
  const SPOTS = { jeux: [9.4, 24.6], potager: [15.4, 27.4], parc: [14.2, 7.6], cour: [26.6, 23.4], panneau: [24.0, 26.6], preau: [14.9, 24.1] };
  const MAIN_ROOMS = ["petits", "grands", "direction", "equipe"];
  const ADJ = {}; EDGES.forEach(([a, b]) => { (ADJ[a] = ADJ[a] || []).push(b); (ADJ[b] = ADJ[b] || []).push(a); });
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  // le point des chemins le plus proche de (x, y)
  function onGraph(x, y) {
    let best = null;
    EDGES.forEach(([a, b]) => {
      const A0 = NODES[a], B0 = NODES[b], dx = B0[0] - A0[0], dy = B0[1] - A0[1], L2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - A0[0]) * dx + (y - A0[1]) * dy) / L2)), p = [A0[0] + dx * t, A0[1] + dy * t], d = Math.hypot(p[0] - x, p[1] - y);
      if (!best || d < best.d) best = { a, b, t, p, d };
    });
    return best;
  }
  // chemin le plus court entre deux points posés sur les chemins (Dijkstra, avec deux nœuds provisoires)
  function route(from, to) {
    const N = { ...NODES, _s: from.p, _t: to.p }, adj = {};
    Object.keys(ADJ).forEach((k) => (adj[k] = ADJ[k].slice()));
    const link = (k, e) => { adj[k] = (adj[k] || []).concat([e.a, e.b]); adj[e.a] = adj[e.a].concat(k); adj[e.b] = adj[e.b].concat(k); };
    link("_s", from); link("_t", to);
    if ((from.a === to.a && from.b === to.b) || (from.a === to.b && from.b === to.a)) { adj._s.push("_t"); adj._t.push("_s"); }
    const D = { _s: 0 }, P = {}, Q = new Set(Object.keys(N));
    while (Q.size) {
      let u = null; Q.forEach((k) => { if (D[k] != null && (u == null || D[k] < D[u])) u = k; });
      if (u == null || u === "_t") break; Q.delete(u);
      (adj[u] || []).forEach((v) => { if (!Q.has(v)) return; const nd = D[u] + dist(N[u], N[v]); if (D[v] == null || nd < D[v]) { D[v] = nd; P[v] = u; } });
    }
    if (D._t == null) return null;
    const out = []; let k = "_t"; while (k) { out.unshift([N[k][0], N[k][1], k]); k = P[k]; }
    // un nœud provisoire posé exactement sur une porte prend son nom (on entre par cette porte)
    out.forEach((q) => { if (q[2] === "_t") { const d = Object.keys(DOORS).find((dk) => dist(NODES[dk], q) < .05); if (d) q[2] = d; } });
    return out;
  }
  // on raccourcit le trajet à « max » mètres : on avance pas à pas
  function clampPath(pts, max) {
    const out = [pts[0]]; let left = max;
    for (let i = 1; i < pts.length; i++) {
      const d = dist(pts[i - 1], pts[i]);
      if (d <= left) { out.push(pts[i]); left -= d; continue; }
      const t = left / d; out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, null]); break;
    }
    return out;
  }

  // fondu au noir bref : on passe d'un lieu à l'autre (dehors → salle, salle → dehors)
  function blackout(fn) {
    if (reduce() || st.settings.calm) return fn();
    const b = el("div", { class: "roomfade", "aria-hidden": "true" }); document.body.appendChild(b);
    requestAnimationFrame(() => b.classList.add("on"));
    setTimeout(() => { try { fn(); } finally { setTimeout(() => { b.classList.remove("on"); setTimeout(() => b.remove(), 420); }, 260); } }, 230);
  }

  /* ---- figurants : enfants et adultes de l'accueil (personnages articulés générés) ---- */
  const FIGS = {
    k1: { age: 8, sex: "m", skin: "doree", hair: "brun", hairStyle: "short", top: "#E2702A", bottom: "#3D5A80" },
    k2: { age: 9, sex: "f", skin: "brune", hair: "noir", hairStyle: "pigtails", top: "#2E9C8A", bottom: "#33405C" },
    k3: { age: 7, sex: "m", skin: "claire", hair: "blond", hairStyle: "curly", top: "#D94F70", bottom: "#40506A" },
    k4: { age: 10, sex: "f", skin: "olive", hair: "chatain", hairStyle: "ponytail", top: "#F2B33D", bottom: "#4E6A8E" },
    k5: { age: 11, sex: "m", skin: "ebene", hair: "noir", hairStyle: "buzz", top: "#4F79C2", bottom: "#2F4058" },
    k6: { age: 6, sex: "f", skin: "rosee", hair: "roux", hairStyle: "bob", top: "#8A6BC4", bottom: "#45506A", skirt: "#8A6BC4" },
    k7: { age: 8, sex: "m", skin: "brune", hair: "noir", hairStyle: "curly", top: "#4FA3D9", bottom: "#3B4A63" },
    k8: { age: 7, sex: "f", skin: "claire", hair: "chatain", hairStyle: "braids", top: "#E85D75", bottom: "#4A5675", skirt: "#E85D75" },
    t3: { age: 14, sex: "m", skin: "olive", hair: "brun", hairStyle: "spiky", top: "#6B4FA0", bottom: "#2E3A4E" },
    t4: { age: 15, sex: "m", skin: "claire", hair: "blond", hairStyle: "short", top: "#D9822B", bottom: "#33405C" },
    k9: { age: 10, sex: "f", skin: "ebene", hair: "noir", hairStyle: "afro", top: "#F2C94C", bottom: "#3B4A63" },
    t5: { age: 13, sex: "f", skin: "doree", hair: "chatain", hairStyle: "wavy", top: "#5B8DEF", bottom: "#2E3A4E" },
    t1: { age: 15, sex: "f", skin: "mate", hair: "noir", hairStyle: "long", top: "#3B3F48", bottom: "#2E3A4E" },
    t2: { age: 16, sex: "m", skin: "doree", hair: "brun", hairStyle: "spiky", top: "#1F8A5B", bottom: "#33405C" },
    pa1: { age: 42, sex: "f", skin: "claire", hair: "chatain", hairStyle: "bob", top: "#C2412A", bottom: "#2E3A4E" },
    pa2: { age: 38, sex: "m", skin: "brune", hair: "noir", hairStyle: "short", top: "#4B6F8E", bottom: "#2F3540" },
    pa3: { age: 45, sex: "f", skin: "doree", hair: "noir", hairStyle: "bun", top: "#2E9C8A", bottom: "#33405C", glasses: "#3B3B3B" },
    pa4: { age: 50, sex: "m", skin: "claire", hair: "poivre", hairStyle: "short", top: "#7A5234", bottom: "#2F3540" },
    pa5: { age: 34, sex: "f", skin: "brune", hair: "noir", hairStyle: "braids", top: "#8E5AA8", bottom: "#2F3540" },
    pa6: { age: 61, sex: "m", skin: "olive", hair: "poivre", hairStyle: "buzz", top: "#5E7D4E", bottom: "#33405C", glasses: "#3B3B3B" },
    // animateurs des autres groupes : pour que les salles vivent pendant les temps libres
    yanis: { age: 23, sex: "m", skin: "mate", hair: "noir", hairStyle: "curly", top: "#2E9C8A", bottom: "#33405C", badge: true },
    lea: { age: 25, sex: "f", skin: "claire", hair: "blond", hairStyle: "ponytail", top: "#C2412A", bottom: "#2E3A4E", badge: true },
  };
  Object.entries(FIGS).forEach(([k, v]) => (RSPEC[k] = { ...v, skin: RIG.SKIN[v.skin] || v.skin, sleeves: v.age < 12 ? "short" : "long" }));

  /* ---- marcheurs : un personnage qui se déplace au sol (vous, les figurants, les personnes d'une scène) ---- */
  const SZ = () => (44 / A.dio.vbw) * 100 * .77;
  function Walker(who, x, y, pose = "stand", opts = {}) {
    const a = World.actor(who, pose, w2f(x, y), SZ(), false, null, opts);
    a.classList.add("walker");
    const W = { who, el: a, x, y, pose, back: !!opts.back, path: null, speed: 1.6, onDone: null }; a._w = W;
    W.place = () => { const f = w2f(W.x, W.y); a.style.left = f[0] + "%"; a.style.top = f[1] + "%"; a.style.zIndex = W.zb != null ? W.zb : zOf(W.x, W.y) + 1; };
    W.set = (px, py) => { W.x = px; W.y = py; W.place(); };
    W.setPose = (ps) => { if (W.pose === ps) return; W.pose = ps; a._pose(ps); };
    W.face = (tx) => { const s0 = w2f(W.x, W.y)[0], s1 = w2f(tx[0], tx[1])[0]; if (Math.abs(s1 - s0) > .05) a.classList.toggle("flip", s1 < s0); };
    W.go = (pts, speed, onDone, pose) => { W.path = pts.slice(); W.speed = speed || 1.6; W.onDone = onDone || null; W.setPose(pose || (W.speed > 2.4 ? "run" : "walk")); Life.wake(); };
    W.stop = () => { W.path = null; W.setPose("stand"); };
    W.setBack = (b) => {
      if (W.back === !!b) return; W.back = !!b;
      const svg = a.querySelector(":scope > svg"), R0 = rigMini(who, W.pose, { back: W.back }); if (svg && R0) svg.innerHTML = R0;
      a.classList.toggle("isback", W.back);
    };
    W.place();
    return W;
  }
  const Life = {
    walkers: [], raf: 0, last: 0, agents: [],
    add(w) { this.walkers.push(w); return w; },
    clear() { this.walkers = []; this.agents.forEach((g) => { clearTimeout(g.t); if (g.clear) g.clear(); }); this.agents = []; cancelAnimationFrame(this.raf); this.raf = 0; },
    wake() { if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame((t) => this.tick(t)); } },
    tick(now) {
      const dt = Math.min(.25, (now - this.last) / 1000); this.last = now; let moving = false;   // appareil lent : on rattrape le temps perdu
      this.walkers.forEach((W) => {
        if (!W.path) return;
        moving = true;
        let step = W.speed * dt * (calm() ? 40 : 1);
        while (step > 0 && W.path.length) {
          const t = W.path[0], d = dist([W.x, W.y], t);
          if (d <= step) { W.x = t[0]; W.y = t[1]; W.path.shift(); step -= d; if (W.onMove) W.onMove(d); }
          else { W.face(t); W.x += (t[0] - W.x) / d * step; W.y += (t[1] - W.y) / d * step; if (W.onMove) W.onMove(step); step = 0; }
          if (W.onStep && W.path && W.onStep()) break;
        }
        if (!W.path) return;
        W.place();
        if (!W.path.length) { W.path = null; W.setPose("stand"); const f = W.onDone; W.onDone = null; if (f) f(); }
      });
      if (moving) this.raf = requestAnimationFrame((t) => this.tick(t)); else this.raf = 0;
    },
    // un figurant qui va et vient sur un parcours, avec des pauses et des gestes
    loop(who, pts, opts = {}) {
      const W = this.add(Walker(who, pts[0][0], pts[0][1], "stand"));
      const g = { t: 0 }; this.agents.push(g); let i = 0;
      // chacun son couloir : un léger décalage propre à chaque figurant, pour qu'ils ne se rentrent pas dedans
      const off = ((this.walkers.length * 37) % 7 - 3) * .14;
      const next = () => {
        if (!this.walkers.includes(W)) return;
        i = (i + 1) % pts.length;
        // les longs trajets passent par les chemins (jamais à travers un mur ou le décor)
        let path = [pts[i]];
        if (dist([W.x, W.y], pts[i]) > 4) { const r = route(onGraph(W.x, W.y), onGraph(pts[i][0], pts[i][1])); if (r && r.length > 2) path = r.slice(1, -1).map((q) => [q[0] + off, q[1] - off * .6]).concat([pts[i]]); }
        W.go(path, (opts.speed || 1.3) * (.9 + ((this.walkers.length * 13) % 5) * .05), () => { if (opts.gest && Math.random() < .6) gesture(W.el, opts.gest[Math.floor(Math.random() * opts.gest.length)]); g.t = setTimeout(next, (opts.pause || 1200) * (.5 + Math.random())); }, opts.pose);
      };
      g.t = setTimeout(next, Math.random() * 1500);
      return W;
    },
    // une personne sur place (elle discute, joue, attend) : un geste de temps en temps
    idle(who, x, y, gests, opts = {}) {
      const W = this.add(Walker(who, x, y, opts.pose || "stand", { back: opts.back }));
      if (opts.face) W.face(opts.face);
      const g = { t: 0 }; this.agents.push(g);
      const tick = () => { if (!this.walkers.includes(W)) return; gesture(W.el, gests[Math.floor(Math.random() * gests.length)]); g.t = setTimeout(tick, 2800 + Math.random() * 3200); };
      g.t = setTimeout(tick, 600 + Math.random() * 2400);
      return W;
    },
  };

  R.roam = (sc, n) => {
    st.roam = st.roam || {};
    const S = st.roam[sc.id] = st.roam[sc.id] || { t: toMin(sc.start), x: null, y: null, done: {}, nudged: {}, guided: !sc.guided, seen: {} };
    S.seen = S.seen || {};
    const END = toMin(sc.end), MAX = innerWidth < 760 ? 7 : 8.5, PER_M = .5;   // au plus 8 m par pas ; une minute pour deux mètres
    if (S.x == null) [S.x, S.y] = NODES[sc.startNode || "q2"];   // on démarre dans la cour, juste derrière le portail
    n.dataset.novoice = "1";
    const evLive = (e) => !S.done[e.id] && S.t >= toMin(e.from) - 5 && S.t <= toMin(e.to);
    const mustLeft = () => sc.events.filter((e) => e.must && !S.done[e.id]);
    const guideOnly = () => !S.guided && !!sc.guided;
    const wide = () => innerWidth >= 761;
    let you = null, busy = false, moving = false, sceneLock = false, card = null, ring = null, mark = null;

    /* -- le plan vivant -- */
    function free(first) {
      Life.clear(); busy = false; moving = false; sceneLock = false;
      Snd.setMood(sc.ch);
      document.body.classList.remove("scene"); document.body.classList.add("roaming");
      World.show({ at: "ensemble", cast: [], free: true }, { id: sc.id, type: "roam", ch: sc.ch, kicker: fmtMin(S.t) });
      dayclock({ type: "roam", ch: sc.ch, kicker: `${CHAPTERS[sc.ch - 1].day}, ${fmtMin(S.t)}` });
      const acts = World.cam.querySelector(".wacts"); acts.innerHTML = "";
      you = Life.add(Walker("you", S.x, S.y, "stand"));
      acts.appendChild(you.el);
      you.onMove = (d) => { S.t += d * PER_M; };
      you.onStep = () => checkSpots();
      // l'accueil vit autour de vous
      (sc.life || []).forEach((L) => {
        if ((L.from && S.t < toMin(L.from)) || (L.to && S.t > toMin(L.to))) return;
        if (L.after && !S.done[L.after]) return; if (L.before && S.done[L.before]) return;
        const W = L.loop ? Life.loop(L.who, L.loop, L) : Life.idle(L.who, L.at[0], L.at[1], L.gest || LISTEN, L);
        acts.appendChild(W.el);
      });
      // les scènes en cours se voient de loin : les personnes sont là, elles bougent
      sc.events.filter((e) => !e.room && evLive(e) && !(guideOnly() && e.id !== sc.guided)).forEach((e) => {
        (e.spots || []).forEach(([w, x, y, pose, gests]) => {
          const W = Life.idle(w, x, y, gests || ["point", "fist", "stomp"], { pose, face: SPOTS[e.at] });
          W.ev = e.id; acts.appendChild(W.el);
        });
      });
      // la portée d'un pas : un anneau discret autour de vous
      ring = el("i", { class: "rm-ring" }); mark = el("i", { class: "rm-mark" }); acts.append(ring, mark);
      placeRing();
      follow(first ? 1800 : 1300);
      drawCard(first);
      Life.wake();
      // les voix des scènes encore à vivre sont préparées à l'avance (générées sur le serveur si besoin)
      sc.events.filter((e) => !S.done[e.id]).forEach((e) => Voice.prefetch((e.lines || e.beats.map(([w, t]) => [w, t])).concat((e.opts || []).filter((o) => o.reply).map((o) => o.reply), e.replies || [])));
    }
    const camZ = () => (wide() ? 1.6 : 1.45);
    // cadre la caméra pour que le point (x, y) du sol apparaisse à (sx, sy) de l'écran (fractions de la fenêtre)
    function aim(x, y, z, sx, sy, ms) {
      // point focal de la caméra : la valeur visée (--fx/--fy), pas celle en cours de transition
      const cs = getComputedStyle(World.cam), px = (v, D, L) => { v = (v || "").trim(); return !v ? D : v.endsWith("%") ? parseFloat(v) / 100 * L : v.endsWith("vh") ? parseFloat(v) / 100 * innerHeight : v.endsWith("vw") ? parseFloat(v) / 100 * innerWidth : parseFloat(v); };
      const f = w2f(x, y), Fx = px(cs.getPropertyValue("--fx"), innerWidth / 2, innerWidth), Fy = px(cs.getPropertyValue("--fy"), innerHeight * .52, innerHeight), cw = World.cam.offsetWidth * z, ch = World.cam.offsetHeight * z;
      World.camTo({ x: f[0] / 100 - (sx * innerWidth - Fx) / cw, y: f[1] / 100 - (sy * innerHeight - Fy) / ch }, z, ms);
    }
    // la carte flottante occupe la gauche (ordinateur) ou le bas (téléphone) : votre personnage reste visible à côté
    function follow(ms) { aim(you.x, you.y, camZ(), wide() ? .6 : .5, wide() ? .55 : .36, ms); }
    function placeRing() {
      const f = w2f(you.x, you.y), rx = MAX * PJ[2] * 1.41 / PJ[6] * 100, ry = MAX * PJ[3] * 1.41 / PJ[7] * 100;
      Object.assign(ring.style, { left: f[0] + "%", top: f[1] + "%", width: rx * 2 + "%", height: ry * 2 + "%" });
    }

    /* -- la carte : heure, consigne, fin d'après-midi -- */
    function drawCard(first) {
      n.innerHTML = "";
      const atEnd = S.t >= END;
      const tip = atEnd && mustLeft().length ? "C’est l’heure : l’après-midi est terminé. Ce que vous n’avez pas vu, d’autres s’en sont occupés… ou pas." : guideOnly() ? "" : "Touchez le sol près de votre personnage pour avancer sur les chemins. Pour entrer quelque part, allez jusqu’à la porte.";
      card = el("div", { class: "rm-card" }, `<div class="rm-top"><div>${kicker(`${CHAPTERS[sc.ch - 1].day} · ${sc.kicker.split("·").pop().trim()}`)}<h2 id="h-${sc.id}">${esc(sc.title)}</h2></div>
        <div class="rm-clock" aria-live="polite"><b>${fmtMin(Math.min(S.t, END))}</b><small>jusqu’à ${esc(sc.end)}</small></div></div>${tip ? `<p class="lead">${esc(tip)}</p>` : ""}`);
      const row = el("div", { class: "row rm-row" });
      const fin = btn("Finir l’après-midi", finish, "ghost"); fin.disabled = !!mustLeft().length && !atEnd;
      row.appendChild(fin); card.appendChild(row);
      n.appendChild(card);
      if (first && guideOnly() && sc.guide) { coach(sc.guide[1], card); card.classList.add("coached"); setTimeout(() => Voice.seq([["narr", sc.intro], sc.guide]), 600); }
      else if (first) setTimeout(() => Voice.say("narr", sc.intro), 600);
      sc.events.forEach((e) => { if (e.nudge && !S.done[e.id] && !S.nudged[e.id] && S.t >= toMin(e.nudge) && S.guided) { S.nudged[e.id] = 1; save(); toastMsg(`SMS de ${NAMES[e.nudgeLine[0]]} : ${e.nudgeLine[1]}`); Voice.say(e.nudgeLine[0], e.nudgeLine[1]); } });
      if (atEnd) { busy = true; setTimeout(finish, mustLeft().length ? 2600 : 900); }   // l'heure est passée : la suite arrive d'elle-même
    }
    const tickClock = () => { const b = card && card.querySelector(".rm-clock b"); if (b) b.textContent = fmtMin(Math.min(S.t, END)); };

    /* -- se déplacer : on touche le sol près de soi -- */
    function onTap(e) {
      if ((busy && !moving) || !document.body.classList.contains("roaming") || e.button > 0) return;   // en marchant, on peut recliquer plus loin
      if (World._drag) return;
      const r = World.cam.getBoundingClientRect(); if (!r.width) return;
      const fx = (e.clientX - r.left) / r.width * 100, fy = (e.clientY - r.top) / r.height * 100, [wx, wy] = f2w(fx, fy);
      walkTo(wx, wy);
    }
    function walkTo(wx, wy) {
      const tgt = onGraph(wx, wy);
      if (!tgt || tgt.d > 3.2) { nudgeRing(); return false; }   // hors des chemins
      const here = onGraph(you.x, you.y), full = route(here, tgt); if (!full) return false;
      full[0] = [you.x, you.y, null];
      // une porte juste au-delà de la portée : on va jusqu'à elle (on ne s'arrête pas à un mètre du seuil)
      const fe = full[full.length - 1], tot = full.reduce((t, q, i) => (i ? t + dist(full[i - 1], q) : 0), 0);
      const pts = fe[2] && DOORS[fe[2]] && tot <= MAX + 1.5 ? full : clampPath(full, MAX), end = pts[pts.length - 1], doorK = end[2] && DOORS[end[2]] ? end[2] : null;
      const fm = w2f(end[0], end[1]); Object.assign(mark.style, { left: fm[0] + "%", top: fm[1] + "%" }); mark.classList.remove("on"); void mark.offsetWidth; mark.classList.add("on");
      ring.classList.add("moving"); busy = true; moving = true;
      you.onDone = null;   // nouveau clic pendant la marche : on enchaîne depuis là où l’on est, sans s’arrêter
      you.go(pts.slice(1), 1.7, () => {
        busy = false; moving = false; ring.classList.remove("moving"); S.x = you.x; S.y = you.y; save(); placeRing(); tickClock(); follow(700);
        dayclock({ type: "roam", ch: sc.ch, kicker: `${CHAPTERS[sc.ch - 1].day}, ${fmtMin(S.t)}` });
        if (doorK) enter(DOORS[doorK]); else { arriveSpot(); if (S.t >= END) drawCard(); }
      });
      const cam = () => { if (!you.path || !document.body.classList.contains("roaming")) return; follow(0); requestAnimationFrame(cam); }; requestAnimationFrame(cam);
      return true;
    }
    function nudgeRing() { ring.classList.remove("nope"); void ring.offsetWidth; ring.classList.add("nope"); }
    // en chemin, on tombe sur une scène : on s'arrête
    function checkSpots() {
      const ev = sc.events.find((e) => !e.room && evLive(e) && !(guideOnly() && e.id !== sc.guided) && dist([you.x, you.y], SPOTS[e.at]) < (e.r || 3.6));
      if (!ev || sceneLock) return !!ev;
      sceneLock = true; busy = true;   // une seule fois : la scène ne peut pas se lancer deux fois (sinon les répliques se répètent)
      you.stop(); you.onDone = null; moving = false; ring.classList.remove("moving"); S.x = you.x; S.y = you.y; save();
      setTimeout(() => scene(ev), 200); return true;
    }
    // un lieu de plein air calme : on regarde, une bulle raconte, on continue
    function arriveSpot() {
      const k = Object.keys(SPOTS).find((s) => dist([you.x, you.y], SPOTS[s]) < 2.6), slot = k + Math.floor(S.t / 45);
      if (!k || S.seen[slot]) return;
      const C = (sc.calm || {})[k]; if (!C) return;
      S.seen[slot] = 1;
      const b = el("div", { class: "rm-bub" }, `${kicker(`${fmtMin(S.t)} · ${PLACE[k] || ""}`)}<p>${words(C.t)}</p>`);
      n.appendChild(b); requestAnimationFrame(() => b.classList.add("on"));
      Voice.say("narr", C.t, b.querySelector("p"));
      setTimeout(() => { b.classList.remove("on"); setTimeout(() => b.remove(), 500); }, 7000);
    }

    /* -- entrer : on disparaît par la porte, puis on plonge dans la salle -- */
    // la caméra s'approche de la porte, l'écran passe au noir un instant, et l'on se retrouve dans la salle seule
    function enter(key) {
      busy = true;
      const go = () => {
        if (key === "main") return hall();
        const ev = sc.events.find((e) => e.room === key && evLive(e) && (S.guided || e.id === sc.guided));
        if (ev) scene(ev); else calm(key);
      };
      if (reduce() || st.settings.calm) { you.el.classList.add("indoor"); return go(); }
      aim(you.x, you.y, Math.min(5.2, camZ() * 1.8), .5, .5, 700);
      setTimeout(() => you.el.classList.add("indoor"), 300);
      setTimeout(() => blackout(go), 560);
    }
    // le couloir du bâtiment principal : on choisit la salle
    function hall() {
      document.body.classList.remove("roaming"); Life.clear();
      World.show({ at: "direction", cast: [], z: 2.9 }, { id: sc.id, type: "roam", ch: sc.ch, kicker: fmtMin(S.t) });
      n.innerHTML = "";
      const wrap = el("div", { class: "duo roamscene calm" }), p = el("div", { class: "panel" }, `${kicker(`${fmtMin(S.t)} · Le bâtiment principal`)}<h2>Le couloir</h2><p class="narr">Le couloir dessert les salles du bâtiment. Où allez-vous ?</p>`);
      const g = el("div", { class: "opts" });
      MAIN_ROOMS.forEach((k, i) => { const b = el("button", { class: "opt", type: "button", style: `--k:${i}` }, `<span class="ol">${String.fromCharCode(65 + i)}</span><span>${esc(PLACE[k])}</span>`); b.addEventListener("click", () => blackout(() => { S.t += 2; const ev = sc.events.find((e) => e.room === k && evLive(e) && (S.guided || e.id === sc.guided)); if (ev) scene(ev); else calm(k); })); g.appendChild(b); });
      // le couloir, vu de dessus : les portes des salles de part et d'autre, l'entrée vitrée au bout
      const plan = el("div", { class: "hall-plan", "aria-hidden": "true" });
      const D = MAIN_ROOMS.map((k, i) => { const top = i % 2 === 0, x = 60 + Math.floor(i / 2) * 150; return `<g class="hp-door" data-i="${i}" transform="translate(${x},${top ? 22 : 118})"><rect x="-58" y="${top ? -16 : 0}" width="116" height="16" rx="4" class="hp-room"/><rect x="-16" y="${top ? -3 : 0}" width="32" height="5" rx="2" class="hp-gap"/><text x="0" y="${top ? -24 : 34}">${esc(PLACE[k])}</text></g>`; }).join("");
      plan.innerHTML = `<svg viewBox="0 -20 380 190"><rect x="6" y="30" width="368" height="80" rx="14" class="hp-floor"/><path d="M14 70 H366" class="hp-line"/>${D}<g transform="translate(366,70)"><rect x="-6" y="-22" width="10" height="44" rx="3" class="hp-entry"/><text x="-14" y="-30" class="hp-small">Entrée</text></g><g class="hp-you" transform="translate(330,70)"><circle r="9"/><text y="26" class="hp-small">Vous</text></g></svg>`;
      plan.querySelectorAll(".hp-door").forEach((d) => d.addEventListener("click", () => { const b = g.querySelectorAll(".opt")[+d.dataset.i]; if (b) b.click(); }));
      const row = el("div", { class: "row" }); row.appendChild(btn("Ressortir", () => { Snd.click(); outside(); }, "ghost"));
      p.append(plan, g, row); wrap.appendChild(p); n.appendChild(wrap);
    }
    function outside() { blackout(() => free()); }

    /* -- une scène sur laquelle on tombe : on voit, on entend, on réagit -- */
    function scene(ev) {
      if (n._scene === ev.id && n.querySelector(".roamscene")) return;   // déjà en cours
      n._scene = ev.id;
      const E = tune(SCREENS.find((x) => x.id === ev.id));   // niveau Moyen et plus : réponses plus nuancées
      document.body.classList.remove("roaming");
      n.innerHTML = "";
      busy = true; if (you) you.onStep = null;   // on ne retombe pas sur la scène en s'en approchant
      Snd.setMood(ev.tense ? "stress" : "grave");   // la musique se tend pendant la scène
      if (ev.room) {
        Life.clear();
        STAGE["roam-" + ev.id] = { at: ev.at, room: ev.room, cast: ev.cast, z: 3.1 };
        World.stage({ id: "roam-" + ev.id, type: "story", ch: sc.ch, kicker: fmtMin(S.t) });
      } else {
        // dehors : on reste dans le plan vivant ; vous vous placez face à la personne qui parle, de dos
        const sp = Life.walkers.filter((W) => W.ev === ev.id), first = sp[0];
        Life.agents.forEach((g) => clearTimeout(g.t));   // les gestes au hasard s'arrêtent : la scène commence
        if (first) {
          const tx = first.x + .7, ty = first.y + 1.15;
          you.go([[tx, ty]], 1.5, () => { you.setBack(true); you.face([first.x - .4, first.y]); });
          aim(first.x + .3, first.y + .5, 3.0, wide() ? .3 : .5, wide() ? .62 : .3, 1500);   // la scène à gauche, le texte à droite
          sp.forEach((W) => W.face([tx, ty]));
        }
      }
      const wrap = el("div", { class: "duo roamscene" }), panel = el("div", { class: "panel" });
      panel.innerHTML = `${kicker(`${CHAPTERS[sc.ch - 1].day}, ${fmtMin(S.t)} · ${PLACE[ev.at] || ""}`)}<h2 id="h-${sc.id}">${esc(E.title || PLACE[ev.at])}</h2>`;
      const log = el("div", { class: "dlog" }); panel.appendChild(log);
      const fbz = el("div", { class: "fbzone", "aria-live": "polite" }); let opts = null;
      if (ev.kind === "vigil") return vigil();
      if (ev.kind === "board") return board();
      const seq = [];
      ev.lines.forEach(([w, t]) => { const r = line(w, t); log.appendChild(r); seq.push([w, t, r]); });
      setTimeout(() => Voice.seq(seq), ev.room ? 1000 : 450);
      // son coupé : les personnes jouent quand même leurs répliques (gestes, visage, émotion)
      if (!(Voice.ok && Voice.ready && st.settings.voice)) { const L0 = seq.filter(([w]) => w !== "narr"); L0.forEach(([w, t], i) => setTimeout(() => n.isConnected && World.talk(w, t), (ev.room ? 2600 : 1800) + i * 3000)); setTimeout(() => World.talk(null), (ev.room ? 2600 : 1800) + L0.length * 3000); }
      const q = el("p", { class: "prompt" }, esc(E.prompt || "Que faites-vous ?")); opts = el("div", { class: "opts" });
      const seed = [...E.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7);
      E.opts.map((o, k) => k).sort((x, y) => ((x * 37 + seed) % 11) - ((y * 37 + seed) % 11)).forEach((k, pos) => {
        const o = E.opts[k], b = el("button", { class: "opt", type: "button", style: `--k:${pos}` }, `<span class="ol">${String.fromCharCode(65 + pos)}</span><span>${esc(o.t)}</span>`);
        b.addEventListener("click", () => choose(o, k, b)); opts.appendChild(b);
      });
      panel.append(q, opts, fbz); wrap.appendChild(panel); n.appendChild(wrap);
      // « J'interviens » : la scène se déroule sous vos yeux ; c'est à vous de choisir le moment d'agir
      function vigil() {
        const voiced = Voice.ok && Voice.ready && st.settings.voice;
        panel.insertBefore(el("p", { class: "narr vg-intro" }, words(ev.intro)), log);
        const go = el("button", { class: "cta vg-btn", type: "button" }, "J’interviens"); const bar = el("div", { class: "vg-bar" }, "<i></i>");
        panel.append(go, bar, fbz); wrap.appendChild(panel); n.appendChild(wrap);
        Snd.setMood("stress");
        let i = 0, level = 0, over = false, tm = 0;
        const step = () => {
          if (over || !n.isConnected) return;
          if (i >= ev.beats.length) { tm = setTimeout(() => !over && finishV(-1), 4500); return; }
          const [w, t, lv] = ev.beats[i++]; level = lv;
          const r = line(w, t); log.appendChild(r); r.scrollIntoView({ block: "nearest", behavior: "smooth" });
          if (w !== "narr") World.talk(w, t);
          if (voiced) Voice.say(w, t, r);
          bar.querySelector("i").style.width = (i / ev.beats.length * 100) + "%";
          tm = setTimeout(step, Math.max(2600, 900 + t.length * 52));
        };
        setTimeout(step, 1400);
        go.addEventListener("click", () => finishV(level));
        function finishV(lv) {
          if (over) return; over = true; clearTimeout(tm); Voice.stop(); World.talk(null); go.remove(); bar.remove();
          if (lv < 0) return choose(E.opts[2], 2, null);
          const timing = lv === 1 ? 1 : 0.5;
          const q = el("p", { class: "prompt" }, lv === 0 ? "Vous coupez le jeu tout de suite. Que dites-vous ?" : "Vous vous approchez. Que dites-vous ?"), ws = el("div", { class: "opts" });
          ev.words.forEach((W, k) => { const b = el("button", { class: "opt", type: "button", style: `--k:${k}` }, `<span class="ol">${String.fromCharCode(65 + k)}</span><span>${esc(W.t)}</span>`);
            b.addEventListener("click", () => { ws.querySelectorAll("button").forEach((x) => (x.disabled = true)); b.classList.add("picked", "neutral"); const qq = Math.min(timing, W.q); choose(E.opts[qq >= 1 ? 0 : 1], qq >= 1 ? 0 : 1, null); }); ws.appendChild(b); });
          panel.insertBefore(q, fbz); panel.insertBefore(ws, fbz);
        }
      }
      // « Le panneau » : épingler les trois bonnes affiches
      function board() {
        const voiced = Voice.ok && Voice.ready && st.settings.voice;
        ev.lines.forEach(([w, t]) => { const r = line(w, t); log.appendChild(r); if (w !== "narr") setTimeout(() => World.talk(w, t), 900); if (voiced) setTimeout(() => Voice.say(w, t, r), 900); });
        const grid = el("div", { class: "bd-grid" }), sel = new Set();
        const seed = [...ev.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7);
        ev.posters.map((p, k) => k).sort((x, y) => ((x * 29 + seed) % 13) - ((y * 29 + seed) % 13)).forEach((k) => {
          const P = ev.posters[k], c = el("button", { class: "bd-card", type: "button", "aria-pressed": "false" }, `<i class="bd-pin"></i><b>${esc(P.t)}</b><span>${esc(P.s)}</span>`);
          c.addEventListener("click", () => { if (sel.has(k)) sel.delete(k); else if (sel.size < 3) sel.add(k); else return; c.setAttribute("aria-pressed", sel.has(k)); c.classList.toggle("on", sel.has(k)); pin.disabled = sel.size !== 3; Snd.click(); });
          grid.appendChild(c);
        });
        const pin = btn("Épingler ces trois affiches", () => {
          pin.remove(); grid.querySelectorAll("button").forEach((x) => (x.disabled = true));
          const good = [...sel].filter((k) => ev.posters[k].ok).length, k = good >= 3 ? 0 : good === 2 ? 1 : 2;
          grid.classList.add("pinned"); choose(E.opts[k], k, null);
        }); pin.disabled = true;
        panel.append(el("p", { class: "prompt" }, "Choisissez trois affiches."), grid, pin, fbz); wrap.appendChild(panel); n.appendChild(wrap);
      }
      function choose(o, k, b) {
        if (opts) { opts.querySelectorAll("button").forEach((x) => (x.disabled = true)); if (b) b.classList.add("picked", "neutral"); }
        const firstTime = st.res[ev.id] == null;
        record(E, o.q);
        if (firstTime) { st.later = st.later || {}; st.later[ev.id] = { k }; }
        S.done[ev.id] = 1; S.t += 20; S.guided = true; save();
        const react = o.react || (ev.reacts && ev.reacts[k]) || {}, reply = o.reply || (ev.replies && ev.replies[k]);
        Object.entries(react).forEach(([w, p]) => document.querySelectorAll(`#world .actor[data-who="${w}"] .rig, #world .ractor[data-who="${w}"] .rig`).forEach((r) => { if (!r.classList.contains("p-sit")) r.setAttribute("class", "rig " + (RIG.POSE[p] || "p-idle")); }));
        if (reply) { const r = line(reply[0], reply[1]); log.appendChild(r); Voice.seq([[reply[0], reply[1], r]]); }
        fbz.innerHTML = "";
        const row = el("div", { class: "row" });
        if (ev.room && MAIN_ROOMS.includes(ev.room)) row.appendChild(btn("Une autre salle du bâtiment", () => { Snd.click(); Voice.stop(); hall(); }, "ghost"));
        row.appendChild(btn("Repartir", () => { Snd.click(); Voice.stop(); if (!ev.room) { S.x = you.x; S.y = you.y; } outside(); })); fbz.appendChild(row);
        Snd.click(); row.querySelector("button").focus({ preventScroll: true });
      }
    }
    // une réplique : le visage de la personne, son nom, sa phrase
    function line(w, t) {
      if (w === "narr") return el("div", { class: "line narr" }, `<p>${words(t)}</p>`);
      return el("div", { class: "line said" }, `<div class="mini rbust">${faceOf(w)}</div><div class="bub"><b>${esc(NAMES[w] || "")}</b><p>${words(t)}</p></div>`);
    }
    // une salle calme : on y entre, on regarde, on ressort
    function calm(key) {
      const C = (sc.calm || {})[key] || { cast: [["you", "a", "stand"]], t: `${PLACE[key]} : rien à signaler.` };
      const evH = sc.events.find((e) => e.room === key), txt = C.before && evH && !S.done[evH.id] && S.t < toMin(evH.from) ? C.before : C.t;
      document.body.classList.remove("roaming"); Life.clear();
      const room = C.room || (A.dio.inner && A.dio.inner[key] ? key : null);
      STAGE["roam-calm-" + key] = { at: key, room, cast: (C.cast || []).map(([w, s, p]) => [w, s, w === "you" ? "stand" : p]), z: 3 };
      World.stage({ id: "roam-calm-" + key, type: "story", ch: sc.ch, kicker: fmtMin(S.t) });
      n.innerHTML = "";
      S.t += 8; save();
      const wrap = el("div", { class: "duo roamscene calm" }), panel = el("div", { class: "panel" });
      panel.innerHTML = `${kicker(`${fmtMin(S.t)} · ${PLACE[key] || ""}`)}<p class="narr">${words(txt)}</p>`;
      const row = el("div", { class: "row" });
      // dans le grand bâtiment, on passe d'une salle à l'autre par le couloir, sans ressortir
      if (MAIN_ROOMS.includes(key)) row.appendChild(btn("Une autre salle du bâtiment", () => { Snd.click(); Voice.stop(); hall(); }, "ghost"));
      row.appendChild(btn("Ressortir", () => { Snd.click(); Voice.stop(); outside(); }));
      panel.appendChild(row); wrap.appendChild(panel); n.appendChild(wrap);
      setTimeout(() => Voice.say("narr", txt, panel.querySelector(".narr")), 700);
      row.querySelector("button").focus({ preventScroll: true });
    }
    function finish() {
      if (mustLeft().length && S.t < END) return;
      // le temps est écoulé : on ne se promène plus. Ce qui n'a pas été vu compte comme une situation manquée.
      mustLeft().forEach((e) => { const E0 = SCREENS.find((x) => x.id === e.id); if (E0 && st.res[e.id] == null) { st.res[e.id] = 0; st.missed = st.missed || {}; st.missed[e.id] = 1; } S.done[e.id] = 1; });
      busy = true; if (you) { you.stop(); you.onDone = null; }
      document.body.classList.remove("roaming"); Life.clear();
      S.t = Math.max(S.t, END); save();
      Voice.say("narr", sc.end_t); toastMsg(sc.end_t);
      setTimeout(next, 1400);
    }
    World.init();
    if (!World._roamTap) {
      World._roamTap = true;
      // un toucher (pas un glissement) sur le plan fait avancer votre personnage
      let d0 = null;
      World.el.addEventListener("pointerdown", (e) => { d0 = [e.clientX, e.clientY]; World._drag = false; });
      World.el.addEventListener("pointerup", (e) => { if (d0 && Math.hypot(e.clientX - d0[0], e.clientY - d0[1]) > 12) World._drag = true; d0 = null; if (World._onTap) World._onTap(e); });
    }
    World._onTap = onTap;
    window.__roamWalk = (x, y) => walkTo(x, y);   // pour les tests automatiques
    window.__roamPos = () => [you.x, you.y, busy, S.t];
    free(true);
  };

/* Transparence dynamique : quand quelqu'un passe derrière un auvent, le préau, un mur ou un panneau,
   ce qui le cache devient légèrement transparent, pour qu'on voie toujours ce qui s'y passe. */
(function seeThrough() {
  let last = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (t - last < 220) return; last = t;
    const W = document.getElementById("world"); if (!W || !W.classList.contains("on")) return;
    const occ = W.querySelectorAll(".dio-occ"); if (!occ.length) return;
    const acts = [...W.querySelectorAll(".wacts .actor, .wacts .walker, .wacts .life")].filter((a) => a.offsetParent !== null);
    // derrière un bâtiment : le bâtiment devient transparent quand c'est vous (ou une personne d'une scène) qui passez derrière,
    // pour qu'on voie toujours le chemin et ce qui s'y passe ; un simple figurant, lui, passe derrière le mur
    const B = (A.dio && A.dio.blds) || [], K = PJ[2] / .8660254, zp = (z) => z * K / PJ[7] * 100;
    const P2 = (x, y, z) => { const f = w2f(x, y); return [f[0], f[1] - zp(z)]; };
    const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
    const SIL = W._sil || (W._sil = B.map(([x0, y0, x1, y1, h, k]) => ({ k, d: x1 + y1, x0, y0, x1, y1, poly: [P2(x0, y1, 0), P2(x1, y1, 0), P2(x1, y0, 0), P2(x1, y0, h), P2(x0, y0, h), P2(x0, y1, h)] })));
    const inRoom = !!W.querySelector(".inroom-w"), ghost = new Set(), hidden = [];
    W.querySelectorAll(".wacts .walker").forEach((a) => {
      const w = a._w; if (!w) return;
      const inside = (b) => w.x > b.x0 - .2 && w.x < b.x1 + .2 && w.y > b.y0 - .2 && w.y < b.y1 + .2;
      const mid = P2(w.x, w.y, .9);
      const hit = SIL.find((b) => !inside(b) && w.x + w.y < b.d - .3 && (w.y < b.y1 - .1 && w.x < b.x1 - .1) && inPoly(mid, b.poly));
      if (!hit || inRoom) { a.classList.remove("behind"); if (w.zb != null) { w.zb = null; w.place(); } return; }
      if ((w.who === "you" || w.ev) && hit.k && A.dio.lids[hit.k]) ghost.add(hit.k);
      hidden.push([a, hit.k]);
    });
    // la personne derrière passe sous la copie transparente du bâtiment ; ceux qui sont devant restent au-dessus
    hidden.forEach(([a, k]) => { const g = ghost.has(k), w = a._w; a.classList.toggle("behind", !g); const zb = g ? 5 : null; if (w.zb !== zb) { w.zb = zb; w.place(); } });
    const host = W.querySelector(".wanim");
    if (host) {
      ghost.forEach((k) => {
        let g = host.querySelector(`.dio-ghost[data-k="${k}"]`);
        // dessous : le plan sans le bâtiment (on voit le chemin derrière) ; dessus : le bâtiment, à demi transparent
        if (!g) { const L = A.dio.lids[k], pos = `left:${L.l}%;top:${L.t}%;width:${L.w}%;aspect-ratio:${L.r}`; host.appendChild(el("img", { class: "dio-ghost under", "data-k": k, alt: "", src: Lids.src(k, "nob"), style: pos + ";z-index:4" })); g = el("img", { class: "dio-ghost", "data-k": k, alt: "", src: Lids.src(k, "ghost"), style: pos + ";z-index:6" }); host.appendChild(g); }
        host.querySelectorAll(`.dio-ghost[data-k="${k}"]`).forEach((x) => x.classList.add("on"));
      });
      host.querySelectorAll(".dio-ghost.on").forEach((g) => { if (!ghost.has(g.dataset.k)) g.classList.remove("on"); });
    }
    const R = acts.map((a) => [a.getBoundingClientRect(), +a.style.zIndex || 0]);
    occ.forEach((o) => {
      const z = +o.style.zIndex || 0, r = o.getBoundingClientRect();
      let hit = false;
      for (const [b, za] of R) {
        if (za >= z || !b.width) continue;
        const ix = Math.min(r.right, b.right) - Math.max(r.left, b.left), iy = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
        if (ix > b.width * .25 && iy > b.height * .25) { hit = true; break; }
      }
      o.classList.toggle("see", hit);
    });
  }
  requestAnimationFrame(frame);
})();

  /* ======================= La vie de l'accueil : familles, voitures, jour et nuit, horloge ======================= */
  // Une voiture : copie du dessin de voiture du plan, qu'on déplace le long de la voie du parking (axe x du sol)
  function Car(dx0) {
    const src = World.cam.querySelector(".dio-ov.dio-car"); if (!src) return null;
    const c = src.cloneNode(true); c.classList.remove("dio-car"); c.classList.add("dio-car2");
    const L0 = parseFloat(src.style.left), T0 = parseFloat(src.style.top);
    const C = { el: c, dx: dx0, place() { const ox = this.dx * PJ[2] / PJ[6] * 100, oy = this.dx * PJ[3] / PJ[7] * 100; c.style.left = (L0 + ox) + "%"; c.style.top = (T0 + oy) + "%"; c.style.zIndex = zOf(33.7 + this.dx, 27.3) + 2; } };
    C.drive = (to, sec, done) => {
      const a = C.dx, t0 = performance.now(), D = reduce() ? 1 : sec * 1000, e = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      const f = (now) => { const t = Math.min(1, (now - t0) / D); C.dx = a + (to - a) * e(t); C.place(); if (t < 1) requestAnimationFrame(f); else if (done) done(); };
      requestAnimationFrame(f);
    };
    C.place(); World.cam.querySelector(".wanim").appendChild(c);
    return C;
  }
  // Les familles : le matin, la voiture arrive, l'enfant entre, le parent échange un mot avec l'équipe et repart ;
  // le soir, c'est l'inverse. Des familles toutes différentes, chacune avec son trajet.
  // Voitures : une seule à la fois sur la voie du parking (la suivante attend que la précédente soit repartie),
  // chacune s'arrête à sa propre place, et repart en marche arrière par sa voie (jamais à travers le centre).
  // À pied : depuis le trottoir, le long du bord du parking, jusqu'au portail. Des grands et des ados arrivent seuls.
  const FAMS = [
    { pa: "pa1", kids: ["k3"], car: 0, stop: [29.5, 22.8], run: [[22.3, 23.2], [18.4, 24.5], [15.1, 22.8], [9.2, 23.0]], g: "wave" },
    { pa: null, kids: ["t3"], foot: [37.4, 29.8], run: [[24.2, 23.0], [19.6, 22.8], [17.4, 23.6]], g: "wave" },
    { pa: "pa3", kids: ["k7"], foot: [35.2, 29.8], stop: [28.7, 24.2], run: [[23.4, 24.6], [21.0, 26.4], [17.6, 27.6]], g: "raise" },
    { pa: "pa2", kids: ["k6", "k8"], car: 1.3, stop: [29.3, 24.0], run: [[22.6, 22.4], [20.2, 21.0], [16.2, 19.9]], g: "hug" },
    { pa: null, kids: ["k9"], foot: [36.4, 29.8], run: [[24.8, 24.8], [22.0, 25.6], [18.8, 27.0]], g: "raise" },
    { pa: null, kids: ["t5"], foot: [37.6, 29.8], run: [[25.2, 22.4], [21.6, 22.0], [19.0, 22.6]], g: "laugh" },
    { pa: "pa4", kids: ["k5"], car: .6, stop: [28.4, 22.4], run: [[22.0, 24.0], [12.6, 24.4], [9.6, 25.2]], g: "laugh" },
  ];
  function families(mode, staff = "nour") {
    if (!World.el || !A.dio || reduce()) return;
    const acts = World.cam.querySelector(".wacts"), DOOR = [33.0, 26.0], OUT = [31.4, 23.4], GATE = [29.0, 23.4], IN = [26.2, 23.9];
    // à pied : on longe le trottoir puis le bord du parking (hors de la voie des voitures et des places)
    const SIDE = [[30.8, 29.8], [30.8, 24.4]];
    World.cam.querySelectorAll(".dio-car2").forEach((x) => x.remove());
    // jamais deux fois la même personne à l'écran : si Nour est déjà dans la scène, c'est Jade qui accueille au portail
    if (World.cam.querySelector(`.actor[data-who="${staff}"], .walker[data-who="${staff}"]`)) staff = staff === "jade" ? "kevin" : "jade";
    const host = Life.add(Walker(staff, 27.6, 22.6, "stand")); acts.appendChild(host.el); host.face(GATE);
    // sur le parvis, des parents s'arrêtent devant le panneau d'affichage pour lire les informations
    [["pa5", 32.9, 20.4], ["pa6", 32.4, 21.6]].forEach(([w, x, y]) => { if (mode === "morning") return; const R0 = Life.idle(w, x, y, ["chin", "nod", "point", "weight"], { back: true }); acts.appendChild(R0.el); });
    const timers = [], alive = () => World.el.classList.contains("on");
    const start = (F, i, from, after) => {
      const app = F.foot ? SIDE.slice() : [], back = app.slice().reverse().concat([from]);
      const stop = F.stop || [GATE[0] + .4, GATE[1] + .2];
      const P = F.pa ? Life.add(Walker(F.pa, from[0], from[1], "stand")) : null; if (P) acts.appendChild(P.el);
      if (mode === "morning") {
        F.kids.forEach((kid, j) => {
          const K = Life.add(Walker(kid, from[0] - .5 - j * .4, from[1] + (F.foot ? -.2 : .3) + j * .3, "stand")); acts.appendChild(K.el);
          const path = app.map(([x, y]) => [x + j * .35, y]).concat([[OUT[0], OUT[1] + j * .4], [GATE[0], GATE[1] + j * .4], IN]).concat(F.run.map(([x, y]) => [x - j * .5, y + j * .4]));
          K.go(path, (F.pa ? 2.1 : 1.6) + j * .3, () => { gesture(K.el, F.g); K.el.style.transition = "opacity .8s"; setTimeout(() => { K.el.style.opacity = "0"; setTimeout(() => K.el.remove(), 900); }, 2500); }, j || F.pa ? "run" : "walk");
          if (!F.pa) setTimeout(() => gesture(host.el, "wave"), 2600);   // arrivé seul : l'équipe l'accueille d'un signe
        });
        if (!P) { if (after) setTimeout(after, 4000); return; }
        P.go(app.concat([OUT, stop]), 1.4, () => {
          P.setBack(true); P.face([host.x, host.y]); gesture(host.el, i % 2 ? "welcome" : "explain"); gesture(P.el, i % 2 ? "explain" : "nod");
          setTimeout(() => { gesture(host.el, "wave"); gesture(P.el, i % 3 ? "wave" : "watch"); P.setBack(false); P.go([OUT].concat(back), 1.5, () => { P.el.remove(); after && after(); }); }, 3200 + (i % 3) * 600);
        });
      } else {
        F.kids.forEach((kid, j) => {
          const K = Life.add(Walker(kid, F.run[F.run.length - 1][0], F.run[F.run.length - 1][1], "stand")); acts.appendChild(K.el);
          K.go(F.run.slice().reverse().concat([IN, [stop[0] - .7 - j * .4, stop[1] - .1]]), 2.4, () => {
            gesture(K.el, P ? "hug" : "wave");
            setTimeout(() => { if (P) { P.setBack(false); gesture(host.el, "wave"); P.go([OUT].concat(back), 1.4, () => P.el.remove()); } K.go([GATE, OUT].concat(back.map(([x, y]) => [x + j * .35, y])), 1.5, () => { K.el.remove(); if (j === F.kids.length - 1) after && after(); }); }, 2600);
          }, "run");
        });
        if (P) P.go(app.concat([OUT, stop]), 1.4, () => { P.setBack(true); gesture(host.el, "explain"); gesture(P.el, "nod"); });
      }
    };
    // les voitures, l'une après l'autre
    const cars = FAMS.map((F, i) => [F, i]).filter(([F]) => !F.foot);
    let ci = 0;
    const nextCar = () => {
      if (ci >= cars.length || !alive()) return;
      const [F, i] = cars[ci++], car = Car(13); if (!car) return;
      car.drive(F.car, 3.4, () => start(F, i, [DOOR[0] + F.car, DOOR[1]], () => car.drive(13, 3.8, () => { car.el.remove(); timers.push(setTimeout(nextCar, 900)); })));
    };
    timers.push(setTimeout(nextCar, 500));
    // à pied, en parallèle, chacun à son heure
    FAMS.filter((F) => F.foot).forEach((F, k) => timers.push(setTimeout(() => { if (alive()) start(F, FAMS.indexOf(F), F.foot, null); }, 2600 + k * 3900)));
    Life.agents.push({ t: 0, clear: () => timers.forEach(clearTimeout) });
  }

  // Le soir tombe sur le plan : le soleil descend, les fenêtres s'allument, la lune apparaît ; puis le jour se lève.
  function duskToDawn(dayLabel, done) {
    World.init(); if (!World.el) return done();
    Life.clear();
    World.show({ at: "ensemble", cast: [] }, { type: "chapter", kicker: "18 h 30" });
    document.body.classList.add("dusk");
    const pill = el("div", { class: "dusk-pill", "aria-live": "polite" }, "La nuit tombe sur les Hautes Herbes…");
    document.body.appendChild(pill); requestAnimationFrame(() => pill.classList.add("on"));
    const W = World.el, steps = [
      [0, () => { W.classList.remove("amb-morning", "amb-day", "amb-night"); W.classList.add("amb-golden"); World.lights(1); }],
      [1300, () => { W.classList.replace("amb-golden", "amb-evening"); World.lights(2); Snd.night(); }],
      [2600, () => { W.classList.replace("amb-evening", "amb-night"); }],
      [4300, () => { pill.textContent = `${dayLabel}, 7 h 45. Le jour se lève.`; W.classList.replace("amb-night", "amb-morning"); World.lights(0); }],
      [5800, () => { pill.classList.remove("on"); document.body.classList.remove("dusk"); setTimeout(() => pill.remove(), 600); done(); }],
    ];
    if (calm()) { pill.remove(); document.body.classList.remove("dusk"); return done(); }
    steps.forEach(([t, f]) => setTimeout(f, t));
  }

  // La grande horloge : entre deux moments de la journée, on voit le temps passer
  function bigClock(a0, a1, label) {
    if (calm() || a1 - a0 < 40 || document.querySelector(".bigclock")) return;
    const k = el("div", { class: "bigclock", "aria-hidden": "true" }, `<svg viewBox="-60 -60 120 120"><circle r="56" class="bf"/>${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-48" x2="0" y2="${i % 3 ? -43 : -39}" transform="rotate(${i * 30})"/>`).join("")}<line class="hh" x1="0" y1="6" x2="0" y2="-26"/><line class="mh" x1="0" y1="8" x2="0" y2="-40"/><circle r="3.2" class="bc"/></svg><p></p>`);
    document.body.appendChild(k); requestAnimationFrame(() => k.classList.add("on"));
    const hh = k.querySelector(".hh"), mh = k.querySelector(".mh"), p = k.querySelector("p"), t0 = performance.now(), D = 1700;
    const f = (now) => {
      const t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 3), m = a0 + (a1 - a0) * e;
      hh.setAttribute("transform", `rotate(${(m / 60 % 12) * 30})`); mh.setAttribute("transform", `rotate(${(m % 60) * 6})`);
      p.textContent = `${label ? label + " · " : ""}${Math.floor(m / 60)} h ${String(Math.floor(m % 60)).padStart(2, "0")}`;
      if (t < 1) requestAnimationFrame(f); else setTimeout(() => { k.classList.remove("on"); setTimeout(() => k.remove(), 500); }, 650);
    };
    requestAnimationFrame(f); Snd.tick && Snd.tick();
  }

  // Fin de journée : les familles repartent, et on fait le bilan de ce qu'on a vécu aujourd'hui
  R.dayend = (sc, n) => {
    const c = CHAPTERS[sc.ch - 1], B = (typeof DAYEND !== "undefined" && DAYEND[sc.ch]) || { t: "", learn: [] };
    World.show({ at: "cour", cast: [], z: 2.1 }, { type: "dayend", kicker: B.t || "17 h 15" });
    if (B.fam !== false) setTimeout(() => families("evening"), 400);
    const L = SCREENS.filter((x) => x.ch === sc.ch && x.comp && st.res[x.id] != null && x.type !== "dayend");
    const items = L.map((x) => `<li><b>${esc((x.kicker || "").split("·").pop().trim() || "")}</b><span>${esc(x.title || x.prompt || "")}</span></li>`).join("");
    n.innerHTML = `<div class="panel dayend">${kicker(`${c.day}, ${B.t || "17 h 15"} · fin de journée`)}<h2 id="h-${sc.id}">Bilan de la journée</h2>
      <p class="lead">${esc(B.lead || "Les familles repartent. Avant de rentrer, vous repensez à votre journée.")}</p>
      ${items ? `<p class="kicker">Ce que vous avez vécu aujourd’hui</p><ul class="de-list">${items}</ul><p class="de-note">Vos décisions sont enregistrées : vous verrez vendredi ce qu’elles ont produit.</p>` : ""}
      <p class="kicker">À retenir</p><ul class="de-learn">${B.learn.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
    n.querySelector(".panel").appendChild(btn("Continuer", next));
    n.dataset.novoice = "1";
    setTimeout(() => { if (n.isConnected) Voice.seq([["narr", B.lead || "Les familles repartent. Avant de rentrer, vous repensez à votre journée."], ["narr", "À retenir. " + B.learn.join(" ")]]); }, 900);
  };

  // Une interruption qu'on voit vraiment : la personne arrive en marchant jusqu'à vous, vous fait signe ou vous tire par
  // la manche, et parle avec sa voix ; le téléphone, lui, sonne et vibre. Elle repart quand vous avez répondu.
  function liveInterrupt(who, text, fb) {
    if (calm() || !who) return { leave() { } };
    if (who === "phone") {
      const ph = el("div", { class: "intr intr-phone", "aria-hidden": "true" }, `<div class="ip-body"><i class="ip-screen"><b>Appel entrant</b><span>Accueil · ligne fixe</span></i></div>`);
      document.body.appendChild(ph); requestAnimationFrame(() => ph.classList.add("in")); Snd.mid && Snd.mid();
      if (navigator.vibrate) try { navigator.vibrate([180, 120, 180]); } catch (e) { }
      return { leave() { ph.classList.add("out"); setTimeout(() => ph.remove(), 700); } };
    }
    const sp = rigSpec(who); if (!sp) return { leave() { } };
    const box = el("div", { class: "intr", "data-who": who, "aria-hidden": "true" }, `<div class="intr-fig">${RIG.figure(sp).replace('<svg class="rig"', '<svg class="rig p-walk"')}</div>`);
    document.body.appendChild(box);
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("in")));
    const parts = VOICE_TXT.split(text, fb || who), mine = parts.find(([w]) => w === who), emo = emoOf(who, mine ? mine[1] : text);
    setTimeout(() => {
      const r = box.querySelector(".rig"); if (r) r.setAttribute("class", "rig p-idle");
      gesture(box, emo === "angry" ? "fist" : "beckon");
      if (emo) { box.classList.add("emo-" + emo); signOnHead(box.querySelector(".rig"), who, emo); }
      Voice.seq(parts);
      setTimeout(() => gesture(box, "beckon"), 2900);
    }, 1050);
    return { leave() { const r = box.querySelector(".rig"); if (r) r.setAttribute("class", "rig p-walk"); box.classList.add("out"); setTimeout(() => box.remove(), 1000); } };
  }

  /* ---------- Personnage du joueur, créé sur mesure ----------
   Transposition fidèle de kit/clay.py (bust, mini) : mêmes formes, mêmes matières « pâte à modeler ».
   Le personnage créé (st.look) remplace partout l’avatar prédéfini : portrait, figurine du décor, bilan. */
  const LOOK = (() => {
    const SKIN = { porcelaine: "#F3D2BD", claire: "#EDC3A4", doree: "#D9A27A", olive: "#C98E63", cuivre: "#B5784E", brune: "#8E5A3B", ebene: "#6B4129" };
    const HAIR = { noir: "#2B211C", brun: "#4E3426", chatain: "#7A5234", roux: "#B5542A", blond: "#D9B064", gris: "#A9A7A3", poivre: "#6E6A66",
      platine: "#E8DCC0", rose: "#D98AA6", bleu: "#4F78C4", violet: "#7E5BB8" };
    const EYES = { marron: "#3B2618", noisette: "#6B4A22", vert: "#3F6B3A", bleu: "#3A5F8C", gris: "#5E6A72" };
    // couleurs : même arithmétique que colorsys (HLS) en Python
    const hx2 = (c) => { c = c.replace("#", ""); return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255); };
    const out = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, "0")).join("").toUpperCase();
    function rgb2hls(r, g, b) {
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
      if (mx === mn) return [0, l, 0];
      const d = mx - mn, s = l <= .5 ? d / (mx + mn) : d / (2 - mx - mn);
      const rc = (mx - r) / d, gc = (mx - g) / d, bc = (mx - b) / d;
      let h = r === mx ? bc - gc : g === mx ? 2 + rc - bc : 4 + gc - rc; h = ((h / 6) % 1 + 1) % 1;
      return [h, l, s];
    }
    function hls2rgb(h, l, s) {
      if (s === 0) return [l, l, l];
      const m2 = l <= .5 ? l * (1 + s) : l + s - l * s, m1 = 2 * l - m2;
      const v = (hue) => { hue = ((hue % 1) + 1) % 1; if (hue < 1 / 6) return m1 + (m2 - m1) * hue * 6; if (hue < .5) return m2; if (hue < 2 / 3) return m1 + (m2 - m1) * (2 / 3 - hue) * 6; return m1; };
      return [v(h + 1 / 3), v(h), v(h - 1 / 3)];
    }
    const tone = (c, dl = 0, ds = 0) => { const [h, l, s] = rgb2hls(...hx2(c)); return out(...hls2rgb(h, Math.max(0, Math.min(1, l + dl)), Math.max(0, Math.min(1, s + ds)))); };
    // dégradés « modelés » partagés (ajoutés une seule fois à la page)
    let defsEl = null; const made = new Set();
    function fill(c, kind = "r", hi = .16, lo = -.16) {
      const k = `kc${kind}${c.slice(1)}${Math.round(hi * 100)}${Math.round(-lo * 100)}`;
      if (!made.has(k)) {
        made.add(k);
        if (!defsEl) { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("width", "0"); s.setAttribute("height", "0"); s.setAttribute("aria-hidden", "true"); s.style.position = "absolute"; s.innerHTML = "<defs></defs>"; document.body.prepend(s); defsEl = s.firstChild; }
        defsEl.insertAdjacentHTML("beforeend", kind === "r"
          ? `<radialGradient id="${k}" cx="38%" cy="32%" r="78%"><stop offset="0" stop-color="${tone(c, hi * .9, .02)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${tone(c, lo, .04)}"/></radialGradient>`
          : `<linearGradient id="${k}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${tone(c, hi * .7)}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${tone(c, lo)}"/></linearGradient>`);
      }
      return `url(#${k})`;
    }
    const f1 = (n) => (Math.round(n * 10) / 10).toString();
    const E = (cx, cy, rx, ry, f, x = "") => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${f}"${x}/>`;
    const P = (d, f, x = "") => `<path d="${d}" fill="${f}"${x}/>`;
    const hairCol = (sp, k = "hc") => HAIR[sp[k]] || (String(sp[k] || "").startsWith("#") ? sp[k] : HAIR.brun);

    function brows(hx, hy, col, mood, thick) {
      const c = tone(col, -.02), shape = { smile: [-1, -2], big: [-3, -3.5], calm: [0, 0] }[mood] || [-1, -2];
      let o = "";
      for (const sg of [-1, 1]) {
        const ex = hx + sg * 12.5, xo = ex + sg * 7, yo = hy - 14 + shape[0], xi = ex - sg * 6, yi = hy - 14 + shape[1];
        const mx = (xo + xi) / 2, my = Math.min(yo, yi) - 2.2, d = `M${f1(xo)},${f1(yo)} Q${f1(mx)},${f1(my)} ${f1(xi)},${f1(yi)}`;
        o += `<path d="${d}" fill="none" stroke="${tone(c, -.1)}" stroke-width="${f1(thick + 1)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${f1(thick)}" stroke-linecap="round"/>`;
      }
      return o;
    }
    function eyes(hx, hy, skin, mood, glasses, iris) {
      const rx = 6.0, ry = 6.6, lid = { smile: .3, big: .42, calm: .38 }[mood] ?? .3, low = { big: .3, smile: .15 }[mood] || 0;
      let o = "";
      for (const sg of [-1, 1]) {
        const ex = hx + sg * 12, ey = hy - 4;
        // refonte : œil sombre et net (teinté par la couleur des yeux choisie), petit reflet, sans blanc d'œil
        const px = ex - sg * .5;
        o += E(px, ey + .6, rx * .62, ry * .72, tone(iris, -.22)) + E(px - 1.6, ey - 1.4, 1.5, 1.5, "#fff", ' opacity=".95"');
        if (lid) {
          const top = ey - ry - 1.4, cut = ey - ry + 2 * ry * lid;
          o += `<path d="M${f1(ex - rx - 1.6)},${f1(top)} L${f1(ex + rx + 1.6)},${f1(top)} L${f1(ex + rx + 1.6)},${f1(cut)} Q${f1(ex)},${f1(cut + 1.8)} ${f1(ex - rx - 1.6)},${f1(cut)}Z" fill="${tone(skin, .02)}"/>`
            + `<path d="M${f1(ex - rx - .6)},${f1(cut)} Q${f1(ex)},${f1(cut + 1.8)} ${f1(ex + rx + .6)},${f1(cut)}" fill="none" stroke="${tone(skin, -.28)}" stroke-width="1.3" stroke-linecap="round"/>`;
        }
        if (low) o += `<path d="M${f1(ex - rx)},${f1(ey + ry - 1)} Q${f1(ex)},${f1(ey + ry * (1 - low) - 2)} ${f1(ex + rx)},${f1(ey + ry - 1)} L${f1(ex + rx)},${f1(ey + ry + 2)} L${f1(ex - rx)},${f1(ey + ry + 2)}Z" fill="${skin}"/>`;
      }
      if (glasses) {
        const g = glasses === "rouge" ? "#B5402F" : glasses === "doree" ? "#B8913F" : "#2E2A28";
        for (const sg of [-1, 1]) o += `<rect x="${f1(hx + sg * 12 - 10)}" y="${f1(hy - 13)}" width="20" height="17" rx="${glasses === "carree" ? 3 : 7}" fill="#fff" fill-opacity=".1" stroke="${g}" stroke-width="2"/>`;
        o += `<path d="M${f1(hx - 2)},${f1(hy - 6)} Q${f1(hx)},${f1(hy - 8)} ${f1(hx + 2)},${f1(hy - 6)}" stroke="${g}" stroke-width="2" fill="none"/>`;
      }
      return o;
    }
    function nose(hx, hy, skin, big) {
      const rx = 7.4 * big, ry = 8.6 * big, y = hy + 9;
      return E(hx + .6, y + ry * .2, rx * .5, ry * .36, tone(skin, -.14), ' opacity=".55"');   // refonte : nez discret
    }
    function mouth(hx, hy, skin, mood) {
      const y = hy + 21, lip = tone(skin, -.22, .06);
      if (mood === "big") {
        const d = `M${hx - 9},${y - 1.5} Q${hx},${y - .5} ${hx + 9},${y - 1.5} Q${hx + 7},${y + 8.5} ${hx},${y + 9} Q${hx - 7},${y + 8.5} ${hx - 9},${y - 1.5}Z`;
        const teeth = `<path d="M${hx - 7.5},${y - .9} Q${hx},${y + .2} ${hx + 7.5},${y - .9} L${hx + 6.6},${y + 2} Q${hx},${y + 3} ${hx - 6.6},${y + 2}Z" fill="#F7F3EC"/>`;
        return `<path d="${d}" fill="#5B2A22"/>` + E(hx, y + 6.5, 4.2, 2.2, "#C9645A") + teeth + `<path d="${d}" fill="none" stroke="${lip}" stroke-width="1.8" stroke-linejoin="round"/>`;
      }
      const d = mood === "calm" ? `M${hx - 5.5},${y + 1} Q${hx},${y + 3.6} ${hx + 5.5},${y + 1}` : `M${hx - 8},${y - .5} Q${hx},${y + 6.5} ${hx + 8},${y - .5}`;
      const corners = mood !== "calm" ? `<path d="M${hx - 8.6},${y - 1.6} q.6,.9 .9,1.6 M${hx + 8.6},${y - 1.6} q-.6,.9 -.9,1.6" stroke="${tone(skin, -.18)}" stroke-width="1.1" fill="none" stroke-linecap="round"/>` : "";
      return `<path d="${d}" fill="none" stroke="${tone(lip, -.12)}" stroke-width="3" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${lip}" stroke-width="1.8" stroke-linecap="round" transform="translate(0,-.3)"/>` + corners;
    }
    function hairBack(sp, hx, hy, R) {
      const st0 = sp.hair || "court", f = fill(hairCol(sp), "r", .12, -.18);
      if (st0 === "long" || st0 === "ondule") return P(`M${hx - R - 3},${hy - 6} C${hx - R - 10},${hy + 24} ${hx - R - 6},${hy + 44} ${hx - R + 6},${hy + 50} Q${hx},${hy + 40} ${hx + R - 6},${hy + 50} C${hx + R + 6},${hy + 44} ${hx + R + 10},${hy + 24} ${hx + R + 3},${hy - 6}Z`, f);
      if (st0 === "carre") return P(`M${hx - R - 4},${hy - 8} Q${hx - R - 6},${hy + 24} ${hx - R + 1},${hy + 30} L${hx + R - 1},${hy + 30} Q${hx + R + 6},${hy + 24} ${hx + R + 4},${hy - 8}Z`, f);
      if (st0 === "tresses") { let o = ""; for (const s of [-1, 1]) for (let i = 0; i < 5; i++) o += E(hx + s * (R + 3), hy + 14 + i * 9, 5.4, 6, f); return o; }
      return "";
    }
    function hairFront(sp, hx, hy, R) {
      const st0 = sp.hair || "court", c = hairCol(sp), f = fill(c, "r", .14, -.2), dk = tone(c, -.12), top = hy - R;
      let o = "";
      if (st0 === "chauve") { o += E(hx - R + 2, hy - 8, 6, 12, f) + E(hx + R - 2, hy - 8, 6, 12, f); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) o += E(hx + s * (R - 4), hy - 18 + i * 5, 4, 3.4, f); return o; }
      if (st0 === "chignon") o += E(hx, top - 6, 11, 10, f) + `<path d="M${hx - 8},${top - 4} Q${hx},${top - 12} ${hx + 8},${top - 4}" stroke="${dk}" stroke-width="1.2" fill="none"/>`;
      o += P(`M${hx - R - 2},${hy - 2} Q${hx - R - 3},${top - 6} ${hx},${top - 7} Q${hx + R + 3},${top - 6} ${hx + R + 2},${hy - 2} Q${hx + R - 4},${top + 6} ${hx + 4},${top + 4} Q${hx - 10},${top + 9} ${hx - R - 2},${hy - 2}Z`, f);
      if (["court", "chignon", "carre", "long"].includes(st0)) {
        for (const [dx, rot] of [[-14, -20], [-4, -6], [7, 12], [16, 26]]) o += E(hx + dx, top + 3, 8, 4.4, f, ` transform="rotate(${rot},${hx + dx},${top + 3})"`);
        o += `<path d="M${hx - 16},${top + 2} Q${hx - 6},${top - 4} ${hx + 2},${top + 3} M${hx + 3},${top + 1} Q${hx + 12},${top - 3} ${hx + 18},${top + 6}" stroke="${dk}" stroke-width="1.3" fill="none" opacity=".6"/>`;
      }
      if (st0 === "boucles") { for (let i = 0; i < 11; i++) { const a = (-170 + i * 16) * Math.PI / 180; o += E(hx + Math.cos(a) * (R + 1), hy - 4 + Math.sin(a) * (R + 3), 7.4, 7.4, f); } o += E(hx, top + 1, 14, 7, f); }
      if (st0 === "herisse") for (let i = 0; i < 9; i++) { const ad = -165 + i * 19, a = ad * Math.PI / 180, x = hx + Math.cos(a) * (R - 2), y = hy - 6 + Math.sin(a) * (R + 1); o += E(x, y, 4.6, 9, f, ` transform="rotate(${ad + 90},${f1(x)},${f1(y)})"`); }
      if (st0 === "tresses") o += `<path d="M${hx},${top - 6} L${hx},${top + 6}" stroke="${dk}" stroke-width="1.4"/>`;
      if (st0 === "ondule") for (let i = 0; i < 5; i++) o += E(hx - 16 + i * 8, top + 2 + (i % 2) * 2, 7, 5, f);
      if (st0 === "rase") o = P(`M${hx - R},${hy - 6} Q${hx - R},${top - 3} ${hx},${top - 4} Q${hx + R},${top - 3} ${hx + R},${hy - 6} Q${hx},${top + 3} ${hx - R},${hy - 6}Z`, f, ' opacity=".92"');
      if (st0 === "couettes") o += E(hx - R - 6, hy - 6, 7, 9, f) + E(hx + R + 6, hy - 6, 7, 9, f);
      return o;
    }
    function facial(sp, hx, hy) {
      let o = ""; const hc = hairCol(sp);
      if (sp.barbe) o += P(`M${hx - 23.5},${hy + 4} Q${hx - 22},${hy + 31} ${hx},${hy + 35} Q${hx + 22},${hy + 31} ${hx + 23.5},${hy + 4} Q${hx + 20},${hy + 18} ${hx + 12},${hy + 25} Q${hx},${hy + 31} ${hx - 12},${hy + 25} Q${hx - 20},${hy + 18} ${hx - 23.5},${hy + 4}Z`, fill(hc, "r", .12, -.16), ' opacity=".86"');
      if (sp.moustache || sp.barbe) { const f = fill(hc, "r", .12, -.2), y = hy + 16.2; o += E(hx - 6, y, 7.5, 2.8, f, ` transform="rotate(-10,${hx - 6},${y})" opacity=".9"`) + E(hx + 6, y, 7.5, 2.8, f, ` transform="rotate(10,${hx + 6},${y})" opacity=".9"`); }
      return o;
    }
    function bust(sp, mood) {
      mood = mood || sp.mood || "smile";
      const skin = SKIN[sp.skin] || SKIN.claire, top = sp.top || "#3C6FB8", hx = 60, hy = 58, R = 31, shY = 102, W = 52;
      let s = E(60, 156, 46, 5, "#000", ' opacity=".10"') + hairBack(sp, hx, hy, R);
      const body = `M${60 - W},160 C${60 - W - 3},${shY + 18} ${60 - W + 4},${shY + 2} ${60 - W + 22},${shY - 2} Q60,${shY - 8} ${60 + W - 22},${shY - 2} C${60 + W - 4},${shY + 2} ${60 + W + 3},${shY + 18} ${60 + W},160Z`;
      s += P(body, fill(top, "r", .14, -.18));   // refonte : matière lisse
      for (const sg of [-1, 1]) {
        const x0 = 60 + sg * (W - 16);
        s += `<path d="M${x0},${shY + 2} Q${x0 + sg * -4},${shY + 30} ${x0 + sg * -1},160" fill="none" stroke="${tone(top, -.2)}" stroke-width="1.6" opacity=".55"/><path d="M${x0 + sg * 2},${shY + 4} Q${x0 + sg * -2},${shY + 30} ${x0 + sg * 1.5},160" fill="none" stroke="${tone(top, .16)}" stroke-width="1" opacity=".5"/>`;
      }
      s += P(`M${hx - 12},${hy + 24} L${hx - 13},${shY + 2} Q${hx},${shY + 9} ${hx + 13},${shY + 2} L${hx + 12},${hy + 24}Z`, fill(tone(skin, -.08), "r", .04, -.14));
      const cut = sp.cut || "pull";
      if (cut === "pull") s += P(`M${hx - 14},${shY - 3} Q${hx},${shY + 11} ${hx + 14},${shY - 3} Q${hx},${shY + 5} ${hx - 14},${shY - 3}Z`, tone(top, -.12));
      else if (cut === "chemise") s += P(`M${hx - 13},${shY - 4} L${hx},${shY + 12} L${hx - 4},${shY + 16} L${hx - 16},${shY + 2}Z`, tone(top, .12)) + P(`M${hx + 13},${shY - 4} L${hx},${shY + 12} L${hx + 4},${shY + 16} L${hx + 16},${shY + 2}Z`, tone(top, .12));
      else if (cut === "cardigan") { s += P(`M${hx - 4},${shY + 4} L${hx - 2},160 L${hx + 2},160 L${hx + 4},${shY + 4}Z`, tone(top, -.2)) + P(`M${hx - 12},${shY - 3} Q${hx},${shY + 9} ${hx + 12},${shY - 3} Q${hx},${shY + 3} ${hx - 12},${shY - 3}Z`, "#F1ECE4"); for (let i = 0; i < 3; i++) s += E(hx + 6, shY + 18 + i * 12, 1.9, 1.9, tone(top, -.3)); }
      else if (cut === "sweat") s += P(`M${hx - 20},${shY - 2} Q${hx},${shY + 16} ${hx + 20},${shY - 2} Q${hx + 14},${shY + 10} ${hx},${shY + 10} Q${hx - 14},${shY + 10} ${hx - 20},${shY - 2}Z`, tone(top, -.1)) + `<path d="M${hx - 5},${shY + 10} l-1,16 M${hx + 5},${shY + 10} l1,16" stroke="#F2EEE8" stroke-width="2" stroke-linecap="round"/>`;
      // plus de badge d’animateur
      if (false) s += `<path d="M${hx - 15},${shY - 1} Q${hx - 8},${shY + 26} ${hx},${shY + 34} Q${hx + 8},${shY + 26} ${hx + 15},${shY - 1}" fill="none" stroke="#0B4F84" stroke-width="3" stroke-linecap="round"/>`
        + `<g transform="rotate(-4,${hx},${shY + 44})"><rect x="${hx - 9}" y="${shY + 33}" width="18" height="23" rx="3" fill="${fill("#F7F7F5", "r", .04, -.1)}"/><rect x="${hx - 9}" y="${shY + 33}" width="18" height="6" rx="2" fill="#E2702A"/><rect x="${hx - 6}" y="${shY + 42}" width="12" height="2" rx="1" fill="#9AA3AB"/><rect x="${hx - 6}" y="${shY + 46}" width="8" height="2" rx="1" fill="#C3CAD0"/></g>`;
      for (const sg of [-1, 1]) {
        s += E(hx + sg * (R - 1), hy + 2, 5.4, 7.6, fill(skin, "r", .08, -.16)) + E(hx + sg * (R - 1.4), hy + 2.5, 2.2, 3.6, tone(skin, -.16));
        if (sp.earring) s += E(hx + sg * (R - 1), hy + 10.5, 1.9, 1.9, "#E8C35A");
      }
      s += E(hx, hy + 1, R, R + 3, fill(skin, "r", .14, -.14));
      s += E(hx - 16, hy + 12, 7, 4, "#F07F74", ' opacity=".26"') + E(hx + 16, hy + 12, 7, 4, "#F07F74", ' opacity=".26"');
      s += facial(sp, hx, hy);
      s += `<g class="cmouth">${mouth(hx, hy, skin, mood)}</g>`;
      s += `<g class="ceyes">${eyes(hx, hy, skin, mood, sp.glasses, EYES[sp.eyes] || EYES.marron)}</g>`;
      s += brows(hx, hy, sp.hair === "chauve" ? HAIR.gris : hairCol(sp), mood, 5.4);
      s += nose(hx, hy, skin, sp.nose || 1);
      s += hairFront(sp, hx, hy, R);
      if (sp.bow) s += E(hx + R - 6, hy - R + 4, 6, 4, sp.bow, ` transform="rotate(-30,${hx + R - 6},${hy - R + 4})"`) + E(hx + R - 12, hy - R + 1, 6, 4, sp.bow, ` transform="rotate(30,${hx + R - 12},${hy - R + 1})"`);
      if (sp.headband) s += `<path d="M${hx - R + 2},${hy - 12} Q${hx},${hy - R - 10} ${hx + R - 2},${hy - 12}" fill="none" stroke="${sp.headband}" stroke-width="4.4" stroke-linecap="round"/>`;
      return `<svg class="char clay" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g>${s}</g></svg>`;
    }
    function mini(sp, pose) {
      const k = 1, skin = SKIN[sp.skin] || SKIN.claire, top = sp.top || "#3C6FB8", legs = "#3E4A5C", hc = hairCol(sp);
      let s = E(0, 0, 9, 2.6, "#000", ' opacity=".18"');
      const lx = 3.2, sit = pose === "sit";
      if (sit) {
        const kx = -7.6, ky = 4.4;
        [lx, -lx].forEach((h, j) => { const col = j === 0 ? tone(legs, -.12) : legs; s += `<path d="M${f1(h)},${f1(-12)} L${f1(h + kx)},${f1(-12 + ky)} L${f1(h + kx)},${f1(ky - .6)}" stroke="${col}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` + E(h + kx - 1.4, ky - .2, 2.8, 1.5, "#2A2A2A"); });
        s += `<g transform="translate(0,2)">`;
      } else if (pose === "walk") s += `<path d="M${-lx},-16 L${-lx - 3},0 M${lx},-16 L${lx + 2.5},0" stroke="${legs}" stroke-width="4.6" stroke-linecap="round"/>`;
      else s += `<path d="M${-lx},-16 L${-lx},0 M${lx},-16 L${lx},0" stroke="${legs}" stroke-width="4.6" stroke-linecap="round"/>`;
      if (!sit) s += E(-lx - .6, -.6, 2.8, 1.6, "#2A2A2A") + E(lx + .6, -.6, 2.8, 1.6, "#2A2A2A");
      s += P(`M-8,-14 Q-9,-30 0,-31 Q9,-30 8,-14Z`, fill(top, "r", .16, -.2));
      let arm = { stand: [[-8, -27, -10, -15], [8, -27, 10, -15]], walk: [[-8, -27, -11, -16], [8, -27, 11, -17]], wave: [[-8, -27, -10, -15], [8, -27, 14, -38]], point: [[-8, -27, -10, -15], [8, -27, 17, -27]], talk: [[-8, -27, -12, -18], [8, -27, 13, -21]] }[pose] || [[-8, -27, -10, -15], [8, -27, 10, -15]];
      if (sit) arm = [[-8, -27, -9, -17], [8, -27, 9, -17]];
      arm.forEach(([x0, y0, x1, y1], j) => { s += `<g class="${j === 1 ? "marm" : "marml"}" style="transform-origin:${x0}px ${y0}px"><path d="M${x0},${y0} L${x1},${y1}" stroke="${tone(top, -.08)}" stroke-width="4.2" stroke-linecap="round"/>${E(x1, y1, 2.2, 2.2, skin)}</g>`; });
      s += `<path d="M-4,-29 L0,-22 L4,-29" stroke="#0B4F84" stroke-width="1" fill="none"/><rect x="-1.6" y="-22.5" width="3.2" height="4" rx=".6" fill="#E2702A"/>`;
      const hy = -38, R = 7.6;
      s += `<rect x="-2" y="${f1(hy + R - 1.5)}" width="4" height="3.4" rx="1.2" fill="${tone(skin, -.1)}"/>`;   // cou
      s += `<g class="mhead" style="transform-origin:0px ${f1(hy + R)}px">`;
      s += E(-R + .2, hy + .6, 1.6, 2, tone(skin, -.04)) + E(R - .2, hy + .6, 1.6, 2, tone(skin, -.04));   // oreilles
      if (["long", "ondule", "tresses", "carre"].includes(sp.hair)) s += P(`M${-R - 1},${hy} Q${-R - 2},${hy + 12} ${-R + 1},${hy + 13} L${R - 1},${hy + 13} Q${R + 2},${hy + 12} ${R + 1},${hy}Z`, fill(hc));
      s += E(0, hy, R, R * 1.06, fill(skin, "r", .16, -.14));
      s += E(-2.6, hy - .2, 1.05, 1.25, "#1A120D") + E(2.6, hy - .2, 1.05, 1.25, "#1A120D") + E(-2.9, hy - .7, .34, .34, "#fff") + E(2.3, hy - .7, .34, .34, "#fff")
        + E(-4.6, hy + 2.6, 1.5, .85, "#F07F74", ' opacity=".35"') + E(4.6, hy + 2.6, 1.5, .85, "#F07F74", ' opacity=".35"') + E(.2, hy + 2.2, .9, .7, tone(skin, -.12), ' opacity=".5"');
      s += `<g class="mbrow"><path d="M-3.9,${f1(hy - 2.9)} q1.4,-.9 2.8,-.2 M1.1,${f1(hy - 3.1)} q1.4,-.7 2.8,.2" stroke="${tone(hc, -.05)}" stroke-width=".75" stroke-linecap="round" fill="none"/></g>`;
      if (sp.barbe) s += P(`M${f1(-R + .3)},${f1(hy + .6)} Q${f1(-R + .6)},${f1(hy + R + .6)} 0,${f1(hy + R * 1.08)} Q${f1(R - .6)},${f1(hy + R + .6)} ${f1(R - .3)},${f1(hy + .6)} Q${f1(R - 1.6)},${f1(hy + 4.4)} 2.6,${f1(hy + 4.6)} Q0,${f1(hy + 7.3)} -2.6,${f1(hy + 4.6)} Q${f1(-R + 1.6)},${f1(hy + 4.4)} ${f1(-R + .3)},${f1(hy + .6)}Z`, hc, ' opacity=".82"');
      s += `<ellipse class="mmouth" cx="0" cy="${f1(hy + 5.2)}" rx="1.7" ry=".7" fill="#6A2E26" stroke="${tone(skin, .12)}" stroke-width=".25" style="transform-origin:0px ${f1(hy + 5.2)}px"/>`;
      const st0 = sp.hair || "court";
      if (st0 !== "chauve") {
        s += P(`M${-R - .8},${hy - .5} Q${-R},${hy - R - 3} 0,${f1(hy - R - 2.4)} Q${R},${hy - R - 3} ${R + .8},${hy - .5} Q${R - 3},${hy - R + 2} 0,${f1(hy - R + 2.6)} Q${-R + 3},${hy - R + 2} ${-R - .8},${hy - .5}Z`, fill(hc));
        if (st0 === "chignon") s += E(0, hy - R - 2.6, 3.6, 3.2, fill(hc));
        if (st0 === "boucles") for (const [x, y] of [[-6, 1], [-3, -2], [1, -2.6], [5, -1], [7, 2]]) s += E(x, hy - R + y, 2.8, 2.8, fill(hc));
        if (st0 === "herisse") for (const x of [-5, -2, 1, 4]) s += E(x, hy - R - 1, 1.6, 3, fill(hc));
        if (st0 === "couettes") s += E(-R - 2, hy, 2.6, 3.4, fill(hc)) + E(R + 2, hy, 2.6, 3.4, fill(hc));
      } else s += E(-R + .5, hy - 1, 2, 3.4, fill(HAIR.gris)) + E(R - .5, hy - 1, 2, 3.4, fill(HAIR.gris));
      if (sp.glasses) s += `<path d="M-5,${f1(hy - .4)} h4 M1,${f1(hy - .4)} h4" stroke="#2E2A28" stroke-width=".9"/>`;
      s += "</g>" + (sit ? "</g>" : "");
      return `<g class="clayp"><g>${s}</g></g>`;
    }
    // Modèles de départ : les 4 personnages prédéfinis (mêmes réglages que kit/game_assets.py)
    const PRESETS = [
      { skin: "brune", hair: "tresses", hc: "noir", top: "#2F8F8A", cut: "pull", eyes: "marron", nose: 1 },
      { skin: "claire", hair: "court", hc: "chatain", top: "#3C6FB8", cut: "sweat", eyes: "marron", nose: 1 },
      { skin: "doree", hair: "boucles", hc: "brun", top: "#5E8A4E", cut: "pull", glasses: "rondes", eyes: "marron", nose: 1 },
      { skin: "ebene", hair: "rase", hc: "noir", top: "#E0A63A", cut: "pull", eyes: "marron", nose: 1 },
    ];
    let cacheKey = "", cache = null;
    const POSES = ["stand", "talk", "wave", "walk", "point", "sit"];
    function you() {   // portrait + figurines du personnage du joueur (mis en cache tant que les réglages ne changent pas)
      const sp = st.look; if (!sp) return null;
      const key = JSON.stringify(sp);
      if (key !== cacheKey) { cacheKey = key; cache = { bust: bust(sp), big: bust(sp, "big"), minis: Object.fromEntries(POSES.map((p) => [p, mini(sp, p)])) }; A.minis.avc = cache.minis; }
      return cache;
    }
    return { SKIN, HAIR, EYES, PRESETS, bust, mini, you };
  })();
  // Portrait et figurine du joueur : le personnage créé s’il existe, sinon l’avatar prédéfini.
  function youBust(big) { if (typeof RIG !== "undefined" && st.look) return RIG.bust(RIG.specOfLook(st.look)); const y = LOOK.you(); return y ? (big ? y.big : y.bust) : (big ? A.avatarsBig : A.avatars)[st.av]; }
  function youKey() { return LOOK.you() ? "avc" : "av" + st.av; }

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
  const HOME_STAGE = { at: "entree", cast: [["parent", "a", "walk"], ["petit", "b", "wave"], ["nour", "d", "wave"], ["sacha", "c", "walk"], ["zoe", "e"], ["kevin", "f", "talk"]] };
  // Hautes herbes de nuit (comme l’affiche du jeu) : brins lumineux qui ondulent, lucioles.
  function nightGrass(N) {
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const C = [["#2B6FD6", "#7FB0FF"], ["#8A4FD0", "#C59BFF"], ["#E2702A", "#FFB37A"]];
    let defs = "", blades = "", flies = "";
    C.forEach(([a, b], i) => { defs += `<linearGradient id="gb${i}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${a}" stop-opacity="0"/><stop offset=".45" stop-color="${a}" stop-opacity=".75"/><stop offset="1" stop-color="${b}" stop-opacity=".95"/></linearGradient>`; });
    for (let i = 0; i < N; i++) {
      const x = 40 + rnd() * 1360, h = 260 + rnd() * 560, lean = (rnd() - .45) * 220, w = 3 + rnd() * 9, c = (rnd() * 3) | 0;
      const y0 = 920, y1 = y0 - h, cx = x + lean * .25, cy = y0 - h * .55;
      blades += `<path class="bl" style="--d:${(5 + rnd() * 5).toFixed(2)}s;--dl:${(-rnd() * 6).toFixed(2)}s;--a:${(1.2 + rnd() * 2.2).toFixed(2)}deg;opacity:${(.35 + rnd() * .55).toFixed(2)}" d="M${x.toFixed(0)} ${y0} Q${cx.toFixed(0)} ${cy.toFixed(0)} ${(x + lean).toFixed(0)} ${y1.toFixed(0)}" stroke="url(#gb${c})" stroke-width="${w.toFixed(1)}" stroke-linecap="round" fill="none"/>`;
    }
    for (let i = 0; i < 14; i++) flies += `<circle class="fly" cx="${(80 + rnd() * 1280).toFixed(0)}" cy="${(260 + rnd() * 560).toFixed(0)}" r="${(1.6 + rnd() * 2.2).toFixed(1)}" style="--d:${(6 + rnd() * 6).toFixed(2)}s;--dl:${(-rnd() * 8).toFixed(2)}s;--fx:${((rnd() - .5) * 90).toFixed(0)}px;--fy:${(-30 - rnd() * 70).toFixed(0)}px"/>`;
    return `<svg class="ngrass" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice"><defs>${defs}</defs><g class="blades">${blades}</g><g class="flies">${flies}</g></svg>`;
  }
  function home() {
    if (DC.el) DC.el.hidden = true;
    // l'accueil de loisirs, en vrai, derrière le titre : le matin, les familles arrivent
    // Accueil : la nuit sur les hautes herbes (plus de décor en 3D derrière le titre)
    World.init();
    if (World.el) { World.el.classList.remove("on"); World.cur = null; }
    document.body.classList.remove("live", "athome", "grave", "scene");
    hud(false);
    Snd.setMood("home");
    stage.innerHTML = "";
    const prev = load();
    const canResume = prev && (prev.idx > 0 || prev.done);
    const n = el("section", { class: "screen home in", "aria-labelledby": "h-home" });
    n.classList.add("home2");
    n.innerHTML = `<div class="hbg" aria-hidden="true"><i class="glow g1"></i><i class="glow g2"></i>${nightGrass(innerWidth < 700 ? 26 : 46)}</div>
      <a class="hback" href="../index.html"><span aria-hidden="true">←</span> Retour au site</a>
      <div class="hero"><div class="logo" role="img" aria-label="Fourmi’Action"></div>
      <p class="hk">Jeu sérieux · Formation BAFA · BAFD</p>
      <h1 id="h-home"><span class="w w1">Les</span> <span class="w w2">Hautes</span> <span class="w w3">Herbes</span></h1>
      <p class="hook">Cinq journées. Quarante-huit enfants. Et des moments où tout se joue.</p>
      <p class="tag">Une semaine dans un accueil de loisirs, une suite de décisions professionnelles : repérer, protéger, alerter et prévenir les violences sexistes et sexuelles en accueil collectif de mineurs.</p>
      <div class="meta"><span>Environ 40 minutes</span><span>5 journées</span><span>Progression enregistrée</span></div>

      <div class="hbtns"></div>
      <p class="small warn">Situations fictives, sans aucune représentation de violence : niveaux Adulte et Expert pour les adultes en formation, niveau Enfants dès 9 ans, idéalement avec un adulte. Vous pouvez faire une pause à tout moment. Si ce sujet vous touche personnellement, le 119 (moins de 18 ans), le 3919 ou France Victimes (116 006) peuvent vous écouter.</p>
      <p class="small lic">Jeu gratuit offert par Fourmi’Action · © Fourmi’Action 2026, tous droits réservés · à citer : « Les Hautes Herbes, un jeu Fourmi’Action ».</p></div>
`;
    const hb = n.querySelector(".hbtns");
    // Musique et voix : toujours lancées au début d’une partie (pas de choix sur l’accueil ; on peut les couper en jeu)
    const allOn = () => { st.settings.sound = true; st.settings.voice = true; applySettings(); save(); };
    st.settings.sound = true; st.settings.voice = true;
    if (canResume) {
      const sc = SCREENS[prev.idx];
      hb.appendChild(btn(prev.done ? "Revoir mon bilan" : `Reprendre · ${CHAPTERS[sc.ch - 1].day.toLowerCase()}`, () => { st = prev; st.settings = st.settings || { calm: false }; allOn(); begin(); if (prev.done) go(SCREENS.length - 1); else go(prev.idx); }));
      hb.appendChild(btn("Nouvelle partie", () => { allOn(); begin(); restart(); }, "ghost light"));
    } else hb.appendChild(btn("Commencer", () => { allOn(); begin(); prelude(() => go(0)); }));
    // Le classement, toujours visible sur l’accueil (sans bouton à ouvrir)
    const rk = el("aside", { class: "hrank", "aria-labelledby": "hr-h" });
    rk.innerHTML = `<p class="hr-k">Classement des joueurs</p><h2 id="hr-h" class="hr-h">Le podium</h2><ol class="hr-list"><li class="hr-wait">Chargement…</li></ol><p class="hr-foot"></p>`;
    // ordinateur : à droite, sur les herbes ; téléphone et tablette : juste sous le bouton « Commencer »
    const mq = matchMedia("(max-width: 960px)"), place = () => { if (mq.matches) hb.after(rk); else n.appendChild(rk); };
    place(); try { mq.addEventListener("change", place); } catch (e) { }
    const hrow = (e) => `<li class="p${e.rang}"><span class="hr-r">${e.rang}</span><span class="hr-p">${esc(e.pseudo)}${expTag(e)}${e.defi ? ' <i aria-label="défi relevé">★</i>' : ""}</span><b class="hr-s">${e.score}</b></li>`;
    const hlist = (top) => (top && top.length ? top.slice(0, 10).map(hrow).join("") : `<li class="hr-wait">Personne n’est encore classé. Terminez la semaine pour inscrire votre pseudo en tête.</li>`);
    rk.innerHTML = `<p class="hr-k">Classement des joueurs</p><h2 id="hr-h" class="hr-h">Les podiums</h2>
      <div class="rk-tabs hr-tabs" role="tablist" aria-label="Podiums"><button type="button" role="tab" class="rk-tab on" aria-selected="true" aria-controls="hrp-adultes">Adultes</button><button type="button" role="tab" class="rk-tab" aria-selected="false" aria-controls="hrp-enfants">Enfants</button></div>
      <div class="rk-pane" role="tabpanel" id="hrp-adultes"><ol class="hr-list"><li class="hr-wait">Chargement…</li></ol></div><div class="rk-pane" role="tabpanel" id="hrp-enfants" hidden><ol class="hr-list"><li class="hr-wait">Chargement…</li></ol></div><p class="hr-foot"></p>`;
    wireTabs(rk);
    fetch("/api/classement", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((j) => {
      j = norm2(j) || { adultes: [], enfants: [], total: 0 };
      rk.querySelector("#hrp-adultes .hr-list").innerHTML = hlist(j.adultes); rk.querySelector("#hrp-enfants .hr-list").innerHTML = hlist(j.enfants);
      rk.querySelector(".hr-foot").innerHTML = (hasFict(j) ? "Premiers scores : profils fictifs, à battre. " : "") + (j.total ? `${j.total} partie${j.total > 1 ? "s" : ""} classée${j.total > 1 ? "s" : ""}` : "");
    }).catch(() => { rk.querySelectorAll(".hr-list").forEach((l) => { l.innerHTML = `<li class="hr-wait">Le classement n’est pas disponible pour le moment.</li>`; }); });
    stage.appendChild(n);
    setTimeout(() => n.querySelector(".hbtns button").focus({ preventScroll: true }), 50);
  }
  // Le son et la musique démarrent d'eux-mêmes au premier geste (les navigateurs interdisent le son avant)
  const GESTES = ["pointerup", "touchend", "click", "keydown"]; let begun = false;
  const firstGesture = () => {   // gestes autorisés par iPhone et Android pour lancer le son ; on réessaie tant qu’il n’est pas lancé
    if (st.settings.sound === undefined) st.settings.sound = true;
    if (!st.settings.sound) return;
    Snd.unlock && Snd.unlock();
    if (!begun) { begun = true; begin(); } else { Snd.init(); try { if (Snd.ctx && Snd.ctx.state !== "running") Snd.ctx.resume(); } catch (e) { } Snd.startAmb(); }
    if (Snd.ctx && Snd.ctx.state === "running") GESTES.forEach((ev) => document.removeEventListener(ev, firstGesture, true));
  };
  GESTES.forEach((ev) => document.addEventListener(ev, firstGesture, true));
  // Dès l’arrivée sur l’accueil : on essaie de lancer la musique sans attendre de geste.
  // Chrome, Edge et Android l’autorisent quand on arrive depuis un clic sur le site (« Jouer ») ;
  // Safari (iPhone, Mac) l’interdit toujours : la musique part alors au premier toucher, n’importe où.
  function autoStart() {
    if (begun || st.settings.sound === false) return;
    Snd.init(); if (!Snd.ctx) return;
    const ok = () => { if (begun || Snd.ctx.state !== "running") return; begun = true; Snd.startAmb(); GESTES.forEach((ev) => document.removeEventListener(ev, firstGesture, true)); };
    try { const p = Snd.ctx.resume(); if (p && p.then) p.then(ok, () => { }); } catch (e) { }
    ok(); setTimeout(ok, 120);
  }
  try { if (navigator.getAutoplayPolicy && navigator.getAutoplayPolicy("audiocontext") === "disallowed") { /* le premier geste s’en chargera */ } else autoStart(); } catch (e) { autoStart(); }
  function begin() { Snd.init(); try { if (Snd.ctx && Snd.ctx.state !== "running") Snd.ctx.resume(); } catch (e) { } Snd.startAmb(); Snd.good(); }

  // Consigne plein écran à l'arrivée : activer le son (à l'écran et à l'oral). Le bouton sert aussi de « geste » pour lancer la musique.
  function soundGate() {
    if (sessionStorage.getItem("hh-son")) return;
    const g = el("div", { class: "sgate", role: "dialog", "aria-modal": "true", "aria-labelledby": "sg-h" },
      `<div class="sg-in"><span class="sg-ic" aria-hidden="true"><i></i><i></i><i></i></span><h2 id="sg-h">Activez le son</h2><p>${esc(ECHOES.son)}</p><p class="sg-small">Un casque ou des écouteurs, c’est encore mieux.</p>
       <div class="sg-b"><button type="button" class="cta sg-on">Activer le son</button><button type="button" class="btn ghost sg-off">Continuer sans le son</button></div></div>`);
    const close = () => { sessionStorage.setItem("hh-son", "1"); g.classList.add("out"); setTimeout(() => g.remove(), 600); const b = document.querySelector(".hbtns button"); if (b) b.focus({ preventScroll: true }); };
    g.querySelector(".sg-on").addEventListener("click", () => {
      st.settings.sound = true; st.settings.voice = true; save(); applySettings && applySettings();
      begin(); Voice.say("narr", ECHOES.son);
      g.querySelector(".sg-on").textContent = "Le son est activé"; setTimeout(close, 1400);
    });
    g.querySelector(".sg-off").addEventListener("click", () => { close(); });
    document.body.appendChild(g); requestAnimationFrame(() => g.classList.add("in"));
    g.querySelector(".sg-on").focus();
    // si le navigateur autorise déjà le son, la consigne est aussi dite tout de suite
    setTimeout(() => { if (Snd.ctx && Snd.ctx.state === "running") { const pr = Voice.say("narr", ECHOES.son); } }, 600);
  }

  applySettings();
  home();
  soundGate();
  window.__game = { st: () => st, go, SCREENS };
})();
