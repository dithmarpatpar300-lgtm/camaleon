"use client";

import { useI18n } from "@/providers/I18nProvider";
import { getToolStrings, resolveToolFidelityHint, resolveToolActionTitle } from "@/lib/i18n/tool-copy";
import { getToolBySlug } from "@/lib/tools/tool-registry";
import { Badge } from "@/components/ui/Badge";

type ToolPageStringsProps = {
  toolId: string;
  showDescription?: boolean;
  showHint?: boolean;
  showActionTitle?: boolean;
};

export function ToolPageStrings({ toolId, showDescription, showHint, showActionTitle }: ToolPageStringsProps) {
  const { t } = useI18n();
  const tool = getToolBySlug(toolId);
  if (!tool) return null;

  const copy = getToolStrings(tool, t);
  const hint = resolveToolFidelityHint(toolId, t);
  const actionTitle = resolveToolActionTitle(toolId, t);

  if (showActionTitle) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-text-primary">
          {actionTitle ?? tool.title}
        </h1>
        {actionTitle && (
          <span className="font-mono text-sm text-text-muted shrink-0">
            {tool.fromFormat} → {tool.toFormat}
          </span>
        )}
      </div>
    );
  }

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
