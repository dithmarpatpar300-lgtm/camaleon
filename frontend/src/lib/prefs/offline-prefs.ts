import type { OfflinePrefs } from "./user-settings";
import { readUserSettings, writeUserSettings } from "./user-settings";

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
  Pick<OfflinePrefs, "fullToolkitPrecache" | "dismissedMobileWarning">
> &
  Pick<OfflinePrefs, "precacheCompletedAt" | "installPromoSnoozedUntil"> {
  const stored = readOfflinePrefs();
  return {
    fullToolkitPrecache: stored.fullToolkitPrecache ?? false,
    dismissedMobileWarning: stored.dismissedMobileWarning ?? false,
    precacheCompletedAt: stored.precacheCompletedAt,
    installPromoSnoozedUntil: stored.installPromoSnoozedUntil,
  };
}

export function writeOfflinePrefs(partial: Partial<OfflinePrefs>): OfflinePrefs {
  const next = { ...readOfflinePrefs(), ...partial };
  writeUserSettings({ offline: next });
  notifyOfflinePrefsListeners();
  return next;
}

export function resetOfflinePrefs(): void {
  writeUserSettings({ offline: {} });
  notifyOfflinePrefsListeners();
}

export function markOfflinePrecacheComplete(): void {
  writeOfflinePrefs({
    fullToolkitPrecache: true,
    precacheCompletedAt: new Date().toISOString(),
  });
}
