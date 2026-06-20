import type { ReleaseEntry } from "../types";

export const releaseV333: ReleaseEntry = {
  version: "3.3.3",
  date: "2026-06-19",
  titleKey: "releaseComms.entries.v333.title",
  summaryKey: "releaseComms.entries.v333.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "tool-lanes",
      icon: "tool",
      titleKey: "releaseComms.entries.v333.highlights.toolLanes.title",
      bodyKey: "releaseComms.entries.v333.highlights.toolLanes.body",
    },
    {
      id: "mobile-notices",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v333.highlights.mobileNotices.title",
      bodyKey: "releaseComms.entries.v333.highlights.mobileNotices.body",
    },
    {
      id: "settings-focus-uncached",
      icon: "shield",
      titleKey: "releaseComms.entries.v333.highlights.settingsFocusUncached.title",
      bodyKey: "releaseComms.entries.v333.highlights.settingsFocusUncached.body",
    },
  ],
  technicalKey: "releaseComms.entries.v333.technical",
};
