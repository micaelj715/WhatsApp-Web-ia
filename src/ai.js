import { config } from "./config.js";

const NICHE_LABEL = {
  clinica: "clinic / dental office",
  salao: "hair salon / barbershop",
  restaurante: "restaurant / food delivery",
  imobiliaria: "real estate agency",
  outro: "local business",
};
const LANG_LABEL = { pt: "Portuguese", en: "English", fr: "French", es: "Spanish" };
const TONE = {
  amigavel: "warm and friendly, like a helpful receptionist",
  formal: "polite and professional",
  descontraido: "relaxed and casual, but respectful",
};

export function systemPrompt(t) {
  const c = t.config || {};
  const lang = LANG_LABEL[t.lang] || "Portuguese";
  return `You are the WhatsApp customer service assistant of "${t.business || "the business"}", a ${NICHE_LABEL[t.niche] || "local business"}.

MOST IMPORTANT RULE: NEVER INVENT
- Every fact you state (price, size, rooms, bathrooms, furniture, parking, views, features, availability, schedule, address, conditions) must be written in BUSINESS INFORMATION below.
- If a detail is not written there, do not mention it. Do not "complete" a description with typical features. If the customer asks for it, say you will confirm with the team.
- Before sending, check each fact in your reply against the information. Remove anything that is not there.

STYLE
- Reply in the same language the customer uses. If unclear, use ${lang}.
- WhatsApp style: short. Normally 1 to 3 sentences, maximum about 60 words. When listing items, max 3 items, one short line each.
- Tone: ${TONE[c.tone] || TONE.amigavel}.
- Formatting: plain text. For bold use ONE asterisk like *this*. Never use **double asterisks**, # headings, tables or links you were not given.
- End with at most one question that moves the customer forward.
- Do not say you are an AI unless asked directly; then say you are the business's automatic assistant.

ORDERS, BOOKINGS, VISITS, PURCHASES, TALKING TO A PERSON, COMPLAINTS
- Collect what is missing, one or two questions at a time: the customer's name, what exactly they want, and the preferred day/time (address if delivery).
- Only when you have the name AND the request AND (a day/time, or the customer asked for a human, or it is a complaint): tell the customer the team will confirm shortly, and add one final separate line exactly like:
[[NOTIFY: summary for the owner, in ${lang}: customer name, request, day/time, other details]]
- While you are still asking for details, do NOT add that line.
- Never show that line's format to the customer in any other way.

BUSINESS INFORMATION
${(c.info || "(No information provided yet. Politely say the team will answer soon.)").slice(0, 6000)}
${c.instructions ? `\nEXTRA INSTRUCTIONS FROM THE OWNER\n${String(c.instructions).slice(0, 2000)}` : ""}`;
}

// Deixa a resposta no formato do WhatsApp
export function whatsappFormat(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/__(.+?)__/g, "_$1_")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1 $2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitNotify(text) {
  const re = /\[\[\s*NOTIFY\s*:\s*([\s\S]*?)\]\]/i;
  const m = text.match(re);
  const reply = whatsappFormat(text.replace(re, ""));
  let notify = m ? m[1].trim() : null;
  // Aviso incompleto (ainda esperando nome ou horário) não vai para o dono
  if (notify && /aguard|pendente|falta(m)? |a confirmar nome|waiting for|pending|missing|en attente|manque|esperando|pendiente/i.test(notify)) notify = null;
  return { reply, notify };
}

// Fila simples: poucas chamadas ao Groq ao mesmo tempo
let running = 0;
const queue = [];
function acquire() {
  if (running < config.aiConcurrency) { running++; return Promise.resolve(); }
  return new Promise(r => queue.push(r));
}
function release() {
  const next = queue.shift();
  if (next) next(); else running--;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

const isReasoningModel = m => /gpt-oss|qwen/i.test(m);

// Erro com um código que o painel entende
function aiError(code, detail, retryAfter) {
  const e = new Error(code + (detail ? ": " + detail : ""));
  e.code = code; e.detail = detail || ""; if (retryAfter) e.retryAfter = retryAfter;
  return e;
}

async function callGroq(model, messages) {
  const body = { model, messages, temperature: 0.2, max_completion_tokens: 1500 };
  if (isReasoningModel(model)) body.reasoning_effort = process.env.AI_REASONING || "medium";
  let res;
  try {
    res = await fetch(config.groqBaseUrl + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + config.groqKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(40000),
    });
  } catch (e) {
    throw aiError("ai_network", e.message, 3);
  }
  if (res.ok) {
    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content || "").trim();
    if (!text) throw aiError("ai_empty", "resposta vazia do modelo " + model);
    return text;
  }
  const raw = (await res.text()).slice(0, 400);
  let msg = raw; try { msg = JSON.parse(raw).error?.message || raw; } catch {}
  if (res.status === 401) throw aiError("ai_bad_key", msg);
  if (res.status === 429 || res.status >= 500)
    throw aiError("ai_busy", `${res.status} ${msg}`, Math.min(20, Number(res.headers.get("retry-after")) || 3));
  // 400/403/404: normalmente modelo inexistente, desativado ou fora do plano
  throw aiError("ai_bad_model", `${model}: ${res.status} ${msg}`);
}

// history: [{role:'user'|'assistant', text}]
export async function answer(tenant, history) {
  if (!config.groqKey) throw aiError("missing_groq_key");
  const messages = [{ role: "system", content: systemPrompt(tenant) }];
  for (const h of history) messages.push({ role: h.role === "user" ? "user" : "assistant", content: h.text });
  await acquire();
  try {
    const models = [...new Set([config.groqModel, config.groqFallbackModel])];
    let lastErr;
    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return splitNotify(await callGroq(model, messages));
        } catch (e) {
          lastErr = e;
          console.error(new Date().toISOString(), "groq", model, e.message);
          if (e.code === "ai_bad_key") throw e;           // chave errada: não adianta insistir
          if (e.code === "ai_bad_model") break;           // tenta o próximo modelo
          if (e.retryAfter) await sleep(e.retryAfter * 1000);
        }
      }
    }
    throw lastErr || aiError("ai_empty");
  } finally {
    release();
  }
}

// Usado no /admin para testar a chave e os modelos
export async function checkAI() {
  if (!config.groqKey) return { ok: false, code: "missing_groq_key" };
  const results = [];
  for (const model of [...new Set([config.groqModel, config.groqFallbackModel])]) {
    const started = Date.now();
    try {
      const text = await callGroq(model, [{ role: "user", content: "Responda só: OK" }]);
      results.push({ model, ok: true, ms: Date.now() - started, sample: text.slice(0, 60) });
    } catch (e) {
      results.push({ model, ok: false, code: e.code, detail: e.detail });
      if (e.code === "ai_bad_key") break;
    }
  }
  return { ok: results.some(r => r.ok), results };
}
