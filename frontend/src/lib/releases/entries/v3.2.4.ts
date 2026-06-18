import type { ReleaseEntry } from "../types";

export const releaseV324: ReleaseEntry = {
  version: "3.2.4",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v324.title",
  summaryKey: "releaseComms.entries.v324.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "universal-batch",
      icon: "tool",
      titleKey: "releaseComms.entries.v324.highlights.universalBatch.title",
      bodyKey: "releaseComms.entries.v324.highlights.universalBatch.body",
    },
    {
      id: "batch-handoff",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v324.highlights.batchHandoff.title",
      bodyKey: "releaseComms.entries.v324.highlights.batchHandoff.body",
    },
    {
      id: "mixed-hint",
      icon: "shield",
      titleKey: "releaseComms.entries.v324.highlights.mixedHint.title",
      bodyKey: "releaseComms.entries.v324.highlights.mixedHint.body",
    },
  ],
  technicalKey: "releaseComms.entries.v324.technical",
};
