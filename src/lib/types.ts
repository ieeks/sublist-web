export type BillingCycle = "monthly" | "quarterly" | "yearly";

export type SubscriptionStatus = "active" | "paused" | "archived";

export type AppearancePreference = "light" | "dark" | "system";

export type PaymentMethodType = "credit_card" | "bank" | "wallet";

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  color: string;
  lastFour?: string;
  rewardLabel?: string;
}

export interface PaymentHistoryItem {
  id: string;
  subscriptionId: string;
  date: string;
  amountCents: number;
  currency: string;
  note?: string;
}

export interface Subscription {
  id: string;
  name: string;
  logoKey: string;
  amountCents: number;
  currency: string;
  billingCycle: BillingCycle;
  categoryId: string;
  paymentMethodId: string;
  rewards?: string;
  startDate: string;
  nextDueDate: string;
  notes: string;
  status: SubscriptionStatus;
}

export interface SettingsState {
  defaultCurrency: string;
  appearance: AppearancePreference;
}

export interface AppData {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  subscriptions: Subscription[];
  paymentHistory: PaymentHistoryItem[];
  settings: SettingsState;
}

export interface SubscriptionDraft {
  id?: string;
  name: string;
  logoKey: string;
  amount: string;
  currency: string;
  billingCycle: BillingCycle;
  categoryId: string;
  paymentMethodId: string;
  rewards: string;
  startDate: string;
  status: SubscriptionStatus;
  notes: string;
}
