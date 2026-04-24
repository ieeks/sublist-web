export const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.0852,
  TRY: 52.9272,
  INR: 109.5025,
};

const CACHE_KEY = "fx_rates";
const CACHE_TS_KEY = "fx_rates_ts";
const TTL_MS = 24 * 60 * 60 * 1000;

export async function fetchFxRates(): Promise<Record<string, number>> {
  if (typeof window === "undefined") return { ...FALLBACK_RATES };
  try {
    const ts = window.localStorage.getItem(CACHE_TS_KEY);
    const cached = window.localStorage.getItem(CACHE_KEY);
    if (ts && cached && Date.now() - Number(ts) < TTL_MS) {
      return JSON.parse(cached) as Record<string, number>;
    }
    const resp = await fetch("https://open.er-api.com/v6/latest/EUR");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = (await resp.json()) as { rates: Record<string, number> };
    const rates: Record<string, number> = { EUR: 1, ...json.rates };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    window.localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
    return rates;
  } catch {
    try {
      const cached = window.localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached) as Record<string, number>;
    } catch {
      // fall through to hardcoded fallback
    }
    return { ...FALLBACK_RATES };
  }
}

/** Convert amountCents in `currency` to EUR cents. */
export function toEurCents(
  amountCents: number,
  currency: string,
  rates: Record<string, number>,
): number {
  if (currency === "EUR") return amountCents;
  const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
  return Math.round(amountCents / rate);
}

/** Convert amountCents from `from` to `to` currency (routing through EUR). */
export function convertCurrency(
  amountCents: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  if (from === to) return amountCents;
  const eur = toEurCents(amountCents, from, rates);
  if (to === "EUR") return eur;
  const toRate = rates[to] ?? FALLBACK_RATES[to] ?? 1;
  return Math.round(eur * toRate);
}
