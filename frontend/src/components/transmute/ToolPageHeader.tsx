"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { ToolDefinition } from "@/lib/tools/types";
import { getToolStrings, resolveToolActionTitle, resolveToolFidelityHint } from "@/lib/i18n/tool-copy";
import { useI18n } from "@/providers/I18nProvider";

type ToolPageHeaderProps = {
  tool: ToolDefinition;
};

export function ToolPageHeader({ tool }: ToolPageHeaderProps) {
  const { t } = useI18n();
  const copy = getToolStrings(tool, t);
  const actionTitle = resolveToolActionTitle(tool.id, t);
  const hint = resolveToolFidelityHint(tool.id, t);

  return (
    <header className="mb-8">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9.78 4.22a.75.75 0 010 1.06L7.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L5.47 8.53a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 0z"
            clipRule="evenodd"
          />
        </svg>
        {t("nav.transmutations")}
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-bg-elevated px-3 font-mono text-xs font-bold uppercase tracking-tight text-text-muted">
          <span>{tool.fromFormat}</span>
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
          <span>{tool.toFormat}</span>
        </div>
        <Badge variant={tool.fidelity === "lossless" ? "lossless" : "lossy"}>
          {tool.fidelity === "lossless" ? t("badges.lossless") : t("badges.lossy")}
        </Badge>
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
        {actionTitle ?? tool.title}
      </h1>

      <p className="mt-2 max-w-prose text-pretty text-base leading-relaxed text-text-secondary">
        {copy.description}
      </p>

      {hint && (
        <p className="mt-2 max-w-prose text-sm text-text-muted">{hint}</p>
      )}
    </header>
  );
}
