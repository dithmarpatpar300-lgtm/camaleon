import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getEffectiveOfflinePrefs,
  markOfflinePrecacheComplete,
  resetOfflinePrefs,
  writeOfflinePrefs,
} from "./offline-prefs";
import { USER_SETTINGS_STORAGE_KEY } from "./user-settings";

const store: Record<string, string> = {};

function mockLocalStorage() {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
  });
}

describe("offline-prefs", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    mockLocalStorage();
  });

  it("defaults fullToolkitPrecache to false", () => {
    expect(getEffectiveOfflinePrefs().fullToolkitPrecache).toBe(false);
  });

  it("defaults wasmSyncEnabled to true", () => {
    expect(getEffectiveOfflinePrefs().wasmSyncEnabled).toBe(true);
  });

  it("persists full toolkit opt-in", () => {
    writeOfflinePrefs({ fullToolkitPrecache: true });
    expect(getEffectiveOfflinePrefs().fullToolkitPrecache).toBe(true);
    const raw = JSON.parse(store[USER_SETTINGS_STORAGE_KEY] ?? "{}");
    expect(raw.offline.fullToolkitPrecache).toBe(true);
  });

  it("persists wasmSyncEnabled toggle", () => {
    writeOfflinePrefs({ wasmSyncEnabled: false });
    expect(getEffectiveOfflinePrefs().wasmSyncEnabled).toBe(false);
  });

  it("markOfflinePrecacheComplete sets timestamp", () => {
    markOfflinePrecacheComplete();
    const prefs = getEffectiveOfflinePrefs();
    expect(prefs.fullToolkitPrecache).toBe(true);
    expect(prefs.precacheCompletedAt).toMatch(/^\d{4}-/);
  });

  it("resetOfflinePrefs clears offline block", () => {
    writeOfflinePrefs({ fullToolkitPrecache: true, wasmSyncEnabled: false });
    resetOfflinePrefs();
    expect(getEffectiveOfflinePrefs().fullToolkitPrecache).toBe(false);
    expect(getEffectiveOfflinePrefs().wasmSyncEnabled).toBe(true);
  });
});
