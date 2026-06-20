import {
  readLocalString,
  removeLocalKey,
  writeClientCookie,
} from "./client-storage";
import { ensureUserSettingsSeeded } from "./seed-storage";
import { COOKIE_MAX_AGE, COOKIE_NAMES, STORAGE_KEYS } from "./keys";
import {
  readUserSettings,
  writeUserSettings,
  type ToolBrowserPrefs,
} from "@/lib/prefs/user-settings";

export type { ToolBrowserPrefs };

export type ToolLane = "convert" | "optimize";
export type ToolBrowserDensity = NonNullable<ToolBrowserPrefs["density"]>;

const DEFAULTS: Required<ToolBrowserPrefs> = {
  lane: "convert",
  tab: "all",
  density: "compact",
};

function parseLane(raw: string | null | undefined): ToolLane | null {
  return raw === "convert" || raw === "optimize" ? raw : null;
}

function parseDensity(raw: string | null | undefined): ToolBrowserDensity | null {
  return raw === "compact" || raw === "detailed" ? raw : null;
}

function parseTab(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  return raw;
}

/** Read legacy scattered keys and fold into user-settings.tools (idempotent). */
export function migrateToolBrowserPrefs(): ToolBrowserPrefs {
  const legacyLane = parseLane(readLocalString(STORAGE_KEYS.TOOL_LANE_LEGACY));
  const legacyTab = parseTab(readLocalString(STORAGE_KEYS.TOOL_TAB_LEGACY));
  const legacyDensity = parseDensity(readLocalString(STORAGE_KEYS.TOOL_DENSITY_LEGACY));

  if (legacyLane || legacyTab || legacyDensity) {
    const current = readUserSettings();
    writeUserSettings({
      tools: {
        ...current.tools,
        ...(legacyLane ? { lane: legacyLane } : {}),
        ...(legacyTab ? { tab: legacyTab } : {}),
        ...(legacyDensity ? { density: legacyDensity } : {}),
      },
    });
  }

  if (legacyLane !== null) removeLocalKey(STORAGE_KEYS.TOOL_LANE_LEGACY);
  if (legacyTab !== null) removeLocalKey(STORAGE_KEYS.TOOL_TAB_LEGACY);
  if (legacyDensity !== null) removeLocalKey(STORAGE_KEYS.TOOL_DENSITY_LEGACY);

  const seeded = ensureUserSettingsSeeded();
  return seeded.tools ?? DEFAULTS;
}

export function readToolBrowserPrefs(): ToolBrowserPrefs {
  if (typeof localStorage === "undefined") {
    return { ...DEFAULTS };
  }
  return migrateToolBrowserPrefs();
}

export function writeToolBrowserPrefs(partial: Partial<ToolBrowserPrefs>): ToolBrowserPrefs {
  const next: ToolBrowserPrefs = { ...readToolBrowserPrefs(), ...partial };
  writeUserSettings({ tools: next });
  syncToolBrowserCookies(next);
  return next;
}

export function syncToolBrowserCookies(prefs: ToolBrowserPrefs): void {
  const lane = prefs.lane ?? DEFAULTS.lane;
  const tab = prefs.tab ?? DEFAULTS.tab;
  const density = prefs.density ?? DEFAULTS.density;
  writeClientCookie(COOKIE_NAMES.TOOL_LANE, lane, COOKIE_MAX_AGE);
  writeClientCookie(COOKIE_NAMES.TOOL_TAB, tab, COOKIE_MAX_AGE);
  writeClientCookie(COOKIE_NAMES.TOOL_DENSITY, density, COOKIE_MAX_AGE);
}

/** SSR: resolve lane from cookie (set by bootstrap or writeToolBrowserPrefs). */
export function resolveToolLaneFromCookie(value: string | undefined): ToolLane {
  const lane = parseLane(value ? decodeURIComponent(value) : null);
  return lane ?? DEFAULTS.lane;
}

export function resolveToolTabFromCookie(value: string | undefined): string {
  return parseTab(value ? decodeURIComponent(value) : null) ?? DEFAULTS.tab;
}

export function resolveToolDensityFromCookie(
  value: string | undefined
): ToolBrowserDensity {
  return parseDensity(value ? decodeURIComponent(value) : null) ?? DEFAULTS.density;
}

/** Inner body for PREFERENCES_BOOTSTRAP_SCRIPT (runs inside existing try). */
export function buildToolBrowserBootstrapBody(): string {
  const { USER_SETTINGS, TOOL_LANE_LEGACY, TOOL_TAB_LEGACY, TOOL_DENSITY_LEGACY } =
    STORAGE_KEYS;
  const { TOOL_LANE, TOOL_TAB, TOOL_DENSITY } = COOKIE_NAMES;

  return `
    var lane = localStorage.getItem('${TOOL_LANE_LEGACY}');
    var tab = localStorage.getItem('${TOOL_TAB_LEGACY}');
    var density = localStorage.getItem('${TOOL_DENSITY_LEGACY}');
    try {
      var settings = JSON.parse(localStorage.getItem('${USER_SETTINGS}') || '{}');
      if (settings && settings.tools) {
        if (!lane && settings.tools.lane) lane = settings.tools.lane;
        if (!tab && settings.tools.tab) tab = settings.tools.tab;
        if (!density && settings.tools.density) density = settings.tools.density;
      }
    } catch (e) {}
    if (lane !== 'convert' && lane !== 'optimize') lane = 'convert';
    if (!tab) tab = 'all';
    if (density !== 'compact' && density !== 'detailed') density = 'compact';
    root.dataset.toolLane = lane;
    root.dataset.toolTab = tab;
    root.dataset.toolDensity = density;
    document.cookie = '${TOOL_LANE}=' + lane + '; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax';
    document.cookie = '${TOOL_TAB}=' + encodeURIComponent(tab) + '; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax';
    document.cookie = '${TOOL_DENSITY}=' + density + '; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax';
  `.trim();
}

/** Standalone blocking bootstrap script. */
export function buildToolBrowserBootstrapScript(): string {
  return `(function(){try{var root=document.documentElement;${buildToolBrowserBootstrapBody()}}catch(e){}})();`;
}

/** @deprecated Use readToolBrowserPrefs().lane */
export function readStoredLane(): ToolLane | null {
  const lane = readToolBrowserPrefs().lane;
  return lane ?? null;
}

/** @deprecated Use writeToolBrowserPrefs({ lane }) */
export function writeStoredLane(lane: ToolLane): void {
  writeToolBrowserPrefs({ lane });
}

export function getToolBrowserDefaults(): Required<ToolBrowserPrefs> {
  return { ...DEFAULTS };
}
