/*
 * Fourmi'Action · voix des personnages du jeu « Les Hautes Herbes »
 * Chaque réplique est générée une seule fois par ElevenLabs, puis conservée (Netlify Blobs)
 * et mise en cache par le CDN : les joueurs suivants ne consomment plus aucun crédit.
 *
 * Variables d'environnement :
 *   ELEVENLABS_API_KEY  clé API ElevenLabs (obligatoire pour générer)
 *   ELEVENLABS_VOIX     facultatif, JSON {"nour":"<voice_id>", ...} pour choisir d'autres voix
 *   ELEVENLABS_MODELE   facultatif, modèle (par défaut eleven_multilingual_v2)
 */
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import { LIGNES } from "../lib/voix-lignes.mjs";

export const config = { path: "/api/voix" };
const env = (k, d = "") => (globalThis.Netlify?.env?.get?.(k) ?? process.env[k] ?? d);

// Voix par défaut (bibliothèque ElevenLabs), modifiables avec ELEVENLABS_VOIX.
const DEFAUT = {
  // Voix françaises natives (bibliothèque ElevenLabs), choisies selon le profil de chaque personnage.
  nour: "O31r762Gb3WFygrEOGh0",    // Victoria · directrice adjointe, posée et chaleureuse
  ines: "txtf1EDouKke753vN8SL",    // Jeanne · jeune animatrice, voix jeune parisienne
  jade: "Crnn8UaAugljbB6XhAKo",    // Emi · animatrice dynamique et enthousiaste
  maelys: "MmLmgmAm7pKFUJBu1Lov",  // Mélodie · adolescente, voix jeune et expressive
  lou: "2oMnSKxLeHBxE0KdeHJD",     // Natasha Asher · voix douce et fragile
  bastien: "Ayvd8fDj52DfUWXZeAFe", // Nathan Doré · jeune animateur, détendu
  kevin: "Xgb3SR8idOHy8scGICeJ",   // Kevin · jeune homme, clair et sérieux
  malo: "mvhJVdVoTWVUtL4keT7W",    // Simon · jeune et énergique
  garnier: "fEtpdogpDkBrq53KdupV", // David · homme d’une cinquantaine d’années, grave et posé
};
const REGLAGES = {
  defaut: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
  lou: { stability: 0.38, similarity_boost: 0.75, style: 0.45, use_speaker_boost: true },
  maelys: { stability: 0.4, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true },
  garnier: { stability: 0.6, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true },
};
function voix() { let o = {}; try { o = JSON.parse(env("ELEVENLABS_VOIX") || "{}"); } catch {} return { ...DEFAUT, ...o }; }
const modele = () => env("ELEVENLABS_MODELE", "eleven_multilingual_v2");
const sig = (who) => crypto.createHash("sha1").update([voix()[who], modele(), JSON.stringify(REGLAGES[who] || REGLAGES.defaut)].join("|")).digest("hex").slice(0, 10);
const store = () => getStore({ name: "voix-jeu", consistency: "strong" });
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const audio = (buf) => new Response(buf, { headers: {
  "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000, immutable",
  "Netlify-CDN-Cache-Control": "public, max-age=31536000, immutable, durable", "X-Robots-Tag": "noindex" } });

// Message lisible à partir de la réponse d'erreur d'ElevenLabs (jamais la clé elle-même).
function explique(status, raw) {
  let m = ""; try { const j = JSON.parse(raw); m = j.detail?.message || j.detail?.status || (typeof j.detail === "string" ? j.detail : "") || j.message || ""; } catch { m = raw.slice(0, 160); }
  const conseils = {
    401: "clé refusée : vérifiez qu’elle est complète et qu’elle autorise la synthèse vocale (Text to Speech)",
    402: "crédits ou offre insuffisants",
    403: "accès refusé par ElevenLabs",
    404: "voix introuvable sur ce compte",
    429: "trop de demandes ou quota atteint",
  };
  return `ElevenLabs ${status}${conseils[status] ? " (" + conseils[status] + ")" : ""}${m ? " : " + String(m).slice(0, 220) : ""}`;
}

// ---------- Distribution : voix françaises à l’accent parisien de la bibliothèque ElevenLabs ----------
// Les extraits d’écoute sont fournis gratuitement par la bibliothèque : aucun crédit n’est consommé ici.
export const PROFILS = {
  nour: { nom: "Nour", role: "Directrice adjointe et référente VSS, posée et chaleureuse", gender: "female", ages: ["middle_aged", "young"] },
  ines: { nom: "Inès", role: "Jeune animatrice", gender: "female", ages: ["young"] },
  jade: { nom: "Jade", role: "Animatrice dynamique, sûre d’elle", gender: "female", ages: ["young"] },
  maelys: { nom: "Maëlys", role: "Adolescente", gender: "female", ages: ["young"] },
  lou: { nom: "Lou", role: "Enfant de 10 ans, voix douce (voix jeune et claire)", gender: "female", ages: ["young"] },
  bastien: { nom: "Bastien", role: "Jeune animateur, détendu", gender: "male", ages: ["young"] },
  kevin: { nom: "Kévin", role: "Animateur de 24 ans", gender: "male", ages: ["young"] },
  garnier: { nom: "M. Garnier", role: "Directeur, la cinquantaine, grave et posé", gender: "male", ages: ["middle_aged", "old"] },
};
const PAS_PARIS = /qu[ée]b|canad|belg|suiss|swiss|afri|antill|marseill|sud|south|occitan|alsac|corse|nord|ch.ti/i;
async function bibliotheque(gender, age, key) {
  const q = new URLSearchParams({ page_size: "40", language: "fr", accent: "parisian", gender, age });
  const call = (k) => fetch("https://api.elevenlabs.io/v1/shared-voices?" + q, { headers: k ? { "xi-api-key": k } : {} });
  let r = await call(key);
  if (!r.ok && key) r = await call("");
  if (!r.ok) throw new Error(explique(r.status, (await r.text()).slice(0, 400)));
  let v = (await r.json()).voices || [];
  if (!v.length) { // si le filtre d’accent n’existe pas sous ce nom, on filtre nous-mêmes
    q.delete("accent"); q.set("page_size", "100");
    const r2 = await call(key); if (r2.ok) v = (await r2.json()).voices || [];
  }
  return v;
}
async function casting() {
  const key = env("ELEVENLABS_API_KEY").trim();
  const cache = new Map(); const erreurs = [];
  const get = async (g, a) => { const k = g + a; if (!cache.has(k)) cache.set(k, bibliotheque(g, a, key).catch((e) => { erreurs.push(String(e.message || e)); return []; })); return cache.get(k); };
  const actuelles = voix(); const out = {};
  for (const [who, p] of Object.entries(PROFILS)) {
    const vus = new Set(); const liste = [];
    for (const age of p.ages) for (const v of await get(p.gender, age)) {
      if (vus.has(v.voice_id)) continue; vus.add(v.voice_id);
      const fr = (v.verified_languages || []).find((l) => l.language === "fr" && (!l.model_id || l.model_id === modele())) || (v.verified_languages || []).find((l) => l.language === "fr");
      const accent = (fr?.accent || v.accent || "").toLowerCase();
      const texte = `${v.name} ${v.description || ""} ${accent} ${fr?.locale || v.locale || ""}`;
      if (PAS_PARIS.test(texte) || /fr-ca|fr-be|fr-ch/i.test(texte)) continue;
      if (!/paris|standard|france|french|neutr/i.test(accent)) continue;
      const ecoute = fr?.preview_url || v.preview_url;
      if (!ecoute) continue;
      liste.push({ id: v.voice_id, nom: v.name, age: v.age, accent: fr?.accent || v.accent, description: String(v.description || "").slice(0, 180), ecoute, popularite: v.cloned_by_count || 0 });
    }
    liste.sort((a, b) => (/paris/i.test(b.accent) - /paris/i.test(a.accent)) || b.popularite - a.popularite);
    out[who] = { ...p, actuelle: actuelles[who], voix: liste.slice(0, 8) };
  }
  return new Response(JSON.stringify({ ok: true, modele: modele(), personnages: out, erreurs: [...new Set(erreurs)] }), { headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "Netlify-CDN-Cache-Control": erreurs.length ? "no-store" : "public, max-age=86400" } });
}
// Relais des extraits d’écoute (hébergés par ElevenLabs) pour respecter la politique de sécurité du site.
async function apercu(url) {
  let u; try { u = new URL(String(url || "")); } catch { return json({ ok: false }, 400); }
  if (u.protocol !== "https:" || u.hostname !== "storage.googleapis.com" || !u.pathname.startsWith("/eleven-public-prod/")) return json({ ok: false }, 400);
  const r = await fetch(u); if (!r.ok) return json({ ok: false }, 502);
  return new Response(await r.arrayBuffer(), { headers: { "Content-Type": r.headers.get("content-type") || "audio/mpeg",
    "Cache-Control": "public, max-age=604800", "Netlify-CDN-Cache-Control": "public, max-age=2592000", "X-Robots-Tag": "noindex" } });
}

export default async (req) => {
  const u = new URL(req.url);
  if (u.searchParams.get("a") === "etat") {
    const s = store(); const { blobs } = await s.list();
    return json({ ok: true, active: !!env("ELEVENLABS_API_KEY"), lignes: Object.keys(LIGNES).length, generees: blobs.length });
  }
  if (u.searchParams.get("a") === "test") {
    const k = env("ELEVENLABS_API_KEY");
    if (!k) return json({ ok: false, detail: "La variable ELEVENLABS_API_KEY n’est pas visible par cette version du site." });
    try {
      const r = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": k.trim() } });
      const raw = await r.text();
      if (!r.ok && /missing_permissions/.test(raw)) return json({ ok: true, offre: "inconnue (la clé n’a pas le droit de lire le compte, sans importance)", caracteres: "non disponible", longueurCle: k.length });
      if (!r.ok) return json({ ok: false, detail: explique(r.status, raw), longueurCle: k.length, espaces: k !== k.trim() });
      const j = JSON.parse(raw);
      return json({ ok: true, offre: j.tier, caracteres: `${j.character_count} / ${j.character_limit}`, restants: Math.max(0, j.character_limit - j.character_count), renouvellement: j.next_character_count_reset_unix || null, longueurCle: k.length });
    } catch (e) { return json({ ok: false, detail: "ElevenLabs injoignable : " + String(e.message || e).slice(0, 120) }); }
  }
  if (u.searchParams.get("a") === "bibli") { // inventaire détaillé (métadonnées publiques de la bibliothèque, aucun crédit consommé)
    const key = env("ELEVENLABS_API_KEY").trim();
    const q = new URLSearchParams({ page_size: "100", language: "fr", accent: "parisian" });
    for (const k of ["gender", "age", "page", "sort", "search", "category"]) { const v = u.searchParams.get(k); if (v) q.set(k, v.slice(0, 40)); }
    if (u.searchParams.get("accent") === "toutes") q.delete("accent");
    const r = await fetch("https://api.elevenlabs.io/v1/shared-voices?" + q, { headers: key ? { "xi-api-key": key } : {} });
    if (!r.ok) return json({ ok: false, detail: explique(r.status, (await r.text()).slice(0, 300)) }, 502);
    const j = await r.json();
    return json({ ok: true, has_more: j.has_more, voix: (j.voices || []).map((v) => ({ id: v.voice_id, nom: v.name, langue: v.language, locale: v.locale, accent: v.accent,
      age: v.age, genre: v.gender, categorie: v.category, usage: v.use_case, ton: v.descriptive, description: String(v.description || "").slice(0, 300),
      clones: v.cloned_by_count, car1an: v.usage_character_count_1y, verifiees: (v.verified_languages || []).map((l) => [l.language, l.accent, l.locale, l.model_id].join("/")),
      ecoute: v.preview_url })) });
  }
  if (u.searchParams.get("a") === "casting") return casting();
  if (u.searchParams.get("a") === "apercu") return apercu(u.searchParams.get("u"));
  const id = String(u.searchParams.get("id") || "").replace(/[^a-f0-9]/g, "").slice(0, 12);
  const L = LIGNES[id];
  if (!L) return json({ ok: false, error: "Réplique inconnue." }, 404);
  const key = `${id}-${sig(L.who)}`;
  const s = store();
  const have = await s.get(key);
  if (have) return audio(Buffer.from(have, "base64"));
  const apiKey = env("ELEVENLABS_API_KEY");
  if (!apiKey) return json({ ok: false, error: "Voix non configurées." }, 503);
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voix()[L.who] || DEFAUT.nour}?output_format=mp3_44100_96`, {
      method: "POST",
      headers: { "xi-api-key": apiKey.trim(), "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: L.text, model_id: modele(), voice_settings: REGLAGES[L.who] || REGLAGES.defaut }),
    });
    if (!r.ok) {
      const raw = (await r.text()).slice(0, 600); console.error("voix", r.status, raw);
      return json({ ok: false, error: "Génération impossible pour le moment.", detail: explique(r.status, raw) }, 502);
    }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 500) return json({ ok: false, error: "Réponse audio invalide." }, 502);
    await s.set(key, buf.toString("base64"));
    return audio(buf);
  } catch (e) {
    console.error("voix", e); return json({ ok: false, error: "Génération impossible pour le moment." }, 502);
  }
};
