import type { AppData } from './types';

// Firestore's documented primitive/map/array sizes, plus margin for the document path.
export function estimatedDocumentBytes(value: unknown): number {
  if (typeof value === 'string') return new TextEncoder().encode(value).length + 1;
  if (typeof value === 'number') return 8;
  if (value === null || typeof value === 'boolean') return 1;
  if (Array.isArray(value)) return value.reduce((sum, entry) => sum + estimatedDocumentBytes(entry), 0);
  if (typeof value === 'object') return 32 + Object.entries(value as object).reduce((sum, [key, entry]) => sum + estimatedDocumentBytes(key) + estimatedDocumentBytes(entry), 0);
  return 0;
}
export function assertDocumentFits(data: AppData, previous?: AppData): void {
  const size = estimatedDocumentBytes(data);
  // Allow gradual cleanup of an existing document near the safety margin.
  if (previous && size < estimatedDocumentBytes(previous)) return;
  if (size > 950_000) throw new Error('Speichergrenze erreicht. Bitte Abos und Historie exportieren und nicht mehr benötigte Abos löschen. Es wurde nichts gespeichert oder abgeschnitten.');
}
