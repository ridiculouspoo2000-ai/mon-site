/*
 * Fourmi'Action · Autorisation de droit à l'image et à la voix · fonction Netlify
 *
 * Chaque signataire (le jeune, un ou deux représentants légaux) reçoit un lien personnel,
 * confirme son adresse par un code à usage unique, exprime ses choix et signe à l'écran.
 * Quand toutes les signatures requises sont réunies, un PDF est produit, son empreinte
 * SHA-256 calculée, puis il est envoyé à chacun et conservé chiffré (Netlify Blobs).
 *
 * Variables d'environnement (Netlify > Site configuration > Environment variables) :
 *   DI_SECRET       clé de chiffrement des dossiers (longue chaîne aléatoire, à ne jamais changer)
 *   DI_ADMIN_KEY    mot de passe de l'espace de gestion
 *   SMTP_USER       fourmi.action@gmail.com
 *   SMTP_PASS       mot de passe d'application Google (16 caractères)
 *   DI_NOTIFY       adresse qui reçoit une copie des autorisations (par défaut SMTP_USER)
 */
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import { TEXTE } from "../lib/di-texte.mjs";
import { buildPdf, roleLabel, maskIp, shortUa } from "../lib/di-pdf.mjs";
import { sendMail, layout, mailConfigured, devMailbox } from "../lib/di-mail.mjs";

export const config = { path: "/api/droit-image" };

const env = (k, d = "") => (globalThis.Netlify?.env?.get?.(k) ?? process.env[k] ?? d);
const DAY = 86400e3, EXPIRE_DAYS = 30, OTP_TTL = 10 * 60e3, SESSION_TTL = 30 * 60e3;
const store = () => getStore({ name: "droit-image", consistency: "strong" });
const H = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });
const fail = (error, status = 400) => out({ ok: false, error }, status);
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const rnd = (n) => crypto.randomBytes(n).toString("base64url");
const now = () => new Date().toISOString();
const eqHash = (a, b) => { const x = Buffer.from(sha(String(a))), y = Buffer.from(sha(String(b))); return crypto.timingSafeEqual(x, y); };

// ---------- Chiffrement AES-256-GCM des dossiers et des PDF
const key = () => { const s = env("DI_SECRET"); if (s.length < 24) throw new Error("DI_SECRET manquant"); return crypto.createHash("sha256").update("fa-droit-image|" + s).digest(); };
const seal = (buf) => { const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", key(), iv); const ct = Buffer.concat([c.update(buf), c.final()]); return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64"); };
const open = (b64) => { const b = Buffer.from(b64, "base64"), d = crypto.createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28)); return Buffer.concat([d.update(b.subarray(28)), d.final()]); };
const putJ = (s, k, v) => s.set(k, seal(Buffer.from(JSON.stringify(v))));
const getJ = async (s, k) => { const v = await s.get(k); return v ? JSON.parse(open(v).toString("utf8")) : null; };

// ---------- Validation
const clean = (v, n = 80) => String(v ?? "").normalize("NFC").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const name = (v) => { v = clean(v, 60); return /^[\p{L}][\p{L}\p{M} '’.-]*$/u.test(v) ? v : null; };
const email = (v) => { v = clean(v, 120).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v) ? v : null; };
const age = (iso, at = new Date()) => { const d = new Date(iso + "T12:00:00Z"); let a = at.getUTCFullYear() - d.getUTCFullYear(); const m = at.getUTCMonth() - d.getUTCMonth(); if (m < 0 || (m === 0 && at.getUTCDate() < d.getUTCDate())) a--; return a; };
const addYears = (iso, n) => { const d = new Date(iso); d.setUTCFullYear(d.getUTCFullYear() + n); return d.toISOString(); };
function sigOk(sig) {
  if (!sig || typeof sig !== "object" || !Array.isArray(sig.s)) return null;
  const w = Math.round(+sig.w), h = Math.round(+sig.h);
  if (!(w > 50 && w <= 2400 && h > 30 && h <= 1600)) return null;
  let total = 0, length = 0; const s = [];
  for (const st of sig.s.slice(0, 300)) {
    if (!Array.isArray(st)) return null;
    const pts = st.slice(0, 4000).map((n) => Math.max(0, Math.min(Math.round(+n), 2400)));
    if (pts.some((n) => !Number.isFinite(n)) || pts.length % 2) return null;
    for (let i = 2; i < pts.length; i += 2) length += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
    total += pts.length; s.push(pts);
  }
  if (total > 24000 || length < Math.min(w, h) * 0.6) return null; // une signature, pas un simple point
  return { w, h, s };
}
const ipOf = (req, ctx) => clean(ctx?.ip || req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "", 45);
const uaOf = (req) => clean(req.headers.get("user-agent"), 300);

// ---------- Petits outils de stockage
async function event(s, id, role, label, req, ctx, type = "info") {
  const t = now();
  await putJ(s, `e/${id}/${t}-${rnd(3)}`, { t, type, role, label, ip: req ? ipOf(req, ctx) : "", ua: req ? uaOf(req) : "" });
}
async function events(s, id) {
  const { blobs } = await s.list({ prefix: `e/${id}/` });
  const all = await Promise.all(blobs.map((b) => getJ(s, b.key)));
  return all.filter(Boolean).sort((a, b) => a.t.localeCompare(b.t));
}
async function count(s, k, limit, ttlMs) {
  const v = (await s.get(k, { type: "json" })) || { n: 0, exp: Date.now() + ttlMs };
  if (v.exp < Date.now()) { v.n = 0; v.exp = Date.now() + ttlMs; }
  if (v.n >= limit) return false;
  v.n++; await s.setJSON(k, v); return true;
}
async function byToken(s, t) {
  t = clean(t, 64); if (t.length < 20) return null;
  const m = await s.get(`t/${sha(t)}`, { type: "json" }); if (!m) return null;
  const d = await getJ(s, `d/${m.id}`); if (!d) return null;
  const st = (await getJ(s, `s/${m.id}/${m.role}`)) || {};
  const fin = await getJ(s, `f/${m.id}`);
  if (!fin && Date.parse(d.createdAt) + EXPIRE_DAYS * DAY < Date.now()) { await wipe(s, m.id); return null; }
  return { d, role: m.role, st, fin, signer: d.signers.find((x) => x.role === m.role) };
}
async function wipe(s, id) {
  for (const p of [`e/${id}/`, `s/${id}/`]) { const { blobs } = await s.list({ prefix: p }); await Promise.all(blobs.map((b) => s.delete(b.key))); }
  const d = await getJ(s, `d/${id}`).catch(() => null);
  if (d?.tokens) await Promise.all(d.tokens.map((h) => s.delete(`t/${h}`)));
  await Promise.all([s.delete(`d/${id}`), s.delete(`f/${id}`), s.delete(`p/${id}`), s.delete(`w/${id}`)]);
}
const base = (req) => (env("DI_BASE_URL") || env("URL") || new URL(req.url).origin).replace(/\/$/, "");
const link = (req, t) => `${base(req)}/droit-image-signature.html#${t}`;
async function mail(s, msg) {
  if (!(await count(s, `q/mail/${now().slice(0, 10)}`, 450, DAY))) throw new Error("quota");
  return sendMail(msg);
}

// ---------- Actions publiques
async function start(req, ctx, b) {
  const s = store();
  if (clean(b.site)) return out({ ok: true }); // champ piège pour les robots
  if (!mailConfigured()) return fail("L’envoi des e-mails n’est pas encore configuré. Merci de contacter Fourmi’Action.", 503);
  const ipH = sha("ip|" + ipOf(req, ctx)).slice(0, 24);
  if (!(await count(s, `q/start/${ipH}`, 6, 3600e3)) || !(await count(s, `q/start-day`, 60, DAY))) return fail("Trop de demandes. Réessayez dans une heure.", 429);
  const autorite = ["deux", "seul", "tuteur"].includes(b.autorite) ? b.autorite : null;
  const j = b.jeune || {};
  const jeune = { nom: name(j.nom), prenom: name(j.prenom), naissance: /^\d{4}-\d{2}-\d{2}$/.test(j.naissance || "") ? j.naissance : null, email: email(j.email) };
  if (!autorite) return fail("Indiquez qui exerce l’autorité parentale.");
  if (!jeune.nom || !jeune.prenom) return fail("Indiquez le nom et le prénom du jeune.");
  if (!jeune.naissance || age(jeune.naissance) < 12 || age(jeune.naissance) >= 18) return fail("La date de naissance doit correspondre à un jeune mineur.");
  if (!jeune.email) return fail("Le jeune signe lui-même : indiquez son adresse électronique personnelle.");
  const rls = (Array.isArray(b.rl) ? b.rl : []).slice(0, autorite === "deux" ? 2 : 1).map((r) => ({ nom: name(r?.nom), prenom: name(r?.prenom), qualite: clean(r?.qualite, 40), email: email(r?.email) }));
  if (rls.length !== (autorite === "deux" ? 2 : 1) || rls.some((r) => !r.nom || !r.prenom || !r.email || !r.qualite)) return fail("Complétez l’identité, la qualité et l’adresse électronique de chaque représentant légal.");
  const emails = [jeune.email, ...rls.map((r) => r.email)];
  if (new Set(emails).size !== emails.length) return fail("Chaque signataire doit avoir sa propre adresse électronique : une même adresse ne peut pas servir à deux signatures.");
  if (!b.accepte) return fail("Confirmez avoir lu les informations.");

  const id = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + rnd(5).replace(/[-_]/g, "x").toUpperCase();
  const signers = [{ role: "jeune", nom: jeune.nom, prenom: jeune.prenom, qualite: "Le jeune", email: jeune.email }, ...rls.map((r, i) => ({ role: `rl${i + 1}`, ...r }))];
  const tokens = {}; for (const x of signers) tokens[x.role] = rnd(24);
  const d = { id, createdAt: now(), ref: TEXTE.ref, empreinte: TEXTE.empreinte, autorite, jeune, signers, tokens: Object.values(tokens).map(sha) };
  await putJ(s, `d/${id}`, d);
  await Promise.all(signers.map((x) => s.setJSON(`t/${sha(tokens[x.role])}`, { id, role: x.role })));
  await event(s, id, null, `Dossier créé depuis le formulaire en ligne (${autorite === "deux" ? "deux parents" : autorite === "seul" ? "un parent exerçant seul l’autorité parentale" : "tuteur"})`, req, ctx);
  await Promise.all(signers.map(async (x) => {
    const who = x.role === "jeune" ? "Bonjour " + x.prenom + "," : `Bonjour ${x.prenom} ${x.nom},`;
    const m = layout({
      title: "Autorisation de droit à l’image et à la voix",
      lines: [who, x.role === "jeune"
        ? "Fourmi’Action te demande ton accord personnel pour les photos, vidéos et enregistrements réalisés pendant les activités du Collectif jeunes. Ton choix est libre : un refus ne change rien à ta participation."
        : `Fourmi’Action vous demande votre accord pour les photos, vidéos et enregistrements de ${jeune.prenom} ${jeune.nom} réalisés pendant les activités du Collectif jeunes. Votre choix est libre : un refus ne change rien à sa participation.`,
        "Ce lien est personnel : il vous permet de lire le document, de recevoir un code de confirmation, d’exprimer vos choix et de signer, depuis l’appareil de votre choix.",
        `Il reste valable ${EXPIRE_DAYS} jours.`],
      button: { label: "Lire et signer", href: link(req, tokens[x.role]) },
      foot: "Vous n’êtes pas concerné(e) ? Ignorez ce message : sans signature, le dossier est supprimé automatiquement.",
    });
    try { await mail(s, { to: x.email, subject: "Autorisation de droit à l’image · Fourmi’Action", ...m }); await event(s, id, x.role, `Lien personnel envoyé à ${x.email}`, null, null); }
    catch (e) { await event(s, id, x.role, `Échec d’envoi du lien à ${x.email}`, null, null, "erreur"); }
  }));
  return out({ ok: true, id, signataires: signers.map((x) => ({ role: x.role, prenom: x.prenom, email: maskMail(x.email) })) });
}
const maskMail = (e) => e.replace(/^(.).*?(.)?@/, (m, a, b) => `${a}•••${b || ""}@`);

function publicView(c) {
  const { d, role, st, fin } = c;
  return {
    ok: true, id: d.id, role, texte: { ref: TEXTE.ref, empreinte: TEXTE.empreinte }, autorite: d.autorite,
    jeune: { prenom: d.jeune.prenom, nom: d.jeune.nom },
    moi: { ...pick(c.signer, ["prenom", "nom", "qualite"]), email: maskMail(c.signer.email), verifie: !!st.emailVerifiedAt, signe: !!st.signedAt, choix: st.signedAt ? st.choix : null },
    signataires: d.signers.map((x) => ({ role: x.role, prenom: x.prenom, nom: x.nom })),
    finalise: fin ? { at: fin.at, choix: fin.choix, pdfSha256: fin.pdfSha256 } : null,
    expire: new Date(Date.parse(d.createdAt) + EXPIRE_DAYS * DAY).toISOString().slice(0, 10),
  };
}
const pick = (o, ks) => Object.fromEntries(ks.map((k) => [k, o?.[k]]));

async function view(req, ctx, b) {
  const s = store(); const c = await byToken(s, b.t); if (!c) return fail("Ce lien n’est pas valide ou a expiré.", 404);
  const v = publicView(c);
  const others = await Promise.all(c.d.signers.map((x) => getJ(s, `s/${c.d.id}/${x.role}`)));
  v.signataires = v.signataires.map((x, i) => ({ ...x, signe: !!others[i]?.signedAt }));
  if (!c.st.openedAt) { c.st.openedAt = now(); await putJ(s, `s/${c.d.id}/${c.role}`, c.st); await event(s, c.d.id, c.role, "Document ouvert depuis le lien personnel", req, ctx); }
  return out(v);
}

async function sendCode(req, ctx, b) {
  const s = store(); const c = await byToken(s, b.t); if (!c) return fail("Ce lien n’est pas valide ou a expiré.", 404);
  if (c.st.signedAt) return fail("Vous avez déjà signé.");
  const sent = (c.st.sent || []).filter((t) => Date.now() - t < DAY);
  if (sent.length && Date.now() - sent[sent.length - 1] < 45e3) return fail("Un code vient d’être envoyé. Patientez quelques secondes avant d’en demander un autre.", 429);
  if (sent.length >= 6) return fail("Trop de codes demandés aujourd’hui. Réessayez demain.", 429);
  const code = String(crypto.randomInt(0, 1e6)).padStart(6, "0");
  c.st.otp = { h: sha(`${c.d.id}|${c.role}|${code}`), exp: Date.now() + OTP_TTL, tries: 0 };
  c.st.sent = [...sent, Date.now()];
  await putJ(s, `s/${c.d.id}/${c.role}`, c.st);
  const m = layout({ title: `Votre code : ${code}`, lines: ["Saisissez ce code sur la page de signature pour confirmer votre adresse électronique.", "Il est valable 10 minutes et ne peut servir qu’une fois. Ne le communiquez à personne : il atteste que c’est bien vous qui signez."] });
  try { await mail(s, { to: c.signer.email, subject: `${code} · votre code de confirmation Fourmi’Action`, ...m }); }
  catch { return fail("L’e-mail n’a pas pu être envoyé. Réessayez dans un instant.", 502); }
  await event(s, c.d.id, c.role, "Code de confirmation envoyé par e-mail", req, ctx);
  return out({ ok: true, email: maskMail(c.signer.email) });
}

async function verify(req, ctx, b) {
  const s = store(); const c = await byToken(s, b.t); if (!c) return fail("Ce lien n’est pas valide ou a expiré.", 404);
  const o = c.st.otp;
  if (!o || o.exp < Date.now()) return fail("Ce code a expiré : demandez-en un nouveau.");
  if (o.tries >= 5) return fail("Trop d’essais : demandez un nouveau code.");
  const code = clean(b.code, 10).replace(/\D/g, "");
  if (!eqHash(o.h, sha(`${c.d.id}|${c.role}|${code}`))) {
    o.tries++; await putJ(s, `s/${c.d.id}/${c.role}`, c.st);
    await event(s, c.d.id, c.role, "Code erroné saisi", req, ctx, "alerte");
    return fail(`Code incorrect (${5 - o.tries} essai${5 - o.tries > 1 ? "s" : ""} restant${5 - o.tries > 1 ? "s" : ""}).`);
  }
  const session = rnd(24);
  c.st.otp = null; c.st.emailVerifiedAt = now(); c.st.session = { h: sha(session), exp: Date.now() + SESSION_TTL };
  await putJ(s, `s/${c.d.id}/${c.role}`, c.st);
  await event(s, c.d.id, c.role, `Adresse électronique ${c.signer.email} confirmée par code`, req, ctx);
  return out({ ok: true, session });
}

async function sign(req, ctx, b) {
  const s = store(); const c = await byToken(s, b.t); if (!c) return fail("Ce lien n’est pas valide ou a expiré.", 404);
  if (c.st.signedAt) return fail("Vous avez déjà signé.");
  if (!c.st.session || c.st.session.exp < Date.now() || !eqHash(c.st.session.h, sha(clean(b.session, 64)))) return fail("Votre confirmation a expiré : demandez un nouveau code.", 401);
  if (b.empreinte !== TEXTE.empreinte) return fail("Le document a été mis à jour. Rechargez la page pour lire la version en vigueur.", 409);
  const choix = {};
  for (const ch of TEXTE.choix) { if (typeof b.choix?.[ch.id] !== "boolean") return fail("Répondez à chacun des deux choix."); choix[ch.id] = b.choix[ch.id]; }
  if (b.atteste !== true) return fail("Cochez la case de certification avant de signer.");
  const needSeul = c.role === "rl1" && c.d.autorite !== "deux";
  if (needSeul && b.attesteSeul !== true) return fail("Cochez la déclaration sur l’honneur concernant l’autorité parentale.");
  const sig = sigOk(b.signature); if (!sig) return fail("Tracez votre signature dans le cadre.");
  Object.assign(c.st, { signedAt: now(), choix, attestSeul: needSeul || undefined, sig, ip: ipOf(req, ctx), ua: uaOf(req), session: null, lu: clean(b.lu, 40) });
  await putJ(s, `s/${c.d.id}/${c.role}`, c.st);
  await event(s, c.d.id, c.role, `Signature : choix A ${choix.A ? "oui" : "non"}, choix B ${choix.B ? "oui" : "non"} · certification cochée${needSeul ? " · déclaration d’autorité exclusive" : ""} · document ${TEXTE.ref} (${TEXTE.empreinte.slice(0, 12)}…)`, req, ctx, "signature");
  const done = await maybeFinalize(req, s, c.d);
  return out({ ok: true, finalise: !!done });
}

async function maybeFinalize(req, s, d) {
  const sts = await Promise.all(d.signers.map((x) => getJ(s, `s/${d.id}/${x.role}`)));
  if (sts.some((x) => !x?.signedAt)) return null;
  if (await s.get(`f/${d.id}`)) return null;
  // Verrou simple : on écrit un jeton, on relit après un court délai.
  const nonce = rnd(8); await s.set(`k/${d.id}`, nonce); await new Promise((r) => setTimeout(r, 250));
  if ((await s.get(`k/${d.id}`)) !== nonce) return null;
  const signers = d.signers.map((x, i) => ({ ...x, ...pick(sts[i], ["emailVerifiedAt", "signedAt", "choix", "attestSeul", "ip", "ua"]), strokes: sts[i].sig }));
  const choix = Object.fromEntries(TEXTE.choix.map((ch) => [ch.id, signers.every((x) => x.choix[ch.id] === true)]));
  const at = now();
  const alertes = [];
  const r1 = signers.find((x) => x.role === "rl1"), r2 = signers.find((x) => x.role === "rl2");
  if (r1 && r2 && r1.ip && r1.ip === r2.ip && r1.ua === r2.ua) alertes.push("Les deux représentants légaux ont signé depuis le même appareil et le même réseau : Fourmi’Action recommande de confirmer l’accord du second parent par un échange direct.");
  else if (r1 && r2 && r1.ip && r1.ip === r2.ip) alertes.push("Les deux représentants légaux ont signé depuis le même réseau (même adresse IP), sur des appareils différents.");
  if (d.autorite !== "deux") alertes.push("Un seul représentant légal a signé en déclarant exercer seul l’autorité parentale (ou la tutelle) : Fourmi’Action peut demander à consulter un justificatif.");
  await event(s, d.id, null, "Toutes les signatures requises sont réunies : autorisation finalisée", null, null, "final");
  const evs = await events(s, d.id);
  const final = { at, choix, finPublication: addYears(at, 10), majorite: addYears(d.jeune.naissance + "T12:00:00Z", 18).slice(0, 10), alertes };
  const proof = { ref: TEXTE.ref, empreinteTexte: TEXTE.empreinte, id: d.id, createdAt: d.createdAt, autorite: d.autorite, jeune: d.jeune, signers, events: evs, final };
  const proofHash = sha(JSON.stringify(proof));
  const pdf = Buffer.from(await buildPdf({ ...d, signers, events: evs, final }, { proofHash }));
  const pdfSha256 = sha(pdf);
  await s.set(`p/${d.id}`, seal(pdf));
  await putJ(s, `f/${d.id}`, { ...final, proofHash, pdfSha256, nonce });
  await putJ(s, `x/${d.id}`, { ...proof, proofHash, pdfSha256 }); // journal de preuve figé
  const fname = `Autorisation-image-${d.jeune.prenom}-${d.jeune.nom}-${d.id}.pdf`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.-]+/g, "-");
  const res = `Choix A (image et voix) : ${choix.A ? "autorisé" : "refusé"} · Choix B (prénom et nom) : ${choix.B ? "autorisé" : "refusé"}.`;
  const recips = [...d.signers.map((x) => x.email), env("DI_NOTIFY", env("SMTP_USER", ""))].filter(Boolean);
  await Promise.all([...new Set(recips)].map(async (to) => {
    const isAsso = !d.signers.some((x) => x.email === to);
    const m = layout({
      title: isAsso ? `Autorisation finalisée · ${d.jeune.prenom} ${d.jeune.nom}` : "Votre autorisation est finalisée",
      lines: [isAsso ? `Dossier ${d.id}. Toutes les signatures requises sont réunies.` : `Toutes les signatures requises pour ${d.jeune.prenom} ${d.jeune.nom} sont réunies. Vous trouverez en pièce jointe l’exemplaire signé.`,
        res, `Empreinte SHA-256 du PDF : ${pdfSha256}`, ...(isAsso && alertes.length ? ["Points de vigilance : " + alertes.join(" ")] : []),
        isAsso ? "Le PDF et le journal de preuve sont aussi disponibles dans l’espace de gestion." : "Conservez ce message : il permet de vérifier que le document n’a pas été modifié. Vous pouvez retirer votre accord à tout moment depuis votre lien personnel ou en écrivant à fourmi.action@gmail.com."],
      foot: "Le refus de ces autorisations n’a aucune conséquence sur la participation au collectif.",
    });
    try { await mail(s, { to, subject: `Autorisation de droit à l’image signée · ${d.jeune.prenom} ${d.jeune.nom}`, ...m, attachments: [{ name: fname, type: "application/pdf", data: pdf }] }); }
    catch { await event(s, d.id, null, `Échec d’envoi de l’exemplaire signé à ${to}`, null, null, "erreur"); }
  }));
  return true;
}

async function pdfFor(req, ctx, t) {
  const s = store(); const c = await byToken(s, t); if (!c || !c.fin) return new Response("Document indisponible.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const pdf = open(await s.get(`p/${c.d.id}`));
  await event(s, c.d.id, c.role, "Exemplaire signé téléchargé", req, ctx);
  return new Response(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Autorisation-image-${c.d.id}.pdf"`, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

async function retrait(req, ctx, b) {
  const s = store(); const c = await byToken(s, b.t); if (!c) return fail("Ce lien n’est pas valide ou a expiré.", 404);
  const msg = clean(b.message, 600);
  const w = (await getJ(s, `w/${c.d.id}`)) || [];
  w.push({ at: now(), role: c.role, message: msg });
  await putJ(s, `w/${c.d.id}`, w);
  await event(s, c.d.id, c.role, `Retrait de l’accord demandé${msg ? " : « " + msg + " »" : ""}`, req, ctx, "retrait");
  const to = env("DI_NOTIFY", env("SMTP_USER", ""));
  const who = `${c.signer.prenom} ${c.signer.nom} (${roleLabel(c.role)})`;
  try {
    if (to) await mail(s, { to, subject: `Retrait d’autorisation · ${c.d.jeune.prenom} ${c.d.jeune.nom}`, ...layout({ title: "Demande de retrait d’autorisation", lines: [`Dossier ${c.d.id} · ${who}.`, msg ? `Message : ${msg}` : "Aucun message.", "À traiter dans un délai d’un mois au plus : cesser toute nouvelle diffusion, retirer, flouter ou recadrer les contenus sur les supports gérés par Fourmi’Action, retirer le nom si besoin."] }) });
    await mail(s, { to: c.signer.email, subject: "Votre demande de retrait a bien été reçue · Fourmi’Action", ...layout({ title: "Demande de retrait reçue", lines: [`Bonjour ${c.signer.prenom},`, `Fourmi’Action a bien reçu votre demande de retrait concernant ${c.d.jeune.prenom} ${c.d.jeune.nom}. Elle cesse toute nouvelle diffusion dans les meilleurs délais, et au plus tard dans un délai d’un mois, et retire, floute ou recadre les contenus sur les supports qu’elle gère.`] }) });
  } catch { /* la demande reste enregistrée */ }
  return out({ ok: true });
}

// ---------- Espace de gestion
async function admin(req, ctx, b) {
  const k = env("DI_ADMIN_KEY");
  const given = req.headers.get("x-di-admin") || "";
  if (k.length < 12 || !eqHash(k, given)) { await new Promise((r) => setTimeout(r, 600)); return fail("Accès refusé.", 401); }
  const s = store();
  if (b.a === "admin-list") {
    const { blobs } = await s.list({ prefix: "d/" });
    const rows = [];
    for (const bl of blobs) {
      const d = await getJ(s, bl.key); if (!d) continue;
      const fin = await getJ(s, `f/${d.id}`);
      if (!fin && Date.parse(d.createdAt) + EXPIRE_DAYS * DAY < Date.now()) { await wipe(s, d.id); continue; }
      const sts = await Promise.all(d.signers.map((x) => getJ(s, `s/${d.id}/${x.role}`)));
      const w = (await getJ(s, `w/${d.id}`)) || [];
      rows.push({ id: d.id, createdAt: d.createdAt, jeune: d.jeune, autorite: d.autorite,
        signers: d.signers.map((x, i) => ({ role: x.role, nom: `${x.prenom} ${x.nom}`, email: x.email, signe: sts[i]?.signedAt || null, verifie: sts[i]?.emailVerifiedAt || null })),
        final: fin ? pick(fin, ["at", "choix", "pdfSha256", "proofHash", "alertes", "finPublication", "majorite"]) : null, retraits: w, notes: d.notes || [] });
    }
    rows.sort((a, b2) => b2.createdAt.localeCompare(a.createdAt));
    return out({ ok: true, rows, mail: mailConfigured() });
  }
  const id = clean(b.id, 40); const d = await getJ(s, `d/${id}`); if (!d) return fail("Dossier introuvable.", 404);
  if (b.a === "admin-pdf") { const p = await s.get(`p/${id}`); if (!p) return fail("PDF indisponible."); return out({ ok: true, pdf: open(p).toString("base64") }); }
  if (b.a === "admin-proof") {
    const x = await getJ(s, `x/${id}`); const evs = await events(s, id); const w = (await getJ(s, `w/${id}`)) || [];
    return out({ ok: true, proof: { journalFige: x, journalComplet: evs, retraits: w, notes: d.notes || [] } });
  }
  if (b.a === "admin-note") {
    const note = clean(b.note, 600); if (!note) return fail("Note vide.");
    d.notes = [...(d.notes || []), { at: now(), note }]; await putJ(s, `d/${id}`, d);
    await event(s, id, null, `Note de gestion : ${note}`, req, ctx); return out({ ok: true });
  }
  if (b.a === "admin-retrait") {
    const note = clean(b.note, 600);
    const w = (await getJ(s, `w/${id}`)) || []; w.push({ at: now(), role: "gestion", message: note || "Retrait enregistré par Fourmi’Action" });
    await putJ(s, `w/${id}`, w); await event(s, id, null, `Retrait enregistré par Fourmi’Action${note ? " : " + note : ""}`, req, ctx, "retrait");
    return out({ ok: true });
  }
  if (b.a === "admin-majorite") {
    if (!d.jeune.email) return fail("Aucune adresse pour le jeune.");
    await mail(s, { to: d.jeune.email, subject: "Tes droits sur ton image · Fourmi’Action", ...layout({ title: `${d.jeune.prenom}, tu es majeur(e)`, lines: [`Bonjour ${d.jeune.prenom},`, "Pendant ta minorité, une autorisation de droit à l’image et à la voix a été signée pour les activités du Collectif jeunes de Fourmi’Action. Désormais, tu exerces seul(e) tes droits.", "Tu peux confirmer cette autorisation, la limiter ou la retirer à tout moment en répondant à ce message ou en écrivant à fourmi.action@gmail.com. Sans retrait, elle continue de s’appliquer aux contenus réalisés pendant ta minorité, jusqu’au terme prévu. Toute nouvelle photo ou vidéo, ou toute campagne te mettant personnellement en avant, nécessitera ton accord."] }) });
    await event(s, id, "jeune", "Information de majorité envoyée au jeune", req, ctx); return out({ ok: true });
  }
  if (b.a === "admin-delete") {
    if (b.confirm !== id) return fail("Confirmation incorrecte.");
    await wipe(s, id); await s.delete(`x/${id}`); return out({ ok: true });
  }
  return fail("Action inconnue.");
}

export default async (req, ctx) => {
  try {
    const u = new URL(req.url);
    if (req.method === "GET" && u.searchParams.get("a") === "pdf") return pdfFor(req, ctx, u.searchParams.get("t"));
    if (req.method === "GET" && u.searchParams.get("a") === "ping") return out({ ok: true, mail: mailConfigured(), cle: env("DI_SECRET").length >= 24 });
    if (req.method === "GET" && u.searchParams.get("a") === "dev-mailbox" && env("DI_DEV_MAILBOX") === "1") return out({ ok: true, mails: devMailbox });
    if (req.method !== "POST") return fail("Méthode non autorisée.", 405);
    const raw = await req.text(); if (raw.length > 250000) return fail("Requête trop volumineuse.", 413);
    let b; try { b = JSON.parse(raw); } catch { return fail("Requête invalide."); }
    if (!env("DI_SECRET") || env("DI_SECRET").length < 24) return fail("Le service n’est pas encore configuré.", 503);
    switch (b.a) {
      case "start": return await start(req, ctx, b);
      case "view": return await view(req, ctx, b);
      case "code": return await sendCode(req, ctx, b);
      case "verify": return await verify(req, ctx, b);
      case "sign": return await sign(req, ctx, b);
      case "retrait": return await retrait(req, ctx, b);
      default: if (String(b.a).startsWith("admin-")) return await admin(req, ctx, b);
    }
    return fail("Action inconnue.");
  } catch (e) {
    console.error("droit-image", e);
    return fail("Erreur du service. Réessayez dans un instant.", 500);
  }
};
