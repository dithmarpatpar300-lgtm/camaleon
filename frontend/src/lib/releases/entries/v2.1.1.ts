import type { ReleaseEntry } from "../types";

export const releaseV211: ReleaseEntry = {
  version: "2.1.1",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v211.title",
  summaryKey: "releaseComms.entries.v211.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "avif-jpg",
      icon: "tool",
      titleKey: "releaseComms.entries.v211.highlights.avifJpg.title",
      bodyKey: "releaseComms.entries.v211.highlights.avifJpg.body",
    },
    {
      id: "frame-preview",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v211.highlights.framePreview.title",
      bodyKey: "releaseComms.entries.v211.highlights.framePreview.body",
    },
    {
      id: "transmute-sync",
      icon: "shield",
      titleKey: "releaseComms.entries.v211.highlights.transmuteSync.title",
      bodyKey: "releaseComms.entries.v211.highlights.transmuteSync.body",
    },
  ],
  technicalKey: "releaseComms.entries.v211.technical",
};
