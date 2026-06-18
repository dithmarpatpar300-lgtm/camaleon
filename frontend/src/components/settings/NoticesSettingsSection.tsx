"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import {
  getEffectiveNoticesPrefs,
  resetNoticesPrefs,
  writeNoticesPrefs,
  type NoticeRailDensity,
  type PrepareProgressStylePref,
} from "@/lib/prefs/notices-prefs";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsRow } from "./SettingsRow";
import { SettingsModeSegment } from "./SettingsModeSegment";

type Props = {
  drawerOpen: boolean;
};

export function NoticesSettingsSection({ drawerOpen }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState(getEffectiveNoticesPrefs);

  useEffect(() => {
    if (!drawerOpen) return;
    setPrefs(getEffectiveNoticesPrefs());
  }, [drawerOpen]);

  const persistDensity = useCallback((railDensity: NoticeRailDensity) => {
    writeNoticesPrefs({ railDensity });
    setPrefs(getEffectiveNoticesPrefs());
  }, []);

  const persistProgressStyle = useCallback((prepareProgressStyle: PrepareProgressStylePref) => {
    writeNoticesPrefs({ prepareProgressStyle });
    setPrefs(getEffectiveNoticesPrefs());
  }, []);

  const handleReset = useCallback(() => {
    resetNoticesPrefs();
    setPrefs(getEffectiveNoticesPrefs());
    toast({ message: t("settings.notices.resetDone"), variant: "success" });
  }, [t, toast]);

  const densityOptions = [
    { value: "normal" as const, label: t("settings.notices.densityNormal") },
    { value: "minimal" as const, label: t("settings.notices.densityMinimal") },
  ];

  const progressOptions = [
    { value: "ring" as const, label: t("settings.notices.progressRing") },
    { value: "bar" as const, label: t("settings.notices.progressBar") },
  ];

  const actionButtonClass = cn(
    "rounded-lg border border-border bg-bg-elevated/50 px-3 py-2 text-xs font-medium text-text-secondary",
    "transition-colors hover:border-accent/25 hover:bg-bg-elevated hover:text-text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  );

  return (
    <SettingsSection title={t("settings.notices.section")}>
      <SettingsRow
        layout="stacked"
        label={t("settings.notices.densityLabel")}
        description={t("settings.notices.densityHint")}
      >
        <SettingsModeSegment
          value={prefs.railDensity}
          options={densityOptions}
          onChange={persistDensity}
          ariaLabel={t("settings.notices.densityLabel")}
          fullWidth
        />
      </SettingsRow>
      <SettingsRow
        layout="stacked"
        label={t("settings.notices.progressLabel")}
        description={t("settings.notices.progressHint")}
        bordered={false}
      >
        <SettingsModeSegment
          value={prefs.prepareProgressStyle}
          options={progressOptions}
          onChange={persistProgressStyle}
          ariaLabel={t("settings.notices.progressLabel")}
          fullWidth
        />
      </SettingsRow>
      <div className="flex justify-end px-4 py-3">
        <button type="button" onClick={handleReset} className={actionButtonClass}>
          {t("settings.notices.resetAction")}
        </button>
      </div>
    </SettingsSection>
  );
}
