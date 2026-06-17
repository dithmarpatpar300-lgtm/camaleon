"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useReleaseComms } from "@/providers/ReleaseCommsProvider";
import { useToast } from "@/providers/ToastProvider";
import { APP_VERSION } from "@/lib/site";
import { resetOnboarding } from "@/lib/releases/storage";
import {
  getShowChangelogOnUpdate,
  setShowChangelogOnUpdate,
} from "@/lib/prefs/user-settings";
import { SurfaceDialog } from "@/components/ui/SurfaceDialog";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { PanelScrollFade } from "@/components/ui/PanelScrollFade";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsRow } from "./SettingsRow";
import { SettingsSwitch } from "./SettingsSwitch";
import { ThemeSegment } from "./ThemeSegment";
import { LanguageSegment } from "./LanguageSegment";

const EXIT_MS = 240;

const PANEL_SHELL_CLASS =
  "surface-raised fixed right-0 flex h-full w-full max-w-md flex-col overflow-hidden max-sm:surface-sheet-mobile max-sm:rounded-none sm:rounded-l-2xl top-0 bottom-0 sm:top-4 sm:bottom-4 sm:right-4 sm:h-auto";

type Props = {
  open: boolean;
  onClose: () => void;
};

function SettingsDrawerBody({ onRequestClose, open }: { onRequestClose: () => void; open: boolean }) {
  const { t } = useI18n();
  const { openWhatsNew } = useReleaseComms();
  const { toast } = useToast();
  const [showChangelog, setShowChangelog] = useState(true);

  useEffect(() => {
    if (!open) return;
    setShowChangelog(getShowChangelogOnUpdate());
  }, [open]);

  const handleChangelogToggle = useCallback((next: boolean) => {
    setShowChangelog(next);
    setShowChangelogOnUpdate(next);
  }, []);

  const handleViewWhatsNew = useCallback(() => {
    onRequestClose();
    openWhatsNew();
  }, [onRequestClose, openWhatsNew]);

  const handleResetWelcome = useCallback(() => {
    resetOnboarding();
    toast({ message: t("settings.updates.welcomeResetDone"), variant: "success" });
  }, [t, toast]);

  const actionButtonClass = cn(
    "rounded-lg border border-border bg-bg-elevated/50 px-3 py-2 text-xs font-medium text-text-secondary",
    "transition-colors hover:border-accent/25 hover:bg-bg-elevated hover:text-text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  );

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            {t("settings.subtitle")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">{t("settings.title")}</h2>
        </div>
        <button
          type="button"
          onClick={onRequestClose}
          aria-label={t("settings.close")}
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
          ariaLabel={t("settings.title")}
        >
          <div className="flex flex-col gap-5 pb-2">
            <SettingsSection title={t("settings.general.section")}>
              <SettingsRow
                label={t("settings.general.languageLabel")}
                description={t("settings.general.languageHint")}
              >
                <LanguageSegment />
              </SettingsRow>
              <SettingsRow
                label={t("settings.general.themeLabel")}
                description={t("settings.general.themeHint")}
                bordered={false}
              >
                <ThemeSegment />
              </SettingsRow>
            </SettingsSection>

            <SettingsSection title={t("settings.updates.section")}>
              <SettingsRow
                label={t("settings.updates.changelogLabel")}
                description={t("settings.updates.changelogHint")}
              >
                <SettingsSwitch
                  checked={showChangelog}
                  onChange={handleChangelogToggle}
                  label={t("settings.updates.changelogLabel")}
                />
              </SettingsRow>
              <SettingsRow label={t("settings.updates.whatsNewLabel")} description={t("settings.updates.whatsNewHint")}>
                <button type="button" onClick={handleViewWhatsNew} className={actionButtonClass}>
                  {t("settings.updates.whatsNewAction")}
                </button>
              </SettingsRow>
              <SettingsRow
                label={t("settings.updates.welcomeLabel")}
                description={t("settings.updates.welcomeHint")}
                bordered={false}
              >
                <button type="button" onClick={handleResetWelcome} className={actionButtonClass}>
                  {t("settings.updates.welcomeAction")}
                </button>
              </SettingsRow>
            </SettingsSection>

            <p className="px-1 text-center font-mono text-[10px] tabular-nums text-text-muted/80">
              {t("settings.versionFootnote", { version: APP_VERSION })}
            </p>
          </div>
        </PanelScrollFade>
      </div>
    </>
  );
}

function DrawerPanelShell({
  phase,
  onRequestClose,
  open,
}: {
  phase: "enter" | "exit";
  onRequestClose: () => void;
  open: boolean;
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
      <SettingsDrawerBody onRequestClose={onRequestClose} open={open} />
    </div>
  );
}

export function SettingsDrawer({ open, onClose }: Props) {
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
          ariaLabel={t("settings.title")}
        >
          <DrawerPanelShell phase="enter" onRequestClose={requestClose} open={open} />
        </SurfaceDialog>
      )}

      {isExiting && (
        <ModalPortal>
          <div className="pointer-events-none fixed inset-0 z-40" aria-hidden="true">
            <DrawerPanelShell phase="exit" onRequestClose={() => undefined} open={false} />
          </div>
        </ModalPortal>
      )}
    </>
  );
}
