"use client";

import { useRouter } from "next/navigation";
import { RELEASE_MANIFEST, markReleaseSeen } from "@/lib/releases";
import { APP_VERSION } from "@/lib/site";
import { useI18n } from "@/providers/I18nProvider";
import { SurfaceDialog } from "@/components/ui/SurfaceDialog";
import { SurfaceBackdrop, SurfacePanel } from "@/components/ui/SurfaceSheet";
import { PanelScrollFade } from "@/components/ui/PanelScrollFade";
import { cn } from "@/lib/utils";
import { ReleaseHighlightList } from "./ReleaseHighlightList";
import { TechnicalDisclosure } from "./TechnicalDisclosure";

type Props = {
  open: boolean;
  onDismiss: () => void;
};

export function OnboardingPanel({ open, onDismiss }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const { onboarding } = RELEASE_MANIFEST;

  const scrollToTools = () => {
    document.getElementById("transmute-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
    onDismiss();
  };

  const navigateToAbout = () => {
    markReleaseSeen(APP_VERSION);
    onDismiss();
    router.push("/about");
  };

  return (
    <SurfaceDialog
      open={open}
      onClose={onDismiss}
      ariaLabelledBy="onboarding-title"
      ariaDescribedBy="onboarding-subtitle"
    >
      <SurfaceBackdrop layout="onboarding" onDismiss={onDismiss}>
        <SurfacePanel
          variant="floating"
          role="document"
          className={cn(
            "w-full max-w-md overflow-hidden motion-safe:animate-[prepareGateIn_340ms_cubic-bezier(0.22,1,0.36,1)_both]",
            "max-sm:max-h-[min(92dvh,40rem)] max-sm:surface-sheet-mobile",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          )}
        >
          <div className="border-b border-border bg-accent-subtle/30 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
              {t("releaseComms.onboarding.badge")}
            </p>
            <h2 id="onboarding-title" className="mt-1 text-lg font-semibold text-text-primary">
              {t(onboarding.titleKey)}
            </h2>
            <p id="onboarding-subtitle" className="mt-1 text-sm text-text-secondary">
              {t(onboarding.subtitleKey)}
            </p>
          </div>

          <PanelScrollFade
            maxHeightClass="max-h-[min(52vh,28rem)] max-sm:max-h-[min(42dvh,22rem)]"
            className="px-5 py-4"
            ariaLabel={t("releaseComms.onboarding.title")}
          >
            <ReleaseHighlightList highlights={onboarding.highlights} compact />
            <TechnicalDisclosure
              className="mt-4"
              labelKey="releaseComms.onboarding.technicalToggle"
              bodyKey={onboarding.technicalKey}
            />
          </PanelScrollFade>

          <div className="flex flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={scrollToTools}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
              >
                {t("releaseComms.onboarding.explore")}
              </button>
              <button
                type="button"
                onClick={navigateToAbout}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-white/15 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {t("releaseComms.onboarding.about")}
              </button>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="text-sm text-text-muted transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:text-accent"
            >
              {t("releaseComms.onboarding.gotIt")}
            </button>
          </div>
        </SurfacePanel>
      </SurfaceBackdrop>
    </SurfaceDialog>
  );
}
