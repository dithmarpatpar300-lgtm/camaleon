import type { RgbColor } from "@/lib/tools/types";

export const USER_SETTINGS_STORAGE_KEY = "camaleon-user-settings-v1";

export type TransmutationDefaults = {
  jpegQuality?: number;
  pngCompression?: number;
  alphaBackground?: RgbColor;
  avifQuality?: number;
  avifSpeed?: number;
};

export type UserSettings = {
  /** When false, skip auto changelog modal on version bump; What's New remains available. */
  showChangelogOnUpdate: boolean;
  /** Global transmutation slider defaults (S2). Empty = use registry baselines. */
  transmutation?: TransmutationDefaults;
};

const DEFAULTS: UserSettings = {
  showChangelogOnUpdate: true,
};

function parseStored(raw: string | null): Partial<UserSettings> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function readUserSettings(): UserSettings {
  if (typeof localStorage === "undefined") return { ...DEFAULTS };
  const merged = { ...DEFAULTS, ...parseStored(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)) };
  return {
    showChangelogOnUpdate:
      typeof merged.showChangelogOnUpdate === "boolean"
        ? merged.showChangelogOnUpdate
        : DEFAULTS.showChangelogOnUpdate,
    transmutation: merged.transmutation,
  };
}

export function writeUserSettings(partial: Partial<UserSettings>): UserSettings {
  const next = { ...readUserSettings(), ...partial };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function getShowChangelogOnUpdate(): boolean {
  return readUserSettings().showChangelogOnUpdate;
}

export function setShowChangelogOnUpdate(value: boolean): void {
  writeUserSettings({ showChangelogOnUpdate: value });
}
