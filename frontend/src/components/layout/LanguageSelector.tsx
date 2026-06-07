"use client";

import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n/types";
import { useI18n } from "@/providers/I18nProvider";

/**
 * Ordered list of all supported locales.
 *
 * To add a new language:
 *   1. Extend the `Locale` union type in src/lib/i18n/types.ts
 *   2. Add an entry here in the desired display order
 *   3. Add a `switchToXX` key in each dictionary file
 *   4. If adding more than ~3 locales, consider switching the component
 *      to a compact <select> or popover — the pill track scales well to 3,
 *      starts to feel crowded at 4+.
 */
const LOCALES: readonly Locale[] = ["en", "es"];

/** Width of each locale button. Must match --lang-btn-w default in globals.css. */
const BTN_W = "2.25rem" as const;

function getAriaLabel(l: Locale, t: (key: string) => string): string {
  if (l === "en") return t("lang.switchToEn");
  return t("lang.switchToEs");
}

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  const activeIndex = LOCALES.indexOf(locale);

  return (
    <div
      role="group"
      aria-label="Language"
      className="relative flex h-8 items-stretch text-xs font-medium"
      style={
        {
          "--active-idx": activeIndex,
          "--lang-btn-w": BTN_W,
        } as CSSProperties
      }
    >
      {/* Animated pill — absolutely positioned, driven by CSS custom properties */}
      <div aria-hidden="true" className="lang-pill-thumb" />

      {LOCALES.map((l) => {
        const isActive = locale === l;
        return (
          <button
            key={l}
            onClick={() => setLocale(l)}
            aria-label={getAriaLabel(l, t)}
            aria-current={isActive ? "true" : undefined}
            className={[
              "relative z-10 flex items-center justify-center uppercase",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
              "transition-colors duration-150",
              isActive ? "text-text-primary" : "text-text-muted hover:text-text-secondary",
            ].join(" ")}
            style={{ width: BTN_W }}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
