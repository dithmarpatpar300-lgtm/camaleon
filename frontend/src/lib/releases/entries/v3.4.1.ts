import type { ReleaseEntry } from "../types";

export const releaseV341: ReleaseEntry = {
  version: "3.4.1",
  date: "2026-06-20",
  titleKey: "releaseComms.entries.v341.title",
  summaryKey: "releaseComms.entries.v341.summary",
  tags: ["fix"],
  highlights: [
    {
      id: "shell-readiness",
      icon: "shield",
      titleKey: "releaseComms.entries.v341.highlights.shellReadiness.title",
      bodyKey: "releaseComms.entries.v341.highlights.shellReadiness.body",
    },
    {
      id: "update-purge-fix",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v341.highlights.updatePurgeFix.title",
      bodyKey: "releaseComms.entries.v341.highlights.updatePurgeFix.body",
    },
    {
      id: "force-offline",
      icon: "tool",
      titleKey: "releaseComms.entries.v341.highlights.forceOffline.title",
      bodyKey: "releaseComms.entries.v341.highlights.forceOffline.body",
    },
  ],
  technicalKey: "releaseComms.entries.v341.technical",
};
