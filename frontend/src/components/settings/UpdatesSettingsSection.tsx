"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import { useAppUpdate } from "@/providers/AppUpdateProvider";
import {
  getAutoDetectUpdates,
  getEffectiveUpdatesPrefs,
  setAutoDetectUpdates,
  subscribeUpdatesPrefs,
} from "@/lib/prefs/updates-prefs";
import {
  getShowChangelogOnUpdate,
  setShowChangelogOnUpdate,
} from "@/lib/prefs/user-settings";
import { resetOnboarding } from "@/lib/releases/storage";
import { useReleaseComms } from "@/providers/ReleaseCommsProvider";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsRow } from "./SettingsRow";
import { SettingsSwitch } from "./SettingsSwitch";

type Props = {
  drawerOpen: boolean;
  onRequestClose: () => void;
};

export function UpdatesSettingsSection({ drawerOpen, onRequestClose }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { openWhatsNew } = useReleaseComms();
  const { checkForUpdatesNow, checkingForUpdates } = useAppUpdate();
  const [autoDetect, setAutoDetect] = useState(true);
  const [showChangelog, setShowChangelog] = useState(true);

  useEffect(() => {
    if (!drawerOpen) return;
    setAutoDetect(getAutoDetectUpdates());
    setShowChangelog(getShowChangelogOnUpdate());
  }, [drawerOpen]);

  useEffect(() => subscribeUpdatesPrefs(() => {
    setAutoDetect(getEffectiveUpdatesPrefs().autoDetectUpdates);
  }), []);

  const handleAutoDetectToggle = useCallback((next: boolean) => {
    setAutoDetect(next);
    setAutoDetectUpdates(next);
  }, []);

  const handleChangelogToggle = useCallback((next: boolean) => {
    setShowChangelog(next);
    setShowChangelogOnUpdate(next);
  }, []);

  const handleCheckNow = useCallback(async () => {
    const result = await checkForUpdatesNow();
    if (result.status === "unavailable") {
      toast({ message: t("settings.updates.checkUnavailable"), variant: "info" });
      return;
    }
    if (result.status === "offline") {
      toast({ message: t("settings.updates.checkOffline"), variant: "info" });
      return;
    }
    if (result.status === "found") {
      toast({ message: t("settings.updates.checkFound"), variant: "success" });
      return;
    }
    toast({ message: t("settings.updates.checkUpToDate"), variant: "success" });
  }, [checkForUpdatesNow, t, toast]);

  const handleViewWhatsNew = useCallback(() => {
    onRequestClose();
    openWhatsNew();
  }, [onRequestClose, openWhatsNew]);

  const handleResetWelcome = useCallback(() => {
    resetOnboarding();
    toast({ message: t("settings.updates.welcomeResetDone"), variant: "success" });
  }, [t, toast]);

  const actionButtonClass = cn(
    "rounded-lg border border-border bg-bg-elevated/50 px-3 py-2 text-xs font-medium text-text-secondary",
    "transition-colors hover:border-accent/25 hover:bg-bg-elevated hover:text-text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    "disabled:cursor-not-allowed disabled:opacity-50"
  );

  return (
    <SettingsSection title={t("settings.updates.section")}>
      <SettingsRow
        label={t("settings.updates.autoDetectLabel")}
        description={t("settings.updates.autoDetectHint")}
      >
        <SettingsSwitch
          checked={autoDetect}
          onChange={handleAutoDetectToggle}
          label={t("settings.updates.autoDetectLabel")}
        />
      </SettingsRow>
      <SettingsRow
        label={t("settings.updates.checkNowLabel")}
        description={t("settings.updates.checkNowHint")}
      >
        <button
          type="button"
          onClick={() => void handleCheckNow()}
          disabled={checkingForUpdates}
          className={actionButtonClass}
        >
          {checkingForUpdates
            ? t("settings.updates.checkNowRunning")
            : t("settings.updates.checkNowAction")}
        </button>
      </SettingsRow>
      <SettingsRow
        label={t("settings.updates.changelogLabel")}
        description={t("settings.updates.changelogHint")}
      >
        <SettingsSwitch
          checked={showChangelog}
          onChange={handleChangelogToggle}
          label={t("settings.updates.changelogLabel")}
        />
      </SettingsRow>
      <SettingsRow
        label={t("settings.updates.whatsNewLabel")}
        description={t("settings.updates.whatsNewHint")}
      >
        <button type="button" onClick={handleViewWhatsNew} className={actionButtonClass}>
          {t("settings.updates.whatsNewAction")}
        </button>
      </SettingsRow>
      <SettingsRow
        label={t("settings.updates.welcomeLabel")}
        description={t("settings.updates.welcomeHint")}
        bordered={false}
      >
        <button type="button" onClick={handleResetWelcome} className={actionButtonClass}>
          {t("settings.updates.welcomeAction")}
        </button>
      </SettingsRow>
    </SettingsSection>
  );
}
