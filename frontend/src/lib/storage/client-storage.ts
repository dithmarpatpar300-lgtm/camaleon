/** Safe localStorage access with SSR guards and JSON helpers. */

export function isClientStorageAvailable(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const probe = "__camaleon_storage_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readLocalString(key: string): string | null {
  if (!isClientStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocalString(key: string, value: string): void {
  if (!isClientStorageAvailable()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

export function removeLocalKey(key: string): void {
  if (!isClientStorageAvailable()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readLocalJson<T>(key: string): T | null {
  const raw = readLocalString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeLocalJson(key: string, value: unknown): void {
  writeLocalString(key, JSON.stringify(value));
}

/** Mirror a preference into a cookie for SSR hydration (path=/, SameSite=Lax). */
export function writeClientCookie(name: string, value: string, maxAge = 31536000): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
