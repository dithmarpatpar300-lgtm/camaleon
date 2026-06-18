import type { Notice } from "@/lib/notices/types";
import { NOTICE_PRIORITY } from "@/lib/notices/types";
import type { NoticesPrefs, PrepareProgressStylePref } from "./user-settings";
import { readUserSettings, writeUserSettings } from "./user-settings";

export type { PrepareProgressStylePref };

export type NoticeRailDensity = NonNullable<NoticesPrefs["railDensity"]>;

const LEGACY_PREPARE_KEY = "camaleon:prepareProgressStyle";

const listeners = new Set<() => void>();

export function subscribeNoticesPrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyNoticesPrefsListeners(): void {
  listeners.forEach((listener) => listener());
}

function migrateLegacyPrepareStyle(): void {
  if (typeof localStorage === "undefined") return;
  const stored = readUserSettings().notices?.prepareProgressStyle;
  if (stored) return;
  const legacy = localStorage.getItem(LEGACY_PREPARE_KEY);
  if (legacy !== "bar") return;
  writeUserSettings({
    notices: { ...readUserSettings().notices, prepareProgressStyle: "bar" },
  });
  localStorage.removeItem(LEGACY_PREPARE_KEY);
}

export function readNoticesPrefs(): NoticesPrefs {
  migrateLegacyPrepareStyle();
  return readUserSettings().notices ?? {};
}

export function getEffectiveNoticesPrefs(): Required<NoticesPrefs> {
  const stored = readNoticesPrefs();
  return {
    railDensity: stored.railDensity ?? "normal",
    prepareProgressStyle: stored.prepareProgressStyle ?? "ring",
  };
}

export function writeNoticesPrefs(partial: Partial<NoticesPrefs>): NoticesPrefs {
  const next = { ...readNoticesPrefs(), ...partial };
  writeUserSettings({ notices: next });
  notifyNoticesPrefsListeners();
  return next;
}

export function resetNoticesPrefs(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(LEGACY_PREPARE_KEY);
  }
  writeUserSettings({ notices: {} });
  notifyNoticesPrefsListeners();
}

export function getPrepareProgressStylePref(): PrepareProgressStylePref {
  return getEffectiveNoticesPrefs().prepareProgressStyle;
}

export function setPrepareProgressStylePref(style: PrepareProgressStylePref): void {
  writeNoticesPrefs({ prepareProgressStyle: style });
}

export function filterNoticesForDensity(
  notices: Notice[],
  density: NoticeRailDensity = getEffectiveNoticesPrefs().railDensity
): Notice[] {
  if (density !== "minimal") return notices;

  const minimalHiddenIds = new Set([
    "limit-risk-mode",
    "limit-high-ram",
    "limit-near-pixels",
    "performance-latency",
  ]);

  return notices.filter((notice) => {
    if (notice.severity === "error") return true;
    if (minimalHiddenIds.has(notice.id)) return false;
    if (notice.severity === "info" || notice.severity === "status") return false;
    if (notice.severity === "warn") {
      return notice.priority >= NOTICE_PRIORITY.warnFidelity;
    }
    return false;
  });
}
