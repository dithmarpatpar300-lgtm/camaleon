import type { ReleaseManifest } from "./types";
import { releaseV1121 } from "./entries/v1.12.1";
import { releaseV1120 } from "./entries/v1.12.0";
import { releaseV1110 } from "./entries/v1.11.0";
import { releaseV1104 } from "./entries/v1.10.4";
import { releaseV1103 } from "./entries/v1.10.3";
import { releaseV1102 } from "./entries/v1.10.2";
import { releaseV1101 } from "./entries/v1.10.1";
import { releaseV1100 } from "./entries/v1.10.0";
import { releaseV190 } from "./entries/v1.9.0";

export const RELEASE_MANIFEST: ReleaseManifest = {
  entries: [
    releaseV1121,
    releaseV1120,
    releaseV1110,
    releaseV1104,
    releaseV1103,
    releaseV1102,
    releaseV1101,
    releaseV1100,
    releaseV190,
  ],
  onboarding: {
    titleKey: "releaseComms.onboarding.title",
    subtitleKey: "releaseComms.onboarding.subtitle",
    technicalKey: "releaseComms.onboarding.technical",
    highlights: [
      {
        id: "privacy",
        icon: "shield",
        titleKey: "releaseComms.onboarding.highlights.privacy.title",
        bodyKey: "releaseComms.onboarding.highlights.privacy.body",
      },
      {
        id: "tools",
        icon: "tool",
        titleKey: "releaseComms.onboarding.highlights.tools.title",
        bodyKey: "releaseComms.onboarding.highlights.tools.body",
      },
      {
        id: "limits",
        icon: "cpu",
        titleKey: "releaseComms.onboarding.highlights.limits.title",
        bodyKey: "releaseComms.onboarding.highlights.limits.body",
      },
      {
        id: "i18n",
        icon: "sparkle",
        titleKey: "releaseComms.onboarding.highlights.i18n.title",
        bodyKey: "releaseComms.onboarding.highlights.i18n.body",
      },
    ],
  },
};

export function getReleaseByVersion(version: string) {
  return RELEASE_MANIFEST.entries.find((e) => e.version === version);
}

export function getLatestRelease() {
  return RELEASE_MANIFEST.entries[0] ?? null;
}
