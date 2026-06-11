import type { ReleaseEntry } from "../types";

export const releaseV200: ReleaseEntry = {
  version: "2.0.0",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v200.title",
  summaryKey: "releaseComms.entries.v200.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "avif-png",
      icon: "tool",
      titleKey: "releaseComms.entries.v200.highlights.avifPng.title",
      bodyKey: "releaseComms.entries.v200.highlights.avifPng.body",
    },
    {
      id: "avif-animated",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v200.highlights.avifAnimated.title",
      bodyKey: "releaseComms.entries.v200.highlights.avifAnimated.body",
    },
    {
      id: "limit-pipeline",
      icon: "shield",
      titleKey: "releaseComms.entries.v200.highlights.limitPipeline.title",
      bodyKey: "releaseComms.entries.v200.highlights.limitPipeline.body",
    },
  ],
  technicalKey: "releaseComms.entries.v200.technical",
};
