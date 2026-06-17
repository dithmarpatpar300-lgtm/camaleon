import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  filterNoticesForDensity,
  getEffectiveNoticesPrefs,
  writeNoticesPrefs,
  resetNoticesPrefs,
  getPrepareProgressStylePref,
  setPrepareProgressStylePref,
} from "./notices-prefs";
import { USER_SETTINGS_STORAGE_KEY } from "./user-settings";
import type { Notice } from "@/lib/notices/types";

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

const sampleNotices: Notice[] = [
  {
    id: "info-one",
    severity: "info",
    messageKey: "notices.limit.outputSize",
    priority: 40,
  },
  {
    id: "warn-one",
    severity: "warn",
    messageKey: "notices.performance.L2",
    priority: 60,
  },
  {
    id: "status-one",
    severity: "status",
    messageKey: "notices.estimate.cheapSlow",
    priority: 30,
  },
];

describe("notices prefs", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    mockLocalStorage();
    localStorage.removeItem(USER_SETTINGS_STORAGE_KEY);
    localStorage.removeItem("camaleon:prepareProgressStyle");
    resetNoticesPrefs();
  });

  it("defaults to normal density and ring progress", () => {
    expect(getEffectiveNoticesPrefs()).toEqual({
      railDensity: "normal",
      prepareProgressStyle: "ring",
    });
  });

  it("persists rail density to user settings", () => {
    writeNoticesPrefs({ railDensity: "minimal" });
    const raw = JSON.parse(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)!);
    expect(raw.notices.railDensity).toBe("minimal");
  });

  it("filters info notices in minimal density", () => {
    const filtered = filterNoticesForDensity(sampleNotices, "minimal");
    expect(filtered.map((n) => n.id)).toEqual(["warn-one", "status-one"]);
  });

  it("keeps all severities in normal density", () => {
    expect(filterNoticesForDensity(sampleNotices, "normal")).toHaveLength(3);
  });

  it("migrates legacy prepare progress key", () => {
    localStorage.setItem("camaleon:prepareProgressStyle", "bar");
    expect(getPrepareProgressStylePref()).toBe("bar");
    expect(localStorage.getItem("camaleon:prepareProgressStyle")).toBeNull();
    const raw = JSON.parse(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)!);
    expect(raw.notices.prepareProgressStyle).toBe("bar");
  });

  it("setPrepareProgressStylePref notifies via user settings", () => {
    setPrepareProgressStylePref("bar");
    expect(getPrepareProgressStylePref()).toBe("bar");
  });
});
