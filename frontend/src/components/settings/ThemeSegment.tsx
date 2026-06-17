"use client";

import type { Theme } from "@/lib/types";
import { useTheme } from "@/providers/ThemeProvider";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

const THEMES: readonly Theme[] = ["light", "dark"];

export function ThemeSegment() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("settings.general.themeLabel")}
      className="theme-segment-track text-xs font-medium"
    >
      {THEMES.map((value) => {
        const isActive = theme === value;
        const label =
          value === "light" ? t("settings.general.themeLight") : t("settings.general.themeDark");
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={isActive}
            className={cn("theme-segment-btn", isActive && "theme-segment-btn--active")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
