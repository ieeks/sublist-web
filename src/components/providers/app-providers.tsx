"use client";

import { ThemeProvider, useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";

import { AuthGate } from "@/components/providers/auth-gate";
import { emptyAppData } from "@/data/seed";
import { db } from "@/lib/firebase";
import { migrateFromLocalStorageIfNeeded } from "@/lib/migrate";
import { FALLBACK_RATES, fetchFxRates } from "@/lib/currencies";
import { changeStatus, draftToSubscription, mergeSubscriptions, refreshHistory, upsertSubscription } from "@/lib/app-state";
import type {
  AppData,
  Category,
  PaymentMethod,
  SettingsState,
  Subscription,
  SubscriptionDraft,
  SubscriptionStatus,
} from "@/lib/types";

const FIRESTORE_REF = doc(db, "sublist", "data");

type AppContextValue = {
  data: AppData;
  ready: boolean;
  saving: boolean;
  error: string | null;
  fxRates: Record<string, number>;
  addOrUpdateSubscription: (draft: SubscriptionDraft, previous?: Subscription) => Promise<boolean>;
  deleteSubscription: (subscriptionId: string) => Promise<boolean>;
  updateSubscriptionStatus: (
    subscriptionId: string,
    status: SubscriptionStatus,
  ) => Promise<boolean>;
  updateSettings: (settings: Partial<SettingsState>) => Promise<boolean>;
  addCategory: (category: Omit<Category, "id">) => Promise<boolean>;
  removeCategory: (categoryId: string) => Promise<boolean>;
  updateCategory: (categoryId: string, updates: Partial<Omit<Category, "id">>) => Promise<boolean>;
  addPaymentMethod: (method: Omit<PaymentMethod, "id">) => Promise<boolean>;
  removePaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  importSubscriptions: (rows: SubscriptionDraft[]) => Promise<boolean>;
};

const AppContext = createContext<AppContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

const REMOVED_PAYMENT_METHOD_IDS = new Set(["amex-gold", "n26-virtual"]);
const RENAMED_PAYMENT_METHOD_IDS: Record<string, string> = {
  "revolut-business": "revolut",
};

function normalizePaymentMethods(data: AppData): AppData {
  const hadRemovedMethod = data.paymentMethods.some((method) =>
    REMOVED_PAYMENT_METHOD_IDS.has(method.id),
  );

  let paymentMethods = data.paymentMethods
    .filter((method) => !REMOVED_PAYMENT_METHOD_IDS.has(method.id))
    .map((method) => {
      const renamedId = RENAMED_PAYMENT_METHOD_IDS[method.id];
      return renamedId ? { ...method, id: renamedId, name: "Revolut" } : method;
    });

  if (hadRemovedMethod && !paymentMethods.some((method) => method.id === "mastercard")) {
    paymentMethods = [
      ...paymentMethods,
      { id: "mastercard", name: "Mastercard", type: "credit_card", color: "#eb001b", lastFour: "2401" },
    ];
  }

  const subscriptions = data.subscriptions.map((subscription) => {
    if (REMOVED_PAYMENT_METHOD_IDS.has(subscription.paymentMethodId)) {
      return { ...subscription, paymentMethodId: "mastercard" };
    }
    const renamedId = RENAMED_PAYMENT_METHOD_IDS[subscription.paymentMethodId];
    return renamedId ? { ...subscription, paymentMethodId: renamedId } : subscription;
  });

  return { ...data, paymentMethods, subscriptions };
}

function normalizeData(data: AppData): AppData {
  return refreshHistory(normalizePaymentMethods(data));
}

function ThemeSync({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const { data } = useAppData();

  useEffect(() => {
    setTheme(data.settings.appearance);
  }, [data.settings.appearance, setTheme]);

  return <>{children}</>;
}

function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [fxRates, setFxRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [data, setData] = useState<AppData>(emptyAppData);
  const [ready, setReady] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => { fetchFxRates().then(setFxRates).catch(() => {}); }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setError("Daten konnten noch nicht vom Server geladen werden. Bitte die Verbindung prüfen."), 8000);
    const unsub = onSnapshot(FIRESTORE_REF, { includeMetadataChanges: true }, snap => {
      try {
        // An empty offline cache does not prove that the server document is empty.
        if (snap.exists()) setData(normalizeData(snap.data() as AppData));
        if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) {
          clearTimeout(timeout);
          initializedRef.current = true;
          setReady(true);
          setError(null);
        }
      } catch {
        initializedRef.current = false;
        setError("Die gespeicherten Daten sind ungültig. Es wurde nichts überschrieben.");
      }
    }, () => {
      clearTimeout(timeout);
      initializedRef.current = false;
      setError("Datenzugriff fehlgeschlagen. Bitte Anmeldung, Verbindung und Firebase-Regeln prüfen.");
    });
    // Migration itself is transactional and cannot overwrite an existing document.
    migrateFromLocalStorageIfNeeded().catch(() => setError("Die Übernahme alter lokaler Daten ist fehlgeschlagen. Die lokale Kopie bleibt erhalten."));
    return () => { clearTimeout(timeout); unsub(); };
  }, []);

  // Read the latest server version on every write. Firestore retries concurrent changes.
  // No side effects inside React state updaters and no offline overwrite queue.
  const mutate = useCallback(async (updater: (current: AppData) => AppData): Promise<boolean> => {
    if (!initializedRef.current) { setError("Bitte warten, bis die Daten erfolgreich geladen wurden."); return false; }
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await runTransaction(db, async transaction => {
        const snap = await transaction.get(FIRESTORE_REF);
        const current = normalizeData(snap.exists() ? snap.data() as AppData : emptyAppData());
        transaction.set(FIRESTORE_REF, updater(current));
      });
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? `Nicht gespeichert: ${cause.message}` : "Speichern fehlgeschlagen. Bitte erneut versuchen.");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    let day = new Date().toDateString();
    const timer = setInterval(() => {
      const nextDay = new Date().toDateString();
      if (nextDay !== day) { day = nextDay; setData(current => normalizeData(current)); }
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      ready,
      saving,
      error,
      fxRates,
      addOrUpdateSubscription: async (draft, previous) => {
        try {
          const subscription = draftToSubscription(draft);
          return mutate(current => upsertSubscription(current, subscription, previous));
        } catch (cause) {
          setError((cause as Error).message);
          return false;
        }
      },
      deleteSubscription: (subscriptionId) => {
        return mutate((current) => ({
          ...current,
          subscriptions: current.subscriptions.filter(
            (subscription) => subscription.id !== subscriptionId,
          ),
          paymentHistory: current.paymentHistory.filter(
            (entry) => entry.subscriptionId !== subscriptionId,
          ),
        }));
      },
      updateSubscriptionStatus: (subscriptionId, status) => {
        return mutate((current) => {
          const target = current.subscriptions.find(
            (subscription) => subscription.id === subscriptionId,
          );
          if (!target) return current;

          const updated = changeStatus(target, status);
          return { ...current, subscriptions: current.subscriptions.map(s => s.id === subscriptionId ? updated : s) };
        });
      },
      updateSettings: (settings) => {
        return mutate((current) => ({
          ...current,
          settings: { ...current.settings, ...settings },
        }));
      },
      addCategory: (category) => {
        return mutate((current) => ({
          ...current,
          categories: [
            ...current.categories,
            { ...category, id: createId("category") },
          ],
        }));
      },
      removeCategory: (categoryId) => {
        return mutate((current) => ({
          ...current,
          categories: current.categories.filter((item) => item.id !== categoryId),
        }));
      },
      updateCategory: (categoryId, updates) => {
        return mutate((current) => ({
          ...current,
          categories: current.categories.map((cat) =>
            cat.id === categoryId ? { ...cat, ...updates } : cat,
          ),
        }));
      },
      addPaymentMethod: (method) => {
        return mutate((current) => ({
          ...current,
          paymentMethods: [
            ...current.paymentMethods,
            { ...method, id: createId("payment") },
          ],
        }));
      },
      removePaymentMethod: (paymentMethodId) => {
        return mutate((current) => ({
          ...current,
          paymentMethods: current.paymentMethods.filter(
            (method) => method.id !== paymentMethodId,
          ),
        }));
      },
      importSubscriptions: async (rows) => {
        try {
          if (!rows.length) throw new Error("Die Datei enthält keine Abos.");
          const imported = rows.map(draftToSubscription);
          return mutate(current => mergeSubscriptions(current, imported));
        } catch (cause) { setError((cause as Error).message); return false; }
      },
    }),
    [data, ready, saving, error, fxRates, mutate],
  );

  return <AppContext.Provider value={value}>
    {error && <div role="alert" className="fixed inset-x-0 top-0 z-[100] bg-red-100 p-3 text-center text-sm text-red-900">{error} <button type="button" className="underline" onClick={() => window.location.reload()}>Neu laden</button></div>}
    {saving && <div role="status" className="fixed right-3 top-3 z-[100] rounded bg-[var(--surface)] p-2 text-sm">Wird gespeichert …</div>}
    {ready ? children : <div role="status" className="p-8 text-center">Daten werden geladen …</div>}
  </AppContext.Provider>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthGate>
      <AppStateProvider>
        <ThemeSync>{children}</ThemeSync>
      </AppStateProvider>
      </AuthGate>
    </ThemeProvider>
  );
}

export function useAppData() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppData must be used within AppProviders");
  }

  return context;
}
