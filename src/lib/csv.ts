import { validateDraft } from "./validation";
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
  "archivedAt",
  "startDate",
  "rewards",
  "notes",
] as const;

const PAYMENT_HEADERS = ["id", "subscriptionId", "date", "amount", "currency", "note"] as const;

function escapeCsv(value: string | number | undefined) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n") || raw.includes("\r")) {
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
      subscription.archivedAt ?? "",
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

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else cell += char;
    } else if (char === ',') { row.push(cell); cell = ""; closed = false; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = ""; closed = false;
    } else if (char === '"' && !cell && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error("Ungültige CSV-Anführungszeichen.");
      cell += char;
    }
  }
  if (quoted) throw new Error("Ein CSV-Feld ist nicht geschlossen.");
  if (cell || row.length || closed) { row.push(cell); rows.push(row); }
  return rows.filter(row => row.some(cell => cell.trim()));
}

export function parseSubscriptionsCsv(csvText: string): SubscriptionDraft[] {
  const [headers, ...rows] = parseCsv(csvText);
  if (!headers || !rows.length) throw new Error("Die Datei enthält keine Abos.");
  const required = ["name", "amount", "currency", "billingCycle", "startDate", "status"];
  if (new Set(headers).size !== headers.length || required.some(h => !headers.includes(h))) {
    throw new Error("Ungültige CSV-Spalten. Bitte einen Sublist-Export verwenden.");
  }
  const ids = new Set<string>();
  return rows.map((columns, index) => {
    if (columns.length !== headers.length) throw new Error(`CSV-Zeile ${index + 2}: falsche Spaltenanzahl.`);
    const values = Object.fromEntries(headers.map((header, i) => [header, columns[i]]));
    const draft: SubscriptionDraft = {
      id: values.id || undefined, name: values.name, logoKey: values.logoKey || "custom",
      amount: values.amount, currency: values.currency,
      billingCycle: values.billingCycle as SubscriptionDraft["billingCycle"],
      categoryId: values.categoryId || "uncategorized", paymentMethodId: values.paymentMethodId || "manual",
      status: values.status as SubscriptionDraft["status"], archivedAt: values.archivedAt || undefined,
      startDate: values.startDate, rewards: values.rewards || "", notes: values.notes || "",
    };
    try { validateDraft(draft); } catch (error) { throw new Error(`CSV-Zeile ${index + 2}: ${(error as Error).message}`); }
    if (draft.id && ids.has(draft.id)) throw new Error(`CSV-Zeile ${index + 2}: doppelte ID.`);
    if (draft.id) ids.add(draft.id);
    return draft;
  });
}
