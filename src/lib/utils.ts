import { clsx, type ClassValue } from "clsx";
import {
  addMonths,
  addQuarters,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { twMerge } from "tailwind-merge";

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

export function advanceDate(date: Date, billingCycle: BillingCycle) {
  if (billingCycle === "monthly") return addMonths(date, 1);
  if (billingCycle === "quarterly") return addQuarters(date, 1);
  return addYears(date, 1);
}

export function calculateNextDueDate(startDate: string, billingCycle: BillingCycle) {
  const today = startOfDay(new Date());
  let cursor = startOfDay(new Date(startDate));

  while (!isAfter(cursor, today) && !isSameDay(cursor, today)) {
    cursor = advanceDate(cursor, billingCycle);
  }

  return format(cursor, "yyyy-MM-dd");
}

export function buildPaymentTimeline(subscription: Subscription, maxItems = 18) {
  const today = startOfDay(new Date());
  const items: Array<{ date: string; amountCents: number }> = [];
  let cursor = startOfDay(new Date(subscription.startDate));

  while ((isBefore(cursor, today) || isSameDay(cursor, today)) && items.length < maxItems) {
    items.push({
      date: format(cursor, "yyyy-MM-dd"),
      amountCents: subscription.amountCents,
    });
    cursor = advanceDate(cursor, subscription.billingCycle);
  }

  return items;
}

export function summarizeTotalSpent(
  subscriptionId: string,
  paymentHistory: PaymentHistoryItem[],
) {
  return paymentHistory
    .filter((entry) => entry.subscriptionId === subscriptionId)
    .reduce((total, entry) => total + entry.amountCents, 0);
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
