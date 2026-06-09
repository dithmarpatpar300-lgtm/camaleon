"use client";

import type { ReleaseEntry } from "@/lib/releases/types";
import { useI18n } from "@/providers/I18nProvider";
import { SITE_NAME } from "@/lib/site";
import { SurfaceDialog } from "@/components/ui/SurfaceDialog";
import { SurfaceBackdrop, SurfacePanel } from "@/components/ui/SurfaceSheet";
import { PanelScrollFade } from "@/components/ui/PanelScrollFade";
import { ReleaseHighlightList } from "./ReleaseHighlightList";
import { ReleaseTagChip } from "./ReleaseTagChip";
import { TechnicalDisclosure } from "./TechnicalDisclosure";

type Props = {
  open: boolean;
  entry: ReleaseEntry;
  onDismiss: () => void;
  onRemindLater: () => void;
  onViewAll: () => void;
};

export function ReleaseNotesModal({
  open,
  entry,
  onDismiss,
  onRemindLater,
  onViewAll,
}: Props) {
  const { t } = useI18n();

  return (
    <SurfaceDialog
      open={open}
      onClose={onDismiss}
      ariaLabel={t("releaseComms.changelog.title", { version: entry.version })}
    >
      <SurfaceBackdrop layout="centered" onDismiss={onDismiss}>
        <SurfacePanel className="mx-auto mt-8 w-full max-w-lg overflow-hidden motion-safe:animate-[prepareGateIn_340ms_cubic-bezier(0.22,1,0.36,1)_both] sm:mt-12">
          <div className="border-b border-border px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-accent/30 bg-accent-subtle px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-accent">
                v{entry.version}
              </span>
              {entry.tags?.map((tag) => (
                <ReleaseTagChip key={tag} tag={tag} />
              ))}
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {SITE_NAME}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary">
              {t("releaseComms.changelog.title", { version: entry.version })}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{t(entry.summaryKey)}</p>
          </div>

          <PanelScrollFade
            maxHeightClass="max-h-[min(50vh,24rem)]"
            className="px-5 py-4"
            ariaLabel={t("releaseComms.changelog.title", { version: entry.version })}
          >
            <ReleaseHighlightList highlights={entry.highlights} />
            {entry.technicalKey && (
              <TechnicalDisclosure
                className="mt-4"
                labelKey="releaseComms.onboarding.technicalToggle"
                bodyKey={entry.technicalKey}
              />
            )}
          </PanelScrollFade>

          <div className="flex flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t("releaseComms.changelog.gotIt")}
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onViewAll}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:text-accent"
              >
                {t("releaseComms.changelog.viewAll")}
              </button>
              <button
                type="button"
                onClick={onRemindLater}
                className="text-sm text-text-muted transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:text-accent"
              >
                {t("releaseComms.changelog.remindLater")}
              </button>
            </div>
          </div>
        </SurfacePanel>
      </SurfaceBackdrop>
    </SurfaceDialog>
  );
}
