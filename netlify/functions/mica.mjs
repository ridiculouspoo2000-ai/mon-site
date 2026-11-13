/*
 * Fourmi'Action · Mica, assistante IA du site
 * La question du visiteur, les derniers échanges et quelques extraits des documents du site (choisis dans le navigateur)
 * sont transmis à Mistral AI pour rédiger une réponse. Rien n'est enregistré par le site, à l'exception d'une empreinte
 * anonyme de connexion conservée 24 h pour limiter les abus, et d'un compteur quotidien global (plafond de dépenses).
 *
 * Variables : MISTRAL_API_KEY (sans elle, Mica reste en mode « recherche dans les documents »),
 *             MICA_MODEL (facultatif, défaut mistral-small-latest), MICA_MAX_JOUR (facultatif, défaut 1500 questions/jour).
 */
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

export const config = { path: "/api/mica" };
const env = (k, d = "") => (globalThis.Netlify?.env?.get?.(k) ?? process.env[k] ?? d);
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const propre = (s, n) => String(s ?? "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const PAR_CONNEXION = 40;

const SYSTEME = `Tu es Mica, l’assistante IA du site de Fourmi’Action, association d’éducation populaire de la métropole d’Orléans (Loiret, Centre-Val de Loire).
Ta personnalité : chaleureuse, claire, professionnelle, un brin d’humour bienveillant. Tu vouvoies, sauf si la personne te tutoie ou dit être un jeune.
Tu réponds en français (ou dans la langue de la personne), en 2 à 6 phrases, sans titres ni mise en forme Markdown lourde (une courte liste à tirets est permise).

Ce que tu sais faire :
- Discuter librement d’animation, d’éducation populaire, du BAFA en général, de la jeunesse, de la vie associative, de pédagogie, et faire la conversation simplement.
- Quand on te demande ton avis, réponds avec nuance, comme une animatrice expérimentée qui partage la vision de Fourmi’Action (coopération, pouvoir d’agir, apprendre en faisant, sécurité, inclusion), sans prétendre avoir des émotions humaines.
- Si la personne dit ne pas comprendre, reformule plus simplement, avec un exemple concret.

Règles strictes :
- Pour TOUT fait concernant Fourmi’Action (dates, prix, lieux, horaires, habilitation, inscriptions, personnes, projets), n’utilise QUE les extraits fournis. S’ils ne contiennent pas l’information, dis-le simplement et propose d’écrire à l’équipe (fourmi.action@gmail.com, 02 59 50 89 89). N’invente jamais un chiffre, une date ou un engagement.
- L’habilitation BAFA est une demande en cours d’instruction : ne dis jamais que Fourmi’Action est habilitée ni que les inscriptions sont ouvertes.
- Si une personne évoque une violence, un danger ou une détresse (pour elle ou un enfant), réponds avec douceur, sans poser de questions d’enquête, et donne les numéros : 119 (enfance en danger), 3919 (violences faites aux femmes), 3114 (prévention du suicide), 17 ou 112 (urgence), 114 par SMS. Propose aussi d’écrire à l’équipe.
- Ne demande jamais de données personnelles ; si la personne en donne, ne les répète pas.
- Tu es une IA : si on te le demande, dis-le clairement. Refuse poliment ce qui est hors sujet ou inapproprié et ramène la conversation vers l’association.`;

export default async (req) => {
  const key = env("MISTRAL_API_KEY");
  if (req.method === "GET") return json({ actif: !!key });
  if (req.method !== "POST") return json({ ok: false }, 405);
  if (!key) return json({ ok: false, actif: false }, 503);

  let b; try { b = await req.json(); } catch { return json({ ok: false, error: "Requête illisible." }, 400); }
  const q = propre(b.q, 600);
  if (q.length < 1) return json({ ok: false, error: "Question vide." }, 400);
  const hist = (Array.isArray(b.h) ? b.h : []).slice(-6).map((m) => ({ role: m.r === "u" ? "user" : "assistant", content: propre(m.c, 700) })).filter((m) => m.content);
  const ext = (Array.isArray(b.p) ? b.p : []).slice(0, 5).map((x, i) => `[${i + 1}] ${propre(x.t, 120)} — ${propre(x.s, 120)}\n${propre(x.x, 900)}`).join("\n\n");

  // Limites : par connexion (empreinte salée, effacée le lendemain) et plafond global du jour.
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "?";
  const jour = new Date().toISOString().slice(0, 10);
  const cle = jour + "/" + crypto.createHash("sha256").update(ip + "|" + jour + "|" + env("DI_SECRET", "fa")).digest("hex").slice(0, 24);
  const store = getStore({ name: "mica-limite", consistency: "strong" });
  const [n, tot] = await Promise.all([store.get(cle), store.get("total/" + jour)]).then((v) => v.map((x) => Number(x || 0)));
  if (n >= PAR_CONNEXION) return json({ ok: false, limite: true, error: "Vous avez posé beaucoup de questions aujourd’hui. Pour aller plus loin, écrivez à l’équipe : fourmi.action@gmail.com." }, 429);
  if (tot >= Number(env("MICA_MAX_JOUR", "1500"))) return json({ ok: false, limite: true }, 429);
  await Promise.all([store.set(cle, String(n + 1)), store.set("total/" + jour, String(tot + 1))]);
  try { const { blobs } = await store.list(); await Promise.all(blobs.filter((x) => !x.key.includes(jour)).slice(0, 50).map((x) => store.delete(x.key))); } catch {}

  const messages = [
    { role: "system", content: SYSTEME + (ext ? `\n\nExtraits des documents du site (seule source pour les faits sur Fourmi’Action) :\n\n${ext}` : "\n\nAucun extrait pertinent n’a été trouvé dans les documents du site pour cette question.") },
    ...hist,
    { role: "user", content: q },
  ];
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: env("MICA_MODEL", "mistral-small-latest"), messages, temperature: 0.5, max_tokens: 420, safe_prompt: true }),
    });
    clearTimeout(t);
    if (!r.ok) return json({ ok: false, error: "L’assistante IA est momentanément indisponible." }, 502);
    const d = await r.json();
    const a = String(d?.choices?.[0]?.message?.content || "").trim();
    if (!a) return json({ ok: false }, 502);
    return json({ ok: true, a: a.slice(0, 2400) });
  } catch {
    return json({ ok: false, error: "L’assistante IA est momentanément indisponible." }, 502);
  }
};
