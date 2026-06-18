import type { UpdatesPrefs } from "./user-settings";
import { readUserSettings, writeUserSettings } from "./user-settings";

const listeners = new Set<() => void>();

export function subscribeUpdatesPrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyUpdatesPrefsListeners(): void {
  listeners.forEach((listener) => listener());
}

export function readUpdatesPrefs(): UpdatesPrefs {
  return readUserSettings().updates ?? {};
}

export function getEffectiveUpdatesPrefs(): Required<UpdatesPrefs> {
  const stored = readUpdatesPrefs();
  return {
    autoDetectUpdates: stored.autoDetectUpdates ?? true,
  };
}

export function getAutoDetectUpdates(): boolean {
  return getEffectiveUpdatesPrefs().autoDetectUpdates;
}

export function writeUpdatesPrefs(partial: Partial<UpdatesPrefs>): UpdatesPrefs {
  const next = { ...readUpdatesPrefs(), ...partial };
  writeUserSettings({ updates: next });
  notifyUpdatesPrefsListeners();
  return next;
}

export function setAutoDetectUpdates(value: boolean): void {
  writeUpdatesPrefs({ autoDetectUpdates: value });
}

export function resetUpdatesPrefs(): void {
  writeUserSettings({ updates: {} });
  notifyUpdatesPrefsListeners();
}
