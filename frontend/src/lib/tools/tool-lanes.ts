import type { ToolCategory, ToolDefinition } from "./types";

export type ToolLane = "convert" | "optimize";

export const TOOL_LANE_ORDER: readonly ToolLane[] = ["convert", "optimize"] as const;

export const STORAGE_LANE_KEY = "camaleon.tools.lane.v1";

export function laneForCategory(category: ToolCategory): ToolLane {
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

export function readStoredLane(): ToolLane | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_LANE_KEY);
    return raw === "convert" || raw === "optimize" ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredLane(lane: ToolLane): void {
  try {
    window.localStorage.setItem(STORAGE_LANE_KEY, lane);
  } catch {
    /* ignore */
  }
}

/** Extra palette keywords for optimize tools (UX-4a discovery). */
export const OPTIMIZE_SEARCH_ALIASES =
  "compress resize optimize smaller shrink recompress downscale";
