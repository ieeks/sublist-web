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

import { emptyAppData } from "@/data/seed";
import { db } from "@/lib/firebase";
import { migrateFromLocalStorageIfNeeded } from "@/lib/migrate";
import { FALLBACK_RATES, fetchFxRates } from "@/lib/currencies";
import { buildPaymentTimeline, calculateNextDueDate } from "@/lib/utils";
import type {
  AppData,
  Category,
  PaymentHistoryItem,
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
  const normalized = normalizePaymentMethods(data);
  return {
    ...normalized,
    subscriptions: normalized.subscriptions.map(normalizeSubscription),
  };
}

function buildPaymentHistoryForSubscription(
  subscription: Subscription,
): PaymentHistoryItem[] {
  return buildPaymentTimeline(subscription).map((entry, index) => ({
    id: `${subscription.id}-${index}-${entry.date.replace(/-/g, "")}`,
    subscriptionId: subscription.id,
    date: entry.date,
    amountCents: entry.amountCents,
    currency: subscription.currency,
    note: "Auto-generated payment",
  }));
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
  const [data, setData] = useState<AppData>(emptyAppData);
  const [ready, setReady] = useState(false);

  // Suppress Firestore writes until initial load is done
  const initializedRef = useRef(false);

  useEffect(() => {
    fetchFxRates().then(setFxRates).catch(() => {});
  }, []);

  // Subscribe to Firestore immediately; run migration in parallel
  useEffect(() => {
    let cancelled = false;

    const unblock = () => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        setReady(true);
      }
    };

    // Safety net: unblock the UI after 8 s if Firestore hasn't responded
    const timeout = setTimeout(unblock, 8000);

    const unsub = onSnapshot(
      FIRESTORE_REF,
      (snap) => {
        if (cancelled) return;
        clearTimeout(timeout);

        if (snap.exists()) {
          setData(normalizeData(snap.data() as AppData));
        } else {
          const empty = emptyAppData();
          setDoc(FIRESTORE_REF, empty);
          setData(empty);
        }

        unblock();
      },
      (error) => {
        console.error("[Sublist] Firestore snapshot error:", error);
        clearTimeout(timeout);
        unblock();
      },
    );

    // Migration runs in parallel, fire-and-forget
    migrateFromLocalStorageIfNeeded().catch(() => {});

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  // Persist state change to Firestore (after initial load)
  const persist = useCallback((nextData: AppData) => {
    if (!initializedRef.current) return;
    setDoc(FIRESTORE_REF, nextData).catch(() => {});
  }, []);

  // Mutate state + fire immediate Firestore write
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
          const nextSubscriptions =
            existingIndex >= 0
              ? current.subscriptions.map((item, index) =>
                  index === existingIndex ? subscription : item,
                )
              : [...current.subscriptions, subscription];
          const nextPaymentHistory = [
            ...current.paymentHistory.filter(
              (entry) => entry.subscriptionId !== subscription.id,
            ),
            ...buildPaymentHistoryForSubscription(subscription),
          ];

          return {
            ...current,
            subscriptions: nextSubscriptions,
            paymentHistory: nextPaymentHistory,
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

            const importedIds = new Set(imported.map((subscription) => subscription.id));

            return {
              ...current,
              categories: mergedCategories,
              paymentMethods: mergedMethods,
              subscriptions: imported,
              paymentHistory: [
                ...current.paymentHistory.filter(
                  (entry) => !importedIds.has(entry.subscriptionId),
                ),
                ...imported.flatMap(buildPaymentHistoryForSubscription),
              ],
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
