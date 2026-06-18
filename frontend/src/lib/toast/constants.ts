/** Fully visible toast slots in the viewport. */
export const TOAST_MAX_VISIBLE = 3;

/** Auto-dismiss after this duration. */
export const TOAST_DURATION_MS = 4_000;

export const TOAST_ENTER_MS = 220;
export const TOAST_EXIT_MS = 240;

/** Layout tokens — keep in sync with `.toast-viewport` in globals.css */
export const TOAST_GAP_PX = 12;
export const TOAST_SLOT_PX = 52;
export const TOAST_PEEK_PX = 22;
export const TOAST_VEIL_FADE_PX = 28;

/** Viewport cap for the current queue — peek band only when a 4th+ toast is queued. */
export function toastViewportMaxHeightPx(itemCount: number): number {
  const slots = Math.min(Math.max(itemCount, 1), TOAST_MAX_VISIBLE);
  const base = TOAST_SLOT_PX * slots + TOAST_GAP_PX * Math.max(0, slots - 1);
  const peek = itemCount > TOAST_MAX_VISIBLE ? TOAST_PEEK_PX : 0;
  return base + peek;
}
