"use client";

import { ENGINE_MAX_INPUT_LABEL } from "@/lib/transmutation/limits";
import { useI18n } from "@/providers/I18nProvider";

type LargeFileNoticeProps = {
  /** When set to a BMP tool id, shows a format-specific hint. */
  toolId?: string;
};

export function LargeFileNotice({ toolId }: LargeFileNoticeProps) {
  const { t } = useI18n();
  const isBmp = toolId === "bmp-to-png" || toolId === "bmp-to-jpg";

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning"
    >
      <p className="font-medium">{t("panel.largeFile.title")}</p>
      <p className="mt-1 text-warning/90">
        {isBmp
          ? t("panel.largeFile.bmpBody", { limit: ENGINE_MAX_INPUT_LABEL })
          : t("panel.largeFile.body", { limit: ENGINE_MAX_INPUT_LABEL })}
      </p>
    </div>
  );
}
