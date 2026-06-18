import { TOAST_GAP_PX, TOAST_MAX_VISIBLE, TOAST_PEEK_PX } from "./constants";

function sumHeights(heights: number[], startIndex: number, count: number): number {
  const slice = heights.slice(startIndex, startIndex + count);
  if (slice.length === 0) return 0;
  return slice.reduce((sum, h, index) => sum + h + (index > 0 ? TOAST_GAP_PX : 0), 0);
}

/** Fit visible cards + optional peek band from measured DOM heights. */
export function computeToastViewportMaxHeight(
  heights: number[],
  itemCount: number
): number {
  if (heights.length === 0) return 0;

  if (itemCount <= TOAST_MAX_VISIBLE) {
    return sumHeights(heights, 0, heights.length);
  }

  const visibleStart = Math.max(0, heights.length - TOAST_MAX_VISIBLE);
  return sumHeights(heights, visibleStart, TOAST_MAX_VISIBLE) + TOAST_PEEK_PX;
}
