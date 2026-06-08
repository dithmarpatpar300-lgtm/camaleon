"use client";

import { useI18n } from "@/providers/I18nProvider";

export function BmpPngGrowthNotice() {
  const { t } = useI18n();

  return (
    <p className="py-1 text-xs text-warning/90" role="note">
      {t("panel.bmpEstimate.growthWarning")}
    </p>
  );
}
