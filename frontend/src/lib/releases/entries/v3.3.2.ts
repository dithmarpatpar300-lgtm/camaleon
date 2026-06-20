import type { ReleaseEntry } from "../types";

export const releaseV332: ReleaseEntry = {
  version: "3.3.2",
  date: "2026-06-19",
  titleKey: "releaseComms.entries.v332.title",
  summaryKey: "releaseComms.entries.v332.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "offline-promo",
      icon: "shield",
      titleKey: "releaseComms.entries.v332.highlights.offlinePromo.title",
      bodyKey: "releaseComms.entries.v332.highlights.offlinePromo.body",
    },
    {
      id: "settings-focus-offline",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v332.highlights.settingsFocusOffline.title",
      bodyKey: "releaseComms.entries.v332.highlights.settingsFocusOffline.body",
    },
  ],
  technicalKey: "releaseComms.entries.v332.technical",
};
