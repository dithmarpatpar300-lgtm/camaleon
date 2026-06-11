import type { ReleaseEntry } from "../types";

export const releaseV1122: ReleaseEntry = {
  version: "1.12.2",
  date: "2026-06-11",
  titleKey: "releaseComms.entries.v1122.title",
  summaryKey: "releaseComms.entries.v1122.summary",
  tags: ["fix", "perf"],
  highlights: [
    {
      id: "gif-estimate",
      icon: "cpu",
      titleKey: "releaseComms.entries.v1122.highlights.gifEstimate.title",
      bodyKey: "releaseComms.entries.v1122.highlights.gifEstimate.body",
    },
    {
      id: "estimate-cache",
      icon: "memory",
      titleKey: "releaseComms.entries.v1122.highlights.estimateCache.title",
      bodyKey: "releaseComms.entries.v1122.highlights.estimateCache.body",
    },
    {
      id: "wasm-perf",
      icon: "tool",
      titleKey: "releaseComms.entries.v1122.highlights.wasmPerf.title",
      bodyKey: "releaseComms.entries.v1122.highlights.wasmPerf.body",
    },
  ],
  technicalKey: "releaseComms.entries.v1122.technical",
};
