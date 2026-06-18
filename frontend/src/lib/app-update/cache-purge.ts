import { WASM_CACHE_NAME } from "./constants";

export function shouldPreserveCache(name: string): boolean {
  return name === WASM_CACHE_NAME;
}

/** Deletes app shell caches while keeping the Wasm runtime cache intact. */
export async function purgeAppShellCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  const names = await caches.keys();
  await Promise.all(
    names.filter((name) => !shouldPreserveCache(name)).map((name) => caches.delete(name))
  );
}
