import { MAX_PIXELS } from "@/lib/transmutation/limit-context";

/** Within 90% of the 40 MP browser ceiling — shared by consent panel and notice rail. */
export function isNearPixelLimit(pixelCount: number | null): boolean {
  if (pixelCount == null) return false;
  return pixelCount <= MAX_PIXELS && pixelCount >= MAX_PIXELS * 0.9;
}

export { pixelCountFromMeta } from "@/lib/transmutation/limit-context";
