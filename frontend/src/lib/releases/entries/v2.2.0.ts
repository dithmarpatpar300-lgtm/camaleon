import type { ReleaseEntry } from "../types";

export const releaseV220: ReleaseEntry = {
  version: "2.2.0",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v220.title",
  summaryKey: "releaseComms.entries.v220.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "png-avif",
      icon: "tool",
      titleKey: "releaseComms.entries.v220.highlights.pngAvif.title",
      bodyKey: "releaseComms.entries.v220.highlights.pngAvif.body",
    },
    {
      id: "jpg-avif",
      icon: "tool",
      titleKey: "releaseComms.entries.v220.highlights.jpgAvif.title",
      bodyKey: "releaseComms.entries.v220.highlights.jpgAvif.body",
    },
    {
      id: "encode-crate",
      icon: "cpu",
      titleKey: "releaseComms.entries.v220.highlights.encodeCrate.title",
      bodyKey: "releaseComms.entries.v220.highlights.encodeCrate.body",
    },
  ],
  technicalKey: "releaseComms.entries.v220.technical",
};
