/** Decode `url` query param from Next.js `/_next/image` requests. */
export function decodeNextImageAssetPath(pathname: string, search: string): string | null {
  if (!pathname.startsWith("/_next/image")) return null;
  try {
    const raw = new URLSearchParams(search).get("url");
    if (!raw) return null;
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

export function isOfflineAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/pwa/") ||
    pathname.startsWith("/_next/image")
  );
}
