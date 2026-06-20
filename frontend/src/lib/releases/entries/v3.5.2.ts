import type { ReleaseEntry } from "../types";

export const releaseV352: ReleaseEntry = {
  version: "3.5.2",
  date: "2026-06-20",
  titleKey: "releaseComms.entries.v352.title",
  summaryKey: "releaseComms.entries.v352.summary",
  tags: ["fix"],
  highlights: [
    {
      id: "risk-mode-decoder",
      icon: "cpu",
      titleKey: "releaseComms.entries.v352.highlights.riskModeDecoder.title",
      bodyKey: "releaseComms.entries.v352.highlights.riskModeDecoder.body",
    },
    {
      id: "batch-error-ux",
      icon: "tool",
      titleKey: "releaseComms.entries.v352.highlights.batchErrorUx.title",
      bodyKey: "releaseComms.entries.v352.highlights.batchErrorUx.body",
    },
    {
      id: "batch-done-redownload",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v352.highlights.batchDoneRedownload.title",
      bodyKey: "releaseComms.entries.v352.highlights.batchDoneRedownload.body",
    },
    {
      id: "prepare-file-size",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v352.highlights.prepareFileSize.title",
      bodyKey: "releaseComms.entries.v352.highlights.prepareFileSize.body",
    },
  ],
  technicalKey: "releaseComms.entries.v352.technical",
};
