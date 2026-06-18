import type { ReleaseEntry } from "../types";

export const releaseV301: ReleaseEntry = {
  version: "3.0.1",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v301.title",
  summaryKey: "releaseComms.entries.v301.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "offline-mode",
      icon: "shield",
      titleKey: "releaseComms.entries.v301.highlights.offlineMode.title",
      bodyKey: "releaseComms.entries.v301.highlights.offlineMode.body",
    },
    {
      id: "offline-settings",
      icon: "tool",
      titleKey: "releaseComms.entries.v301.highlights.offlineSettings.title",
      bodyKey: "releaseComms.entries.v301.highlights.offlineSettings.body",
    },
    {
      id: "connectivity-ux",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v301.highlights.connectivityUx.title",
      bodyKey: "releaseComms.entries.v301.highlights.connectivityUx.body",
    },
  ],
  technicalKey: "releaseComms.entries.v301.technical",
};
