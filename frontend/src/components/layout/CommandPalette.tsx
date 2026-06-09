"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getActiveTools, getSoonTools } from "@/lib/tools/tool-registry";
import { filterTools } from "@/lib/tools/filter-tools";
import { groupToolsByKey } from "@/lib/tools/tool-groups";
import type { ToolDefinition } from "@/lib/tools/types";
import { Badge } from "@/components/ui/Badge";
import { SurfaceDialog } from "@/components/ui/SurfaceDialog";
import { SurfaceBackdrop, SurfacePanel } from "@/components/ui/SurfaceSheet";
import { PanelScrollFade } from "@/components/ui/PanelScrollFade";
import { useI18n } from "@/providers/I18nProvider";
import { getToolStrings, resolveToolActionTitle } from "@/lib/i18n/tool-copy";
import { cn } from "@/lib/utils";

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

const activeTools = getActiveTools();
const soonTools = getSoonTools();

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

type ToolRowProps = {
  tool: ToolDefinition;
  isActive: boolean;
  itemIndex: number;
  onClose: () => void;
  onHover: () => void;
  rowRef: (el: HTMLAnchorElement | null) => void;
};

function ToolRow({ tool, isActive, itemIndex, onClose, onHover, rowRef }: ToolRowProps) {
  const { t } = useI18n();
  const copy = getToolStrings(tool, t);
  const actionTitle = resolveToolActionTitle(tool.id, t);

  return (
    <Link
      ref={rowRef}
      href={`/transmute/${tool.slug}`}
      onClick={onClose}
      onMouseEnter={onHover}
      data-palette-index={itemIndex}
      aria-selected={isActive}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors sm:min-h-0 sm:py-2.5",
        "hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
        isActive && "bg-bg-elevated ring-1 ring-accent/25"
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

      <Badge
        variant={tool.fidelity === "lossless" ? "lossless" : "lossy"}
        className="shrink-0 px-2 py-0.5 text-[10px] font-bold"
      >
        {tool.fidelity === "lossless" ? t("badges.lossless") : t("badges.lossy")}
      </Badge>
    </Link>
  );
}

export const CommandPalette = forwardRef<HTMLDialogElement, CommandPaletteProps>(
  function CommandPalette({ open, onClose }, ref) {
    const { t } = useI18n();
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement>(null);
    const rowRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);

    const filteredActive = useMemo(
      () => filterTools(activeTools, query, t),
      [query, t]
    );
    const filteredSoon = useMemo(
      () => filterTools(soonTools, query, t),
      [query, t]
    );
    const groupedSections = useMemo(
      () => groupToolsByKey(filteredActive),
      [filteredActive]
    );
    const flatTools = useMemo(() => filteredActive, [filteredActive]);

    useEffect(() => {
      if (!open) return;
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => searchRef.current?.focus());
    }, [open]);

    useEffect(() => {
      setActiveIndex(0);
    }, [query]);

    useEffect(() => {
      rowRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    const navigateToActive = useCallback(() => {
      const tool = flatTools[activeIndex];
      if (!tool) return;
      onClose();
      router.push(`/transmute/${tool.slug}`);
    }, [activeIndex, flatTools, onClose, router]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (flatTools.length === 0) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, flatTools.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          navigateToActive();
        }
      },
      [flatTools.length, navigateToActive]
    );

    let itemIndex = 0;

    return (
      <SurfaceDialog
        ref={ref}
        open={open}
        onClose={onClose}
        forceMount
        kind="palette"
        ariaLabel={t("commandPalette.ariaLabel")}
        onKeyDown={handleKeyDown}
      >
        <SurfaceBackdrop layout="palette" onDismiss={onClose}>
          <SurfacePanel
            variant="sheet"
            className="flex max-h-[min(92dvh,40rem)] w-full max-w-xl flex-col overflow-hidden max-sm:max-h-[min(96dvh,48rem)] max-sm:rounded-b-none sm:mx-auto"
          >
              {/* ── Search ──────────────────────────────────────────────── */}
              <div className="border-b border-border px-4 py-3">
                <label htmlFor="command-palette-search" className="sr-only">
                  {t("commandPalette.searchLabel")}
                </label>
                <div className="relative">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
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
                  <input
                    id="command-palette-search"
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("commandPalette.searchPlaceholder")}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full rounded-xl border border-border bg-bg-elevated py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>
              </div>

              {/* ── Grouped tools ───────────────────────────────────────── */}
              <div className="min-h-0 flex-1 px-3 pt-2 pb-1">
                <PanelScrollFade
                  maxHeightClass="max-h-[min(52dvh,22rem)] sm:max-h-[min(56dvh,24rem)]"
                  ariaLabel={t("commandPalette.ariaLabel")}
                >
                  {groupedSections.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-text-muted">
                      {t("commandPalette.noResults")}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3 pb-1">
                      {groupedSections.map((section) => (
                        <div key={section.key}>
                          <p className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                            {t(`commandPalette.groups.${section.key}`)}
                          </p>
                          <div className="flex flex-col gap-1">
                            {section.tools.map((tool) => {
                              const index = itemIndex++;
                              return (
                                <ToolRow
                                  key={tool.id}
                                  tool={tool}
                                  itemIndex={index}
                                  isActive={activeIndex === index}
                                  onClose={onClose}
                                  onHover={() => setActiveIndex(index)}
                                  rowRef={(el) => {
                                    rowRefs.current[index] = el;
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </PanelScrollFade>
              </div>

              {/* ── Coming soon ─────────────────────────────────────────── */}
              {filteredSoon.length > 0 && (
                <div className="mt-1 border-t border-border px-3 pt-2 pb-1">
                  <p className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                    {t("commandPalette.categorySoon")}
                  </p>
                  <div className="flex flex-col gap-1">
                    {filteredSoon.map((tool) => {
                      const copy = getToolStrings(tool, t);
                      const actionTitle = resolveToolActionTitle(tool.id, t);
                      return (
                        <div
                          key={tool.id}
                          className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 opacity-35 sm:min-h-0 sm:py-2.5"
                        >
                          <FormatChip from={tool.fromFormat} to={tool.toFormat} />
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-semibold leading-snug text-text-primary">
                              {actionTitle ?? tool.title}
                            </span>
                            <p className="mt-0.5 truncate text-xs text-text-secondary">
                              {copy.description}
                            </p>
                          </div>
                          <Badge variant="neutral" className="shrink-0 px-2 py-0.5 text-[10px] font-bold">
                            {t("badges.soon")}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Footer ──────────────────────────────────────────────── */}
              <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:justify-end sm:px-5 sm:py-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 rounded-xl px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:hidden"
                >
                  {t("commandPalette.close")}
                </button>
                <span className="hidden text-xs text-text-muted sm:inline">
                  {t("commandPalette.closeHint")}
                </span>
              </div>
          </SurfacePanel>
        </SurfaceBackdrop>
      </SurfaceDialog>
    );
  }
);
