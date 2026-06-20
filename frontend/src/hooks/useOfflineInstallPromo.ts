"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/providers/SettingsProvider";
import { useOffline } from "@/providers/OfflineProvider";
import {
  getEffectiveOfflinePrefs,
  subscribeOfflinePrefs,
} from "@/lib/prefs/offline-prefs";
import {
  isOfflinePromoSnoozed,
  isStandaloneDisplayMode,
} from "@/lib/offline/offline-promo-storage";

export function useOfflineInstallPromoVisible(): boolean {
  const pathname = usePathname();
  const { swSupported } = useOffline();
  const { settingsOpen } = useSettings();
  const [prefs, setPrefs] = useState(getEffectiveOfflinePrefs);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplayMode());
    return subscribeOfflinePrefs(() => setPrefs(getEffectiveOfflinePrefs()));
  }, []);

  if (pathname !== "/") return false;
  if (!swSupported || standalone || settingsOpen) return false;
  if (prefs.precacheCompletedAt) return false;
  if (isOfflinePromoSnoozed(prefs.installPromoSnoozedUntil)) return false;

  return true;
}
