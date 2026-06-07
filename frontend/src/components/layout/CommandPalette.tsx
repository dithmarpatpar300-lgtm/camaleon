"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { TOOLS } from "@/lib/tools/tool-registry";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/providers/I18nProvider";
import { getToolStrings, resolveToolActionTitle } from "@/lib/i18n/tool-copy";

type CommandPaletteProps = {
  onClose: () => void;
};

const activeTools = TOOLS.filter((t) => t.status === "active");
const soonTools = TOOLS.filter((t) => t.status === "soon");

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
          <div className="border-b border-white/8 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              {t("commandPalette.title")}
            </p>
          </div>

          <div className="px-2 py-2">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-widest text-text-muted">
              {t("commandPalette.categoryImage")}
            </p>
            {activeTools.map((tool) => {
              const copy = getToolStrings(tool, t);
              const actionTitle = resolveToolActionTitle(tool.id, t);
              return (
                <Link
                  key={tool.id}
                  href={`/transmute/${tool.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="flex h-10 w-14 shrink-0 items-center justify-center gap-0.5 rounded-lg border border-border bg-bg-elevated font-mono text-xs text-text-muted">
                    <span>{tool.fromFormat}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-2.5 w-2.5" aria-hidden="true">
                      <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                    <span>{tool.toFormat}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-text-primary">
                        {actionTitle ?? tool.title}
                      </span>
                      {actionTitle && (
                        <span className="font-mono text-xs text-text-muted shrink-0">
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
                    className="shrink-0"
                  >
                    {tool.fidelity === "lossless" ? t("badges.lossless") : t("badges.lossy")}
                  </Badge>
                </Link>
              );
            })}
          </div>

          {soonTools.length > 0 && (
            <div className="border-t border-white/5 px-2 pb-2 pt-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-widest text-text-muted">
                {t("commandPalette.categorySoon")}
              </p>
              {soonTools.map((tool) => {
                const copy = getToolStrings(tool, t);
                const actionTitle = resolveToolActionTitle(tool.id, t);
                return (
                  <div
                    key={tool.id}
                    className="flex cursor-not-allowed items-center gap-4 rounded-xl px-3 py-3 opacity-40"
                  >
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center gap-0.5 rounded-lg border border-border bg-bg-elevated font-mono text-xs text-text-muted">
                      <span>{tool.fromFormat}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-2.5 w-2.5" aria-hidden="true">
                        <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                      </svg>
                      <span>{tool.toFormat}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-text-primary">
                        {actionTitle ?? tool.title}
                      </span>
                      <p className="mt-0.5 truncate text-xs text-text-secondary">
                        {copy.description}
                      </p>
                    </div>
                    <Badge variant="neutral" className="shrink-0">
                      {t("badges.soon")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-white/5 px-4 py-2 text-right">
            <span className="text-xs text-text-muted">
              {t("commandPalette.closeHint")}
            </span>
          </div>
        </div>
      </dialog>
    );
  }
);
