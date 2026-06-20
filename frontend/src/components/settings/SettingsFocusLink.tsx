"use client";

import type { SettingsFocusTarget } from "@/lib/settings/settings-focus";
import { useSettings } from "@/providers/SettingsProvider";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

type SettingsFocusLinkProps = {
  focus: SettingsFocusTarget;
  labelKey: string;
  className?: string;
};

export function SettingsFocusLink({ focus, labelKey, className }: SettingsFocusLinkProps) {
  const { openSettings } = useSettings();
  const { t } = useI18n();

  return (
    <button
      type="button"
      className={cn(
        "font-medium underline underline-offset-2 transition-opacity hover:opacity-80",
        className
      )}
      onClick={() => openSettings({ focus })}
    >
      {t(labelKey)}
    </button>
  );
}
