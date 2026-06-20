"use client";

import { useEffect, useState } from "react";
import {
  getBatchDownloadMode,
  subscribeBatchUniversalPrefs,
  type BatchDownloadMode,
} from "@/lib/prefs/batch-universal-prefs";

/** Reactive batch download mode for batch / universal multi-file workspaces. */
export function useBatchDownloadMode(): BatchDownloadMode {
  const [mode, setMode] = useState<BatchDownloadMode>(() => getBatchDownloadMode());

  useEffect(() => subscribeBatchUniversalPrefs(() => setMode(getBatchDownloadMode())), []);

  return mode;
}
