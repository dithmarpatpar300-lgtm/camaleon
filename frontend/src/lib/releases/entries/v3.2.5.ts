import type { ReleaseEntry } from "../types";

export const releaseV325: ReleaseEntry = {
  version: "3.2.5",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v325.title",
  summaryKey: "releaseComms.entries.v325.summary",
  tags: ["fix", "feature"],
  highlights: [
    {
      id: "deep-update",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v325.highlights.deepUpdate.title",
      bodyKey: "releaseComms.entries.v325.highlights.deepUpdate.body",
    },
    {
      id: "live-detection",
      icon: "tool",
      titleKey: "releaseComms.entries.v325.highlights.liveDetection.title",
      bodyKey: "releaseComms.entries.v325.highlights.liveDetection.body",
    },
    {
      id: "minimal-notice",
      icon: "shield",
      titleKey: "releaseComms.entries.v325.highlights.minimalNotice.title",
      bodyKey: "releaseComms.entries.v325.highlights.minimalNotice.body",
    },
  ],
  technicalKey: "releaseComms.entries.v325.technical",
};
