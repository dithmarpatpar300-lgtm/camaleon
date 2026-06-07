"use client";

import { useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useTransmutationWorker } from "@/hooks/useTransmutationWorker";
import { APP_VERSION, SITE_REPO_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

export function Footer() {
  const { t } = useI18n();
  const { ready } = useTransmutationWorker();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex min-h-[4.5rem] max-w-6xl flex-col gap-3 px-6 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex min-w-0 items-center gap-2 truncate rounded-full bg-accent-subtle px-3 py-1 text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
              clipRule="evenodd"
            />
          </svg>
          <span className="truncate">{t("footer.privacy")}</span>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <a
            href={SITE_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted transition-colors hover:text-accent"
          >
            {t("footer.github")}
          </a>
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="text-text-muted transition-colors hover:text-accent"
          >
            {t("footer.shortcuts")}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 font-mono tabular-nums">
          <span className="text-text-muted">{t("footer.version", { version: APP_VERSION })}</span>
          <span className="text-text-muted" aria-hidden="true">
            ·
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              ready ? "text-text-muted" : "text-text-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-2 w-2 shrink-0 rounded-full",
                ready ? "bg-accent" : "bg-text-muted motion-safe:animate-pulse"
              )}
              aria-hidden="true"
            />
            <span>{ready ? t("footer.engineReady") : t("footer.engineInit")}</span>
          </span>
        </div>
      </div>

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </footer>
  );
}
