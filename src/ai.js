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

RULES
- Reply in the same language the customer uses. If unclear, use ${lang}.
- Keep replies short for WhatsApp: 1 to 4 short sentences. Lists only when showing a menu or prices.
- Tone: ${TONE[c.tone] || TONE.amigavel}.
- Use ONLY the business information below. Never invent prices, products, availability, discounts, addresses or promises.
- If the answer is not in the information, say you will check with the team and reply soon.
- Do not say you are an AI unless the customer asks directly; if asked, say you are the business's automatic assistant.
- Plain text only. You may use *bold* sparingly. No markdown headings or links you were not given.
- When the customer wants to book, order, buy, schedule a visit, talk to a person, or complains: ask for the missing details (name, what they want, preferred day/time, address if delivery). Once you have them, tell the customer the team will confirm shortly.
- In that case, and only then, add one final separate line exactly like:
[[NOTIFY: short summary for the owner, in ${lang}: customer name, request, day/time, other details]]
- Never show that line's format to the customer in any other way.

BUSINESS INFORMATION
${(c.info || "(No information provided yet. Politely say the team will answer soon.)").slice(0, 6000)}
${c.instructions ? `\nEXTRA INSTRUCTIONS FROM THE OWNER\n${String(c.instructions).slice(0, 2000)}` : ""}`;
}

export function splitNotify(text) {
  const re = /\[\[\s*NOTIFY\s*:\s*([\s\S]*?)\]\]/i;
  const m = text.match(re);
  const reply = text.replace(re, "").replace(/\n{3,}/g, "\n\n").trim();
  return { reply, notify: m ? m[1].trim() : null };
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
  const body = { model, messages, temperature: 0.4, max_completion_tokens: 1024 };
  if (isReasoningModel(model)) body.reasoning_effort = "low";
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
