import type { RgbColor } from "@/lib/tools/types";

export const USER_SETTINGS_STORAGE_KEY = "camaleon-user-settings-v1";

export type TransmutationDefaults = {
  jpegQuality?: number;
  pngCompression?: number;
  alphaBackground?: RgbColor;
  avifQuality?: number;
  avifSpeed?: number;
};

export type PerformanceTierMode = "auto" | "conservative" | "balanced" | "aggressive";
export type PerformanceToggleMode = "auto" | "on" | "off";

export type PerformancePrefs = {
  /** Override adaptive tier detection. */
  tier?: PerformanceTierMode;
  /** Result cache for slider re-encode paths. */
  resultCache?: PerformanceToggleMode;
  /** Auto-run size estimate when options change. */
  autoEstimate?: PerformanceToggleMode;
};

export type NoticeRailDensity = "normal" | "minimal";
export type PrepareProgressStylePref = "ring" | "bar";

export type NoticesPrefs = {
  /** Hide informational notices in the staged workspace rail. */
  railDensity?: NoticeRailDensity;
  /** Prepare gate progress indicator style. */
  prepareProgressStyle?: PrepareProgressStylePref;
};

export type RiskModePrefs = {
  enabled: boolean;
  /** ISO timestamp when user last enabled Risk mode. */
  acknowledgedAt?: string;
};

export type OfflinePrefs = {
  /** Opt-in precache of all Wasm conversion engines (Settings S5). */
  fullToolkitPrecache?: boolean;
  /** ISO timestamp when full toolkit precache last completed. */
  precacheCompletedAt?: string;
  /** User dismissed mobile storage warning for offline toolkit. */
  dismissedMobileWarning?: boolean;
};

export type UpdatesPrefs = {
  /** Poll service worker + /version.json for live releases. Default true. */
  autoDetectUpdates?: boolean;
};

export type BatchDefaultSelection = "all" | "none";

export type MixedFormatPolicy = "hint" | "picker";

/** How batch results are delivered after a successful run. */
export type BatchDownloadMode = "individual" | "zip";

export type BatchUniversalPrefs = {
  /** Initial checkbox state when a batch workspace loads. Default all. */
  defaultSelection?: BatchDefaultSelection;
  /** Allow multi-file drops on the universal transmutator. Default true. */
  universalMultiDrop?: boolean;
  /** Mixed-format drops: hint toast only vs cohort picker. Default picker. */
  mixedFormatPolicy?: MixedFormatPolicy;
  /** Per-file downloads vs one ZIP archive. Default individual. */
  batchDownloadMode?: BatchDownloadMode;
};

export type UserSettings = {
  /** When false, skip auto changelog modal on version bump; What's New remains available. */
  showChangelogOnUpdate: boolean;
  /** Global transmutation slider defaults (S2). Empty = use registry baselines. */
  transmutation?: TransmutationDefaults;
  /** Performance overrides (S3). Empty = fully adaptive. */
  performance?: PerformancePrefs;
  /** Notice rail and prepare UI prefs (S4). */
  notices?: NoticesPrefs;
  /** Advanced / Risk mode (S6) — bypass Camaleon safety limits. */
  riskMode?: RiskModePrefs;
  /** Offline / cache prefs (S5). */
  offline?: OfflinePrefs;
  /** App update detection prefs. */
  updates?: UpdatesPrefs;
  /** Batch & Universal transmutator prefs (S7). */
  batchUniversal?: BatchUniversalPrefs;
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
    performance: merged.performance,
    notices: merged.notices,
    riskMode:
      merged.riskMode && typeof merged.riskMode.enabled === "boolean"
        ? {
            enabled: merged.riskMode.enabled,
            acknowledgedAt:
              typeof merged.riskMode.acknowledgedAt === "string"
                ? merged.riskMode.acknowledgedAt
                : undefined,
          }
        : { enabled: false },
    offline: merged.offline,
    updates: merged.updates,
    batchUniversal: merged.batchUniversal,
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
