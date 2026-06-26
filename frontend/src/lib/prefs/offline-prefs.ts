import type { OfflinePrefs } from "./user-settings";
import { readUserSettings, writeUserSettings } from "./user-settings";
import { buildFactoryUserSettings } from "@/lib/storage/factory-defaults";

const listeners = new Set<() => void>();

export function subscribeOfflinePrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyOfflinePrefsListeners(): void {
  listeners.forEach((listener) => listener());
}

export function readOfflinePrefs(): OfflinePrefs {
  return readUserSettings().offline ?? {};
}

export function getEffectiveOfflinePrefs(): Required<
  Pick<OfflinePrefs, "fullToolkitPrecache" | "dismissedMobileWarning" | "wasmSyncEnabled">
> &
  Pick<OfflinePrefs, "precacheCompletedAt" | "installPromoSnoozedUntil" | "lastKnownWasmBuildId" | "lastWasmSyncAt"> {
  const stored = readOfflinePrefs();
  return {
    fullToolkitPrecache: stored.fullToolkitPrecache ?? false,
    dismissedMobileWarning: stored.dismissedMobileWarning ?? false,
    wasmSyncEnabled: stored.wasmSyncEnabled ?? true,
    precacheCompletedAt: stored.precacheCompletedAt,
    installPromoSnoozedUntil: stored.installPromoSnoozedUntil,
    lastKnownWasmBuildId: stored.lastKnownWasmBuildId,
    lastWasmSyncAt: stored.lastWasmSyncAt,
  };
}

export function writeOfflinePrefs(partial: Partial<OfflinePrefs>): OfflinePrefs {
  const next = { ...readOfflinePrefs(), ...partial };
  writeUserSettings({ offline: next });
  notifyOfflinePrefsListeners();
  return next;
}

export function resetOfflinePrefs(): void {
  const factory = buildFactoryUserSettings().offline!;
  writeUserSettings({
    offline: {
      fullToolkitPrecache: factory.fullToolkitPrecache,
      dismissedMobileWarning: factory.dismissedMobileWarning,
      wasmSyncEnabled: factory.wasmSyncEnabled,
    },
  });
  notifyOfflinePrefsListeners();
}

export function markOfflinePrecacheComplete(): void {
  writeOfflinePrefs({
    fullToolkitPrecache: true,
    precacheCompletedAt: new Date().toISOString(),
  });
}
