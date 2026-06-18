"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { getActiveTools, getSoonTools } from "@/lib/tools/tool-registry";
import {
  TOOL_GROUP_ORDER,
  groupToolsByKey,
  toolGroupAnchorId,
} from "@/lib/tools/tool-groups";
import type { ToolDefinition, ToolGroupKey } from "@/lib/tools/types";
import { cn } from "@/lib/utils";
import { ToolCard } from "./ToolCard";
import { ToolRow } from "./ToolRow";

const STORAGE_TAB_KEY = "camaleon.tools.tab.v1";
const STORAGE_DENSITY_KEY = "camaleon.tools.density.v1";

/** Pre–v3.0.2 localStorage / hash alias */
const LEGACY_GROUP_ALIASES: Record<string, ToolGroupKey> = {
  modern: "avif",
};

function normalizeTabKey(raw: string): ActiveTab | null {
  if (raw === "all") return "all";
  const resolved = LEGACY_GROUP_ALIASES[raw] ?? raw;
  return TOOL_GROUP_ORDER.includes(resolved as ToolGroupKey)
    ? (resolved as ToolGroupKey)
    : null;
}

type ActiveTab = "all" | ToolGroupKey;
type Density = "compact" | "detailed";

function readStoredTab(): ActiveTab | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_TAB_KEY);
    if (!raw) return null;
    return normalizeTabKey(raw);
  } catch {
    return null;
  }
}

function readStoredDensity(): Density | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_DENSITY_KEY);
    return raw === "compact" || raw === "detailed" ? raw : null;
  } catch {
    return null;
  }
}

function parseHashTab(hash: string): ActiveTab | null {
  if (!hash.startsWith("#tool-group-")) return null;
  const key = hash.slice("#tool-group-".length);
  return normalizeTabKey(key);
}

function ToolListing({
  tools,
  density,
  animateRows,
}: {
  tools: ToolDefinition[];
  density: Density;
  animateRows?: boolean;
}) {
  if (density === "compact") {
    return (
      <div className="flex flex-col gap-1.5">
        {tools.map((tool, index) => (
          <ToolRow
            key={tool.id}
            tool={tool}
            index={animateRows ? index : 0}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tools.map((tool, index) => (
        <div
          key={tool.id}
          className={animateRows ? "tool-browser-row" : undefined}
          style={
            animateRows
              ? ({ ["--tool-row-index" as string]: index } as React.CSSProperties)
              : undefined
          }
        >
          <ToolCard tool={tool} />
        </div>
      ))}
    </div>
  );
}

export function ToolBrowser() {
  const { t } = useI18n();
  const sections = useMemo(() => groupToolsByKey(getActiveTools()), []);
  const soonTools = useMemo(() => getSoonTools(), []);

  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [density, setDensity] = useState<Density>("compact");
  const [hydrated, setHydrated] = useState(false);
  const [animateRows, setAnimateRows] = useState(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedTab = readStoredTab();
    const storedDensity = readStoredDensity();
    const hashTab = parseHashTab(window.location.hash);

    if (hashTab) setActiveTab(hashTab);
    else if (storedTab) setActiveTab(storedTab);

    if (storedDensity) setDensity(storedDensity);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_TAB_KEY, activeTab);
    } catch {
      /* ignore */
    }
  }, [activeTab, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_DENSITY_KEY, density);
    } catch {
      /* ignore */
    }
  }, [density, hydrated]);

  const ensurePanelVisible = useCallback(() => {
    const toolbar = toolbarRef.current;
    const panel = panelRef.current;
    if (!toolbar || !panel) return;

    const toolbarBottom = toolbar.getBoundingClientRect().bottom;
    const panelTop = panel.getBoundingClientRect().top;
    const gap = panelTop - toolbarBottom;

    if (gap < 16) {
      window.scrollBy({ top: gap - 16, behavior: "smooth" });
    }
  }, []);

  const selectTab = useCallback(
    (tab: ActiveTab) => {
      setActiveTab(tab);
      setAnimateRows(true);
      requestAnimationFrame(() => {
        ensurePanelVisible();
      });
    },
    [ensurePanelVisible]
  );

  useEffect(() => {
    const handler = () => {
      const hashTab = parseHashTab(window.location.hash);
      if (hashTab) selectTab(hashTab);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [selectTab]);

  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const tabs: ActiveTab[] = ["all", ...sections.map((s) => s.key)];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
      else if (event.key === "ArrowLeft")
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;

      if (nextIndex === null) return;
      event.preventDefault();
      selectTab(tabs[nextIndex]);
      const next = tabsScrollRef.current?.querySelector<HTMLButtonElement>(
        `[data-tab="${tabs[nextIndex]}"]`
      );
      next?.focus();
    },
    [activeTab, sections, selectTab]
  );

  const renderSection = (
    section: ReturnType<typeof groupToolsByKey>[number],
    showDivider: boolean
  ) => (
    <section
      key={section.key}
      id={toolGroupAnchorId(section.key)}
      className="scroll-mt-[calc(var(--header-height)+var(--layout-sticky-gap)+7.5rem)]"
    >
      {showDivider && (
        <SectionDivider
          label={t(`commandPalette.groups.${section.key}`)}
          count={section.tools.length}
        />
      )}
      <ToolListing tools={section.tools} density={density} animateRows={animateRows} />
    </section>
  );

  const visibleSections =
    activeTab === "all"
      ? sections
      : sections.filter((section) => section.key === activeTab);

  const totalActive = sections.reduce((sum, s) => sum + s.tools.length, 0);
  const filteredCount =
    activeTab === "all"
      ? totalActive
      : (visibleSections[0]?.tools.length ?? 0);

  return (
    <section
      id="transmute-tools"
      className="min-w-0 scroll-mt-24 pb-10"
      aria-labelledby="transmute-tools-heading"
    >
      {/* Unified sticky toolbar: title + pills travel together */}
      <div
        ref={toolbarRef}
        className="tool-browser-sticky sticky z-40 -mx-4 px-4 sm:-mx-6 sm:px-6"
      >
        <div className="tool-browser-toolbar surface-subnav rounded-xl px-4 py-3 sm:px-5">
          <h2
            id="transmute-tools-heading"
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted"
          >
            {t("landing.tools.available")}
          </h2>

          <div className="flex items-center gap-3">
            <div
              ref={tabsScrollRef}
              role="tablist"
              aria-label={t("landing.tools.tabsAria")}
              onKeyDown={handleTabKeyDown}
              className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <TabButton
                tabKey="all"
                active={activeTab === "all"}
                label={t("landing.tools.tabs.all")}
                count={totalActive}
                onSelect={() => selectTab("all")}
              />
              {sections.map((section) => (
                <TabButton
                  key={section.key}
                  tabKey={section.key}
                  active={activeTab === section.key}
                  label={t(`landing.tools.jumpLinks.${section.key}`)}
                  count={section.tools.length}
                  onSelect={() => selectTab(section.key)}
                />
              ))}
            </div>

            <DensityToggle density={density} onChange={setDensity} />
          </div>

          <ToolbarMeta
            activeTab={activeTab}
            totalActive={totalActive}
            filteredCount={filteredCount}
            familyCount={sections.length}
            groupLabel={
              activeTab === "all"
                ? undefined
                : t(`commandPalette.groups.${activeTab}`)
            }
          />
        </div>
      </div>

      {/* Content panel — no transform animation (avoids z-index clash with sticky toolbar) */}
      <div
        ref={panelRef}
        key={density}
        role="tabpanel"
        id="transmute-tools-panel"
        aria-labelledby={`tab-${activeTab}`}
        className="tool-browser-panel relative z-10 mt-6 flex flex-col gap-10"
      >
        {visibleSections.map((section) =>
          renderSection(section, activeTab === "all")
        )}

        {activeTab === "all" && soonTools.length > 0 && (
          <section className="border-t border-border/50 pt-8">
            <SectionDivider label={t("landing.tools.comingSoon")} count={soonTools.length} />
            <ToolListing tools={soonTools} density={density} animateRows={false} />
          </section>
        )}
      </div>
    </section>
  );
}

function SectionDivider({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-3" aria-hidden="true">
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted/50">
        {label}
      </span>
      <div className="h-px min-w-0 flex-1 bg-gradient-to-r from-border/70 to-transparent" />
      <span className="shrink-0 font-mono text-[10px] tabular-nums text-text-muted/40">
        {count}
      </span>
    </div>
  );
}

function ToolbarMeta({
  activeTab,
  totalActive,
  filteredCount,
  familyCount,
  groupLabel,
}: {
  activeTab: ActiveTab;
  totalActive: number;
  filteredCount: number;
  familyCount: number;
  groupLabel?: string;
}) {
  const { t } = useI18n();

  return (
    <p className="mt-3 border-t border-border/50 pt-2.5 text-xs leading-relaxed">
      {activeTab === "all" ? (
        <span className="text-text-muted">
          {t("landing.tools.toolbarMeta.all", {
            count: totalActive,
            families: familyCount,
          })}
        </span>
      ) : (
        <>
          <span className="font-semibold text-text-primary">{groupLabel}</span>
          <span className="text-text-muted">
            {" · "}
            {t("landing.tools.toolbarMeta.filtered", { count: filteredCount })}
          </span>
        </>
      )}
    </p>
  );
}

function TabButton({
  tabKey,
  active,
  label,
  count,
  onSelect,
}: {
  tabKey: ActiveTab;
  active: boolean;
  label: string;
  count: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${tabKey}`}
      data-tab={tabKey}
      aria-selected={active}
      aria-controls="transmute-tools-panel"
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      className={cn(
        "shrink-0 inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
        active
          ? "border-accent/50 bg-accent-subtle/40 text-text-primary shadow-sm shadow-accent/10"
          : "border-border bg-bg-surface text-text-secondary hover:border-accent/25 hover:bg-bg-elevated hover:text-text-primary"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
          active ? "bg-accent/15 text-accent" : "bg-bg-elevated text-text-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function DensityToggle({
  density,
  onChange,
}: {
  density: Density;
  onChange: (next: Density) => void;
}) {
  const { t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("landing.tools.densityAria")}
      className="hidden shrink-0 items-center gap-0.5 rounded-full border border-border bg-bg-surface p-0.5 sm:inline-flex"
    >
      <DensityButton
        active={density === "compact"}
        label={t("landing.tools.density.compact")}
        onClick={() => onChange("compact")}
        icon={
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M2 4h12v1.5H2zM2 7.25h12v1.5H2zM2 10.5h12V12H2z" />
          </svg>
        }
      />
      <DensityButton
        active={density === "detailed"}
        label={t("landing.tools.density.detailed")}
        onClick={() => onChange("detailed")}
        icon={
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M2 2.5h5.5V8H2zM8.5 2.5H14V8H8.5zM2 9h5.5v4.5H2zM8.5 9H14v4.5H8.5z" />
          </svg>
        }
      />
    </div>
  );
}

function DensityButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "bg-bg-elevated text-text-primary"
          : "text-text-muted hover:bg-bg-elevated/60 hover:text-text-primary"
      )}
    >
      <span className="sr-only">{label}</span>
      {icon}
    </button>
  );
}
