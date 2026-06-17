import type { RgbColor, ToolDefinition, ToolOptionSpec } from "@/lib/tools/types";
import type { TransmutationDefaults } from "./user-settings";
import { readUserSettings, writeUserSettings } from "./user-settings";

/** Registry baselines — used when user has not set a global default. */
export const REGISTRY_JPEG_QUALITY = 85;
export const REGISTRY_AVIF_QUALITY = 60;
export const REGISTRY_PNG_COMPRESSION = 6;
export const REGISTRY_AVIF_SPEED = 6;
export const REGISTRY_ALPHA_BACKGROUND: RgbColor = { r: 255, g: 255, b: 255 };

export type TransmutationDefaultKey = keyof TransmutationDefaults;

export const TRANSMUTATION_DEFAULT_BOUNDS = {
  jpegQuality: { min: 1, max: 100, registry: REGISTRY_JPEG_QUALITY },
  pngCompression: { min: 1, max: 9, registry: REGISTRY_PNG_COMPRESSION },
  avifQuality: { min: 1, max: 100, registry: REGISTRY_AVIF_QUALITY },
  avifSpeed: { min: 1, max: 10, registry: REGISTRY_AVIF_SPEED },
} as const;

export const ALPHA_BACKGROUND_SWATCHES: ReadonlyArray<{
  labelKey: string;
  value: RgbColor;
}> = [
  { labelKey: "settings.tools.backgroundSwatches.white", value: { r: 255, g: 255, b: 255 } },
  { labelKey: "settings.tools.backgroundSwatches.black", value: { r: 0, g: 0, b: 0 } },
  { labelKey: "settings.tools.backgroundSwatches.gray", value: { r: 128, g: 128, b: 128 } },
];

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function rgbEq(a: RgbColor, b: RgbColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

export function readTransmutationDefaults(): TransmutationDefaults {
  return readUserSettings().transmutation ?? {};
}

export function writeTransmutationDefaults(
  partial: Partial<TransmutationDefaults>
): TransmutationDefaults {
  const current = readTransmutationDefaults();
  const next: TransmutationDefaults = { ...current, ...partial };
  writeUserSettings({ transmutation: next });
  return next;
}

export function resetTransmutationDefaults(): void {
  writeUserSettings({ transmutation: {} });
}

export function getEffectiveTransmutationDefaults(): Required<TransmutationDefaults> {
  const stored = readTransmutationDefaults();
  return {
    jpegQuality: stored.jpegQuality ?? REGISTRY_JPEG_QUALITY,
    pngCompression: stored.pngCompression ?? REGISTRY_PNG_COMPRESSION,
    alphaBackground: stored.alphaBackground ?? REGISTRY_ALPHA_BACKGROUND,
    avifQuality: stored.avifQuality ?? REGISTRY_AVIF_QUALITY,
    avifSpeed: stored.avifSpeed ?? REGISTRY_AVIF_SPEED,
  };
}

export function resolveSpecDefault(
  tool: ToolDefinition,
  spec: ToolOptionSpec
): number | RgbColor {
  const effective = getEffectiveTransmutationDefaults();

  if (spec.kind === "color" && spec.key === "background") {
    return effective.alphaBackground;
  }

  switch (spec.key) {
    case "quality":
      return clampInt(
        tool.outputExtension === "avif" ? effective.avifQuality : effective.jpegQuality,
        spec.min,
        spec.max
      );
    case "compression":
      return clampInt(effective.pngCompression, spec.min, spec.max);
    case "speed":
      return clampInt(effective.avifSpeed, spec.min, spec.max);
    default:
      return clampInt(spec.defaultValue, spec.min, spec.max);
  }
}

export function isRegistryBackground(color: RgbColor): boolean {
  return ALPHA_BACKGROUND_SWATCHES.some((s) => rgbEq(s.value, color));
}
