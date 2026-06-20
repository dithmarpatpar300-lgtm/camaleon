import type { ReleaseEntry } from "../types";

export const releaseV350: ReleaseEntry = {
  version: "3.5.0",
  date: "2026-06-20",
  titleKey: "releaseComms.entries.v350.title",
  summaryKey: "releaseComms.entries.v350.summary",
  tags: ["fix"],
  highlights: [
    {
      id: "offline-stable",
      icon: "shield",
      titleKey: "releaseComms.entries.v350.highlights.offlineStable.title",
      bodyKey: "releaseComms.entries.v350.highlights.offlineStable.body",
    },
    {
      id: "connectivity",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v350.highlights.connectivity.title",
      bodyKey: "releaseComms.entries.v350.highlights.connectivity.body",
    },
    {
      id: "brand-offline",
      icon: "tool",
      titleKey: "releaseComms.entries.v350.highlights.brandOffline.title",
      bodyKey: "releaseComms.entries.v350.highlights.brandOffline.body",
    },
    {
      id: "mobile-notices",
      icon: "cpu",
      titleKey: "releaseComms.entries.v350.highlights.mobileNotices.title",
      bodyKey: "releaseComms.entries.v350.highlights.mobileNotices.body",
    },
  ],
  technicalKey: "releaseComms.entries.v350.technical",
};
