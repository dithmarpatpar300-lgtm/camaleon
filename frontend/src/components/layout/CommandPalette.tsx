"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { TOOLS } from "@/lib/tools/tool-registry";
import { Badge } from "@/components/ui/Badge";
import { PanelScrollFade } from "@/components/ui/PanelScrollFade";
import { useI18n } from "@/providers/I18nProvider";
import { getToolStrings, resolveToolActionTitle } from "@/lib/i18n/tool-copy";

type CommandPaletteProps = {
  onClose: () => void;
};

const activeTools = TOOLS.filter((t) => t.status === "active");
const soonTools = TOOLS.filter((t) => t.status === "soon");

/** Fixed-width format chip so all tool rows are perfectly aligned regardless of text length. */
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

export const CommandPalette = forwardRef<HTMLDialogElement, CommandPaletteProps>(
  function CommandPalette({ onClose }, ref) {
    const { t } = useI18n();

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    return (
      <dialog
        ref={ref}
        className="command-palette fixed inset-0 m-0 h-full w-full max-w-none bg-transparent p-4 sm:p-8 md:p-16"
        aria-label={t("commandPalette.ariaLabel")}
        aria-modal="true"
        onClick={handleBackdropClick}
      >
        <div
          className="glass-palette mx-auto mt-16 w-full max-w-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="border-b border-white/8 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              {t("commandPalette.title")}
            </p>
          </div>

          {/* ── Active tools ────────────────────────────────────────── */}
          <div className="px-3 pt-3 pb-1">
            <p className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {t("commandPalette.categoryImage")}
            </p>
            {/* PanelScrollFade: masks the scroller for clean fade on acrylic glass */}
            <PanelScrollFade maxHeightClass="max-h-[316px]" ariaLabel={t("commandPalette.ariaLabel")}>
              {/* pb-1 breathing room so last item's focus ring isn't clipped */}
              <div className="flex flex-col gap-1.5 pb-1">
                {activeTools.map((tool) => {
                  const copy = getToolStrings(tool, t);
                  const actionTitle = resolveToolActionTitle(tool.id, t);
                  return (
                    <Link
                      key={tool.id}
                      href={`/transmute/${tool.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                    >
                      <FormatChip from={tool.fromFormat} to={tool.toFormat} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-text-primary leading-snug">
                            {actionTitle ?? tool.title}
                          </span>
                          {actionTitle && (
                            <span className="font-mono text-[10px] text-text-muted shrink-0">
                              {tool.fromFormat} → {tool.toFormat}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                          {copy.description}
                        </p>
                      </div>

                      <Badge
                        variant={tool.fidelity === "lossless" ? "lossless" : "lossy"}
                        className="shrink-0 text-[10px] font-bold px-2 py-0.5"
                      >
                        {tool.fidelity === "lossless" ? t("badges.lossless") : t("badges.lossy")}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </PanelScrollFade>
          </div>

          {/* ── Coming soon ─────────────────────────────────────────── */}
          {soonTools.length > 0 && (
            <div className="border-t border-white/6 px-3 pt-2 pb-1 mt-1">
              <p className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                {t("commandPalette.categorySoon")}
              </p>
              <div className="flex flex-col gap-1.5">
                {soonTools.map((tool) => {
                  const copy = getToolStrings(tool, t);
                  const actionTitle = resolveToolActionTitle(tool.id, t);
                  return (
                    <div
                      key={tool.id}
                      className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 opacity-35"
                    >
                      <FormatChip from={tool.fromFormat} to={tool.toFormat} />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-text-primary leading-snug">
                          {actionTitle ?? tool.title}
                        </span>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                          {copy.description}
                        </p>
                      </div>
                      <Badge variant="neutral" className="shrink-0 text-[10px] font-bold px-2 py-0.5">
                        {t("badges.soon")}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Footer hint ─────────────────────────────────────────── */}
          <div className="border-t border-white/5 px-5 py-2 text-right">
            <span className="text-xs text-text-muted">
              {t("commandPalette.closeHint")}
            </span>
          </div>
        </div>
      </dialog>
    );
  }
);
