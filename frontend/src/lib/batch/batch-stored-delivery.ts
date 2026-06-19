import type { BatchItem } from "./batch-types";

/** True when every item already has in-memory output bytes (no worker round-trip needed). */
export function batchItemsHaveStoredResults(items: BatchItem[]): boolean {
  return items.length > 0 && items.every((item) => item.result != null);
}
