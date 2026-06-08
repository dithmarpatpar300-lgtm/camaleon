import type { ReleaseEntry } from "../types";

export const releaseV1110: ReleaseEntry = {
  version: "1.11.0",
  date: "2026-06-08",
  titleKey: "releaseComms.entries.v1110.title",
  summaryKey: "releaseComms.entries.v1110.summary",
  tags: ["fix"],
  highlights: [
    {
      id: "semantic-alpha",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v1110.highlights.semanticAlpha.title",
      bodyKey: "releaseComms.entries.v1110.highlights.semanticAlpha.body",
    },
    {
      id: "tiff-opaque",
      icon: "image",
      titleKey: "releaseComms.entries.v1110.highlights.tiffOpaque.title",
      bodyKey: "releaseComms.entries.v1110.highlights.tiffOpaque.body",
    },
  ],
  technicalKey: "releaseComms.entries.v1110.technical",
};
