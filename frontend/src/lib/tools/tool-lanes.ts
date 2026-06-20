import type { ToolDefinition } from "./types";

export type ToolLane = "convert" | "optimize";

export const TOOL_LANE_ORDER: readonly ToolLane[] = ["convert", "optimize"] as const;

/** @deprecated Legacy key — migrated into camaleon-user-settings-v1.tools */
export const STORAGE_LANE_KEY = "camaleon.tools.lane.v1";

export function laneForCategory(category: ToolDefinition["category"]): ToolLane {
  return category === "optimize" ? "optimize" : "convert";
}

export function filterToolsByLane(
  tools: ToolDefinition[],
  lane: ToolLane
): ToolDefinition[] {
  if (lane === "optimize") {
    return tools.filter((tool) => tool.category === "optimize");
  }
  return tools.filter((tool) => tool.category === "image");
}

export {
  readStoredLane,
  writeStoredLane,
} from "@/lib/storage/tool-browser-prefs";

/** Extra palette keywords for optimize tools (UX-4a discovery). */
export const OPTIMIZE_SEARCH_ALIASES =
  "compress resize optimize smaller shrink recompress downscale";
