// Preços mensais por moeda e limite de respostas do atendente por mês.
// Para mudar preços, edite aqui e o site/painel se atualizam sozinhos.
export const CURRENCIES = ["CVE", "EUR", "BRL", "USD"];

export const PLANS = {
  ess: { limit: 1500, price: { CVE: 3200, EUR: 29, BRL: 97, USD: 32 } },
  pro: { limit: 5000, price: { CVE: 6500, EUR: 59, BRL: 197, USD: 65 } },
  com: { limit: 15000, price: { CVE: 9800, EUR: 89, BRL: 297, USD: 99 } },
};

export const TRIAL_LIMIT = 300;

// O PayPal não aceita escudo (CVE). Quem paga em CVE paga o equivalente em euros.
// O escudo é fixo ao euro: 1 EUR = 110,265 CVE.
export const PAYPAL_CURRENCIES = ["EUR", "BRL", "USD"];
export const CVE_PER_EUR = 110.265;

export function paypalAmount(plan, currency) {
  const p = PLANS[plan];
  if (!p) return null;
  if (PAYPAL_CURRENCIES.includes(currency)) return { amount: p.price[currency], currency };
  return { amount: Math.ceil(p.price.CVE / CVE_PER_EUR), currency: "EUR" };
}
