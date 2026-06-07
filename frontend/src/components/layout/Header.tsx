"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useI18n } from "@/providers/I18nProvider";
import { TOOLS } from "@/lib/tools/tool-registry";
import { resolveToolActionTitle } from "@/lib/i18n/tool-copy";
import { cn } from "@/lib/utils";
import { UtilityCluster } from "./UtilityCluster";

function paletteModKey(): string {
  if (typeof navigator === "undefined") return "⌘";
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
}

export function Header() {
  const { t } = useI18n();
  const { open, toggle, closePalette, dialogRef } = useCommandPalette();
  const pathname = usePathname();
  const modKey = paletteModKey();

  const isTransmute = pathname.startsWith("/transmute/");
  const slug = isTransmute ? pathname.split("/transmute/")[1]?.split("/")[0] : null;
  const tool = slug ? TOOLS.find((entry) => entry.slug === slug) : null;
  const actionTitle = tool ? resolveToolActionTitle(tool.id, t) : null;

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <svg viewBox="0 0 28 28" fill="none" className="h-7 w-7" aria-hidden="true">
            <path
              d="M14 2C10 2 6.5 3.5 4 6c3-1 6.5-0.5 8 1.5C13.5 5.5 17 5 20 6c-2.5-2.5-6-4-10-4z"
              fill="currentColor"
              className="text-accent"
            />
            <ellipse cx="14" cy="22" rx="10" ry="4" fill="currentColor" className="text-accent/30" />
            <circle cx="14" cy="20" r="4" fill="currentColor" className="text-accent" />
            <circle cx="14" cy="20" r="2" fill="currentColor" className="text-accent-hover" />
            <circle cx="14" cy="20" r="1" fill="currentColor" className="text-bg-base" />
          </svg>
          <span className="text-base font-semibold text-text-primary">Camaleon</span>
        </Link>

        {tool && actionTitle && (
          <div className="hidden items-center gap-2 text-sm sm:flex">
            <span className="text-text-muted">/</span>
            <span className="font-medium text-text-secondary">{actionTitle}</span>
            <span className="font-mono text-xs text-text-muted">
              {tool.fromFormat} → {tool.toFormat}
            </span>
          </div>
        )}

        <div className="flex-1" />

        <nav className="flex items-center gap-1" aria-label={t("nav.mainNavAria")}>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={t("commandPalette.triggerAriaLabel")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              open
                ? "bg-accent-subtle text-accent ring-1 ring-accent/20"
                : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            )}
          >
            <span>{t("nav.transmutations")}</span>
            <kbd className="hidden items-center gap-0.5 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline-flex">
              <span>{modKey}</span>
              <span>K</span>
            </kbd>
          </button>
        </nav>

        <UtilityCluster />
      </div>
      <CommandPalette ref={dialogRef} onClose={closePalette} />
    </header>
  );
}
