import { describe, expect, it } from "vitest";
import { TOAST_GAP_PX, TOAST_MAX_VISIBLE, TOAST_PEEK_PX } from "./constants";
import { computeToastViewportMaxHeight } from "./viewport-height";

describe("computeToastViewportMaxHeight", () => {
  it("sums all card heights when three or fewer toasts", () => {
    expect(computeToastViewportMaxHeight([52, 72], 2)).toBe(52 + TOAST_GAP_PX + 72);
  });

  it("caps to the last three cards plus peek when queued", () => {
    const heights = [40, 52, 60, 72];
    expect(computeToastViewportMaxHeight(heights, 4)).toBe(
      52 + TOAST_GAP_PX + 60 + TOAST_GAP_PX + 72 + TOAST_PEEK_PX
    );
  });

  it("returns zero for an empty stack", () => {
    expect(computeToastViewportMaxHeight([], 0)).toBe(0);
  });

  it("uses only visible slots when more than max visible", () => {
    const heights = Array.from({ length: TOAST_MAX_VISIBLE + 2 }, () => 50);
    const expected =
      50 * TOAST_MAX_VISIBLE + TOAST_GAP_PX * (TOAST_MAX_VISIBLE - 1) + TOAST_PEEK_PX;
    expect(computeToastViewportMaxHeight(heights, heights.length)).toBe(expected);
  });
});
