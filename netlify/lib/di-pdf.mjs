/*
 * Fourmi'Action · PDF de l'autorisation signée (pdf-lib, polices standard).
 * Pages : texte intégral de l'autorisation, identification et signatures,
 * puis certificat de preuve (journal horodaté). Pagination « Page X sur Y ».
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { TEXTE } from "./di-texte.mjs";
import { LOGO_PNG_BASE64 } from "./di-logo.mjs";

const A4 = [595.28, 841.89];
const M = { l: 48, r: 48, t: 52, b: 58 };
const NAVY = rgb(0.078, 0.184, 0.275), INK = rgb(0.16, 0.2, 0.25), MUTED = rgb(0.38, 0.43, 0.49);
const SOFT = rgb(0.55, 0.6, 0.65), LINE = rgb(0.85, 0.88, 0.91), BLUE = rgb(0.17, 0.36, 0.84), ORANGE = rgb(0.85, 0.4, 0.12);
const PALE = rgb(0.955, 0.962, 0.973), GREEN = rgb(0.1, 0.55, 0.3), RED = rgb(0.75, 0.2, 0.15);

// WinAnsi : on remplace ce que les polices standard ne savent pas écrire.
const MAP = { " ": " ", " ": " ", " ": " ", "‑": "-", "−": "-", "→": "->", "✓": "v", "✗": "x", "≥": ">=", "≤": "<=" };
const WIN = new Set([..."€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ"]);
export function safe(s) {
  return String(s ?? "").normalize("NFC").replace(/[\u0000-\u001f]/g, " ").split("").map((c) => {
    if (MAP[c] !== undefined) return MAP[c];
    const n = c.charCodeAt(0);
    if (n < 0x7f || (n >= 0xa0 && n <= 0xff) || WIN.has(c)) return c;
    return "?";
  }).join("");
}

const fmtParis = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d);
  return p.replace(",", " à") + " (heure de Paris)";
};
const fmtDate = (iso) => iso ? new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso)) : "";
const ROLE = { jeune: "Le jeune", rl1: "Représentant légal 1", rl2: "Représentant légal 2" };
export const roleLabel = (r) => ROLE[r] || r;

export async function buildPdf(dossier, { proofHash }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(safe(`${TEXTE.titre} · ${dossier.jeune.prenom} ${dossier.jeune.nom}`));
  pdf.setAuthor("Fourmi’Action"); pdf.setCreator("Fourmi’Action"); pdf.setProducer("Fourmi’Action");
  pdf.setSubject(safe(`Réf. ${TEXTE.ref} · dossier ${dossier.id}`));
  pdf.setCreationDate(new Date(dossier.final.at)); pdf.setModificationDate(new Date(dossier.final.at));
  const F = await pdf.embedFont(StandardFonts.Helvetica), B = await pdf.embedFont(StandardFonts.HelveticaBold), O = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const logo = await pdf.embedPng(Uint8Array.from(Buffer.from(LOGO_PNG_BASE64, "base64")));

  let page, y;
  const W = A4[0] - M.l - M.r;
  const newPage = () => { page = pdf.addPage(A4); y = A4[1] - M.t; };
  const need = (h) => { if (y - h < M.b) newPage(); };
  const lines = (text, font, size, width) => {
    const out = []; for (const para of safe(text).split("\n")) {
      let cur = ""; for (const w of para.split(" ")) {
        const t = cur ? cur + " " + w : w;
        if (font.widthOfTextAtSize(t, size) > width && cur) { out.push(cur); cur = w; } else cur = t;
      } out.push(cur);
    } return out;
  };
  const para = (text, { font = F, size = 8.6, color = INK, lh = 1.42, x = M.l, width = W, gap = 4 } = {}) => {
    for (const l of lines(text, font, size, width)) { need(size * lh); page.drawText(l, { x, y: y - size, size, font, color }); y -= size * lh; }
    y -= gap;
  };

  // ---- Page 1 : en-tête et texte intégral
  newPage();
  const lw = 150, lh = lw * logo.height / logo.width;
  page.drawImage(logo, { x: M.l, y: y - lh, width: lw, height: lh });
  page.drawText(safe(`Réf. ${TEXTE.ref}`), { x: A4[0] - M.r - F.widthOfTextAtSize(safe(`Réf. ${TEXTE.ref}`), 7.5), y: y - 8, size: 7.5, font: F, color: SOFT });
  const did = `Dossier ${dossier.id}`;
  page.drawText(did, { x: A4[0] - M.r - F.widthOfTextAtSize(did, 7.5), y: y - 18, size: 7.5, font: F, color: SOFT });
  y -= lh + 22;
  page.drawText(safe(TEXTE.sousTitre.toUpperCase()), { x: M.l, y, size: 7.5, font: B, color: ORANGE }); y -= 24;
  page.drawText(safe(TEXTE.titre), { x: M.l, y, size: 20, font: B, color: NAVY }); y -= 22;
  page.drawText(safe("Exemplaire signé électroniquement"), { x: M.l, y, size: 9, font: F, color: BLUE }); y -= 18;
  // Introduction dans un encadré
  const il = lines(TEXTE.intro, F, 8.6, W - 20);
  const ih = il.length * 8.6 * 1.42 + 16;
  page.drawRectangle({ x: M.l, y: y - ih, width: W, height: ih, color: PALE });
  let yy = y - 11; for (const l of il) { page.drawText(l, { x: M.l + 10, y: yy - 8.6, size: 8.6, font: F, color: INK }); yy -= 8.6 * 1.42; }
  y -= ih + 12;
  for (const s of TEXTE.sections) {
    need(40);
    page.drawText(safe(s.h), { x: M.l, y: y - 10, size: 10, font: B, color: NAVY }); y -= 16;
    for (const p of s.p) para(p, { color: INK });
    y -= 4;
  }

  // ---- Identification, choix et signatures
  newPage();
  const h2 = (t) => { need(30); page.drawText(safe(t), { x: M.l, y: y - 13, size: 13, font: B, color: NAVY }); y -= 24; };
  const kv = (k, v) => { need(14); page.drawText(safe(k), { x: M.l, y: y - 8.6, size: 8.6, font: F, color: MUTED }); page.drawText(safe(v || "—"), { x: M.l + 150, y: y - 8.6, size: 8.6, font: B, color: INK }); y -= 14; };
  h2("Le jeune");
  kv("Nom et prénom", `${dossier.jeune.prenom} ${dossier.jeune.nom}`);
  kv("Date de naissance", fmtDate(dossier.jeune.naissance + "T12:00:00Z"));
  kv("Adresse électronique", dossier.jeune.email);
  y -= 8;
  h2("Autorité parentale");
  const aut = TEXTE.autorite.find((a) => a.id === dossier.autorite);
  para(aut ? aut.texte : dossier.autorite, { font: B, size: 9 });
  y -= 6;
  h2("Choix et signatures");
  para("Pour chaque choix, la réponse la plus protectrice s’applique : un seul « Non » suffit à refuser.", { size: 8.4, color: MUTED });
  for (const s of dossier.signers) {
    const boxH = 128; need(boxH + 10);
    const top = y;
    page.drawRectangle({ x: M.l, y: top - boxH, width: W, height: boxH, borderColor: LINE, borderWidth: 0.8, color: rgb(1, 1, 1) });
    page.drawText(safe(roleLabel(s.role).toUpperCase()), { x: M.l + 12, y: top - 18, size: 7.2, font: B, color: ORANGE });
    page.drawText(safe(`${s.prenom} ${s.nom}`), { x: M.l + 12, y: top - 33, size: 11, font: B, color: NAVY });
    const sub = [s.role !== "jeune" ? s.qualite : null, s.email].filter(Boolean).join(" · ");
    page.drawText(safe(sub), { x: M.l + 12, y: top - 46, size: 8, font: F, color: MUTED });
    let cy = top - 66;
    for (const c of TEXTE.choix) {
      const v = s.choix?.[c.id];
      page.drawText(safe(`Choix ${c.id} · ${c.titre}`), { x: M.l + 12, y: cy, size: 8.6, font: F, color: INK });
      page.drawText(v ? "OUI" : "NON", { x: M.l + 160, y: cy, size: 8.6, font: B, color: v ? GREEN : RED });
      cy -= 15;
    }
    if (s.attestSeul) { page.drawText(safe("Déclaration sur l’honneur : exerce seul(e) l’autorité parentale ou tutelle."), { x: M.l + 12, y: cy, size: 7.2, font: O, color: MUTED }); cy -= 11; }
    page.drawText(safe(`Signé le ${fmtParis(s.signedAt)}`), { x: M.l + 12, y: top - boxH + 12, size: 7.4, font: F, color: MUTED });
    // Signature dessinée, tracée en vecteurs dans un cadre 210 × 90
    const fx = M.l + W - 222, fy = top - boxH + 12, fw = 210, fh = 100;
    page.drawRectangle({ x: fx, y: fy, width: fw, height: fh, borderColor: LINE, borderWidth: 0.6, borderDashArray: [3, 2] });
    drawSignature(page, s.strokes, fx + 6, fy + 6, fw - 12, fh - 12);
    y = top - boxH - 10;
  }
  const eff = dossier.final.choix;
  need(70);
  const ey = y;
  page.drawRectangle({ x: M.l, y: ey - 58, width: W, height: 58, color: rgb(0.11, 0.11, 0.12) });
  page.drawText("AUTORISATION EFFECTIVE", { x: M.l + 14, y: ey - 18, size: 7.4, font: B, color: rgb(1, 0.7, 0.48) });
  let ex = M.l + 14;
  for (const c of TEXTE.choix) {
    const t = safe(`${c.id} · ${c.titre} : ${eff[c.id] ? "autorisé" : "refusé"}`);
    page.drawText(t, { x: ex, y: ey - 38, size: 10.5, font: B, color: rgb(1, 1, 1) }); ex += B.widthOfTextAtSize(t, 10.5) + 30;
  }
  page.drawText(safe(`Effet : ${fmtDate(dossier.final.at)} · publication jusqu’au ${fmtDate(dossier.final.finPublication)} · majorité du jeune le ${fmtDate(dossier.final.majorite + "T12:00:00Z")}`),
    { x: M.l + 14, y: ey - 51, size: 7.2, font: F, color: rgb(0.8, 0.82, 0.85) });
  y = ey - 70;

  // ---- Certificat de preuve
  newPage();
  h2("Certificat de signature électronique");
  para("Ce certificat récapitule les étapes enregistrées par le service de signature de Fourmi’Action. Chaque signataire a accédé au document par un lien personnel envoyé à son adresse électronique, a confirmé cette adresse par un code à usage unique, a exprimé ses choix puis a signé. Il s’agit d’une signature électronique simple au sens du règlement (UE) n° 910/2014 (eIDAS).", { size: 8.4, color: MUTED });
  y -= 4;
  kv("Référence du document", TEXTE.ref);
  kv("Empreinte du texte signé", TEXTE.empreinte.slice(0, 32));
  kv("", TEXTE.empreinte.slice(32));
  kv("Dossier", dossier.id);
  kv("Créé le", fmtParis(dossier.createdAt));
  kv("Finalisé le", fmtParis(dossier.final.at));
  kv("Empreinte des données signées", proofHash.slice(0, 32));
  kv("", proofHash.slice(32));
  y -= 6;
  h2("Signataires");
  for (const s of dossier.signers) {
    need(56);
    para(`${roleLabel(s.role)} · ${s.prenom} ${s.nom} · ${s.email}`, { font: B, size: 8.6, gap: 1 });
    para(`Adresse confirmée par code le ${fmtParis(s.emailVerifiedAt)} · signé le ${fmtParis(s.signedAt)}`, { size: 7.8, color: MUTED, gap: 1 });
    para(`Adresse IP ${maskIp(s.ip)} · ${shortUa(s.ua)}`, { size: 7.8, color: MUTED, gap: 6 });
  }
  if (dossier.final.alertes?.length) {
    h2("Points de vigilance");
    for (const a of dossier.final.alertes) para("• " + a, { size: 8.2, color: ORANGE, gap: 2 });
    y -= 4;
  }
  h2("Journal des étapes");
  for (const e of dossier.events) {
    need(12);
    page.drawText(safe(fmtParis(e.t).replace(" (heure de Paris)", "")), { x: M.l, y: y - 7.6, size: 7.6, font: F, color: MUTED });
    const txt = safe(`${e.role ? roleLabel(e.role) + " · " : ""}${e.label}`);
    for (const l of lines(txt, F, 7.6, W - 120)) { need(11); page.drawText(l, { x: M.l + 120, y: y - 7.6, size: 7.6, font: F, color: INK }); y -= 11; }
  }
  y -= 8;
  para("Heures exprimées à l’heure de Paris ; l’original horodaté en temps universel (UTC) est conservé dans le journal de preuve. L’empreinte SHA-256 du présent fichier PDF est communiquée à chaque signataire par e-mail et conservée par Fourmi’Action : toute modification du fichier la rendrait différente.", { size: 7.4, color: SOFT });

  // ---- Pagination
  const pages = pdf.getPages(), n = pages.length;
  pages.forEach((p, i) => {
    const t = `Page ${i + 1} sur ${n}`;
    p.drawText(t, { x: A4[0] - M.r - F.widthOfTextAtSize(t, 7.2), y: 28, size: 7.2, font: F, color: SOFT });
    p.drawText(safe(`Fourmi’Action · ${TEXTE.titre} · Réf. ${TEXTE.ref} · Dossier ${dossier.id}`), { x: M.l, y: 28, size: 7.2, font: F, color: SOFT });
  });
  return await pdf.save({ useObjectStreams: false });
}

function drawSignature(page, sig, x, y, w, h) {
  if (!sig?.s?.length) return;
  const sw = sig.w || 1, sh = sig.h || 1, k = Math.min(w / sw, h / sh);
  const ox = x + (w - sw * k) / 2, oy = y + (h - sh * k) / 2;
  for (const st of sig.s) {
    if (st.length < 2) continue;
    let d = `M ${(ox + st[0] * k).toFixed(2)} ${(A4[1] - (oy + (sh - st[1]) * k)).toFixed(2)}`;
    for (let i = 2; i < st.length; i += 2) d += ` L ${(ox + st[i] * k).toFixed(2)} ${(A4[1] - (oy + (sh - st[i + 1]) * k)).toFixed(2)}`;
    if (st.length === 2) d += ` L ${(ox + st[0] * k + 0.6).toFixed(2)} ${(A4[1] - (oy + (sh - st[1]) * k)).toFixed(2)}`;
    // drawSvgPath place l'origine en haut à gauche de la page : on passe y = hauteur de page.
    page.drawSvgPath(d, { x: 0, y: A4[1], borderColor: NAVY, borderWidth: 1.4, borderLineCap: 1 });
  }
}
export const maskIp = (ip) => {
  ip = String(ip || "");
  if (ip.includes(".")) return ip.split(".").slice(0, 3).join(".") + ".x";
  if (ip.includes(":")) return ip.split(":").slice(0, 3).join(":") + ":…";
  return "non disponible";
};
export const shortUa = (ua) => {
  ua = String(ua || "");
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "système inconnu";
  const br = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "navigateur inconnu";
  return `${br} sur ${os}`;
};
