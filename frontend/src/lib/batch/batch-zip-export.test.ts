import { describe, expect, it } from "vitest";
import { batchItemsToZipEntries, buildBatchZipBlob } from "./batch-zip-export";
import type { BatchItem } from "./batch-types";

function mockBatchItem(name: string, bytes: Uint8Array, ext: string): BatchItem {
  return {
    id: `id-${name}`,
    file: new File([bytes], name),
    bytes: bytes.buffer,
    prepared: null,
    sourceMeta: null,
    itemOptions: {},
    result: {
      bytes: bytes.buffer,
      mime: ext === "png" ? "image/png" : "image/jpeg",
      extension: ext,
    },
    selected: false,
    status: "done",
    blockReason: null,
    errorMessage: null,
  };
}

describe("batch-zip-export", () => {
  it("dedupes zip entry names", () => {
    const a = new Uint8Array([1, 2, 3]);
    const entries = batchItemsToZipEntries([
      mockBatchItem("photo.png", a, "png"),
      mockBatchItem("photo.png", a, "png"),
    ]);
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe("photo.png");
    expect(entries[1].name).toBe("photo (2).png");
  });

  it("builds a zip blob from done items", () => {
    const blob = buildBatchZipBlob([
      mockBatchItem("a.png", new Uint8Array([1]), "png"),
      mockBatchItem("b.png", new Uint8Array([2]), "png"),
    ]);
    expect(blob).not.toBeNull();
    expect(blob!.type).toBe("application/zip");
    expect(blob!.size).toBeGreaterThan(0);
  });
});
