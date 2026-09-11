"use client";

import { useEffect, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Security is enforced by Firestore rules. This switch permits staged console setup.
const ownerUid = process.env.NEXT_PUBLIC_FIREBASE_ALLOWED_UID;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!ownerUid) return;
    return onAuthStateChanged(auth, setUser, () => setError('Anmeldung konnte nicht geladen werden.'));
  }, []);

  if (!ownerUid) return children;
  if (user?.uid === ownerUid) return <>{children}</>;
  async function login() {
    try { setError(''); await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch { setError('Anmeldung fehlgeschlagen. Bitte Popups erlauben und Firebase-Konfiguration prüfen.'); }
  }
  return <main className="mx-auto max-w-sm space-y-4 p-8 text-center">
    <h1 className="text-2xl font-semibold">Sublist</h1>
    <p>{user ? 'Dieses Google-Konto hat keinen Zugriff.' : 'Melde dich mit deinem Google-Konto an.'}</p>
    {user === undefined && !error ? <p role="status">Anmeldung wird geprüft …</p> :
      <button type="button" className="rounded-lg border px-4 py-2" onClick={() => user ? signOut(auth).catch(() => setError('Abmelden fehlgeschlagen.')) : login()}>{user ? 'Konto wechseln' : 'Mit Google anmelden'}</button>}
    {error && <p role="alert">{error}</p>}
  </main>;
}
