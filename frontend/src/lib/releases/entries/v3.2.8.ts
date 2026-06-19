import type { ReleaseEntry } from "../types";

export const releaseV328: ReleaseEntry = {
  version: "3.2.8",
  date: "2026-06-18",
  titleKey: "releaseComms.entries.v328.title",
  summaryKey: "releaseComms.entries.v328.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "batch-selection-default",
      icon: "tool",
      titleKey: "releaseComms.entries.v328.highlights.batchSelectionDefault.title",
      bodyKey: "releaseComms.entries.v328.highlights.batchSelectionDefault.body",
    },
    {
      id: "adaptive-toasts",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v328.highlights.adaptiveToasts.title",
      bodyKey: "releaseComms.entries.v328.highlights.adaptiveToasts.body",
    },
  ],
  technicalKey: "releaseComms.entries.v328.technical",
};
