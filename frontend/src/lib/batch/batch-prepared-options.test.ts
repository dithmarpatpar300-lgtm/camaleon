import { describe, expect, it } from "vitest";
import { batchOptionsStale } from "./batch-prepared-options";

describe("batchOptionsStale", () => {
  it("returns false when no prepared snapshot", () => {
    expect(batchOptionsStale(null, { compression: 6 })).toBe(false);
  });

  it("returns false when options match", () => {
    expect(batchOptionsStale({ compression: 6 }, { compression: 6 })).toBe(false);
  });

  it("returns true when options differ", () => {
    expect(batchOptionsStale({ compression: 6 }, { compression: 9 })).toBe(true);
  });
});
