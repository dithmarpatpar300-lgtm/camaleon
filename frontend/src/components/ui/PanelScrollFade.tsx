"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const useSyncLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type PanelScrollFadeProps = {
  children: React.ReactNode;
  className?: string;
  /** Tailwind max-height utility for the scroll viewport. */
  maxHeightClass?: string;
  /** Edge fade size in px. */
  fadePx?: number;
  ariaLabel?: string;
};

const EDGE_THRESHOLD = 4; // px tolerance for "at top / at bottom"

/**
 * PanelScrollFade — bounded scroll region for FLOATING GLASS / ACRYLIC panels
 * (command palette, popovers, dropdowns).
 *
 * WHY NOT ScrollVeil HERE:
 * ScrollVeil overlays a tinted gradient band. On a translucent acrylic surface that
 * band reads as a solid rectangle, and the second `backdrop-filter` it needs is
 * rendered by the browser as a hard-edged rectangular region (pointy corners).
 *
 * APPROACH — mask the scroller, not an overlay:
 * We apply a `mask-image` to the scroll viewport itself, fading the content to
 * transparent at whichever edge still has hidden content. The faded pixels reveal
 * the panel's own glass backdrop — so there is NO overlay element, NO extra blur,
 * and NO corner/edge artifacts. The fade also naturally follows the panel shape.
 *
 * The mask is recomputed on scroll (rAF-throttled) and on resize. The synchronous
 * layout-effect sets the initial mask before the first paint.
 */
export function PanelScrollFade({
  children,
  className,
  maxHeightClass = "max-h-[316px]",
  fadePx = 44,
  ariaLabel,
}: PanelScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [hasOverflow, setHasOverflow] = useState(true);

  const applyMask = useCallback(
    (el: HTMLDivElement) => {
      const max = el.scrollHeight - el.clientHeight;
      const overflow = max > EDGE_THRESHOLD;
      const atTop = el.scrollTop <= EDGE_THRESHOLD;
      const atBottom = max - el.scrollTop <= EDGE_THRESHOLD;

      const top = overflow && !atTop ? fadePx : 0;
      const bot = overflow && !atBottom ? fadePx : 0;

      const mask = `linear-gradient(to bottom, transparent 0, #000 ${top}px, #000 calc(100% - ${bot}px), transparent 100%)`;
      el.style.webkitMaskImage = mask;
      el.style.maskImage = mask;

      setHasOverflow(overflow);
    },
    [fadePx]
  );

  const onScroll = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (ref.current) applyMask(ref.current);
    });
  }, [applyMask]);

  useSyncLayoutEffect(() => {
    if (ref.current) applyMask(ref.current);
  }, [applyMask]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      if (ref.current) applyMask(ref.current);
    };

    const viewportRo = new ResizeObserver(onResize);
    viewportRo.observe(el);

    const content = el.firstElementChild;
    const contentRo = content ? new ResizeObserver(onResize) : null;
    if (content && contentRo) contentRo.observe(content);

    return () => {
      el.removeEventListener("scroll", onScroll);
      viewportRo.disconnect();
      contentRo?.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [onScroll, applyMask, children]);

  return (
    <div
      ref={ref}
      role={hasOverflow ? "region" : undefined}
      tabIndex={hasOverflow ? 0 : undefined}
      aria-label={hasOverflow ? ariaLabel : undefined}
      className={cn(
        "overflow-y-auto overscroll-contain",
        maxHeightClass,
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-inset",
        className
      )}
    >
      {children}
    </div>
  );
}
