import { describe, expect, it } from "vitest";
import {
  TOAST_GAP_PX,
  TOAST_MAX_VISIBLE,
  TOAST_PEEK_PX,
  TOAST_SLOT_PX,
  toastViewportMaxHeightPx,
} from "./constants";

describe("toast constants", () => {
  it("sizes viewport to one slot for a single toast", () => {
    expect(toastViewportMaxHeightPx(1)).toBe(TOAST_SLOT_PX);
  });

  it("adds peek band only when a fourth toast is queued", () => {
    const threeSlots =
      TOAST_SLOT_PX * TOAST_MAX_VISIBLE + TOAST_GAP_PX * (TOAST_MAX_VISIBLE - 1);
    expect(toastViewportMaxHeightPx(3)).toBe(threeSlots);
    expect(toastViewportMaxHeightPx(4)).toBe(threeSlots + TOAST_PEEK_PX);
  });
});
