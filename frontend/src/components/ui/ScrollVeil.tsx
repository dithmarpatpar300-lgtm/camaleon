"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ScrollVeilVariant = "main" | "palette";

type ScrollVeilProps = {
  children: React.ReactNode;
  variant: ScrollVeilVariant;
  className?: string;
};

/**
 * ScrollVeil — fixed-height scrollable region with top and bottom veils.
 *
 * - Bottom veil: shown when content extends below the visible area.
 * - Top veil:    shown when user has scrolled down and content is hidden above.
 * - Both veils use mask-image so there are no hard color edges.
 * - Veil opacity syncs with scroll via rAF — no delay.
 * - Scroll-indicator (main variant only) matches veil state.
 */

const MAX_H: Record<ScrollVeilVariant, string> = {
  // 2 full grid rows (~180 px each + 16 px gap = ~376 px) + ~56 px peek → 432 px
  // Mobile 1-col: 3 cards (~180 px each + 16 px gap = ~556 px) → cap at 440 px
  main:    "max-h-[440px]",
  // 5 rows at ~58 px + 6 px gap ≈ 310 px + 32 px peek → 342 px
  palette: "max-h-[316px]",
};

const VEIL_H: Record<ScrollVeilVariant, string> = {
  main:    "h-24",
  palette: "h-14",
};

const AT_TOP_THRESHOLD    = 20; // px from top → hide top veil
const AT_BOTTOM_THRESHOLD = 20; // px from bottom → hide bottom veil

export function ScrollVeil({ children, variant, className }: ScrollVeilProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const veilTopRef     = useRef<HTMLDivElement>(null);
  const veilBotRef     = useRef<HTMLDivElement>(null);
  const hintRef        = useRef<HTMLDivElement>(null);
  const rafRef         = useRef<number | null>(null);

  // React state for initial render only — after mount we paint via refs
  const [hasOverflow, setHasOverflow] = useState(false);
  const [showTop,     setShowTop]     = useState(false);
  const [showBottom,  setShowBottom]  = useState(false);

  // Paint veil opacities directly on the DOM — zero React render cycle lag.
  const paintVeils = useCallback((el: HTMLDivElement) => {
    const overflow = el.scrollHeight > el.clientHeight + 2;
    const atTop    = el.scrollTop < AT_TOP_THRESHOLD;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < AT_BOTTOM_THRESHOLD;

    const top    = overflow && !atTop;
    const bottom = overflow && !atBottom;

    if (veilTopRef.current)  veilTopRef.current.style.opacity  = top    ? "1" : "0";
    if (veilBotRef.current)  veilBotRef.current.style.opacity  = bottom ? "1" : "0";
    if (hintRef.current)     hintRef.current.style.opacity     = bottom ? "1" : "0";

    // Sync React state for SSR/initial render (won't cause visible flash)
    setHasOverflow(overflow);
    setShowTop(top);
    setShowBottom(bottom);
  }, []);

  const onScroll = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (containerRef.current) paintVeils(containerRef.current);
    });
  }, [paintVeils]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    paintVeils(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => { if (containerRef.current) paintVeils(containerRef.current); });
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [onScroll, paintVeils]);

  return (
    <div className={className}>
      <div className="relative">
        {/* ── Scrollable content ─────────────────────────────────────── */}
        <div
          ref={containerRef}
          role={hasOverflow ? "region" : undefined}
          tabIndex={hasOverflow ? 0 : undefined}
          aria-label={
            variant === "main" && hasOverflow
              ? "Available transmutations, scrollable"
              : undefined
          }
          className={cn(
            "overflow-y-auto overscroll-contain",
            MAX_H[variant],
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-inset"
          )}
        >
          {children}
        </div>

        {/* ── Top veil ───────────────────────────────────────────────── */}
        <div
          ref={veilTopRef}
          aria-hidden="true"
          style={{ opacity: showTop ? 1 : 0 }}
          className={cn(
            `scroll-veil-${variant}-top`,
            "pointer-events-none absolute left-0 right-0 top-0",
            VEIL_H[variant],
            "transition-opacity duration-150 ease-out"
          )}
        />

        {/* ── Bottom veil ────────────────────────────────────────────── */}
        <div
          ref={veilBotRef}
          aria-hidden="true"
          style={{ opacity: showBottom ? 1 : 0 }}
          className={cn(
            `scroll-veil-${variant}-bot`,
            "pointer-events-none absolute bottom-0 left-0 right-0",
            VEIL_H[variant],
            "transition-opacity duration-150 ease-out"
          )}
        />
      </div>

      {/* ── Scroll hint (main only) ─────────────────────────────────── */}
      {variant === "main" && (
        <div
          ref={hintRef}
          aria-hidden="true"
          style={{ opacity: showBottom ? 1 : 0 }}
          className="mt-2 flex items-center justify-end gap-1.5 transition-opacity duration-150 ease-out"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
            scroll
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-2.5 w-2.5 text-text-muted"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06L7.25 11.44V2.75A.75.75 0 0 1 8 2Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
