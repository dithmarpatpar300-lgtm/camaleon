import type { TranslateFn } from "./types";

type ErrorMatcher = {
  pattern: RegExp;
  key: string;
};

const matchers: ErrorMatcher[] = [
  { pattern: /empty/i, key: "errors.emptyInput" },
  { pattern: /too large|exceed|maximum/i, key: "errors.tooLarge" },
  { pattern: /not yet available/i, key: "errors.notAvailable" },
  { pattern: /dimension/i, key: "errors.dimensionsTooLarge" },
  { pattern: /corrupt|invalid/i, key: "errors.corrupt" },
];

export function localizeError(rawError: string, t: TranslateFn): string {
  for (const m of matchers) {
    if (m.pattern.test(rawError)) {
      return t(m.key);
    }
  }
  return rawError;
}
