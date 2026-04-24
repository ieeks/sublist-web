import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { AppData } from './types';

const REF = doc(db, 'sublist', 'data');
const LS_KEY = 'sublist-web-state';

/**
 * One-time migration: copies existing localStorage data into Firestore.
 * Skips if Firestore already has subscription data.
 */
export async function migrateFromLocalStorageIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const snap = await getDoc(REF);
    if (snap.exists() && (snap.data() as AppData)?.subscriptions?.length > 0) return;

    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed?.subscriptions?.length) return;

    await setDoc(REF, parsed, { merge: true });
    localStorage.removeItem(LS_KEY);
    console.log('[Sublist] Migrated localStorage → Firestore');
  } catch (e) {
    console.warn('[Sublist] Migration skipped:', e);
  }
}
