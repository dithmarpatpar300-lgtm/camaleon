"use client";

import { useI18n } from "@/providers/I18nProvider";

export function RiskDeactivatedNotice() {
  const { t } = useI18n();

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning"
    >
      <p className="font-medium">{t("panel.riskDeactivated.title")}</p>
      <p className="mt-1 leading-relaxed text-warning/90">{t("panel.riskDeactivated.body")}</p>
    </div>
  );
}
