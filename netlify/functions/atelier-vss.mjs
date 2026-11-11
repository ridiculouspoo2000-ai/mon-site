/*
 * Fourmi'Action · Atelier VSS en direct · fonction Netlify
 * Les participants envoient leurs réponses depuis leur téléphone, l'écran projeté les affiche.
 * Stockage : Netlify Blobs (intégré à Netlify, sans configuration). Une clé par contribution,
 * pour que des envois simultanés ne s'écrasent jamais. Séances effacées à la fin, ou après 48 h.
 * Aucune adresse IP ni donnée personnelle n'est conservée.
 */
import { getStore } from "@netlify/blobs";

const TTL = 48 * 3600 * 1000, MAX_TEXT = 700, MAX_BODY = 12000, MAX_ENTRIES = 500;
const store = () => getStore({ name: "atelier-vss", consistency: "strong" });
const H = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });
const fail = (error, status = 400) => out({ ok: false, error }, status);
const clean = (s, re, n) => String(s ?? "").replace(re, "").slice(0, n);
const code_ = (c) => { c = clean(c, /[^A-Za-z0-9]/g, 8).toUpperCase(); return c.length >= 4 ? c : null; };
const rid = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map((b) => b.toString(16).padStart(2, "0")).join(""); };
const same = (a, b) => { a = String(a); b = String(b); if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
function clip(v, d = 0) {
  if (d > 3) return null;
  if (typeof v === "string") return v.trim().slice(0, MAX_TEXT);
  if (typeof v === "number" || typeof v === "boolean" || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 40).map((x) => clip(x, d + 1));
  if (typeof v === "object") { const o = {}; Object.keys(v).slice(0, 40).forEach((k) => { o[clean(k, /[^A-Za-z0-9_.-]/g, 30)] = clip(v[k], d + 1); }); return o; }
  return null;
}
async function meta(s, code) { const m = await s.get(`${code}/_meta`, { type: "json" }); return m || null; }
async function bump(s, code) { await s.set(`${code}/_v`, String(Date.now()) + rid(2)); }
async function entries(s, code, acts) {
  let blobs = [];
  if (acts && acts.length) { for (const a of acts) blobs = blobs.concat((await s.list({ prefix: `${code}/e/${a}/` })).blobs); }
  else blobs = (await s.list({ prefix: `${code}/e/` })).blobs;
  const all = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" }).catch(() => null)));
  const o = {};
  all.forEach((e) => { if (e && e.act) (o[e.act] = o[e.act] || []).push(e); });
  Object.values(o).forEach((l) => l.sort((a, b) => a.t - b.t));
  return o;
}
async function sweep(s) {
  try {
    const { blobs } = await s.list();
    const metas = blobs.filter((b) => b.key.endsWith("/_meta"));
    for (const b of metas) {
      const m = await s.get(b.key, { type: "json" }).catch(() => null);
      if (!m || Date.now() - m.created > TTL) await wipe(s, b.key.split("/")[0]);
    }
  } catch (e) { }
}
async function wipe(s, code) { const { blobs } = await s.list({ prefix: `${code}/` }); await Promise.all(blobs.map((b) => s.delete(b.key))); }

export default async (req) => {
  let input = {};
  if (req.method === "POST") {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return fail("Envoi trop long.", 413);
    try { input = JSON.parse(raw || "{}"); } catch (e) { return fail("Requête illisible."); }
  } else input = Object.fromEntries(new URL(req.url).searchParams);
  const s = store(), a = input.a;

  if (a === "ping") return out({ ok: true, runtime: "netlify" });

  if (a === "create") {
    await sweep(s);
    const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 20; i++) { const r = new Uint8Array(5); crypto.getRandomValues(r); code = [...r].map((x) => alpha[x % alpha.length]).join(""); if (!(await meta(s, code))) break; }
    const key = rid(16);
    await s.setJSON(`${code}/_meta`, { key, created: Date.now() });
    await s.set(`${code}/_step`, "accueil"); await bump(s, code);
    return out({ ok: true, code, key });
  }

  const code = code_(input.c); if (!code) return fail("Code invalide.");
  const m = await meta(s, code); if (!m) return fail("Séance introuvable ou terminée.", 404);

  if (a === "state") {
    if (input.p) {
      /* téléphone : il ne recharge que si l'étape, le nombre de groupes ou la fiche de son groupe ont changé */
      const g0 = parseInt(input.g || "0", 10) || 0;
      const [sv, gv] = await Promise.all([s.get(`${code}/_sv`), s.get(`${code}/_gv${g0}`)]);
      const pv = `${sv || "0"}.${gv || "0"}`;
      if (input.v && input.v === pv) return out({ ok: true, same: true, v: pv });
      const step = (await s.get(`${code}/_step`)) || "accueil";
      const groups = parseInt((await s.get(`${code}/_groups`)) || "4", 10) || 4;
      const p = clean(input.p, /[^a-z0-9]/g, 24), g = parseInt(input.g || "0", 10);
      const all = await entries(s, code, [clean(input.act || step, /[^a-z0-9_]/g, 30)]), mine = {};
      Object.entries(all).forEach(([act, l]) => l.forEach((e) => { if (e.p === p || (e.by === "g" && e.g === g)) (mine[act] = mine[act] || []).push(e); }));
      return out({ ok: true, v: pv, step, groups, mine });
    }
    const v = (await s.get(`${code}/_v`)) || "0";
    if (input.v && input.v === v) return out({ ok: true, same: true, v });
    const step = (await s.get(`${code}/_step`)) || "accueil";
    const groups = parseInt((await s.get(`${code}/_groups`)) || "4", 10) || 4;
    if (!same(m.key, input.key || "")) return out({ ok: true, exists: true });
    const acts = input.acts ? String(input.acts).split(",").map((x) => clean(x, /[^a-z0-9_]/g, 30)).filter(Boolean).slice(0, 20) : null;
    return out({ ok: true, v, code, step, groups, entries: await entries(s, code, acts) });
  }

  if (a === "submit") {
    const act = clean(input.act, /[^a-z0-9_]/g, 30); if (!act) return fail("Activité manquante.");
    const p = clean(input.p, /[^a-z0-9]/g, 24); if (!p) return fail("Participant inconnu.");
    const g = Math.max(0, Math.min(6, parseInt(input.g || "0", 10) || 0));
    const mode = ["person", "group", "append"].includes(input.mode) ? input.mode : "person";
    if (mode === "append") { const { blobs } = await s.list({ prefix: `${code}/e/${act}/` }); if (blobs.length >= MAX_ENTRIES) return fail("Le nombre maximal de contributions est atteint.", 429); }
    const id = rid(5);
    const e = { id, act, p, g, v: clip(input.val ?? null), t: Date.now() };
    const name = String(input.name || "").trim().slice(0, 30); if (name) e.n = name;
    let k;
    if (mode === "person") k = `${code}/e/${act}/p-${p}`;
    else if (mode === "group") { e.by = "g"; k = `${code}/e/${act}/g-${g}`; }
    else k = `${code}/e/${act}/a-${id}`;
    e.k = k;
    await s.setJSON(k, e); await bump(s, code);
    if (mode === "group") await s.set(`${code}/_gv${g}`, String(Date.now()));
    return out({ ok: true });
  }

  if (a === "control") {
    if (!same(m.key, input.key || "")) return fail("Clé de formateur invalide.", 403);
    if (input.step != null) await s.set(`${code}/_step`, clean(input.step, /[^a-z0-9_]/g, 30));
    if (input.groups != null) await s.set(`${code}/_groups`, String(Math.max(2, Math.min(6, parseInt(input.groups, 10) || 4))));
    if (input.step != null || input.groups != null) await s.set(`${code}/_sv`, String(Date.now()));
    if (input.hide && input.act) {
      const { blobs } = await s.list({ prefix: `${code}/e/${clean(input.act, /[^a-z0-9_]/g, 30)}/` });
      for (const b of blobs) { const e = await s.get(b.key, { type: "json" }); if (e && e.id === input.hide) await s.delete(b.key); }
    }
    await bump(s, code);
    return out({ ok: true });
  }

  if (a === "end") {
    if (!same(m.key, input.key || "")) return fail("Clé de formateur invalide.", 403);
    await wipe(s, code);
    return out({ ok: true });
  }

  return fail("Action inconnue.");
};

export const config = { path: "/api/atelier-vss" };
