"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  TOAST_MAX_VISIBLE,
  TOAST_VEIL_FADE_PX,
  toastViewportMaxHeightPx,
} from "@/lib/toast";

const useSyncLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type ToastViewportProps = {
  children: ReactNode;
  itemCount: number;
  className?: string;
};

const EDGE_THRESHOLD = 2;

/**
 * Bounded toast column anchored to the bottom of the stack.
 * Shows up to TOAST_MAX_VISIBLE full cards; additional queued toasts peek
 * through a top mask (PanelScrollFade-style — no overlay rectangle).
 */
export function ToastViewport({ children, itemCount, className }: ToastViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const scrollToBottom = useCallback((el: HTMLDivElement) => {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }, []);

  const applyMask = useCallback((viewport: HTMLDivElement, count: number) => {
    const max = viewport.scrollHeight - viewport.clientHeight;
    const clipped = max > EDGE_THRESHOLD;
    const shouldPeek = count > TOAST_MAX_VISIBLE && clipped;

    if (!shouldPeek) {
      viewport.style.webkitMaskImage = "none";
      viewport.style.maskImage = "none";
      setHasOverflow(false);
      return;
    }

    const mask = `linear-gradient(to bottom, transparent 0, #000 ${TOAST_VEIL_FADE_PX}px, #000 100%)`;
    viewport.style.webkitMaskImage = mask;
    viewport.style.maskImage = mask;
    setHasOverflow(true);
  }, []);

  const syncViewport = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (itemCount > TOAST_MAX_VISIBLE) {
      scrollToBottom(viewport);
    } else {
      viewport.scrollTop = 0;
    }
    applyMask(viewport, itemCount);
  }, [applyMask, itemCount, scrollToBottom]);

  useSyncLayoutEffect(() => {
    syncViewport();
  }, [syncViewport, itemCount, children]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport) return;

    const schedule = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        syncViewport();
      });
    };

    const viewportRo = new ResizeObserver(schedule);
    viewportRo.observe(viewport);
    const contentRo = content ? new ResizeObserver(schedule) : null;
    if (content && contentRo) contentRo.observe(content);

    const host = viewport.closest(
      ".floating-notices-bottom-host, .floating-notices-top-host"
    );
    const hostMo =
      host &&
      new MutationObserver(() => {
        schedule();
      });
    if (host && hostMo) {
      hostMo.observe(host, { attributes: true, attributeFilter: ["popover"] });
    }

    return () => {
      viewportRo.disconnect();
      contentRo?.disconnect();
      hostMo?.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [syncViewport]);

  const maxHeightPx = toastViewportMaxHeightPx(itemCount);

  return (
    <div
      className={cn("toast-viewport-shell", className)}
      data-toast-overflow={hasOverflow ? "true" : "false"}
      data-toast-queued={itemCount > TOAST_MAX_VISIBLE ? "true" : "false"}
    >
      <div
        ref={viewportRef}
        className="toast-viewport"
        style={{ maxHeight: `${maxHeightPx}px` }}
        aria-live="polite"
        aria-relevant="additions removals"
      >
        <div ref={contentRef} className="toast-viewport__content">
          {children}
        </div>
      </div>
    </div>
  );
}
