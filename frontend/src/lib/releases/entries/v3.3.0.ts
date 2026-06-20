import type { ReleaseEntry } from "../types";

export const releaseV330: ReleaseEntry = {
  version: "3.3.0",
  date: "2026-06-19",
  titleKey: "releaseComms.entries.v330.title",
  summaryKey: "releaseComms.entries.v330.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "optimize-activation",
      icon: "cpu",
      titleKey: "releaseComms.entries.v330.highlights.optimizeActivation.title",
      bodyKey: "releaseComms.entries.v330.highlights.optimizeActivation.body",
    },
    {
      id: "pwa-icons",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v330.highlights.pwaIcons.title",
      bodyKey: "releaseComms.entries.v330.highlights.pwaIcons.body",
    },
  ],
  technicalKey: "releaseComms.entries.v330.technical",
};
