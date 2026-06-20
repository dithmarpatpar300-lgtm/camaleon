"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CURRENT_LEGAL_REVISION } from "@/lib/legal/constants";
import {
  isLegalRevisionAcked,
  markLegalRevisionAcked,
} from "@/lib/legal/revision-ack";
import {
  getLastSeenRelease,
  isOnboardingComplete,
} from "@/lib/releases";
import { LegalRefreshNotice } from "@/components/legal/LegalRefreshNotice";

export function useLegalRefreshNoticeState(options: { shouldDeferToOnboarding: boolean }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const shouldShowLegalRefresh = useMemo(() => {
    if (!ready || !isHome || dismissed) return false;
    if (options.shouldDeferToOnboarding) return false;
    if (!isOnboardingComplete() && !getLastSeenRelease()) return false;
    return !isLegalRevisionAcked(CURRENT_LEGAL_REVISION);
  }, [ready, isHome, dismissed, options.shouldDeferToOnboarding]);

  const acknowledgeLegalRefresh = useCallback(() => {
    markLegalRevisionAcked(CURRENT_LEGAL_REVISION);
    setDismissed(true);
  }, []);

  return {
    shouldShowLegalRefresh,
    acknowledgeLegalRefresh,
  };
}

export function LegalRefreshProvider({
  children,
  shouldDeferToOnboarding,
}: {
  children: React.ReactNode;
  shouldDeferToOnboarding: boolean;
}) {
  const { shouldShowLegalRefresh, acknowledgeLegalRefresh } = useLegalRefreshNoticeState({
    shouldDeferToOnboarding,
  });

  return (
    <>
      {children}
      <LegalRefreshNotice open={shouldShowLegalRefresh} onAcknowledge={acknowledgeLegalRefresh} />
    </>
  );
}
