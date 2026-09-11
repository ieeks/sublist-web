import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topWithOthers } from '../src/lib/dashboard';
import { assertDocumentFits, estimatedDocumentBytes } from '../src/lib/document-size';
import { parseLegacyData } from '../src/lib/legacy-data';
import { formatStoredDate } from '../src/lib/utils';
import type { AppData } from '../src/lib/types';
const empty: AppData = { subscriptions: [], categories: [], paymentMethods: [], paymentHistory: [], settings: { appearance: 'light', defaultCurrency: 'EUR' } };

test('top four plus others retains the complete total with at most five segments', () => {
  const all = Array.from({ length: 12 }, (_, i) => ({ name: `Category ${i}`, value: 12 - i, color: '#000' }));
  const result = topWithOthers(all);
  assert.equal(result.length, 5);
  assert.equal(result.at(-1)?.name, 'Sonstige');
  assert.equal(result.reduce((sum, item) => sum + item.value, 0), all.reduce((sum, item) => sum + item.value, 0));
  assert.deepEqual(topWithOthers(all.slice(0, 3)), all.slice(0, 3));
});
test('invalid legacy JSON or values return no migration data', () => {
  assert.equal(parseLegacyData('broken'), null);
  assert.equal(parseLegacyData('{"subscriptions":[]}'), null);
  assert.equal(parseLegacyData(JSON.stringify({ ...empty, subscriptions: [{ amountCents: null }] })), null);
  assert.deepEqual(parseLegacyData(JSON.stringify(empty)), empty);
});
test('bad stored dates render a repair hint rather than crashing', () => {
  assert.match(formatStoredDate('broken', 'MMM d'), /korrigieren/);
  assert.match(formatStoredDate('2026-02-30', 'MMM d'), /korrigieren/);
  assert.equal(formatStoredDate('2026-02-28', 'yyyy-MM-dd'), '2026-02-28');
});
test('document size guard reports a recoverable error without removing data', () => {
  const large = { ...empty, paymentHistory: Array.from({ length: 10000 }, (_, i) => ({ id: String(i), subscriptionId: 'old', date: '2026-01-01', amountCents: 100, currency: 'EUR', note: 'Estimated payment' })) };
  assert.ok(estimatedDocumentBytes(large) > 950000);
  assert.throws(() => assertDocumentFits(large), /exportieren/);
  assert.equal(large.paymentHistory.length, 10000);
  assert.doesNotThrow(() => assertDocumentFits({ ...large, paymentHistory: large.paymentHistory.slice(1) }, large));
  assert.doesNotThrow(() => assertDocumentFits({ ...large, paymentHistory: large.paymentHistory.filter(e => e.subscriptionId !== 'old') }));
});
