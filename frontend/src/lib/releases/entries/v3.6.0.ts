import type { ReleaseEntry } from "../types";

export const releaseV360: ReleaseEntry = {
  version: "3.6.0",
  date: "2026-06-22",
  titleKey: "releaseComms.entries.v360.title",
  summaryKey: "releaseComms.entries.v360.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "resize-filters",
      icon: "tool",
      titleKey: "releaseComms.entries.v360.highlights.resizeFilters.title",
      bodyKey: "releaseComms.entries.v360.highlights.resizeFilters.body",
    },
    {
      id: "resize-upscale",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v360.highlights.resizeUpscale.title",
      bodyKey: "releaseComms.entries.v360.highlights.resizeUpscale.body",
    },
    {
      id: "resize-quality",
      icon: "cpu",
      titleKey: "releaseComms.entries.v360.highlights.resizeQuality.title",
      bodyKey: "releaseComms.entries.v360.highlights.resizeQuality.body",
    },
    {
      id: "resize-dimensions",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v360.highlights.resizeDimensions.title",
      bodyKey: "releaseComms.entries.v360.highlights.resizeDimensions.body",
    },
  ],
  technicalKey: "releaseComms.entries.v360.technical",
};
