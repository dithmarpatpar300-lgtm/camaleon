/** Canonical localStorage keys — single registry for client persistence. */
export const STORAGE_KEYS = {
  USER_SETTINGS: "camaleon-user-settings-v1",
  THEME: "camaleon-theme",
  LOCALE: "camaleon-locale",
  /** @deprecated Migrated into user-settings.tools — removed on first read. */
  TOOL_LANE_LEGACY: "camaleon.tools.lane.v1",
  /** @deprecated Migrated into user-settings.tools */
  TOOL_TAB_LEGACY: "camaleon.tools.tab.v1",
  /** @deprecated Migrated into user-settings.tools */
  TOOL_DENSITY_LEGACY: "camaleon.tools.density.v1",
  ONBOARDING: "camaleon-onboarding-complete",
  LAST_SEEN_RELEASE: "camaleon-last-seen-release",
  RELEASE_SNOOZE: "camaleon-release-snooze-until",
  APP_UPDATE_SNOOZE: "camaleon-app-update-snooze-until",
} as const;

/** Cookies mirrored from localStorage for SSR-first paint (theme, locale, tool browser). */
export const COOKIE_NAMES = {
  THEME: "camaleon-theme",
  LOCALE: "camaleon-locale",
  TOOL_LANE: "camaleon-tool-lane",
  TOOL_TAB: "camaleon-tool-tab",
  TOOL_DENSITY: "camaleon-tool-density",
} as const;

export const COOKIE_MAX_AGE = 31536000;
