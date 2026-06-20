import { describe, expect, it, beforeEach, vi } from "vitest";
import { USER_SETTINGS_STORAGE_KEY } from "@/lib/prefs/user-settings";
import { STORAGE_KEYS } from "./keys";
import { buildFactoryUserSettings } from "./factory-defaults";
import { ensureClientStorageSeeded, ensureUserSettingsSeeded } from "./seed-storage";

const store: Record<string, string> = {};
let cookieJar = "";

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

function mockDocumentCookie() {
  vi.stubGlobal("document", { cookie: "" });
  Object.defineProperty(globalThis.document, "cookie", {
    configurable: true,
    get: () => cookieJar,
    set: (value: string) => {
      cookieJar = cookieJar ? `${cookieJar}; ${value}` : value;
    },
  });
}

function mockMatchMedia(light: boolean) {
  vi.stubGlobal("window", {
    matchMedia: (query: string) => ({
      matches: query.includes("light") ? light : false,
    }),
  });
}

describe("seed-storage", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    cookieJar = "";
    mockLocalStorage();
    mockDocumentCookie();
    mockMatchMedia(false);
  });

  it("writes full factory user settings when storage is empty", () => {
    ensureUserSettingsSeeded();

    const raw = JSON.parse(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)!);
    expect(raw).toEqual(buildFactoryUserSettings());
  });

  it("fills missing sections without overwriting user overrides", () => {
    localStorage.setItem(
      USER_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        performance: { tier: "aggressive" },
      })
    );

    ensureUserSettingsSeeded();

    const raw = JSON.parse(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)!);
    expect(raw.performance.tier).toBe("aggressive");
    expect(raw.batchUniversal.defaultSelection).toBe("all");
    expect(raw.tools.lane).toBe("convert");
    expect(raw.transmutation.jpegQuality).toBe(85);
  });

  it("seeds theme and locale when absent", () => {
    ensureClientStorageSeeded();

    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEYS.LOCALE)).toBe("es");
  });

  it("is idempotent on second run", () => {
    ensureUserSettingsSeeded();
    const first = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    ensureUserSettingsSeeded();
    expect(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)).toBe(first);
  });
});
