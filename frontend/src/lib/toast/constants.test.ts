import { describe, expect, it } from "vitest";
import {
  TOAST_GAP_PX,
  TOAST_MAX_VISIBLE_DESKTOP,
  TOAST_MAX_VISIBLE_MOBILE,
  TOAST_MOBILE_MAX_WIDTH_PX,
  TOAST_PEEK_PX,
  TOAST_SLOT_PX,
  getToastMaxVisibleForViewportWidth,
  toastViewportMaxHeightPx,
} from "./constants";

describe("toast constants", () => {
  it("picks mobile vs desktop max visible by viewport width", () => {
    expect(getToastMaxVisibleForViewportWidth(TOAST_MOBILE_MAX_WIDTH_PX)).toBe(
      TOAST_MAX_VISIBLE_MOBILE
    );
    expect(getToastMaxVisibleForViewportWidth(TOAST_MOBILE_MAX_WIDTH_PX + 1)).toBe(
      TOAST_MAX_VISIBLE_DESKTOP
    );
  });

  it("does not cap viewport height at or below the visible limit", () => {
    expect(toastViewportMaxHeightPx(1, TOAST_MAX_VISIBLE_DESKTOP)).toBeNull();
    expect(toastViewportMaxHeightPx(3, TOAST_MAX_VISIBLE_DESKTOP)).toBeNull();
    expect(toastViewportMaxHeightPx(2, TOAST_MAX_VISIBLE_MOBILE)).toBeNull();
  });

  it("caps viewport with peek when queue exceeds desktop limit", () => {
    const threeSlots =
      TOAST_SLOT_PX * TOAST_MAX_VISIBLE_DESKTOP +
      TOAST_GAP_PX * (TOAST_MAX_VISIBLE_DESKTOP - 1);
    expect(toastViewportMaxHeightPx(4, TOAST_MAX_VISIBLE_DESKTOP)).toBe(
      threeSlots + TOAST_PEEK_PX
    );
  });

  it("caps viewport when queue exceeds mobile limit", () => {
    const twoSlots =
      TOAST_SLOT_PX * TOAST_MAX_VISIBLE_MOBILE + TOAST_GAP_PX * (TOAST_MAX_VISIBLE_MOBILE - 1);
    expect(toastViewportMaxHeightPx(3, TOAST_MAX_VISIBLE_MOBILE)).toBe(twoSlots + TOAST_PEEK_PX);
  });
});
