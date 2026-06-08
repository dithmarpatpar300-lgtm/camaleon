import type { ToolDefinition } from "@/lib/tools/types";

/** Tools that flatten alpha onto a background need the Semantic Alpha Engine at prepare. */
export function needsSemanticAlpha(tool: ToolDefinition): boolean {
  return (
    tool.optionSpecs?.some((spec) => spec.kind === "color" && spec.key === "background") ??
    false
  );
}
