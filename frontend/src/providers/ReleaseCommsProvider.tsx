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
import { LegalRefreshProvider } from "@/providers/LegalRefreshProvider";

type ReleaseCommsContextValue = {
  openWhatsNew: () => void;
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

  const value = useMemo(() => ({ openWhatsNew }), [openWhatsNew]);

  return (
    <ReleaseCommsContext.Provider value={value}>
      <LegalRefreshProvider shouldDeferToOnboarding={shouldShowOnboarding}>
        {children}
      </LegalRefreshProvider>
      <OnboardingPanel open={shouldShowOnboarding} onDismiss={dismissOnboarding} />
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
