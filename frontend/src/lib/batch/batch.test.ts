import { describe, expect, it } from "vitest";
import { getToolBySlug } from "@/lib/tools/tool-registry";
import { partitionFilesForTool } from "./partition-for-tool";
import { isBatchEnabledTool, listBatchEnabledSlugs } from "./batch-tool-allowlist";
import { capBatchFiles, maxFilesPerBatch, shouldWarnAggregateBytes } from "./batch-limits";

function mockFile(name: string): File {
  return new File([new Uint8Array(8)], name, { type: "application/octet-stream" });
}

describe("partitionFilesForTool", () => {
  const tool = getToolBySlug("png-to-jpg")!;

  it("accepts matching extensions only", () => {
    const files = [
      mockFile("a.png"),
      mockFile("b.png"),
      mockFile("c.svg"),
      mockFile("d.jpg"),
    ];
    const { accepted, rejected } = partitionFilesForTool(files, tool);
    expect(accepted.map((f) => f.name)).toEqual(["a.png", "b.png"]);
    expect(rejected.map((f) => f.name)).toEqual(["c.svg", "d.jpg"]);
  });

  it("returns empty accepted when nothing matches", () => {
    const { accepted, rejected } = partitionFilesForTool([mockFile("x.svg")], tool);
    expect(accepted).toHaveLength(0);
    expect(rejected).toHaveLength(1);
  });
});

describe("batch-tool-allowlist", () => {
  it("includes png-to-jpg and gif-to-png (3.6.2)", () => {
    expect(isBatchEnabledTool("png-to-jpg")).toBe(true);
    expect(isBatchEnabledTool("gif-to-png")).toBe(true);
    expect(isBatchEnabledTool("svg-to-png")).toBe(false);
    expect(listBatchEnabledSlugs()).toContain("png-to-jpg");
    expect(listBatchEnabledSlugs()).toContain("tiff-to-png");
  });
});

describe("batch-limits", () => {
  it("caps mobile batches lower than desktop", () => {
    expect(maxFilesPerBatch(8)).toBe(50);
    expect(maxFilesPerBatch(4)).toBe(20);
  });

  it("caps file arrays", () => {
    const files = Array.from({ length: 60 }, (_, i) => mockFile(`${i}.png`));
    expect(capBatchFiles(files, 8)).toHaveLength(50);
    expect(capBatchFiles(files, 4)).toHaveLength(20);
  });

  it("warns on large aggregate bytes on mobile", () => {
    expect(shouldWarnAggregateBytes(200 * 1024 * 1024, 4)).toBe(true);
    expect(shouldWarnAggregateBytes(100 * 1024 * 1024, 8)).toBe(false);
  });
});
