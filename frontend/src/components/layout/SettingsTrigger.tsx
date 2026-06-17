"use client";

import { cn } from "@/lib/utils";
import { useSettings } from "@/providers/SettingsProvider";
import { useI18n } from "@/providers/I18nProvider";

function CogIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567l-.091.662a8.25 8.25 0 00-1.099.563l-.628-.284a1.875 1.875 0 00-2.065.457l-.442.442a1.875 1.875 0 00-.457 2.065l.284.628a8.25 8.25 0 00-.563 1.099l-.662.091A1.875 1.875 0 002.25 11.078v.844c0 .917.663 1.699 1.567 1.85l.662.091a8.25 8.25 0 00.563 1.099l-.284.628a1.875 1.875 0 00.457 2.065l.442.442a1.875 1.875 0 002.065.457l.628-.284a8.25 8.25 0 001.099.563l.091.662a1.875 1.875 0 001.85 1.567h.844c.917 0 1.699-.663 1.85-1.567l.091-.662a8.25 8.25 0 001.099-.563l.628.284a1.875 1.875 0 002.065-.457l.442-.442a1.875 1.875 0 00.457-2.065l-.284-.628a8.25 8.25 0 00.563-1.099l.662-.091A1.875 1.875 0 0021.75 11.922v-.844a1.875 1.875 0 00-1.567-1.85l-.662-.091a8.25 8.25 0 00-.563-1.099l.284-.628a1.875 1.875 0 00-.457-2.065l-.442-.442a1.875 1.875 0 00-2.065-.457l-.628.284a8.25 8.25 0 00-1.099-.563l-.091-.662A1.875 1.875 0 0012.922 2.25h-.844zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function SettingsTrigger() {
  const { openSettings, closeSettings, settingsOpen } = useSettings();
  const { t } = useI18n();

  const handleClick = () => {
    if (settingsOpen) {
      closeSettings();
    } else {
      openSettings();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={settingsOpen ? t("settings.close") : t("settings.openAria")}
      aria-haspopup="dialog"
      aria-expanded={settingsOpen}
      className={cn(
        "utility-cluster-icon-btn",
        settingsOpen ? "settings-trigger-btn--open" : "settings-trigger-btn--idle"
      )}
    >
      <CogIcon
        className={cn(
          "settings-trigger-icon h-3.5 w-3.5",
          settingsOpen && "settings-trigger-icon--open"
        )}
      />
    </button>
  );
}
