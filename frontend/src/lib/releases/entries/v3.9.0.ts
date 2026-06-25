import type { ReleaseEntry } from "../types";

export const releaseV390: ReleaseEntry = {
  version: "3.9.0",
  date: "2026-06-24",
  titleKey: "releaseComms.entries.v390.title",
  summaryKey: "releaseComms.entries.v390.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "webp-compress",
      icon: "image",
      titleKey: "releaseComms.entries.v390.highlights.webpCompress.title",
      bodyKey: "releaseComms.entries.v390.highlights.webpCompress.body",
    },
    {
      id: "honesty-notices",
      icon: "shield",
      titleKey: "releaseComms.entries.v390.highlights.honestyNotices.title",
      bodyKey: "releaseComms.entries.v390.highlights.honestyNotices.body",
    },
  ],
  technicalKey: "releaseComms.entries.v390.technical",
};
