import type { ReleaseEntry } from "../types";

export const releaseV353: ReleaseEntry = {
  version: "3.5.3",
  date: "2026-06-22",
  titleKey: "releaseComms.entries.v353.title",
  summaryKey: "releaseComms.entries.v353.summary",
  tags: ["feature", "fix"],
  highlights: [
    {
      id: "adaptive-wasm",
      icon: "cpu",
      titleKey: "releaseComms.entries.v353.highlights.adaptiveWasm.title",
      bodyKey: "releaseComms.entries.v353.highlights.adaptiveWasm.body",
    },
    {
      id: "device-score",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v353.highlights.deviceScore.title",
      bodyKey: "releaseComms.entries.v353.highlights.deviceScore.body",
    },
    {
      id: "storage-pressure",
      icon: "tool",
      titleKey: "releaseComms.entries.v353.highlights.storagePressure.title",
      bodyKey: "releaseComms.entries.v353.highlights.storagePressure.body",
    },
  ],
  technicalKey: "releaseComms.entries.v353.technical",
};
