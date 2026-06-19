import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBatchDefaultSelection,
  getEffectiveBatchUniversalPrefs,
  resetBatchUniversalPrefs,
  setBatchDefaultSelection,
} from "./batch-universal-prefs";
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

describe("batch-universal-prefs", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    mockLocalStorage();
  });

  it("defaults selection to all", () => {
    expect(getBatchDefaultSelection()).toBe("all");
    const prefs = getEffectiveBatchUniversalPrefs();
    expect(prefs.defaultSelection).toBe("all");
    expect(prefs.universalMultiDrop).toBe(true);
    expect(prefs.mixedFormatPolicy).toBe("picker");
    expect(prefs.batchDownloadMode).toBe("individual");
  });

  it("persists none selection", () => {
    setBatchDefaultSelection("none");
    expect(getBatchDefaultSelection()).toBe("none");
    const raw = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    expect(raw).toContain('"defaultSelection":"none"');
  });

  it("reset restores factory default", () => {
    setBatchDefaultSelection("none");
    resetBatchUniversalPrefs();
    expect(getBatchDefaultSelection()).toBe("all");
  });
});
