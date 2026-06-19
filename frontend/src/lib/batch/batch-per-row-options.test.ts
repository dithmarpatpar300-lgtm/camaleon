import { describe, expect, it } from "vitest";
import {
  defaultItemOptionsFromPrepared,
  isPerRowBatchTool,
  mergeBatchItemOptions,
} from "./batch-per-row-options";

describe("batch-per-row-options", () => {
  it("flags GIF/TIFF/ICO batch slugs", () => {
    expect(isPerRowBatchTool("gif-to-png")).toBe(true);
    expect(isPerRowBatchTool("png-to-jpg")).toBe(false);
  });

  it("merges global and per-item options", () => {
    expect(
      mergeBatchItemOptions({ quality: 80, compression: 6 }, { frameIndex: 2 })
    ).toEqual({ quality: 80, compression: 6, frameIndex: 2 });
  });

  it("defaults item options from prepared ico meta", () => {
    expect(
      defaultItemOptionsFromPrepared({
        hasAlpha: false,
        alphaAssessment: null,
        gifSession: null,
        avifMeta: null,
        tiffMeta: null,
        icoMeta: {
          entryCount: 3,
          defaultEntryIndex: 1,
          isCursor: false,
          entryWidth: () => 32,
          entryHeight: () => 32,
          entryBitsPerPixel: () => 32,
          entryIsPng: () => true,
          entryHasAlpha: () => true,
        },
        svgMeta: null,
        sourceMeta: null,
      })
    ).toEqual({ frameIndex: 0, pageIndex: 0, entryIndex: 1 });
  });
});
