"use client";

import { useSettings } from "@/providers/SettingsProvider";
import { useI18n } from "@/providers/I18nProvider";
import { useRiskMode } from "@/providers/RiskModeProvider";
import { cn } from "@/lib/utils";

type LimitUnlockHintProps = {
  variant?: "error" | "warning" | "info";
};

export function LimitUnlockHint({ variant = "error" }: LimitUnlockHintProps) {
  const { t } = useI18n();
  const { openSettings } = useSettings();
  const { riskModeEnabled } = useRiskMode();

  if (riskModeEnabled) return null;

  return (
    <div
      className={cn(
        "mt-3 rounded-lg border px-3 py-2.5 text-xs",
        variant === "error" && "border-error/30 bg-error/5 text-error/90",
        variant === "warning" && "border-warning/30 bg-warning/5 text-warning/90",
        variant === "info" && "border-border/50 bg-bg-surface/80 text-text-secondary"
      )}
    >
      <p className="font-medium">{t("panel.limitsUnlock.title")}</p>
      <p className="mt-1">{t("panel.limitsUnlock.intro")}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4">
        <li>{t("panel.limitsUnlock.step1")}</li>
        <li>{t("panel.limitsUnlock.step2")}</li>
        <li>{t("panel.limitsUnlock.step3")}</li>
      </ol>
      <p className="mt-2 opacity-90">{t("panel.limitsUnlock.disclaimer")}</p>
      <button
        type="button"
        className="mt-2 font-medium underline underline-offset-2 hover:opacity-80"
        onClick={() => openSettings({ focus: "risk" })}
      >
        {t("panel.limitsUnlock.openSettings")}
      </button>
    </div>
  );
}
