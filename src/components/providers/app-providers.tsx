"use client";

import { ThemeProvider, useTheme } from "next-themes";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createSeedData } from "@/data/seed";
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

const STORAGE_KEY = "sublist-web-state";

type AppContextValue = {
  data: AppData;
  ready: boolean;
  addOrUpdateSubscription: (draft: SubscriptionDraft) => void;
  deleteSubscription: (subscriptionId: string) => void;
  updateSubscriptionStatus: (
    subscriptionId: string,
    status: SubscriptionStatus,
  ) => void;
  updateSettings: (settings: Partial<SettingsState>) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  removeCategory: (categoryId: string) => void;
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
    amountCents: Math.round(Number.parseFloat(draft.amount || "0") * 100),
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
  const [data, setData] = useState<AppData>(() => {
    if (typeof window === "undefined") {
      return createSeedData();
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return normalizeData(JSON.parse(saved) as AppData);
      }
    } catch {
      return createSeedData();
    }

    return createSeedData();
  });
  const ready = true;

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      ready,
      addOrUpdateSubscription: (draft) => {
        const subscription = draftToSubscription(draft);
        setData((current) => {
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
        setData((current) => ({
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
        setData((current) => ({
          ...current,
          subscriptions: current.subscriptions.map((subscription) =>
            subscription.id === subscriptionId
              ? { ...subscription, status }
              : subscription,
          ),
        }));
      },
      updateSettings: (settings) => {
        setData((current) => ({
          ...current,
          settings: { ...current.settings, ...settings },
        }));
      },
      addCategory: (category) => {
        setData((current) => ({
          ...current,
          categories: [
            ...current.categories,
            { ...category, id: createId("category") },
          ],
        }));
      },
      removeCategory: (categoryId) => {
        setData((current) => ({
          ...current,
          categories: current.categories.filter((item) => item.id !== categoryId),
        }));
      },
      addPaymentMethod: (method) => {
        setData((current) => ({
          ...current,
          paymentMethods: [
            ...current.paymentMethods,
            { ...method, id: createId("payment") },
          ],
        }));
      },
      removePaymentMethod: (paymentMethodId) => {
        setData((current) => ({
          ...current,
          paymentMethods: current.paymentMethods.filter(
            (method) => method.id !== paymentMethodId,
          ),
        }));
      },
      importSubscriptions: (rows) => {
        startTransition(() => {
          setData((current) => {
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
      replaceAllData: (nextData) => setData(normalizeData(nextData)),
    }),
    [data, ready],
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
