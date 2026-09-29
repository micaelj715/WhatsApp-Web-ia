// Planos: preços por moeda, limite de respostas por mês e link de pagamento.
// Os valores abaixo são o padrão. Você muda tudo pelo /admin, sem mexer no código.
import { db } from "./db.js";

export const CURRENCIES = ["CVE", "EUR", "BRL", "USD"];
export const PLAN_KEYS = ["ess", "pro", "com"];
export const TRIAL_LIMIT = 300;

const DEFAULT_PLANS = {
  ess: { limit: 1500, link: "", price: { CVE: 3200, EUR: 29, BRL: 97, USD: 32 } },
  pro: { limit: 5000, link: "", price: { CVE: 6500, EUR: 59, BRL: 197, USD: 65 } },
  com: { limit: 15000, link: "", price: { CVE: 9800, EUR: 89, BRL: 297, USD: 99 } },
};

// O PayPal não aceita escudo (CVE). Quem paga em CVE paga o equivalente em euros.
// O escudo é fixo ao euro: 1 EUR = 110,265 CVE.
export const PAYPAL_CURRENCIES = ["EUR", "BRL", "USD"];
export const CVE_PER_EUR = 110.265;

db.exec("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)");

let cache = null;
export function getPlans() {
  if (cache) return cache;
  let saved = {};
  try { saved = JSON.parse(db.prepare("SELECT value FROM settings WHERE key = 'plans'").get()?.value || "{}"); } catch {}
  cache = {};
  for (const k of PLAN_KEYS) {
    const d = DEFAULT_PLANS[k], s = saved[k] || {};
    cache[k] = {
      limit: Number(s.limit) || d.limit,
      link: typeof s.link === "string" ? s.link : d.link,
      price: Object.fromEntries(CURRENCIES.map(c => [c, Number(s.price?.[c]) || d.price[c]])),
    };
  }
  return cache;
}
export const isPlan = k => PLAN_KEYS.includes(k);

export function savePlans(input) {
  const current = getPlans(), next = {};
  for (const k of PLAN_KEYS) {
    const i = input?.[k] || {}, c = current[k];
    const limit = Math.round(Number(i.limit ?? c.limit));
    if (!(limit >= 10 && limit <= 1_000_000)) throw Object.assign(new Error("bad_limit"), { field: k + ".limit" });
    const link = String(i.link ?? c.link).trim();
    if (link && !/^https:\/\/\S{4,500}$/.test(link)) throw Object.assign(new Error("bad_link"), { field: k + ".link" });
    const price = {};
    for (const cur of CURRENCIES) {
      const v = Number(i.price?.[cur] ?? c.price[cur]);
      if (!(v > 0 && v <= 10_000_000)) throw Object.assign(new Error("bad_price"), { field: `${k}.${cur}` });
      price[cur] = Math.round(v * 100) / 100;
    }
    next[k] = { limit, link, price };
  }
  db.prepare("INSERT INTO settings (key, value) VALUES ('plans', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(next));
  cache = null;
  return getPlans();
}

export function paypalAmount(plan, currency) {
  const p = getPlans()[plan];
  if (!p) return null;
  if (PAYPAL_CURRENCIES.includes(currency)) return { amount: p.price[currency], currency };
  return { amount: Math.ceil(p.price.CVE / CVE_PER_EUR), currency: "EUR" };
}

// Link de pagamento do plano (ou o link geral PAYPAL_LINK). Se for paypal.me, já vai com o valor.
export function paymentFor(plan, currency, fallbackLink = "") {
  const p = getPlans()[plan], amt = paypalAmount(plan, currency);
  const link = (p?.link || fallbackLink || "").replace(/\/$/, "");
  if (!link || !amt) return null;
  const full = /paypal\.me\/[^/]+$/i.test(link) ? `${link}/${amt.amount}${amt.currency}` : link;
  return { link: full, amount: amt.amount, currency: amt.currency };
}

export const publicPlans = () => Object.fromEntries(PLAN_KEYS.map(k => [k, { price: getPlans()[k].price, limit: getPlans()[k].limit }]));
