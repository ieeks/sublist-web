import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateNextDueDate, buildPaymentTimeline, summarizeTotalSpent } from '../src/lib/utils';
import { parseAmount, validateDraft } from '../src/lib/validation';
import { parseSubscriptionsCsv, subscriptionsToCsv } from '../src/lib/csv';
import { changeStatus, draftToSubscription, mergeSubscriptions, refreshHistory, upsertSubscription } from '../src/lib/app-state';
import type { AppData, Subscription, SubscriptionDraft } from '../src/lib/types';

const now = new Date(2026, 8, 10, 12);
const sub: Subscription = { id: 'netflix', name: 'Netflix', logoKey: 'netflix', amountCents: 1000, currency: 'EUR', billingCycle: 'monthly', startDate: '2024-01-01', nextDueDate: '2026-10-01', status: 'active', categoryId: 'entertainment', paymentMethodId: 'card', notes: '' };
const draft: SubscriptionDraft = { name: 'Netflix', logoKey: 'netflix', amount: '10', currency: 'EUR', billingCycle: 'monthly', startDate: '2024-01-01', status: 'active', categoryId: 'entertainment', paymentMethodId: 'card', notes: '', rewards: '' };
function data(subscriptions = [sub]): AppData { return { subscriptions, categories: [], paymentMethods: [], paymentHistory: [], settings: { appearance: 'light', defaultCurrency: 'EUR' } }; }

test('month-end renewals return to original billing day', () => {
  assert.equal(calculateNextDueDate('2026-01-31', 'monthly', now), '2026-09-30');
  assert.equal(calculateNextDueDate('2026-01-31', 'monthly', new Date(2026, 2, 1)), '2026-03-31');
});
test('quarterly and leap-day anchors are preserved', () => {
  assert.equal(calculateNextDueDate('2026-01-31', 'quarterly', new Date(2026, 6, 1)), '2026-07-31');
  assert.equal(calculateNextDueDate('2024-02-29', 'yearly', new Date(2028, 1, 1)), '2028-02-29');
});
test('due today is retained, future start is not pulled forward', () => {
  assert.equal(calculateNextDueDate('2026-01-10', 'monthly', now), '2026-09-10');
  assert.equal(calculateNextDueDate('2027-01-10', 'monthly', now), '2027-01-10');
});
test('invalid and empty dates fail immediately', () => {
  for (const date of ['', 'abc', '2026-02-30', '0001-01-01']) assert.throws(() => calculateNextDueDate(date, 'monthly', now));
});
test('history includes all 33 scheduled payments, not only the first 18', () => {
  const history = buildPaymentTimeline(sub, Infinity, now);
  assert.equal(history.length, 33);
  assert.equal(history.at(-1)?.date, '2026-09-01');
  assert.equal(history.reduce((sum, x) => sum + x.amountCents, 0), 33000);
});
test('archived history ends at the archive date', () => {
  assert.equal(buildPaymentTimeline({ ...sub, archivedAt: '2024-03-01', status: 'archived' }, Infinity, now).length, 3);
});
test('amount validation accepts comma and rejects malformed or negative numbers', () => {
  assert.equal(parseAmount('12,34'), 1234);
  assert.equal(parseAmount('0'), 0);
  for (const text of ['', 'abc', '-1', '12foo', '1,234', 'Infinity', '99999999999999999']) assert.throws(() => parseAmount(text));
});
test('draft enums and dates are validated', () => {
  assert.throws(() => validateDraft({ ...draft, billingCycle: 'weekly' as never }));
  assert.throws(() => validateDraft({ ...draft, currency: 'XYZ' }));
  assert.throws(() => validateDraft({ ...draft, archivedAt: '2023-01-01' }));
});
test('same-name new subscriptions have different IDs; edits keep the ID', () => {
  assert.notEqual(draftToSubscription(draft).id, draftToSubscription(draft).id);
  assert.equal(draftToSubscription({ ...draft, id: 'existing' }).id, 'existing');
});
test('CSV export/import preserves quotes, commas and multiline notes', () => {
  const original = { ...sub, name: 'Netflix, "Family"', notes: 'one\r\ntwo\nthree' };
  const [roundtrip] = parseSubscriptionsCsv('\uFEFF' + subscriptionsToCsv([original]));
  assert.equal(roundtrip.name, original.name);
  assert.equal(roundtrip.notes, original.notes);
  assert.equal(roundtrip.amount, '10.00');
});
test('CSV rejects empty files, wrong columns, malformed quotes, duplicates, bad dates', () => {
  for (const csv of ['', 'name,amount', 'hello\nworld', subscriptionsToCsv([sub, sub]), subscriptionsToCsv([{ ...sub, startDate: '' }]), subscriptionsToCsv([sub]) + '\n"unfinished']) assert.throws(() => parseSubscriptionsCsv(csv));
});
test('additive import preserves current subscriptions and skips existing IDs', () => {
  const result = mergeSubscriptions(data(), [{ ...sub, amountCents: 9999 }, { ...sub, id: 'new' }]);
  assert.equal(result.subscriptions.length, 2);
  assert.equal(result.subscriptions.find(s => s.id === sub.id)?.amountCents, 1000);
});
test('refresh is idempotent and appends newly due estimates', () => {
  const old = refreshHistory(data(), new Date(2026, 7, 10));
  const next = refreshHistory(old, now);
  assert.equal(next.paymentHistory.length, old.paymentHistory.length + 1);
  assert.deepEqual(refreshHistory(next, now), next);
});
test('price change preserves historical amounts and affects future estimates only', () => {
  const current = refreshHistory(data(), now);
  const updated = upsertSubscription(current, { ...sub, amountCents: 2000 }, sub, now);
  assert.equal(updated.paymentHistory.reduce((sum, e) => sum + e.amountCents, 0), 33000);
  const next = refreshHistory(updated, new Date(2026, 9, 2));
  assert.equal(next.paymentHistory.at(-1)?.amountCents, 2000);
});
test('pause/resume does not invent payments in the paused interval', () => {
  let current = refreshHistory(data(), new Date(2026, 6, 2));
  current.subscriptions = current.subscriptions.map(s => changeStatus(s, 'paused', new Date(2026, 6, 2)));
  current = refreshHistory(current, now);
  const count = current.paymentHistory.length;
  current.subscriptions = current.subscriptions.map(s => changeStatus(s, 'active', now));
  current = refreshHistory(current, new Date(2026, 9, 2));
  assert.equal(current.paymentHistory.length, count + 1);
  assert.equal(current.paymentHistory.at(-1)?.date, '2026-10-01');
});
test('editing a remotely deleted subscription cannot resurrect it', () => {
  assert.throws(() => upsertSubscription(data([]), { ...sub, name: 'Edited' }, sub, now), /gelöscht/);
});
test('unrelated remote changes survive a stale form submission', () => {
  const remote = { ...sub, notes: 'Changed on tablet' };
  const current = refreshHistory(data([remote, { ...sub, id: 'other' }]), now);
  const result = upsertSubscription(current, { ...sub, name: 'Changed on phone' }, sub, now);
  assert.equal(result.subscriptions[0].notes, remote.notes);
  assert.equal(result.subscriptions[0].name, 'Changed on phone');
  assert.equal(result.subscriptions[1].id, 'other');
});
test('conflicting changes to the same field are rejected', () => {
  assert.throws(() => upsertSubscription(data([{ ...sub, amountCents: 3000 }]), { ...sub, amountCents: 2000 }, sub, now), /inzwischen geändert/);
});
test('historical amounts use their recorded currencies', () => {
  const entries = [{ id: '1', subscriptionId: sub.id, date: '2026-01-01', amountCents: 1000, currency: 'EUR' }, { id: '2', subscriptionId: sub.id, date: '2026-02-01', amountCents: 2000, currency: 'USD' }];
  assert.equal(summarizeTotalSpent(sub.id, entries, 'EUR', { EUR: 1, USD: 2 }), 2000);
});
