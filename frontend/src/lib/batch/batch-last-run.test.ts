import { describe, expect, it } from "vitest";
import {
  batchOptionsEqual,
  canBatchCacheRedownload,
  type BatchLastRunSnapshot,
} from "./batch-last-run";

describe("batchOptionsEqual", () => {
  it("matches identical option objects", () => {
    expect(batchOptionsEqual({ compression: 6 }, { compression: 6 })).toBe(true);
  });

  it("detects compression changes", () => {
    expect(batchOptionsEqual({ compression: 5 }, { compression: 7 })).toBe(false);
  });

  it("ignores key order", () => {
    expect(
      batchOptionsEqual({ compression: 6, quality: 80 }, { quality: 80, compression: 6 })
    ).toBe(true);
  });
});

describe("canBatchCacheRedownload", () => {
  const snapshot: BatchLastRunSnapshot = {
    options: { compression: 6 },
    fileIdentities: ["a:1:x.jpg", "b:2:y.jpg"],
  };

  it("allows redownload when options and files match", () => {
    expect(
      canBatchCacheRedownload(snapshot, { compression: 6 }, ["a:1:x.jpg", "b:2:y.jpg"])
    ).toBe(true);
  });

  it("allows redownload when selected files are a subset of the last run", () => {
    expect(
      canBatchCacheRedownload(snapshot, { compression: 6 }, ["a:1:x.jpg"])
    ).toBe(true);
  });

  it("rejects when nothing is selected", () => {
    expect(canBatchCacheRedownload(snapshot, { compression: 6 }, [])).toBe(false);
  });

  it("rejects when a selected file was not in the last run", () => {
    expect(
      canBatchCacheRedownload(snapshot, { compression: 6 }, ["a:1:x.jpg", "z:9:other.jpg"])
    ).toBe(false);
  });

  it("rejects when options changed", () => {
    expect(
      canBatchCacheRedownload(snapshot, { compression: 9 }, ["a:1:x.jpg", "b:2:y.jpg"])
    ).toBe(false);
  });
});
