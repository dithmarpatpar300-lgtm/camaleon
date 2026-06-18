import { describe, expect, it } from "vitest";
import { formatBatchFileDetailsLine } from "./format-batch-file-details";

describe("formatBatchFileDetailsLine", () => {
  it("shows size only when meta missing", () => {
    expect(formatBatchFileDetailsLine(2_200_000, null)).toBe("2.1 MB");
  });

  it("shows size | resolution · depth", () => {
    expect(
      formatBatchFileDetailsLine(2_200_000, {
        width: 4032,
        height: 3024,
        bitDepthLabel: "24-bit",
      })
    ).toBe("2.1 MB | 4032 × 3024 · 24-bit");
  });
});
