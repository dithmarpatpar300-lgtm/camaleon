import type { ToolDefinition } from "@/lib/tools/types";
import type { TransmutationOptions } from "@/workers/types";
import { isBatchEnabledTool } from "./batch-tool-allowlist";
import { isPerRowBatchTool } from "./batch-per-row-options";

/** Option keys that require re-running prepare (not just re-encode). */
const PREPARE_AFFECTING_KEYS = new Set([
  "frameIndex",
  "pageIndex",
  "entryIndex",
  "resizeMaxEdge",
  "width",
  "height",
]);

/**
 * Raster/global-encode batch slugs skip re-prepare on slider changes.
 * GIF/TIFF/ICO batch (3.6.2+) use per-row index pickers — not encode-only.
 */
export function isBatchEncodeOnlyTool(tool: ToolDefinition): boolean {
  if (!isBatchEnabledTool(tool.slug)) return false;
  if (isPerRowBatchTool(tool.slug)) return false;
  const specs = tool.optionSpecs ?? [];
  return !specs.some((spec) => PREPARE_AFFECTING_KEYS.has(spec.key));
}

export function formatPrimaryBatchOptionValue(options: TransmutationOptions): string {
  if (options.compression != null) return String(options.compression);
  if (options.quality != null) return String(options.quality);
  return "—";
}

export function primaryBatchOptionLabelKey(tool: ToolDefinition): string {
  const specs = tool.optionSpecs ?? [];
  if (specs.some((s) => s.key === "compression")) return "panel.batch.optionCompression";
  if (specs.some((s) => s.key === "quality")) return "panel.batch.optionQuality";
  return "panel.batch.optionSettings";
}
