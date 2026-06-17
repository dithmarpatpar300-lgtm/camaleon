import type { ReleaseEntry } from "../types";

export const releaseV231: ReleaseEntry = {
  version: "2.3.1",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v231.title",
  summaryKey: "releaseComms.entries.v231.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "settings-panel",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v231.highlights.settingsPanel.title",
      bodyKey: "releaseComms.entries.v231.highlights.settingsPanel.body",
    },
    {
      id: "utility-cluster",
      icon: "tool",
      titleKey: "releaseComms.entries.v231.highlights.utilityCluster.title",
      bodyKey: "releaseComms.entries.v231.highlights.utilityCluster.body",
    },
    {
      id: "release-prefs",
      icon: "shield",
      titleKey: "releaseComms.entries.v231.highlights.releasePrefs.title",
      bodyKey: "releaseComms.entries.v231.highlights.releasePrefs.body",
    },
  ],
  technicalKey: "releaseComms.entries.v231.technical",
};
