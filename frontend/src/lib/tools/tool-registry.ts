import type { ToolDefinition } from "./types";

export const TOOLS: ToolDefinition[] = [
  {
    id: "jpg-to-png",
    slug: "jpg-to-png",
    title: "JPG → PNG",
    fromFormat: "JPG",
    toFormat: "PNG",
    module: "transmutador_jpg",
    category: "image",
    fidelity: "lossless",
    status: "active",
    acceptExtensions: [".jpg", ".jpeg"],
    outputExtension: "png",
    optionSpecs: [
      {
        kind: "slider",
        key: "compression",
        min: 1,
        max: 9,
        step: 1,
        defaultValue: 6,
        presets: [
          { label: "fast", value: 1 },
          { label: "balanced", value: 6 },
          { label: "minimal", value: 9 },
        ],
      },
    ],
  },
  {
    id: "png-to-jpg",
    slug: "png-to-jpg",
    title: "PNG → JPG",
    fromFormat: "PNG",
    toFormat: "JPG",
    module: "transmutador_png",
    category: "image",
    fidelity: "lossy",
    status: "active",
    acceptExtensions: [".png"],
    outputExtension: "jpg",
    optionSpecs: [
      {
        kind: "slider",
        key: "quality",
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 85,
        presets: [
          { label: "web", value: 60 },
          { label: "balanced", value: 85 },
          { label: "high", value: 95 },
        ],
      },
      {
        kind: "color",
        key: "background",
        defaultValue: { r: 255, g: 255, b: 255 },
        swatches: [
          { label: "white", value: { r: 255, g: 255, b: 255 } },
          { label: "black", value: { r: 0, g: 0, b: 0 } },
          { label: "gray", value: { r: 128, g: 128, b: 128 } },
        ],
        allowCustom: true,
      },
    ],
  },
  {
    id: "webp-to-png",
    slug: "webp-to-png",
    title: "WebP → PNG",
    fromFormat: "WEBP",
    toFormat: "PNG",
    module: "transmutador_webp",
    category: "image",
    fidelity: "lossless",
    status: "active",
    acceptExtensions: [".webp"],
    outputExtension: "png",
    optionSpecs: [
      {
        kind: "slider",
        key: "compression",
        min: 1,
        max: 9,
        step: 1,
        defaultValue: 6,
        presets: [
          { label: "fast", value: 1 },
          { label: "balanced", value: 6 },
          { label: "minimal", value: 9 },
        ],
      },
    ],
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getActiveTools(): ToolDefinition[] {
  return TOOLS.filter((t) => t.status === "active");
}

export function getSoonTools(): ToolDefinition[] {
  return TOOLS.filter((t) => t.status === "soon");
}
