import type {
  BatchDefaultSelection,
  BatchDownloadMode,
  BatchUniversalPrefs,
  MixedFormatPolicy,
} from "./user-settings";
import { readUserSettings, writeUserSettings } from "./user-settings";

export type { BatchDefaultSelection, BatchDownloadMode, MixedFormatPolicy } from "./user-settings";

const listeners = new Set<() => void>();

export function subscribeBatchUniversalPrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyBatchUniversalPrefsListeners(): void {
  listeners.forEach((listener) => listener());
}

export function readBatchUniversalPrefs(): BatchUniversalPrefs {
  return readUserSettings().batchUniversal ?? {};
}

export function getEffectiveBatchUniversalPrefs(): Required<BatchUniversalPrefs> {
  const stored = readBatchUniversalPrefs();
  return {
    defaultSelection: stored.defaultSelection ?? "all",
    universalMultiDrop: stored.universalMultiDrop ?? true,
    mixedFormatPolicy: stored.mixedFormatPolicy ?? "picker",
    batchDownloadMode: stored.batchDownloadMode ?? "individual",
  };
}

export function getBatchDefaultSelection(): BatchDefaultSelection {
  return getEffectiveBatchUniversalPrefs().defaultSelection;
}

export function writeBatchUniversalPrefs(partial: Partial<BatchUniversalPrefs>): BatchUniversalPrefs {
  const next = { ...readBatchUniversalPrefs(), ...partial };
  writeUserSettings({ batchUniversal: next });
  notifyBatchUniversalPrefsListeners();
  return next;
}

export function setBatchDefaultSelection(value: BatchDefaultSelection): void {
  writeBatchUniversalPrefs({ defaultSelection: value });
}

export function setUniversalMultiDrop(value: boolean): void {
  writeBatchUniversalPrefs({ universalMultiDrop: value });
}

export function setMixedFormatPolicy(value: MixedFormatPolicy): void {
  writeBatchUniversalPrefs({ mixedFormatPolicy: value });
}

export function setBatchDownloadMode(value: BatchDownloadMode): void {
  writeBatchUniversalPrefs({ batchDownloadMode: value });
}

export function getBatchDownloadMode(): BatchDownloadMode {
  return getEffectiveBatchUniversalPrefs().batchDownloadMode;
}

export function resetBatchUniversalPrefs(): void {
  writeUserSettings({ batchUniversal: {} });
  notifyBatchUniversalPrefsListeners();
}
