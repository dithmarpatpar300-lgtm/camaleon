import type { ReleaseEntry } from "../types";

export const releaseV300: ReleaseEntry = {
  version: "3.0.0",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v300.title",
  summaryKey: "releaseComms.entries.v300.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "pwa-shell",
      icon: "shield",
      titleKey: "releaseComms.entries.v300.highlights.pwaShell.title",
      bodyKey: "releaseComms.entries.v300.highlights.pwaShell.body",
    },
    {
      id: "full-toolkit",
      icon: "tool",
      titleKey: "releaseComms.entries.v300.highlights.fullToolkit.title",
      bodyKey: "releaseComms.entries.v300.highlights.fullToolkit.body",
    },
    {
      id: "sw-updates",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v300.highlights.swUpdates.title",
      bodyKey: "releaseComms.entries.v300.highlights.swUpdates.body",
    },
  ],
  technicalKey: "releaseComms.entries.v300.technical",
};
