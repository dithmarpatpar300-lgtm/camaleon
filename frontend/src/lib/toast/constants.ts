/** Fully visible toast slots in the viewport (desktop). */
export const TOAST_MAX_VISIBLE_DESKTOP = 3;

/** Fully visible toast slots on narrow viewports. */
export const TOAST_MAX_VISIBLE_MOBILE = 2;

/** Match Tailwind `sm` — mobile toast cap below this width. */
export const TOAST_MOBILE_MAX_WIDTH_PX = 639;

/** @deprecated Use TOAST_MAX_VISIBLE_DESKTOP or useToastMaxVisible(). */
export const TOAST_MAX_VISIBLE = TOAST_MAX_VISIBLE_DESKTOP;

export function getToastMaxVisibleForViewportWidth(widthPx: number): number {
  return widthPx <= TOAST_MOBILE_MAX_WIDTH_PX
    ? TOAST_MAX_VISIBLE_MOBILE
    : TOAST_MAX_VISIBLE_DESKTOP;
}

/** Auto-dismiss after this duration. */
export const TOAST_DURATION_MS = 4_000;

export const TOAST_ENTER_MS = 220;
export const TOAST_EXIT_MS = 240;

/** Layout tokens — keep in sync with `.toast-viewport` in globals.css */
export const TOAST_GAP_PX = 12;
/** Single-line card height estimate — sync with `.toast-card` padding + one line. */
export const TOAST_SLOT_PX = 52;
/** Max card height with line-clamp (3 lines) — used when queue overflows. */
export const TOAST_SLOT_MAX_PX = 84;
export const TOAST_MESSAGE_MAX_LINES = 3;
export const TOAST_PEEK_PX = 22;
export const TOAST_VEIL_FADE_PX = 28;

/**
 * Viewport cap when queue exceeds maxVisible — null at or below the limit so
 * cards grow with long messages. Uses single-line slot height for the cap so
 * peek/mask kicks in reliably (TOAST_SLOT_MAX_PX is only for line-clamp).
 */
export function toastViewportMaxHeightPx(
  itemCount: number,
  maxVisible: number = TOAST_MAX_VISIBLE_DESKTOP
): number | null {
  if (itemCount <= maxVisible) return null;
  const base = TOAST_SLOT_PX * maxVisible + TOAST_GAP_PX * Math.max(0, maxVisible - 1);
  return base + TOAST_PEEK_PX;
}
