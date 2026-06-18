import type { ReleaseEntry } from "../types";

export const releaseV320: ReleaseEntry = {
  version: "3.2.0",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v320.title",
  summaryKey: "releaseComms.entries.v320.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "batch-routes",
      icon: "tool",
      titleKey: "releaseComms.entries.v320.highlights.batchRoutes.title",
      bodyKey: "releaseComms.entries.v320.highlights.batchRoutes.body",
    },
    {
      id: "strict-contract",
      icon: "shield",
      titleKey: "releaseComms.entries.v320.highlights.strictContract.title",
      bodyKey: "releaseComms.entries.v320.highlights.strictContract.body",
    },
  ],
  technicalKey: "releaseComms.entries.v320.technical",
};
