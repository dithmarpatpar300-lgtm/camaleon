import { describe, expect, it } from "vitest";
import { isOfflinePromoSnoozed } from "./offline-promo-storage";

describe("offline-promo-storage", () => {
  it("treats future snooze as active", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isOfflinePromoSnoozed(future)).toBe(true);
  });

  it("clears expired snooze", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(isOfflinePromoSnoozed(past)).toBe(false);
  });

  it("handles missing snooze", () => {
    expect(isOfflinePromoSnoozed(null)).toBe(false);
    expect(isOfflinePromoSnoozed(undefined)).toBe(false);
  });
});
