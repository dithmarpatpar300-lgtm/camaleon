"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { ToolDefinition } from "@/lib/tools/types";
import { getToolStrings, resolveToolActionTitle } from "@/lib/i18n/tool-copy";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

type ToolRowProps = {
  tool: ToolDefinition;
  /** Index for staggered entrance animation. */
  index: number;
};

/** Fixed-width format chip — mirrors CommandPalette so rows align across surfaces. */
function FormatChip({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex h-9 w-[4.5rem] shrink-0 items-center justify-center gap-1 rounded-lg border border-border bg-bg-elevated font-mono text-[10px] font-bold uppercase tracking-tight text-text-muted">
      <span className="truncate">{from}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-2.5 w-2.5 shrink-0"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
          clipRule="evenodd"
        />
      </svg>
      <span className="truncate">{to}</span>
    </div>
  );
}

export function ToolRow({ tool, index }: ToolRowProps) {
  const { t } = useI18n();
  const copy = getToolStrings(tool, t);
  const actionTitle = resolveToolActionTitle(tool.id, t);
  const isActive = tool.status === "active";

  const inner = (
    <div
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition-all",
        "sm:py-2.5",
        isActive
          ? "hover:border-accent/30 hover:bg-bg-elevated"
          : "opacity-55"
      )}
    >
      <FormatChip from={tool.fromFormat} to={tool.toFormat} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold leading-snug text-text-primary">
            {actionTitle ?? tool.title}
          </span>
          {actionTitle && (
            <span className="shrink-0 font-mono text-[10px] text-text-muted">
              {tool.fromFormat} → {tool.toFormat}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-text-secondary">{copy.description}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Badge
          variant={tool.fidelity === "lossless" ? "lossless" : "lossy"}
          className="shrink-0 px-2 py-0.5 text-[10px] font-bold"
        >
          {tool.fidelity === "lossless" ? t("badges.lossless") : t("badges.lossy")}
        </Badge>
        {!isActive && <Badge variant="neutral">{t("badges.soon")}</Badge>}
      </div>
    </div>
  );

  const styleProps = { "--tool-row-index": index } as React.CSSProperties;

  if (isActive) {
    return (
      <Link
        href={`/transmute/${tool.slug}`}
        className="tool-browser-row block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        style={styleProps}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="tool-browser-row cursor-not-allowed" style={styleProps} aria-disabled="true">
      {inner}
    </div>
  );
}
