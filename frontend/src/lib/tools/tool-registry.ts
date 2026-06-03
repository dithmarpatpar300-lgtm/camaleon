import type { ToolDefinition } from "./types";

export const TOOLS: ToolDefinition[] = [
  {
    id: "jpg-to-png",
    slug: "jpg-to-png",
    title: "JPG → PNG",
    description: "Lossless conversion — preserves every pixel perfectly.",
    fromFormat: "JPG",
    toFormat: "PNG",
    module: "transmutador_jpg",
    category: "image",
    fidelity: "lossless",
    status: "active",
    acceptExtensions: [".jpg", ".jpeg"],
    outputExtension: "png",
    fidelityHint:
      "File size may increase for photos — PNG is a master/editing format, not for shrinking.",
    options: ["compression"],
  },
  {
    id: "png-to-jpg",
    slug: "png-to-jpg",
    title: "PNG → JPG",
    description: "Compressed for web — smaller files at quality 85.",
    fromFormat: "PNG",
    toFormat: "JPG",
    module: "transmutador_png",
    category: "image",
    fidelity: "lossy",
    status: "active",
    acceptExtensions: [".png"],
    outputExtension: "jpg",
    fidelityHint:
      "Quality loss is irreversible. Transparency is flattened to white.",
    options: ["quality"],
  },
  {
    id: "webp-to-png",
    slug: "webp-to-png",
    title: "WebP → PNG",
    description: "Convert modern WebP images to universal PNG format.",
    fromFormat: "WEBP",
    toFormat: "PNG",
    module: "transmutador_jpg",
    category: "image",
    fidelity: "lossless",
    status: "soon",
    acceptExtensions: [".webp"],
    outputExtension: "png",
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
