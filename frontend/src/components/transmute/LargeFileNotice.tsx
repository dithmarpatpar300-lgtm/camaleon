"use client";

import { ENGINE_MAX_INPUT_LABEL } from "@/lib/transmutation/limits";
import { useI18n } from "@/providers/I18nProvider";

export function LargeFileNotice() {
  const { t } = useI18n();

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning"
    >
      <p className="font-medium">{t("panel.largeFile.title")}</p>
      <p className="mt-1 text-warning/90">
        {t("panel.largeFile.body", { limit: ENGINE_MAX_INPUT_LABEL })}
      </p>
    </div>
  );
}
