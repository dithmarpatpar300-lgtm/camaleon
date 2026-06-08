"use client";

import { useEffect, useState } from "react";
import { useOverlayScrollbar } from "@/hooks/useOverlayScrollbar";
import { useTheme } from "@/providers/ThemeProvider";
import { subscribeScrollLock } from "@/lib/scroll-lock";

/**
 * Scrollbar Camaleón — floating overlay scrollbar for desktop.
 * Hidden while a modal holds the scroll lock (Command Palette, shortcuts, etc.).
 */
export function OverlayScrollbar() {
  const [eligible, setEligible] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(false);
  const { state, handlers, thumbRef } = useOverlayScrollbar();
  const { theme } = useTheme();

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEligible(finePointer.matches && !reducedMotion.matches);
  }, []);

  useEffect(() => subscribeScrollLock(setScrollLocked), []);

  if (!eligible || scrollLocked) return null;
  if (!state.hasOverflow) return null;

  const isDark = theme === "dark";
  const { visibility, dragging } = state;

  const THUMB_W_IDLE = 2;
  const THUMB_W_ACTIVE = 6;
  const thumbW = visibility === "active" ? THUMB_W_ACTIVE : THUMB_W_IDLE;

  const thumbColorIdle = isDark ? "rgba(155,161,168,0.35)" : "rgba(107,107,107,0.30)";
  const thumbColorActive = isDark ? "rgba(34,197,94,0.65)" : "rgba(22,163,74,0.60)";
  const trackBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  const thumbColor = visibility === "active" ? thumbColorActive : thumbColorIdle;
  const thumbOpacity = visibility === "active" ? 1 : visibility === "idle" ? 0.75 : 0;
  const trackOpacity = visibility === "active" ? 1 : 0;

  // Position (top/height) is painted via ref — no CSS transition on position.
  const appearTransition = "opacity 250ms ease, width 200ms ease, background-color 200ms ease";

  const THUMB_RIGHT = 5;

  return (
    <div
      onPointerDown={handlers.onTrackPointerDown}
      onMouseEnter={handlers.onTrackMouseEnter}
      onMouseLeave={handlers.onTrackMouseLeave}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 20,
        height: "100dvh",
        zIndex: 9999,
        cursor: "default",
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          bottom: 8,
          right: THUMB_RIGHT,
          width: thumbW,
          borderRadius: 9999,
          backgroundColor: trackBg,
          opacity: trackOpacity,
          transition: appearTransition,
          pointerEvents: "none",
        }}
      />

      <div
        ref={thumbRef}
        data-role="scrollThumb"
        onPointerDown={handlers.onThumbPointerDown}
        style={{
          position: "absolute",
          right: THUMB_RIGHT,
          top: state.thumbTop,
          height: state.thumbHeight,
          width: thumbW,
          borderRadius: 9999,
          backgroundColor: thumbColor,
          opacity: thumbOpacity,
          transition: appearTransition,
          cursor: "default",
          touchAction: "none",
          willChange: "top, height",
        }}
      />
    </div>
  );
}
