import type { Metadata } from "next";
import type { Locale } from "./types";
import { DEFAULT_LOCALE } from "./index";
import { getDictionary } from "./index";

export const LOCALE_COOKIE_NAME = "camaleon-locale";

export function resolveLocaleFromCookie(value: string | undefined): Locale {
  if (value === "en" || value === "es") return value as Locale;
  return DEFAULT_LOCALE;
}

function t(locale: Locale, key: string, params?: Record<string, string>): string {
  const dict = getDictionary(locale);
  const parts = key.split(".");
  let current: unknown = dict;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return key;
    current = (current as Record<string, unknown>)[part];
  }
  let str = typeof current === "string" ? current : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

export function getRootMetadata(locale: Locale): Metadata {
  return {
    title: t(locale, "meta.title"),
    description: t(locale, "meta.description"),
    openGraph: {
      title: t(locale, "meta.title"),
      description: t(locale, "meta.description"),
      type: "website",
      locale: locale === "es" ? "es_ES" : "en_US",
    },
  };
}

export function getToolMetadata(
  locale: Locale,
  toolId: string,
  toolTitle: string
): Metadata {
  const title = t(locale, `meta.tools.${toolId}.title`, {});
  const description = t(locale, `meta.tools.${toolId}.description`, {});
  return {
    title: title !== `meta.tools.${toolId}.title` ? title : `${toolTitle} — Camaleon`,
    description:
      description !== `meta.tools.${toolId}.description`
        ? description
        : t(locale, "meta.description"),
    openGraph: {
      title:
        title !== `meta.tools.${toolId}.title`
          ? title
          : `${toolTitle} — Camaleon`,
      description:
        description !== `meta.tools.${toolId}.description`
          ? description
          : t(locale, "meta.description"),
      type: "website",
      locale: locale === "es" ? "es_ES" : "en_US",
    },
  };
}
