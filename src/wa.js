// Conexão com o WhatsApp por QR code (Baileys, forma não oficial).
// Cada cliente tem sua própria sessão guardada em DATA_DIR/wa/<id>.
import fs from "node:fs";
import path from "node:path";
import * as B from "@whiskeysockets/baileys";
import { config } from "./config.js";

const lib = B.makeWASocket ? B : (B.default && B.default.makeWASocket ? B.default : B);
const makeWASocket = lib.makeWASocket || lib.default || B.default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = lib;

const LOGGED_OUT = DisconnectReason?.loggedOut ?? 401;
const MAX_QR = 6; // depois de ~6 QR codes sem leitura, para de gerar

// Logger silencioso no formato que o Baileys espera
const quiet = {
  level: "silent",
  child() { return quiet; },
  trace() {}, debug() {}, info() {}, warn() {}, error() {}, fatal() {},
};

const sessions = new Map(); // tenantId -> estado
let handlers = { onStatus: () => {}, onMessage: async () => {}, onOwnerMessage: () => {} };

export function setHandlers(h) { handlers = { ...handlers, ...h }; }

const authDir = id => path.join(config.dataDir, "wa", String(id));
export const hasSavedSession = id => fs.existsSync(path.join(authDir(id), "creds.json"));

export function getStatus(id) {
  const s = sessions.get(id);
  if (!s) return { status: hasSavedSession(id) ? "connecting" : "disconnected", qr: null, number: "" };
  return { status: s.status, qr: s.status === "qr" ? s.qr : null, number: s.number || "" };
}

function setStatus(id, s, status) {
  s.status = status;
  handlers.onStatus(id, status, s.number || "");
}

const jidOf = sock => {
  const raw = sock?.user?.id || "";
  const num = raw.split(":")[0].split("@")[0];
  return num ? num + "@s.whatsapp.net" : null;
};

function textOf(msg) {
  const m = msg.message || {};
  const inner = m.ephemeralMessage?.message || m.viewOnceMessage?.message || m.viewOnceMessageV2?.message || m;
  return inner.conversation || inner.extendedTextMessage?.text || inner.imageMessage?.caption
    || inner.videoMessage?.caption || inner.buttonsResponseMessage?.selectedDisplayText
    || inner.listResponseMessage?.title || inner.templateButtonReplyMessage?.selectedDisplayText || "";
}
function kindOf(msg) {
  const m = msg.message || {};
  if (m.audioMessage) return "audio";
  if (m.imageMessage) return "image";
  if (m.videoMessage) return "video";
  if (m.documentMessage) return "document";
  if (m.stickerMessage) return "sticker";
  if (m.protocolMessage || m.reactionMessage || m.senderKeyDistributionMessage) return "system";
  return "text";
}
const ignoredJid = jid => !jid || jid.endsWith("@g.us") || jid === "status@broadcast"
  || jid.endsWith("@broadcast") || jid.endsWith("@newsletter");

export async function start(id) {
  const existing = sessions.get(id);
  if (existing && existing.status !== "disconnected") return;
  const s = existing || { status: "connecting", qr: null, number: "", botIds: new Set(), qrCount: 0, retries: 0, stopped: false };
  s.stopped = false; s.qrCount = 0;
  sessions.set(id, s);
  setStatus(id, s, "connecting");

  fs.mkdirSync(authDir(id), { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(authDir(id));
  let version;
  try { version = (await fetchLatestBaileysVersion()).version; } catch { /* usa a versão embutida */ }

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: state,
    logger: quiet,
    printQRInTerminal: false,
    browser: ["Micael Automacoes", "Chrome", "1.0"],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  });
  s.sock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", u => {
    if (s.sock !== sock) return;
    if (u.qr) {
      s.qrCount++;
      if (s.qrCount > MAX_QR && !state.creds?.registered) {
        s.stopped = true; s.qr = null;
        try { sock.end(undefined); } catch {}
        setStatus(id, s, "disconnected");
        return;
      }
      s.qr = u.qr;
      setStatus(id, s, "qr");
    }
    if (u.connection === "open") {
      s.qr = null; s.retries = 0;
      s.number = (sock.user?.id || "").split(":")[0].split("@")[0];
      setStatus(id, s, "connected");
    }
    if (u.connection === "close") {
      const code = u.lastDisconnect?.error?.output?.statusCode;
      if (code === LOGGED_OUT) {
        fs.rmSync(authDir(id), { recursive: true, force: true });
        s.number = ""; s.qr = null;
        setStatus(id, s, "disconnected");
        return;
      }
      if (s.stopped) { setStatus(id, s, "disconnected"); return; }
      s.retries++;
      const delay = Math.min(60000, 2000 * s.retries);
      setStatus(id, s, "connecting");
      setTimeout(() => {
        if (s.stopped || s.sock !== sock) return;
        s.status = "disconnected";
        start(id).catch(err => console.error("wa restart", id, err.message));
      }, delay);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      try {
        const jid = msg.key?.remoteJid;
        if (ignoredJid(jid)) continue;
        const ts = Number(msg.messageTimestamp || 0) * 1000;
        if (ts && Date.now() - ts > 3 * 60 * 1000) continue; // mensagem antiga
        const kind = kindOf(msg);
        if (kind === "system") continue;
        const text = textOf(msg);
        if (msg.key.fromMe) {
          if (s.botIds.has(msg.key.id)) continue;
          if (jid === jidOf(sock)) continue; // conversa consigo mesmo (avisos)
          handlers.onOwnerMessage(id, jid, text);
          continue;
        }
        try { await sock.readMessages([msg.key]); } catch {}
        await handlers.onMessage(id, { jid, text, kind, name: msg.pushName || "" });
      } catch (err) {
        console.error("wa message", id, err.message);
      }
    }
  });
}

export async function send(id, jid, text, { typing = true } = {}) {
  const s = sessions.get(id);
  if (!s?.sock || s.status !== "connected") return false;
  try {
    if (typing) {
      await s.sock.sendPresenceUpdate("composing", jid).catch(() => {});
      await new Promise(r => setTimeout(r, Math.min(4000, 800 + text.length * 15)));
      await s.sock.sendPresenceUpdate("paused", jid).catch(() => {});
    }
    const sent = await s.sock.sendMessage(jid, { text });
    if (sent?.key?.id) {
      s.botIds.add(sent.key.id);
      if (s.botIds.size > 500) s.botIds.delete(s.botIds.values().next().value);
    }
    return true;
  } catch (err) {
    console.error("wa send", id, err.message);
    return false;
  }
}

// Manda um aviso para o próprio número do dono (conversa "Você" / "Mensagem para mim")
export async function notifyOwner(id, text) {
  const s = sessions.get(id);
  const me = jidOf(s?.sock);
  if (!me) return false;
  return send(id, me, text, { typing: false });
}

export async function stop(id, { logout = false } = {}) {
  const s = sessions.get(id);
  if (s) {
    s.stopped = true;
    try { if (logout) await s.sock?.logout(); } catch {}
    try { s.sock?.end(undefined); } catch {}
    s.qr = null; s.number = logout ? "" : s.number;
    setStatus(id, s, "disconnected");
  }
  if (logout) fs.rmSync(authDir(id), { recursive: true, force: true });
}

// Ao ligar o servidor, reconecta quem já tinha escaneado o QR
export async function restoreAll(ids) {
  for (const id of ids) {
    if (!hasSavedSession(id)) continue;
    try { await start(id); } catch (err) { console.error("wa restore", id, err.message); }
    await new Promise(r => setTimeout(r, 1500));
  }
}
