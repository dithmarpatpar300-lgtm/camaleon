/** Tool slugs that support multi-file batch (global options only — no per-row frame/page/entry). */
const BATCH_ENABLED_SLUGS = new Set([
  "jpg-to-png",
  "png-to-jpg",
  "webp-to-png",
  "webp-to-jpg",
  "png-to-webp",
  "jpg-to-webp",
  "bmp-to-png",
  "bmp-to-jpg",
  "png-to-avif",
  "jpg-to-avif",
  "avif-to-png",
  "avif-to-jpg",
  "tga-to-png",
  "png-to-ico",
  "gif-to-png",
  "gif-to-jpg",
  "tiff-to-png",
  "tiff-to-jpg",
  "ico-to-png",
]);

export function isBatchEnabledTool(slug: string): boolean {
  return BATCH_ENABLED_SLUGS.has(slug);
}

export function listBatchEnabledSlugs(): string[] {
  return [...BATCH_ENABLED_SLUGS];
}
