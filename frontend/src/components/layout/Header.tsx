"use client";

import { usePathname } from "next/navigation";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useI18n } from "@/providers/I18nProvider";
import { TOOLS } from "@/lib/tools/tool-registry";
import { resolveToolActionTitle } from "@/lib/i18n/tool-copy";
import { cn } from "@/lib/utils";
import { BrandLink } from "@/components/brand/BrandLink";
import { HeaderConnectivityStatus } from "@/components/connectivity/ConnectivityIndicator";
import { UtilityCluster } from "./UtilityCluster";

function paletteModKey(): string {
  if (typeof navigator === "undefined") return "⌘";
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
}

const triggerBase = cn(
  "shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
);

const triggerIdle = cn(
  "border-border/70 bg-bg-elevated/35 text-text-muted",
  "hover:border-accent/25 hover:bg-bg-elevated hover:text-text-secondary"
);

const triggerOpen = "border-accent/35 bg-accent-subtle/20 text-text-primary ring-1 ring-accent/15";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0", className)}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.965 11.026a5 5 0 11-1.06-1.06l2.755 2.754a.75.75 0 11-1.06 1.06l-2.755-2.754zM10.5 7a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type PaletteSearchTriggerProps = {
  open: boolean;
  onClick: () => void;
};

/** Adaptive palette opener — icon on mobile, ghost pill on larger screens (UX-4 v2). */
function PaletteSearchTrigger({ open, onClick }: PaletteSearchTriggerProps) {
  const { t } = useI18n();
  const modKey = paletteModKey();
  const aria = t("nav.searchAriaLabel");

  return (
    <>
      {/* Mobile: icon only — same visual weight as utility cluster */}
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={aria}
        className={cn(
          triggerBase,
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border sm:hidden",
          open ? triggerOpen : triggerIdle
        )}
      >
        <SearchIcon />
      </button>

      {/* sm+: compact ghost pill */}
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={aria}
        className={cn(
          triggerBase,
          "hidden h-9 items-center gap-2 rounded-lg border px-2.5 text-left text-sm sm:inline-flex",
          "max-w-[11rem] md:max-w-xs lg:max-w-[15rem]",
          open ? triggerOpen : triggerIdle
        )}
      >
        <SearchIcon />
        <span className="min-w-0 truncate">
          <span className="lg:hidden">{t("nav.searchPlaceholderShort")}</span>
          <span className="hidden lg:inline">{t("nav.searchPlaceholder")}</span>
        </span>
        <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded border border-border/80 bg-bg-base/50 px-1.5 py-px font-mono text-[10px] leading-none text-text-muted lg:inline-flex">
          <span>{modKey}</span>
          <span>K</span>
        </kbd>
      </button>
    </>
  );
}

export function Header() {
  const { t } = useI18n();
  const { open, toggle, closePalette, dialogRef } = useCommandPalette();
  const pathname = usePathname();

  const isTransmute = pathname.startsWith("/transmute/");
  const slug = isTransmute ? pathname.split("/transmute/")[1]?.split("/")[0] : null;
  const tool = slug ? TOOLS.find((entry) => entry.slug === slug) : null;
  const actionTitle = tool ? resolveToolActionTitle(tool.id, t) : null;

  return (
    <header className="surface-header sticky top-0 z-50 border-b border-border overflow-x-clip">
      <div className="mx-auto flex h-14 min-w-0 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <BrandLink />
        <HeaderConnectivityStatus />

        {tool && actionTitle && (
          <div className="hidden min-w-0 max-w-[32%] items-center gap-2 truncate text-sm md:flex">
            <span className="shrink-0 text-text-muted">/</span>
            <span className="truncate font-medium text-text-secondary">{actionTitle}</span>
            <span className="hidden shrink-0 font-mono text-xs text-text-muted xl:inline">
              {tool.fromFormat} → {tool.toFormat}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1" aria-hidden="true" />

        <nav className="flex shrink-0 items-center" aria-label={t("nav.mainNavAria")}>
          <PaletteSearchTrigger open={open} onClick={toggle} />
        </nav>

        <UtilityCluster />
      </div>
      <CommandPalette ref={dialogRef} open={open} onClose={closePalette} />
    </header>
  );
}
