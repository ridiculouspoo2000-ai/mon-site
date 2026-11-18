/*
 * Fourmi'Action · voix des personnages du jeu « Les Hautes Herbes »
 * Chaque réplique est générée une seule fois par ElevenLabs, puis conservée (Netlify Blobs)
 * et mise en cache par le CDN : les joueurs suivants ne consomment plus aucun crédit.
 *
 * Variables d'environnement :
 *   ELEVENLABS_API_KEY  clé API ElevenLabs (obligatoire pour générer)
 *   ELEVENLABS_VOIX     facultatif, JSON {"nour":"<voice_id>", ...} pour choisir d'autres voix
 *   ELEVENLABS_MODELE   facultatif, modèle (par défaut eleven_v4, qui interprète les balises audio)
 */
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import { LIGNES } from "../lib/voix-lignes.mjs";
import { BALISES, BALISES_V, PRONV } from "../lib/voix-balises.mjs";

export const config = { path: "/api/voix" };
const env = (k, d = "") => (globalThis.Netlify?.env?.get?.(k) ?? process.env[k] ?? d);

// Voix par défaut (bibliothèque ElevenLabs), modifiables avec ELEVENLABS_VOIX.
const DEFAUT = {
  // Distribution choisie à l’écoute par l’association (bibliothèque ElevenLabs : français, accent parisien).
  nour: "ucMmKRQbfDEYyb2IIGax",    // Aurore
  ines: "i6ke7jvmGEVUyV4zjSaT",    // Emilie · Pro
  jade: "mNu8EQcIlFZdOJs7yfhe",    // Julia · Warm French Narrator
  maelys: "1A1lOhlOFIlPyxQ8NgiG",  // Solène · jeune et aiguë : une adolescente de 14 ans (avant : Justine, voix de femme adulte)
  lou: "1A1lOhlOFIlPyxQ8NgiG",     // Solène · voix la plus aiguë de la bibliothèque française (≈ 270 Hz, hauteur d’une voix d’enfant)
  bastien: "1a3lMdKLUcfcMtvN772u", // Antoine · Audiobook Narrator
  kevin: "jfEwztGDkpbpy89xeku6",   // Steve · Soft and Calm
  malo: "1A1lOhlOFIlPyxQ8NgiG",    // Solène : Malo, 7 ans (lundi, aux sanitaires)
  theo: "1A1lOhlOFIlPyxQ8NgiG",    // Solène : Théo, 8 ans (lundi, au foot)
  zoe: "Yx2a8qp2EqI9c5i8MzBo",     // Philippine : Zoé, 8 ans (lundi, au foot)
  enzo: "1A1lOhlOFIlPyxQ8NgiG",    // Solène : Enzo, 14 ans (lundi, sous le préau)
  clara: "zPy2sgLU4pZ7Xrjh87uz",   // Justine : Clara, 17 ans (lundi, sous le préau)
  garnier: "h5FvD7dtq6DdnVBPv8Ii", // Max · Narration
  roussel: "OOiDJrD1goukqfTpiySr", // Greg · Authentic French Voice (parent)
  benali: "nVPCtAFzgyMX3FZKNzH0",  // Anna · Natural and Conversational (parent)
  sacha: "Yx2a8qp2EqI9c5i8MzBo",   // Philippine · voix aiguë et vive (≈ 275 Hz)
  lena: "Yx2a8qp2EqI9c5i8MzBo",    // Philippine : Léna, 13 ans (mercredi ; Sacha ne parle que vendredi)
  gendarme: "OOiDJrD1goukqfTpiySr", // Greg (au téléphone, la gendarmerie)
  operateur: "nVPCtAFzgyMX3FZKNzH0", // Anna (opératrice du 112)
  narr: "jUHQdLfy668sllNiNTSW",    // Clément · calme et neutre : récit, situations et retours du formateur
  // Prélude (phrases du quotidien) : voix de la distribution, attribuées à des passants anonymes.
  e_maman: "nVPCtAFzgyMX3FZKNzH0",       // Anna : une maman, une voisine
  e_papa: "OOiDJrD1goukqfTpiySr",        // Greg : un papa, un père
  e_anim: "h5FvD7dtq6DdnVBPv8Ii",        // Max : un animateur, un adulte
  e_fille: "Yx2a8qp2EqI9c5i8MzBo",       // Philippine : une petite fille (≈ 275 Hz)
  e_animatrice: "zPy2sgLU4pZ7Xrjh87uz",  // Justine : une animatrice
  e_ado: "jfEwztGDkpbpy89xeku6",         // Steve : un ado
  e_ado_f: "i6ke7jvmGEVUyV4zjSaT",       // Emilie : une adolescente
  e_garcon: "1A1lOhlOFIlPyxQ8NgiG",      // Solène : un petit garçon (≈ 270 Hz)
};
// Voix d’enfants : la bibliothèque ElevenLabs interdit les voix d’enfants (ou imitant un enfant). On retient les voix
// françaises les plus aiguës (mesurées sur leurs extraits), jouées « en enfant » grâce aux balises. Si une voix n’a pas
// encore été ajoutée au compte ElevenLabs, la réplique est faite avec l’ancienne voix, en attendant (jamais de silence).
const REPLI = { enzo: "mvhJVdVoTWVUtL4keT7W", clara: "txtf1EDouKke753vN8SL", zoe: "txtf1EDouKke753vN8SL", theo: "mvhJVdVoTWVUtL4keT7W", malo: "mvhJVdVoTWVUtL4keT7W", lou: "txtf1EDouKke753vN8SL", e_fille: "txtf1EDouKke753vN8SL", sacha: "mvhJVdVoTWVUtL4keT7W", e_garcon: "mvhJVdVoTWVUtL4keT7W", lena: "txtf1EDouKke753vN8SL", maelys: "zPy2sgLU4pZ7Xrjh87uz" };
const REGLAGES = {
  // Eleven v4 : stabilité et ressemblance seulement (pas de style). Plus de stabilité = voix plus proche de l’original.
  defaut: { stability: 0.5, similarity_boost: 0.8 },
  lou: { stability: 0.35, similarity_boost: 0.75 }, sacha: { stability: 0.35, similarity_boost: 0.75 }, lena: { stability: 0.35, similarity_boost: 0.75 },
  zoe: { stability: 0.3, similarity_boost: 0.7 }, theo: { stability: 0.3, similarity_boost: 0.7 }, malo: { stability: 0.3, similarity_boost: 0.7 },
  maelys: { stability: 0.4, similarity_boost: 0.8 },
  ines: { stability: 0.45, similarity_boost: 0.8 },
  garnier: { stability: 0.6, similarity_boost: 0.85 },
  narr: { stability: 0.55, similarity_boost: 0.8 },
  benali: { stability: 0.45, similarity_boost: 0.8 },
  // prélude : interprétation plus libre, phrases dites « au passage »
  e_maman: { stability: 0.38, similarity_boost: 0.8 }, e_papa: { stability: 0.4, similarity_boost: 0.8 }, e_anim: { stability: 0.4, similarity_boost: 0.8 },
  e_fille: { stability: 0.35, similarity_boost: 0.8 }, e_animatrice: { stability: 0.38, similarity_boost: 0.8 }, e_ado: { stability: 0.35, similarity_boost: 0.8 },
  e_ado_f: { stability: 0.35, similarity_boost: 0.8 }, e_garcon: { stability: 0.35, similarity_boost: 0.8 },
};
function voix() { let o = {}; try { o = JSON.parse(env("ELEVENLABS_VOIX") || "{}"); } catch {} return { ...DEFAUT, ...o }; }
const modele = () => env("ELEVENLABS_MODELE", "eleven_v4");
const avecBalises = () => /eleven_v[34]/.test(modele());
const ckey = (id, who, vid) => `${id}-${sig(who, vid)}` + (avecBalises() && PRONV && PRONV[id] ? "-" + PRONV[id] : "");
const sig = (who, vid) => crypto.createHash("sha1").update([vid || voix()[who], modele(), JSON.stringify(REGLAGES[who] || REGLAGES.defaut), avecBalises() ? BALISES_V : ""].join("|")).digest("hex").slice(0, 10);
const store = () => getStore({ name: "voix-jeu", consistency: "strong" });
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
// Réponse audio avec sa taille et la prise en charge des plages (« Range ») : l’iPhone en a besoin
// pour connaître la durée de l’enregistrement (et donc afficher les mots en même temps que la voix).
function servir(buf, req, cc, cdn) {
  const n = buf.length, h = { "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes", "Cache-Control": cc, "Netlify-CDN-Cache-Control": cdn, "X-Robots-Tag": "noindex" };
  const m = /^bytes=(\d*)-(\d*)$/.exec((req && req.headers.get("range")) || "");
  if (m && (m[1] || m[2])) {
    let a = m[1] ? +m[1] : Math.max(0, n - +m[2]), b = m[1] && m[2] ? Math.min(+m[2], n - 1) : n - 1;
    if (a >= n || a > b) return new Response(null, { status: 416, headers: { ...h, "Content-Range": `bytes */${n}` } });
    return new Response(buf.subarray(a, b + 1), { status: 206, headers: { ...h, "Content-Range": `bytes ${a}-${b}/${n}`, "Content-Length": String(b - a + 1) } });
  }
  return new Response(buf, { headers: { ...h, "Content-Length": String(n) } });
}
const audio = (buf, req) => servir(buf, req, "public, max-age=31536000, immutable", "public, max-age=31536000, immutable, durable");

// Ancienne voix servie en attendant : cache court, pour basculer dès que la nouvelle voix existe.
const audioCourt = (buf, req) => servir(buf, req, "public, max-age=300", "public, max-age=300");

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
  maelys: { nom: "Maëlys (14 ans)", role: "Adolescente de 14 ans, hésitante : « Je… je peux te parler ? »", gender: "female", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },

  bastien: { nom: "Bastien", role: "Jeune animateur, détendu", gender: "male", ages: ["young"] },
  kevin: { nom: "Kévin", role: "Animateur de 24 ans", gender: "male", ages: ["young"] },
  garnier: { nom: "M. Garnier", role: "Directeur, la cinquantaine, grave et posé", gender: "male", ages: ["middle_aged", "old"] },
  roussel: { nom: "M. Roussel", role: "Père de Zoé, la quarantaine, inquiet mais courtois", gender: "male", ages: ["middle_aged"] },
  benali: { nom: "Mme Benali", role: "Mère de Malo, la trentaine, émue", gender: "female", ages: ["middle_aged", "young"] },
  // Enfants : la bibliothèque ElevenLabs n’accepte pas de voix d’enfant. On propose les voix les plus aiguës
  // (françaises, puis personnages « enfant » vérifiés en français) ; la page mesure leur hauteur et les classe.
  lou: { nom: "Lou (10 ans)", role: "Garçon de 10 ans, hésitant : « Je… je veux pas rentrer. »", gender: "female", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },
  sacha: { nom: "Sacha (11 ans)", role: "Garçon de 11 ans, témoin : « Ben… j’ai vu le monsieur, euh… »", gender: "female", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },
  lena: { nom: "Léna (13 ans)", role: "Fille de 13 ans, à voix basse : « Euh… Enzo, il a pris Clara en photo… »", gender: "female", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },
  zoe: { nom: "Zoé (8 ans)", role: "Petite fille de 8 ans : « Mais… moi je joue bien, euh… »", gender: "female", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },
  theo: { nom: "Théo (8 ans)", role: "Garçon de 8 ans, au foot : « Non, t’es une fille ! »", gender: "female", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },
  malo: { nom: "Malo (7 ans)", role: "Garçon de 7 ans, qui n’ose pas : « Je veux pas y aller… »", gender: "female", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },
  enzo: { nom: "Enzo (14 ans)", role: "Ado de 14 ans, sous le préau : « Ça va, c’est pour rigoler… »", gender: "male", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },
  clara: { nom: "Clara (17 ans)", role: "Ado de 17 ans : « Arrête, Enzo ! Efface ça tout de suite »", gender: "female", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },
  e_fille: { nom: "Petite fille (prélude)", role: "Enfant de 7 ans : « Il… il m’a soulevé ma jupe… »", gender: "female", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },
  e_garcon: { nom: "Petit garçon (prélude)", role: "Enfant de 8 ans : « Il m’a dit que… que c’était notre secret. »", gender: "female", ages: ["young"], enfant: ["child", "kid", "childlike", "kid character", "kid narrator", "enfant", "cute", "innocent", "young girl", "petite fille", "petit garçon", "cartoon"] },
};
const PAS_PARIS = /qu[ée]b|canad|belg|suiss|swiss|afri|antill|marseill|sud|south|occitan|alsac|corse|nord|ch.ti/i;
async function bibliotheque(gender, age, key, search, tousAccents, page) {
  const q = new URLSearchParams({ page_size: tousAccents ? "100" : "40", language: "fr", accent: "parisian", gender, age });
  if (page) q.set("page", String(page));
  if (!gender) q.delete("gender"); if (!age) q.delete("age");
  if (search || tousAccents) q.delete("accent");
  if (search) { q.delete("age"); q.set("search", search); }
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
  const getS = (t) => { const k = "s:" + t; if (!cache.has(k)) cache.set(k, bibliotheque("", "", key, t).catch((e) => { erreurs.push(String(e.message || e)); return []; })); return cache.get(k); };
  const getJ = () => { if (!cache.has("j")) cache.set("j", Promise.all([0, 1, 2].map((pg) => bibliotheque("female", "young", key, "", true, pg).catch(() => []))).then((l) => l.flat())); return cache.get("j"); };
  const compte = new Set(); try { const r = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100", { headers: { "xi-api-key": key } }); if (r.ok) for (const v of (await r.json()).voices || []) compte.add(v.voice_id); } catch {}
  const autorisees = new Set();
  const actuelles = voix(); const out = {};
  for (const [who, p] of Object.entries(PROFILS)) {
    const vus = new Set(); const liste = [];
    const sources = p.enfant ? [...p.enfant.map((t) => getS(t)), getJ()] : p.ages.map((age) => get(p.gender, age));
    for (const lot of await Promise.all(sources)) for (const v of lot) {
      if (vus.has(v.voice_id)) continue; vus.add(v.voice_id);
      const fr = (v.verified_languages || []).find((l) => l.language === "fr" && (!l.model_id || l.model_id === modele())) || (v.verified_languages || []).find((l) => l.language === "fr");
      const accent = (fr?.accent || v.accent || "").toLowerCase();
      const texte = `${v.name} ${v.description || ""} ${accent} ${fr?.locale || v.locale || ""}`;
      if (PAS_PARIS.test(texte) || /fr-ca|fr-be|fr-ch/i.test(texte)) continue;
      if (!p.enfant && !/paris|standard|france|french|neutr/i.test(accent)) continue;
      const ecoute = fr?.preview_url || v.preview_url;
      if (!ecoute) continue;
      if (p.enfant && (!fr || /quebec|canad|swiss|belg|afric/i.test(fr.accent || ""))) continue;   // enfants : français de France vérifié
      liste.push({ id: v.voice_id, nom: v.name, age: v.age, accent: fr?.accent || v.accent, langue: v.language, description: String(v.description || "").slice(0, 180), ecoute, popularite: v.cloned_by_count || 0,
        proprio: v.public_owner_id || "", surLeCompte: compte.has(v.voice_id) });
    }
    const kid = (v) => /child|kid|enfant|girl|boy|fille|gar[çc]on|young child|little/i.test(v.nom + " " + v.description);
    liste.sort((a, b) => (p.enfant ? kid(b) - kid(a) : 0) || (/paris/i.test(b.accent) - /paris/i.test(a.accent)) || b.popularite - a.popularite);
    const choisies = new Set(["lou", "sacha", "lena", "maelys", "zoe", "theo", "malo", "enzo", "clara", "e_fille", "e_garcon"].map((w) => actuelles[w]));
    const garde = p.enfant ? [...new Set([...liste.filter(kid).slice(0, 16), ...liste.filter((v) => choisies.has(v.id)), ...liste.filter((v) => !kid(v) && v.langue === "fr").slice(0, 36)])] : liste.slice(0, 8);
    if (p.enfant && actuelles[who] && !garde.some((v) => v.id === actuelles[who])) { const a = liste.find((v) => v.id === actuelles[who]); if (a) garde.unshift(a); }
    garde.forEach((v) => autorisees.add(v.id + "|" + v.proprio));
    out[who] = { ...p, enfant: !!p.enfant, actuelle: actuelles[who], voix: garde };
  }
  try { await getStore({ name: "voix-casting", consistency: "strong" }).set("autorisees", JSON.stringify([...autorisees])); } catch {}
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
    const s = store(); const { blobs } = await s.list(); const have = new Set(blobs.map((b) => b.key));
    const manquantes = Object.entries(LIGNES).filter(([id, l]) => !have.has(ckey(id, l.who)));
    const besoin = manquantes.reduce((n, [id, l]) => n + ((avecBalises() && BALISES[id]) || l.text).length, 0);
    return json({ ok: true, active: !!env("ELEVENLABS_API_KEY"), modele: modele(), lignes: Object.keys(LIGNES).length,
      generees: Object.keys(LIGNES).length - manquantes.length, besoin });
  }
  if (u.searchParams.get("a") === "manquantes") {   // répliques pas encore générées (aucun crédit consommé) : id, personnage, nombre de caractères
    const s = store(); const { blobs } = await s.list(); const have = new Set(blobs.map((b) => b.key));
    const L = Object.entries(LIGNES).filter(([id, l]) => !have.has(ckey(id, l.who))).map(([id, l]) => ({ id, who: l.who, n: ((avecBalises() && BALISES[id]) || l.text).length, t: l.text.slice(0, 80) }));
    return json({ ok: true, total: L.length, caracteres: L.reduce((a, x) => a + x.n, 0), lignes: L });
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
  if (u.searchParams.get("a") === "mesvoix") { // voix utilisables par le compte (par défaut + créées), sans crédit consommé
    const key = env("ELEVENLABS_API_KEY").trim();
    const r = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100&include_total_count=true", { headers: { "xi-api-key": key } });
    if (!r.ok) return json({ ok: false, detail: explique(r.status, (await r.text()).slice(0, 300)) }, 502);
    const j = await r.json();
    return json({ ok: true, voix: (j.voices || []).map((v) => ({ id: v.voice_id, nom: v.name, categorie: v.category, labels: v.labels || {},
      verifiees: (v.verified_languages || []).map((l) => [l.language, l.accent, l.locale, l.model_id].join("/")), description: String(v.description || "").slice(0, 200), ecoute: v.preview_url })) });
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
  if (u.searchParams.get("a") === "ajouter" && req.method === "POST") {
    let b = {}; try { b = await req.json(); } catch {}
    const vid = String(b.id || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 40), own = String(b.proprio || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 80);
    let ok = []; try { ok = JSON.parse((await getStore({ name: "voix-casting", consistency: "strong" }).get("autorisees")) || "[]"); } catch {}
    if (!vid || !own || !ok.includes(vid + "|" + own)) return json({ ok: false, error: "Voix non proposée par la page." }, 400);
    const key = env("ELEVENLABS_API_KEY").trim(); if (!key) return json({ ok: false, error: "Clé absente." }, 503);
    const r = await fetch(`https://api.elevenlabs.io/v1/voices/add/${own}/${vid}`, { method: "POST", headers: { "xi-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify({ new_name: String(b.nom || "Voix enfant").slice(0, 60) }) });
    if (!r.ok) return json({ ok: false, detail: explique(r.status, (await r.text()).slice(0, 300)) }, 502);
    return json({ ok: true });
  }
  if (u.searchParams.get("a") === "apercu") return apercu(u.searchParams.get("u"));
  const id = String(u.searchParams.get("id") || "").replace(/[^a-f0-9]/g, "").slice(0, 12);
  const L = LIGNES[id];
  if (!L) return json({ ok: false, error: "Réplique inconnue." }, 404);
  const key = ckey(id, L.who);
  const s = store();
  const have = await s.get(key);
  if (have) return audio(Buffer.from(have, "base64"), req);
  // Nouvelle distribution pas encore générée : les joueurs gardent l'ancienne voix de la réplique
  // (aucun mélange ni crédit dépensé) ; seule la page des voix lance la génération (gen=1).
  if (u.searchParams.get("gen") !== "1") {
    try {
      const { blobs } = await s.list({ prefix: `${id}-` });
      if (blobs.length) { const old = await s.get(blobs[0].key); if (old) return audioCourt(Buffer.from(old, "base64"), req); }
    } catch {}
  }
  const apiKey = env("ELEVENLABS_API_KEY");
  if (!apiKey) return json({ ok: false, error: "Voix non configurées." }, 503);
  try {
    const tts = (vid) => fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}?output_format=mp3_44100_96`, {
      method: "POST",
      headers: { "xi-api-key": apiKey.trim(), "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: (avecBalises() && BALISES[id]) || L.text, model_id: modele(), language_code: "fr", voice_settings: REGLAGES[L.who] || REGLAGES.defaut }),
    });
    const vid = voix()[L.who] || DEFAUT.nour;
    let r = await tts(vid), cle = key, repli = false;
    // Voix d’enfant pas encore ajoutée au compte : on garde l’ancienne voix pour cette réplique, en attendant.
    if (!r.ok && [400, 404].includes(r.status) && REPLI[L.who] && REPLI[L.who] !== vid) {
      const raw0 = (await r.text()).slice(0, 300);
      if (/voice|not.?found|introuvable/i.test(raw0)) { r = await tts(REPLI[L.who]); cle = ckey(id, L.who, REPLI[L.who]); repli = true; console.warn("voix de repli", L.who, raw0.slice(0, 120)); }
      else return json({ ok: false, error: "Génération impossible pour le moment.", detail: explique(400, raw0) }, 502);
    }
    if (!r.ok) {
      const raw = (await r.text()).slice(0, 600); console.error("voix", r.status, raw);
      return json({ ok: false, error: "Génération impossible pour le moment.", detail: explique(r.status, raw) }, 502);
    }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 500) return json({ ok: false, error: "Réponse audio invalide." }, 502);
    await s.set(cle, buf.toString("base64"));
    return repli ? audioCourt(buf, req) : audio(buf, req);
  } catch (e) {
    console.error("voix", e); return json({ ok: false, error: "Génération impossible pour le moment." }, 502);
  }
};
