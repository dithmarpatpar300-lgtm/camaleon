import { getActiveTools } from "./tool-registry";
import { fileMatchesExtensions } from "./extensions";
import type { ImageFormat, ToolDefinition } from "./types";

/** All input extensions accepted by at least one active tool (lowercase, unique). */
export function getAllSupportedInputExtensions(): string[] {
  const exts = new Set<string>();
  for (const tool of getActiveTools()) {
    for (const ext of tool.acceptExtensions) {
      exts.add(ext.toLowerCase());
    }
  }
  return [...exts].sort();
}

/** Active tools whose `acceptExtensions` match the file name. */
export function getToolsForFileName(fileName: string): ToolDefinition[] {
  return getActiveTools().filter((tool) =>
    fileMatchesExtensions(fileName, tool.acceptExtensions)
  );
}

/** Human-facing input format label from the first matching tool. */
export function resolveInputFormatLabel(
  fileName: string,
  matches: ToolDefinition[] = getToolsForFileName(fileName)
): ImageFormat | null {
  if (matches.length === 0) return null;
  return matches[0].fromFormat;
}

const OUTPUT_FORMAT_ORDER: readonly ImageFormat[] = [
  "PNG",
  "JPG",
  "JPEG",
  "WEBP",
  "AVIF",
  "ICO",
  "GIF",
  "BMP",
  "TIFF",
  "TGA",
  "SVG",
];

/** Sort tools for output picker — stable by output format, then slug. */
export function sortToolsForOutputPicker(tools: ToolDefinition[]): ToolDefinition[] {
  return [...tools].sort((a, b) => {
    const ai = OUTPUT_FORMAT_ORDER.indexOf(a.toFormat);
    const bi = OUTPUT_FORMAT_ORDER.indexOf(b.toFormat);
    const aRank = ai === -1 ? 999 : ai;
    const bRank = bi === -1 ? 999 : bi;
    if (aRank !== bRank) return aRank - bRank;
    return a.slug.localeCompare(b.slug);
  });
}

export function buildAcceptAttribute(extensions: string[] = getAllSupportedInputExtensions()): string {
  return extensions.join(",");
}
