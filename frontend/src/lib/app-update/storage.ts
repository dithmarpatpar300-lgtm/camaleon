export const APP_UPDATE_SNOOZE_KEY = "camaleon-app-update-snooze-until";

const SNOOZE_HOURS = 24;

export function isAppUpdateSnoozed(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(APP_UPDATE_SNOOZE_KEY);
  if (!raw) return false;
  const until = Number(raw);
  if (Number.isNaN(until) || Date.now() >= until) {
    localStorage.removeItem(APP_UPDATE_SNOOZE_KEY);
    return false;
  }
  return true;
}

export function snoozeAppUpdate(): void {
  const until = Date.now() + SNOOZE_HOURS * 60 * 60 * 1000;
  localStorage.setItem(APP_UPDATE_SNOOZE_KEY, String(until));
}

export function clearAppUpdateSnooze(): void {
  localStorage.removeItem(APP_UPDATE_SNOOZE_KEY);
}
