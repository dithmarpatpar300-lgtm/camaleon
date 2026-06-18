import type { ReleaseEntry } from "../types";

export const releaseV311: ReleaseEntry = {
  version: "3.1.1",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v311.title",
  summaryKey: "releaseComms.entries.v311.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "universal-entry",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v311.highlights.universalEntry.title",
      bodyKey: "releaseComms.entries.v311.highlights.universalEntry.body",
    },
    {
      id: "handoff-fix",
      icon: "shield",
      titleKey: "releaseComms.entries.v311.highlights.handoffFix.title",
      bodyKey: "releaseComms.entries.v311.highlights.handoffFix.body",
    },
    {
      id: "universal-polish",
      icon: "tool",
      titleKey: "releaseComms.entries.v311.highlights.universalPolish.title",
      bodyKey: "releaseComms.entries.v311.highlights.universalPolish.body",
    },
  ],
  technicalKey: "releaseComms.entries.v311.technical",
};
