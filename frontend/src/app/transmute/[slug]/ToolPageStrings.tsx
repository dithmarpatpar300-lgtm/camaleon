"use client";

import { useI18n } from "@/providers/I18nProvider";
import { getToolStrings, resolveToolFidelityHint } from "@/lib/i18n/tool-copy";
import { getToolBySlug } from "@/lib/tools/tool-registry";
import { Badge } from "@/components/ui/Badge";

type ToolPageStringsProps = {
  toolId: string;
  showDescription?: boolean;
  showHint?: boolean;
};

export function ToolPageStrings({ toolId, showDescription, showHint }: ToolPageStringsProps) {
  const { t } = useI18n();
  const tool = getToolBySlug(toolId);
  if (!tool) return null;

  const copy = getToolStrings(tool, t);
  const hint = resolveToolFidelityHint(toolId, t);

  if (showDescription) {
    return <p className="text-text-secondary">{copy.description}</p>;
  }
  if (showHint && hint) {
    return <p className="mt-2 text-sm text-text-muted">{hint}</p>;
  }

  return (
    <Badge variant={tool.fidelity === "lossless" ? "lossless" : "lossy"}>
      {tool.fidelity === "lossless" ? t("badges.lossless") : t("badges.lossy")}
    </Badge>
  );
}
