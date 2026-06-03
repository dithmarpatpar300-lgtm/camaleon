import type { TransmutationModule } from "@/workers/types";

export type ImageFormat = "JPG" | "JPEG" | "PNG" | "WEBP";
export type ToolCategory = "image";
export type ToolFidelity = "lossless" | "lossy";
export type ToolStatus = "active" | "soon";

export type RgbColor = { r: number; g: number; b: number };

export type SliderOptionSpec = {
  kind: "slider";
  key: "quality" | "compression";
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  presets: { label: string; value: number }[];
  hint: string;
  lowerLabel?: string;
  upperLabel?: string;
};

export type ColorOptionSpec = {
  kind: "color";
  key: "background";
  label: string;
  defaultValue: RgbColor;
  swatches: { label: string; value: RgbColor }[];
  allowCustom: boolean;
  hint: string;
};

export type ToolOptionSpec = SliderOptionSpec | ColorOptionSpec;

export type ToolDefinition = {
  id: string;
  slug: string;
  title: string;
  description: string;
  fromFormat: ImageFormat;
  toFormat: ImageFormat;
  module: TransmutationModule;
  category: ToolCategory;
  fidelity: ToolFidelity;
  status: ToolStatus;
  acceptExtensions: string[];
  outputExtension: string;
  fidelityHint?: string;
  optionSpecs?: ToolOptionSpec[];
};
