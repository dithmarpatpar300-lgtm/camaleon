import { getActiveTools } from "./tool-registry";
import { fileMatchesExtensions } from "./extensions";
import { isBatchEnabledTool } from "@/lib/batch/batch-tool-allowlist";
import type { ImageFormat, ToolDefinition } from "./types";
import type { CohortBuildResult, InputCohort } from "./cohort-types";

export type { CohortBuildResult, InputCohort } from "./cohort-types";

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

function normalizeFamilyFormat(format: ImageFormat): ImageFormat {
  return format === "JPEG" ? "JPG" : format;
}

function createCohortId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `cohort-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Intersection of active tools valid for every file in the list. */
export function intersectToolsForFiles(files: File[]): ToolDefinition[] {
  if (files.length === 0) return [];

  const slugSets = files.map(
    (file) => new Set(getToolsForFileName(file.name).map((tool) => tool.slug))
  );
  let intersection = getToolsForFileName(files[0].name);

  for (let i = 1; i < slugSets.length; i++) {
    const slugs = slugSets[i];
    intersection = intersection.filter((tool) => slugs.has(tool.slug));
  }

  return intersection;
}

/**
 * Output tools for a cohort. When batchOnly and count > 1, limits to batch-enabled slugs.
 */
export function toolsForCohortOutput(
  cohort: InputCohort,
  options: { batchOnly?: boolean } = {}
): ToolDefinition[] {
  let tools = cohort.commonTools;
  if (options.batchOnly && cohort.files.length > 1) {
    tools = tools.filter((tool) => isBatchEnabledTool(tool.slug));
  }
  return sortToolsForOutputPicker(tools);
}

/**
 * Partition a multi-file drop into input-family cohorts plus unsupported files.
 * Registry-driven — no hardcoded format families.
 */
export function buildCohorts(files: File[]): CohortBuildResult {
  const unsupported: File[] = [];
  const groups = new Map<ImageFormat, File[]>();

  for (const file of files) {
    const matches = getToolsForFileName(file.name);
    if (matches.length === 0) {
      unsupported.push(file);
      continue;
    }
    const family = normalizeFamilyFormat(resolveInputFormatLabel(file.name, matches)!);
    const bucket = groups.get(family) ?? [];
    bucket.push(file);
    groups.set(family, bucket);
  }

  const cohorts: InputCohort[] = [...groups.entries()]
    .map(([familyLabel, cohortFiles]) => ({
      id: createCohortId(),
      familyLabel,
      files: cohortFiles,
      commonTools: intersectToolsForFiles(cohortFiles),
    }))
    .sort((a, b) => {
      const byFamily = a.familyLabel.localeCompare(b.familyLabel);
      if (byFamily !== 0) return byFamily;
      return b.files.length - a.files.length;
    });

  return { cohorts, unsupported };
}
