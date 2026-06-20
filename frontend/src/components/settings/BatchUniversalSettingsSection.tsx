"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import {
  getEffectiveBatchUniversalPrefs,
  resetBatchUniversalPrefs,
  setBatchDefaultSelection,
  setBatchDownloadMode,
  setMixedFormatPolicy,
  setUniversalMultiDrop,
  type BatchDefaultSelection,
  type BatchDownloadMode,
  type MixedFormatPolicy,
} from "@/lib/prefs/batch-universal-prefs";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsRow } from "./SettingsRow";
import { SettingsModeSegment } from "./SettingsModeSegment";
import { SettingsSwitch } from "./SettingsSwitch";

type Props = {
  drawerOpen: boolean;
};

export function BatchUniversalSettingsSection({ drawerOpen }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState(() => getEffectiveBatchUniversalPrefs());

  useEffect(() => {
    if (!drawerOpen) return;
    setPrefs(getEffectiveBatchUniversalPrefs());
  }, [drawerOpen]);

  const persistSelection = useCallback((next: BatchDefaultSelection) => {
    setBatchDefaultSelection(next);
    setPrefs(getEffectiveBatchUniversalPrefs());
  }, []);

  const persistMultiDrop = useCallback((next: boolean) => {
    setUniversalMultiDrop(next);
    setPrefs(getEffectiveBatchUniversalPrefs());
  }, []);

  const persistMixedPolicy = useCallback((next: MixedFormatPolicy) => {
    setMixedFormatPolicy(next);
    setPrefs(getEffectiveBatchUniversalPrefs());
  }, []);

  const persistDownloadMode = useCallback((next: BatchDownloadMode) => {
    setBatchDownloadMode(next);
    setPrefs(getEffectiveBatchUniversalPrefs());
  }, []);

  const handleReset = useCallback(() => {
    resetBatchUniversalPrefs();
    setPrefs(getEffectiveBatchUniversalPrefs());
    toast({ message: t("settings.batchUniversal.resetDone"), variant: "success" });
  }, [t, toast]);

  const selectionOptions = [
    { value: "all" as const, label: t("settings.batchUniversal.selectionAll") },
    { value: "none" as const, label: t("settings.batchUniversal.selectionNone") },
  ];

  const mixedPolicyOptions = [
    { value: "picker" as const, label: t("settings.batchUniversal.mixedPolicyPicker") },
    { value: "hint" as const, label: t("settings.batchUniversal.mixedPolicyHintOnly") },
  ];

  const downloadModeOptions = [
    { value: "individual" as const, label: t("settings.batchUniversal.downloadIndividual") },
    { value: "zip" as const, label: t("settings.batchUniversal.downloadZip") },
  ];

  const actionButtonClass = cn(
    "rounded-lg border border-border bg-bg-elevated/50 px-3 py-2 text-xs font-medium text-text-secondary",
    "transition-colors hover:border-accent/25 hover:bg-bg-elevated hover:text-text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  );

  return (
    <SettingsSection title={t("settings.batchUniversal.section")} focusTarget="batch">
      <SettingsRow
        label={t("settings.batchUniversal.selectionLabel")}
        description={t("settings.batchUniversal.selectionHint")}
      >
        <SettingsModeSegment
          value={prefs.defaultSelection}
          options={selectionOptions}
          onChange={persistSelection}
          ariaLabel={t("settings.batchUniversal.selectionLabel")}
        />
      </SettingsRow>

      <SettingsRow
        label={t("settings.batchUniversal.multiDropLabel")}
        description={t("settings.batchUniversal.multiDropHint")}
      >
        <SettingsSwitch
          checked={prefs.universalMultiDrop}
          onChange={persistMultiDrop}
          label={t("settings.batchUniversal.multiDropLabel")}
        />
      </SettingsRow>

      <SettingsRow
        label={t("settings.batchUniversal.mixedPolicyLabel")}
        description={t("settings.batchUniversal.mixedPolicyHint")}
      >
        <SettingsModeSegment
          value={prefs.mixedFormatPolicy}
          options={mixedPolicyOptions}
          onChange={persistMixedPolicy}
          ariaLabel={t("settings.batchUniversal.mixedPolicyLabel")}
        />
      </SettingsRow>

      <SettingsRow
        label={t("settings.batchUniversal.downloadModeLabel")}
        description={t("settings.batchUniversal.downloadModeHint")}
        bordered={false}
      >
        <SettingsModeSegment
          value={prefs.batchDownloadMode}
          options={downloadModeOptions}
          onChange={persistDownloadMode}
          ariaLabel={t("settings.batchUniversal.downloadModeLabel")}
        />
      </SettingsRow>

      <div className="flex justify-end px-4 py-3">
        <button type="button" onClick={handleReset} className={actionButtonClass}>
          {t("settings.batchUniversal.resetAction")}
        </button>
      </div>
    </SettingsSection>
  );
}
