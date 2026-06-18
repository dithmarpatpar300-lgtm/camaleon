import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  readForceOffline,
  writeForceOffline,
  readEffectiveOnline,
  FORCE_OFFLINE_SESSION_KEY,
} from "./force-offline";

const store: Record<string, string> = {};

function mockSessionStorage() {
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  });
}

describe("force-offline", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    mockSessionStorage();
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to not forced", () => {
    expect(readForceOffline()).toBe(false);
    expect(readEffectiveOnline(true)).toBe(true);
  });

  it("writeForceOffline persists in sessionStorage", () => {
    writeForceOffline(true);
    expect(store[FORCE_OFFLINE_SESSION_KEY]).toBe("1");
    expect(readForceOffline()).toBe(true);
    expect(readEffectiveOnline(true)).toBe(false);
  });

  it("clearing force offline restores effective online", () => {
    writeForceOffline(true);
    writeForceOffline(false);
    expect(readForceOffline()).toBe(false);
    expect(readEffectiveOnline(true)).toBe(true);
  });
});
