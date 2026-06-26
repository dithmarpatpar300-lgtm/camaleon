import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getLastKnownWasmBuildId,
  getLastWasmSyncAt,
  setWasmSyncBuildId,
  getWasmSyncEnabled,
} from "./wasm-sync-storage";
import { USER_SETTINGS_STORAGE_KEY } from "@/lib/prefs/user-settings";

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

describe("wasm-sync-storage", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    mockLocalStorage();
  });

  it("returns null when no buildId stored", () => {
    expect(getLastKnownWasmBuildId()).toBeNull();
  });

  it("stores and retrieves buildId", () => {
    setWasmSyncBuildId("abc12345");
    expect(getLastKnownWasmBuildId()).toBe("abc12345");
  });

  it("stores and retrieves sync timestamp", () => {
    setWasmSyncBuildId("abc12345");
    const ts = getLastWasmSyncAt();
    expect(ts).not.toBeNull();
    expect(ts).toMatch(/^\d{4}-/);
  });

  it("writes buildId to user-settings offline block", () => {
    setWasmSyncBuildId("deadbeef");
    const raw = JSON.parse(store[USER_SETTINGS_STORAGE_KEY] ?? "{}");
    expect(raw.offline.lastKnownWasmBuildId).toBe("deadbeef");
    expect(raw.offline.lastWasmSyncAt).toMatch(/^\d{4}-/);
  });

  it("defaults wasmSyncEnabled to true", () => {
    expect(getWasmSyncEnabled()).toBe(true);
  });

  it("respects wasmSyncEnabled from user-settings", () => {
    store[USER_SETTINGS_STORAGE_KEY] = JSON.stringify({
      offline: { wasmSyncEnabled: false },
    });
    expect(getWasmSyncEnabled()).toBe(false);
  });
});
