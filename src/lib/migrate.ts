import { doc, getDocFromServer, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { parseLegacyData } from './legacy-data';

const REF = doc(db, 'sublist', 'data');
const LS_KEY = 'sublist-web-state';
const DONE_KEY = 'sublist-migration-checked';

/** Existing server data wins. Preserve the local backup when nothing was migrated. */
export async function migrateFromLocalStorageIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  let raw: string | null;
  try {
    if (localStorage.getItem(DONE_KEY)) return;
    raw = localStorage.getItem(LS_KEY);
  } catch { return; }
  if (!raw) return;

  // Never validate obsolete local data if the authoritative document already exists.
  if ((await getDocFromServer(REF)).exists()) {
    try { localStorage.setItem(DONE_KEY, 'true'); } catch { /* backup stays intact */ }
    return;
  }
  const parsed = parseLegacyData(raw);
  if (!parsed) {
    console.warn('[Sublist] Invalid legacy data was not migrated; local backup retained.');
    return;
  }
  if (!parsed.subscriptions.length) return;
  const migrated = await runTransaction(db, async transaction => {
    if ((await transaction.get(REF)).exists()) return false;
    transaction.set(REF, parsed);
    return true;
  });
  try {
    if (migrated) localStorage.removeItem(LS_KEY);
    localStorage.setItem(DONE_KEY, 'true');
  } catch { /* Storage cleanup failure does not invalidate a successful write. */ }
}
