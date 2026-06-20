import type { UserSettings } from "@/lib/prefs/user-settings";
import {
  REGISTRY_ALPHA_BACKGROUND,
  REGISTRY_AVIF_QUALITY,
  REGISTRY_AVIF_SPEED,
  REGISTRY_JPEG_QUALITY,
  REGISTRY_PNG_COMPRESSION,
} from "@/lib/prefs/transmutation-defaults";

/** Fully resolved factory defaults — every persisted preference section explicit. */
export function buildFactoryUserSettings(): UserSettings {
  return {
    showChangelogOnUpdate: true,
    transmutation: {
      jpegQuality: REGISTRY_JPEG_QUALITY,
      pngCompression: REGISTRY_PNG_COMPRESSION,
      alphaBackground: { ...REGISTRY_ALPHA_BACKGROUND },
      avifQuality: REGISTRY_AVIF_QUALITY,
      avifSpeed: REGISTRY_AVIF_SPEED,
    },
    performance: {
      tier: "auto",
      resultCache: "auto",
      autoEstimate: "auto",
    },
    notices: {
      railDensity: "normal",
      prepareProgressStyle: "ring",
    },
    riskMode: {
      enabled: false,
    },
    offline: {
      fullToolkitPrecache: false,
      dismissedMobileWarning: false,
    },
    updates: {
      autoDetectUpdates: true,
    },
    batchUniversal: {
      defaultSelection: "all",
      universalMultiDrop: true,
      mixedFormatPolicy: "picker",
      batchDownloadMode: "individual",
    },
    tools: {
      lane: "convert",
      tab: "all",
      density: "compact",
    },
  };
}

/** Merge stored partial settings with factory defaults (missing keys only at section level). */
export function mergeUserSettingsWithFactory(stored: Partial<UserSettings>): UserSettings {
  const factory = buildFactoryUserSettings();

  const riskEnabled =
    typeof stored.riskMode?.enabled === "boolean"
      ? stored.riskMode.enabled
      : factory.riskMode!.enabled;

  return {
    showChangelogOnUpdate:
      typeof stored.showChangelogOnUpdate === "boolean"
        ? stored.showChangelogOnUpdate
        : factory.showChangelogOnUpdate,
    transmutation: { ...factory.transmutation, ...stored.transmutation },
    performance: { ...factory.performance, ...stored.performance },
    notices: { ...factory.notices, ...stored.notices },
    riskMode: {
      enabled: riskEnabled,
      acknowledgedAt:
        riskEnabled && typeof stored.riskMode?.acknowledgedAt === "string"
          ? stored.riskMode.acknowledgedAt
          : undefined,
    },
    offline: {
      fullToolkitPrecache:
        stored.offline?.fullToolkitPrecache ?? factory.offline!.fullToolkitPrecache!,
      dismissedMobileWarning:
        stored.offline?.dismissedMobileWarning ?? factory.offline!.dismissedMobileWarning!,
      precacheCompletedAt: stored.offline?.precacheCompletedAt,
      installPromoSnoozedUntil: stored.offline?.installPromoSnoozedUntil,
    },
    updates: { ...factory.updates, ...stored.updates },
    batchUniversal: { ...factory.batchUniversal, ...stored.batchUniversal },
    tools: { ...factory.tools, ...stored.tools },
  };
}

/** JSON blob embedded in the blocking bootstrap script. */
export function getFactoryUserSettingsJson(): string {
  return JSON.stringify(buildFactoryUserSettings());
}
