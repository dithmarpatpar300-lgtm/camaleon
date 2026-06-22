import type { ReleaseEntry } from "../types";

export const releaseV354: ReleaseEntry = {
  version: "3.5.4",
  date: "2026-06-22",
  titleKey: "releaseComms.entries.v354.title",
  summaryKey: "releaseComms.entries.v354.summary",
  tags: ["fix"],
  highlights: [
    {
      id: "chunk-error-boundary",
      icon: "shield",
      titleKey: "releaseComms.entries.v354.highlights.chunkErrorBoundary.title",
      bodyKey: "releaseComms.entries.v354.highlights.chunkErrorBoundary.body",
    },
    {
      id: "cache-resilience",
      icon: "tool",
      titleKey: "releaseComms.entries.v354.highlights.cacheResilience.title",
      bodyKey: "releaseComms.entries.v354.highlights.cacheResilience.body",
    },
  ],
  technicalKey: "releaseComms.entries.v354.technical",
};
