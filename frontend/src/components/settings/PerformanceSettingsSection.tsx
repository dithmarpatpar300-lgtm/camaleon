"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import {
  getEffectivePerformancePrefs,
  resetPerformancePrefs,
  writePerformancePrefs,
  type PerformanceTierMode,
  type PerformanceToggleMode,
} from "@/lib/prefs/performance-prefs";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsRow } from "./SettingsRow";
import { SettingsModeSegment } from "./SettingsModeSegment";

type Props = {
  drawerOpen: boolean;
};

export function PerformanceSettingsSection({ drawerOpen }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState(getEffectivePerformancePrefs);

  useEffect(() => {
    if (!drawerOpen) return;
    setPrefs(getEffectivePerformancePrefs());
  }, [drawerOpen]);

  const persistTier = useCallback((tier: PerformanceTierMode) => {
    writePerformancePrefs({ tier });
    setPrefs(getEffectivePerformancePrefs());
  }, []);

  const persistToggle = useCallback(
    (key: "resultCache" | "autoEstimate", value: PerformanceToggleMode) => {
      writePerformancePrefs({ [key]: value });
      setPrefs(getEffectivePerformancePrefs());
    },
    []
  );

  const handleReset = useCallback(() => {
    resetPerformancePrefs();
    setPrefs(getEffectivePerformancePrefs());
    toast({ message: t("settings.performance.resetDone"), variant: "success" });
  }, [t, toast]);

  const tierOptions = [
    { value: "auto" as const, label: t("settings.performance.tierAuto") },
    { value: "conservative" as const, label: t("settings.performance.tierConservative") },
    { value: "balanced" as const, label: t("settings.performance.tierBalanced") },
    { value: "aggressive" as const, label: t("settings.performance.tierAggressive") },
  ];

  const toggleOptions = [
    { value: "auto" as const, label: t("settings.performance.modeAuto") },
    { value: "on" as const, label: t("settings.performance.modeOn") },
    { value: "off" as const, label: t("settings.performance.modeOff") },
  ];

  const actionButtonClass = cn(
    "rounded-lg border border-border bg-bg-elevated/50 px-3 py-2 text-xs font-medium text-text-secondary",
    "transition-colors hover:border-accent/25 hover:bg-bg-elevated hover:text-text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  );

  return (
    <SettingsSection title={t("settings.performance.section")} focusTarget="performance">
      <SettingsRow
        layout="stacked"
        label={t("settings.performance.tierLabel")}
        description={t("settings.performance.tierHint")}
      >
        <SettingsModeSegment
          value={prefs.tier}
          options={tierOptions}
          onChange={persistTier}
          ariaLabel={t("settings.performance.tierLabel")}
          fullWidth
        />
      </SettingsRow>
      <SettingsRow
        layout="stacked"
        label={t("settings.performance.cacheLabel")}
        description={t("settings.performance.cacheHint")}
      >
        <SettingsModeSegment
          value={prefs.resultCache}
          options={toggleOptions}
          onChange={(v) => persistToggle("resultCache", v)}
          ariaLabel={t("settings.performance.cacheLabel")}
          fullWidth
        />
      </SettingsRow>
      <SettingsRow
        layout="stacked"
        label={t("settings.performance.autoEstimateLabel")}
        description={t("settings.performance.autoEstimateHint")}
        bordered={false}
      >
        <SettingsModeSegment
          value={prefs.autoEstimate}
          options={toggleOptions}
          onChange={(v) => persistToggle("autoEstimate", v)}
          ariaLabel={t("settings.performance.autoEstimateLabel")}
          fullWidth
        />
      </SettingsRow>
      <div className="flex justify-end px-4 py-3">
        <button type="button" onClick={handleReset} className={actionButtonClass}>
          {t("settings.performance.resetAction")}
        </button>
      </div>
    </SettingsSection>
  );
}
