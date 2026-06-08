import type { ReleaseEntry } from "../types";

export const releaseV1100: ReleaseEntry = {
  version: "1.10.0",
  date: "2026-06-08",
  titleKey: "releaseComms.entries.v1100.title",
  summaryKey: "releaseComms.entries.v1100.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "tiff-png",
      icon: "image",
      titleKey: "releaseComms.entries.v1100.highlights.tiff.title",
      bodyKey: "releaseComms.entries.v1100.highlights.tiff.body",
    },
    {
      id: "tiff-bitdepth",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v1100.highlights.bitdepth.title",
      bodyKey: "releaseComms.entries.v1100.highlights.bitdepth.body",
    },
  ],
  technicalKey: "releaseComms.entries.v1100.technical",
};
