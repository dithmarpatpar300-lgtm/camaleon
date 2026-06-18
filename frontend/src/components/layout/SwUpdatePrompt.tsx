"use client";

import { useOffline } from "@/providers/OfflineProvider";
import { useI18n } from "@/providers/I18nProvider";

export function SwUpdatePrompt() {
  const { updateAvailable, reloadForUpdate } = useOffline();
  const { t } = useI18n();

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-3 border-b border-accent/30 bg-accent/10 px-4 py-2 text-center text-xs text-text-primary"
    >
      <span>{t("offline.updateAvailable")}</span>
      <button
        type="button"
        onClick={reloadForUpdate}
        className="rounded-md border border-accent/40 bg-bg-elevated px-2.5 py-1 font-medium text-accent hover:bg-bg-elevated/80"
      >
        {t("offline.updateReload")}
      </button>
    </div>
  );
}
