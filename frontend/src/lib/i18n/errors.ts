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
  { pattern: /corrupt|invalid/i, key: "errors.corrupt" },
];

function parseDimensionsError(raw: string): Record<string, string | number> | null {
  const m = raw.match(
    /(\d+)x(\d+)\s*\((\d+)\s*pixels\)\s*exceed maximum allowed\s*\((\d+)\s*pixels\)/i
  );
  if (!m) return null;
  const pixelCount = Number(m[3]);
  const maxPixels = Number(m[4]);
  return {
    width: Number(m[1]),
    height: Number(m[2]),
    megapixels: (pixelCount / 1_000_000).toFixed(1),
    maxMp: (maxPixels / 1_000_000).toFixed(0),
  };
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
