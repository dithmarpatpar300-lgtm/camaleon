import type { ReleaseEntry } from "../types";

export const releaseV334: ReleaseEntry = {
  version: "3.3.4",
  date: "2026-06-20",
  titleKey: "releaseComms.entries.v334.title",
  summaryKey: "releaseComms.entries.v334.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "settings-toast-coexist",
      icon: "shield",
      titleKey: "releaseComms.entries.v334.highlights.settingsToastCoexist.title",
      bodyKey: "releaseComms.entries.v334.highlights.settingsToastCoexist.body",
    },
    {
      id: "client-storage",
      icon: "cpu",
      titleKey: "releaseComms.entries.v334.highlights.clientStorage.title",
      bodyKey: "releaseComms.entries.v334.highlights.clientStorage.body",
    },
    {
      id: "lane-persistence",
      icon: "tool",
      titleKey: "releaseComms.entries.v334.highlights.lanePersistence.title",
      bodyKey: "releaseComms.entries.v334.highlights.lanePersistence.body",
    },
    {
      id: "mobile-offline-dock",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v334.highlights.mobileOfflineDock.title",
      bodyKey: "releaseComms.entries.v334.highlights.mobileOfflineDock.body",
    },
  ],
  technicalKey: "releaseComms.entries.v334.technical",
};
