import type { ReleaseEntry } from "../types";

export const releaseV237: ReleaseEntry = {
  version: "2.3.7",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v237.title",
  summaryKey: "releaseComms.entries.v237.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "risk-mode",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v237.highlights.riskMode.title",
      bodyKey: "releaseComms.entries.v237.highlights.riskMode.body",
    },
    {
      id: "risk-limits",
      icon: "tool",
      titleKey: "releaseComms.entries.v237.highlights.riskLimits.title",
      bodyKey: "releaseComms.entries.v237.highlights.riskLimits.body",
    },
  ],
  technicalKey: "releaseComms.entries.v237.technical",
};
