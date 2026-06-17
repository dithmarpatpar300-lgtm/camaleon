"use client";

import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n/types";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

const LOCALES: readonly Locale[] = ["en", "es"];
const BTN_W = "2.375rem";

function localeLabel(l: Locale, t: (key: string) => string): string {
  return l === "en" ? t("settings.general.langEn") : t("settings.general.langEs");
}

export function LanguageSegment() {
  const { locale, setLocale, t } = useI18n();
  const activeIndex = LOCALES.indexOf(locale);

  return (
    <div
      role="group"
      aria-label={t("settings.general.languageLabel")}
      className="segment-pill-track text-xs font-medium uppercase"
      style={
        {
          "--active-idx": activeIndex,
          "--lang-btn-w": BTN_W,
        } as CSSProperties
      }
    >
      <div aria-hidden="true" className="lang-pill-thumb" />
      {LOCALES.map((l) => {
        const isActive = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-label={localeLabel(l, t)}
            aria-pressed={isActive}
            className={cn(
              "relative z-10 flex h-[1.625rem] items-center justify-center transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
              isActive ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
            )}
            style={{ width: BTN_W }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
