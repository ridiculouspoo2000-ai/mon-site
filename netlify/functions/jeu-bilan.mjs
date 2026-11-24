/*
 * Fourmi'Action · adresses laissées au téléchargement du bilan du jeu « Les Hautes Herbes »
 * POST /api/jeu-bilan            → { email, score, niveau } ; enregistre l'adresse (aucune vérification, comme demandé)
 * GET  /api/jeu-bilan?cle=…      → la liste au format CSV, pour l'association (clé : DI_ADMIN_KEY, déjà utilisée
 *                                  pour l'espace de gestion du droit à l'image)
 *
 * Données conservées : l'adresse saisie, le score, le niveau et la date. Rien d'autre (ni nom, ni réponses du jeu).
 * Envois limités par connexion (empreinte anonyme du jour), comme pour le classement.
 */
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

export const config = { path: "/api/jeu-bilan" };
const env = (k, d = "") => (globalThis.Netlify?.env?.get?.(k) ?? process.env[k] ?? d);
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const PAR_JOUR = 10;
const store = () => getStore({ name: "jeu-bilans", consistency: "strong" });

export default async (req) => {
  const s = store();
  if (req.method === "GET") {
    const u = new URL(req.url), admin = env("DI_ADMIN_KEY");
    if (!admin || u.searchParams.get("cle") !== admin) return json({ ok: false }, 403);
    const { blobs } = await s.list({ prefix: "a/" });
    const rows = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" }).catch(() => null)));
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = ["date;email;score;niveau"].concat(rows.filter(Boolean).sort((a, b) => a.t.localeCompare(b.t)).map((r) => [r.t, r.e, r.s, r.n].map(q).join(";"))).join("\n");
    return new Response("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=jeu-bilans.csv", "Cache-Control": "no-store" } });
  }
  if (req.method !== "POST") return json({ ok: false }, 405);
  let b; try { b = await req.json(); } catch { return json({ ok: false }, 400); }
  const email = String(b.email || "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, "").slice(0, 160);
  if (!email) return json({ ok: false }, 400);
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "?";
  const jour = new Date().toISOString().slice(0, 10);
  const lim = "lim/" + jour + "/" + crypto.createHash("sha256").update(ip + "|" + jour + "|" + env("DI_SECRET", "fa")).digest("hex").slice(0, 24);
  const n = Number((await s.get(lim)) || 0);
  if (n >= PAR_JOUR) return json({ ok: true });   // au-delà, on ne garde plus rien, mais le téléchargement n'est jamais bloqué
  await s.set(lim, String(n + 1));
  const score = Math.max(0, Math.min(5000, Math.round(Number(b.score) || 0))), niveau = [1, 2, 3].includes(Number(b.niveau)) ? Number(b.niveau) : 2;
  await s.setJSON("a/" + jour + "/" + crypto.randomUUID(), { e: email, s: score, n: niveau, t: new Date().toISOString() });
  return json({ ok: true });
};
