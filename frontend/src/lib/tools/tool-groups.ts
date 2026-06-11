import type { ToolDefinition, ToolGroupKey } from "./types";

export const TOOL_GROUP_ORDER: readonly ToolGroupKey[] = [
  "modern",
  "jpeg-png",
  "webp",
  "gif-bmp",
  "archival",
  "icons",
] as const;

export type ToolGroupSection = {
  key: ToolGroupKey;
  tools: ToolDefinition[];
};

export function toolGroupAnchorId(key: ToolGroupKey): string {
  return `tool-group-${key}`;
}

/** Active tools bucketed by `toolGroup`, preserving registry display order within each group. */
export function groupToolsByKey(tools: ToolDefinition[]): ToolGroupSection[] {
  const buckets = new Map<ToolGroupKey, ToolDefinition[]>();
  for (const key of TOOL_GROUP_ORDER) {
    buckets.set(key, []);
  }

  for (const tool of tools) {
    const key = tool.toolGroup;
    if (!key) continue;
    buckets.get(key)?.push(tool);
  }

  return TOOL_GROUP_ORDER.map((key) => ({
    key,
    tools: buckets.get(key) ?? [],
  })).filter((section) => section.tools.length > 0);
}
