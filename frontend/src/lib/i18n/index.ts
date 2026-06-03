import type { Locale, TranslateFn } from "./types";
import en from "./dictionaries/en";
import es from "./dictionaries/es";

export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_STORAGE_KEY = "camaleon-locale";

const dictionaries: Record<Locale, Record<string, unknown>> = { en, es };

function resolve(key: string, dict: Record<string, unknown>): string {
  const parts = key.split(".");
  let current: unknown = dict;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return key;
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current === "string") return current;
  return key;
}

export function createT(locale: Locale): TranslateFn {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  return (key: string, params?: Record<string, string | number>) => {
    let str = resolve(key, dict);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  };
}

export function getDictionary(locale: Locale): Record<string, unknown> {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
