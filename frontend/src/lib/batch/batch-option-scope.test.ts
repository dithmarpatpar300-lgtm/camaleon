import { describe, expect, it } from "vitest";
import { getToolBySlug } from "@/lib/tools/tool-registry";
import {
  formatPrimaryBatchOptionValue,
  isBatchEncodeOnlyTool,
} from "./batch-option-scope";

describe("isBatchEncodeOnlyTool", () => {
  it("treats jpg-to-png as encode-only", () => {
    const tool = getToolBySlug("jpg-to-png")!;
    expect(isBatchEncodeOnlyTool(tool)).toBe(true);
  });

  it("treats png-to-jpg as encode-only", () => {
    const tool = getToolBySlug("png-to-jpg")!;
    expect(isBatchEncodeOnlyTool(tool)).toBe(true);
  });
});

describe("formatPrimaryBatchOptionValue", () => {
  it("formats compression", () => {
    expect(formatPrimaryBatchOptionValue({ compression: 9 })).toBe("9");
  });
});
