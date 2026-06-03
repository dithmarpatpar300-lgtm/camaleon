import type { TransmutationModule } from "@/workers/types";

export type ImageFormat = "JPG" | "JPEG" | "PNG" | "WEBP";
export type ToolCategory = "image";
export type ToolFidelity = "lossless" | "lossy";
export type ToolStatus = "active" | "soon";
export type ToolOption = "quality" | "compression";

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
  options?: ToolOption[];
};
