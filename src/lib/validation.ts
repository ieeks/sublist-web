import { format, isValid, parseISO } from 'date-fns';
import type { SubscriptionDraft } from './types';

export function parseDate(value: string): Date {
  const date = parseISO(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isValid(date) || format(date, 'yyyy-MM-dd') !== value || date.getFullYear() < 1900) {
    throw new Error('Bitte ein gültiges Datum ab 1900 eingeben.');
  }
  return date;
}

export function parseAmount(value: string): number {
  const text = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Bitte einen gültigen Betrag mit höchstens zwei Nachkommastellen eingeben.');
  const cents = Math.round(Number(text) * 100);
  if (!Number.isSafeInteger(cents)) throw new Error('Der Betrag ist zu groß.');
  return cents;
}

export function validateDraft(draft: SubscriptionDraft): void {
  if (!draft.name.trim()) throw new Error('Bitte einen Namen eingeben.');
  parseAmount(draft.amount);
  parseDate(draft.startDate);
  if (!['monthly', 'quarterly', 'yearly'].includes(draft.billingCycle)) throw new Error('Ungültiger Abrechnungszyklus.');
  if (!['active', 'paused', 'archived'].includes(draft.status)) throw new Error('Ungültiger Status.');
  if (!['EUR', 'USD', 'TRY', 'INR'].includes(draft.currency)) throw new Error('Nicht unterstützte Währung.');
  if (draft.archivedAt) {
    parseDate(draft.archivedAt);
    if (draft.archivedAt < draft.startDate) throw new Error('Das Archivdatum liegt vor dem Startdatum.');
  }
}
