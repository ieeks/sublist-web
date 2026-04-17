import type { PaymentHistoryItem, Subscription, SubscriptionDraft } from "@/lib/types";

const SUBSCRIPTION_HEADERS = [
  "id",
  "name",
  "logoKey",
  "amount",
  "currency",
  "billingCycle",
  "categoryId",
  "paymentMethodId",
  "status",
  "startDate",
  "rewards",
  "notes",
] as const;

const PAYMENT_HEADERS = ["id", "subscriptionId", "date", "amount", "currency", "note"] as const;

function escapeCsv(value: string | number | undefined) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export function subscriptionsToCsv(subscriptions: Subscription[]) {
  const rows = subscriptions.map((subscription) =>
    [
      subscription.id,
      subscription.name,
      subscription.logoKey,
      (subscription.amountCents / 100).toFixed(2),
      subscription.currency,
      subscription.billingCycle,
      subscription.categoryId,
      subscription.paymentMethodId,
      subscription.status,
      subscription.startDate,
      subscription.rewards ?? "",
      subscription.notes,
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [SUBSCRIPTION_HEADERS.join(","), ...rows].join("\n");
}

export function paymentHistoryToCsv(paymentHistory: PaymentHistoryItem[]) {
  const rows = paymentHistory.map((item) =>
    [
      item.id,
      item.subscriptionId,
      item.date,
      (item.amountCents / 100).toFixed(2),
      item.currency,
      item.note ?? "",
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [PAYMENT_HEADERS.join(","), ...rows].join("\n");
}

function parseCsvRow(row: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    const next = row[index + 1];

    if (character === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

export function parseSubscriptionsCsv(csvText: string): SubscriptionDraft[] {
  const [headerRow, ...rows] = csvText.trim().split(/\r?\n/);
  if (!headerRow) return [];

  const headers = parseCsvRow(headerRow);
  const indexMap = Object.fromEntries(headers.map((header, index) => [header, index]));

  return rows
    .filter(Boolean)
    .map((row) => parseCsvRow(row))
    .map((columns) => ({
      id: columns[indexMap.id] || undefined,
      name: columns[indexMap.name] || "",
      logoKey: columns[indexMap.logoKey] || "custom",
      amount: columns[indexMap.amount] || "0",
      currency: columns[indexMap.currency] || "EUR",
      billingCycle: (columns[indexMap.billingCycle] as SubscriptionDraft["billingCycle"]) || "monthly",
      categoryId: columns[indexMap.categoryId] || "uncategorized",
      paymentMethodId: columns[indexMap.paymentMethodId] || "manual",
      status: (columns[indexMap.status] as SubscriptionDraft["status"]) || "active",
      startDate: columns[indexMap.startDate] || new Date().toISOString().slice(0, 10),
      rewards: columns[indexMap.rewards] || "",
      notes: columns[indexMap.notes] || "",
    }));
}
