import type { AppData } from './types';
import { validateDraft } from './validation';

export function parseLegacyData(raw: string): AppData | null {
  try {
    const data = JSON.parse(raw) as AppData;
    if (!Array.isArray(data?.subscriptions) || !Array.isArray(data.categories) || !Array.isArray(data.paymentMethods) || !Array.isArray(data.paymentHistory) || !data.settings) return null;
    for (const sub of data.subscriptions) {
      if (typeof sub.amountCents !== 'number' || !Number.isSafeInteger(sub.amountCents)) return null;
      validateDraft({ ...sub, amount: (sub.amountCents / 100).toFixed(2), rewards: sub.rewards || '' });
    }
    return data;
  } catch { return null; }
}
