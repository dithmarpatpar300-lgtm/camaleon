import type { TransmutationModule } from "@/workers/types";

export type ImageFormat =
  | "JPG"
  | "JPEG"
  | "PNG"
  | "WEBP"
  | "GIF"
  | "BMP"
  | "TIFF"
  | "ICO"
  | "TGA"
  | "AVIF"
  | "SVG";
export type ToolCategory = "image";
export type ToolFidelity = "lossless" | "lossy";
export type ToolStatus = "active" | "soon";

/** Discovery grouping for palette and landing (Pre-Tier 3 UX-2/3). */
export type ToolGroupKey =
  | "jpeg-png"
  | "webp"
  | "gif-bmp"
  | "archival"
  | "icons"
  | "modern";

export type RgbColor = { r: number; g: number; b: number };

export type SliderOptionSpec = {
  kind: "slider";
  key: "quality" | "compression" | "iconSize" | "speed" | "outputScale";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  presets: { label: string; value: number }[];
};

export type ColorOptionSpec = {
  kind: "color";
  key: "background";
  defaultValue: RgbColor;
  swatches: { label: string; value: RgbColor }[];
  allowCustom: boolean;
};

export type ToolOptionSpec = SliderOptionSpec | ColorOptionSpec;

export type ToolDefinition = {
  id: string;
  slug: string;
  title: string;
  fromFormat: ImageFormat;
  toFormat: ImageFormat;
  module: TransmutationModule;
  category: ToolCategory;
  toolGroup: ToolGroupKey;
  fidelity: ToolFidelity;
  status: ToolStatus;
  acceptExtensions: string[];
  outputExtension: string;
  optionSpecs?: ToolOptionSpec[];
};
