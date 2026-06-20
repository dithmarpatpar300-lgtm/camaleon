import { describe, expect, it, beforeEach, vi } from "vitest";
import { USER_SETTINGS_STORAGE_KEY } from "@/lib/prefs/user-settings";
import { COOKIE_NAMES, STORAGE_KEYS } from "./keys";
import {
  migrateToolBrowserPrefs,
  readToolBrowserPrefs,
  resolveToolLaneFromCookie,
  writeToolBrowserPrefs,
} from "./tool-browser-prefs";

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
  vi.stubGlobal("document", {
    cookie: "",
  });
  Object.defineProperty(globalThis.document, "cookie", {
    configurable: true,
    get: () => cookieJar,
    set: (value: string) => {
      cookieJar = cookieJar ? `${cookieJar}; ${value}` : value;
    },
  });
}

describe("tool-browser-prefs", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    cookieJar = "";
    mockLocalStorage();
    mockDocumentCookie();
  });

  it("migrates legacy lane/tab/density keys into user-settings.tools", () => {
    localStorage.setItem(STORAGE_KEYS.TOOL_LANE_LEGACY, "optimize");
    localStorage.setItem(STORAGE_KEYS.TOOL_TAB_LEGACY, "avif");
    localStorage.setItem(STORAGE_KEYS.TOOL_DENSITY_LEGACY, "detailed");

    const prefs = migrateToolBrowserPrefs();

    expect(prefs).toEqual({
      lane: "optimize",
      tab: "avif",
      density: "detailed",
    });
    expect(localStorage.getItem(STORAGE_KEYS.TOOL_LANE_LEGACY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.TOOL_TAB_LEGACY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.TOOL_DENSITY_LEGACY)).toBeNull();

    const stored = JSON.parse(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)!);
    expect(stored.tools).toEqual(prefs);
  });

  it("writes lane and mirrors cookie", () => {
    writeToolBrowserPrefs({ lane: "optimize", tab: "all", density: "compact" });

    expect(readToolBrowserPrefs()).toMatchObject({ lane: "optimize" });
    expect(document.cookie).toContain(`${COOKIE_NAMES.TOOL_LANE}=optimize`);
  });

  it("resolves lane from cookie for SSR", () => {
    expect(resolveToolLaneFromCookie("optimize")).toBe("optimize");
    expect(resolveToolLaneFromCookie(undefined)).toBe("convert");
    expect(resolveToolLaneFromCookie("invalid")).toBe("convert");
  });
});
