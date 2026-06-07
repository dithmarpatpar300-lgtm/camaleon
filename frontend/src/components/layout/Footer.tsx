"use client";

import { useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useI18n } from "@/providers/I18nProvider";
import { useTransmutationWorker } from "@/hooks/useTransmutationWorker";
import { APP_VERSION, SITE_REPO_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

const footerText = "text-xs leading-none";
const footerLink =
  "inline-flex h-8 items-center text-text-muted transition-colors hover:text-accent";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("block size-3.5 shrink-0", className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Footer() {
  const { t } = useI18n();
  const { ready } = useTransmutationWorker();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useScrollLock(shortcutsOpen);

  return (
    <footer className="shrink-0 border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-3">
        <div className="grid h-8 grid-cols-1 items-center gap-y-3 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-0">
          {/* Zone 1 — trust (start) */}
          <div className="flex h-8 min-w-0 items-center justify-start">
            <div
              className={cn(
                "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full bg-accent-subtle px-2.5 text-accent",
                footerText
              )}
            >
              <LockIcon />
              <span className="truncate">{t("footer.privacy")}</span>
            </div>
          </div>

          {/* Zone 2 — links (center on desktop) */}
          <div className="flex h-8 items-center justify-start gap-4 sm:justify-center">
            <a
              href={SITE_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(footerLink, footerText)}
            >
              {t("footer.github")}
            </a>
            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
              className={cn(footerLink, footerText)}
            >
              {t("footer.shortcuts")}
            </button>
          </div>

          {/* Zone 3 — meta (end) */}
          <div
            className={cn(
              "flex h-8 items-center justify-start gap-2 sm:justify-end",
              footerText
            )}
          >
            <span className="inline-flex h-8 items-center font-mono tabular-nums text-text-muted">
              {t("footer.version", { version: APP_VERSION })}
            </span>
            <span
              className="inline-flex h-8 items-center gap-1.5 text-text-muted"
              title={ready ? t("footer.engineReady") : t("footer.engineInit")}
            >
              <span
                className={cn(
                  "block size-1.5 shrink-0 rounded-full",
                  ready ? "bg-accent" : "bg-text-muted motion-safe:animate-pulse"
                )}
                aria-hidden="true"
              />
              <span className="hidden min-[420px]:inline">
                {ready ? t("footer.engineReady") : t("footer.engineInit")}
              </span>
            </span>
          </div>
        </div>
      </div>

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </footer>
  );
}
