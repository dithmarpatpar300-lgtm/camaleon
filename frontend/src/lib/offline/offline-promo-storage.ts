import { writeOfflinePrefs } from "@/lib/prefs/offline-prefs";

export const OFFLINE_PROMO_SNOOZE_DAYS = 7;

export function isOfflinePromoSnoozed(snoozedUntil?: string | null): boolean {
  if (!snoozedUntil) return false;
  const until = Date.parse(snoozedUntil);
  if (Number.isNaN(until) || Date.now() >= until) return false;
  return true;
}

export function snoozeOfflinePromo(days = OFFLINE_PROMO_SNOOZE_DAYS): void {
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  writeOfflinePrefs({ installPromoSnoozedUntil: until });
}

export function clearOfflinePromoSnooze(): void {
  writeOfflinePrefs({ installPromoSnoozedUntil: undefined });
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    nav.standalone === true
  );
}
