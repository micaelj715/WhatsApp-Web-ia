import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config.js";

fs.mkdirSync(config.dataDir, { recursive: true });
export const db = new DatabaseSync(path.join(config.dataDir, "app.db"));

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  pass TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'client',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business TEXT NOT NULL DEFAULT '',
  niche TEXT NOT NULL DEFAULT 'outro',
  country TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'pt',
  currency TEXT NOT NULL DEFAULT 'EUR',
  plan TEXT NOT NULL DEFAULT 'pro',
  suspended INTEGER NOT NULL DEFAULT 0,
  trial_ends TEXT NOT NULL,
  paid_until TEXT,
  bot_enabled INTEGER NOT NULL DEFAULT 1,
  config TEXT NOT NULL DEFAULT '{}',
  wa_status TEXT NOT NULL DEFAULT 'disconnected',
  wa_number TEXT NOT NULL DEFAULT '',
  usage_month TEXT NOT NULL DEFAULT '',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  chat TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(tenant_id, chat, at);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'claimed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export const today = () => new Date().toISOString().slice(0, 10);
export const thisMonth = () => new Date().toISOString().slice(0, 7);

export function addDays(dateStr, days) {
  const d = new Date((dateStr || today()) + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function addMonths(dateStr, months) {
  const d = new Date((dateStr || today()) + "T12:00:00Z");
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

export function getTenant(id) {
  const t = db.prepare("SELECT * FROM tenants WHERE id = ?").get(id);
  if (!t) return null;
  try { t.config = JSON.parse(t.config || "{}"); } catch { t.config = {}; }
  return t;
}

// Estado do plano: pago, em teste, vencido ou suspenso
export function accessState(t) {
  const d = today();
  if (t.suspended) return "suspended";
  if (t.paid_until && t.paid_until >= d) return "active";
  if (t.trial_ends >= d) return "trial";
  return "expired";
}

export function saveMessage(tenantId, chat, role, text, name = "") {
  db.prepare("INSERT INTO messages (tenant_id, chat, name, role, text, at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(tenantId, chat, name, role, String(text).slice(0, 4000), Date.now());
}

export function chatHistory(tenantId, chat, limit = 12) {
  return db.prepare("SELECT role, text FROM messages WHERE tenant_id = ? AND chat = ? ORDER BY at DESC, id DESC LIMIT ?")
    .all(tenantId, chat, limit).reverse();
}

// Conta respostas do mês e diz se ainda está dentro do limite
export function useQuota(tenantId, limit) {
  const m = thisMonth();
  const t = db.prepare("SELECT usage_month, usage_count FROM tenants WHERE id = ?").get(tenantId);
  const count = t.usage_month === m ? t.usage_count : 0;
  if (count >= limit) return false;
  db.prepare("UPDATE tenants SET usage_month = ?, usage_count = ? WHERE id = ?").run(m, count + 1, tenantId);
  return true;
}

export function usageOf(t) {
  return t.usage_month === thisMonth() ? t.usage_count : 0;
}

// Limpeza diária: sessões vencidas e mensagens com mais de 60 dias
export function cleanup() {
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  db.prepare("DELETE FROM messages WHERE at < ?").run(Date.now() - 60 * 864e5);
}
