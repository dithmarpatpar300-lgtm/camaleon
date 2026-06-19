import { describe, expect, it } from "vitest";
import {
  TOAST_GAP_PX,
  TOAST_MAX_VISIBLE,
  TOAST_PEEK_PX,
  TOAST_SLOT_MAX_PX,
  toastViewportMaxHeightPx,
} from "./constants";

describe("toast constants", () => {
  it("does not cap viewport height for three or fewer toasts", () => {
    expect(toastViewportMaxHeightPx(1)).toBeNull();
    expect(toastViewportMaxHeightPx(3)).toBeNull();
  });

  it("caps viewport with peek band when a fourth toast is queued", () => {
    const threeSlots =
      TOAST_SLOT_MAX_PX * TOAST_MAX_VISIBLE + TOAST_GAP_PX * (TOAST_MAX_VISIBLE - 1);
    expect(toastViewportMaxHeightPx(4)).toBe(threeSlots + TOAST_PEEK_PX);
  });
});
