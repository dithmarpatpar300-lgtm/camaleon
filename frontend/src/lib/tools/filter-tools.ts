import { getToolStrings, resolveToolActionTitle } from "@/lib/i18n/tool-copy";
import type { TranslateFn } from "@/lib/i18n/types";
import type { ToolDefinition } from "./types";

function toolSearchText(tool: ToolDefinition, t: TranslateFn): string {
  const copy = getToolStrings(tool, t);
  const actionTitle = resolveToolActionTitle(tool.id, t);
  return [
    tool.title,
    tool.slug,
    tool.id,
    tool.fromFormat,
    tool.toFormat,
    actionTitle,
    copy.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Filter tools by query (title, slug, formats, i18n copy). Empty query returns all. */
export function filterTools(
  tools: ToolDefinition[],
  query: string,
  t: TranslateFn
): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;
  return tools.filter((tool) => toolSearchText(tool, t).includes(q));
}
