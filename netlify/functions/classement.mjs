/*
 * Fourmi'Action · classement du jeu « Les Hautes Herbes »
 * GET  /api/classement          → les 20 meilleurs scores et le nombre total de parties classées
 * POST /api/classement          → { pseudo, score, niveau, defi, nuitee } ; renvoie le rang obtenu
 *
 * Données conservées : un pseudo (jamais un nom complet ni une adresse), le score, le niveau et la date.
 * Pseudos filtrés (longueur, caractères, mots déplacés). Envois limités par connexion (empreinte anonyme du jour).
 */
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

export const config = { path: "/api/classement" };
const env = (k, d = "") => (globalThis.Netlify?.env?.get?.(k) ?? process.env[k] ?? d);
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const GARDER = 300, AFFICHER = 20, PAR_JOUR = 6;

// Mots refusés dans les pseudos (insultes, termes sexuels ou haineux). Comparaison sans accents ni chiffres déguisés.
const INTERDITS = ["con", "conne", "connard", "connasse", "salop", "salope", "pute", "putain", "encule", "enculer", "bite", "couille", "chatte", "nique", "niquer", "ntm", "fdp",
  "merde", "batard", "pd", "pede", "tapette", "gouine", "negre", "bougnoul", "youpin", "nazi", "hitler", "viol", "violeur", "pedo", "pedophile", "inceste", "porn", "porno", "sexe", "sex",
  "fuck", "shit", "bitch", "dick", "cock", "pussy", "whore", "slut", "rape", "nigger", "nigga", "faggot", "cul", "nichon", "zizi", "teub", "branle", "suce", "sucer"];
const norm = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/0/g, "o").replace(/1|!|\|/g, "i").replace(/3/g, "e").replace(/4|@/g, "a").replace(/5|\$/g, "s").replace(/7/g, "t").replace(/[^a-z]/g, "");
function pseudoOk(p) {
  const t = String(p || "").replace(/\s+/g, " ").trim();
  if (t.length < 2 || t.length > 16) return [null, "Choisissez un pseudo de 2 à 16 caractères."];
  if (!/^[\p{L}0-9][\p{L}0-9 '’\-_.]*$/u.test(t)) return [null, "Lettres, chiffres, espaces et tirets seulement."];
  // mot à mot (« Violette » ou « Constance » passent) ; à l’intérieur des mots, seulement les termes longs sans ambiguïté
  const mots = t.split(/[\s'’\-_.]+/).map(norm).filter(Boolean), tout = norm(t);
  const bad = INTERDITS.some((w) => mots.some((m) => m === w || (m.startsWith(w) && m.length <= w.length + 2)) || (w.length >= 6 && tout.includes(w)));
  if (bad) return [null, "Ce pseudo n’est pas accepté. Choisissez-en un autre."];
  if (/@|https?:|www\.|\d{6,}/i.test(t)) return [null, "Pas d’adresse ni de numéro dans le pseudo."];
  return [t, ""];
}
const store = () => getStore({ name: "classement-jeu", consistency: "strong" });
async function lire(s) { try { const v = await s.get("scores", { type: "json" }); return Array.isArray(v) ? v : []; } catch { return []; } }
const publique = (L) => L.slice(0, AFFICHER).map((e, i) => ({ rang: i + 1, pseudo: e.p, score: e.s, niveau: e.n, defi: !!e.d, date: e.t.slice(0, 10) }));

export default async (req) => {
  const s = store();
  if (req.method === "GET") {
    const L = await lire(s); const total = Number((await s.get("total")) || L.length);
    return json({ ok: true, total, top: publique(L) });
  }
  if (req.method !== "POST") return json({ ok: false }, 405);
  let b; try { b = await req.json(); } catch { return json({ ok: false, error: "Requête illisible." }, 400); }
  const [pseudo, err] = pseudoOk(b.pseudo);
  if (!pseudo) return json({ ok: false, error: err }, 400);
  const score = Math.round(Number(b.score));
  if (!Number.isFinite(score) || score < 0 || score > 1100) return json({ ok: false, error: "Score invalide." }, 400);
  const niveau = [1, 2, 3].includes(Number(b.niveau)) ? Number(b.niveau) : 2;
  // limite anonyme : empreinte salée de la connexion, valable un jour
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "?";
  const jour = new Date().toISOString().slice(0, 10);
  const cle = "lim/" + jour + "/" + crypto.createHash("sha256").update(ip + "|" + jour + "|" + env("DI_SECRET", "fa")).digest("hex").slice(0, 24);
  const n = Number((await s.get(cle)) || 0);
  if (n >= PAR_JOUR) return json({ ok: false, error: "Beaucoup de parties classées aujourd’hui depuis cette connexion. Réessayez demain." }, 429);
  await s.set(cle, String(n + 1));
  const L = await lire(s);
  const e = { p: pseudo, s: score, n: niveau, d: !!b.defi, t: new Date().toISOString() };
  // un même pseudo garde son meilleur score (pas de doublons dans le classement)
  const i0 = L.findIndex((x) => x.p.toLowerCase() === pseudo.toLowerCase());
  if (i0 >= 0) { if (L[i0].s >= score) { const rang = i0 + 1; return json({ ok: true, rang, ameliore: false, meilleur: L[i0].s, total: Number((await s.get("total")) || L.length), top: publique(L) }); } L.splice(i0, 1); }
  L.push(e); L.sort((a, c) => c.s - a.s || a.t.localeCompare(c.t));
  const rang = L.indexOf(e) + 1;
  const total = Number((await s.get("total")) || 0) + 1;
  await Promise.all([s.set("scores", JSON.stringify(L.slice(0, GARDER))), s.set("total", String(total))]);
  try { const { blobs } = await s.list({ prefix: "lim/" }); await Promise.all(blobs.filter((x) => !x.key.includes(jour)).slice(0, 50).map((x) => s.delete(x.key))); } catch {}
  return json({ ok: true, rang, ameliore: true, total, top: publique(L) });
};
