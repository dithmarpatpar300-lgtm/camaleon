import { DEFAULT_LOCALE } from "@/lib/i18n";
import type { UserSettings } from "@/lib/prefs/user-settings";
import { USER_SETTINGS_STORAGE_KEY } from "@/lib/prefs/user-settings";
import { readLocalString, writeClientCookie, writeLocalString } from "./client-storage";
import {
  buildFactoryUserSettings,
  getFactoryUserSettingsJson,
  mergeUserSettingsWithFactory,
} from "./factory-defaults";
import { COOKIE_MAX_AGE, COOKIE_NAMES, STORAGE_KEYS } from "./keys";

function parseStoredUserSettings(raw: string | null): Partial<UserSettings> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function syncToolBrowserCookiesFromSettings(tools: UserSettings["tools"]): void {
  const factory = buildFactoryUserSettings().tools!;
  const lane = tools?.lane ?? factory.lane!;
  const tab = tools?.tab ?? factory.tab!;
  const density = tools?.density ?? factory.density!;
  writeClientCookie(COOKIE_NAMES.TOOL_LANE, lane, COOKIE_MAX_AGE);
  writeClientCookie(COOKIE_NAMES.TOOL_TAB, tab, COOKIE_MAX_AGE);
  writeClientCookie(COOKIE_NAMES.TOOL_DENSITY, density, COOKIE_MAX_AGE);
}

/** Persist factory defaults for any missing preference sections/keys. Idempotent. */
export function ensureUserSettingsSeeded(): UserSettings {
  const raw = readLocalString(USER_SETTINGS_STORAGE_KEY);
  const stored = parseStoredUserSettings(raw);
  const next = mergeUserSettingsWithFactory(stored);
  const serialized = JSON.stringify(next);

  if (raw !== serialized) {
    writeLocalString(USER_SETTINGS_STORAGE_KEY, serialized);
  }

  syncToolBrowserCookiesFromSettings(next.tools);
  return next;
}

/** Seed theme + locale when absent (bootstrap-only helpers also persist these). */
export function ensureThemeAndLocaleSeeded(): void {
  if (!readLocalString(STORAGE_KEYS.THEME) && typeof window !== "undefined") {
    const theme = window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
    writeLocalString(STORAGE_KEYS.THEME, theme);
    document.cookie = `${COOKIE_NAMES.THEME}=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }

  if (!readLocalString(STORAGE_KEYS.LOCALE)) {
    writeLocalString(STORAGE_KEYS.LOCALE, DEFAULT_LOCALE);
    document.cookie = `${COOKIE_NAMES.LOCALE}=${DEFAULT_LOCALE}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }
}

/** Full client storage bootstrap — user settings, theme, locale. */
export function ensureClientStorageSeeded(): UserSettings {
  ensureThemeAndLocaleSeeded();
  return ensureUserSettingsSeeded();
}

/** Inline JS for PREFERENCES_BOOTSTRAP_SCRIPT — runs before first paint. */
export function buildStorageSeedBody(): string {
  const factoryJson = getFactoryUserSettingsJson();

  return `
    (function seedCamaleonStorage() {
      var settingsKey = '${USER_SETTINGS_STORAGE_KEY}';
      var factory = ${factoryJson};
      var stored = {};
      try {
        stored = JSON.parse(localStorage.getItem(settingsKey) || '{}');
        if (typeof stored !== 'object' || stored === null) stored = {};
      } catch (e) {
        stored = {};
      }
      function mergeSection(def, src) {
        var out = {};
        var k;
        for (k in def) {
          if (Object.prototype.hasOwnProperty.call(def, k)) out[k] = def[k];
        }
        if (src && typeof src === 'object') {
          for (k in src) {
            if (Object.prototype.hasOwnProperty.call(src, k) && src[k] !== undefined) {
              out[k] = src[k];
            }
          }
        }
        return out;
      }
      var riskEnabled = typeof stored.riskMode === 'object' && stored.riskMode && typeof stored.riskMode.enabled === 'boolean'
        ? stored.riskMode.enabled
        : factory.riskMode.enabled;
      var seeded = {
        showChangelogOnUpdate: typeof stored.showChangelogOnUpdate === 'boolean'
          ? stored.showChangelogOnUpdate
          : factory.showChangelogOnUpdate,
        transmutation: mergeSection(factory.transmutation, stored.transmutation),
        performance: mergeSection(factory.performance, stored.performance),
        notices: mergeSection(factory.notices, stored.notices),
        riskMode: {
          enabled: riskEnabled,
          acknowledgedAt: riskEnabled && stored.riskMode && typeof stored.riskMode.acknowledgedAt === 'string'
            ? stored.riskMode.acknowledgedAt
            : undefined
        },
        offline: mergeSection(factory.offline, stored.offline),
        updates: mergeSection(factory.updates, stored.updates),
        batchUniversal: mergeSection(factory.batchUniversal, stored.batchUniversal),
        tools: mergeSection(factory.tools, stored.tools)
      };
      if (seeded.offline && seeded.offline.precacheCompletedAt === undefined && stored.offline && stored.offline.precacheCompletedAt) {
        seeded.offline.precacheCompletedAt = stored.offline.precacheCompletedAt;
      }
      if (seeded.offline && seeded.offline.installPromoSnoozedUntil === undefined && stored.offline && stored.offline.installPromoSnoozedUntil) {
        seeded.offline.installPromoSnoozedUntil = stored.offline.installPromoSnoozedUntil;
      }
      var serialized = JSON.stringify(seeded);
      if (localStorage.getItem(settingsKey) !== serialized) {
        localStorage.setItem(settingsKey, serialized);
      }
    })();
  `.trim();
}
