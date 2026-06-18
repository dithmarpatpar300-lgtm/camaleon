"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useRiskMode } from "@/providers/RiskModeProvider";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsSwitch } from "./SettingsSwitch";

type Props = {
  drawerOpen: boolean;
};

export function RiskSettingsSection({ drawerOpen }: Props) {
  const { t } = useI18n();
  const { riskModeEnabled, setRiskMode } = useRiskMode();
  const [acknowledged, setAcknowledged] = useState(riskModeEnabled);

  useEffect(() => {
    if (!drawerOpen) return;
    setAcknowledged(riskModeEnabled);
  }, [drawerOpen, riskModeEnabled]);

  const handleToggle = useCallback(
    (next: boolean) => {
      if (next && !acknowledged) return;
      setRiskMode(next);
    },
    [acknowledged, setRiskMode]
  );

  return (
    <SettingsSection title={t("settings.risk.section")} className="[&>div]:border-warning/30">
      <div className="space-y-5 p-4 sm:p-5">
        <p className="text-sm leading-relaxed text-text-secondary">{t("settings.risk.intro")}</p>

        <div className="rounded-lg border border-warning/25 bg-warning/5 px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-warning">
            {t("settings.risk.warningTitle")}
          </p>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-text-secondary">
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              <span>{t("settings.risk.warningOom")}</span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              <span>{t("settings.risk.warningTab")}</span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              <span>{t("settings.risk.warningHardware")}</span>
            </li>
          </ul>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-warning/35 bg-bg-elevated/50 px-4 py-3.5 text-sm leading-relaxed text-text-secondary">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-warning"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <span>{t("settings.risk.acknowledge")}</span>
        </label>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-bg-elevated/40 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary">{t("settings.risk.enableLabel")}</p>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              {t("settings.risk.enableHint")}
            </p>
          </div>
          <SettingsSwitch
            checked={riskModeEnabled}
            onChange={handleToggle}
            label={t("settings.risk.enableLabel")}
            disabled={!acknowledged && !riskModeEnabled}
          />
        </div>

        {riskModeEnabled && (
          <p className={cn("rounded-lg bg-warning/10 px-4 py-2.5 text-xs text-warning")}>
            {t("settings.risk.activeFootnote")}
          </p>
        )}
      </div>
    </SettingsSection>
  );
}
