import { resetBmpSessionInputLimit } from "@/lib/bmp/bmp-wasm-client";
import { resetGifSessionInputLimit } from "@/lib/gif/gif-wasm-client";
import { invalidateEstimateInputCache } from "@/lib/transmutation/estimate-input-cache";

/**
 * Release auxiliary Wasm session state on the main thread (GIF/BMP probes).
 * Worker heap is reclaimed separately via worker recycle.
 */
export async function releaseHeavySession(): Promise<void> {
  invalidateEstimateInputCache();
  await Promise.allSettled([resetGifSessionInputLimit(), resetBmpSessionInputLimit()]);
}

export function isTransmuteRoute(pathname: string): boolean {
  return pathname.startsWith("/transmute/");
}
