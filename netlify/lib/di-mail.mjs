/*
 * Fourmi'Action · envoi d'e-mails par SMTP (TLS implicite, port 465), sans dépendance.
 * Prévu pour Gmail avec un « mot de passe d'application » : SMTP_USER / SMTP_PASS.
 * En test local (DI_DEV_MAILBOX=1), les messages sont conservés en mémoire au lieu d'être envoyés.
 */
import tls from "node:tls";
import crypto from "node:crypto";

const env = (k, d = "") => (globalThis.Netlify?.env?.get?.(k) ?? process.env[k] ?? d);
export const mailConfigured = () => !!(env("SMTP_USER") && env("SMTP_PASS")) || env("DI_DEV_MAILBOX") === "1";
export const devMailbox = (globalThis.__diMailbox ||= []);

const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
const enc = (s) => /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`;
const wrap = (s) => s.replace(/.{1,76}/g, "$&\r\n");
const addr = (a) => String(a).replace(/[\r\n<>]/g, "").trim();

export function buildMessage({ from, fromName, to, subject, text, html, attachments = [], replyTo }) {
  const id = crypto.randomBytes(12).toString("hex");
  const bMix = "mix_" + id, bAlt = "alt_" + id;
  const head = [
    `From: ${enc(fromName)} <${addr(from)}>`, `To: <${addr(to)}>`, `Subject: ${enc(subject)}`,
    `Date: ${new Date().toUTCString()}`, `Message-ID: <${id}@fourmiaction.fr>`, "MIME-Version: 1.0",
    replyTo ? `Reply-To: <${addr(replyTo)}>` : null, "Auto-Submitted: auto-generated",
    `Content-Type: multipart/mixed; boundary="${bMix}"`,
  ].filter(Boolean).join("\r\n");
  let body = `--${bMix}\r\nContent-Type: multipart/alternative; boundary="${bAlt}"\r\n\r\n` +
    `--${bAlt}\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(b64(text))}` +
    `--${bAlt}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(b64(html))}--${bAlt}--\r\n`;
  for (const a of attachments) {
    body += `--${bMix}\r\nContent-Type: ${a.type}; name="${a.name}"\r\nContent-Disposition: attachment; filename="${a.name}"\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n${wrap(Buffer.from(a.data).toString("base64"))}`;
  }
  body += `--${bMix}--\r\n`;
  return head + "\r\n\r\n" + body;
}

function smtp({ host, port, user, pass, from, to, data }) {
  return new Promise((resolve, reject) => {
    const sock = tls.connect({ host, port, servername: host, rejectUnauthorized: env("SMTP_INSECURE") !== "1" });
    sock.setTimeout(15000, () => { sock.destroy(); reject(new Error("SMTP : délai dépassé")); });
    let buf = "", step = 0;
    const steps = [
      [220, () => `EHLO fourmiaction.fr`],
      [250, () => `AUTH PLAIN ${Buffer.from(`\0${user}\0${pass}`).toString("base64")}`],
      [235, () => `MAIL FROM:<${addr(from)}>`],
      [250, () => `RCPT TO:<${addr(to)}>`],
      [250, () => "DATA"],
      [354, () => data.replace(/\r\n\./g, "\r\n..") + "."],
      [250, () => "QUIT"],
      [221, null],
    ];
    sock.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      // On attend une réponse complète (dernière ligne « NNN espace »).
      const ls = buf.split("\r\n").filter(Boolean);
      const last = ls[ls.length - 1];
      if (!buf.endsWith("\r\n") || !/^\d{3} /.test(last || "")) return;
      const code = parseInt(last, 10); buf = "";
      const [want, next] = steps[step];
      if (code !== want) { sock.destroy(); return reject(new Error(`SMTP ${code} : ${last.slice(4, 120)}`)); }
      step++;
      if (!next) { sock.end(); return resolve(true); }
      sock.write(next() + "\r\n");
    });
    sock.on("error", reject);
  });
}

export async function sendMail(msg) {
  const from = env("MAIL_FROM", env("SMTP_USER", "fourmi.action@gmail.com"));
  const data = buildMessage({ from, fromName: "Fourmi’Action", replyTo: env("DI_NOTIFY", from), ...msg });
  if (env("DI_DEV_MAILBOX") === "1" && !env("SMTP_USER")) { devMailbox.push({ to: msg.to, subject: msg.subject, text: msg.text, attachments: msg.attachments?.map((a) => a.name) || [], raw: data, at: new Date().toISOString() }); return true; }
  return smtp({ host: env("SMTP_HOST", "smtp.gmail.com"), port: Number(env("SMTP_PORT", "465")), user: env("SMTP_USER"), pass: env("SMTP_PASS"), from, to: msg.to, data });
}

// Habillage commun des e-mails : sobre, lisible sur téléphone.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export function layout({ title, lines, button, foot }) {
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1d2a36">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:18px;padding:30px"><tr><td>
<p style="margin:0 0 6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#d9661f;font-weight:700">Fourmi’Action · Collectif jeunes</p>
<h1 style="margin:0 0 18px;font-size:24px;line-height:1.2;color:#142f46">${esc(title)}</h1>
${lines.map((l) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.55;color:#36434f">${esc(l)}</p>`).join("")}
${button ? `<p style="margin:22px 0"><a href="${esc(button.href)}" style="display:inline-block;background:#205391;color:#fff;text-decoration:none;font-weight:600;padding:13px 24px;border-radius:999px">${esc(button.label)}</a></p>` : ""}
${foot ? `<p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#86919c">${esc(foot)}</p>` : ""}
</td></tr></table><p style="font-size:12px;color:#86919c;margin:16px 0 0">Fourmi’Action · 43 rue Tino Rossi, 45400 Fleury-les-Aubrais · fourmi.action@gmail.com</p></td></tr></table></body></html>`;
  const text = [title, "", ...lines, button ? `\n${button.label} : ${button.href}` : "", foot ? `\n${foot}` : "", "\nFourmi’Action · fourmi.action@gmail.com"].join("\n");
  return { html, text };
}
