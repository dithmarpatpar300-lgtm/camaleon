import type { ReleaseManifest } from "./types";
import { releaseV340 } from "./entries/v3.4.0";
import { releaseV334 } from "./entries/v3.3.4";
import { releaseV333 } from "./entries/v3.3.3";
import { releaseV332 } from "./entries/v3.3.2";
import { releaseV331 } from "./entries/v3.3.1";
import { releaseV330 } from "./entries/v3.3.0";
import { releaseV329 } from "./entries/v3.2.9";
import { releaseV328 } from "./entries/v3.2.8";
import { releaseV327 } from "./entries/v3.2.7";
import { releaseV326 } from "./entries/v3.2.6";
import { releaseV325 } from "./entries/v3.2.5";
import { releaseV324 } from "./entries/v3.2.4";
import { releaseV323 } from "./entries/v3.2.3";
import { releaseV322 } from "./entries/v3.2.2";
import { releaseV321 } from "./entries/v3.2.1";
import { releaseV312 } from "./entries/v3.1.2";
import { releaseV311 } from "./entries/v3.1.1";
import { releaseV301 } from "./entries/v3.0.1";
import { releaseV300 } from "./entries/v3.0.0";
import { releaseV238 } from "./entries/v2.3.8";
import { releaseV237 } from "./entries/v2.3.7";
import { releaseV236 } from "./entries/v2.3.6";
import { releaseV235 } from "./entries/v2.3.5";
import { releaseV234 } from "./entries/v2.3.4";
import { releaseV233 } from "./entries/v2.3.3";
import { releaseV232 } from "./entries/v2.3.2";
import { releaseV231 } from "./entries/v2.3.1";
import { releaseV230 } from "./entries/v2.3.0";
import { releaseV220 } from "./entries/v2.2.0";
import { releaseV211 } from "./entries/v2.1.1";
import { releaseV200 } from "./entries/v2.0.0";
import { releaseV1122 } from "./entries/v1.12.2";
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
    releaseV340,
    releaseV334,
    releaseV333,
    releaseV332,
    releaseV331,
    releaseV330,
    releaseV329,
    releaseV328,
    releaseV327,
    releaseV326,
    releaseV325,
    releaseV324,
    releaseV323,
    releaseV322,
    releaseV321,
    releaseV312,
    releaseV311,
    releaseV301,
    releaseV300,
    releaseV238,
    releaseV237,
    releaseV236,
    releaseV235,
    releaseV234,
    releaseV233,
    releaseV232,
    releaseV231,
    releaseV230,
    releaseV220,
    releaseV211,
    releaseV200,
    releaseV1122,
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
