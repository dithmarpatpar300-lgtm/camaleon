import type { ReleaseEntry } from "../types";

export const releaseV351: ReleaseEntry = {
  version: "3.5.1",
  date: "2026-06-19",
  titleKey: "releaseComms.entries.v351.title",
  summaryKey: "releaseComms.entries.v351.summary",
  tags: ["fix"],
  highlights: [
    {
      id: "tool-route-drop",
      icon: "tool",
      titleKey: "releaseComms.entries.v351.highlights.toolRouteDrop.title",
      bodyKey: "releaseComms.entries.v351.highlights.toolRouteDrop.body",
    },
    {
      id: "batch-download-ux",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v351.highlights.batchDownloadUx.title",
      bodyKey: "releaseComms.entries.v351.highlights.batchDownloadUx.body",
    },
  ],
  technicalKey: "releaseComms.entries.v351.technical",
};
