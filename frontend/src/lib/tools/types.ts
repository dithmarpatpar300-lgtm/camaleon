import type { TransmutationModule } from "@/workers/types";

export type ImageFormat = "JPG" | "JPEG" | "PNG" | "WEBP" | "GIF" | "BMP";
export type ToolCategory = "image";
export type ToolFidelity = "lossless" | "lossy";
export type ToolStatus = "active" | "soon";

export type RgbColor = { r: number; g: number; b: number };

export type SliderOptionSpec = {
  kind: "slider";
  key: "quality" | "compression";
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
  fidelity: ToolFidelity;
  status: ToolStatus;
  acceptExtensions: string[];
  outputExtension: string;
  optionSpecs?: ToolOptionSpec[];
};
