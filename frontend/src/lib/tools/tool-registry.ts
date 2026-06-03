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
    optionSpecs: [
      {
        kind: "slider",
        key: "compression",
        label: "Compresión PNG",
        min: 1,
        max: 9,
        step: 1,
        defaultValue: 6,
        presets: [
          { label: "Rápido", value: 1 },
          { label: "Balanceado", value: 6 },
          { label: "Mínimo", value: 9 },
        ],
        hint: "Always lossless — higher compression = smaller file + slower processing.",
        lowerLabel: "Más rápido",
        upperLabel: "Más pequeño",
      },
    ],
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
      "Quality loss is irreversible. Transparency is flattened to white by default.",
    optionSpecs: [
      {
        kind: "slider",
        key: "quality",
        label: "Calidad JPEG",
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 85,
        presets: [
          { label: "Web", value: 60 },
          { label: "Balanceado", value: 85 },
          { label: "Alto", value: 95 },
        ],
        hint: "Higher quality = larger file. Quality loss is always irreversible.",
        lowerLabel: "Más liviano",
        upperLabel: "Más fiel",
      },
      {
        kind: "color",
        key: "background",
        label: "Color de fondo",
        defaultValue: { r: 255, g: 255, b: 255 },
        swatches: [
          { label: "Blanco", value: { r: 255, g: 255, b: 255 } },
          { label: "Negro", value: { r: 0, g: 0, b: 0 } },
          { label: "Gris", value: { r: 128, g: 128, b: 128 } },
        ],
        allowCustom: true,
        hint: "Solo afecta imágenes con transparencia.",
      },
    ],
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
