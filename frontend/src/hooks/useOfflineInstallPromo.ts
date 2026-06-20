"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/providers/SettingsProvider";
import { useOffline } from "@/providers/OfflineProvider";
import {
  getEffectiveOfflinePrefs,
  subscribeOfflinePrefs,
} from "@/lib/prefs/offline-prefs";
import { isWasmReady } from "@/lib/offline/cache-status";
import {
  isOfflinePromoSnoozed,
  isStandaloneDisplayMode,
} from "@/lib/offline/offline-promo-storage";
import { isShellReady } from "@/lib/offline/shell-cache-status";

export function useOfflineInstallPromoVisible(): boolean {
  const pathname = usePathname();
  const { swSupported } = useOffline();
  const { settingsOpen } = useSettings();
  const [prefs, setPrefs] = useState(getEffectiveOfflinePrefs);
  const [standalone, setStandalone] = useState(false);
  const [dualReady, setDualReady] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplayMode());
    return subscribeOfflinePrefs(() => setPrefs(getEffectiveOfflinePrefs()));
  }, []);

  useEffect(() => {
    void Promise.all([isShellReady(), isWasmReady()]).then(([shell, wasm]) => {
      setDualReady(shell && wasm);
    });
  }, [prefs.precacheCompletedAt]);

  if (pathname !== "/") return false;
  if (!swSupported || standalone || settingsOpen) return false;
  if (dualReady || prefs.precacheCompletedAt) return false;
  if (isOfflinePromoSnoozed(prefs.installPromoSnoozedUntil)) return false;

  return true;
}
