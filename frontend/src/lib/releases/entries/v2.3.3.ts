import type { ReleaseEntry } from "../types";

export const releaseV233: ReleaseEntry = {
  version: "2.3.3",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v233.title",
  summaryKey: "releaseComms.entries.v233.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "performance-prefs",
      icon: "cpu",
      titleKey: "releaseComms.entries.v233.highlights.performancePrefs.title",
      bodyKey: "releaseComms.entries.v233.highlights.performancePrefs.body",
    },
    {
      id: "settings-performance",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v233.highlights.settingsPerformance.title",
      bodyKey: "releaseComms.entries.v233.highlights.settingsPerformance.body",
    },
  ],
  technicalKey: "releaseComms.entries.v233.technical",
};
