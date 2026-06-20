import type { ReleaseEntry } from "../types";

export const releaseV331: ReleaseEntry = {
  version: "3.3.1",
  date: "2026-06-19",
  titleKey: "releaseComms.entries.v331.title",
  summaryKey: "releaseComms.entries.v331.summary",
  tags: ["fix", "feature"],
  highlights: [
    {
      id: "risk-unlock",
      icon: "shield",
      titleKey: "releaseComms.entries.v331.highlights.riskUnlock.title",
      bodyKey: "releaseComms.entries.v331.highlights.riskUnlock.body",
    },
    {
      id: "settings-focus",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v331.highlights.settingsFocus.title",
      bodyKey: "releaseComms.entries.v331.highlights.settingsFocus.body",
    },
  ],
  technicalKey: "releaseComms.entries.v331.technical",
};
