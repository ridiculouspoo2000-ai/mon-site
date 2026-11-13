/*
 * Fourmi'Action · formulaire de contact
 * Le message est transmis directement par e-mail à l'association (même configuration d'envoi
 * que l'autorisation de droit à l'image : SMTP_USER / SMTP_PASS). Rien n'est enregistré par le site,
 * à l'exception d'une empreinte anonyme de connexion conservée 24 h pour limiter les abus.
 *
 * Variables : SMTP_USER, SMTP_PASS (obligatoires), CONTACT_TO (facultatif, sinon DI_NOTIFY, sinon fourmi.action@gmail.com).
 */
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import { sendMail, mailConfigured } from "../lib/di-mail.mjs";

export const config = { path: "/api/contact" };
const env = (k, d = "") => (globalThis.Netlify?.env?.get?.(k) ?? process.env[k] ?? d);
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const SUJETS = ["Formation BAFA", "Intervention dans une structure", "Projet d’accueil collectif", "Bénévolat ou partenariat", "Autre demande"];
const MAX_JOUR = 6;
const propre = (s, n) => String(s ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, n);
const ligne = (s, n) => propre(s, n).replace(/\s+/g, " ");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const EMAIL = /^[^\s@<>()",;:]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export default async (req) => {
  if (req.method === "GET") return json({ ok: true, actif: mailConfigured() });
  if (req.method !== "POST") return json({ ok: false, error: "Méthode non acceptée." }, 405);
  let b; try { b = await req.json(); } catch { return json({ ok: false, error: "Requête illisible." }, 400); }

  // Pièges à robots : champ invisible rempli, ou envoi en moins de 3 secondes. On répond « envoyé » sans rien faire.
  if (propre(b.site, 200) || (Number(b.t) > 0 && Number(b.t) < 3000)) return json({ ok: true });

  const nom = ligne(b.name, 100), email = ligne(b.email, 160).toLowerCase(), tel = ligne(b.phone, 30);
  const sujet = SUJETS.includes(b.subject) ? b.subject : "Autre demande";
  const message = propre(b.message, 5000);
  if (!EMAIL.test(email)) return json({ ok: false, champ: "email", error: "Indiquez une adresse e-mail valide pour que l’équipe puisse vous répondre." }, 400);
  if (message.length < 10) return json({ ok: false, champ: "message", error: "Votre message est un peu court : précisez votre demande en quelques mots." }, 400);
  if (tel && !/^[+0-9 ().-]{6,30}$/.test(tel)) return json({ ok: false, champ: "phone", error: "Le numéro de téléphone n’est pas reconnu." }, 400);
  if (!mailConfigured()) return json({ ok: false, repli: true, error: "L’envoi direct n’est pas encore activé." }, 503);

  // Limite : quelques messages par jour et par connexion (empreinte salée, non réversible, effacée le lendemain).
  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "?";
  const jour = new Date().toISOString().slice(0, 10);
  const cle = jour + "/" + crypto.createHash("sha256").update(ip + "|" + jour + "|" + env("DI_SECRET", "fa")).digest("hex").slice(0, 24);
  const store = getStore({ name: "contact-limite", consistency: "strong" });
  const n = Number((await store.get(cle)) || 0);
  if (n >= MAX_JOUR) return json({ ok: false, error: "Vous avez déjà envoyé plusieurs messages aujourd’hui. Écrivez-nous directement à fourmi.action@gmail.com ou appelez le 02 59 50 89 89." }, 429);
  await store.set(cle, String(n + 1));
  // Ménage des compteurs des jours précédents.
  try { const { blobs } = await store.list(); await Promise.all(blobs.filter((x) => !x.key.startsWith(jour)).slice(0, 50).map((x) => store.delete(x.key))); } catch {}

  const to = env("CONTACT_TO", env("DI_NOTIFY", "fourmi.action@gmail.com"));
  const qui = nom || email;
  const text = `Nouveau message envoyé depuis le formulaire de contact de fourmiaction.fr\n\nSujet : ${sujet}\nNom : ${nom || "(non indiqué)"}\nE-mail : ${email}\n${tel ? "Téléphone : " + tel + "\n" : ""}\n${message}\n\n---\nRépondez simplement à ce message : la réponse partira vers ${email}.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#13283B;max-width:640px">
<p style="margin:0 0 4px;color:#5b6b7a;font-size:13px">Formulaire de contact · fourmiaction.fr</p>
<h2 style="margin:0 0 14px;font-size:20px">${esc(sujet)}</h2>
<table style="border-collapse:collapse;margin:0 0 16px;font-size:14px"><tr><td style="padding:2px 14px 2px 0;color:#5b6b7a">Nom</td><td>${esc(nom || "(non indiqué)")}</td></tr>
<tr><td style="padding:2px 14px 2px 0;color:#5b6b7a">E-mail</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>${tel ? `<tr><td style="padding:2px 14px 2px 0;color:#5b6b7a">Téléphone</td><td>${esc(tel)}</td></tr>` : ""}</table>
<div style="white-space:pre-wrap;background:#F3F6FA;border-radius:12px;padding:14px 16px">${esc(message)}</div>
<p style="color:#5b6b7a;font-size:13px">Répondez simplement à ce message : la réponse partira vers ${esc(email)}.</p></div>`;
  try {
    await sendMail({ to, subject: `[Contact] ${sujet} · ${qui}`, text, html, replyTo: email });
  } catch (e) {
    console.error("contact", e?.message || e);
    await store.set(cle, String(n)).catch(() => {});
    return json({ ok: false, repli: true, error: "Le message n’a pas pu partir pour le moment." }, 502);
  }
  return json({ ok: true });
};
