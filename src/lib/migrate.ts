import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { validateDraft } from './validation';
import type { AppData } from './types';

const REF = doc(db, 'sublist', 'data');
const LS_KEY = 'sublist-web-state';

/**
 * One-time migration: copies existing localStorage data into Firestore.
 * Checks localStorage first — if empty, returns immediately without any
 * network call so the onSnapshot listener can start without extra latency.
 */
export async function migrateFromLocalStorageIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Fast path: no localStorage data → nothing to migrate, skip network call
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed?.subscriptions?.length) return;
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.paymentMethods) || !Array.isArray(parsed.paymentHistory) || !parsed.settings) throw new Error('Ungültige lokale Daten.');
    for (const sub of parsed.subscriptions) {
      validateDraft({ ...sub, amount: (sub.amountCents / 100).toFixed(2), rewards: sub.rewards || '' });
    }

    const migrated = await runTransaction(db, async transaction => {
      const snap = await transaction.get(REF);
      if (snap.exists()) return false;
      transaction.set(REF, parsed);
      return true;
    });
    if (!migrated) return;
    localStorage.removeItem(LS_KEY);
    console.log('[Sublist] Migrated localStorage → Firestore');
  } catch (e) {
    throw e;
  }
}
