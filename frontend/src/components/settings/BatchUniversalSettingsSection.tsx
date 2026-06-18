"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import {
  getEffectiveBatchUniversalPrefs,
  resetBatchUniversalPrefs,
  setBatchDefaultSelection,
  type BatchDefaultSelection,
} from "@/lib/prefs/batch-universal-prefs";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsRow } from "./SettingsRow";
import { SettingsModeSegment } from "./SettingsModeSegment";

type Props = {
  drawerOpen: boolean;
};

export function BatchUniversalSettingsSection({ drawerOpen }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [defaultSelection, setDefaultSelection] = useState<BatchDefaultSelection>(
    () => getEffectiveBatchUniversalPrefs().defaultSelection
  );

  useEffect(() => {
    if (!drawerOpen) return;
    setDefaultSelection(getEffectiveBatchUniversalPrefs().defaultSelection);
  }, [drawerOpen]);

  const persistSelection = useCallback((next: BatchDefaultSelection) => {
    setBatchDefaultSelection(next);
    setDefaultSelection(next);
  }, []);

  const handleReset = useCallback(() => {
    resetBatchUniversalPrefs();
    setDefaultSelection(getEffectiveBatchUniversalPrefs().defaultSelection);
    toast({ message: t("settings.batchUniversal.resetDone"), variant: "success" });
  }, [t, toast]);

  const selectionOptions = [
    { value: "all" as const, label: t("settings.batchUniversal.selectionAll") },
    { value: "none" as const, label: t("settings.batchUniversal.selectionNone") },
  ];

  const actionButtonClass = cn(
    "rounded-lg border border-border bg-bg-elevated/50 px-3 py-2 text-xs font-medium text-text-secondary",
    "transition-colors hover:border-accent/25 hover:bg-bg-elevated hover:text-text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  );

  return (
    <SettingsSection title={t("settings.batchUniversal.section")}>
      <SettingsRow
        label={t("settings.batchUniversal.selectionLabel")}
        description={t("settings.batchUniversal.selectionHint")}
        bordered={false}
      >
        <SettingsModeSegment
          value={defaultSelection}
          options={selectionOptions}
          onChange={persistSelection}
          ariaLabel={t("settings.batchUniversal.selectionLabel")}
        />
      </SettingsRow>
      <div className="flex justify-end px-1 pt-1">
        <button type="button" onClick={handleReset} className={actionButtonClass}>
          {t("settings.batchUniversal.resetAction")}
        </button>
      </div>
    </SettingsSection>
  );
}
