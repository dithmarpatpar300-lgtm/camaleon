"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useOverlayScrollbar } from "@/hooks/useOverlayScrollbar";
import { syncOverlayScrollClass } from "@/lib/prefs";
import { useTheme } from "@/providers/ThemeProvider";
import { subscribeScrollLock } from "@/lib/scroll-lock";

const TRACK_PAD_V = 8;
const THUMB_RIGHT = 5;
const MIN_THUMB_H = 40;

/**
 * Scrollbar Camaleón — floating overlay scrollbar for desktop.
 * Hidden while a modal holds the scroll lock (Command Palette, shortcuts, etc.).
 *
 * Thumb position is painted imperatively (transform) — not via React state —
 * to keep drag aligned with native scrollbar responsiveness.
 */
export function OverlayScrollbar() {
  const [eligible, setEligible] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(false);
  const { state, handlers, thumbRef } = useOverlayScrollbar();
  const { theme } = useTheme();

  useLayoutEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setEligible(syncOverlayScrollClass());
    };

    update();
    finePointer.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      finePointer.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => subscribeScrollLock(setScrollLocked), []);

  if (!eligible || scrollLocked) return null;
  if (!state.hasOverflow) return null;

  const isDark = theme === "dark";
  const { visibility } = state;

  const THUMB_W_IDLE = 2;
  const THUMB_W_ACTIVE = 6;
  const thumbW = visibility === "active" ? THUMB_W_ACTIVE : THUMB_W_IDLE;

  const thumbColorIdle = isDark ? "rgba(155,161,168,0.35)" : "rgba(107,107,107,0.30)";
  const thumbColorActive = isDark ? "rgba(34,197,94,0.65)" : "rgba(22,163,74,0.60)";
  const trackBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  const thumbColor = visibility === "active" ? thumbColorActive : thumbColorIdle;
  const thumbOpacity = visibility === "active" ? 1 : visibility === "idle" ? 0.75 : 0;
  const trackOpacity = visibility === "active" ? 1 : 0;

  const appearTransition = "opacity 250ms ease, width 200ms ease, background-color 200ms ease";

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
          top: TRACK_PAD_V,
          bottom: TRACK_PAD_V,
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
          top: 0,
          right: THUMB_RIGHT,
          height: MIN_THUMB_H,
          width: thumbW,
          borderRadius: 9999,
          backgroundColor: thumbColor,
          opacity: thumbOpacity,
          transition: appearTransition,
          cursor: "default",
          touchAction: "none",
          willChange: "transform, height",
        }}
      />
    </div>
  );
}
