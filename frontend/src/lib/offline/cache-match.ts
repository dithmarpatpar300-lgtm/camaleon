/** Match a request against any open Cache Storage bucket. */
export async function matchAnyCache(request: Request): Promise<Response | undefined> {
  if (typeof caches === "undefined") return undefined;
  try {
    const direct = await caches.match(request);
    if (direct) return direct;

    const names = await caches.keys();
    for (const name of names) {
      const cache = await caches.open(name);
      const hit = await cache.match(request);
      if (hit) return hit;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
