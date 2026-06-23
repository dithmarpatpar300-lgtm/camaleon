import type { ReleaseEntry } from "../types";

export const releaseV361: ReleaseEntry = {
  version: "3.6.1",
  date: "2026-06-22",
  titleKey: "releaseComms.entries.v361.title",
  summaryKey: "releaseComms.entries.v361.summary",
  tags: ["fix"],
  highlights: [
    {
      id: "update-engine",
      icon: "cpu",
      titleKey: "releaseComms.entries.v361.highlights.updateEngine.title",
      bodyKey: "releaseComms.entries.v361.highlights.updateEngine.body",
    },
    {
      id: "onboarding-ux",
      icon: "sparkle",
      titleKey: "releaseComms.entries.v361.highlights.onboardingUx.title",
      bodyKey: "releaseComms.entries.v361.highlights.onboardingUx.body",
    },
  ],
  technicalKey: "releaseComms.entries.v361.technical",
};
