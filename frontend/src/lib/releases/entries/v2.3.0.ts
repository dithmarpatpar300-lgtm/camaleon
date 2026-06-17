import type { ReleaseEntry } from "../types";

export const releaseV230: ReleaseEntry = {
  version: "2.3.0",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v230.title",
  summaryKey: "releaseComms.entries.v230.summary",
  tags: ["feature", "perf"],
  highlights: [
    {
      id: "notice-rail",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v230.highlights.noticeRail.title",
      bodyKey: "releaseComms.entries.v230.highlights.noticeRail.body",
    },
    {
      id: "adaptive-perf",
      icon: "cpu",
      titleKey: "releaseComms.entries.v230.highlights.adaptivePerf.title",
      bodyKey: "releaseComms.entries.v230.highlights.adaptivePerf.body",
    },
    {
      id: "estimate-lifecycle",
      icon: "shield",
      titleKey: "releaseComms.entries.v230.highlights.estimateLifecycle.title",
      bodyKey: "releaseComms.entries.v230.highlights.estimateLifecycle.body",
    },
  ],
  technicalKey: "releaseComms.entries.v230.technical",
};
