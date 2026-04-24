"use client";

import { ThemeProvider, useTheme } from "next-themes";
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { createSeedData } from "@/data/seed";
import { db } from "@/lib/firebase";
import { migrateFromLocalStorageIfNeeded } from "@/lib/migrate";
import { FALLBACK_RATES, fetchFxRates } from "@/lib/currencies";
import { calculateNextDueDate } from "@/lib/utils";
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
  fxRates: Record<string, number>;
  addOrUpdateSubscription: (draft: SubscriptionDraft) => void;
  deleteSubscription: (subscriptionId: string) => void;
  updateSubscriptionStatus: (
    subscriptionId: string,
    status: SubscriptionStatus,
  ) => void;
  updateSettings: (settings: Partial<SettingsState>) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  removeCategory: (categoryId: string) => void;
  updateCategory: (categoryId: string, updates: Partial<Omit<Category, "id">>) => void;
  addPaymentMethod: (method: Omit<PaymentMethod, "id">) => void;
  removePaymentMethod: (paymentMethodId: string) => void;
  importSubscriptions: (rows: SubscriptionDraft[]) => void;
  replaceAllData: (nextData: AppData) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeSubscription(subscription: Subscription): Subscription {
  return {
    ...subscription,
    nextDueDate: calculateNextDueDate(
      subscription.startDate,
      subscription.billingCycle,
    ),
  };
}

function normalizeData(data: AppData): AppData {
  return {
    ...data,
    subscriptions: data.subscriptions.map(normalizeSubscription),
  };
}

function draftToSubscription(draft: SubscriptionDraft): Subscription {
  return {
    id:
      draft.id ??
      draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ??
      createId("subscription"),
    name: draft.name,
    logoKey: draft.logoKey,
    amountCents: Math.round(Number.parseFloat((draft.amount || "0").replace(",", ".")) * 100),
    currency: draft.currency,
    billingCycle: draft.billingCycle,
    categoryId: draft.categoryId,
    paymentMethodId: draft.paymentMethodId,
    rewards: draft.rewards,
    startDate: draft.startDate,
    status: draft.status,
    notes: draft.notes,
    nextDueDate: calculateNextDueDate(draft.startDate, draft.billingCycle),
  };
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
  const [data, setData] = useState<AppData>(createSeedData);
  const [ready, setReady] = useState(false);

  // Suppress Firestore writes until initial load is done
  const initializedRef = useRef(false);

  useEffect(() => {
    fetchFxRates().then(setFxRates).catch(() => {});
  }, []);

  // One-time migration from localStorage, then subscribe to Firestore
  useEffect(() => {
    let cancelled = false;

    migrateFromLocalStorageIfNeeded().then(() => {
      if (cancelled) return;

      const unsub = onSnapshot(FIRESTORE_REF, (snap) => {
        if (cancelled) return;

        if (snap.exists()) {
          setData(normalizeData(snap.data() as AppData));
        } else {
          // First ever run: seed Firestore with default data
          const seed = createSeedData();
          setDoc(FIRESTORE_REF, seed);
          setData(seed);
        }

        if (!initializedRef.current) {
          initializedRef.current = true;
          setReady(true);
        }
      });

      return unsub;
    });

    return () => { cancelled = true; };
  }, []);

  // Persist every state change to Firestore (after initial load)
  const persistRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persist = useCallback((nextData: AppData) => {
    if (!initializedRef.current) return;
    if (persistRef.current) clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => {
      setDoc(FIRESTORE_REF, nextData).catch(() => {});
    }, 600);
  }, []);

  // Mutate state + fire debounced Firestore write
  const mutate = useCallback((updater: (current: AppData) => AppData) => {
    setData((current) => {
      const next = updater(current);
      persist(next);
      return next;
    });
  }, [persist]);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      ready,
      fxRates,
      addOrUpdateSubscription: (draft) => {
        const subscription = draftToSubscription(draft);
        mutate((current) => {
          const existingIndex = current.subscriptions.findIndex(
            (item) => item.id === subscription.id,
          );

          if (existingIndex >= 0) {
            const nextSubscriptions = [...current.subscriptions];
            nextSubscriptions[existingIndex] = subscription;
            return { ...current, subscriptions: nextSubscriptions };
          }

          return {
            ...current,
            subscriptions: [...current.subscriptions, subscription],
          };
        });
      },
      deleteSubscription: (subscriptionId) => {
        mutate((current) => ({
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
        mutate((current) => ({
          ...current,
          subscriptions: current.subscriptions.map((subscription) =>
            subscription.id === subscriptionId
              ? { ...subscription, status }
              : subscription,
          ),
        }));
      },
      updateSettings: (settings) => {
        mutate((current) => ({
          ...current,
          settings: { ...current.settings, ...settings },
        }));
      },
      addCategory: (category) => {
        mutate((current) => ({
          ...current,
          categories: [
            ...current.categories,
            { ...category, id: createId("category") },
          ],
        }));
      },
      removeCategory: (categoryId) => {
        mutate((current) => ({
          ...current,
          categories: current.categories.filter((item) => item.id !== categoryId),
        }));
      },
      updateCategory: (categoryId, updates) => {
        mutate((current) => ({
          ...current,
          categories: current.categories.map((cat) =>
            cat.id === categoryId ? { ...cat, ...updates } : cat,
          ),
        }));
      },
      addPaymentMethod: (method) => {
        mutate((current) => ({
          ...current,
          paymentMethods: [
            ...current.paymentMethods,
            { ...method, id: createId("payment") },
          ],
        }));
      },
      removePaymentMethod: (paymentMethodId) => {
        mutate((current) => ({
          ...current,
          paymentMethods: current.paymentMethods.filter(
            (method) => method.id !== paymentMethodId,
          ),
        }));
      },
      importSubscriptions: (rows) => {
        startTransition(() => {
          mutate((current) => {
            const imported = rows.map(draftToSubscription);
            const mergedCategories = [...current.categories];
            const mergedMethods = [...current.paymentMethods];

            imported.forEach((subscription) => {
              if (
                !mergedCategories.find((category) => category.id === subscription.categoryId)
              ) {
                mergedCategories.push({
                  id: subscription.categoryId,
                  name: subscription.categoryId,
                  color: "#7c8aa5",
                });
              }
              if (
                !mergedMethods.find((method) => method.id === subscription.paymentMethodId)
              ) {
                mergedMethods.push({
                  id: subscription.paymentMethodId,
                  name: subscription.paymentMethodId,
                  type: "credit_card",
                  color: "#6b7280",
                });
              }
            });

            return {
              ...current,
              categories: mergedCategories,
              paymentMethods: mergedMethods,
              subscriptions: imported,
            };
          });
        });
      },
      replaceAllData: (nextData) => {
        const normalized = normalizeData(nextData);
        setData(normalized);
        persist(normalized);
      },
    }),
    [data, ready, fxRates, mutate, persist],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppStateProvider>
        <ThemeSync>{children}</ThemeSync>
      </AppStateProvider>
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
