const STATIC_ASSET_RE = /(?:src|href)=["'](\/_next\/static\/[^"']+)["']/g;
const BRAND_ASSET_RE = /(?:src)=["'](\/brand\/[^"']+)["']/g;

/** Parse Next.js HTML for linked JS/CSS under /_next/static/. */
export function extractStaticAssetUrls(html: string): string[] {
  const urls = new Set<string>();
  for (const match of html.matchAll(STATIC_ASSET_RE)) {
    const path = match[1];
    if (path) urls.add(path);
  }
  return [...urls];
}

/** Parse HTML for brand mark img src (header logo). */
export function extractBrandAssetUrls(html: string): string[] {
  const urls = new Set<string>();
  for (const match of html.matchAll(BRAND_ASSET_RE)) {
    const path = match[1];
    if (path) urls.add(path);
  }
  return [...urls];
}
