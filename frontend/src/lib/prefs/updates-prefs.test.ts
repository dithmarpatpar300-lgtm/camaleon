import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  getAutoDetectUpdates,
  getEffectiveUpdatesPrefs,
  resetUpdatesPrefs,
  setAutoDetectUpdates,
  writeUpdatesPrefs,
} from "./updates-prefs";
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

describe("updates-prefs", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    mockLocalStorage();
  });

  it("defaults autoDetectUpdates to true", () => {
    expect(getAutoDetectUpdates()).toBe(true);
    expect(getEffectiveUpdatesPrefs().autoDetectUpdates).toBe(true);
  });

  it("persists autoDetectUpdates in user settings", () => {
    setAutoDetectUpdates(false);
    expect(getAutoDetectUpdates()).toBe(false);

    const raw = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { updates?: { autoDetectUpdates?: boolean } };
    expect(parsed.updates?.autoDetectUpdates).toBe(false);
  });

  it("reset restores default", () => {
    writeUpdatesPrefs({ autoDetectUpdates: false });
    resetUpdatesPrefs();
    expect(getAutoDetectUpdates()).toBe(true);
  });
});
