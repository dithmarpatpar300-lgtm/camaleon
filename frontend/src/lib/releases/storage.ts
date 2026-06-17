export const ONBOARDING_STORAGE_KEY = "camaleon-onboarding-complete";
export const LAST_SEEN_RELEASE_KEY = "camaleon-last-seen-release";
export const RELEASE_SNOOZE_KEY = "camaleon-release-snooze-until";

const SNOOZE_HOURS = 24;

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
}

/** Clears onboarding dismissal so the welcome panel can show again on home. */
export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

export function getLastSeenRelease(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SEEN_RELEASE_KEY);
}

export function markReleaseSeen(version: string): void {
  localStorage.setItem(LAST_SEEN_RELEASE_KEY, version);
  localStorage.removeItem(RELEASE_SNOOZE_KEY);
}

export function snoozeReleaseNotes(): void {
  const until = Date.now() + SNOOZE_HOURS * 60 * 60 * 1000;
  localStorage.setItem(RELEASE_SNOOZE_KEY, String(until));
}

export function isReleaseSnoozed(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(RELEASE_SNOOZE_KEY);
  if (!raw) return false;
  const until = Number(raw);
  if (Number.isNaN(until) || Date.now() >= until) {
    localStorage.removeItem(RELEASE_SNOOZE_KEY);
    return false;
  }
  return true;
}
