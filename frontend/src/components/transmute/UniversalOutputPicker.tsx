"use client";

import { Badge } from "@/components/ui/Badge";
import type { ToolDefinition } from "@/lib/tools/types";
import { getToolStrings, resolveToolActionTitle } from "@/lib/i18n/tool-copy";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

function FormatChip({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex h-8 w-[4.25rem] shrink-0 items-center justify-center gap-0.5 rounded-md border border-border/80 bg-bg-elevated/80 font-mono text-[9px] font-bold uppercase tracking-tight text-text-muted">
      <span className="truncate">{from}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-2 w-2 shrink-0 opacity-60"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
          clipRule="evenodd"
        />
      </svg>
      <span className="truncate">{to}</span>
    </div>
  );
}

type Props = {
  tools: ToolDefinition[];
  onSelect: (tool: ToolDefinition) => void;
  disabled?: boolean;
};

export function UniversalOutputPicker({ tools, onSelect, disabled }: Props) {
  const { t } = useI18n();

  return (
    <ul className="universal-output-list" role="listbox" aria-label={t("landing.universal.outputAria")}>
      {tools.map((tool) => {
        const copy = getToolStrings(tool, t);
        const actionTitle = resolveToolActionTitle(tool.id, t);

        return (
          <li key={tool.id}>
            <button
              type="button"
              role="option"
              disabled={disabled}
              onClick={() => onSelect(tool)}
              className={cn(
                "universal-output-option group w-full text-left",
                disabled && "pointer-events-none opacity-60"
              )}
            >
              <FormatChip from={tool.fromFormat} to={tool.toFormat} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary group-hover:text-accent">
                  {actionTitle ?? tool.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-text-muted">{copy.description}</p>
              </div>
              <Badge
                variant={tool.fidelity === "lossless" ? "lossless" : "lossy"}
                className="shrink-0 px-2 py-0.5 text-[10px] font-bold"
              >
                {tool.fidelity === "lossless" ? t("badges.lossless") : t("badges.lossy")}
              </Badge>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
