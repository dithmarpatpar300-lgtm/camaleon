import type { ReleaseEntry } from "../types";

export const releaseV235: ReleaseEntry = {
  version: "2.3.5",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v235.title",
  summaryKey: "releaseComms.entries.v235.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "svg-to-png",
      icon: "tool",
      titleKey: "releaseComms.entries.v235.highlights.svgToPng.title",
      bodyKey: "releaseComms.entries.v235.highlights.svgToPng.body",
    },
    {
      id: "svg-scale",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v235.highlights.outputScale.title",
      bodyKey: "releaseComms.entries.v235.highlights.outputScale.body",
    },
  ],
  technicalKey: "releaseComms.entries.v235.technical",
};
