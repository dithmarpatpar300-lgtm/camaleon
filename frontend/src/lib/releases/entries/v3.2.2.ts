import type { ReleaseEntry } from "../types";

export const releaseV322: ReleaseEntry = {
  version: "3.2.2",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v322.title",
  summaryKey: "releaseComms.entries.v322.summary",
  tags: ["fix"],
  highlights: [
    {
      id: "inline-prepare",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v322.highlights.inlinePrepare.title",
      bodyKey: "releaseComms.entries.v322.highlights.inlinePrepare.body",
    },
    {
      id: "slider-no-reprepare",
      icon: "tool",
      titleKey: "releaseComms.entries.v322.highlights.sliderNoReprepare.title",
      bodyKey: "releaseComms.entries.v322.highlights.sliderNoReprepare.body",
    },
    {
      id: "convert-again",
      icon: "shield",
      titleKey: "releaseComms.entries.v322.highlights.convertAgain.title",
      bodyKey: "releaseComms.entries.v322.highlights.convertAgain.body",
    },
  ],
  technicalKey: "releaseComms.entries.v322.technical",
};
