import type { ReleaseEntry } from "../types";

export const releaseV380: ReleaseEntry = {
  version: "3.8.0",
  date: "2026-06-23",
  titleKey: "releaseComms.entries.v380.title",
  summaryKey: "releaseComms.entries.v380.summary",
  tags: ["feature"],
  highlights: [
    {
      id: "native-png-opt",
      icon: "cpu",
      titleKey: "releaseComms.entries.v380.highlights.nativePngOpt.title",
      bodyKey: "releaseComms.entries.v380.highlights.nativePngOpt.body",
    },
    {
      id: "deflate-strategy",
      icon: "tool",
      titleKey: "releaseComms.entries.v380.highlights.deflateStrategy.title",
      bodyKey: "releaseComms.entries.v380.highlights.deflateStrategy.body",
    },
    {
      id: "bit-depth",
      icon: "image",
      titleKey: "releaseComms.entries.v380.highlights.bitDepth.title",
      bodyKey: "releaseComms.entries.v380.highlights.bitDepth.body",
    },
  ],
  technicalKey: "releaseComms.entries.v380.technical",
};
