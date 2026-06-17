import type { ReleaseEntry } from "../types";

export const releaseV234: ReleaseEntry = {
  version: "2.3.4",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v234.title",
  summaryKey: "releaseComms.entries.v234.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "notice-density",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v234.highlights.noticeDensity.title",
      bodyKey: "releaseComms.entries.v234.highlights.noticeDensity.body",
    },
    {
      id: "prepare-progress",
      icon: "tool",
      titleKey: "releaseComms.entries.v234.highlights.prepareProgress.title",
      bodyKey: "releaseComms.entries.v234.highlights.prepareProgress.body",
    },
  ],
  technicalKey: "releaseComms.entries.v234.technical",
};
