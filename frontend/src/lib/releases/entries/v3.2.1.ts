import type { ReleaseEntry } from "../types";

export const releaseV321: ReleaseEntry = {
  version: "3.2.1",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v321.title",
  summaryKey: "releaseComms.entries.v321.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "batch-routes",
      icon: "tool",
      titleKey: "releaseComms.entries.v321.highlights.batchRoutes.title",
      bodyKey: "releaseComms.entries.v321.highlights.batchRoutes.body",
    },
    {
      id: "camera-jpeg",
      icon: "shield",
      titleKey: "releaseComms.entries.v321.highlights.cameraJpeg.title",
      bodyKey: "releaseComms.entries.v321.highlights.cameraJpeg.body",
    },
    {
      id: "batch-ux",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v321.highlights.batchUx.title",
      bodyKey: "releaseComms.entries.v321.highlights.batchUx.body",
    },
  ],
  technicalKey: "releaseComms.entries.v321.technical",
};
