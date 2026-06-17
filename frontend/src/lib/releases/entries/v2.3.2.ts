import type { ReleaseEntry } from "../types";

export const releaseV232: ReleaseEntry = {
  version: "2.3.2",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v232.title",
  summaryKey: "releaseComms.entries.v232.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "transmutation-defaults",
      icon: "tool",
      titleKey: "releaseComms.entries.v232.highlights.defaults.title",
      bodyKey: "releaseComms.entries.v232.highlights.defaults.body",
    },
    {
      id: "settings-tools",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v232.highlights.settingsTools.title",
      bodyKey: "releaseComms.entries.v232.highlights.settingsTools.body",
    },
  ],
  technicalKey: "releaseComms.entries.v232.technical",
};
