import type { ReleaseEntry } from "../types";

export const releaseV323: ReleaseEntry = {
  version: "3.2.3",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v323.title",
  summaryKey: "releaseComms.entries.v323.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "phase-complete",
      icon: "tool",
      titleKey: "releaseComms.entries.v323.highlights.phaseComplete.title",
      bodyKey: "releaseComms.entries.v323.highlights.phaseComplete.body",
    },
    {
      id: "batch-ux",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v323.highlights.batchUx.title",
      bodyKey: "releaseComms.entries.v323.highlights.batchUx.body",
    },
    {
      id: "sync-fix",
      icon: "shield",
      titleKey: "releaseComms.entries.v323.highlights.syncFix.title",
      bodyKey: "releaseComms.entries.v323.highlights.syncFix.body",
    },
  ],
  technicalKey: "releaseComms.entries.v323.technical",
};
