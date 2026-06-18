import type { ReleaseEntry } from "../types";

export const releaseV326: ReleaseEntry = {
  version: "3.2.6",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v326.title",
  summaryKey: "releaseComms.entries.v326.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "auto-detect-toggle",
      icon: "tool",
      titleKey: "releaseComms.entries.v326.highlights.autoDetectToggle.title",
      bodyKey: "releaseComms.entries.v326.highlights.autoDetectToggle.body",
    },
    {
      id: "check-now",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v326.highlights.checkNow.title",
      bodyKey: "releaseComms.entries.v326.highlights.checkNow.body",
    },
    {
      id: "production-only",
      icon: "shield",
      titleKey: "releaseComms.entries.v326.highlights.productionOnly.title",
      bodyKey: "releaseComms.entries.v326.highlights.productionOnly.body",
    },
  ],
  technicalKey: "releaseComms.entries.v326.technical",
};
