import type { TransmutationOptions } from "@/workers/types";
import { batchOptionsEqual } from "./batch-last-run";

/** Options snapshot captured when batch prepare finishes (decode validation baseline). */
export type BatchPreparedOptions = TransmutationOptions;

export function batchOptionsStale(
  prepared: BatchPreparedOptions | null,
  current: TransmutationOptions
): boolean {
  if (!prepared) return false;
  return !batchOptionsEqual(prepared, current);
}
