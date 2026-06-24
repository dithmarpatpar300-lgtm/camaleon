import type { ReleaseEntry } from "../types";

export const releaseV381: ReleaseEntry = {
  version: "3.8.1",
  date: "2026-06-23",
  titleKey: "releaseComms.entries.v381.title",
  summaryKey: "releaseComms.entries.v381.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "lossy-quant",
      icon: "image",
      titleKey: "releaseComms.entries.v381.highlights.lossyQuant.title",
      bodyKey: "releaseComms.entries.v381.highlights.lossyQuant.body",
    },
    {
      id: "color-bugfix",
      icon: "tool",
      titleKey: "releaseComms.entries.v381.highlights.colorBugfix.title",
      bodyKey: "releaseComms.entries.v381.highlights.colorBugfix.body",
    },
  ],
  technicalKey: "releaseComms.entries.v381.technical",
};
