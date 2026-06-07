"use client";

import { useEffect, useState } from "react";
import { useOverlayScrollbar } from "@/hooks/useOverlayScrollbar";
import { useTheme } from "@/providers/ThemeProvider";

/**
 * Scrollbar Camaleón — floating overlay scrollbar for desktop.
 *
 * Three visual states:
 *  hidden  → fully transparent (long inactivity)
 *  idle    → ultra-thin (2 px), muted color — always visible when overflow exists
 *  active  → wider (6 px), accent color — during scroll / hover / drag
 *
 * The native scrollbar is hidden via CSS (camaleon-overlay-scroll class on <html>),
 * so the viewport width stays constant whether or not the page overflows.
 *
 * Only activates on fine-pointer devices without prefers-reduced-motion.
 * Touch devices keep the OS native scrollbar (already overlay on iOS/Android).
 */
export function OverlayScrollbar() {
  const [eligible, setEligible] = useState(false);
  const { state, handlers } = useOverlayScrollbar();
  const { theme } = useTheme();

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEligible(finePointer.matches && !reducedMotion.matches);
  }, []);

  // Never render on touch devices / reduced-motion users
  if (!eligible) return null;
  // No overflow → nothing to scroll, hide entirely
  if (!state.hasOverflow) return null;

  const isDark = theme === "dark";
  const { visibility, dragging } = state;

  // ── Widths ──────────────────────────────────────────────────────────────
  // hidden → same as idle (keeps DOM stable; opacity hides it)
  const THUMB_W_IDLE   = 2;
  const THUMB_W_ACTIVE = 6;
  const thumbW = visibility === "active" ? THUMB_W_ACTIVE : THUMB_W_IDLE;

  // ── Colors ───────────────────────────────────────────────────────────────
  const thumbColorIdle   = isDark ? "rgba(155,161,168,0.35)" : "rgba(107,107,107,0.30)";
  const thumbColorActive = isDark ? "rgba(34,197,94,0.65)"   : "rgba(22,163,74,0.60)";
  const trackBg          = isDark ? "rgba(255,255,255,0.04)"  : "rgba(0,0,0,0.04)";

  const thumbColor = visibility === "active" ? thumbColorActive : thumbColorIdle;

  // ── Opacity ──────────────────────────────────────────────────────────────
  // idle   → subtle but always visible (0.75 so it doesn't distract)
  // active → fully opaque
  // hidden → zero
  const thumbOpacity = visibility === "active" ? 1 : visibility === "idle" ? 0.75 : 0;
  const trackOpacity = visibility === "active" ? 1 : 0;

  // ── Transitions ──────────────────────────────────────────────────────────
  // No position transition while dragging (instant follow); smooth otherwise.
  const positionTransition = dragging ? "none" : "top 60ms linear";
  const appearTransition = "opacity 250ms ease, width 200ms ease, background-color 200ms ease";
  const thumbTransition = dragging ? positionTransition : `${positionTransition}, ${appearTransition}`;

  // Right offset: center thin (2px) and wide (6px) on the same visual axis
  const THUMB_RIGHT = 5; // px from right edge of viewport

  return (
    /*
     * Outer hit area — 20 px wide so hovering near the edge is easy.
     * pointer-events are intentionally active here so the user can hover
     * near the edge to trigger active state without precise aim.
     */
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
      {/* Track — subtle full-height background, only visible when active */}
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

      {/* Thumb */}
      <div
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
          transition: thumbTransition,
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
          willChange: "top",
        }}
      />
    </div>
  );
}
