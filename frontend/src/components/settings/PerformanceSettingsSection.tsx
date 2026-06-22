"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import {
  getEffectivePerformancePrefs,
  resetPerformancePrefs,
  writePerformancePrefs,
  type PerformanceTierMode,
  type PerformanceToggleMode,
} from "@/lib/prefs/performance-prefs";
import { computeResourceProfile, type ResourceSignals } from "@/lib/device/resource-profile";
import { scoreRecommendationKey } from "@/lib/device/device-capability";
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
  const [deviceScore, setDeviceScore] = useState<{ score: number; tier: string } | null>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    setPrefs(getEffectivePerformancePrefs());
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen || typeof window === "undefined") return;
    let cancelled = false;

    async function detectDevice() {
      const signals: ResourceSignals = {
        deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
        effectiveType: (navigator as { connection?: { effectiveType?: string } }).connection?.effectiveType,
        saveData: (navigator as { connection?: { saveData?: boolean } }).connection?.saveData,
      };

      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota && estimate.quota > 0 && estimate.usage !== undefined) {
          signals.freeStoragePercent = ((estimate.quota - estimate.usage) / estimate.quota) * 100;
        }
      } catch { /* Storage API unavailable */ }

      if (cancelled) return;
      const profile = computeResourceProfile(1_000_000, signals);
      setDeviceScore({ score: profile.score, tier: profile.tier });
    }

    detectDevice();
    return () => { cancelled = true; };
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

  const scoreColor = useMemo(() => {
    if (!deviceScore) return "bg-text-muted";
    if (deviceScore.score >= 65) return "bg-accent";
    if (deviceScore.score >= 35) return "bg-warning";
    return "bg-error";
  }, [deviceScore]);

  const recommendationKey = useMemo(() => {
    if (!deviceScore) return "auto";
    return scoreRecommendationKey(deviceScore.tier as "high" | "mid" | "low");
  }, [deviceScore]);

  const recommendationLabel = useMemo(() => {
    const key = `settings.performance.scoreRecommendation.${recommendationKey}`;
    return t(key);
  }, [recommendationKey, t]);

  const recommendationReason = useMemo(() => {
    const key = `settings.performance.scoreRecommendation.${recommendationKey}Reason`;
    return t(key);
  }, [recommendationKey, t]);

  return (
    <SettingsSection title={t("settings.performance.section")} focusTarget="performance">
      {deviceScore && (
        <SettingsRow
          layout="stacked"
          label={t("settings.performance.scoreLabel", { score: deviceScore.score })}
          description={recommendationReason}
        >
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-3">
              <div className="h-3 flex-1 rounded-full bg-bg-elevated overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", scoreColor)}
                  style={{ width: `${deviceScore.score}%` }}
                />
              </div>
              <span className="text-sm font-mono tabular-nums text-text-primary min-w-[3.5ch] text-right">
                {deviceScore.score}
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {t("settings.performance.scoreHint", { score: deviceScore.score, recommendation: recommendationLabel })}
            </p>
          </div>
        </SettingsRow>
      )}
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
