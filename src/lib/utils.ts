import { clsx, type ClassValue } from "clsx";
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { twMerge } from "tailwind-merge";

import { convertCurrency } from "./currencies";
import { parseDate } from "./validation";

import type { BillingCycle, PaymentHistoryItem, Subscription } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amountCents: number, currency = "EUR") {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function toMonthlyAmount(amountCents: number, billingCycle: BillingCycle) {
  if (billingCycle === "monthly") return amountCents;
  if (billingCycle === "quarterly") return Math.round(amountCents / 3);
  return Math.round(amountCents / 12);
}

export function advanceDate(date: Date, billingCycle: BillingCycle, periods = 1) {
  const months = { monthly: 1, quarterly: 3, yearly: 12 }[billingCycle];
  if (!months) throw new Error("Ungültiger Abrechnungszyklus.");
  return addMonths(date, months * periods);
}

export function calculateNextDueDate(startDate: string, billingCycle: BillingCycle, now = new Date()) {
  const today = startOfDay(now);
  const anchor = parseDate(startDate);
  let cursor = anchor;
  let period = 0;
  while (isBefore(cursor, today)) cursor = advanceDate(anchor, billingCycle, ++period);
  return format(cursor, "yyyy-MM-dd");
}

/** Scheduled estimates, not bank-confirmed payments. Always retain the original billing day. */
export function buildPaymentTimeline(subscription: Subscription, maxItems = Infinity, now = new Date()) {
  const today = startOfDay(now);
  const archivedAt = subscription.archivedAt ? parseDate(subscription.archivedAt) : null;
  const lastDate = archivedAt && isBefore(archivedAt, today) ? archivedAt : today;
  const items: Array<{ date: string; amountCents: number }> = [];
  const anchor = parseDate(subscription.startDate);
  let cursor = anchor;
  let period = 0;
  while (!isAfter(cursor, lastDate) && items.length < maxItems) {
    items.push({ date: format(cursor, "yyyy-MM-dd"), amountCents: subscription.amountCents });
    cursor = advanceDate(anchor, subscription.billingCycle, ++period);
  }
  return items;
}

export function summarizeTotalSpent(
  subscriptionId: string,
  paymentHistory: PaymentHistoryItem[],
  currency?: string,
  rates: Record<string, number> = {},
) {
  return paymentHistory
    .filter((entry) => entry.subscriptionId === subscriptionId)
    .reduce((total, entry) => total + (currency ? convertCurrency(entry.amountCents, entry.currency, currency, rates) : entry.amountCents), 0);
}

export function daysUntil(date: string) {
  return differenceInCalendarDays(startOfDay(new Date(date)), startOfDay(new Date()));
}

export function monthBounds(date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}
