"use client";

import { useI18n } from "@/providers/I18nProvider";

export function RiskModeBanner() {
  const { t } = useI18n();

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-warning/50 bg-warning/10 px-4 py-2.5 text-xs text-warning"
    >
      <p className="font-medium">{t("panel.riskMode.bannerTitle")}</p>
      <p className="mt-1 text-warning/90">{t("panel.riskMode.bannerBody")}</p>
    </div>
  );
}
