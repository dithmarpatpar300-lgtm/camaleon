import type { ReleaseEntry } from "../types";

export const releaseV238: ReleaseEntry = {
  version: "2.3.8",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v238.title",
  summaryKey: "releaseComms.entries.v238.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "risk-mode",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v238.highlights.riskMode.title",
      bodyKey: "releaseComms.entries.v238.highlights.riskMode.body",
    },
    {
      id: "risk-polish",
      icon: "tool",
      titleKey: "releaseComms.entries.v238.highlights.riskPolish.title",
      bodyKey: "releaseComms.entries.v238.highlights.riskPolish.body",
    },
    {
      id: "scrollbar-fix",
      icon: "cpu",
      titleKey: "releaseComms.entries.v238.highlights.scrollbar.title",
      bodyKey: "releaseComms.entries.v238.highlights.scrollbar.body",
    },
  ],
  technicalKey: "releaseComms.entries.v238.technical",
};
