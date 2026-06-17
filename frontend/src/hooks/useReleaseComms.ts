"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { APP_VERSION } from "@/lib/site";
import {
  getLatestRelease,
  getLastSeenRelease,
  isOnboardingComplete,
  isReleaseSnoozed,
  isVersionNewer,
  markOnboardingComplete,
  markReleaseSeen,
  snoozeReleaseNotes,
} from "@/lib/releases";
import { getShowChangelogOnUpdate } from "@/lib/prefs/user-settings";

export function useReleaseCommsState() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [ready, setReady] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [changelogDismissed, setChangelogDismissed] = useState(false);

  useEffect(() => {
    const lastSeen = getLastSeenRelease();
    if (lastSeen && !isOnboardingComplete()) {
      markOnboardingComplete();
    }
    setReady(true);
  }, []);

  const shouldShowOnboarding = useMemo(() => {
    if (!ready || !isHome || onboardingDismissed) return false;
    if (getLastSeenRelease()) return false;
    return !isOnboardingComplete();
  }, [ready, isHome, onboardingDismissed]);

  const shouldShowChangelog = useMemo(() => {
    if (!ready || !isHome || changelogDismissed || shouldShowOnboarding) return false;
    if (!getShowChangelogOnUpdate()) return false;
    if (!isOnboardingComplete() && !getLastSeenRelease()) return false;
    if (isReleaseSnoozed()) return false;
    return isVersionNewer(APP_VERSION, getLastSeenRelease());
  }, [ready, isHome, changelogDismissed, shouldShowOnboarding]);

  const latestRelease = getLatestRelease();

  const dismissOnboarding = useCallback(() => {
    markOnboardingComplete();
    setOnboardingDismissed(true);
  }, []);

  const dismissChangelog = useCallback(() => {
    markReleaseSeen(APP_VERSION);
    setChangelogDismissed(true);
  }, []);

  const remindChangelogLater = useCallback(() => {
    snoozeReleaseNotes();
    setChangelogDismissed(true);
  }, []);

  return {
    isHome,
    shouldShowOnboarding,
    shouldShowChangelog,
    latestRelease,
    dismissOnboarding,
    dismissChangelog,
    remindChangelogLater,
  };
}
