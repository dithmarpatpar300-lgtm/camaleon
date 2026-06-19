/** Fully visible toast slots in the viewport. */
export const TOAST_MAX_VISIBLE = 3;

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
 * Viewport cap when 4+ toasts queue — null for 1–3 toasts so cards grow with content.
 */
export function toastViewportMaxHeightPx(itemCount: number): number | null {
  if (itemCount <= TOAST_MAX_VISIBLE) return null;
  const base =
    TOAST_SLOT_MAX_PX * TOAST_MAX_VISIBLE + TOAST_GAP_PX * (TOAST_MAX_VISIBLE - 1);
  return base + TOAST_PEEK_PX;
}
