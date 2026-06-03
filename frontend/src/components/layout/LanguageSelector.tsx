"use client";

import { useI18n } from "@/providers/I18nProvider";

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded-md px-2 py-1 uppercase transition-colors ${
            locale === l
              ? "bg-bg-elevated text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
          aria-label={l === "en" ? t("lang.switchToEn") : t("lang.switchToEs")}
          aria-current={locale === l ? "true" : undefined}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
