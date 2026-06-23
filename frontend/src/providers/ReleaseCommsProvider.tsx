"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { OnboardingPanel } from "@/components/release-comms/OnboardingPanel";
import { ReleaseNotesModal } from "@/components/release-comms/ReleaseNotesModal";
import { WhatsNewDrawer } from "@/components/release-comms/WhatsNewDrawer";
import { useReleaseCommsState } from "@/hooks/useReleaseComms";
import { resetOnboarding } from "@/lib/releases/storage";

type ReleaseCommsContextValue = {
  openWhatsNew: () => void;
  openOnboarding: () => void;
};

const ReleaseCommsContext = createContext<ReleaseCommsContextValue | null>(null);

export function useReleaseComms() {
  const ctx = useContext(ReleaseCommsContext);
  if (!ctx) {
    throw new Error("useReleaseComms must be used within ReleaseCommsProvider");
  }
  return ctx;
}

export function ReleaseCommsProvider({ children }: { children: ReactNode }) {
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const {
    shouldShowOnboarding,
    shouldShowChangelog,
    latestRelease,
    dismissOnboarding,
    dismissChangelog,
    remindChangelogLater,
  } = useReleaseCommsState();

  const openWhatsNew = useCallback(() => setWhatsNewOpen(true), []);
  const closeWhatsNew = useCallback(() => setWhatsNewOpen(false), []);

  const openOnboarding = useCallback(() => {
    resetOnboarding();
    setShowOnboarding(true);
  }, []);

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    dismissOnboarding();
  }, [dismissOnboarding]);

  const value = useMemo(() => ({ openWhatsNew, openOnboarding }), [openWhatsNew, openOnboarding]);

  return (
    <ReleaseCommsContext.Provider value={value}>
      {children}
      <OnboardingPanel open={shouldShowOnboarding || showOnboarding} onDismiss={handleDismissOnboarding} />
      {latestRelease && (
        <ReleaseNotesModal
          open={shouldShowChangelog}
          entry={latestRelease}
          onDismiss={dismissChangelog}
          onRemindLater={remindChangelogLater}
          onViewAll={() => {
            dismissChangelog();
            setWhatsNewOpen(true);
          }}
        />
      )}
      <WhatsNewDrawer open={whatsNewOpen} onClose={closeWhatsNew} />
    </ReleaseCommsContext.Provider>
  );
}
