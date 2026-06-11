import type { TranslateFn } from "./types";

type ErrorMatcher = {
  pattern: RegExp;
  key: string;
  /** When true, try to extract numeric params from the Rust error string. */
  parseParams?: boolean;
};

const matchers: ErrorMatcher[] = [
  { pattern: /empty/i, key: "errors.emptyInput" },
  {
    pattern: /dimensions.*exceed|exceed maximum allowed \(\d+ pixels\)/i,
    key: "errors.dimensionsTooLarge",
    parseParams: true,
  },
  {
    pattern: /input size \d+ exceeds maximum allowed bytes/i,
    key: "errors.inputTooLarge",
    parseParams: true,
  },
  { pattern: /not yet available/i, key: "errors.notAvailable" },
  { pattern: /TIFF palette/i, key: "errors.tiffPalette" },
  { pattern: /TIFF CMYK/i, key: "errors.tiffCmyk" },
  { pattern: /page index \d+ out of range/i, key: "errors.tiffPageRange" },
  { pattern: /ICO entry index \d+ is out of range/i, key: "errors.icoEntryRange" },
  { pattern: /Legacy BMP-style ICO/i, key: "errors.icoBmpLegacy" },
  {
    pattern: /Hint:.*Windows Photos|WIC codec/i,
    key: "errors.avifDecodeFailedWithHint",
  },
  { pattern: /Failed to decode AVIF/i, key: "errors.avifDecodeFailed" },
  { pattern: /Failed to open animated AVIF/i, key: "errors.avifDecodeFailed" },
  { pattern: /Unsupported.*AVIF|not an animated AVIF/i, key: "errors.avifUnsupported" },
  { pattern: /AVIF frame index \d+/i, key: "errors.avifFrameRange" },
  { pattern: /ftyp must be 'avif' or 'avis'/i, key: "errors.avifMiafBrand" },
  { pattern: /Invalid or corrupt AVIF/i, key: "errors.avifCorrupt" },
  { pattern: /corrupt|invalid/i, key: "errors.corrupt" },
];

function formatMp(pixels: number): string {
  return (pixels / 1_000_000).toFixed(1);
}

function formatMaxMp(pixels: number): string {
  return (pixels / 1_000_000).toFixed(0);
}

function parseDimensionsError(raw: string): Record<string, string | number> | null {
  const rust = raw.match(
    /(\d+)x(\d+)\s*\((\d+)\s*pixels\)\s*exceed maximum allowed\s*\((\d+)\s*pixels\)/i
  );
  if (rust) {
    const pixelCount = Number(rust[3]);
    const maxPixels = Number(rust[4]);
    return {
      width: Number(rust[1]),
      height: Number(rust[2]),
      megapixels: formatMp(pixelCount),
      maxMp: formatMaxMp(maxPixels),
    };
  }

  const js = raw.match(
    /Target dimensions (\d+)[×x](\d+) \((\d+) px\) exceed the (\d+) pixel limit/i
  );
  if (js) {
    const pixelCount = Number(js[3]);
    const maxPixels = Number(js[4]);
    return {
      width: Number(js[1]),
      height: Number(js[2]),
      megapixels: formatMp(pixelCount),
      maxMp: formatMaxMp(maxPixels),
    };
  }

  return null;
}

function parseInputSizeError(raw: string): Record<string, string | number> | null {
  const m = raw.match(/input size (\d+) exceeds maximum allowed bytes \((\d+)\)/i);
  if (!m) return null;
  const maxBytes = Number(m[2]);
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  return { maxMb };
}

export function localizeError(rawError: string, t: TranslateFn): string {
  for (const m of matchers) {
    if (!m.pattern.test(rawError)) continue;

    if (m.parseParams) {
      if (m.key === "errors.dimensionsTooLarge") {
        const params = parseDimensionsError(rawError);
        if (params) return t(m.key, params);
        return t("errors.dimensionsTooLargeGeneric");
      }
      if (m.key === "errors.inputTooLarge") {
        const params = parseInputSizeError(rawError);
        if (params) return t(m.key, params);
      }
    }

    return t(m.key);
  }
  return rawError;
}
