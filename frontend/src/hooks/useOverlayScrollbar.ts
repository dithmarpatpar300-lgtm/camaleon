"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  beginInstantDocumentScroll,
  endInstantDocumentScroll,
  scrollDocumentInstant,
} from "@/lib/overlay-scroll/instant-scroll";

const MIN_THUMB_H = 40;
const TRACK_PAD_V = 8;
const DEACTIVATE_DELAY_MS = 1000;
const HIDE_DELAY_MS = 5000;

export type ScrollbarVisibility = "active" | "idle" | "hidden";

export interface OverlayScrollbarState {
  hasOverflow: boolean;
  visibility: ScrollbarVisibility;
}

export interface OverlayScrollbarHandlers {
  onThumbPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onTrackPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onTrackMouseEnter: () => void;
  onTrackMouseLeave: () => void;
}

type ThumbGeometry = {
  thumbTop: number;
  thumbHeight: number;
  hasOverflow: boolean;
};

type DragState = {
  /** Pointer Y offset inside the thumb — native grab-point preservation. */
  pointerOffsetY: number;
};

function computeThumb(): ThumbGeometry {
  const el = document.documentElement;
  const scrollH = el.scrollHeight;
  const vpH = window.innerHeight;
  const scrollTop = el.scrollTop;
  const hasOverflow = scrollH > vpH + 2;

  if (!hasOverflow) {
    return { thumbTop: TRACK_PAD_V, thumbHeight: MIN_THUMB_H, hasOverflow: false };
  }

  const trackH = vpH - TRACK_PAD_V * 2;
  const ratio = vpH / scrollH;
  const thumbH = Math.max(MIN_THUMB_H, Math.floor(trackH * ratio));
  const maxScroll = scrollH - vpH;
  const thumbT =
    TRACK_PAD_V + (maxScroll > 0 ? (scrollTop / maxScroll) * (trackH - thumbH) : 0);

  return { thumbTop: thumbT, thumbHeight: thumbH, hasOverflow: true };
}

/** Imperative thumb paint — position never flows through React state. */
function paintThumb(el: HTMLDivElement | null, g: ThumbGeometry) {
  if (!el) return;
  el.style.transform = `translate3d(0, ${g.thumbTop}px, 0)`;
  el.style.height = `${g.thumbHeight}px`;
}

function scrollFromPointerY(clientY: number, pointerOffsetY: number, thumbH: number) {
  const el = document.documentElement;
  const vpH = window.innerHeight;
  const scrollH = el.scrollHeight;
  const trackH = vpH - TRACK_PAD_V * 2;
  const thumbTrackH = trackH - thumbH;
  if (thumbTrackH <= 0) return;

  const maxScroll = scrollH - vpH;
  const pointerYInTrack = clientY - TRACK_PAD_V - pointerOffsetY;
  const ratio = Math.max(0, Math.min(1, pointerYInTrack / thumbTrackH));
  scrollDocumentInstant(ratio * maxScroll);
}

export function useOverlayScrollbar(): {
  state: OverlayScrollbarState;
  handlers: OverlayScrollbarHandlers;
  thumbRef: React.RefObject<HTMLDivElement | null>;
} {
  const thumbRef = useRef<HTMLDivElement | null>(null);

  const [state, setState] = useState<OverlayScrollbarState>({
    hasOverflow: false,
    visibility: "hidden",
  });

  const deactivateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const isDraggingRef = useRef(false);
  const thumbHRef = useRef(MIN_THUMB_H);
  const hasOverflowRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pendingClientYRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (deactivateTimerRef.current) clearTimeout(deactivateTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const scheduleDeactivate = useCallback(() => {
    if (isDraggingRef.current) return;
    clearTimers();
    deactivateTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current) {
        setState((s) => ({ ...s, visibility: "idle" }));
        hideTimerRef.current = setTimeout(() => {
          if (!isDraggingRef.current) {
            setState((s) => ({ ...s, visibility: "hidden" }));
          }
        }, HIDE_DELAY_MS);
      }
    }, DEACTIVATE_DELAY_MS);
  }, [clearTimers]);

  const setActive = useCallback(() => {
    clearTimers();
    setState((s) => ({ ...s, visibility: "active" }));
  }, [clearTimers]);

  const syncGeometry = useCallback(
    (opts?: { makeActive?: boolean; hideIfNoOverflow?: boolean }) => {
      const g = computeThumb();
      thumbHRef.current = g.thumbHeight;
      hasOverflowRef.current = g.hasOverflow;
      paintThumb(thumbRef.current, g);
      setState((s) => ({
        ...s,
        hasOverflow: g.hasOverflow,
        ...(opts?.makeActive ? { visibility: "active" as ScrollbarVisibility } : {}),
        ...(opts?.hideIfNoOverflow && !g.hasOverflow
          ? { visibility: "hidden" as ScrollbarVisibility }
          : {}),
      }));
    },
    []
  );

  const flushDragFrame = useCallback(() => {
    rafRef.current = null;
    const drag = dragRef.current;
    const clientY = pendingClientYRef.current;
    if (!drag || clientY == null) return;

    scrollFromPointerY(clientY, drag.pointerOffsetY, thumbHRef.current);
    paintThumb(thumbRef.current, computeThumb());
  }, []);

  const queueDragFrame = useCallback(
    (clientY: number) => {
      pendingClientYRef.current = clientY;
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(flushDragFrame);
    },
    [flushDragFrame]
  );

  const endDrag = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    isDraggingRef.current = false;
    pendingClientYRef.current = null;
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    endInstantDocumentScroll();
    syncGeometry({ makeActive: true });
    scheduleDeactivate();
  }, [scheduleDeactivate, syncGeometry]);

  useEffect(() => {
    syncGeometry({ hideIfNoOverflow: true });
    if (hasOverflowRef.current) {
      setState((s) => ({ ...s, visibility: "idle" }));
    }
  }, [syncGeometry]);

  useEffect(() => {
    const onScroll = () => {
      if (isDraggingRef.current) return;
      const g = computeThumb();
      thumbHRef.current = g.thumbHeight;
      hasOverflowRef.current = g.hasOverflow;
      paintThumb(thumbRef.current, g);
      setState((s) => ({
        ...s,
        hasOverflow: g.hasOverflow,
        visibility: g.hasOverflow ? "active" : "hidden",
      }));
      scheduleDeactivate();
    };

    const onResize = () => syncGeometry();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => syncGeometry());
      ro.observe(document.body);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      clearTimers();
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      endInstantDocumentScroll();
    };
  }, [syncGeometry, scheduleDeactivate, clearTimers]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      queueDragFrame(e.clientY);
    };

    const onPointerUp = () => endDrag();
    const onPointerCancel = () => endDrag();

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [endDrag, queueDragFrame]);

  const onThumbPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const thumbEl = thumbRef.current;
      if (!thumbEl) return;

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const thumbRect = thumbEl.getBoundingClientRect();
      dragRef.current = {
        pointerOffsetY: e.clientY - thumbRect.top,
      };
      isDraggingRef.current = true;
      beginInstantDocumentScroll();
      setActive();
    },
    [setActive]
  );

  const onTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).dataset.role === "scrollThumb") return;
      const rect = e.currentTarget.getBoundingClientRect();
      const yInTrack = e.clientY - rect.top;
      if (yInTrack < TRACK_PAD_V || yInTrack > rect.height - TRACK_PAD_V) return;

      beginInstantDocumentScroll();
      const ratio = (yInTrack - TRACK_PAD_V) / (rect.height - TRACK_PAD_V * 2);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollDocumentInstant(ratio * maxScroll);
      paintThumb(thumbRef.current, computeThumb());
      setActive();
      endInstantDocumentScroll();
      scheduleDeactivate();
    },
    [setActive, scheduleDeactivate]
  );

  const onTrackMouseEnter = useCallback(() => {
    if (!hasOverflowRef.current) return;
    setActive();
  }, [setActive]);

  const onTrackMouseLeave = useCallback(() => {
    if (isDraggingRef.current) return;
    scheduleDeactivate();
  }, [scheduleDeactivate]);

  return {
    state,
    handlers: {
      onThumbPointerDown,
      onTrackPointerDown,
      onTrackMouseEnter,
      onTrackMouseLeave,
    },
    thumbRef,
  };
}
