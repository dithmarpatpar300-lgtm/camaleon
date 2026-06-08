import type { ReleaseEntry } from "../types";

export const releaseV190: ReleaseEntry = {
  version: "1.9.0",
  date: "2026-06-08",
  titleKey: "releaseComms.entries.v190.title",
  summaryKey: "releaseComms.entries.v190.summary",
  tags: ["feature", "perf", "fix"],
  highlights: [
    {
      id: "gif-bmp",
      icon: "image",
      titleKey: "releaseComms.entries.v190.highlights.formats.title",
      bodyKey: "releaseComms.entries.v190.highlights.formats.body",
    },
    {
      id: "gif-premium",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v190.highlights.gif.title",
      bodyKey: "releaseComms.entries.v190.highlights.gif.body",
    },
    {
      id: "limits",
      icon: "shield",
      titleKey: "releaseComms.entries.v190.highlights.limits.title",
      bodyKey: "releaseComms.entries.v190.highlights.limits.body",
    },
    {
      id: "astro",
      icon: "tool",
      titleKey: "releaseComms.entries.v190.highlights.astro.title",
      bodyKey: "releaseComms.entries.v190.highlights.astro.body",
    },
    {
      id: "memory",
      icon: "memory",
      titleKey: "releaseComms.entries.v190.highlights.memory.title",
      bodyKey: "releaseComms.entries.v190.highlights.memory.body",
    },
  ],
  technicalKey: "releaseComms.entries.v190.technical",
};
