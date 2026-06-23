import type { ReleaseEntry } from "../types";

export const releaseV370: ReleaseEntry = {
  version: "3.7.0",
  date: "2026-06-23",
  titleKey: "releaseComms.entries.v370.title",
  summaryKey: "releaseComms.entries.v370.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "compress-notices",
      icon: "image",
      titleKey: "releaseComms.entries.v370.highlights.compressNotices.title",
      bodyKey: "releaseComms.entries.v370.highlights.compressNotices.body",
    },
    {
      id: "color-type-fix",
      icon: "tool",
      titleKey: "releaseComms.entries.v370.highlights.colorTypeFix.title",
      bodyKey: "releaseComms.entries.v370.highlights.colorTypeFix.body",
    },
    {
      id: "defaults",
      icon: "cpu",
      titleKey: "releaseComms.entries.v370.highlights.defaults.title",
      bodyKey: "releaseComms.entries.v370.highlights.defaults.body",
    },
  ],
  technicalKey: "releaseComms.entries.v370.technical",
};
