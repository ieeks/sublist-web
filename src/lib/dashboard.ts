export interface Breakdown { name: string; color: string; value: number }

/** Keep the chart compact without dropping any spend from its denominator. */
export function topWithOthers(items: Breakdown[]): Breakdown[] {
  if (items.length <= 4) return items;
  return [...items.slice(0, 4), { name: 'Sonstige', color: '#94a3b8', value: items.slice(4).reduce((sum, item) => sum + item.value, 0) }];
}
