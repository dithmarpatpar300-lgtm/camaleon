"use client";

import { useEffect, useMemo, useState } from "react";
import { computeResourceProfile, type ResourceProfile, type ResourceSignals } from "@/lib/device/resource-profile";
import {
  applyPerformancePrefs,
  readPerformancePrefs,
  subscribePerformancePrefs,
} from "@/lib/prefs/performance-prefs";

type NavConnection = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener: (type: string, fn: () => void) => void;
  removeEventListener: (type: string, fn: () => void) => void;
};

export function useAdaptiveResourceProfile(fileSize: number): ResourceProfile {
  const [signals, setSignals] = useState<ResourceSignals>({});
  const [prefsRevision, setPrefsRevision] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const read = (): ResourceSignals => ({
      deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      effectiveType: (navigator as { connection?: NavConnection }).connection?.effectiveType,
      saveData: (navigator as { connection?: NavConnection }).connection?.saveData,
      visibilityState: document.visibilityState as DocumentVisibilityState,
    });

    setSignals(read());

    const onConnectionChange = () => setSignals(read());
    const onVisibilityChange = () => setSignals(read());

    const conn = (navigator as { connection?: NavConnection }).connection;
    conn?.addEventListener("change", onConnectionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      conn?.removeEventListener("change", onConnectionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => subscribePerformancePrefs(() => setPrefsRevision((v) => v + 1)), []);

  return useMemo(() => {
    const base = computeResourceProfile(fileSize, signals);
    return applyPerformancePrefs(base, readPerformancePrefs(), fileSize);
  }, [fileSize, signals, prefsRevision]);
}
