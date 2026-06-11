export type FrameRgbaFetcher = (index: number) => Promise<Uint8Array>;

/** LRU cache for decoded RGBA frames — avoids repeat worker round-trips while scrubbing. */
export function createCachedFrameFetcher(
  fetch: FrameRgbaFetcher,
  maxEntries = 16
): FrameRgbaFetcher {
  const cache = new Map<number, Uint8Array>();
  const order: number[] = [];

  const touch = (index: number): void => {
    const pos = order.indexOf(index);
    if (pos >= 0) order.splice(pos, 1);
    order.push(index);
  };

  const evict = (): void => {
    while (order.length > maxEntries) {
      const oldest = order.shift();
      if (oldest != null) cache.delete(oldest);
    }
  };

  return async (index: number): Promise<Uint8Array> => {
    const hit = cache.get(index);
    if (hit) {
      touch(index);
      return hit;
    }

    const rgba = await fetch(index);
    const stored = new Uint8Array(rgba);
    cache.set(index, stored);
    touch(index);
    evict();
    return stored;
  };
}
