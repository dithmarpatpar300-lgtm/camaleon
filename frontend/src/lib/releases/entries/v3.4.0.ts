import type { ReleaseEntry } from "../types";

export const releaseV340: ReleaseEntry = {
  version: "3.4.0",
  date: "2026-06-20",
  titleKey: "releaseComms.entries.v340.title",
  summaryKey: "releaseComms.entries.v340.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "legal-content",
      icon: "shield",
      titleKey: "releaseComms.entries.v340.highlights.legalContent.title",
      bodyKey: "releaseComms.entries.v340.highlights.legalContent.body",
    },
    {
      id: "legal-notice",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v340.highlights.legalNotice.title",
      bodyKey: "releaseComms.entries.v340.highlights.legalNotice.body",
    },
    {
      id: "legal-design",
      icon: "tool",
      titleKey: "releaseComms.entries.v340.highlights.legalDesign.title",
      bodyKey: "releaseComms.entries.v340.highlights.legalDesign.body",
    },
  ],
  technicalKey: "releaseComms.entries.v340.technical",
};
