"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { RELEASE_MANIFEST } from "@/lib/releases";
import type { ReleaseEntry } from "@/lib/releases/types";
import { useI18n } from "@/providers/I18nProvider";
import { APP_VERSION } from "@/lib/site";
import { SurfaceDialog } from "@/components/ui/SurfaceDialog";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { PanelScrollFade } from "@/components/ui/PanelScrollFade";
import { cn } from "@/lib/utils";
import { ReleaseHighlightList } from "./ReleaseHighlightList";
import { ReleaseTagChip } from "./ReleaseTagChip";
import { TechnicalDisclosure } from "./TechnicalDisclosure";

const EXIT_MS = 240;

const PANEL_SHELL_CLASS =
  "surface-raised fixed right-0 flex h-full w-full max-w-md flex-col overflow-hidden max-sm:surface-sheet-mobile max-sm:rounded-none sm:rounded-l-2xl top-0 bottom-0 sm:top-4 sm:bottom-4 sm:right-4 sm:h-auto";

type Props = {
  open: boolean;
  onClose: () => void;
};

function ReleaseAccordionItem({
  entry,
  defaultOpen,
}: {
  entry: ReleaseEntry;
  defaultOpen?: boolean;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const isCurrent = entry.version === APP_VERSION;
  const dateLabel = new Date(entry.date).toLocaleDateString(locale === "es" ? "es" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article
      className={cn(
        "rounded-xl border shadow-sm transition-colors",
        isCurrent
          ? "border-accent/35 bg-accent-subtle/25"
          : "border-border bg-bg-surface"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold tabular-nums text-text-primary">
              v{entry.version}
            </span>
            {isCurrent && (
              <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                {t("releaseComms.whatsNew.current")}
              </span>
            )}
            <span className="text-[11px] text-text-muted">{dateLabel}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-text-primary">{t(entry.titleKey)}</p>
          <p className="mt-0.5 text-xs text-text-secondary">{t(entry.summaryKey)}</p>
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <ReleaseTagChip key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
        <svg
          className={cn("mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform", open && "rotate-180")}
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.47 6.47a.75.75 0 011.06 0L8 8.94l2.47-2.47a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 010-1.06z" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3">
          <ReleaseHighlightList highlights={entry.highlights} compact />
          {entry.technicalKey && (
            <TechnicalDisclosure
              className="mt-3"
              labelKey="releaseComms.onboarding.technicalToggle"
              bodyKey={entry.technicalKey}
            />
          )}
        </div>
      )}
    </article>
  );
}

function WhatsNewDrawerBody({ onRequestClose }: { onRequestClose: () => void }) {
  const { t } = useI18n();

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            {t("releaseComms.whatsNew.subtitle")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">
            {t("releaseComms.whatsNew.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onRequestClose}
          aria-label={t("releaseComms.whatsNew.close")}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4.28 3.22a.75.75 0 00-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 101.06 1.06L8 9.06l3.72 3.72a.75.75 0 101.06-1.06L9.06 8l3.72-3.72a.75.75 0 00-1.06-1.06L8 6.94 4.28 3.22z" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <PanelScrollFade
          className="h-full px-4 py-4"
          maxHeightClass="h-full"
          ariaLabel={t("releaseComms.whatsNew.title")}
        >
          <div className="flex flex-col gap-3 pb-2">
            {RELEASE_MANIFEST.entries.map((entry, index) => (
              <ReleaseAccordionItem key={entry.version} entry={entry} defaultOpen={index === 0} />
            ))}
          </div>
        </PanelScrollFade>
      </div>
    </>
  );
}

function DrawerPanelShell({
  phase,
  onRequestClose,
}: {
  phase: "enter" | "exit";
  onRequestClose: () => void;
}) {
  return (
    <div
      className={cn(
        PANEL_SHELL_CLASS,
        phase === "exit"
          ? "motion-safe:animate-[slideOutRight_240ms_cubic-bezier(0.22,1,0.36,1)_both]"
          : "motion-safe:animate-[slideInRight_280ms_cubic-bezier(0.22,1,0.36,1)_both]"
      )}
      onClick={(e) => e.stopPropagation()}
      aria-hidden={phase === "exit"}
    >
      <WhatsNewDrawerBody onRequestClose={onRequestClose} />
    </div>
  );
}

export function WhatsNewDrawer({ open, onClose }: Props) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmaticCloseRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const dismissDialog = useCallback(() => {
    const dialog = dialogRef.current;
    programmaticCloseRef.current = true;
    dialog?.close();
    programmaticCloseRef.current = false;
  }, []);

  const requestClose = useCallback(() => {
    if (isExiting || !open) return;

    setIsExiting(true);
    clearExitTimer();
    dismissDialog();
    onClose();

    exitTimerRef.current = setTimeout(() => {
      setIsExiting(false);
      exitTimerRef.current = null;
    }, EXIT_MS);
  }, [clearExitTimer, dismissDialog, isExiting, onClose, open]);

  const setDialogRef = useCallback(
    (node: HTMLDialogElement | null) => {
      dialogRef.current = node;
      if (node && open && !node.open) {
        setIsExiting(false);
        node.showModal();
      }
    },
    [open]
  );

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setIsExiting(false);
      dialog.showModal();
    }
  }, [open]);

  useLayoutEffect(() => clearExitTimer, [clearExitTimer]);

  const handleDialogClose = useCallback(() => {
    if (programmaticCloseRef.current) return;
    if (!open) return;
    requestClose();
  }, [open, requestClose]);

  return (
    <>
      {open && (
        <SurfaceDialog
          ref={setDialogRef}
          open={open}
          mounted={open}
          manageOpen={false}
          kind="drawer"
          onClose={handleDialogClose}
          ariaLabel={t("releaseComms.whatsNew.title")}
        >
          <DrawerPanelShell phase="enter" onRequestClose={requestClose} />
        </SurfaceDialog>
      )}

      {isExiting && (
        <ModalPortal>
          <div className="pointer-events-none fixed inset-0 z-40" aria-hidden="true">
            <DrawerPanelShell phase="exit" onRequestClose={() => undefined} />
          </div>
        </ModalPortal>
      )}
    </>
  );
}
