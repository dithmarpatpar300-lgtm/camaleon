import { describe, expect, it } from "vitest";
import { batchItemsHaveStoredResults } from "./batch-stored-delivery";
import type { BatchItem } from "./batch-types";

function stubItem(result: BatchItem["result"]): BatchItem {
  return {
    id: "a",
    file: new File([], "x.png"),
    bytes: null,
    prepared: null,
    sourceMeta: null,
    itemOptions: {},
    result,
    selected: true,
    status: "done",
    blockReason: null,
    errorMessage: null,
  };
}

describe("batchItemsHaveStoredResults", () => {
  it("returns false for empty queue", () => {
    expect(batchItemsHaveStoredResults([])).toBe(false);
  });

  it("returns false when any item lacks result", () => {
    const withResult = stubItem({ bytes: new ArrayBuffer(1), mime: "image/png", extension: "png" });
    expect(batchItemsHaveStoredResults([withResult, stubItem(null)])).toBe(false);
  });

  it("returns true when all items have result", () => {
    const result = { bytes: new ArrayBuffer(1), mime: "image/webp", extension: "webp" };
    expect(batchItemsHaveStoredResults([stubItem(result), stubItem(result)])).toBe(true);
  });
});
