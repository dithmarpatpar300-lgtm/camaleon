"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * `useLayoutEffect` runs synchronously before the browser paints, but it cannot
 * fix the very first paint of the server-rendered HTML (which happens before any
 * JS runs). We therefore also use an *optimistic default* (see below) so the SSR
 * markup already shows the bottom veil. Falls back to `useEffect` on the server.
 */
const useSyncLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type ScrollVeilProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * ScrollVeil — bounded scroll region with top/bottom gradient veils.
 *
 * SCOPE: solid-background **pages** (e.g. the landing tool grid). For floating
 * glass / acrylic panels (command palette, popovers) use `PanelScrollFade` —
 * overlay veils paint a visible band on translucent surfaces.
 *
 * FLASH-FREE FIRST PAINT: the server renders HTML before any JS executes, so the
 * initial markup must already be correct. The bottom veil + scroll hint therefore
 * default to **visible** (these pages reliably overflow). A synchronous
 * layout-effect measurement then corrects the rare no-overflow case before paint.
 */

const MAX_H = "max-h-[440px]";
const VEIL_H = "h-24";

const AT_TOP_THRESHOLD = 20; // px from top → hide top veil
const AT_BOTTOM_THRESHOLD = 20; // px from bottom → hide bottom veil

export function ScrollVeil({ children, className }: ScrollVeilProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const veilTopRef = useRef<HTMLDivElement>(null);
  const veilBotRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Optimistic defaults — bottom veil visible in SSR/initial render (no flash).
  const [hasOverflow, setHasOverflow] = useState(true);
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  // Paint veil opacities directly on the DOM — zero React render cycle lag.
  const paintVeils = useCallback((el: HTMLDivElement) => {
    const overflow = el.scrollHeight > el.clientHeight + 2;
    const atTop = el.scrollTop < AT_TOP_THRESHOLD;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < AT_BOTTOM_THRESHOLD;

    const top = overflow && !atTop;
    const bottom = overflow && !atBottom;

    if (veilTopRef.current) veilTopRef.current.style.opacity = top ? "1" : "0";
    if (veilBotRef.current) veilBotRef.current.style.opacity = bottom ? "1" : "0";
    if (hintRef.current) hintRef.current.style.opacity = bottom ? "1" : "0";

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

  // Synchronous initial measurement — runs before browser paint.
  useSyncLayoutEffect(() => {
    if (containerRef.current) paintVeils(containerRef.current);
  }, [paintVeils]);

  // Scroll listener + ResizeObserver wired after mount.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => {
      if (containerRef.current) paintVeils(containerRef.current);
    });
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
          aria-label={hasOverflow ? "Available transmutations, scrollable" : undefined}
          className={cn(
            "overflow-y-auto overscroll-contain",
            MAX_H,
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
            "scroll-veil-main-top",
            "pointer-events-none absolute left-0 right-0 top-0",
            VEIL_H,
            "transition-opacity duration-150 ease-out"
          )}
        />

        {/* ── Bottom veil ────────────────────────────────────────────── */}
        <div
          ref={veilBotRef}
          aria-hidden="true"
          style={{ opacity: showBottom ? 1 : 0 }}
          className={cn(
            "scroll-veil-main-bot",
            "pointer-events-none absolute bottom-0 left-0 right-0",
            VEIL_H,
            "transition-opacity duration-150 ease-out"
          )}
        />
      </div>

      {/* ── Scroll hint ─────────────────────────────────────────────── */}
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
    </div>
  );
}
