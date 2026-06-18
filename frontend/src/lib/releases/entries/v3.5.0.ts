import type { ReleaseEntry } from "../types";

export const releaseV350: ReleaseEntry = {
  version: "3.5.0",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v350.title",
  summaryKey: "releaseComms.entries.v350.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "universal-entry",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v350.highlights.universalEntry.title",
      bodyKey: "releaseComms.entries.v350.highlights.universalEntry.body",
    },
    {
      id: "output-picker",
      icon: "tool",
      titleKey: "releaseComms.entries.v350.highlights.outputPicker.title",
      bodyKey: "releaseComms.entries.v350.highlights.outputPicker.body",
    },
    {
      id: "file-handoff",
      icon: "shield",
      titleKey: "releaseComms.entries.v350.highlights.fileHandoff.title",
      bodyKey: "releaseComms.entries.v350.highlights.fileHandoff.body",
    },
  ],
  technicalKey: "releaseComms.entries.v350.technical",
};
