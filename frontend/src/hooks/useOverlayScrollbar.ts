"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const MIN_THUMB_H = 40;
const TRACK_PAD_V = 8;
const DEACTIVATE_DELAY_MS = 1000;
const HIDE_DELAY_MS = 5000;

export type ScrollbarVisibility = "active" | "idle" | "hidden";

export interface OverlayScrollbarState {
  thumbTop: number;
  thumbHeight: number;
  hasOverflow: boolean;
  visibility: ScrollbarVisibility;
  dragging: boolean;
}

export interface OverlayScrollbarHandlers {
  onThumbPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onTrackPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onTrackMouseEnter: () => void;
  onTrackMouseLeave: () => void;
}

function computeThumb(): { thumbTop: number; thumbHeight: number; hasOverflow: boolean } {
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
  const thumbT = TRACK_PAD_V + (maxScroll > 0 ? (scrollTop / maxScroll) * (trackH - thumbH) : 0);

  return { thumbTop: thumbT, thumbHeight: thumbH, hasOverflow: true };
}

/** Apply thumb geometry directly to the DOM — zero React render lag. */
function paintThumb(el: HTMLDivElement | null, g: ReturnType<typeof computeThumb>) {
  if (!el) return;
  el.style.top = `${g.thumbTop}px`;
  el.style.height = `${g.thumbHeight}px`;
}

export function useOverlayScrollbar(): {
  state: OverlayScrollbarState;
  handlers: OverlayScrollbarHandlers;
  thumbRef: React.RefObject<HTMLDivElement | null>;
} {
  const thumbRef = useRef<HTMLDivElement | null>(null);

  const [state, setState] = useState<OverlayScrollbarState>({
    thumbTop: TRACK_PAD_V,
    thumbHeight: MIN_THUMB_H,
    hasOverflow: false,
    visibility: "hidden",
    dragging: false,
  });

  const deactivateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null);
  const isDraggingRef = useRef(false);
  const thumbHRef = useRef(MIN_THUMB_H);
  const hasOverflowRef = useRef(false);

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

  const applyGeometry = useCallback((makeActive = false) => {
    const g = computeThumb();
    thumbHRef.current = g.thumbHeight;
    hasOverflowRef.current = g.hasOverflow;
    paintThumb(thumbRef.current, g);
    setState((s) => ({
      ...s,
      ...g,
      ...(makeActive ? { visibility: "active" as ScrollbarVisibility } : {}),
      ...(!g.hasOverflow ? { visibility: "hidden" as ScrollbarVisibility } : {}),
    }));
  }, []);

  useEffect(() => {
    const g = computeThumb();
    thumbHRef.current = g.thumbHeight;
    hasOverflowRef.current = g.hasOverflow;
    paintThumb(thumbRef.current, g);
    setState((s) => ({
      ...s,
      ...g,
      visibility: g.hasOverflow ? "idle" : "hidden",
    }));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const g = computeThumb();
      thumbHRef.current = g.thumbHeight;
      hasOverflowRef.current = g.hasOverflow;
      paintThumb(thumbRef.current, g);
      setState((s) => ({
        ...s,
        thumbTop: g.thumbTop,
        thumbHeight: g.thumbHeight,
        hasOverflow: g.hasOverflow,
        visibility: g.hasOverflow ? "active" : "hidden",
      }));
      scheduleDeactivate();
    };

    const onResize = () => applyGeometry();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => applyGeometry());
      ro.observe(document.body);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      clearTimers();
    };
  }, [applyGeometry, scheduleDeactivate, clearTimers]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const el = document.documentElement;
      const scrollH = el.scrollHeight;
      const vpH = window.innerHeight;
      const trackH = vpH - TRACK_PAD_V * 2;
      const thumbH = thumbHRef.current;
      const maxScroll = scrollH - vpH;
      const thumbTrackH = trackH - thumbH;
      if (thumbTrackH <= 0) return;
      const delta = e.clientY - dragRef.current.startY;
      const newTop = dragRef.current.startScrollTop + delta * (maxScroll / thumbTrackH);
      el.scrollTop = Math.max(0, Math.min(maxScroll, newTop));
      const g = computeThumb();
      paintThumb(thumbRef.current, g);
      setState((s) => ({
        ...s,
        thumbTop: g.thumbTop,
        thumbHeight: g.thumbHeight,
      }));
    };

    const onPointerUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      isDraggingRef.current = false;
      setState((s) => ({ ...s, dragging: false }));
      scheduleDeactivate();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [scheduleDeactivate]);

  const onThumbPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startY: e.clientY,
      startScrollTop: document.documentElement.scrollTop,
    };
    isDraggingRef.current = true;
    setActive();
    setState((s) => ({ ...s, dragging: true }));
  }, [setActive]);

  const onTrackPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.role === "scrollThumb") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const yInTrack = e.clientY - rect.top;
    const usableTop = TRACK_PAD_V;
    const usableBottom = rect.height - TRACK_PAD_V;
    if (yInTrack < usableTop || yInTrack > usableBottom) return;
    const ratio = (yInTrack - TRACK_PAD_V) / (rect.height - TRACK_PAD_V * 2);
    const el = document.documentElement;
    const maxScroll = el.scrollHeight - window.innerHeight;
    el.scrollTop = Math.max(0, Math.min(maxScroll, ratio * maxScroll));
    const g = computeThumb();
    paintThumb(thumbRef.current, g);
    setState((s) => ({ ...s, ...g, visibility: "active" }));
    setActive();
    scheduleDeactivate();
  }, [setActive, scheduleDeactivate]);

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
