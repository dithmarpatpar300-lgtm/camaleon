import type { ReleaseEntry } from "../types";

export const releaseV393: ReleaseEntry = {
  version: "3.9.3",
  date: "2026-06-26",
  titleKey: "releaseComms.entries.v393.title",
  summaryKey: "releaseComms.entries.v393.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "wasm-sync-engine",
      icon: "cpu",
      titleKey: "releaseComms.entries.v393.highlights.wasmSync.title",
      bodyKey: "releaseComms.entries.v393.highlights.wasmSync.body",
    },
    {
      id: "s5-redesign",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v393.highlights.s5Redesign.title",
      bodyKey: "releaseComms.entries.v393.highlights.s5Redesign.body",
    },
  ],
  technicalKey: "releaseComms.entries.v393.technical",
};
