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
  nour: "EXAVITQu4vr4xnSDxMaL", ines: "FGY2WhTYpPnrIDTdsKH5", jade: "Xb7hH8MSUJpSbSDYk0k2", maelys: "cgSgspJ2msm6clMCkdW9",
  lou: "pFZP5JQG7iQjIQuC4Bku", malo: "bIHbv24MWmeRgasZH58o", bastien: "TX3LPaxmHKxFdv7VOQHJ", kevin: "bIHbv24MWmeRgasZH58o", garnier: "JBFqnCBsd6RMkjVDRZzb",
};
const REGLAGES = {
  defaut: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
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

export default async (req) => {
  const u = new URL(req.url);
  if (u.searchParams.get("a") === "etat") {
    const s = store(); const { blobs } = await s.list();
    return json({ ok: true, active: !!env("ELEVENLABS_API_KEY"), lignes: Object.keys(LIGNES).length, generees: blobs.length });
  }
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
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: L.text, model_id: modele(), voice_settings: REGLAGES[L.who] || REGLAGES.defaut }),
    });
    if (!r.ok) { console.error("voix", r.status, (await r.text()).slice(0, 300)); return json({ ok: false, error: "Génération impossible pour le moment." }, 502); }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 500) return json({ ok: false, error: "Réponse audio invalide." }, 502);
    await s.set(key, buf.toString("base64"));
    return audio(buf);
  } catch (e) {
    console.error("voix", e); return json({ ok: false, error: "Génération impossible pour le moment." }, 502);
  }
};
