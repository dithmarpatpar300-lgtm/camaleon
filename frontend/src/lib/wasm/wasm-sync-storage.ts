import type { OfflinePrefs } from "@/lib/prefs/user-settings";
import { readUserSettings, writeUserSettings } from "@/lib/prefs/user-settings";

const WASM_SYNC_BUILD_ID_KEY = "camaleon-wasm-sync-build-id";
const WASM_SYNC_AT_KEY = "camaleon-wasm-sync-at";

export function getLastKnownWasmBuildId(): string | null {
  if (typeof localStorage === "undefined") return null;
  const fromPrefs = readUserSettings().offline?.lastKnownWasmBuildId;
  if (fromPrefs) return fromPrefs;
  return localStorage.getItem(WASM_SYNC_BUILD_ID_KEY);
}

export function getLastWasmSyncAt(): string | null {
  if (typeof localStorage === "undefined") return null;
  const fromPrefs = readUserSettings().offline?.lastWasmSyncAt;
  if (fromPrefs) return fromPrefs;
  return localStorage.getItem(WASM_SYNC_AT_KEY);
}

export function setWasmSyncBuildId(buildId: string): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(WASM_SYNC_BUILD_ID_KEY, buildId);
    localStorage.setItem(WASM_SYNC_AT_KEY, new Date().toISOString());
  }
  const offline = readUserSettings().offline ?? {};
  const next: OfflinePrefs = {
    ...offline,
    lastKnownWasmBuildId: buildId,
    lastWasmSyncAt: new Date().toISOString(),
  };
  writeUserSettings({ offline: next });
}

export function getWasmSyncEnabled(): boolean {
  return readUserSettings().offline?.wasmSyncEnabled ?? true;
}
