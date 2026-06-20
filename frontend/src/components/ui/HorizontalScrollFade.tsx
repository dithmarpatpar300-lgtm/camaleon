"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type Ref } from "react";
import { cn } from "@/lib/utils";

const useSyncLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type HorizontalScrollFadeProps = {
  children: React.ReactNode;
  className?: string;
  /** Edge fade size in px. */
  fadePx?: number;
  ariaLabel?: string;
  viewportRef?: Ref<HTMLDivElement>;
};

const EDGE_THRESHOLD = 4;

/**
 * HorizontalScrollFade — mask-based left/right peek for overflow-x rows (tool family tabs).
 * Same approach as PanelScrollFade: mask the scroller, no overlay band.
 */
export function HorizontalScrollFade({
  children,
  className,
  fadePx = 28,
  ariaLabel,
  viewportRef,
}: HorizontalScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const applyMask = useCallback(
    (el: HTMLDivElement) => {
      const max = el.scrollWidth - el.clientWidth;
      const overflow = max > EDGE_THRESHOLD;
      const atStart = el.scrollLeft <= EDGE_THRESHOLD;
      const atEnd = max - el.scrollLeft <= EDGE_THRESHOLD;

      const left = overflow && !atStart ? fadePx : 0;
      const right = overflow && !atEnd ? fadePx : 0;

      const mask = `linear-gradient(to right, transparent 0, #000 ${left}px, #000 calc(100% - ${right}px), transparent 100%)`;
      el.style.webkitMaskImage = mask;
      el.style.maskImage = mask;
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

  const setViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      if (typeof viewportRef === "function") {
        viewportRef(node);
      } else if (viewportRef) {
        viewportRef.current = node;
      }
    },
    [viewportRef]
  );

  return (
    <div
      ref={setViewportRef}
      aria-label={ariaLabel}
      className={cn(
        "min-w-0 overflow-x-auto overscroll-x-contain",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
