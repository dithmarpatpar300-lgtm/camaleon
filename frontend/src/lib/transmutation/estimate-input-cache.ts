type CacheEntry = { generation: number; buffer: ArrayBuffer };

const estimateInputCache = new WeakMap<File, CacheEntry>();
let cacheGeneration = 0;

export async function getEstimateInputBuffer(file: File): Promise<ArrayBuffer> {
  const cached = estimateInputCache.get(file);
  if (cached && cached.generation === cacheGeneration) {
    return cached.buffer.slice(0);
  }
  const buf = await file.arrayBuffer();
  estimateInputCache.set(file, { generation: cacheGeneration, buffer: buf });
  return buf.slice(0);
}

/** Invalidate cached file buffers (call on transmute route exit). */
export function invalidateEstimateInputCache(): void {
  cacheGeneration += 1;
}
