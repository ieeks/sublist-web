import { format } from 'date-fns';
import type { AppData, Subscription, SubscriptionDraft, SubscriptionStatus } from './types';
import { buildPaymentTimeline, calculateNextDueDate } from './utils';
import { parseAmount, validateDraft, subscriptionDateError } from './validation';

export function draftToSubscription(draft: SubscriptionDraft): Subscription {
  validateDraft(draft);
  return {
    id: draft.id || `subscription-${crypto.randomUUID()}`,
    name: draft.name.trim(), logoKey: draft.logoKey || 'custom',
    amountCents: parseAmount(draft.amount), currency: draft.currency,
    billingCycle: draft.billingCycle, categoryId: draft.categoryId,
    paymentMethodId: draft.paymentMethodId, rewards: draft.rewards || '',
    startDate: draft.startDate, status: draft.status, notes: draft.notes || '',
    nextDueDate: calculateNextDueDate(draft.startDate, draft.billingCycle),
    ...(draft.status === 'archived' ? { archivedAt: draft.archivedAt || format(new Date(), 'yyyy-MM-dd') } : {}),
  };
}

/** Preserve recorded amounts. Only append estimates after the last checkpoint. */
export function refreshHistory(data: AppData, now = new Date()): AppData {
  const today = format(now, 'yyyy-MM-dd');
  const history = [...data.paymentHistory];
  const subscriptions = data.subscriptions.map(sub => {
    if (subscriptionDateError(sub)) return sub;
    const existing = history.filter(entry => entry.subscriptionId === sub.id);
    // Legacy paused subscriptions have no reliable pause date: retain their existing history.
    if (sub.status !== 'paused') {
      const dates = new Set(existing.map(entry => entry.date));
      for (const entry of buildPaymentTimeline(sub, Infinity, now)) {
        if ((!sub.historyThrough || entry.date > sub.historyThrough) && !dates.has(entry.date)) {
          history.push({ ...entry, id: `${sub.id}-${entry.date}`, subscriptionId: sub.id, currency: sub.currency, note: 'Estimated payment' });
        }
      }
    }
    return {
      ...sub,
      historyThrough: sub.status === 'archived' && sub.archivedAt && sub.archivedAt < today ? sub.archivedAt : today,
      nextDueDate: sub.status === 'active' ? calculateNextDueDate(sub.startDate, sub.billingCycle, now) : sub.nextDueDate,
    };
  });
  return { ...data, subscriptions, paymentHistory: history };
}

export function changeStatus(sub: Subscription, status: SubscriptionStatus, now = new Date()): Subscription {
  const updated = { ...sub, status, historyThrough: format(now, 'yyyy-MM-dd') };
  if (status === 'archived') updated.archivedAt = sub.archivedAt || format(now, 'yyyy-MM-dd');
  else delete updated.archivedAt;
  if (status === 'active') updated.nextDueDate = calculateNextDueDate(sub.startDate, sub.billingCycle, now);
  return updated;
}

/** Apply only fields edited in this form; reject conflicting edits or remotely deleted records. */
export function upsertSubscription(current: AppData, next: Subscription, previous?: Subscription, now = new Date()): AppData {
  const target = current.subscriptions.find(s => s.id === next.id);
  if (previous && !target) throw new Error('Dieses Abo wurde auf einem anderen Gerät gelöscht. Bitte neu laden.');
  let updated = next;
  if (target && previous) {
    updated = { ...target };
    for (const field of ['name', 'logoKey', 'amountCents', 'currency', 'billingCycle', 'categoryId', 'paymentMethodId', 'rewards', 'startDate', 'status', 'notes', 'archivedAt'] as const) {
      if (next[field] === previous[field]) continue;
      if (target[field] !== previous[field] && target[field] !== next[field]) throw new Error('Dieses Abo wurde inzwischen geändert. Bitte schließen und erneut öffnen.');
      Object.assign(updated, { [field]: next[field] });
    }
    // Keep the checkpoint even when the start date/cycle changes: retroactive edits
    // do not backfill older estimates or rewrite amounts. This is explained in the form.
    // Never re-label old payments after a currency change.
    if (target.historyThrough) updated.historyThrough = target.historyThrough;
    if (updated.status !== target.status) updated = changeStatus(updated, updated.status, now);
    if (updated.archivedAt === undefined) delete updated.archivedAt;
  } else if (target) {
    throw new Error('Ein Abo mit dieser ID existiert bereits.');
  }
  return refreshHistory({ ...current, subscriptions: target ? current.subscriptions.map(s => s.id === next.id ? updated : s) : [...current.subscriptions, updated] }, now);
}

/** CSV is additive: existing IDs are skipped, never silently replaced. */
export function mergeSubscriptions(current: AppData, imported: Subscription[]): AppData {
  const ids = new Set(current.subscriptions.map(s => s.id));
  const added = imported.filter(s => !ids.has(s.id));
  const categories = [...current.categories];
  const paymentMethods = [...current.paymentMethods];
  for (const sub of added) {
    if (!categories.some(c => c.id === sub.categoryId)) categories.push({ id: sub.categoryId, name: sub.categoryId, color: '#7c8aa5' });
    if (!paymentMethods.some(m => m.id === sub.paymentMethodId)) paymentMethods.push({ id: sub.paymentMethodId, name: sub.paymentMethodId, type: 'credit_card', color: '#6b7280' });
  }
  return refreshHistory({ ...current, categories, paymentMethods, subscriptions: [...current.subscriptions, ...added] });
}
