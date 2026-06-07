"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useI18n } from "@/providers/I18nProvider";

export function Header() {
  const { t } = useI18n();
  const { open, toggle, closePalette, dialogRef } = useCommandPalette();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-base/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
            <path d="M3 12C3 7.58 6.58 4 11 4c2.54 0 4.8 1.18 6.2 3H15v2h6V3h-2v3.26A10.95 10.95 0 0012 1C5.93 1 1 5.93 1 12s4.93 11 11 11c2.54 0 4.88-.86 6.72-2.3l-1.42-1.42A8.96 8.96 0 0112 21c-4.97 0-9-4.03-9-9z" fill="currentColor" className="text-accent" />
            <circle cx="16" cy="12" r="1.5" fill="currentColor" className="text-accent" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-accent-hover" />
            <circle cx="8" cy="12" r="1.5" fill="currentColor" className="text-accent" />
          </svg>
          <span className="text-base font-semibold text-text-primary">Camaleon</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label={t("nav.mainNavAria")}>
          <button
            onClick={toggle}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={t("commandPalette.triggerAriaLabel")}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>{t("nav.transmutations")}</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
              <span>⌘</span><span>K</span>
            </kbd>
          </button>
        </nav>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
      <CommandPalette ref={dialogRef} onClose={closePalette} />
    </header>
  );
}
