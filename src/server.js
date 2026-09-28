import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { config, assertConfig } from "./config.js";
import { db, getTenant, accessState, saveMessage, chatHistory, useQuota, usageOf, today, addDays, addMonths, cleanup } from "./db.js";
import { PLANS, CURRENCIES, TRIAL_LIMIT, paypalAmount } from "./plans.js";
import { answer } from "./ai.js";
import * as wa from "./wa.js";
import { createRouter, parseCookies, readJson, sendJson, redirect, serveFile, safeJoin, HttpError } from "./http.js";

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");
const LANGS = ["pt", "en", "fr", "es"];
const NICHES = ["clinica", "salao", "restaurante", "imobiliaria", "outro"];
const TONES = ["amigavel", "formal", "descontraido"];
const SESSION_DAYS = 30;
const log = (...a) => console.log(new Date().toISOString(), ...a);

/* ================= Senhas e sessões ================= */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
function checkPassword(pw, stored) {
  const [, salt, hash] = String(stored).split("$");
  if (!salt || !hash) return false;
  const a = crypto.scryptSync(pw, salt, 64), b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function createSession(res, req, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, Date.now() + SESSION_DAYS * 864e5);
  res.setHeader("Set-Cookie", cookie("sid", token, SESSION_DAYS * 86400, req));
}
function cookie(name, value, maxAge, req) {
  const secure = (req.headers["x-forwarded-proto"] || "").includes("https") || config.publicUrl.startsWith("https");
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
function currentUser(req) {
  const token = parseCookies(req).sid;
  if (!token) return null;
  const row = db.prepare("SELECT u.id, u.email, u.name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?").get(token);
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role, token };
}

/* ================= Limite de tentativas ================= */
const hits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const h = hits.get(key) || { n: 0, reset: now + windowMs };
  if (now > h.reset) { h.n = 0; h.reset = now + windowMs; }
  h.n++; hits.set(key, h);
  if (h.n > max) throw new HttpError(429, "too_many_attempts");
}
setInterval(() => { const now = Date.now(); for (const [k, h] of hits) if (now > h.reset) hits.delete(k); }, 10 * 60 * 1000).unref();
const ipOf = req => (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "";

/* ================= Atendente (robô) ================= */
const paused = new Map();   // "tid|jid" -> até quando o robô fica calado nessa conversa
const pending = new Map();  // "tid|jid" -> timer de espera (junta mensagens seguidas)
const mediaNotice = new Map();
const quotaWarned = new Set();

const MEDIA_MSG = {
  pt: "Recebi sua mensagem! Por enquanto consigo ler só mensagens de texto. Pode escrever o que precisa?",
  en: "Got your message! For now I can only read text messages. Could you type what you need?",
  fr: "Message reçu ! Pour l'instant je ne lis que les messages écrits. Pouvez-vous écrire votre demande ?",
  es: "¡Recibí tu mensaje! Por ahora solo puedo leer mensajes de texto. ¿Puedes escribir lo que necesitas?",
};
const NOTIFY_TITLE = { pt: "Aviso do atendente", en: "Assistant alert", fr: "Alerte de l'assistant", es: "Aviso del asistente" };
const QUOTA_MSG = {
  pt: "Seu atendente atingiu o limite de respostas do mês e parou de responder. Mude de plano no painel para continuar.",
  en: "Your assistant reached this month's reply limit and stopped replying. Upgrade your plan in the dashboard to continue.",
  fr: "Votre assistant a atteint la limite de réponses du mois et ne répond plus. Changez d'offre dans le tableau de bord pour continuer.",
  es: "Tu asistente alcanzó el límite de respuestas del mes y dejó de responder. Cambia de plan en el panel para continuar.",
};

const isPaused = key => (paused.get(key) || 0) > Date.now();
const botCanReply = t => t && t.bot_enabled && ["trial", "active"].includes(accessState(t));
const phoneOf = jid => jid.endsWith("@s.whatsapp.net") ? "+" + jid.split("@")[0] : "";

wa.setHandlers({
  onStatus(id, status, number) {
    db.prepare("UPDATE tenants SET wa_status = ?, wa_number = ? WHERE id = ?").run(status, number || "", id);
  },
  onOwnerMessage(id, jid, text) {
    const t = getTenant(id);
    if (!t) return;
    const minutes = Number(t.config.pauseMinutes ?? 60);
    if (minutes > 0) paused.set(id + "|" + jid, Date.now() + minutes * 60000);
    const key = id + "|" + jid;
    if (pending.has(key)) { clearTimeout(pending.get(key)); pending.delete(key); }
    if (text) saveMessage(id, jid, "owner", text);
  },
  async onMessage(id, { jid, text, kind, name }) {
    const t = getTenant(id);
    if (!t) return;
    const key = id + "|" + jid;
    if (!text) {
      saveMessage(id, jid, "user", `[${kind}]`, name);
      if (!botCanReply(t) || isPaused(key) || t.config.mediaReply === false) return;
      if ((mediaNotice.get(key) || 0) > Date.now()) return;
      mediaNotice.set(key, Date.now() + 60 * 60000);
      const msg = MEDIA_MSG[t.lang] || MEDIA_MSG.pt;
      if (await wa.send(id, jid, msg)) saveMessage(id, jid, "assistant", msg);
      return;
    }
    saveMessage(id, jid, "user", text, name);
    if (!botCanReply(t) || isPaused(key)) return;
    if (pending.has(key)) clearTimeout(pending.get(key));
    pending.set(key, setTimeout(() => { pending.delete(key); reply(id, jid, name).catch(e => log("reply error", id, e.message)); }, 3500));
  },
});

async function reply(id, jid, name) {
  const t = getTenant(id);
  const key = id + "|" + jid;
  if (!botCanReply(t) || isPaused(key)) return;
  const state = accessState(t);
  const limit = state === "trial" ? TRIAL_LIMIT : (PLANS[t.plan]?.limit || PLANS.ess.limit);
  if (!useQuota(id, limit)) {
    const mk = id + "|" + new Date().toISOString().slice(0, 7);
    if (!quotaWarned.has(mk)) { quotaWarned.add(mk); await wa.notifyOwner(id, QUOTA_MSG[t.lang] || QUOTA_MSG.pt); }
    return;
  }
  const history = chatHistory(id, jid, 14).map(h => ({ role: h.role === "user" ? "user" : "assistant", text: h.text }));
  const { reply: text, notify } = await answer(t, history);
  if (isPaused(key)) return; // o dono respondeu enquanto a IA pensava
  if (text && await wa.send(id, jid, text)) saveMessage(id, jid, "assistant", text);
  if (notify && t.config.notifyOwner !== false) {
    const who = [name, phoneOf(jid)].filter(Boolean).join(" · ");
    await wa.notifyOwner(id, `*${NOTIFY_TITLE[t.lang] || NOTIFY_TITLE.pt}*\n${who ? who + "\n" : ""}${notify}`);
  }
}

/* ================= Dados que o painel mostra ================= */
function paypalFor(t) {
  const p = paypalAmount(t.plan, t.currency);
  if (!config.paypalLink || !p) return null;
  const link = /paypal\.me\//i.test(config.paypalLink) ? `${config.paypalLink}/${p.amount}${p.currency}` : config.paypalLink;
  return { link, amount: p.amount, currency: p.currency };
}
function tenantView(t) {
  const state = accessState(t);
  return {
    business: t.business, niche: t.niche, country: t.country, lang: t.lang, currency: t.currency, plan: t.plan,
    bot_enabled: !!t.bot_enabled, config: t.config, trial_ends: t.trial_ends, paid_until: t.paid_until, state,
    usage: usageOf(t), limit: state === "trial" ? TRIAL_LIMIT : PLANS[t.plan]?.limit,
    wa: wa.getStatus(t.id), paypal: paypalFor(t),
    pendingPayment: !!db.prepare("SELECT 1 FROM payments WHERE tenant_id = ? AND status = 'claimed'").get(t.id),
  };
}

function cleanConfig(input, prev) {
  const c = { ...prev };
  if (input.info !== undefined) c.info = String(input.info).slice(0, 6000);
  if (input.instructions !== undefined) c.instructions = String(input.instructions).slice(0, 2000);
  if (TONES.includes(input.tone)) c.tone = input.tone;
  if (input.notifyOwner !== undefined) c.notifyOwner = !!input.notifyOwner;
  if (input.mediaReply !== undefined) c.mediaReply = !!input.mediaReply;
  if (input.pauseMinutes !== undefined) c.pauseMinutes = Math.max(0, Math.min(1440, Number(input.pauseMinutes) || 0));
  return c;
}

/* ================= Rotas ================= */
const r = createRouter();
const needUser = req => { const u = currentUser(req); if (!u) throw new HttpError(401, "not_logged_in"); return u; };
const needAdmin = req => { const u = needUser(req); if (u.role !== "admin") throw new HttpError(403, "forbidden"); return u; };
const needTenant = req => { const u = needUser(req); const t = getTenant(u.id); if (!t) throw new HttpError(404, "no_tenant"); return { u, t }; };

r.get("/api/health", (req, res) => sendJson(res, 200, { ok: true }));

r.get("/api/public", (req, res) => sendJson(res, 200, {
  plans: Object.fromEntries(Object.entries(PLANS).map(([k, p]) => [k, { price: p.price, limit: p.limit }])),
  trialDays: config.trialDays, trialLimit: TRIAL_LIMIT, support: config.supportWhatsapp,
}));

r.post("/api/signup", async (req, res) => {
  rateLimit("auth:" + ipOf(req), 20, 15 * 60000);
  const b = await readJson(req);
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  const business = String(b.business || "").trim().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "invalid_email");
  if (password.length < 8) throw new HttpError(400, "weak_password");
  if (!business) throw new HttpError(400, "missing_business");
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) throw new HttpError(409, "email_taken");
  const lang = LANGS.includes(b.lang) ? b.lang : "pt";
  const currency = CURRENCIES.includes(b.currency) ? b.currency : "EUR";
  const plan = PLANS[b.plan] ? b.plan : "pro";
  const niche = NICHES.includes(b.niche) ? b.niche : "outro";
  const info = db.prepare("INSERT INTO users (email, pass, name, role) VALUES (?, ?, ?, 'client')")
    .run(email, hashPassword(password), String(b.name || "").trim().slice(0, 80));
  const id = Number(info.lastInsertRowid);
  const cfg = { tone: "amigavel", info: "", instructions: "", notifyOwner: true, mediaReply: true, pauseMinutes: 60 };
  db.prepare("INSERT INTO tenants (id, business, niche, country, lang, currency, plan, trial_ends, config) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, business, niche, String(b.country || "").slice(0, 60), lang, currency, plan, addDays(today(), config.trialDays), JSON.stringify(cfg));
  createSession(res, req, id);
  log("novo cliente", id, email);
  sendJson(res, 200, { ok: true });
});

r.post("/api/login", async (req, res) => {
  rateLimit("auth:" + ipOf(req), 20, 15 * 60000);
  const b = await readJson(req);
  const email = String(b.email || "").trim().toLowerCase();
  const u = db.prepare("SELECT id, pass, role FROM users WHERE email = ?").get(email);
  if (!u || !checkPassword(String(b.password || ""), u.pass)) throw new HttpError(401, "wrong_login");
  createSession(res, req, u.id);
  sendJson(res, 200, { ok: true, role: u.role });
});

r.post("/api/logout", (req, res) => {
  const token = parseCookies(req).sid;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  res.setHeader("Set-Cookie", cookie("sid", "", 0, req));
  sendJson(res, 200, { ok: true });
});

r.post("/api/account/password", async (req, res) => {
  const u = needUser(req);
  const b = await readJson(req);
  const row = db.prepare("SELECT pass FROM users WHERE id = ?").get(u.id);
  if (!checkPassword(String(b.current || ""), row.pass)) throw new HttpError(401, "wrong_password");
  if (String(b.password || "").length < 8) throw new HttpError(400, "weak_password");
  db.prepare("UPDATE users SET pass = ? WHERE id = ?").run(hashPassword(String(b.password)), u.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND token != ?").run(u.id, u.token);
  sendJson(res, 200, { ok: true });
});

r.get("/api/me", (req, res) => {
  const u = needUser(req);
  const t = getTenant(u.id);
  sendJson(res, 200, {
    user: { name: u.name, email: u.email, role: u.role },
    tenant: t ? tenantView(t) : null,
    plans: Object.fromEntries(Object.entries(PLANS).map(([k, p]) => [k, { price: p.price, limit: p.limit }])),
    trialLimit: TRIAL_LIMIT, support: config.supportWhatsapp,
  });
});

r.put("/api/tenant", async (req, res) => {
  const { t } = needTenant(req);
  const b = await readJson(req);
  const next = {
    business: b.business !== undefined ? String(b.business).trim().slice(0, 120) || t.business : t.business,
    niche: NICHES.includes(b.niche) ? b.niche : t.niche,
    country: b.country !== undefined ? String(b.country).slice(0, 60) : t.country,
    lang: LANGS.includes(b.lang) ? b.lang : t.lang,
    currency: CURRENCIES.includes(b.currency) ? b.currency : t.currency,
    plan: PLANS[b.plan] ? b.plan : t.plan,
    bot_enabled: b.bot_enabled !== undefined ? (b.bot_enabled ? 1 : 0) : t.bot_enabled,
    config: JSON.stringify(b.config ? cleanConfig(b.config, t.config) : t.config),
  };
  db.prepare("UPDATE tenants SET business=?, niche=?, country=?, lang=?, currency=?, plan=?, bot_enabled=?, config=? WHERE id=?")
    .run(next.business, next.niche, next.country, next.lang, next.currency, next.plan, next.bot_enabled, next.config, t.id);
  sendJson(res, 200, { ok: true, tenant: tenantView(getTenant(t.id)) });
});

r.get("/api/wa/status", (req, res) => {
  const { t } = needTenant(req);
  sendJson(res, 200, wa.getStatus(t.id));
});
r.post("/api/wa/connect", async (req, res) => {
  const { t } = needTenant(req);
  if (accessState(t) === "suspended") throw new HttpError(403, "suspended");
  rateLimit("wa:" + t.id, 10, 10 * 60000);
  await wa.start(t.id);
  sendJson(res, 200, wa.getStatus(t.id));
});
r.post("/api/wa/disconnect", async (req, res) => {
  const { t } = needTenant(req);
  await wa.stop(t.id, { logout: true });
  sendJson(res, 200, wa.getStatus(t.id));
});

r.post("/api/test-chat", async (req, res) => {
  const { t } = needTenant(req);
  rateLimit("test:" + t.id, 40, 60 * 60000);
  const b = await readJson(req);
  const history = (Array.isArray(b.history) ? b.history : []).slice(-14)
    .map(h => ({ role: h.role === "user" ? "user" : "assistant", text: String(h.text || "").slice(0, 1000) }))
    .filter(h => h.text);
  if (!history.length || history.at(-1).role !== "user") throw new HttpError(400, "empty");
  try {
    const out = await answer(t, history);
    sendJson(res, 200, out);
  } catch (e) {
    log("test-chat", t.id, e.message);
    throw new HttpError(503, e.message === "missing_groq_key" ? "ai_not_configured" : "ai_busy");
  }
});

r.get("/api/conversations", (req, res) => {
  const { t } = needTenant(req);
  const rows = db.prepare(`
    SELECT m.chat, MAX(m.at) AS last_at,
      (SELECT name FROM messages WHERE tenant_id = m.tenant_id AND chat = m.chat AND name != '' ORDER BY at DESC LIMIT 1) AS name,
      (SELECT text FROM messages WHERE tenant_id = m.tenant_id AND chat = m.chat ORDER BY at DESC, id DESC LIMIT 1) AS last_text,
      COUNT(*) AS total
    FROM messages m WHERE m.tenant_id = ? GROUP BY m.chat ORDER BY last_at DESC LIMIT 60`).all(t.id);
  sendJson(res, 200, rows.map(r => ({ ...r, phone: phoneOf(r.chat), paused: isPaused(t.id + "|" + r.chat) })));
});
r.get("/api/conversations/:chat", (req, res, p) => {
  const { t } = needTenant(req);
  const rows = db.prepare("SELECT role, text, at FROM messages WHERE tenant_id = ? AND chat = ? ORDER BY at DESC, id DESC LIMIT 100").all(t.id, p.chat);
  sendJson(res, 200, { messages: rows.reverse(), paused: isPaused(t.id + "|" + p.chat) });
});
r.post("/api/conversations/:chat/pause", async (req, res, p) => {
  const { t } = needTenant(req);
  const b = await readJson(req);
  const minutes = Math.max(0, Math.min(10080, Number(b.minutes) || 0));
  const key = t.id + "|" + p.chat;
  if (minutes) paused.set(key, Date.now() + minutes * 60000); else paused.delete(key);
  sendJson(res, 200, { paused: isPaused(key) });
});

r.post("/api/payments/claim", async (req, res) => {
  const { t } = needTenant(req);
  const b = await readJson(req);
  const p = paypalAmount(t.plan, t.currency);
  if (db.prepare("SELECT 1 FROM payments WHERE tenant_id = ? AND status = 'claimed'").get(t.id)) throw new HttpError(409, "already_claimed");
  db.prepare("INSERT INTO payments (tenant_id, plan, amount, currency, note) VALUES (?, ?, ?, ?, ?)")
    .run(t.id, t.plan, p.amount, p.currency, String(b.note || "").slice(0, 300));
  log("pagamento informado", t.id, p.amount, p.currency);
  sendJson(res, 200, { ok: true });
});

/* ---------- Administração ---------- */
r.get("/api/admin/overview", (req, res) => {
  needAdmin(req);
  const tenants = db.prepare("SELECT t.id FROM tenants t ORDER BY t.created_at DESC").all().map(({ id }) => {
    const t = getTenant(id);
    const u = db.prepare("SELECT email, name, created_at FROM users WHERE id = ?").get(id);
    return {
      id, email: u.email, name: u.name, created_at: u.created_at, business: t.business, niche: t.niche, country: t.country,
      lang: t.lang, currency: t.currency, plan: t.plan, price: PLANS[t.plan]?.price[t.currency] ?? 0, state: accessState(t),
      trial_ends: t.trial_ends, paid_until: t.paid_until, usage: usageOf(t), bot_enabled: !!t.bot_enabled,
      wa: wa.getStatus(id), suspended: !!t.suspended,
    };
  });
  const payments = db.prepare(`SELECT p.*, t.business, u.email FROM payments p JOIN tenants t ON t.id = p.tenant_id JOIN users u ON u.id = p.tenant_id
    ORDER BY p.status = 'claimed' DESC, p.created_at DESC LIMIT 100`).all();
  sendJson(res, 200, { tenants, payments });
});

function extend(id, months) {
  const t = getTenant(id);
  if (!t) throw new HttpError(404, "not_found");
  const base = t.paid_until && t.paid_until >= today() ? t.paid_until : today();
  db.prepare("UPDATE tenants SET paid_until = ?, suspended = 0 WHERE id = ?").run(addMonths(base, months), id);
}

r.post("/api/admin/tenants/:id", async (req, res, p) => {
  needAdmin(req);
  const id = Number(p.id);
  const b = await readJson(req);
  if (!getTenant(id)) throw new HttpError(404, "not_found");
  if (b.action === "extend") extend(id, Math.max(1, Math.min(24, Number(b.months) || 1)));
  else if (b.action === "suspend") { db.prepare("UPDATE tenants SET suspended = 1 WHERE id = ?").run(id); }
  else if (b.action === "unsuspend") db.prepare("UPDATE tenants SET suspended = 0 WHERE id = ?").run(id);
  else if (b.action === "trial") db.prepare("UPDATE tenants SET trial_ends = ? WHERE id = ?").run(addDays(today(), Math.max(1, Math.min(60, Number(b.days) || 7))), id);
  else if (b.action === "plan" && PLANS[b.plan]) db.prepare("UPDATE tenants SET plan = ? WHERE id = ?").run(b.plan, id);
  else throw new HttpError(400, "bad_action");
  sendJson(res, 200, { ok: true });
});

r.post("/api/admin/payments/:id/:action", (req, res, p) => {
  needAdmin(req);
  const pay = db.prepare("SELECT * FROM payments WHERE id = ?").get(Number(p.id));
  if (!pay || pay.status !== "claimed") throw new HttpError(404, "not_found");
  if (p.action === "confirm") {
    db.prepare("UPDATE tenants SET plan = ? WHERE id = ?").run(pay.plan, pay.tenant_id);
    extend(pay.tenant_id, 1);
    db.prepare("UPDATE payments SET status = 'confirmed' WHERE id = ?").run(pay.id);
  } else if (p.action === "reject") {
    db.prepare("UPDATE payments SET status = 'rejected' WHERE id = ?").run(pay.id);
  } else throw new HttpError(400, "bad_action");
  sendJson(res, 200, { ok: true });
});

/* ---------- Páginas ---------- */
const page = file => (req, res) => serveFile(res, path.join(PUBLIC, file));
r.get("/", page("index.html"));
r.get("/entrar", (req, res) => currentUser(req) ? redirect(res, "/app") : serveFile(res, path.join(PUBLIC, "entrar.html")));
r.get("/app", (req, res) => {
  const u = currentUser(req);
  if (!u) return redirect(res, "/entrar");
  if (u.role === "admin") return redirect(res, "/admin");
  serveFile(res, path.join(PUBLIC, "app.html"));
});
r.get("/admin", (req, res) => {
  const u = currentUser(req);
  if (!u || u.role !== "admin") return redirect(res, "/entrar");
  serveFile(res, path.join(PUBLIC, "admin.html"));
});

/* ================= Servidor ================= */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  try {
    if (url.pathname.startsWith("/api/") && req.method !== "GET" && req.headers["x-requested-with"] !== "fetch")
      throw new HttpError(403, "csrf");
    const m = r.match(req.method, url.pathname);
    if (m) return await m.handler(req, res, m.params);
    if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
      const file = safeJoin(PUBLIC, url.pathname);
      if (file) return serveFile(res, file, { cache: /\.(png|svg|css)$/.test(file) });
    }
    throw new HttpError(404, "not_found");
  } catch (e) {
    if (res.headersSent) return;
    if (e instanceof HttpError) return sendJson(res, e.status, { error: e.code });
    log("erro", req.method, url.pathname, e.stack || e.message);
    sendJson(res, 500, { error: "server_error" });
  }
});

function ensureAdmin() {
  if (!config.adminEmail || config.adminPassword.length < 8) return;
  const row = db.prepare("SELECT id FROM users WHERE email = ?").get(config.adminEmail);
  if (row) db.prepare("UPDATE users SET pass = ?, role = 'admin' WHERE id = ?").run(hashPassword(config.adminPassword), row.id);
  else db.prepare("INSERT INTO users (email, pass, name, role) VALUES (?, ?, 'Admin', 'admin')").run(config.adminEmail, hashPassword(config.adminPassword));
}

assertConfig(log);
ensureAdmin();
cleanup();
setInterval(cleanup, 12 * 3600 * 1000).unref();
db.prepare("UPDATE tenants SET wa_status = 'disconnected'").run();
server.listen(config.port, () => {
  log(`Servidor no ar na porta ${config.port}. Dados em ${config.dataDir}`);
  wa.restoreAll(db.prepare("SELECT id FROM tenants WHERE suspended = 0").all().map(x => x.id))
    .catch(e => log("restore", e.message));
});

for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => { log("desligando"); server.close(); setTimeout(() => process.exit(0), 1500).unref(); });
process.on("unhandledRejection", e => log("unhandledRejection", e?.stack || e));
